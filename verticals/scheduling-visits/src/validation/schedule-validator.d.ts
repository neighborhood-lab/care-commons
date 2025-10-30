import { z } from 'zod';
export declare const recurrenceRuleSchema: z.ZodObject<{
    frequency: z.ZodEnum<{
        DAILY: "DAILY";
        CUSTOM: "CUSTOM";
        WEEKLY: "WEEKLY";
        MONTHLY: "MONTHLY";
        BIWEEKLY: "BIWEEKLY";
    }>;
    interval: z.ZodNumber;
    daysOfWeek: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        MONDAY: "MONDAY";
        WEDNESDAY: "WEDNESDAY";
        FRIDAY: "FRIDAY";
        TUESDAY: "TUESDAY";
        THURSDAY: "THURSDAY";
        SATURDAY: "SATURDAY";
        SUNDAY: "SUNDAY";
    }>>>;
    datesOfMonth: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    startTime: z.ZodString;
    endTime: z.ZodOptional<z.ZodString>;
    timezone: z.ZodString;
}, z.core.$strip>;
export declare const visitAddressSchema: z.ZodObject<{
    line1: z.ZodString;
    line2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    accessInstructions: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const locationVerificationSchema: z.ZodObject<{
    method: z.ZodEnum<{
        PHONE: "PHONE";
        MANUAL: "MANUAL";
        GPS: "GPS";
        FACIAL: "FACIAL";
        BIOMETRIC: "BIOMETRIC";
    }>;
    timestamp: z.ZodDate;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    accuracy: z.ZodOptional<z.ZodNumber>;
    distanceFromAddress: z.ZodOptional<z.ZodNumber>;
    isWithinGeofence: z.ZodBoolean;
    deviceId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const signatureDataSchema: z.ZodObject<{
    capturedAt: z.ZodDate;
    capturedBy: z.ZodString;
    signatureImageUrl: z.ZodOptional<z.ZodString>;
    signatureDataUrl: z.ZodOptional<z.ZodString>;
    deviceId: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createServicePatternInputSchema: z.ZodObject<{
    organizationId: z.ZodString;
    branchId: z.ZodString;
    clientId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    patternType: z.ZodEnum<{
        RESPITE: "RESPITE";
        AS_NEEDED: "AS_NEEDED";
        RECURRING: "RECURRING";
        ONE_TIME: "ONE_TIME";
    }>;
    serviceTypeId: z.ZodString;
    serviceTypeName: z.ZodString;
    recurrence: z.ZodObject<{
        frequency: z.ZodEnum<{
            DAILY: "DAILY";
            CUSTOM: "CUSTOM";
            WEEKLY: "WEEKLY";
            MONTHLY: "MONTHLY";
            BIWEEKLY: "BIWEEKLY";
        }>;
        interval: z.ZodNumber;
        daysOfWeek: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            MONDAY: "MONDAY";
            WEDNESDAY: "WEDNESDAY";
            FRIDAY: "FRIDAY";
            TUESDAY: "TUESDAY";
            THURSDAY: "THURSDAY";
            SATURDAY: "SATURDAY";
            SUNDAY: "SUNDAY";
        }>>>;
        datesOfMonth: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodOptional<z.ZodString>;
        timezone: z.ZodString;
    }, z.core.$strip>;
    duration: z.ZodNumber;
    flexibilityWindow: z.ZodOptional<z.ZodNumber>;
    requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requiredCertifications: z.ZodOptional<z.ZodArray<z.ZodString>>;
    preferredCaregivers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    blockedCaregivers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    genderPreference: z.ZodOptional<z.ZodEnum<{
        MALE: "MALE";
        FEMALE: "FEMALE";
        NO_PREFERENCE: "NO_PREFERENCE";
    }>>;
    languagePreference: z.ZodOptional<z.ZodString>;
    preferredTimeOfDay: z.ZodOptional<z.ZodEnum<{
        MORNING: "MORNING";
        AFTERNOON: "AFTERNOON";
        EVENING: "EVENING";
        EARLY_MORNING: "EARLY_MORNING";
        NIGHT: "NIGHT";
        ANY: "ANY";
    }>>;
    mustStartBy: z.ZodOptional<z.ZodString>;
    mustEndBy: z.ZodOptional<z.ZodString>;
    authorizedHoursPerWeek: z.ZodOptional<z.ZodNumber>;
    authorizedVisitsPerWeek: z.ZodOptional<z.ZodNumber>;
    authorizationStartDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    authorizationEndDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    fundingSourceId: z.ZodOptional<z.ZodString>;
    travelTimeBefore: z.ZodOptional<z.ZodNumber>;
    travelTimeAfter: z.ZodOptional<z.ZodNumber>;
    allowBackToBack: z.ZodDefault<z.ZodBoolean>;
    effectiveFrom: z.ZodCoercedDate<unknown>;
    effectiveTo: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    clientInstructions: z.ZodOptional<z.ZodString>;
    caregiverInstructions: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateServicePatternInputSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    recurrence: z.ZodOptional<z.ZodObject<{
        frequency: z.ZodEnum<{
            DAILY: "DAILY";
            CUSTOM: "CUSTOM";
            WEEKLY: "WEEKLY";
            MONTHLY: "MONTHLY";
            BIWEEKLY: "BIWEEKLY";
        }>;
        interval: z.ZodNumber;
        daysOfWeek: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            MONDAY: "MONDAY";
            WEDNESDAY: "WEDNESDAY";
            FRIDAY: "FRIDAY";
            TUESDAY: "TUESDAY";
            THURSDAY: "THURSDAY";
            SATURDAY: "SATURDAY";
            SUNDAY: "SUNDAY";
        }>>>;
        datesOfMonth: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        startTime: z.ZodString;
        endTime: z.ZodOptional<z.ZodString>;
        timezone: z.ZodString;
    }, z.core.$strip>>;
    duration: z.ZodOptional<z.ZodNumber>;
    requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requiredCertifications: z.ZodOptional<z.ZodArray<z.ZodString>>;
    preferredCaregivers: z.ZodOptional<z.ZodArray<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        DRAFT: "DRAFT";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
        SUSPENDED: "SUSPENDED";
    }>>;
    effectiveTo: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    clientInstructions: z.ZodOptional<z.ZodString>;
    caregiverInstructions: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createVisitInputSchema: z.ZodObject<{
    organizationId: z.ZodString;
    branchId: z.ZodString;
    clientId: z.ZodString;
    patternId: z.ZodOptional<z.ZodString>;
    visitType: z.ZodEnum<{
        INITIAL: "INITIAL";
        REGULAR: "REGULAR";
        RESPITE: "RESPITE";
        EMERGENCY: "EMERGENCY";
        ASSESSMENT: "ASSESSMENT";
        DISCHARGE: "DISCHARGE";
        MAKEUP: "MAKEUP";
        SUPERVISION: "SUPERVISION";
    }>;
    serviceTypeId: z.ZodString;
    serviceTypeName: z.ZodString;
    scheduledDate: z.ZodCoercedDate<unknown>;
    scheduledStartTime: z.ZodString;
    scheduledEndTime: z.ZodString;
    address: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        accessInstructions: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    taskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requiredCertifications: z.ZodOptional<z.ZodArray<z.ZodString>>;
    isUrgent: z.ZodDefault<z.ZodBoolean>;
    isPriority: z.ZodDefault<z.ZodBoolean>;
    requiresSupervision: z.ZodDefault<z.ZodBoolean>;
    riskFlags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    clientInstructions: z.ZodOptional<z.ZodString>;
    caregiverInstructions: z.ZodOptional<z.ZodString>;
    internalNotes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const assignVisitInputSchema: z.ZodObject<{
    visitId: z.ZodString;
    caregiverId: z.ZodString;
    assignmentMethod: z.ZodEnum<{
        MANUAL: "MANUAL";
        AUTO_MATCH: "AUTO_MATCH";
        SELF_ASSIGN: "SELF_ASSIGN";
        PREFERRED: "PREFERRED";
        OVERFLOW: "OVERFLOW";
    }>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateVisitStatusInputSchema: z.ZodObject<{
    visitId: z.ZodString;
    newStatus: z.ZodEnum<{
        DRAFT: "DRAFT";
        UNASSIGNED: "UNASSIGNED";
        SCHEDULED: "SCHEDULED";
        ASSIGNED: "ASSIGNED";
        REJECTED: "REJECTED";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
        CONFIRMED: "CONFIRMED";
        EN_ROUTE: "EN_ROUTE";
        ARRIVED: "ARRIVED";
        PAUSED: "PAUSED";
        INCOMPLETE: "INCOMPLETE";
        NO_SHOW_CLIENT: "NO_SHOW_CLIENT";
        NO_SHOW_CAREGIVER: "NO_SHOW_CAREGIVER";
    }>;
    notes: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    locationVerification: z.ZodOptional<z.ZodObject<{
        method: z.ZodEnum<{
            PHONE: "PHONE";
            MANUAL: "MANUAL";
            GPS: "GPS";
            FACIAL: "FACIAL";
            BIOMETRIC: "BIOMETRIC";
        }>;
        timestamp: z.ZodDate;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        accuracy: z.ZodOptional<z.ZodNumber>;
        distanceFromAddress: z.ZodOptional<z.ZodNumber>;
        isWithinGeofence: z.ZodBoolean;
        deviceId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const completeVisitInputSchema: z.ZodObject<{
    visitId: z.ZodString;
    actualEndTime: z.ZodDate;
    completionNotes: z.ZodOptional<z.ZodString>;
    tasksCompleted: z.ZodNumber;
    tasksTotal: z.ZodNumber;
    signatureData: z.ZodOptional<z.ZodObject<{
        capturedAt: z.ZodDate;
        capturedBy: z.ZodString;
        signatureImageUrl: z.ZodOptional<z.ZodString>;
        signatureDataUrl: z.ZodOptional<z.ZodString>;
        deviceId: z.ZodOptional<z.ZodString>;
        ipAddress: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    locationVerification: z.ZodObject<{
        method: z.ZodEnum<{
            PHONE: "PHONE";
            MANUAL: "MANUAL";
            GPS: "GPS";
            FACIAL: "FACIAL";
            BIOMETRIC: "BIOMETRIC";
        }>;
        timestamp: z.ZodDate;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
        accuracy: z.ZodOptional<z.ZodNumber>;
        distanceFromAddress: z.ZodOptional<z.ZodNumber>;
        isWithinGeofence: z.ZodBoolean;
        deviceId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const scheduleGenerationOptionsSchema: z.ZodObject<{
    patternId: z.ZodString;
    startDate: z.ZodCoercedDate<unknown>;
    endDate: z.ZodCoercedDate<unknown>;
    autoAssign: z.ZodDefault<z.ZodBoolean>;
    respectHourlyLimits: z.ZodDefault<z.ZodBoolean>;
    skipHolidays: z.ZodDefault<z.ZodBoolean>;
    holidayCalendarId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const visitSearchFiltersSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    branchId: z.ZodOptional<z.ZodString>;
    branchIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    clientId: z.ZodOptional<z.ZodString>;
    clientIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    caregiverId: z.ZodOptional<z.ZodString>;
    caregiverIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    patternId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        DRAFT: "DRAFT";
        UNASSIGNED: "UNASSIGNED";
        SCHEDULED: "SCHEDULED";
        ASSIGNED: "ASSIGNED";
        REJECTED: "REJECTED";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
        CONFIRMED: "CONFIRMED";
        EN_ROUTE: "EN_ROUTE";
        ARRIVED: "ARRIVED";
        PAUSED: "PAUSED";
        INCOMPLETE: "INCOMPLETE";
        NO_SHOW_CLIENT: "NO_SHOW_CLIENT";
        NO_SHOW_CAREGIVER: "NO_SHOW_CAREGIVER";
    }>>>;
    visitType: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        INITIAL: "INITIAL";
        REGULAR: "REGULAR";
        RESPITE: "RESPITE";
        EMERGENCY: "EMERGENCY";
        ASSESSMENT: "ASSESSMENT";
        DISCHARGE: "DISCHARGE";
        MAKEUP: "MAKEUP";
        SUPERVISION: "SUPERVISION";
    }>>>;
    dateFrom: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    dateTo: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    isUnassigned: z.ZodOptional<z.ZodBoolean>;
    isUrgent: z.ZodOptional<z.ZodBoolean>;
    requiresSupervision: z.ZodOptional<z.ZodBoolean>;
    hasExceptions: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const caregiverAvailabilityQuerySchema: z.ZodObject<{
    caregiverId: z.ZodString;
    date: z.ZodCoercedDate<unknown>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    includeTravel: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare class ScheduleValidator {
    static validateServicePattern(input: unknown): {
        organizationId: string;
        branchId: string;
        clientId: string;
        name: string;
        patternType: "RESPITE" | "AS_NEEDED" | "RECURRING" | "ONE_TIME";
        serviceTypeId: string;
        serviceTypeName: string;
        recurrence: {
            frequency: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BIWEEKLY";
            interval: number;
            startTime: string;
            timezone: string;
            daysOfWeek?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            datesOfMonth?: number[] | undefined;
            endTime?: string | undefined;
        };
        duration: number;
        allowBackToBack: boolean;
        effectiveFrom: Date;
        description?: string | undefined;
        flexibilityWindow?: number | undefined;
        requiredSkills?: string[] | undefined;
        requiredCertifications?: string[] | undefined;
        preferredCaregivers?: string[] | undefined;
        blockedCaregivers?: string[] | undefined;
        genderPreference?: "MALE" | "FEMALE" | "NO_PREFERENCE" | undefined;
        languagePreference?: string | undefined;
        preferredTimeOfDay?: "MORNING" | "AFTERNOON" | "EVENING" | "EARLY_MORNING" | "NIGHT" | "ANY" | undefined;
        mustStartBy?: string | undefined;
        mustEndBy?: string | undefined;
        authorizedHoursPerWeek?: number | undefined;
        authorizedVisitsPerWeek?: number | undefined;
        authorizationStartDate?: Date | undefined;
        authorizationEndDate?: Date | undefined;
        fundingSourceId?: string | undefined;
        travelTimeBefore?: number | undefined;
        travelTimeAfter?: number | undefined;
        effectiveTo?: Date | undefined;
        clientInstructions?: string | undefined;
        caregiverInstructions?: string | undefined;
        notes?: string | undefined;
    };
    static validateUpdatePattern(input: unknown): {
        name?: string | undefined;
        description?: string | undefined;
        recurrence?: {
            frequency: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BIWEEKLY";
            interval: number;
            startTime: string;
            timezone: string;
            daysOfWeek?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            datesOfMonth?: number[] | undefined;
            endTime?: string | undefined;
        } | undefined;
        duration?: number | undefined;
        requiredSkills?: string[] | undefined;
        requiredCertifications?: string[] | undefined;
        preferredCaregivers?: string[] | undefined;
        status?: "ACTIVE" | "DRAFT" | "COMPLETED" | "CANCELLED" | "SUSPENDED" | undefined;
        effectiveTo?: Date | undefined;
        clientInstructions?: string | undefined;
        caregiverInstructions?: string | undefined;
        notes?: string | undefined;
    };
    static validateVisit(input: unknown): {
        organizationId: string;
        branchId: string;
        clientId: string;
        visitType: "INITIAL" | "REGULAR" | "RESPITE" | "EMERGENCY" | "ASSESSMENT" | "DISCHARGE" | "MAKEUP" | "SUPERVISION";
        serviceTypeId: string;
        serviceTypeName: string;
        scheduledDate: Date;
        scheduledStartTime: string;
        scheduledEndTime: string;
        address: {
            line1: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
            line2?: string | undefined;
            latitude?: number | undefined;
            longitude?: number | undefined;
            accessInstructions?: string | undefined;
        };
        isUrgent: boolean;
        isPriority: boolean;
        requiresSupervision: boolean;
        patternId?: string | undefined;
        taskIds?: string[] | undefined;
        requiredSkills?: string[] | undefined;
        requiredCertifications?: string[] | undefined;
        riskFlags?: string[] | undefined;
        clientInstructions?: string | undefined;
        caregiverInstructions?: string | undefined;
        internalNotes?: string | undefined;
    };
    static validateAssignment(input: unknown): {
        visitId: string;
        caregiverId: string;
        assignmentMethod: "MANUAL" | "AUTO_MATCH" | "SELF_ASSIGN" | "PREFERRED" | "OVERFLOW";
        notes?: string | undefined;
    };
    static validateStatusUpdate(input: unknown): {
        visitId: string;
        newStatus: "DRAFT" | "UNASSIGNED" | "SCHEDULED" | "ASSIGNED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "CONFIRMED" | "EN_ROUTE" | "ARRIVED" | "PAUSED" | "INCOMPLETE" | "NO_SHOW_CLIENT" | "NO_SHOW_CAREGIVER";
        notes?: string | undefined;
        reason?: string | undefined;
        locationVerification?: {
            method: "PHONE" | "MANUAL" | "GPS" | "FACIAL" | "BIOMETRIC";
            timestamp: Date;
            isWithinGeofence: boolean;
            latitude?: number | undefined;
            longitude?: number | undefined;
            accuracy?: number | undefined;
            distanceFromAddress?: number | undefined;
            deviceId?: string | undefined;
        } | undefined;
    };
    static validateCompletion(input: unknown): {
        visitId: string;
        actualEndTime: Date;
        tasksCompleted: number;
        tasksTotal: number;
        locationVerification: {
            method: "PHONE" | "MANUAL" | "GPS" | "FACIAL" | "BIOMETRIC";
            timestamp: Date;
            isWithinGeofence: boolean;
            latitude?: number | undefined;
            longitude?: number | undefined;
            accuracy?: number | undefined;
            distanceFromAddress?: number | undefined;
            deviceId?: string | undefined;
        };
        completionNotes?: string | undefined;
        signatureData?: {
            capturedAt: Date;
            capturedBy: string;
            signatureImageUrl?: string | undefined;
            signatureDataUrl?: string | undefined;
            deviceId?: string | undefined;
            ipAddress?: string | undefined;
        } | undefined;
    };
    static validateGenerationOptions(input: unknown): {
        patternId: string;
        startDate: Date;
        endDate: Date;
        autoAssign: boolean;
        respectHourlyLimits: boolean;
        skipHolidays: boolean;
        holidayCalendarId?: string | undefined;
    };
    static validateSearchFilters(input: unknown): {
        query?: string | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        branchIds?: string[] | undefined;
        clientId?: string | undefined;
        clientIds?: string[] | undefined;
        caregiverId?: string | undefined;
        caregiverIds?: string[] | undefined;
        patternId?: string | undefined;
        status?: ("DRAFT" | "UNASSIGNED" | "SCHEDULED" | "ASSIGNED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "CONFIRMED" | "EN_ROUTE" | "ARRIVED" | "PAUSED" | "INCOMPLETE" | "NO_SHOW_CLIENT" | "NO_SHOW_CAREGIVER")[] | undefined;
        visitType?: ("INITIAL" | "REGULAR" | "RESPITE" | "EMERGENCY" | "ASSESSMENT" | "DISCHARGE" | "MAKEUP" | "SUPERVISION")[] | undefined;
        dateFrom?: Date | undefined;
        dateTo?: Date | undefined;
        isUnassigned?: boolean | undefined;
        isUrgent?: boolean | undefined;
        requiresSupervision?: boolean | undefined;
        hasExceptions?: boolean | undefined;
    };
    static validateAvailabilityQuery(input: unknown): {
        caregiverId: string;
        date: Date;
        includeTravel: boolean;
        startTime?: string | undefined;
        endTime?: string | undefined;
        duration?: number | undefined;
    };
}
//# sourceMappingURL=schedule-validator.d.ts.map