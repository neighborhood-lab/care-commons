/**
 * Demo API Client
 * 
 * Client-side API service for interacting with demo endpoints
 */

import type {
  DemoSessionCreateRequest,
  DemoSessionCreateResponse,
  DemoSession,
  DemoPersonaType,
  DemoAPIResponse,
  DemoClockInRequest,
  DemoVisitResponse,
  DemoTaskResponse,
  DemoNoteRequest,
  DemoNoteResponse,
  DemoAssignVisitRequest,
  DemoAssignVisitResponse,
  DemoResolveExceptionRequest,
  DemoResolveExceptionResponse,
  DemoStatsResponse,
  DemoInputChoices,
} from './types.js';

const API_BASE = '/api/demo';

class DemoAPIClient {
  /**
   * Create a new demo session
   */
  async createSession(request: DemoSessionCreateRequest = {}): Promise<DemoSessionCreateResponse> {
    const response = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create demo session: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoSessionCreateResponse>;
    return result.data;
  }

  /**
   * Get current session state
   */
  async getSession(sessionId: string): Promise<DemoSession> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to get demo session: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoSession>;
    return result.data;
  }

  /**
   * Switch to a different persona
   */
  async switchPersona(sessionId: string, personaType: DemoPersonaType): Promise<DemoSession> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/persona`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaType }),
    });

    if (!response.ok) {
      throw new Error(`Failed to switch persona: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<{ currentPersona: DemoSession['currentPersona'] }>;
    return { ...await this.getSession(sessionId), currentPersona: result.data.currentPersona };
  }

  /**
   * Reset session to base state
   */
  async resetSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/reset`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to reset session: ${response.statusText}`);
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.statusText}`);
    }
  }

  /**
   * Clock in to a visit
   */
  async clockIn(sessionId: string, visitId: string, request: DemoClockInRequest): Promise<DemoVisitResponse> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/visits/${visitId}/clock-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to clock in: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoVisitResponse>;
    return result.data;
  }

  /**
   * Clock out from a visit
   */
  async clockOut(sessionId: string, visitId: string): Promise<DemoVisitResponse> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/visits/${visitId}/clock-out`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to clock out: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoVisitResponse>;
    return result.data;
  }

  /**
   * Complete a task
   */
  async completeTask(sessionId: string, taskId: string): Promise<DemoTaskResponse> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/tasks/${taskId}/complete`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to complete task: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoTaskResponse>;
    return result.data;
  }

  /**
   * Add a visit note
   */
  async addNote(sessionId: string, visitId: string, request: DemoNoteRequest): Promise<DemoNoteResponse> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/visits/${visitId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to add note: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoNoteResponse>;
    return result.data;
  }

  /**
   * Assign a visit to a caregiver
   */
  async assignVisit(sessionId: string, visitId: string, request: DemoAssignVisitRequest): Promise<DemoAssignVisitResponse> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/visits/${visitId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to assign visit: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoAssignVisitResponse>;
    return result.data;
  }

  /**
   * Resolve an exception
   */
  async resolveException(sessionId: string, exceptionId: string, request: DemoResolveExceptionRequest): Promise<DemoResolveExceptionResponse> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}/exceptions/${exceptionId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to resolve exception: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoResolveExceptionResponse>;
    return result.data;
  }

  /**
   * Get available input choices for demo interactions
   */
  async getInputChoices(): Promise<DemoInputChoices> {
    const response = await fetch(`${API_BASE}/choices`);

    if (!response.ok) {
      throw new Error(`Failed to get input choices: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoInputChoices>;
    return result.data;
  }

  /**
   * Get demo statistics
   */
  async getStats(): Promise<DemoStatsResponse> {
    const response = await fetch(`${API_BASE}/stats`);

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`);
    }

    const result = await response.json() as DemoAPIResponse<DemoStatsResponse>;
    return result.data;
  }
}

export const demoAPI = new DemoAPIClient();
