/**
 * Demo Session Manager
 * 
 * Service for managing demo sessions with isolated state.
 * Handles session creation, persona switching, event tracking, and state computation.
 */

import { v4 as uuidv4 } from 'uuid';
import { getDemoStateStore } from './demo-state-store.js';
import {
  DemoSession,
  DemoSessionOptions,
  DemoSessionState,
  DemoPersonaType,
  DemoEvent,
  DemoEventType,
  DemoPersonaNotFoundError,
  DemoSnapshot
} from './types.js';

export class DemoSessionManager {
  private store = getDemoStateStore();
  private readonly defaultTTL = 4 * 60 * 60 * 1000; // 4 hours

  /**
   * Create a new demo session
   */
  async createSession(
    userId: string,
    snapshot: DemoSnapshot,
    options: DemoSessionOptions = {}
  ): Promise<DemoSession> {
    const sessionId = uuidv4();
    const now = new Date();
    const ttl = options.ttl ?? this.defaultTTL;

    // Select initial persona
    const initialPersonaType = options.initialPersonaType ?? 'CAREGIVER';
    const initialPersona = snapshot.personas.find(p => p.type === initialPersonaType);
    
    if (initialPersona === undefined) {
      throw new Error(`No persona found for type: ${initialPersonaType}`);
    }

    const session: DemoSession = {
      id: sessionId,
      userId,
      organizationId: snapshot.organizationId,
      branchId: snapshot.branchId,
      currentPersona: initialPersona,
      availablePersonas: snapshot.personas,
      state: {
        events: [],
        modifications: {
          visits: {},
          tasks: {},
          notes: {},
          photos: {},
          exceptions: {}
        },
        currentTime: snapshot.baseTime,
        baseTime: snapshot.baseTime
      },
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      isActive: true
    };

    this.store.set(sessionId, session);

    return session;
  }

  /**
   * Get an existing demo session
   */
  getSession(sessionId: string): DemoSession {
    return this.store.get(sessionId);
  }

  /**
   * Switch to a different persona within the session
   */
  switchPersona(sessionId: string, personaType: DemoPersonaType): DemoSession {
    const session = this.store.get(sessionId);
    
    const newPersona = session.availablePersonas.find(p => p.type === personaType);
    if (newPersona === undefined) {
      throw new DemoPersonaNotFoundError(personaType);
    }

    session.currentPersona = newPersona;
    session.lastAccessedAt = new Date();
    
    this.store.set(sessionId, session);
    
    return session;
  }

  /**
   * Add an event to the session
   */
  addEvent(
    sessionId: string,
    type: DemoEventType,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): DemoSession {
    const session = this.store.get(sessionId);

    const event: DemoEvent = {
      id: uuidv4(),
      sessionId,
      type,
      timestamp: session.state.currentTime,
      personaId: session.currentPersona.id,
      data,
      metadata
    };

    session.state.events.push(event);
    
    // Apply event to computed state
    this.applyEvent(session.state, event);
    
    session.lastAccessedAt = new Date();
    this.store.set(sessionId, session);
    
    return session;
  }

