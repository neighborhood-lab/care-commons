/**
 * Demo Session Type Definitions
 * 
 * Defines the structure for stateful demo sessions with isolated state.
 * Each session represents a single user's demo experience with modifications
 * tracked as events that can be replayed or reset.
 */

export type DemoPersonaType =
  | 'CAREGIVER'
  | 'COORDINATOR_FIELD'
  | 'COORDINATOR_SCHEDULING'
  | 'COORDINATOR_CARE'
  | 'ADMINISTRATOR'
  | 'FAMILY_MEMBER';

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

export type DemoEventType =
  | 'VISIT_CLOCK_IN'
  | 'VISIT_CLOCK_OUT'
  | 'TASK_COMPLETE'
  | 'TASK_INCOMPLETE'
  | 'NOTE_ADDED'
  | 'PHOTO_UPLOADED'
  | 'VISIT_ASSIGNED'
  | 'VISIT_REASSIGNED'
  | 'EXCEPTION_RESOLVED'
  | 'AUTHORIZATION_CREATED'
  | 'TIME_ADVANCED';

export interface DemoEvent {
  id: string;
  sessionId: string;
  type: DemoEventType;
  timestamp: Date;
  personaId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface DemoSessionState {
  // Modifications tracked as events
  events: DemoEvent[];
  
  // Computed state (derived from events)
  modifications: {
    visits: Record<string, Partial<Visit>>;
    tasks: Record<string, Partial<Task>>;
    notes: Record<string, Note>;
    photos: Record<string, Photo>;
    exceptions: Record<string, Partial<Exception>>;
  };
  
  // Current simulated time (for time travel)
  currentTime: Date;
  baseTime: Date;
}

export interface DemoSession {
  id: string;
  userId: string;
  organizationId: string;
  organizationName: string;
  branchId: string;
  branchName: string;

  // Current persona
  currentPersona: DemoPersona;
  availablePersonas: DemoPersona[];

  // Session state
  state: DemoSessionState;

  // Session lifecycle
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface DemoSessionOptions {
  ttl?: number; // Time to live in milliseconds (default: 4 hours)
  initialPersonaType?: DemoPersonaType;
  enableTimeTravelrate?: boolean;
}

// Domain types referenced in demo state
export interface Visit {
  id: string;
  clientId: string;
  caregiverId: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface Task {
  id: string;
  visitId: string;
  name: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completedAt?: Date;
  completedBy?: string;
}

export interface Note {
  id: string;
  visitId: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export interface Photo {
  id: string;
  visitId: string;
  url: string;
  caption?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Exception {
  id: string;
  visitId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

// Demo snapshot for base state
export interface DemoSnapshot {
  organizationId: string;
  organizationName: string;
  branchId: string;
  branchName: string;
  baseTime: Date;

  // Reference data (IDs of seeded data)
  caregiverIds: string[];
  clientIds: string[];
  coordinatorIds: string[];
  visitIds: string[];

  // Personas available in this demo
  personas: DemoPersona[];
}

// Error types
export class DemoSessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DemoSessionError';
  }
}

export class DemoSessionNotFoundError extends DemoSessionError {
  constructor(sessionId: string) {
    super(`Demo session not found: ${sessionId}`, 'DEMO_SESSION_NOT_FOUND', 404);
  }
}

export class DemoSessionExpiredError extends DemoSessionError {
  constructor(sessionId: string) {
    super(`Demo session expired: ${sessionId}`, 'DEMO_SESSION_EXPIRED', 410);
  }
}

export class DemoPersonaNotFoundError extends DemoSessionError {
  constructor(personaId: string) {
    super(`Demo persona not found: ${personaId}`, 'DEMO_PERSONA_NOT_FOUND', 404);
  }
}
