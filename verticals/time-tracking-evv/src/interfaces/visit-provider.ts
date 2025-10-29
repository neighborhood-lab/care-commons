/**
 * Visit Provider Interface
 * 
 * Defines the contract for fetching visit data from the scheduling vertical.
 * This allows the EVV vertical to remain decoupled from scheduling implementation.
 */

import { UUID } from '@care-commons/core';

/**
 * Visit data needed for EVV operations
 */
export interface EVVVisitData {
  // Visit identification
  visitId: UUID;
  organizationId: UUID;
  branchId: UUID;
  clientId: UUID;
  caregiverId?: UUID; // May be null if unassigned
  
  // Client information
  clientName: string;
  clientMedicaidId?: string;
  
  // Service details
  serviceTypeId: UUID;
  serviceTypeCode: string;
  serviceTypeName: string;
  serviceDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  scheduledDuration: number; // minutes
  
  // Location
  serviceAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    geofenceRadius?: number; // Custom radius if set, otherwise use state default
    addressVerified: boolean;
  };
  
  // Authorization (for compliance validation)
  authorizationId?: UUID;
  authorizedUnits?: number;
  authorizedStartDate?: Date;
  authorizedEndDate?: Date;
  fundingSource?: string;
  
  // Requirements
  requiredSkills?: string[];
  requiredCertifications?: string[];
  
  // Care plan linkage
  carePlanId?: UUID;
  taskIds?: UUID[];
}

/**
 * Visit Provider Interface
 * 
 * Implementations fetch visit data from the scheduling vertical.
 */
export interface IVisitProvider {
  /**
   * Get visit data by ID
   * 
   * @throws NotFoundError if visit doesn't exist
   * @throws PermissionError if user doesn't have access
   */
  getVisitForEVV(visitId: UUID): Promise<EVVVisitData>;
  
  /**
   * Validate that a visit exists and is in a valid state for clock-in
   * 
   * @returns true if visit can be clocked into
   * @throws ValidationError with reason if visit cannot be clocked into
   */
  canClockIn(visitId: UUID, caregiverId: UUID): Promise<boolean>;
  
  /**
   * Validate that a visit is in progress and can be clocked out
   * 
   * @returns true if visit can be clocked out
   * @throws ValidationError with reason if visit cannot be clocked out
   */
  canClockOut(visitId: UUID, caregiverId: UUID): Promise<boolean>;
  
  /**
   * Update visit status based on EVV events
   * Used to sync visit status when EVV clock events occur
   */
  updateVisitStatus(
    visitId: UUID,
    status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE',
    evvRecordId: UUID
  ): Promise<void>;
}

/**
 * Client Provider Interface
 * 
 * Provides client demographic data for EVV compliance.
 */
export interface IClientProvider {
  /**
   * Get client information for EVV
   */
  getClientForEVV(clientId: UUID): Promise<{
    id: UUID;
    name: string;
    medicaidId?: string;
    dateOfBirth: Date;
    
    // State-specific
    stateCode: string;
    stateMedicaidProgram?: string;
    
    // Contact
    primaryPhone?: string;
    email?: string;
  }>;
}

/**
 * Caregiver Provider Interface
 * 
 * Provides caregiver data for EVV compliance.
 */
export interface ICaregiverProvider {
  /**
   * Get caregiver information for EVV
   */
  getCaregiverForEVV(caregiverId: UUID): Promise<{
    id: UUID;
    name: string;
    employeeId: string;
    nationalProviderId?: string; // NPI
    
    // Credentials
    activeCredentials: string[];
    activeCertifications: string[];
    
    // Background screening status
    backgroundScreeningStatus: 'CLEARED' | 'PENDING' | 'EXPIRED' | 'FAILED';
    backgroundScreeningExpires?: Date;
    
    // State-specific
    stateRegistryStatus?: Record<string, 'CLEARED' | 'FLAGGED' | 'UNKNOWN'>;
  }>;
  
  /**
   * Validate caregiver is authorized to provide service
   */
  canProvideService(
    caregiverId: UUID,
    serviceTypeCode: string,
    clientId: UUID
  ): Promise<{
    authorized: boolean;
    reason?: string;
    missingCredentials?: string[];
    blockedReasons?: string[];
  }>;
}
