"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientValidator = void 0;
const zod_1 = require("zod");
const phoneSchema = zod_1.z.object({
    number: zod_1.z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number'),
    type: zod_1.z.enum(['MOBILE', 'HOME', 'WORK']),
    canReceiveSMS: zod_1.z.boolean(),
});
const addressSchema = zod_1.z.object({
    type: zod_1.z.enum(['HOME', 'BILLING', 'TEMPORARY']),
    line1: zod_1.z.string().min(1, 'Address line 1 required'),
    line2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, 'City required'),
    state: zod_1.z.string().length(2, 'State must be 2-letter code'),
    postalCode: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
    county: zod_1.z.string().optional(),
    country: zod_1.z.string().default('US'),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    validFrom: zod_1.z.date().optional(),
    validTo: zod_1.z.date().optional(),
});
const emergencyContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name required'),
    relationship: zod_1.z.string().min(1, 'Relationship required'),
    phone: phoneSchema,
    alternatePhone: phoneSchema.optional(),
    email: zod_1.z.string().email().optional(),
    isPrimary: zod_1.z.boolean(),
    canMakeHealthcareDecisions: zod_1.z.boolean(),
    notes: zod_1.z.string().optional(),
});
const createClientSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    firstName: zod_1.z.string().min(1, 'First name required').max(100),
    middleName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().min(1, 'Last name required').max(100),
    preferredName: zod_1.z.string().max(100).optional(),
    dateOfBirth: zod_1.z.date().refine((date) => {
        const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return age >= 0 && age <= 150;
    }, { message: 'Invalid date of birth' }),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    primaryPhone: phoneSchema.optional(),
    email: zod_1.z.string().email().optional(),
    primaryAddress: addressSchema,
    emergencyContacts: zod_1.z.array(emergencyContactSchema).optional(),
    referralSource: zod_1.z.string().max(200).optional(),
    intakeDate: zod_1.z.date().optional(),
    status: zod_1.z
        .enum([
        'INQUIRY',
        'PENDING_INTAKE',
        'ACTIVE',
        'INACTIVE',
        'ON_HOLD',
        'DISCHARGED',
        'DECEASED',
    ])
        .optional(),
});
const updateClientSchema = zod_1.z
    .object({
    firstName: zod_1.z.string().min(1).max(100).optional(),
    middleName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    preferredName: zod_1.z.string().max(100).optional(),
    dateOfBirth: zod_1.z.date().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    primaryPhone: phoneSchema.optional(),
    alternatePhone: phoneSchema.optional(),
    email: zod_1.z.string().email().optional(),
    primaryAddress: addressSchema.optional(),
    emergencyContacts: zod_1.z.array(emergencyContactSchema).optional(),
    status: zod_1.z
        .enum([
        'INQUIRY',
        'PENDING_INTAKE',
        'ACTIVE',
        'INACTIVE',
        'ON_HOLD',
        'DISCHARGED',
        'DECEASED',
    ])
        .optional(),
    notes: zod_1.z.string().optional(),
})
    .partial();
class ClientValidator {
    validateCreate(input) {
        try {
            createClientSchema.parse(input);
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ path: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateUpdate(input) {
        try {
            updateClientSchema.parse(input);
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ path: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateSSN(ssn) {
        return /^\d{3}-?\d{2}-?\d{4}$/.test(ssn);
    }
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    validateMinimumAge(dateOfBirth, minimumAge = 18) {
        const age = this.calculateAge(dateOfBirth);
        return age >= minimumAge;
    }
    calculateAge(dateOfBirth) {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        if (monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        return age;
    }
}
exports.ClientValidator = ClientValidator;
//# sourceMappingURL=client-validator.js.map