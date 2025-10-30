"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.texasEmployeeMisconductRegistryService = exports.TexasEmployeeMisconductRegistryService = void 0;
class TexasEmployeeMisconductRegistryService {
    async performRegistryCheck(input) {
        this.validateInput(input);
        throw new Error('Texas Employee Misconduct Registry API integration required. ' +
            'This service must be configured with HHSC credentials and endpoints. ' +
            'Contact your system administrator to complete the integration at: ' +
            'https://apps.hhs.texas.gov/emr/');
    }
    async verifyExistingCheck(check) {
        const now = new Date();
        if (check.expirationDate < now) {
            return {
                valid: false,
                reason: 'Registry check has expired',
                requiresRecheck: true,
            };
        }
        if (check.status === 'PENDING') {
            return {
                valid: false,
                reason: 'Registry check is still pending',
                requiresRecheck: false,
            };
        }
        const daysUntilExpiration = Math.floor((check.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
    calculateExpirationDate(checkDate) {
        const expiration = new Date(checkDate);
        expiration.setFullYear(expiration.getFullYear() + 1);
        return expiration;
    }
    validateInput(input) {
        if (!input.firstName || input.firstName.trim().length === 0) {
            throw new Error('First name is required for registry check');
        }
        if (!input.lastName || input.lastName.trim().length === 0) {
            throw new Error('Last name is required for registry check');
        }
        if (!input.dateOfBirth) {
            throw new Error('Date of birth is required for registry check');
        }
        const age = this.calculateAge(input.dateOfBirth);
        if (age < 16 || age > 100) {
            throw new Error('Invalid date of birth for registry check');
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
    canAssignToClient(check) {
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
exports.TexasEmployeeMisconductRegistryService = TexasEmployeeMisconductRegistryService;
exports.texasEmployeeMisconductRegistryService = new TexasEmployeeMisconductRegistryService();
//# sourceMappingURL=texas-employee-misconduct-registry.js.map