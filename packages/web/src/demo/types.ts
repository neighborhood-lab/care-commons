/**
 * Demo Mode Types
 * 
 * Type definitions for the interactive demo system frontend
 */

export type DemoPersonaType = 
  | 'CAREGIVER' 
  | 'COORDINATOR_FIELD' 
  | 'COORDINATOR_SCHEDULING' 
  | 'COORDINATOR_CARE' 
  | 'ADMIN';

export interface DemoPersona {
  id: string;
  type: DemoPersonaType;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  branchId: string;
  permissions: string[];
}

export interface DemoSession {
  id: string;
  userId: string;
  currentPersona: DemoPersona;
  availablePersonas: DemoPersona[];
  expiresAt: string;
  state: {
    currentTime: string;
    eventCount: number;
  };
}

export interface DemoSessionCreateRequest {
  userId?: string;
  personaType?: DemoPersonaType;
}

export interface DemoSessionCreateResponse {
  sessionId: string;
  currentPersona: DemoPersona;
  availablePersonas: Array<{
    id: string;
    type: DemoPersonaType;
    name: string;
    role: string;
  }>;
  expiresAt: string;
}

export interface DemoAPIResponse<T = unknown> {
  success: boolean;
  data: T;
}

export interface DemoClockInRequest {
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface DemoVisitResponse {
  visitId: string;
  status: string;
  actualStartTime?: string;
  actualEndTime?: string;
}

export interface DemoTaskResponse {
  taskId: string;
  status: string;
  completedAt?: string;
}

export interface DemoNoteRequest {
  content: string;
}

export interface DemoNoteResponse {
  visitId: string;
  note: {
    content: string;
    createdAt: string;
  };
}

export interface DemoAssignVisitRequest {
  caregiverId: string;
}

export interface DemoAssignVisitResponse {
  visitId: string;
  caregiverId: string;
  status: string;
}

export interface DemoResolveExceptionRequest {
  resolution: string;
}

export interface DemoResolveExceptionResponse {
  exceptionId: string;
  status: string;
  resolvedAt: string;
}

export interface DemoStatsResponse {
  activeSessions: number;
  totalEvents: number;
  avgEventsPerSession: number;
  oldestSessionAge: string;
}
