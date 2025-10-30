"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const caregiver_utils_1 = require("../caregiver-utils");
const date_fns_1 = require("date-fns");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Caregiver Utilities', () => {
    (0, vitest_1.describe)('calculateAge', () => {
        (0, vitest_1.it)('should calculate age correctly', () => {
            const today = new Date();
            const birthDate = new Date(today);
            birthDate.setFullYear(today.getFullYear() - 30);
            const age = (0, caregiver_utils_1.calculateAge)(birthDate);
            (0, vitest_1.expect)(age).toBe(30);
        });
        (0, vitest_1.it)('should handle string dates', () => {
            const today = new Date();
            const birthDate = new Date(today);
            birthDate.setFullYear(today.getFullYear() - 40);
            const age = (0, caregiver_utils_1.calculateAge)(birthDate.toISOString());
            (0, vitest_1.expect)(age).toBe(40);
        });
    });
    (0, vitest_1.describe)('calculateDetailedAge', () => {
        (0, vitest_1.it)('should return years and months', () => {
            const today = new Date();
            const birthDate = new Date(today);
            birthDate.setFullYear(today.getFullYear() - 25);
            birthDate.setMonth(today.getMonth() - 6);
            const age = (0, caregiver_utils_1.calculateDetailedAge)(birthDate);
            (0, vitest_1.expect)(age.years).toBe(25);
            (0, vitest_1.expect)(age.months).toBe(6);
        });
    });
    (0, vitest_1.describe)('calculateYearsOfService', () => {
        (0, vitest_1.it)('should calculate years of service', () => {
            const today = new Date();
            const hireDate = new Date(today);
            hireDate.setFullYear(today.getFullYear() - 5);
            const years = (0, caregiver_utils_1.calculateYearsOfService)(hireDate);
            (0, vitest_1.expect)(years).toBe(5);
        });
    });
    (0, vitest_1.describe)('getFullName', () => {
        const caregiver = {
            firstName: 'Sarah',
            middleName: 'Marie',
            lastName: 'Johnson',
            preferredName: 'Sally',
        };
        (0, vitest_1.it)('should return full name without middle name by default', () => {
            const name = (0, caregiver_utils_1.getFullName)(caregiver);
            (0, vitest_1.expect)(name).toBe('Sarah Johnson');
        });
        (0, vitest_1.it)('should include middle name when requested', () => {
            const name = (0, caregiver_utils_1.getFullName)(caregiver, { includeMiddle: true });
            (0, vitest_1.expect)(name).toBe('Sarah Marie Johnson');
        });
        (0, vitest_1.it)('should show preferred name when requested', () => {
            const name = (0, caregiver_utils_1.getFullName)(caregiver, { showPreferred: true });
            (0, vitest_1.expect)(name).toBe('Sarah Johnson "Sally"');
        });
        (0, vitest_1.it)('should not show preferred name if same as first name', () => {
            const cg = { ...caregiver, preferredName: 'Sarah' };
            const name = (0, caregiver_utils_1.getFullName)(cg, { showPreferred: true });
            (0, vitest_1.expect)(name).toBe('Sarah Johnson');
        });
    });
    (0, vitest_1.describe)('getDisplayName', () => {
        (0, vitest_1.it)('should return preferred name if available', () => {
            const caregiver = { firstName: 'Sarah', preferredName: 'Sally' };
            (0, vitest_1.expect)((0, caregiver_utils_1.getDisplayName)(caregiver)).toBe('Sally');
        });
        (0, vitest_1.it)('should return first name if no preferred name', () => {
            const caregiver = { firstName: 'Sarah', preferredName: undefined };
            (0, vitest_1.expect)((0, caregiver_utils_1.getDisplayName)(caregiver)).toBe('Sarah');
        });
    });
    (0, vitest_1.describe)('formatPhoneNumber', () => {
        (0, vitest_1.it)('should format 10-digit number correctly', () => {
            const formatted = (0, caregiver_utils_1.formatPhoneNumber)('5551234567');
            (0, vitest_1.expect)(formatted).toBe('(555) 123-4567');
        });
        (0, vitest_1.it)('should format 11-digit number with country code', () => {
            const formatted = (0, caregiver_utils_1.formatPhoneNumber)('15551234567');
            (0, vitest_1.expect)(formatted).toBe('+1 (555) 123-4567');
        });
        (0, vitest_1.it)('should handle already formatted numbers', () => {
            const formatted = (0, caregiver_utils_1.formatPhoneNumber)('(555) 123-4567');
            (0, vitest_1.expect)(formatted).toBe('(555) 123-4567');
        });
        (0, vitest_1.it)('should handle phone objects', () => {
            const phone = { number: '5551234567', type: 'MOBILE', canReceiveSMS: true };
            const formatted = (0, caregiver_utils_1.formatPhoneNumber)(phone);
            (0, vitest_1.expect)(formatted).toBe('(555) 123-4567');
        });
    });
    (0, vitest_1.describe)('getPrimaryEmergencyContact', () => {
        (0, vitest_1.it)('should return the primary contact', () => {
            const caregiver = {
                emergencyContacts: [
                    {
                        id: '1',
                        name: 'Contact 1',
                        relationship: 'Spouse',
                        phone: { number: '555-1111', type: 'MOBILE', canReceiveSMS: true },
                        isPrimary: false,
                    },
                    {
                        id: '2',
                        name: 'Contact 2',
                        relationship: 'Parent',
                        phone: { number: '555-2222', type: 'MOBILE', canReceiveSMS: true },
                        isPrimary: true,
                    },
                ],
            };
            const primary = (0, caregiver_utils_1.getPrimaryEmergencyContact)(caregiver);
            (0, vitest_1.expect)(primary?.name).toBe('Contact 2');
            (0, vitest_1.expect)(primary?.isPrimary).toBe(true);
        });
        (0, vitest_1.it)('should return first contact if none marked primary', () => {
            const caregiver = {
                emergencyContacts: [
                    {
                        id: '1',
                        name: 'Contact 1',
                        relationship: 'Spouse',
                        phone: { number: '555-1111', type: 'MOBILE', canReceiveSMS: true },
                        isPrimary: false,
                    },
                ],
            };
            const primary = (0, caregiver_utils_1.getPrimaryEmergencyContact)(caregiver);
            (0, vitest_1.expect)(primary?.name).toBe('Contact 1');
        });
    });
    (0, vitest_1.describe)('hasActiveCredentials', () => {
        const futureDate = (0, date_fns_1.addDays)(new Date(), 365);
        const caregiver = {
            credentials: [
                {
                    id: '1',
                    type: 'CNA',
                    name: 'CNA License',
                    issueDate: new Date('2020-01-01'),
                    expirationDate: futureDate,
                    status: 'ACTIVE',
                },
                {
                    id: '2',
                    type: 'CPR',
                    name: 'CPR Cert',
                    issueDate: new Date('2023-01-01'),
                    expirationDate: futureDate,
                    status: 'ACTIVE',
                },
            ],
        };
        (0, vitest_1.it)('should return true if has active credentials', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.hasActiveCredentials)(caregiver)).toBe(true);
        });
        (0, vitest_1.it)('should check for specific credential types', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.hasActiveCredentials)(caregiver, ['CNA'])).toBe(true);
            (0, vitest_1.expect)((0, caregiver_utils_1.hasActiveCredentials)(caregiver, ['CNA', 'CPR'])).toBe(true);
            (0, vitest_1.expect)((0, caregiver_utils_1.hasActiveCredentials)(caregiver, ['RN'])).toBe(false);
        });
    });
    (0, vitest_1.describe)('getExpiringCredentials', () => {
        (0, vitest_1.it)('should return credentials expiring within specified days', () => {
            const expiringDate = (0, date_fns_1.addDays)(new Date(), 20);
            const caregiver = {
                credentials: [
                    {
                        id: '1',
                        type: 'CNA',
                        name: 'CNA License',
                        issueDate: new Date('2020-01-01'),
                        expirationDate: expiringDate,
                        status: 'ACTIVE',
                    },
                    {
                        id: '2',
                        type: 'CPR',
                        name: 'CPR Cert',
                        issueDate: new Date('2023-01-01'),
                        expirationDate: (0, date_fns_1.addDays)(new Date(), 60),
                        status: 'ACTIVE',
                    },
                ],
            };
            const expiring = (0, caregiver_utils_1.getExpiringCredentials)(caregiver, 30);
            (0, vitest_1.expect)(expiring).toHaveLength(1);
            (0, vitest_1.expect)(expiring[0].type).toBe('CNA');
        });
    });
    (0, vitest_1.describe)('getExpiredCredentials', () => {
        (0, vitest_1.it)('should return expired credentials', () => {
            const caregiver = {
                credentials: [
                    {
                        id: '1',
                        type: 'CNA',
                        name: 'CNA License',
                        issueDate: new Date('2020-01-01'),
                        expirationDate: (0, date_fns_1.subDays)(new Date(), 10),
                        status: 'ACTIVE',
                    },
                    {
                        id: '2',
                        type: 'CPR',
                        name: 'CPR Cert',
                        issueDate: new Date('2023-01-01'),
                        expirationDate: (0, date_fns_1.addDays)(new Date(), 60),
                        status: 'ACTIVE',
                    },
                ],
            };
            const expired = (0, caregiver_utils_1.getExpiredCredentials)(caregiver);
            (0, vitest_1.expect)(expired).toHaveLength(1);
            (0, vitest_1.expect)(expired[0].type).toBe('CNA');
        });
    });
    (0, vitest_1.describe)('hasCriticalComplianceIssues', () => {
        (0, vitest_1.it)('should return true for critical statuses', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.hasCriticalComplianceIssues)({ complianceStatus: 'EXPIRED' })).toBe(true);
            (0, vitest_1.expect)((0, caregiver_utils_1.hasCriticalComplianceIssues)({ complianceStatus: 'NON_COMPLIANT' })).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-critical statuses', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.hasCriticalComplianceIssues)({ complianceStatus: 'COMPLIANT' })).toBe(false);
            (0, vitest_1.expect)((0, caregiver_utils_1.hasCriticalComplianceIssues)({ complianceStatus: 'EXPIRING_SOON' })).toBe(false);
        });
    });
    (0, vitest_1.describe)('getCompletedTraining', () => {
        const caregiver = {
            training: [
                {
                    id: '1',
                    name: 'Orientation',
                    category: 'ORIENTATION',
                    completionDate: new Date('2024-01-01'),
                    status: 'COMPLETED',
                    hours: 8,
                },
                {
                    id: '2',
                    name: 'CPR Training',
                    category: 'SAFETY',
                    completionDate: new Date('2024-02-01'),
                    status: 'COMPLETED',
                    hours: 4,
                },
                {
                    id: '3',
                    name: 'Advanced Care',
                    category: 'CLINICAL_SKILLS',
                    completionDate: new Date('2024-03-01'),
                    status: 'IN_PROGRESS',
                    hours: 12,
                },
            ],
        };
        (0, vitest_1.it)('should return only completed training', () => {
            const completed = (0, caregiver_utils_1.getCompletedTraining)(caregiver);
            (0, vitest_1.expect)(completed).toHaveLength(2);
        });
        (0, vitest_1.it)('should filter by category', () => {
            const safety = (0, caregiver_utils_1.getCompletedTraining)(caregiver, 'SAFETY');
            (0, vitest_1.expect)(safety).toHaveLength(1);
            (0, vitest_1.expect)(safety[0].name).toBe('CPR Training');
        });
    });
    (0, vitest_1.describe)('calculateTotalTrainingHours', () => {
        (0, vitest_1.it)('should sum completed training hours', () => {
            const caregiver = {
                training: [
                    {
                        id: '1',
                        name: 'Training 1',
                        category: 'ORIENTATION',
                        completionDate: new Date(),
                        status: 'COMPLETED',
                        hours: 8,
                    },
                    {
                        id: '2',
                        name: 'Training 2',
                        category: 'SAFETY',
                        completionDate: new Date(),
                        status: 'COMPLETED',
                        hours: 4,
                    },
                    {
                        id: '3',
                        name: 'Training 3',
                        category: 'CLINICAL_SKILLS',
                        completionDate: new Date(),
                        status: 'IN_PROGRESS',
                        hours: 12,
                    },
                ],
            };
            const total = (0, caregiver_utils_1.calculateTotalTrainingHours)(caregiver);
            (0, vitest_1.expect)(total).toBe(12);
        });
    });
    (0, vitest_1.describe)('isAvailableOnDay', () => {
        (0, vitest_1.it)('should return true if available on the day', () => {
            const caregiver = {
                availability: {
                    schedule: {
                        monday: { available: true },
                        tuesday: { available: false },
                        wednesday: { available: true },
                        thursday: { available: true },
                        friday: { available: true },
                        saturday: { available: false },
                        sunday: { available: false },
                    },
                    lastUpdated: new Date(),
                },
            };
            (0, vitest_1.expect)((0, caregiver_utils_1.isAvailableOnDay)(caregiver, 'monday')).toBe(true);
            (0, vitest_1.expect)((0, caregiver_utils_1.isAvailableOnDay)(caregiver, 'tuesday')).toBe(false);
        });
    });
    (0, vitest_1.describe)('getStatusDisplay', () => {
        (0, vitest_1.it)('should return display info for each status', () => {
            const active = (0, caregiver_utils_1.getStatusDisplay)('ACTIVE');
            (0, vitest_1.expect)(active.label).toBe('Active');
            (0, vitest_1.expect)(active.color).toBe('green');
            const onboarding = (0, caregiver_utils_1.getStatusDisplay)('ONBOARDING');
            (0, vitest_1.expect)(onboarding.label).toBe('Onboarding');
            (0, vitest_1.expect)(onboarding.color).toBe('blue');
        });
    });
    (0, vitest_1.describe)('getComplianceStatusDisplay', () => {
        (0, vitest_1.it)('should return display info with icons', () => {
            const compliant = (0, caregiver_utils_1.getComplianceStatusDisplay)('COMPLIANT');
            (0, vitest_1.expect)(compliant.label).toBe('Compliant');
            (0, vitest_1.expect)(compliant.color).toBe('green');
            (0, vitest_1.expect)(compliant.icon).toBe('✓');
            const expired = (0, caregiver_utils_1.getComplianceStatusDisplay)('EXPIRED');
            (0, vitest_1.expect)(expired.label).toBe('Expired');
            (0, vitest_1.expect)(expired.color).toBe('red');
            (0, vitest_1.expect)(expired.icon).toBe('✕');
        });
    });
    (0, vitest_1.describe)('canBeAssignedToVisits', () => {
        (0, vitest_1.it)('should return true if eligible for assignments', () => {
            const caregiver = {
                status: 'ACTIVE',
                employmentStatus: 'ACTIVE',
                complianceStatus: 'COMPLIANT',
            };
            (0, vitest_1.expect)((0, caregiver_utils_1.canBeAssignedToVisits)(caregiver)).toBe(true);
        });
        (0, vitest_1.it)('should return false if any requirement not met', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.canBeAssignedToVisits)({
                status: 'INACTIVE',
                employmentStatus: 'ACTIVE',
                complianceStatus: 'COMPLIANT',
            })).toBe(false);
            (0, vitest_1.expect)((0, caregiver_utils_1.canBeAssignedToVisits)({
                status: 'ACTIVE',
                employmentStatus: 'TERMINATED',
                complianceStatus: 'COMPLIANT',
            })).toBe(false);
        });
    });
    (0, vitest_1.describe)('getAssignmentBlockers', () => {
        (0, vitest_1.it)('should list all blockers', () => {
            const expiredDate = (0, date_fns_1.subDays)(new Date(), 10);
            const caregiver = {
                status: 'ON_LEAVE',
                employmentStatus: 'ACTIVE',
                complianceStatus: 'EXPIRED',
                credentials: [
                    {
                        id: '1',
                        type: 'CNA',
                        name: 'CNA License',
                        issueDate: new Date('2020-01-01'),
                        expirationDate: expiredDate,
                        status: 'ACTIVE',
                    },
                ],
            };
            const blockers = (0, caregiver_utils_1.getAssignmentBlockers)(caregiver);
            (0, vitest_1.expect)(blockers.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(blockers).toContain('Status is ON_LEAVE');
            (0, vitest_1.expect)(blockers).toContain('Compliance status is EXPIRED');
        });
    });
    (0, vitest_1.describe)('formatYearsOfService', () => {
        (0, vitest_1.it)('should format years correctly', () => {
            const threeYearsAgo = new Date();
            threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
            const formatted = (0, caregiver_utils_1.formatYearsOfService)(threeYearsAgo);
            (0, vitest_1.expect)(formatted).toBe('3 years');
        });
        (0, vitest_1.it)('should show months for less than 1 year', () => {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const formatted = (0, caregiver_utils_1.formatYearsOfService)(sixMonthsAgo);
            (0, vitest_1.expect)(formatted).toBe('6 months');
        });
        (0, vitest_1.it)('should show "New hire" for very recent hires', () => {
            const yesterday = (0, date_fns_1.subDays)(new Date(), 1);
            const formatted = (0, caregiver_utils_1.formatYearsOfService)(yesterday);
            (0, vitest_1.expect)(formatted).toBe('New hire');
        });
    });
    (0, vitest_1.describe)('isNewHire', () => {
        (0, vitest_1.it)('should return true for recent hires', () => {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            (0, vitest_1.expect)((0, caregiver_utils_1.isNewHire)(oneMonthAgo)).toBe(true);
        });
        (0, vitest_1.it)('should return false for older hires', () => {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            (0, vitest_1.expect)((0, caregiver_utils_1.isNewHire)(oneYearAgo)).toBe(false);
        });
    });
    (0, vitest_1.describe)('hasSkill', () => {
        const caregiver = {
            skills: [
                {
                    id: '1',
                    name: 'Personal Care',
                    category: 'Clinical',
                    proficiencyLevel: 'EXPERT',
                },
                {
                    id: '2',
                    name: 'Meal Prep',
                    category: 'Daily Living',
                    proficiencyLevel: 'INTERMEDIATE',
                },
            ],
        };
        (0, vitest_1.it)('should return true if has skill', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.hasSkill)(caregiver, 'Personal Care')).toBe(true);
        });
        (0, vitest_1.it)('should return false if does not have skill', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.hasSkill)(caregiver, 'Wound Care')).toBe(false);
        });
        (0, vitest_1.it)('should check proficiency level', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.hasSkill)(caregiver, 'Personal Care', 'ADVANCED')).toBe(true);
            (0, vitest_1.expect)((0, caregiver_utils_1.hasSkill)(caregiver, 'Meal Prep', 'EXPERT')).toBe(false);
        });
    });
    (0, vitest_1.describe)('compareCaregivers', () => {
        const cg1 = {
            id: '1',
            firstName: 'Alice',
            lastName: 'Anderson',
            employeeNumber: '1001',
            hireDate: new Date('2020-01-01'),
            reliabilityScore: 0.95,
        };
        const cg2 = {
            id: '2',
            firstName: 'Bob',
            lastName: 'Smith',
            employeeNumber: '1002',
            hireDate: new Date('2021-01-01'),
            reliabilityScore: 0.88,
        };
        (0, vitest_1.it)('should sort by name', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.compareCaregivers)(cg1, cg2, 'name')).toBeLessThan(0);
            (0, vitest_1.expect)((0, caregiver_utils_1.compareCaregivers)(cg2, cg1, 'name')).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should sort by hire date', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.compareCaregivers)(cg1, cg2, 'hireDate')).toBeLessThan(0);
        });
        (0, vitest_1.it)('should sort by reliability score', () => {
            (0, vitest_1.expect)((0, caregiver_utils_1.compareCaregivers)(cg1, cg2, 'reliability')).toBeLessThan(0);
        });
    });
    (0, vitest_1.describe)('filterByLanguages', () => {
        const caregivers = [
            {
                id: '1',
                firstName: 'Alice',
                lastName: 'Smith',
                languages: ['English', 'Spanish'],
            },
            {
                id: '2',
                firstName: 'Bob',
                lastName: 'Johnson',
                languages: ['English'],
            },
            {
                id: '3',
                firstName: 'Carlos',
                lastName: 'Garcia',
                languages: ['English', 'Spanish', 'French'],
            },
        ];
        (0, vitest_1.it)('should filter by required languages', () => {
            const spanishSpeakers = (0, caregiver_utils_1.filterByLanguages)(caregivers, ['Spanish']);
            (0, vitest_1.expect)(spanishSpeakers).toHaveLength(2);
        });
        (0, vitest_1.it)('should require all languages', () => {
            const multiLingual = (0, caregiver_utils_1.filterByLanguages)(caregivers, ['Spanish', 'French']);
            (0, vitest_1.expect)(multiLingual).toHaveLength(1);
            (0, vitest_1.expect)(multiLingual[0].firstName).toBe('Carlos');
        });
    });
});
//# sourceMappingURL=caregiver-utils.test.js.map