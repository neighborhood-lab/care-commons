/**
 * Florida Level 2 Background Screening Service
 * 
 * Implements the lifecycle management for Florida's Level 2 background screening
 * required under Chapter 435, Florida Statutes and AHCA requirements.
 * 
 * Level 2 screening includes:
 * - State and national criminal history (FDLE/FBI)
 * - Employment history verification
 * - 5-year rescreening requirement
 * - AHCA Clearinghouse integration
 * 
 * Reference: https://www.myflfamilies.com/service-programs/background-screening/
 */

import { UUID } from '@care-commons/core';
import { FloridaBackgroundScreening, DisqualifyingOffense } from '../../types/caregiver';

export interface Level2ScreeningInitiationInput {
  caregiverId: UUID;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  ssn: string; // Required for Level 2 screening
  liveScanFingerprints?: boolean;
  initiatedBy: UUID;
}

export interface Level2ScreeningResult {
  screening: FloridaBackgroundScreening;
  cleared: boolean;
  requiresReview: boolean;
  disqualifyingOffenses: DisqualifyingOffense[];
  exemptionEligible: boolean;
  recommendedAction: 'CLEAR' | 'CONDITIONAL' | 'DISQUALIFY' | 'REVIEW';
  nextRescreenDue?: Date;
  notes?: string;
}

export interface RescreenNotification {
  caregiverId: UUID;
  currentScreeningExpiration: Date;
  daysUntilExpiration: number;
  rescreenRequired: boolean;
  rescreenWindowOpen: boolean; // Can initiate 90 days before expiration
}

export class FloridaLevel2ScreeningService {
  private readonly SCREENING_VALIDITY_YEARS = 5;
  private readonly RESCREEN_WINDOW_DAYS = 90;
  private readonly DISQUALIFYING_OFFENSE_LOOKBACK_YEARS = 7;

  /**
   * Initiate Level 2 background screening
   * 
   * In production, this would integrate with the Florida AHCA Clearinghouse.
   * 
   * @throws Error if the external API is unavailable or returns an error
   */
  async initiateScreening(
    input: Level2ScreeningInitiationInput
  ): Promise<{ submissionId: string; estimatedCompletionDate: Date }> {
    // Validate input
    this.validateInput(input);
    
    // In production, this would:
    // 1. Submit request to AHCA Clearinghouse
    // 2. Coordinate with FDLE for state criminal history
    // 3. Submit to FBI for national criminal history (if LiveScan)
    // 4. Track screening status
    
    throw new Error(
      'Florida Level 2 Background Screening API integration required. ' +
      'This service must be configured with AHCA Clearinghouse credentials. ' +
      'Contact your system administrator to complete the integration at: ' +
      'https://www.myflfamilies.com/service-programs/background-screening/'
    );
    
    // Production implementation would look like:
    /*
    const submission = await this.submitToAHCAClearinghouse({
      firstName: input.firstName,
      lastName: input.lastName,
      middleName: input.middleName,
      dateOfBirth: input.dateOfBirth,
      ssn: input.ssn,
      screeningType: 'INITIAL',
      liveScan: input.liveScanFingerprints,
    });
    
    return {
      submissionId: submission.clearinghouseId,
      estimatedCompletionDate: this.calculateEstimatedCompletion(new Date()),
    };
    */
  }

  /**
   * Check screening status
   * 
   * Polls the AHCA Clearinghouse for screening results
   */
  async checkScreeningStatus(clearinghouseId: string): Promise<{
    status: 'PENDING' | 'CLEARED' | 'CONDITIONAL' | 'DISQUALIFIED';
    result?: Level2ScreeningResult;
  }> {
    if (!clearinghouseId) {
      throw new Error('Clearinghouse ID is required to check screening status');
    }
    
    throw new Error(
      'Florida Level 2 Background Screening status check requires API integration. ' +
      'Contact your system administrator.'
    );
  }

