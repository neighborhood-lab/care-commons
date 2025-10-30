"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.texasNurseAideRegistryService = exports.TexasNurseAideRegistryService = void 0;
class TexasNurseAideRegistryService {
    async performRegistryCheck(input) {
        this.validateInput(input);
        throw new Error('Texas Nurse Aide Registry API integration required. ' +
            'This service must be configured with HHSC credentials and endpoints. ' +
            'Contact your system administrator to complete the integration at: ' +
            'https://vo.hhsc.state.tx.us/');
    }
    async verifyCertification(certificationNumber) {
        if (!certificationNumber || certificationNumber.trim().length === 0) {
            return {
                valid: false,
                reason: 'Certification number is required',
            };
        }
        throw new Error('Texas Nurse Aide Registry certification verification requires API integration. ' +
            'Contact your system administrator to complete the integration.');
    }
    async verifyExistingCheck(check) {
        const now = new Date();
        if (check.expirationDate < now) {
            return {
                valid: false,
                reason: 'Nurse Aide Registry check has expired',
                requiresRecheck: true,
            };
        }
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
        const daysUntilExpiration = Math.floor((check.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
    canPerformCNATasks(check) {
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
        const restrictions = [];
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
    calculateExpirationDate(checkDate) {
        const expiration = new Date(checkDate);
        expiration.setFullYear(expiration.getFullYear() + 1);
        return expiration;
    }
    validateInput(input) {
        if (!input.firstName || input.firstName.trim().length === 0) {
            throw new Error('First name is required for Nurse Aide Registry check');
        }
        if (!input.lastName || input.lastName.trim().length === 0) {
            throw new Error('Last name is required for Nurse Aide Registry check');
        }
        if (!input.dateOfBirth) {
            throw new Error('Date of birth is required for Nurse Aide Registry check');
        }
        const age = this.calculateAge(input.dateOfBirth);
        if (age < 16 || age > 100) {
            throw new Error('Invalid date of birth for Nurse Aide Registry check');
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
    getStatusMessage(check) {
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
    determineRecommendedAction(apiResponse) {
        if (!apiResponse.found || !apiResponse.certified) {
            return 'REVIEW';
        }
        if (apiResponse.hasFindings && apiResponse.ineligibleForEmployment) {
            return 'REJECT';
        }
        if (apiResponse.certificationStatus !== 'ACTIVE') {
            return 'REJECT';
        }
        if (apiResponse.certificationExpiration && apiResponse.certificationExpiration < new Date()) {
            return 'REJECT';
        }
        return 'APPROVE';
    }
    buildDetailedNotes(apiResponse) {
        const notes = [];
        if (apiResponse.certified) {
            notes.push(`CNA Certification: ${apiResponse.certificationNumber}`);
            notes.push(`Certification Status: ${apiResponse.certificationStatus}`);
            if (apiResponse.certificationDate) {
                notes.push(`Certified Since: ${apiResponse.certificationDate.toLocaleDateString()}`);
            }
            if (apiResponse.certificationExpiration) {
                notes.push(`Expires: ${apiResponse.certificationExpiration.toLocaleDateString()}`);
            }
        }
        else {
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
exports.TexasNurseAideRegistryService = TexasNurseAideRegistryService;
exports.texasNurseAideRegistryService = new TexasNurseAideRegistryService();
//# sourceMappingURL=texas-nurse-aide-registry.js.map