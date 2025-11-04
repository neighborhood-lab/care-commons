/**
 * Admin Dashboard Types
 * 
 * Types for administrative operations, state configuration, and compliance reporting.
 */

export type StateCode = 'TX' | 'FL' | 'OH' | 'PA' | 'GA' | 'NC' | 'AZ';

export interface StateConfig {
  state: StateCode;
  enabled: boolean;
  geofenceTolerance: number;
  gracePeriodMinutes: number;
  aggregator: string;
  requiredDocuments: string[];
  gpsAccuracyThreshold: number;
}

export interface ActiveVisit {
  id: string;
  caregiverName: string;
  clientName: string;
  clockInTime: Date;
  gpsStatus: 'good' | 'weak' | 'none';
  geofenceStatus: 'within' | 'outside';
  state: StateCode;
}

export interface EVVException {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  visitId: string;
  caregiverName: string;
  detectedAt: Date;
  requiresAction: boolean;
}

export interface VMURRequest {
  id: string;
  visitId: string;
  caregiverName: string;
  requestedBy: string;
  requestReason: string;
  requestedAt: Date;
  deadline: Date;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'success' | 'failure';
}

export interface HIPAAAccessLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  phiAccessed: string;
  clientId: string;
  clientName: string;
  purpose: string;
}

export interface ComplianceReport {
  id: string;
  name: string;
  category: 'evv' | 'hipaa' | 'state' | 'billing';
  description: string;
  lastGenerated: Date;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface DatabaseTable {
  name: string;
  displayName: string;
  rowCount: number;
  category: 'core' | 'evv' | 'billing' | 'scheduling';
  description: string;
}
