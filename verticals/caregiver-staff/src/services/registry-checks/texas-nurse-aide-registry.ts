/**
 * Texas Nurse Aide Registry Check Service
 * 
 * Implements registry checks required for CNAs under 26 TAC §558 and HHSC requirements.
 * 
 * The Nurse Aide Registry (NAR) is maintained by HHSC to track certified nurse aides
 * in Texas, including their certification status, any abuse findings, and employment history.
 * 
 * Reference: https://vo.hhsc.state.tx.us/
 */

import { UUID } from '@care-commons/core';
import { RegistryCheck } from '../../types/caregiver';

export interface NurseAideRegistryCheckInput {
  caregiverId: UUID;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  certificationNumber?: string; // CNA certification number if known
  performedBy: UUID;
}

export interface NurseAideRegistryCheckResult {
  check: RegistryCheck;
  found: boolean;
  certified: boolean;
  certificationStatus?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
  certificationNumber?: string;
  certificationDate?: Date;
  expirationDate?: Date;
  hasFindings: boolean; // Abuse/neglect findings
  eligibleForEmployment: boolean;
  recommendedAction: 'APPROVE' | 'REJECT' | 'REVIEW';
  notes?: string;
}

export class TexasNurseAideRegistryService {
  /**
   * Perform Nurse Aide Registry check
   * 
   * In production, this would integrate with the HHSC Nurse Aide Registry API.
   * For now, this is a framework that requires implementation.
   * 
   * @throws Error if the external API is unavailable or returns an error
   */
  async performRegistryCheck(
    input: NurseAideRegistryCheckInput
  ): Promise<NurseAideRegistryCheckResult> {
    // Validate input
    this.validateInput(input);
    
    // In production, this would call the HHSC Nurse Aide Registry API
    // The actual implementation requires:
    // 1. HHSC Nurse Aide Registry credentials
    // 2. API endpoint configuration
    // 3. Proper authentication/authorization
    // 4. Handling of rate limits and timeouts
    
    // For now, throw an error to indicate this must be implemented
    throw new Error(
      'Texas Nurse Aide Registry API integration required. ' +
      'This service must be configured with HHSC credentials and endpoints. ' +
      'Contact your system administrator to complete the integration at: ' +
      'https://vo.hhsc.state.tx.us/'
    );
    
    // Production implementation would look like:
    /*
    const apiResponse = await this.callNurseAideRegistryApi({
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      dateOfBirth: input.dateOfBirth,
      certificationNumber: input.certificationNumber,
    });
    
    const check: RegistryCheck = {
      checkDate: new Date(),
      expirationDate: this.calculateExpirationDate(new Date()),
      status: this.determineCheckStatus(apiResponse),
      registryType: 'NURSE_AIDE',
      confirmationNumber: apiResponse.confirmationNumber,
      performedBy: input.performedBy,
      documentPath: apiResponse.documentPath,
      notes: this.buildNotes(apiResponse),
      listingDetails: apiResponse.hasFindings ? {
        listedDate: apiResponse.findingDate,
        violationType: apiResponse.findingType,
        disposition: apiResponse.disposition,
        ineligibleForHire: apiResponse.ineligibleForEmployment,
      } : undefined,
    };
    
    return {
      check,
      found: apiResponse.found,
      certified: apiResponse.certified,
      certificationStatus: apiResponse.certificationStatus,
      certificationNumber: apiResponse.certificationNumber,
      certificationDate: apiResponse.certificationDate,
      expirationDate: apiResponse.certificationExpiration,
      hasFindings: apiResponse.hasFindings,
      eligibleForEmployment: apiResponse.eligible,
      recommendedAction: this.determineRecommendedAction(apiResponse),
      notes: this.buildDetailedNotes(apiResponse),
    };
    */
  }

