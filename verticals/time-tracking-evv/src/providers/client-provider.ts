/**
 * Client Provider Implementation
 * 
 * Provides client demographic data for EVV compliance operations.
 * Implements the IClientProvider interface to decouple EVV from client-demographics vertical.
 */

import { UUID, NotFoundError, Database } from '@care-commons/core';
import type { IClientProvider } from '../interfaces/visit-provider';

/**
 * Type definitions for JSONB fields
 */
interface PrimaryAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

interface ServiceEligibility {
  medicaid?: {
    memberId?: string;
    programName?: string;
    programType?: string;
  };
  medicaidId?: string;
}

interface PrimaryPhone {
  number: string;
  type?: string;
}

/**
 * Client Provider for EVV Integration
 * 
 * Fetches client demographic data needed for EVV record creation and compliance validation.
 */
export class ClientProvider implements IClientProvider {
  constructor(private database: Database) {}

  /**
   * Get client information for EVV operations
   * 
   * Retrieves essential client data including:
   * - Name (for EVV record identification)
   * - Medicaid ID (for state aggregator submission)
   * - Date of birth (for regulatory compliance)
   * - State code (for state-specific EVV rules)
   * - Contact information
   * 
   * @throws NotFoundError if client doesn't exist
   */
  async getClientForEVV(clientId: UUID): Promise<{
    id: UUID;
    name: string;
    medicaidId?: string;
    dateOfBirth: Date;
    stateCode: string;
    stateMedicaidProgram?: string;
    primaryPhone?: string;
    email?: string;
  }> {
    const query = `
      SELECT 
        id,
        first_name,
        middle_name,
        last_name,
        date_of_birth,
        primary_address,
        service_eligibility,
        primary_phone,
        email
      FROM clients
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [clientId]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Client not found', { clientId });
    }

    const row = result.rows[0] as Record<string, unknown>;
    
    // Parse primary address to get state
    const primaryAddressRaw = row['primary_address'];
    const primaryAddress = (typeof primaryAddressRaw === 'string' 
      ? JSON.parse(primaryAddressRaw) 
      : primaryAddressRaw) as PrimaryAddress | null;
    
    // Parse service eligibility to get Medicaid ID
    const serviceEligibilityRaw = row['service_eligibility'];
    const serviceEligibility = (typeof serviceEligibilityRaw === 'string'
      ? JSON.parse(serviceEligibilityRaw)
      : serviceEligibilityRaw) as ServiceEligibility | null;
    
    // Parse phone
    const primaryPhoneRaw = row['primary_phone'];
    const primaryPhone = primaryPhoneRaw
      ? ((typeof primaryPhoneRaw === 'string' ? JSON.parse(primaryPhoneRaw) : primaryPhoneRaw) as PrimaryPhone)
      : null;
    
    // Build full name
    const middleName = row['middle_name'] ? ` ${row['middle_name']}` : '';
    const fullName = `${row['first_name']}${middleName} ${row['last_name']}`;
    
    // Extract Medicaid ID from service eligibility - handle various structures
    const medicaidId = serviceEligibility?.medicaid?.memberId 
      ?? serviceEligibility?.medicaidId 
      ?? undefined;
    
    // Extract state Medicaid program information
    const stateMedicaidProgram = serviceEligibility?.medicaid?.programName 
      ?? serviceEligibility?.medicaid?.programType
      ?? undefined;

    return {
      id: row['id'] as UUID,
      name: fullName,
      medicaidId,
      dateOfBirth: new Date(row['date_of_birth'] as string),
      stateCode: primaryAddress?.state ?? 'UNKNOWN',
      stateMedicaidProgram,
      primaryPhone: primaryPhone?.number,
      email: (row['email'] as string | null) ?? undefined,
    };
  }
}

/**
 * Factory function to create a ClientProvider instance
 */
export function createClientProvider(database: Database): IClientProvider {
  return new ClientProvider(database);
}