  /**
   * Initiate 5-year rescreen
   * 
   * Florida requires rescreening every 5 years
   */
  async initiateRescreen(
    _caregiverId: UUID,
    currentScreening: FloridaBackgroundScreening
  ): Promise<{ submissionId: string; estimatedCompletionDate: Date }> {
    // Verify current screening exists and is eligible for rescreen
    const eligibility = this.checkRescreenEligibility(currentScreening);
    
    if (!eligibility.eligible) {
      throw new Error(`Rescreen not eligible: ${eligibility.reason}`);
    }
    
    throw new Error(
      'Florida Level 2 Background Screening rescreen requires API integration. ' +
      'Contact your system administrator.'
    );
    
    // Production implementation would look like:
    /*
    const submission = await this.submitToAHCAClearinghouse({
      screeningType: 'FIVE_YEAR_RESCREEN',
      previousClearanceNumber: currentScreening.ahcaClearanceNumber,
      caregiverId,
    });
    
    return {
      submissionId: submission.clearinghouseId,
      estimatedCompletionDate: this.calculateEstimatedCompletion(new Date()),
    };
    */
  }

  /**
   * Check if rescreen is eligible or required
   */
  checkRescreenEligibility(screening: FloridaBackgroundScreening): {
    eligible: boolean;
    required: boolean;
    reason?: string;
    windowOpen: boolean;
  } {
    const now = new Date();
    const expirationDate = screening.expirationDate;
    
    // Check if expired (rescreen required)
    if (expirationDate < now) {
      return {
        eligible: true,
        required: true,
        reason: 'Screening expired - rescreen REQUIRED',
        windowOpen: true,
      };
    }
    
    // Check if within rescreen window (90 days before expiration)
    const daysUntilExpiration = Math.floor(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilExpiration <= this.RESCREEN_WINDOW_DAYS) {
      return {
        eligible: true,
        required: false,
        reason: `Rescreen window open - ${daysUntilExpiration} days until expiration`,
        windowOpen: true,
      };
    }
    
    return {
      eligible: false,
      required: false,
      reason: `Rescreen window opens ${daysUntilExpiration - this.RESCREEN_WINDOW_DAYS} days before expiration`,
      windowOpen: false,
    };
  }

  /**
   * Get caregivers needing rescreen
   * 
   * Returns list of caregivers whose screening is expiring or expired
   */
  async getCaregiversNeedingRescreen(): Promise<RescreenNotification[]> {
    // In production, this would query the database for caregivers
    // with Level 2 screenings expiring within the specified window
    
    throw new Error(
      'This method requires database integration. ' +
      'Implementation needed in caregiver service layer.'
    );
  }

  /**
   * Request exemption from disqualifying offense
   * 
   * Florida allows exemptions for certain disqualifying offenses
   * under specific circumstances (Chapter 435.07)
   */
  async requestExemption(
    _caregiverId: UUID,
    _screening: FloridaBackgroundScreening,
    offense: DisqualifyingOffense,
    justification: string
  ): Promise<{
    exemptionRequestId: string;
    status: 'SUBMITTED' | 'UNDER_REVIEW';
    estimatedDecisionDate: Date;
  }> {
    // Validate exemption eligibility
    if (!this.isExemptionEligible(offense)) {
      throw new Error(
        `Offense type "${offense.offenseType}" is not eligible for exemption under Florida law`
      );
    }
    
    if (!justification || justification.trim().length < 50) {
      throw new Error('Exemption justification must be at least 50 characters');
    }
    
    throw new Error(
      'Florida exemption request requires AHCA Clearinghouse integration. ' +
      'Contact your system administrator.'
    );
  }

