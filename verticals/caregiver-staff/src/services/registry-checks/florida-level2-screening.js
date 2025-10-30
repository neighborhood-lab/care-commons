"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.floridaLevel2ScreeningService = exports.FloridaLevel2ScreeningService = void 0;
class FloridaLevel2ScreeningService {
    constructor() {
        this.SCREENING_VALIDITY_YEARS = 5;
        this.RESCREEN_WINDOW_DAYS = 90;
        this.DISQUALIFYING_OFFENSE_LOOKBACK_YEARS = 7;
    }
    async initiateScreening(input) {
        this.validateInput(input);
        throw new Error('Florida Level 2 Background Screening API integration required. ' +
            'This service must be configured with AHCA Clearinghouse credentials. ' +
            'Contact your system administrator to complete the integration at: ' +
            'https://www.myflfamilies.com/service-programs/background-screening/');
    }
    async checkScreeningStatus(clearinghouseId) {
        if (!clearinghouseId) {
            throw new Error('Clearinghouse ID is required to check screening status');
        }
        throw new Error('Florida Level 2 Background Screening status check requires API integration. ' +
            'Contact your system administrator.');
    }
    async initiateRescreen(caregiverId, currentScreening, initiatedBy) {
        const eligibility = this.checkRescreenEligibility(currentScreening);
        if (!eligibility.eligible) {
            throw new Error(`Rescreen not eligible: ${eligibility.reason}`);
        }
        throw new Error('Florida Level 2 Background Screening rescreen requires API integration. ' +
            'Contact your system administrator.');
    }
    checkRescreenEligibility(screening) {
        const now = new Date();
        const expirationDate = screening.expirationDate;
        if (expirationDate < now) {
            return {
                eligible: true,
                required: true,
                reason: 'Screening expired - rescreen REQUIRED',
                windowOpen: true,
            };
        }
        const daysUntilExpiration = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
    async getCaregiversNeedingRescreen(organizationId, daysAhead = 90) {
        throw new Error('This method requires database integration. ' +
            'Implementation needed in caregiver service layer.');
    }
    async requestExemption(caregiverId, screening, offense, justification, supportingDocuments, requestedBy) {
        if (!this.isExemptionEligible(offense)) {
            throw new Error(`Offense type "${offense.offenseType}" is not eligible for exemption under Florida law`);
        }
        if (!justification || justification.trim().length < 50) {
            throw new Error('Exemption justification must be at least 50 characters');
        }
        throw new Error('Florida exemption request requires AHCA Clearinghouse integration. ' +
            'Contact your system administrator.');
    }
    verifyScreeningForEmployment(screening) {
        const now = new Date();
        if (screening.status === 'DISQUALIFIED') {
            return {
                cleared: false,
                canWork: false,
                reason: 'Disqualified from Level 2 background screening - CANNOT WORK',
            };
        }
        if (screening.expirationDate < now) {
            return {
                cleared: false,
                canWork: false,
                reason: 'Level 2 background screening expired - 5-year rescreen required',
            };
        }
        if (screening.status === 'PENDING') {
            return {
                cleared: false,
                canWork: false,
                reason: 'Level 2 background screening pending clearance',
            };
        }
        if (screening.status === 'CONDITIONAL') {
            const restrictions = [];
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
        if (screening.status === 'CLEARED') {
            const daysUntilExpiration = Math.floor((screening.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const restrictions = [];
            if (daysUntilExpiration <= this.RESCREEN_WINDOW_DAYS) {
                restrictions.push(`Screening expires in ${daysUntilExpiration} days - initiate rescreen`);
            }
            return {
                cleared: true,
                canWork: true,
                restrictions: restrictions.length > 0 ? restrictions : undefined,
            };
        }
        return {
            cleared: false,
            canWork: false,
            reason: 'Unknown screening status',
        };
    }
    calculateNextRescreenDate(clearanceDate) {
        const nextRescreen = new Date(clearanceDate);
        nextRescreen.setFullYear(nextRescreen.getFullYear() + this.SCREENING_VALIDITY_YEARS);
        return nextRescreen;
    }
    calculateExpirationDate(clearanceDate) {
        return this.calculateNextRescreenDate(clearanceDate);
    }
    isExemptionEligible(offense) {
        const permanentlyDisqualifying = [
            'MURDER',
            'MANSLAUGHTER',
            'SEXUAL_BATTERY',
            'CHILD_ABUSE',
            'EXPLOITATION_OF_ELDERLY',
        ];
        const isPermanent = permanentlyDisqualifying.some((type) => offense.offenseType.toUpperCase().includes(type));
        if (isPermanent) {
            return false;
        }
        const yearsSinceOffense = Math.floor((Date.now() - offense.offenseDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
        if (yearsSinceOffense < this.DISQUALIFYING_OFFENSE_LOOKBACK_YEARS) {
            return false;
        }
        return true;
    }
    calculateEstimatedCompletion(submissionDate) {
        const estimated = new Date(submissionDate);
        estimated.setDate(estimated.getDate() + 10);
        return estimated;
    }
    validateInput(input) {
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
        const age = this.calculateAge(input.dateOfBirth);
        if (age < 18) {
            throw new Error('Caregiver must be at least 18 years old');
        }
        if (age > 100) {
            throw new Error('Invalid date of birth');
        }
    }
    calculateAge(dateOfBirth) {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        return age;
    }
    getStatusMessage(screening) {
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
exports.FloridaLevel2ScreeningService = FloridaLevel2ScreeningService;
exports.floridaLevel2ScreeningService = new FloridaLevel2ScreeningService();
//# sourceMappingURL=florida-level2-screening.js.map