  /**
   * Apply an event to the session state
   */
  private applyEvent(state: DemoSessionState, event: DemoEvent): void {
    switch (event.type) {
      case 'VISIT_CLOCK_IN': {
        const visitId = event.data.visitId as string;
        state.modifications.visits[visitId] = {
          ...state.modifications.visits[visitId],
          actualStartTime: event.timestamp,
          status: 'IN_PROGRESS',
          location: event.data.location as { latitude: number; longitude: number; accuracy: number }
        };
        break;
      }

      case 'VISIT_CLOCK_OUT': {
        const visitId = event.data.visitId as string;
        state.modifications.visits[visitId] = {
          ...state.modifications.visits[visitId],
          actualEndTime: event.timestamp,
          status: 'COMPLETED'
        };
        break;
      }

      case 'TASK_COMPLETE': {
        const taskId = event.data.taskId as string;
        state.modifications.tasks[taskId] = {
          status: 'COMPLETED',
          completedAt: event.timestamp,
          completedBy: event.personaId
        };
        break;
      }

      case 'TASK_INCOMPLETE': {
        const taskId = event.data.taskId as string;
        state.modifications.tasks[taskId] = {
          status: 'SKIPPED'
        };
        break;
      }

      case 'NOTE_ADDED': {
        const noteId = uuidv4();
        state.modifications.notes[noteId] = {
          id: noteId,
          visitId: event.data.visitId as string,
          content: event.data.content as string,
          createdAt: event.timestamp,
          createdBy: event.personaId
        };
        break;
      }

      case 'PHOTO_UPLOADED': {
        const photoId = uuidv4();
        state.modifications.photos[photoId] = {
          id: photoId,
          visitId: event.data.visitId as string,
          url: event.data.url as string,
          caption: event.data.caption as string | undefined,
          uploadedAt: event.timestamp,
          uploadedBy: event.personaId
        };
        break;
      }

      case 'VISIT_ASSIGNED': {
        const visitId = event.data.visitId as string;
        state.modifications.visits[visitId] = {
          ...state.modifications.visits[visitId],
          caregiverId: event.data.caregiverId as string,
          status: 'ASSIGNED'
        };
        break;
      }

      case 'VISIT_REASSIGNED': {
        const visitId = event.data.visitId as string;
        state.modifications.visits[visitId] = {
          ...state.modifications.visits[visitId],
          caregiverId: event.data.newCaregiverId as string
        };
        break;
      }

      case 'EXCEPTION_RESOLVED': {
        const exceptionId = event.data.exceptionId as string;
        state.modifications.exceptions[exceptionId] = {
          ...state.modifications.exceptions[exceptionId],
          status: 'RESOLVED',
          resolvedAt: event.timestamp,
          resolvedBy: event.personaId,
          resolution: event.data.resolution as string
        };
        break;
      }

      case 'TIME_ADVANCED': {
        const daysToAdvance = event.data.days as number;
        const newTime = new Date(state.currentTime);
        newTime.setDate(newTime.getDate() + daysToAdvance);
        state.currentTime = newTime;
        break;
      }
    }
  }

  /**
   * Reset session to base state (clear all modifications)
   */
  resetSession(sessionId: string): DemoSession {
    const session = this.store.get(sessionId);
    
    session.state.events = [];
    session.state.modifications = {
      visits: {},
      tasks: {},
      notes: {},
      photos: {},
      exceptions: {}
    };
    session.state.currentTime = session.state.baseTime;
    session.lastAccessedAt = new Date();
    
    this.store.set(sessionId, session);
    
    return session;
  }

  /**
   * Advance simulated time in the session
   */
  advanceTime(sessionId: string, days: number): DemoSession {
    return this.addEvent(sessionId, 'TIME_ADVANCED', { days });
  }

  /**
   * End a demo session
   */
  endSession(sessionId: string): void {
    const session = this.store.get(sessionId);
    session.isActive = false;
    this.store.set(sessionId, session);
  }

  /**
   * Delete a demo session
   */
  deleteSession(sessionId: string): void {
    this.store.delete(sessionId);
  }

  /**
   * Get all active sessions (for monitoring)
   */
  getAllActiveSessions(): DemoSession[] {
    return this.store.getAllSessions().filter(s => s.isActive);
  }

  /**
   * Get session statistics
   */
  getStats(): ReturnType<typeof this.store.getStats> & { activeSessions: number } {
    return {
      ...this.store.getStats(),
      activeSessions: this.getAllActiveSessions().length
    };
  }
}

// Singleton instance
let managerInstance: DemoSessionManager | null = null;

/**
 * Get the singleton demo session manager instance
 */
export function getDemoSessionManager(): DemoSessionManager {
  managerInstance ??= new DemoSessionManager();
  return managerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetDemoSessionManager(): void {
  managerInstance = null;
}