  /**
   * Verify screening is valid and caregiver can work
   */
  verifyScreeningForEmployment(screening: FloridaBackgroundScreening): {
    cleared: boolean;
    canWork: boolean;
    reason?: string;
    restrictions?: string[];
  } {
    const now = new Date();
    
    // Check if disqualified
    if (screening.status === 'DISQUALIFIED') {
      return {
        cleared: false,
        canWork: false,
        reason: 'Disqualified from Level 2 background screening - CANNOT WORK',
      };
    }
    
    // Check if expired
    if (screening.expirationDate < now) {
      return {
        cleared: false,
        canWork: false,
        reason: 'Level 2 background screening expired - 5-year rescreen required',
      };
    }
    
    // Check if pending
    if (screening.status === 'PENDING') {
      return {
        cleared: false,
        canWork: false,
        reason: 'Level 2 background screening pending clearance',
      };
    }
    
    // Check if conditional
    if (screening.status === 'CONDITIONAL') {
      const restrictions: string[] = [];
      
      if (screening.disqualifyingOffenses && screening.disqualifyingOffenses.length > 0) {
        restrictions.push('Has disqualifying offenses - exemption may be required');
      }
      
      return {
        cleared: false,
        canWork: false,
        reason: 'Level 2 screening has conditional status - review required before employment',
        restrictions,
      };
    }
    
    // Check if cleared
    if (screening.status === 'CLEARED') {
      // Check if expiring soon
      const daysUntilExpiration = Math.floor(
        (screening.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const restrictions: string[] = [];
      if (daysUntilExpiration <= this.RESCREEN_WINDOW_DAYS) {
        restrictions.push(`Screening expires in ${daysUntilExpiration} days - initiate rescreen`);
      }
      
      const result: { cleared: boolean; canWork: boolean; reason?: string; restrictions?: string[] } = {
        cleared: true,
        canWork: true,
      };
      
      if (restrictions.length > 0) {
        result.restrictions = restrictions;
      }
      
      return result;
    }
    
    return {
      cleared: false,
      canWork: false,
      reason: 'Unknown screening status',
    };
  }

  /**
   * Calculate next rescreen due date (5 years from clearance)
   */
  calculateNextRescreenDate(clearanceDate: Date): Date {
    const nextRescreen = new Date(clearanceDate);
    nextRescreen.setFullYear(nextRescreen.getFullYear() + this.SCREENING_VALIDITY_YEARS);
    return nextRescreen;
  }

  /**
   * Calculate screening expiration date (5 years from clearance)
   */
  calculateExpirationDate(clearanceDate: Date): Date {
    return this.calculateNextRescreenDate(clearanceDate);
  }

  /**
   * Determine if offense is eligible for exemption
   */
  private isExemptionEligible(offense: DisqualifyingOffense): boolean {
    // Per Chapter 435.04, certain offenses are permanently disqualifying
    const permanentlyDisqualifying = [
      'MURDER',
      'MANSLAUGHTER',
      'SEXUAL_BATTERY',
      'CHILD_ABUSE',
      'EXPLOITATION_OF_ELDERLY',
    ];
    
    // Check if offense is permanently disqualifying
    const isPermanent = permanentlyDisqualifying.some((type) =>
      offense.offenseType.toUpperCase().includes(type)
    );
    
    if (isPermanent) {
      return false;
    }
    
    // Check if offense is within lookback period
    const yearsSinceOffense = Math.floor(
      (Date.now() - offense.offenseDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );
    
    if (yearsSinceOffense < this.DISQUALIFYING_OFFENSE_LOOKBACK_YEARS) {
      return false;
    }
    
    // Offense may be eligible for exemption
    return true;
  }

  /**
   * Calculate estimated completion date for screening
   * Typical processing time is 5-10 business days for electronic submission
   */
  // @ts-expect-error - Utility function kept for future use
  private _calculateEstimatedCompletion(submissionDate: Date): Date {
    const estimated = new Date(submissionDate);
    estimated.setDate(estimated.getDate() + 10); // 10 business days
    return estimated;
  }

  /**
   * Validate input for screening initiation
   */
  private validateInput(input: Level2ScreeningInitiationInput): void {
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new Error('First name is required for Level 2 screening');
    }
    
    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new Error('Last name is required for Level 2 screening');
    }
    
    if (!input.dateOfBirth) {
      throw new Error('Date of birth is required for Level 2 screening');
    }
    
    if (!input.ssn || input.ssn.length < 9) {
      throw new Error('Valid SSN is required for Level 2 screening');
    }
    
    // Validate age (must be at least 18 for healthcare work)
    const age = this.calculateAge(input.dateOfBirth);
    if (age < 18) {
      throw new Error('Caregiver must be at least 18 years old');
    }
    if (age > 100) {
      throw new Error('Invalid date of birth');
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
   * Get user-friendly status message
   */
  getStatusMessage(screening: FloridaBackgroundScreening): string {
    switch (screening.status) {
      case 'CLEARED':
        return 'Cleared - Level 2 background screening approved';
      case 'PENDING':
        return 'Pending - Level 2 background screening in progress';
      case 'CONDITIONAL':
        return 'Conditional - Review required before employment clearance';
      case 'DISQUALIFIED':
        return 'DISQUALIFIED - Ineligible for employment in healthcare';
      default:
        return 'Unknown status';
    }
  }
}

/**
 * Singleton instance
 */
export const floridaLevel2ScreeningService = new FloridaLevel2ScreeningService();
