/**
 * Demo Session Hook
 * 
 * React hook for managing demo sessions with state and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { demoAPI } from './demo-api.js';
import type { DemoSession, DemoPersonaType, DemoSessionCreateRequest } from './types.js';

interface UseDemoSessionResult {
  session: DemoSession | null;
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  
  // Actions
  createSession: (request?: DemoSessionCreateRequest) => Promise<void>;
  switchPersona: (personaType: DemoPersonaType) => Promise<void>;
  resetSession: () => Promise<void>;
  endSession: () => Promise<void>;
  
  // Caregiver actions
  clockIn: (visitId: string, latitude: number, longitude: number, accuracy: number) => Promise<void>;
  clockOut: (visitId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  addNote: (visitId: string, content: string) => Promise<void>;
  
  // Coordinator actions
  assignVisit: (visitId: string, caregiverId: string) => Promise<void>;
  resolveException: (exceptionId: string, resolution: string) => Promise<void>;
}

export function useDemoSession(): UseDemoSessionResult {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedSessionId = window.localStorage.getItem('demoSessionId');
    if (savedSessionId) {
      setIsLoading(true);
      void demoAPI.getSession(savedSessionId)
        .then(setSession)
        .catch((err: Error) => {
          console.error('Failed to restore demo session:', err);
          window.localStorage.removeItem('demoSessionId');
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  // Save session ID to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (session) {
      window.localStorage.setItem('demoSessionId', session.id);
    } else {
      window.localStorage.removeItem('demoSessionId');
    }
  }, [session]);

  // Automatic cleanup on logout - detect when auth storage is cleared
  useEffect(() => {
    if (typeof window === 'undefined' || !session) return;

    const handleStorageChange = (e: StorageEvent) => {
      // Check if auth storage was cleared (logout event)
      if (e.key === 'auth-storage' && e.newValue === null) {
        // Auth was cleared (user logged out), cleanup demo session
        void demoAPI.deleteSession(session.id)
          .then(() => {
            setSession(null);
            return undefined;
          })
          .catch((err: Error) => {
            console.error('Failed to cleanup demo session on logout:', err);
            // Still clear local session state even if API call fails
            setSession(null);
            return undefined;
          });
      }
    };

    // Also check for visibility changes to detect potential session issues
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        // Verify session is still valid when user returns to tab
        void demoAPI.getSession(session.id)
          .catch((err: Error) => {
            console.error('Demo session no longer valid:', err);
            setSession(null);
          });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  // Inactivity timeout - reset session after 15 minutes of inactivity
  useEffect(() => {
    if (typeof window === 'undefined' || !session) return;

    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      inactivityTimer = setTimeout(() => {
        // Reset session to base state after 15 minutes of inactivity
        void demoAPI.resetSession(session.id)
          .then(() => demoAPI.getSession(session.id))
          .then(setSession)
          .catch((err: Error) => {
            console.error('Failed to reset demo session on inactivity:', err);
          });
      }, 15 * 60 * 1000); // 15 minutes
    };

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [session]);

  const createSession = useCallback(async (request: DemoSessionCreateRequest = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await demoAPI.createSession(request);
      const fullSession = await demoAPI.getSession(response.sessionId);
      setSession(fullSession);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchPersona = useCallback(async (personaType: DemoPersonaType) => {
    if (!session) {
      throw new Error('No active session');
    }
    setIsLoading(true);
    setError(null);
    try {
      const updatedSession = await demoAPI.switchPersona(session.id, personaType);
      setSession(updatedSession);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch persona';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const resetSession = useCallback(async () => {
    if (!session) {
      throw new Error('No active session');
    }
    setIsLoading(true);
    setError(null);
    try {
      await demoAPI.resetSession(session.id);
      const updatedSession = await demoAPI.getSession(session.id);
      setSession(updatedSession);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const endSession = useCallback(async () => {
    if (!session) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await demoAPI.deleteSession(session.id);
      setSession(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to end session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Caregiver actions
  const clockIn = useCallback(async (visitId: string, latitude: number, longitude: number, accuracy: number) => {
    if (!session) {
      throw new Error('No active session');
    }
    await demoAPI.clockIn(session.id, visitId, { location: { latitude, longitude, accuracy } });
  }, [session]);

  const clockOut = useCallback(async (visitId: string) => {
    if (!session) {
      throw new Error('No active session');
    }
    await demoAPI.clockOut(session.id, visitId);
  }, [session]);

  const completeTask = useCallback(async (taskId: string) => {
    if (!session) {
      throw new Error('No active session');
    }
    await demoAPI.completeTask(session.id, taskId);
  }, [session]);

  const addNote = useCallback(async (visitId: string, content: string) => {
    if (!session) {
      throw new Error('No active session');
    }
    await demoAPI.addNote(session.id, visitId, { content });
  }, [session]);

  // Coordinator actions
  const assignVisit = useCallback(async (visitId: string, caregiverId: string) => {
    if (!session) {
      throw new Error('No active session');
    }
    await demoAPI.assignVisit(session.id, visitId, { caregiverId });
  }, [session]);

  const resolveException = useCallback(async (exceptionId: string, resolution: string) => {
    if (!session) {
      throw new Error('No active session');
    }
    await demoAPI.resolveException(session.id, exceptionId, { resolution });
  }, [session]);

  return {
    session,
    isLoading,
    error,
    isActive: session !== null,
    
    createSession,
    switchPersona,
    resetSession,
    endSession,
    
    clockIn,
    clockOut,
    completeTask,
    addNote,
    
    assignVisit,
    resolveException,
  };
}
