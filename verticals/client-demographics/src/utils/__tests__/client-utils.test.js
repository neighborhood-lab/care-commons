"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_utils_1 = require("../client-utils");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Client Utilities', () => {
    const mockClient = {
        id: '123',
        organizationId: 'org-1',
        branchId: 'branch-1',
        clientNumber: 'CL-001',
        firstName: 'Jane',
        middleName: 'Marie',
        lastName: 'Doe',
        preferredName: 'Janie',
        dateOfBirth: new Date('1950-05-15'),
        gender: 'FEMALE',
        primaryPhone: {
            number: '5551234567',
            type: 'MOBILE',
            canReceiveSMS: true,
        },
        email: 'jane.doe@example.com',
        primaryAddress: {
            type: 'HOME',
            line1: '123 Main St',
            line2: 'Apt 4B',
            city: 'Springfield',
            state: 'IL',
            postalCode: '62701',
            country: 'US',
        },
        emergencyContacts: [
            {
                id: 'ec-1',
                name: 'John Doe',
                relationship: 'Son',
                phone: { number: '5559876543', type: 'MOBILE', canReceiveSMS: true },
                isPrimary: true,
                canMakeHealthcareDecisions: true,
            },
            {
                id: 'ec-2',
                name: 'Mary Smith',
                relationship: 'Daughter',
                phone: { number: '5551112222', type: 'HOME', canReceiveSMS: false },
                isPrimary: false,
                canMakeHealthcareDecisions: false,
            },
        ],
        authorizedContacts: [],
        programs: [
            {
                id: 'prog-1',
                programId: 'program-1',
                programName: 'Personal Care',
                enrollmentDate: new Date('2024-01-01'),
                status: 'ACTIVE',
                authorizedHoursPerWeek: 20,
            },
            {
                id: 'prog-2',
                programId: 'program-2',
                programName: 'Respite Care',
                enrollmentDate: new Date('2024-01-01'),
                status: 'ACTIVE',
                authorizedHoursPerWeek: 10,
            },
            {
                id: 'prog-3',
                programId: 'program-3',
                programName: 'Old Program',
                enrollmentDate: new Date('2023-01-01'),
                endDate: new Date('2023-12-31'),
                status: 'COMPLETED',
                authorizedHoursPerWeek: 15,
            },
        ],
        serviceEligibility: {
            medicaidEligible: true,
            medicaidNumber: 'MCD123',
            medicareEligible: true,
            medicareNumber: 'MCR456',
            veteransBenefits: false,
            longTermCareInsurance: false,
            privatePayOnly: false,
        },
        riskFlags: [
            {
                id: 'risk-1',
                type: 'FALL_RISK',
                severity: 'HIGH',
                description: 'Recent fall history',
                identifiedDate: new Date('2024-01-15'),
                requiresAcknowledgment: true,
            },
            {
                id: 'risk-2',
                type: 'MEDICATION_COMPLIANCE',
                severity: 'MEDIUM',
                description: 'Sometimes forgets medications',
                identifiedDate: new Date('2024-01-20'),
                requiresAcknowledgment: false,
            },
            {
                id: 'risk-3',
                type: 'WANDERING',
                severity: 'CRITICAL',
                description: 'Wandering risk',
                identifiedDate: new Date('2024-01-10'),
                resolvedDate: new Date('2024-02-01'),
                requiresAcknowledgment: true,
            },
        ],
        allergies: [
            {
                id: 'allergy-1',
                allergen: 'Penicillin',
                type: 'MEDICATION',
                reaction: 'Severe rash',
                severity: 'LIFE_THREATENING',
            },
            {
                id: 'allergy-2',
                allergen: 'Peanuts',
                type: 'FOOD',
                reaction: 'Hives',
                severity: 'MODERATE',
            },
        ],
        status: 'ACTIVE',
        intakeDate: new Date('2024-01-01'),
        createdAt: new Date(),
        createdBy: 'user-1',
        updatedAt: new Date(),
        updatedBy: 'user-1',
        version: 1,
        deletedAt: null,
        deletedBy: null,
    };
    (0, vitest_1.describe)('calculateAge', () => {
        (0, vitest_1.it)('should calculate age correctly', () => {
            const today = new Date();
            const birthDate = new Date(today);
            birthDate.setFullYear(today.getFullYear() - 25);
            const age = (0, client_utils_1.calculateAge)(birthDate);
            (0, vitest_1.expect)(age).toBe(25);
        });
        (0, vitest_1.it)('should handle string dates', () => {
            const today = new Date();
            const birthDate = new Date(today);
            birthDate.setFullYear(today.getFullYear() - 30);
            const age = (0, client_utils_1.calculateAge)(birthDate.toISOString().split('T')[0]);
            (0, vitest_1.expect)(age).toBe(30);
        });
    });
    (0, vitest_1.describe)('calculateDetailedAge', () => {
        (0, vitest_1.it)('should return years and months', () => {
            const today = new Date();
            const birthDate = new Date(today);
            birthDate.setFullYear(today.getFullYear() - 25);
            birthDate.setMonth(today.getMonth() - 6);
            const age = (0, client_utils_1.calculateDetailedAge)(birthDate.toISOString().split('T')[0]);
            (0, vitest_1.expect)(age).toHaveProperty('years');
            (0, vitest_1.expect)(age).toHaveProperty('months');
            (0, vitest_1.expect)(age.years).toBe(25);
            (0, vitest_1.expect)(age.months).toBe(6);
        });
    });
    (0, vitest_1.describe)('getFullName', () => {
        (0, vitest_1.it)('should return full name without middle name by default', () => {
            (0, vitest_1.expect)((0, client_utils_1.getFullName)(mockClient)).toBe('Jane Doe "Janie"');
        });
        (0, vitest_1.it)('should include middle name when requested', () => {
            (0, vitest_1.expect)((0, client_utils_1.getFullName)(mockClient, true)).toBe('Jane Marie Doe "Janie"');
        });
        (0, vitest_1.it)('should not show preferred name if same as first name', () => {
            const client = { ...mockClient, preferredName: 'Jane' };
            (0, vitest_1.expect)((0, client_utils_1.getFullName)(client)).toBe('Jane Doe');
        });
    });
    (0, vitest_1.describe)('getDisplayName', () => {
        (0, vitest_1.it)('should return preferred name if available', () => {
            (0, vitest_1.expect)((0, client_utils_1.getDisplayName)(mockClient)).toBe('Janie');
        });
        (0, vitest_1.it)('should return first name if no preferred name', () => {
            const client = { ...mockClient, preferredName: undefined };
            (0, vitest_1.expect)((0, client_utils_1.getDisplayName)(client)).toBe('Jane');
        });
    });
    (0, vitest_1.describe)('getPrimaryEmergencyContact', () => {
        (0, vitest_1.it)('should return the primary contact', () => {
            const contact = (0, client_utils_1.getPrimaryEmergencyContact)(mockClient);
            (0, vitest_1.expect)(contact).toBeDefined();
            (0, vitest_1.expect)(contact?.name).toBe('John Doe');
            (0, vitest_1.expect)(contact?.isPrimary).toBe(true);
        });
    });
    (0, vitest_1.describe)('getActiveRiskFlags', () => {
        (0, vitest_1.it)('should return only unresolved risk flags', () => {
            const active = (0, client_utils_1.getActiveRiskFlags)(mockClient);
            (0, vitest_1.expect)(active).toHaveLength(2);
            (0, vitest_1.expect)(active.every((flag) => !flag.resolvedDate)).toBe(true);
        });
    });
    (0, vitest_1.describe)('getCriticalRiskFlags', () => {
        (0, vitest_1.it)('should return only critical unresolved risk flags', () => {
            const critical = (0, client_utils_1.getCriticalRiskFlags)(mockClient);
            (0, vitest_1.expect)(critical).toHaveLength(0);
        });
        (0, vitest_1.it)('should identify active critical flags', () => {
            const client = {
                ...mockClient,
                riskFlags: [
                    {
                        id: 'risk-4',
                        type: 'SAFETY_CONCERN',
                        severity: 'CRITICAL',
                        description: 'Active critical risk',
                        identifiedDate: new Date(),
                        requiresAcknowledgment: true,
                    },
                ],
            };
            const critical = (0, client_utils_1.getCriticalRiskFlags)(client);
            (0, vitest_1.expect)(critical).toHaveLength(1);
        });
    });
    (0, vitest_1.describe)('hasCriticalRisks', () => {
        (0, vitest_1.it)('should return false when no critical active risks', () => {
            (0, vitest_1.expect)((0, client_utils_1.hasCriticalRisks)(mockClient)).toBe(false);
        });
    });
    (0, vitest_1.describe)('getActivePrograms', () => {
        (0, vitest_1.it)('should return only active programs', () => {
            const active = (0, client_utils_1.getActivePrograms)(mockClient);
            (0, vitest_1.expect)(active).toHaveLength(2);
            (0, vitest_1.expect)(active.every((p) => p.status === 'ACTIVE')).toBe(true);
        });
    });
    (0, vitest_1.describe)('getTotalAuthorizedHours', () => {
        (0, vitest_1.it)('should sum authorized hours from active programs', () => {
            const total = (0, client_utils_1.getTotalAuthorizedHours)(mockClient);
            (0, vitest_1.expect)(total).toBe(30);
        });
    });
    (0, vitest_1.describe)('formatPhoneNumber', () => {
        (0, vitest_1.it)('should format 10-digit number correctly', () => {
            (0, vitest_1.expect)((0, client_utils_1.formatPhoneNumber)('5551234567')).toBe('(555) 123-4567');
        });
        (0, vitest_1.it)('should format 11-digit number with country code', () => {
            (0, vitest_1.expect)((0, client_utils_1.formatPhoneNumber)('15551234567')).toBe('+1 (555) 123-4567');
        });
        (0, vitest_1.it)('should handle already formatted numbers', () => {
            (0, vitest_1.expect)((0, client_utils_1.formatPhoneNumber)('(555) 123-4567')).toBe('(555) 123-4567');
        });
        (0, vitest_1.it)('should return as-is for invalid formats', () => {
            (0, vitest_1.expect)((0, client_utils_1.formatPhoneNumber)('123')).toBe('123');
        });
    });
    (0, vitest_1.describe)('getStatusDisplay', () => {
        (0, vitest_1.it)('should return display info for each status', () => {
            (0, vitest_1.expect)((0, client_utils_1.getStatusDisplay)('ACTIVE')).toEqual({
                label: 'Active',
                color: 'green',
                icon: '✅',
            });
            (0, vitest_1.expect)((0, client_utils_1.getStatusDisplay)('PENDING_INTAKE')).toEqual({
                label: 'Pending Intake',
                color: 'yellow',
                icon: '⏳',
            });
        });
    });
    (0, vitest_1.describe)('isEligibleForServices', () => {
        (0, vitest_1.it)('should return true if any eligibility criteria met', () => {
            (0, vitest_1.expect)((0, client_utils_1.isEligibleForServices)(mockClient)).toBe(true);
        });
        (0, vitest_1.it)('should return false if no eligibility criteria met', () => {
            const client = {
                ...mockClient,
                serviceEligibility: {
                    medicaidEligible: false,
                    medicareEligible: false,
                    veteransBenefits: false,
                    longTermCareInsurance: false,
                    privatePayOnly: false,
                },
            };
            (0, vitest_1.expect)((0, client_utils_1.isEligibleForServices)(client)).toBe(false);
        });
    });
    (0, vitest_1.describe)('hasAllergies', () => {
        (0, vitest_1.it)('should return true if client has allergies', () => {
            (0, vitest_1.expect)((0, client_utils_1.hasAllergies)(mockClient)).toBe(true);
        });
        (0, vitest_1.it)('should return false if no allergies', () => {
            const client = { ...mockClient, allergies: [] };
            (0, vitest_1.expect)((0, client_utils_1.hasAllergies)(client)).toBe(false);
        });
    });
    (0, vitest_1.describe)('hasLifeThreateningAllergies', () => {
        (0, vitest_1.it)('should return true if any life-threatening allergy exists', () => {
            (0, vitest_1.expect)((0, client_utils_1.hasLifeThreateningAllergies)(mockClient)).toBe(true);
        });
        (0, vitest_1.it)('should return false if no life-threatening allergies', () => {
            const client = {
                ...mockClient,
                allergies: [
                    {
                        id: 'allergy-1',
                        allergen: 'Dust',
                        type: 'ENVIRONMENTAL',
                        reaction: 'Sneezing',
                        severity: 'MILD',
                    },
                ],
            };
            (0, vitest_1.expect)((0, client_utils_1.hasLifeThreateningAllergies)(client)).toBe(false);
        });
    });
    (0, vitest_1.describe)('isNewClient', () => {
        (0, vitest_1.it)('should return true for recent intake', () => {
            const client = { ...mockClient, intakeDate: new Date() };
            (0, vitest_1.expect)((0, client_utils_1.isNewClient)(client, 30)).toBe(true);
        });
        (0, vitest_1.it)('should return false for old intake', () => {
            const client = { ...mockClient, intakeDate: new Date('2020-01-01') };
            (0, vitest_1.expect)((0, client_utils_1.isNewClient)(client, 30)).toBe(false);
        });
    });
    (0, vitest_1.describe)('validateClientData', () => {
        (0, vitest_1.it)('should pass validation for valid data', () => {
            const result = (0, client_utils_1.validateClientData)({
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: new Date('1950-01-01'),
                email: 'john@example.com',
            });
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should fail for empty first name', () => {
            const result = (0, client_utils_1.validateClientData)({
                firstName: '   ',
            });
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('First name cannot be empty');
        });
        (0, vitest_1.it)('should fail for invalid email', () => {
            const result = (0, client_utils_1.validateClientData)({
                email: 'invalid-email',
            });
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('Invalid email format');
        });
        (0, vitest_1.it)('should fail for invalid date of birth', () => {
            const result = (0, client_utils_1.validateClientData)({
                dateOfBirth: new Date('2050-01-01'),
            });
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.errors).toContain('Invalid date of birth');
        });
    });
    (0, vitest_1.describe)('compareClients', () => {
        const client1 = { ...mockClient, lastName: 'Adams', firstName: 'Alice' };
        const client2 = { ...mockClient, lastName: 'Baker', firstName: 'Bob' };
        (0, vitest_1.it)('should sort by name correctly', () => {
            (0, vitest_1.expect)((0, client_utils_1.compareClients)(client1, client2, 'name')).toBeLessThan(0);
            (0, vitest_1.expect)((0, client_utils_1.compareClients)(client2, client1, 'name')).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should sort by client number', () => {
            const c1 = { ...client1, clientNumber: 'CL-001' };
            const c2 = { ...client2, clientNumber: 'CL-002' };
            (0, vitest_1.expect)((0, client_utils_1.compareClients)(c1, c2, 'clientNumber')).toBeLessThan(0);
        });
    });
});
//# sourceMappingURL=client-utils.test.js.map