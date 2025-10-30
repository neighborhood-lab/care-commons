"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaregiverValidator = void 0;
const zod_1 = require("zod");
const PhoneSchema = zod_1.z.object({
    number: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
    type: zod_1.z.enum(['MOBILE', 'HOME', 'WORK']),
    canReceiveSMS: zod_1.z.boolean(),
    isPrimary: zod_1.z.boolean().optional(),
});
const AddressSchema = zod_1.z.object({
    type: zod_1.z.enum(['HOME', 'MAILING']),
    line1: zod_1.z.string().min(1, 'Address line 1 is required'),
    line2: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().length(2, 'State must be 2 characters'),
    postalCode: zod_1.z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
    county: zod_1.z.string().optional(),
    country: zod_1.z.string().default('US'),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
});
const EmergencyContactSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1, 'Name is required'),
    relationship: zod_1.z.string().min(1, 'Relationship is required'),
    phone: PhoneSchema,
    alternatePhone: PhoneSchema.optional(),
    email: zod_1.z.string().email().optional(),
    address: AddressSchema.optional(),
    isPrimary: zod_1.z.boolean(),
    notes: zod_1.z.string().optional(),
});
const PayRateSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    rateType: zod_1.z.enum([
        'BASE',
        'OVERTIME',
        'WEEKEND',
        'HOLIDAY',
        'LIVE_IN',
        'SPECIALIZED_CARE',
    ]),
    amount: zod_1.z.number().positive('Amount must be positive'),
    unit: zod_1.z.enum(['HOURLY', 'VISIT', 'DAILY', 'SALARY']),
    effectiveDate: zod_1.z.date(),
    endDate: zod_1.z.date().optional(),
    serviceType: zod_1.z.string().optional(),
    payLevel: zod_1.z.number().int().positive().optional(),
    overtimeMultiplier: zod_1.z.number().positive().optional(),
    weekendMultiplier: zod_1.z.number().positive().optional(),
    holidayMultiplier: zod_1.z.number().positive().optional(),
    liveInRate: zod_1.z.number().positive().optional(),
    notes: zod_1.z.string().optional(),
});
const CreateCaregiverSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid('Invalid organization ID'),
    branchIds: zod_1.z
        .array(zod_1.z.string().uuid())
        .min(1, 'At least one branch is required'),
    primaryBranchId: zod_1.z.string().uuid('Invalid primary branch ID'),
    employeeNumber: zod_1.z.string().optional(),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    middleName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    preferredName: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.date().refine((date) => {
        const age = new Date().getFullYear() - date.getFullYear();
        return age >= 16 && age <= 100;
    }, { message: 'Age must be between 16 and 100' }),
    primaryPhone: PhoneSchema,
    email: zod_1.z.string().email('Invalid email address'),
    primaryAddress: AddressSchema,
    emergencyContacts: zod_1.z
        .array(EmergencyContactSchema)
        .min(1, 'At least one emergency contact is required'),
    employmentType: zod_1.z.enum([
        'FULL_TIME',
        'PART_TIME',
        'PER_DIEM',
        'CONTRACT',
        'TEMPORARY',
        'SEASONAL',
    ]),
    hireDate: zod_1.z.date(),
    role: zod_1.z.enum([
        'CAREGIVER',
        'SENIOR_CAREGIVER',
        'CERTIFIED_NURSING_ASSISTANT',
        'HOME_HEALTH_AIDE',
        'PERSONAL_CARE_AIDE',
        'COMPANION',
        'NURSE_RN',
        'NURSE_LPN',
        'THERAPIST',
        'COORDINATOR',
        'SUPERVISOR',
        'SCHEDULER',
        'ADMINISTRATIVE',
    ]),
    payRate: PayRateSchema,
    status: zod_1.z
        .enum([
        'APPLICATION',
        'INTERVIEWING',
        'PENDING_ONBOARDING',
        'ONBOARDING',
        'ACTIVE',
        'INACTIVE',
        'ON_LEAVE',
        'SUSPENDED',
        'TERMINATED',
        'RETIRED',
    ])
        .optional(),
});
const UpdateCaregiverSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required').optional(),
    middleName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').optional(),
    preferredName: zod_1.z.string().optional(),
    primaryPhone: PhoneSchema.optional(),
    alternatePhone: PhoneSchema.optional(),
    email: zod_1.z.string().email('Invalid email address').optional(),
    primaryAddress: AddressSchema.optional(),
    branchIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    emergencyContacts: zod_1.z.array(EmergencyContactSchema).optional(),
    role: zod_1.z
        .enum([
        'CAREGIVER',
        'SENIOR_CAREGIVER',
        'CERTIFIED_NURSING_ASSISTANT',
        'HOME_HEALTH_AIDE',
        'PERSONAL_CARE_AIDE',
        'COMPANION',
        'NURSE_RN',
        'NURSE_LPN',
        'THERAPIST',
        'COORDINATOR',
        'SUPERVISOR',
        'SCHEDULER',
        'ADMINISTRATIVE',
    ])
        .optional(),
    supervisorId: zod_1.z.string().uuid().optional(),
    credentials: zod_1.z.array(zod_1.z.any()).optional(),
    training: zod_1.z.array(zod_1.z.any()).optional(),
    skills: zod_1.z.array(zod_1.z.any()).optional(),
    availability: zod_1.z.any().optional(),
    workPreferences: zod_1.z.any().optional(),
    payRate: PayRateSchema.optional(),
    status: zod_1.z
        .enum([
        'APPLICATION',
        'INTERVIEWING',
        'PENDING_ONBOARDING',
        'ONBOARDING',
        'ACTIVE',
        'INACTIVE',
        'ON_LEAVE',
        'SUSPENDED',
        'TERMINATED',
        'RETIRED',
    ])
        .optional(),
    notes: zod_1.z.string().optional(),
});
class CaregiverValidator {
    validateCreate(input) {
        try {
            CreateCaregiverSchema.parse(input);
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ field: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateUpdate(input) {
        try {
            UpdateCaregiverSchema.parse(input);
            return { success: true };
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return {
                    success: false,
                    errors: error.issues.map((err) => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                };
            }
            return {
                success: false,
                errors: [{ field: 'unknown', message: 'Validation failed' }],
            };
        }
    }
    validateEmail(email) {
        return zod_1.z.string().email().safeParse(email).success;
    }
    validatePhone(phone) {
        return /^\+?[1-9]\d{1,14}$/.test(phone);
    }
    validateDateOfBirth(dateOfBirth) {
        const age = new Date().getFullYear() - dateOfBirth.getFullYear();
        if (age < 16) {
            return { valid: false, message: 'Caregiver must be at least 16 years old' };
        }
        if (age > 100) {
            return { valid: false, message: 'Invalid date of birth' };
        }
        return { valid: true };
    }
    validateHireDate(hireDate) {
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        if (hireDate > now) {
            const ninetyDaysFromNow = new Date();
            ninetyDaysFromNow.setDate(now.getDate() + 90);
            if (hireDate > ninetyDaysFromNow) {
                return { valid: false, message: 'Hire date cannot be more than 90 days in the future' };
            }
        }
        return { valid: true };
    }
}
exports.CaregiverValidator = CaregiverValidator;
//# sourceMappingURL=caregiver-validator.js.map