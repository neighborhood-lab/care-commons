import { UUID } from '@care-commons/core';
import { FloridaBackgroundScreening, DisqualifyingOffense } from '../../types/caregiver';
export interface Level2ScreeningInitiationInput {
    caregiverId: UUID;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    ssn: string;
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
    rescreenWindowOpen: boolean;
}
export declare class FloridaLevel2ScreeningService {
    private readonly SCREENING_VALIDITY_YEARS;
    private readonly RESCREEN_WINDOW_DAYS;
    private readonly DISQUALIFYING_OFFENSE_LOOKBACK_YEARS;
    initiateScreening(input: Level2ScreeningInitiationInput): Promise<{
        submissionId: string;
        estimatedCompletionDate: Date;
    }>;
    checkScreeningStatus(clearinghouseId: string): Promise<{
        status: 'PENDING' | 'CLEARED' | 'CONDITIONAL' | 'DISQUALIFIED';
        result?: Level2ScreeningResult;
    }>;
    initiateRescreen(caregiverId: UUID, currentScreening: FloridaBackgroundScreening, initiatedBy: UUID): Promise<{
        submissionId: string;
        estimatedCompletionDate: Date;
    }>;
    checkRescreenEligibility(screening: FloridaBackgroundScreening): {
        eligible: boolean;
        required: boolean;
        reason?: string;
        windowOpen: boolean;
    };
    getCaregiversNeedingRescreen(organizationId: UUID, daysAhead?: number): Promise<RescreenNotification[]>;
    requestExemption(caregiverId: UUID, screening: FloridaBackgroundScreening, offense: DisqualifyingOffense, justification: string, supportingDocuments: string[], requestedBy: UUID): Promise<{
        exemptionRequestId: string;
        status: 'SUBMITTED' | 'UNDER_REVIEW';
        estimatedDecisionDate: Date;
    }>;
    verifyScreeningForEmployment(screening: FloridaBackgroundScreening): {
        cleared: boolean;
        canWork: boolean;
        reason?: string;
        restrictions?: string[];
    };
    calculateNextRescreenDate(clearanceDate: Date): Date;
    calculateExpirationDate(clearanceDate: Date): Date;
    private isExemptionEligible;
    private calculateEstimatedCompletion;
    private validateInput;
    private calculateAge;
    getStatusMessage(screening: FloridaBackgroundScreening): string;
}
export declare const floridaLevel2ScreeningService: FloridaLevel2ScreeningService;
//# sourceMappingURL=florida-level2-screening.d.ts.map