  /**
   * Verify CNA certification is active and in good standing
   */
  async verifyCertification(certificationNumber: string): Promise<{
    valid: boolean;
    status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';
    expirationDate?: Date;
    findings?: boolean;
    reason?: string;
  }> {
    if (!certificationNumber || certificationNumber.trim().length === 0) {
      return {
        valid: false,
        reason: 'Certification number is required',
      };
    }
    
    // In production, this would verify against the HHSC NAR
    throw new Error(
      'Texas Nurse Aide Registry certification verification requires API integration. ' +
      'Contact your system administrator to complete the integration.'
    );
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
        reason: 'Nurse Aide Registry check has expired',
        requiresRecheck: true,
      };
    }
    
    // Check if status indicates a problem
    if (check.status === 'LISTED' && check.listingDetails?.ineligibleForHire) {
      return {
        valid: false,
        reason: 'CNA has findings on registry - ineligible for employment',
        requiresRecheck: false,
      };
    }
    
    if (check.status === 'PENDING') {
      return {
        valid: false,
        reason: 'Nurse Aide Registry check is still pending',
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
        reason: `Nurse Aide Registry check expiring in ${daysUntilExpiration} days - recheck recommended`,
        requiresRecheck: true,
      };
    }
    
    return {
      valid: true,
      requiresRecheck: false,
    };
  }

  /**
   * Check if a CNA can perform specific tasks based on registry status
   */
  canPerformCNATasks(check: RegistryCheck | undefined): {
    allowed: boolean;
    reason?: string;
    restrictions?: string[];
  } {
    if (!check) {
      return {
        allowed: false,
        reason: 'Nurse Aide Registry check not performed',
      };
    }
    
    if (check.status === 'LISTED' && check.listingDetails?.ineligibleForHire) {
      return {
        allowed: false,
        reason: 'Has findings on Nurse Aide Registry - ineligible for CNA duties',
      };
    }
    
    if (check.status === 'EXPIRED') {
      return {
        allowed: false,
        reason: 'Nurse Aide Registry check expired',
      };
    }
    
    if (check.status === 'PENDING') {
      return {
        allowed: false,
        reason: 'Nurse Aide Registry check pending - cannot perform CNA duties until cleared',
      };
    }
    
    if (check.expirationDate < new Date()) {
      return {
        allowed: false,
        reason: 'Nurse Aide Registry check expired',
      };
    }
    
    // Check for restrictions in notes or listing details
    const restrictions: string[] = [];
    if (check.listingDetails) {
      if (check.listingDetails.disposition) {
        restrictions.push(`Registry disposition: ${check.listingDetails.disposition}`);
      }
    }
    
    return {
      allowed: true,
      restrictions: restrictions.length > 0 ? restrictions : undefined,
    };
  }

  /**
   * Calculate expiration date for registry check
   * Texas NAR checks are typically valid for 12 months
   */
  private calculateExpirationDate(checkDate: Date): Date {
    const expiration = new Date(checkDate);
    expiration.setFullYear(expiration.getFullYear() + 1);
    return expiration;
  }

  /**
   * Validate input before performing check
   */
  private validateInput(input: NurseAideRegistryCheckInput): void {
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new Error('First name is required for Nurse Aide Registry check');
    }
    
    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new Error('Last name is required for Nurse Aide Registry check');
    }
    
    if (!input.dateOfBirth) {
      throw new Error('Date of birth is required for Nurse Aide Registry check');
    }
    
    // Validate date of birth is reasonable
    const age = this.calculateAge(input.dateOfBirth);
    if (age < 16 || age > 100) {
      throw new Error('Invalid date of birth for Nurse Aide Registry check');
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
      return 'Cleared - CNA certification verified and in good standing';
    }
    
    if (check.status === 'LISTED') {
      if (check.listingDetails?.ineligibleForHire) {
        return 'LISTED - CNA has findings on registry. INELIGIBLE FOR EMPLOYMENT.';
      }
      return 'LISTED - CNA found on registry with restrictions. Review required.';
    }
    
    if (check.status === 'PENDING') {
      return 'Pending - Nurse Aide Registry check in progress';
    }
    
    if (check.status === 'EXPIRED') {
      return 'Expired - Nurse Aide Registry check must be renewed';
    }
    
    return 'Unknown status';
  }

  /**
   * Determine recommended action based on check result
   */
  private determineRecommendedAction(apiResponse: Record<string, unknown>): 'APPROVE' | 'REJECT' | 'REVIEW' {
    // If not found or not certified, needs review
    if (!apiResponse.found || !apiResponse.certified) {
      return 'REVIEW';
    }
    
    // If has findings that make ineligible, reject
    if (apiResponse.hasFindings && apiResponse.ineligibleForEmployment) {
      return 'REJECT';
    }
    
    // If certification is not active, reject
    if (apiResponse.certificationStatus !== 'ACTIVE') {
      return 'REJECT';
    }
    
    // If certification is expired, reject
    if (apiResponse.certificationExpiration && apiResponse.certificationExpiration < new Date()) {
      return 'REJECT';
    }
    
    // Otherwise approve
    return 'APPROVE';
  }

  /**
   * Build detailed notes from API response
   */
  private buildDetailedNotes(apiResponse: Record<string, unknown>): string {
    const notes: string[] = [];
    
    if (apiResponse.certified) {
      notes.push(`CNA Certification: ${apiResponse.certificationNumber}`);
      notes.push(`Certification Status: ${apiResponse.certificationStatus}`);
      
      if (apiResponse.certificationDate) {
        notes.push(`Certified Since: ${(apiResponse.certificationDate as Date).toLocaleDateString()}`);
      }
      
      if (apiResponse.certificationExpiration) {
        notes.push(`Expires: ${(apiResponse.certificationExpiration as Date).toLocaleDateString()}`);
      }
    } else {
      notes.push('Not certified as a CNA in Texas');
    }
    
    if (apiResponse.hasFindings) {
      notes.push('⚠️ FINDINGS ON REGISTRY');
      if (apiResponse.findingType) {
        notes.push(`Finding Type: ${apiResponse.findingType}`);
      }
      if (apiResponse.disposition) {
        notes.push(`Disposition: ${apiResponse.disposition}`);
      }
    }
    
    return notes.join('\n');
  }
}

/**
 * Singleton instance
 */
export const texasNurseAideRegistryService = new TexasNurseAideRegistryService();
