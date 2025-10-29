/**
 * Texas Employee Misconduct Registry Check Service
 * 
 * Implements registry checks required by 26 TAC §558 and HHSC requirements.
 * 
 * The Employee Misconduct Registry (EMR) is maintained by HHSC to track individuals
 * who have been determined to have committed abuse, neglect, or exploitation of
 * individuals in care settings.
 * 
 * Reference: https://apps.hhs.texas.gov/emr/
 */

import { UUID } from '@care-commons/core';
import { RegistryCheck } from '../../types/caregiver';

export interface EmployeeMisconductRegistryCheckInput {
  caregiverId: UUID;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  ssn?: string; // Last 4 digits only for privacy
  performedBy: UUID;
}

export interface EmployeeMisconductRegistryCheckResult {
  check: RegistryCheck;
  listed: boolean;
  eligibleForHire: boolean;
  recommendedAction: 'APPROVE' | 'REJECT' | 'REVIEW';
  notes?: string;
}

export class TexasEmployeeMisconductRegistryService {
  /**
   * Perform Employee Misconduct Registry check
   * 
   * In production, this would integrate with the HHSC EMR API.
   * For now, this is a framework that requires implementation.
   * 
   * @throws Error if the external API is unavailable or returns an error
   */
  async performRegistryCheck(
    input: EmployeeMisconductRegistryCheckInput
  ): Promise<EmployeeMisconductRegistryCheckResult> {
    // Validate input
    this.validateInput(input);
    
    // In production, this would call the HHSC EMR API
    // The actual implementation requires:
    // 1. HHSC account credentials
    // 2. API endpoint configuration
    // 3. Proper authentication/authorization
    // 4. Handling of rate limits and timeouts
    
    // For now, throw an error to indicate this must be implemented
    throw new Error(
      'Texas Employee Misconduct Registry API integration required. ' +
      'This service must be configured with HHSC credentials and endpoints. ' +
      'Contact your system administrator to complete the integration at: ' +
      'https://apps.hhs.texas.gov/emr/'
    );
    
    // Production implementation would look like:
    /*
    const apiResponse = await this.callEMRApi({
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      dateOfBirth: input.dateOfBirth,
      ssn: input.ssn,
    });
    
    const check: RegistryCheck = {
      checkDate: new Date(),
      expirationDate: this.calculateExpirationDate(new Date()),
      status: apiResponse.found ? 'LISTED' : 'CLEAR',
      registryType: 'EMPLOYEE_MISCONDUCT',
      confirmationNumber: apiResponse.confirmationNumber,
      performedBy: input.performedBy,
      documentPath: apiResponse.documentPath,
      notes: apiResponse.notes,
      listingDetails: apiResponse.found ? {
        listedDate: apiResponse.listedDate,
        violationType: apiResponse.violationType,
        disposition: apiResponse.disposition,
        ineligibleForHire: true, // EMR listing = automatic ineligibility
      } : undefined,
    };
    
    return {
      check,
      listed: apiResponse.found,
      eligibleForHire: !apiResponse.found,
      recommendedAction: apiResponse.found ? 'REJECT' : 'APPROVE',
      notes: apiResponse.found 
        ? 'Candidate is listed on the Employee Misconduct Registry and is INELIGIBLE for hire per HHSC requirements.'
        : 'Candidate is clear on the Employee Misconduct Registry.',
    };
    */
  }

  /**
   * Verify an existing registry check is still valid
   */
  async verifyExistingCheck(check: RegistryCheck): Promise<{
    valid: boolean;
    reason?: string;
    requiresRecheck: boolean;
  }> {
    const now = new Date();
    
    // Check if expired
    if (check.expirationDate < now) {
      return {
        valid: false,
        reason: 'Registry check has expired',
        requiresRecheck: true,
      };
    }
    
    // Check if status is not CLEAR or LISTED
    if (check.status === 'PENDING') {
      return {
        valid: false,
        reason: 'Registry check is still pending',
        requiresRecheck: false,
      };
    }
    
    // Check if expiring soon (within 30 days)
    const daysUntilExpiration = Math.floor(
      (check.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiration <= 30) {
      return {
        valid: true,
        reason: `Registry check expiring in ${daysUntilExpiration} days - recheck recommended`,
        requiresRecheck: true,
      };
    }
    
    return {
      valid: true,
      requiresRecheck: false,
    };
  }

  /**
   * Calculate expiration date for registry check
   * Texas EMR checks are valid for 12 months from check date
   */
  private calculateExpirationDate(checkDate: Date): Date {
    const expiration = new Date(checkDate);
    expiration.setFullYear(expiration.getFullYear() + 1);
    return expiration;
  }

  /**
   * Validate input before performing check
   */
  private validateInput(input: EmployeeMisconductRegistryCheckInput): void {
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new Error('First name is required for registry check');
    }
    
    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new Error('Last name is required for registry check');
    }
    
    if (!input.dateOfBirth) {
      throw new Error('Date of birth is required for registry check');
    }
    
    // Validate date of birth is reasonable
    const age = this.calculateAge(input.dateOfBirth);
    if (age < 16 || age > 100) {
      throw new Error('Invalid date of birth for registry check');
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get status message for registry check
   */
  getStatusMessage(check: RegistryCheck): string {
    if (check.status === 'CLEAR') {
      return 'Cleared - No listing found on Employee Misconduct Registry';
    }
    
    if (check.status === 'LISTED') {
      return 'LISTED - Individual found on Employee Misconduct Registry. INELIGIBLE FOR HIRE.';
    }
    
    if (check.status === 'PENDING') {
      return 'Pending - Registry check in progress';
    }
    
    if (check.status === 'EXPIRED') {
      return 'Expired - Registry check must be renewed';
    }
    
    return 'Unknown status';
  }

  /**
   * Determine if caregiver can be assigned to clients based on registry check
   */
  canAssignToClient(check: RegistryCheck | undefined): {
    allowed: boolean;
    reason?: string;
  } {
    if (!check) {
      return {
        allowed: false,
        reason: 'Employee Misconduct Registry check not performed',
      };
    }
    
    if (check.status === 'LISTED') {
      return {
        allowed: false,
        reason: 'Listed on Employee Misconduct Registry - INELIGIBLE per HHSC requirements',
      };
    }
    
    if (check.status === 'EXPIRED') {
      return {
        allowed: false,
        reason: 'Employee Misconduct Registry check expired',
      };
    }
    
    if (check.status === 'PENDING') {
      return {
        allowed: false,
        reason: 'Employee Misconduct Registry check pending',
      };
    }
    
    if (check.expirationDate < new Date()) {
      return {
        allowed: false,
        reason: 'Employee Misconduct Registry check expired',
      };
    }
    
    return {
      allowed: true,
    };
  }
}

/**
 * Singleton instance
 */
export const texasEmployeeMisconductRegistryService = new TexasEmployeeMisconductRegistryService();
