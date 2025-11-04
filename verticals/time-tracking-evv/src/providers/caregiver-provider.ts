/**
 * Caregiver Provider Implementation
 * 
 * Provides caregiver data for EVV compliance operations.
 * Implements the ICaregiverProvider interface to decouple EVV from caregiver-staff vertical.
 */

import { UUID, NotFoundError, Database } from '@care-commons/core';
import type { ICaregiverProvider } from '../interfaces/visit-provider.js';

/**
 * Caregiver Provider for EVV Integration
 * 
 * Fetches caregiver data needed for EVV record creation and validates
 * service authorization based on credentials, certifications, and compliance status.
 */
export class CaregiverProvider implements ICaregiverProvider {
  constructor(private database: Database) {}

  /**
   * Get caregiver information for EVV operations
   * 
   * Retrieves essential caregiver data including:
   * - Name and employee ID (for EVV record identification)
   * - NPI number (for state aggregator submission)
   * - Active credentials and certifications (for service authorization)
   * - Background screening status (for compliance validation)
   * - State registry status (for state-specific requirements)
   * 
   * @throws NotFoundError if caregiver doesn't exist
   */
  async getCaregiverForEVV(caregiverId: UUID): Promise<{
    id: UUID;
    name: string;
    employeeId: string;
    nationalProviderId?: string;
    activeCredentials: string[];
    activeCertifications: string[];
    backgroundScreeningStatus: 'CLEARED' | 'PENDING' | 'EXPIRED' | 'FAILED';
    backgroundScreeningExpires?: Date;
    stateRegistryStatus?: Record<string, 'CLEARED' | 'FLAGGED' | 'UNKNOWN'>;
  }> {
    const query = `
      SELECT 
        id,
        first_name,
        middle_name,
        last_name,
        employee_number,
        credentials,
        background_check,
        custom_fields,
        compliance_status
      FROM caregivers
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [caregiverId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Caregiver not found', { caregiverId });
    }

    const row = result.rows[0] as Record<string, unknown>;
    
    // Parse credentials
    const credentialsRaw = row['credentials'];
    const credentials = typeof credentialsRaw === 'string'
      ? JSON.parse(credentialsRaw)
      : (credentialsRaw ?? []);
    
    // Parse background check
    const backgroundCheckRaw = row['background_check'];
    const backgroundCheck = typeof backgroundCheckRaw === 'string'
      ? JSON.parse(backgroundCheckRaw)
      : backgroundCheckRaw;
    
    // Parse custom fields (contains state-specific data)
    const customFieldsRaw = row['custom_fields'];
    const customFields = typeof customFieldsRaw === 'string'
      ? JSON.parse(customFieldsRaw)
      : customFieldsRaw;
    
    // Build full name
    const middleName = row['middle_name'] ? ` ${row['middle_name']}` : '';
    const fullName = `${row['first_name']}${middleName} ${row['last_name']}`;
    
    // Extract active credentials (non-expired, ACTIVE status)
    const now = new Date();
    const activeCredentials: string[] = [];
    const activeCertifications: string[] = [];
    
    if (Array.isArray(credentials)) {
      for (const cred of credentials) {
        const status = cred.status;
        const expirationDate = cred.expirationDate ? new Date(cred.expirationDate) : null;
        const isExpired = expirationDate && expirationDate < now;
        
        if (status === 'ACTIVE' && !isExpired) {
          const credType = cred.type ?? 'UNKNOWN';
          const credName = cred.name ?? credType;
          
          // Categorize as credential or certification
          if (credType.includes('LICENSE') || credType.includes('CERTIFICATION')) {
            activeCertifications.push(credName);
          } else {
            activeCredentials.push(credName);
          }
        }
      }
    }
    
    // Extract NPI from credentials or custom fields
    let nationalProviderId: string | undefined;
    if (Array.isArray(credentials)) {
      const npiCred = credentials.find((c: any) => c.type === 'NPI' || c.credentialType === 'NPI');
      nationalProviderId = npiCred?.number ?? npiCred?.value;
    }
    if (!nationalProviderId && customFields) {
      nationalProviderId = (customFields as any)?.npi ?? (customFields as any)?.nationalProviderId;
    }
    
    // Extract background screening status
    let backgroundScreeningStatus: 'CLEARED' | 'PENDING' | 'EXPIRED' | 'FAILED' = 'PENDING';
    let backgroundScreeningExpires: Date | undefined;
    
    if (backgroundCheck) {
      const status = (backgroundCheck as any)?.status;
      const expirationDate = (backgroundCheck as any)?.expirationDate;
      
      if (status === 'CLEARED' || status === 'PASSED') {
        if (expirationDate) {
          const expiresDate = new Date(expirationDate);
          backgroundScreeningExpires = expiresDate;
          backgroundScreeningStatus = expiresDate < now ? 'EXPIRED' : 'CLEARED';
        } else {
          backgroundScreeningStatus = 'CLEARED';
        }
      } else if (status === 'FAILED' || status === 'FLAGGED') {
        backgroundScreeningStatus = 'FAILED';
      }
      // PENDING is the default, no need to reassign
    }
    
    // Extract state registry status from custom fields
    const stateRegistryStatus: Record<string, 'CLEARED' | 'FLAGGED' | 'UNKNOWN'> = {};
    if (customFields && (customFields as any).stateRegistries) {
      const registries = (customFields as any).stateRegistries;
      for (const state in registries) {
        const registryStatus = registries[state]?.status;
        if (registryStatus === 'CLEARED' || registryStatus === 'CLEAR') {
          stateRegistryStatus[state] = 'CLEARED';
        } else if (registryStatus === 'FLAGGED' || registryStatus === 'FAILED') {
          stateRegistryStatus[state] = 'FLAGGED';
        } else {
          stateRegistryStatus[state] = 'UNKNOWN';
        }
      }
    }

    return {
      id: row['id'] as UUID,
      name: fullName,
      employeeId: row['employee_number'] as string,
      nationalProviderId,
      activeCredentials,
      activeCertifications,
      backgroundScreeningStatus,
      backgroundScreeningExpires,
      stateRegistryStatus: Object.keys(stateRegistryStatus).length > 0 ? stateRegistryStatus : undefined,
    };
  }

  /**
   * Validate caregiver is authorized to provide service
   * 
   * Checks:
   * - Background screening is cleared and not expired
   * - Has required credentials/certifications for service type
   * - State registry status is cleared (if applicable)
   * - Not blocked from providing service to this client
   * 
   * @returns Authorization result with reason if not authorized
   */
  async canProvideService(
    caregiverId: UUID,
    serviceTypeCode: string,
    clientId: UUID
  ): Promise<{
    authorized: boolean;
    reason?: string;
    missingCredentials?: string[];
    blockedReasons?: string[];
  }> {
    // Get caregiver data
    const caregiver = await this.getCaregiverForEVV(caregiverId);
    
    const blockedReasons: string[] = [];
    const missingCredentials: string[] = [];
    
    // Check background screening
    if (caregiver.backgroundScreeningStatus === 'FAILED') {
      blockedReasons.push('Background screening failed');
    } else if (caregiver.backgroundScreeningStatus === 'EXPIRED') {
      blockedReasons.push('Background screening expired');
    } else if (caregiver.backgroundScreeningStatus === 'PENDING') {
      blockedReasons.push('Background screening pending');
    }
    
    // Check client-specific restrictions
    const restrictionQuery = `
      SELECT 1 FROM caregivers
      WHERE id = $1 
        AND $2 = ANY(restricted_clients)
        AND deleted_at IS NULL
    `;
    
    const restrictionResult = await this.database.query(restrictionQuery, [caregiverId, clientId]);
    if (restrictionResult.rows.length > 0) {
      blockedReasons.push('Caregiver is restricted from this client');
    }
    
    // Check service-type specific requirements
    // NOTE: This is a simplified implementation. A full implementation would:
    // 1. Query service_types table for required credentials
    // 2. Match against caregiver's active credentials
    // 3. Apply state-specific requirements
    
    const requiredCredentials = this.getRequiredCredentials(serviceTypeCode);
    for (const required of requiredCredentials) {
      const hasCredential = caregiver.activeCredentials.includes(required) 
        || caregiver.activeCertifications.includes(required);
      
      if (!hasCredential) {
        missingCredentials.push(required);
      }
    }
    
    // Determine authorization
    const authorized = blockedReasons.length === 0 && missingCredentials.length === 0;
    
    if (!authorized) {
      const reasons: string[] = [];
      if (blockedReasons.length > 0) {
        reasons.push(...blockedReasons);
      }
      if (missingCredentials.length > 0) {
        reasons.push(`Missing credentials: ${missingCredentials.join(', ')}`);
      }
      
      return {
        authorized: false,
        reason: reasons.join('; '),
        missingCredentials: missingCredentials.length > 0 ? missingCredentials : undefined,
        blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined,
      };
    }
    
    return { authorized: true };
  }

  /**
   * Private helper: Get required credentials for service type
   * 
   * Maps service type codes to required credentials.
   * NOTE: This is a simplified implementation. A full implementation would
   * query a service_types table with credential requirements.
   */
  private getRequiredCredentials(serviceTypeCode: string): string[] {
    // Common service type credential mappings
    const requirementsMap: Record<string, string[]> = {
      'SKILLED_NURSING': ['RN_LICENSE', 'LPN_LICENSE'],
      'PHYSICAL_THERAPY': ['PT_LICENSE'],
      'OCCUPATIONAL_THERAPY': ['OT_LICENSE'],
      'SPEECH_THERAPY': ['SLP_LICENSE'],
      'HOME_HEALTH_AIDE': ['HHA_CERTIFICATION'],
      'PERSONAL_CARE': [], // No specific requirements
      'COMPANION': [], // No specific requirements
      'RESPITE': [], // No specific requirements
    };
    
    return requirementsMap[serviceTypeCode] ?? [];
  }
}

/**
 * Factory function to create a CaregiverProvider instance
 */
export function createCaregiverProvider(database: Database): ICaregiverProvider {
  return new CaregiverProvider(database);
}
