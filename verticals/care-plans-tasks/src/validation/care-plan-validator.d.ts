import { z } from 'zod';
import { CreateProgressNoteInput } from '../types/care-plan';
export declare const CreateCarePlanInputSchema: z.ZodObject<{
    clientId: z.ZodString;
    organizationId: z.ZodString;
    branchId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    planType: z.ZodEnum<{
        CUSTOM: "CUSTOM";
        PERSONAL_CARE: "PERSONAL_CARE";
        SKILLED_NURSING: "SKILLED_NURSING";
        RESPITE: "RESPITE";
        COMPANION: "COMPANION";
        THERAPY: "THERAPY";
        HOSPICE: "HOSPICE";
        LIVE_IN: "LIVE_IN";
    }>;
    effectiveDate: z.ZodCoercedDate<unknown>;
    expirationDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    goals: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            ON_TRACK: "ON_TRACK";
            ACHIEVED: "ACHIEVED";
            DISCONTINUED: "DISCONTINUED";
            NOT_STARTED: "NOT_STARTED";
            AT_RISK: "AT_RISK";
            PARTIALLY_ACHIEVED: "PARTIALLY_ACHIEVED";
            NOT_ACHIEVED: "NOT_ACHIEVED";
        }>;
        description: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
        priority: z.ZodEnum<{
            MEDIUM: "MEDIUM";
            LOW: "LOW";
            HIGH: "HIGH";
            URGENT: "URGENT";
        }>;
        category: z.ZodEnum<{
            OTHER: "OTHER";
            MOBILITY: "MOBILITY";
            MEDICATION_MANAGEMENT: "MEDICATION_MANAGEMENT";
            ADL: "ADL";
            EMOTIONAL_WELLBEING: "EMOTIONAL_WELLBEING";
            WOUND_CARE: "WOUND_CARE";
            SAFETY: "SAFETY";
            IADL: "IADL";
            NUTRITION: "NUTRITION";
            SOCIAL_ENGAGEMENT: "SOCIAL_ENGAGEMENT";
            COGNITIVE: "COGNITIVE";
            PAIN_MANAGEMENT: "PAIN_MANAGEMENT";
            CHRONIC_DISEASE_MANAGEMENT: "CHRONIC_DISEASE_MANAGEMENT";
        }>;
        outcome: z.ZodOptional<z.ZodString>;
        achievedDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        targetDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        interventionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        progressPercentage: z.ZodOptional<z.ZodNumber>;
        lastAssessedDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        unit: z.ZodOptional<z.ZodString>;
        measurementType: z.ZodOptional<z.ZodEnum<{
            QUANTITATIVE: "QUANTITATIVE";
            QUALITATIVE: "QUALITATIVE";
            BINARY: "BINARY";
        }>>;
        targetValue: z.ZodOptional<z.ZodNumber>;
        currentValue: z.ZodOptional<z.ZodNumber>;
        milestones: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            targetDate: z.ZodCoercedDate<unknown>;
            completedDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            status: z.ZodEnum<{
                PENDING: "PENDING";
                COMPLETED: "COMPLETED";
                MISSED: "MISSED";
            }>;
            notes: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        taskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
    interventions: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<{
            ACTIVE: "ACTIVE";
            SUSPENDED: "SUSPENDED";
            DISCONTINUED: "DISCONTINUED";
        }>;
        description: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        precautions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        contraindications: z.ZodOptional<z.ZodArray<z.ZodString>>;
        category: z.ZodEnum<{
            OTHER: "OTHER";
            AMBULATION_ASSISTANCE: "AMBULATION_ASSISTANCE";
            MEDICATION_REMINDER: "MEDICATION_REMINDER";
            ASSISTANCE_WITH_ADL: "ASSISTANCE_WITH_ADL";
            WOUND_CARE: "WOUND_CARE";
            TRANSFER_ASSISTANCE: "TRANSFER_ASSISTANCE";
            SAFETY_MONITORING: "SAFETY_MONITORING";
            SKIN_CARE: "SKIN_CARE";
            ASSISTANCE_WITH_IADL: "ASSISTANCE_WITH_IADL";
            MEDICATION_ADMINISTRATION: "MEDICATION_ADMINISTRATION";
            VITAL_SIGNS_MONITORING: "VITAL_SIGNS_MONITORING";
            RANGE_OF_MOTION: "RANGE_OF_MOTION";
            FALL_PREVENTION: "FALL_PREVENTION";
            NUTRITION_MEAL_PREP: "NUTRITION_MEAL_PREP";
            FEEDING_ASSISTANCE: "FEEDING_ASSISTANCE";
            HYDRATION_MONITORING: "HYDRATION_MONITORING";
            INCONTINENCE_CARE: "INCONTINENCE_CARE";
            COGNITIVE_STIMULATION: "COGNITIVE_STIMULATION";
            COMPANIONSHIP: "COMPANIONSHIP";
            TRANSPORTATION: "TRANSPORTATION";
            RESPITE_CARE: "RESPITE_CARE";
        }>;
        instructions: z.ZodString;
        requiresSupervision: z.ZodOptional<z.ZodBoolean>;
        startDate: z.ZodCoercedDate<unknown>;
        endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        goalIds: z.ZodArray<z.ZodString>;
        frequency: z.ZodObject<{
            pattern: z.ZodEnum<{
                DAILY: "DAILY";
                CUSTOM: "CUSTOM";
                WEEKLY: "WEEKLY";
                MONTHLY: "MONTHLY";
                BI_WEEKLY: "BI_WEEKLY";
                AS_NEEDED: "AS_NEEDED";
            }>;
            interval: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodOptional<z.ZodEnum<{
                HOURS: "HOURS";
                MINUTES: "MINUTES";
                DAYS: "DAYS";
                WEEKS: "WEEKS";
                MONTHS: "MONTHS";
            }>>;
            timesPerDay: z.ZodOptional<z.ZodNumber>;
            timesPerWeek: z.ZodOptional<z.ZodNumber>;
            specificTimes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            specificDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                MONDAY: "MONDAY";
                WEDNESDAY: "WEDNESDAY";
                FRIDAY: "FRIDAY";
                TUESDAY: "TUESDAY";
                THURSDAY: "THURSDAY";
                SATURDAY: "SATURDAY";
                SUNDAY: "SUNDAY";
            }>>>;
        }, z.core.$strip>;
        performedBy: z.ZodArray<z.ZodEnum<{
            CAREGIVER: "CAREGIVER";
            FAMILY: "FAMILY";
            CLIENT: "CLIENT";
            HHA: "HHA";
            CNA: "CNA";
            RN: "RN";
            LPN: "LPN";
            THERAPIST: "THERAPIST";
        }>>;
        supervisorRole: z.ZodOptional<z.ZodString>;
        requiredEquipment: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requiredSupplies: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requiresDocumentation: z.ZodBoolean;
        documentationTemplate: z.ZodOptional<z.ZodString>;
        expectedOutcome: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    taskTemplates: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            ARCHIVED: "ARCHIVED";
        }>;
        description: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        category: z.ZodEnum<{
            OTHER: "OTHER";
            MOBILITY: "MOBILITY";
            MEDICATION: "MEDICATION";
            PERSONAL_HYGIENE: "PERSONAL_HYGIENE";
            HOUSEKEEPING: "HOUSEKEEPING";
            TRANSFERRING: "TRANSFERRING";
            MONITORING: "MONITORING";
            COMPANIONSHIP: "COMPANIONSHIP";
            TRANSPORTATION: "TRANSPORTATION";
            BATHING: "BATHING";
            DRESSING: "DRESSING";
            GROOMING: "GROOMING";
            TOILETING: "TOILETING";
            AMBULATION: "AMBULATION";
            MEAL_PREPARATION: "MEAL_PREPARATION";
            FEEDING: "FEEDING";
            LAUNDRY: "LAUNDRY";
            SHOPPING: "SHOPPING";
            DOCUMENTATION: "DOCUMENTATION";
        }>;
        instructions: z.ZodString;
        skipReasons: z.ZodOptional<z.ZodArray<z.ZodString>>;
        qualityChecks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            question: z.ZodString;
            checkType: z.ZodEnum<{
                YES_NO: "YES_NO";
                TEXT: "TEXT";
                SCALE: "SCALE";
                CHECKLIST: "CHECKLIST";
            }>;
            required: z.ZodBoolean;
            options: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        interventionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            stepNumber: z.ZodNumber;
            description: z.ZodString;
            isRequired: z.ZodBoolean;
            estimatedDuration: z.ZodOptional<z.ZodNumber>;
            safetyNotes: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        requiresPhoto: z.ZodOptional<z.ZodBoolean>;
        requiresSignature: z.ZodBoolean;
        requiresNote: z.ZodBoolean;
        isOptional: z.ZodBoolean;
        frequency: z.ZodObject<{
            pattern: z.ZodEnum<{
                DAILY: "DAILY";
                CUSTOM: "CUSTOM";
                WEEKLY: "WEEKLY";
                MONTHLY: "MONTHLY";
                BI_WEEKLY: "BI_WEEKLY";
                AS_NEEDED: "AS_NEEDED";
            }>;
            interval: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodOptional<z.ZodEnum<{
                HOURS: "HOURS";
                MINUTES: "MINUTES";
                DAYS: "DAYS";
                WEEKS: "WEEKS";
                MONTHS: "MONTHS";
            }>>;
            timesPerDay: z.ZodOptional<z.ZodNumber>;
            timesPerWeek: z.ZodOptional<z.ZodNumber>;
            specificTimes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            specificDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                MONDAY: "MONDAY";
                WEDNESDAY: "WEDNESDAY";
                FRIDAY: "FRIDAY";
                TUESDAY: "TUESDAY";
                THURSDAY: "THURSDAY";
                SATURDAY: "SATURDAY";
                SUNDAY: "SUNDAY";
            }>>>;
        }, z.core.$strip>;
        estimatedDuration: z.ZodOptional<z.ZodNumber>;
        timeOfDay: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            MORNING: "MORNING";
            AFTERNOON: "AFTERNOON";
            EVENING: "EVENING";
            EARLY_MORNING: "EARLY_MORNING";
            NIGHT: "NIGHT";
            OVERNIGHT: "OVERNIGHT";
            ANY: "ANY";
        }>>>;
        requiresVitals: z.ZodOptional<z.ZodBoolean>;
        requiredFields: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            fieldType: z.ZodEnum<{
                TEXT: "TEXT";
                CHECKBOX: "CHECKBOX";
                SELECT: "SELECT";
                NUMBER: "NUMBER";
                DATE: "DATE";
                TIME: "TIME";
                BOOLEAN: "BOOLEAN";
                MULTI_SELECT: "MULTI_SELECT";
                TEXTAREA: "TEXTAREA";
                RADIO: "RADIO";
            }>;
            required: z.ZodBoolean;
            options: z.ZodOptional<z.ZodArray<z.ZodString>>;
            validation: z.ZodOptional<z.ZodObject<{
                pattern: z.ZodOptional<z.ZodString>;
                minLength: z.ZodOptional<z.ZodNumber>;
                maxLength: z.ZodOptional<z.ZodNumber>;
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                customValidator: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            defaultValue: z.ZodOptional<z.ZodUnknown>;
            helpText: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        allowSkip: z.ZodBoolean;
        verificationType: z.ZodOptional<z.ZodEnum<{
            CUSTOM: "CUSTOM";
            CHECKBOX: "CHECKBOX";
            PHOTO: "PHOTO";
            GPS: "GPS";
            NONE: "NONE";
            SIGNATURE: "SIGNATURE";
            BARCODE_SCAN: "BARCODE_SCAN";
            VITAL_SIGNS: "VITAL_SIGNS";
        }>>;
    }, z.core.$strip>>>;
    serviceFrequency: z.ZodOptional<z.ZodObject<{
        pattern: z.ZodEnum<{
            DAILY: "DAILY";
            CUSTOM: "CUSTOM";
            WEEKLY: "WEEKLY";
            MONTHLY: "MONTHLY";
            BI_WEEKLY: "BI_WEEKLY";
            AS_NEEDED: "AS_NEEDED";
        }>;
        timesPerWeek: z.ZodOptional<z.ZodNumber>;
        timesPerMonth: z.ZodOptional<z.ZodNumber>;
        specificDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            MONDAY: "MONDAY";
            WEDNESDAY: "WEDNESDAY";
            FRIDAY: "FRIDAY";
            TUESDAY: "TUESDAY";
            THURSDAY: "THURSDAY";
            SATURDAY: "SATURDAY";
            SUNDAY: "SUNDAY";
        }>>>;
        customSchedule: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    coordinatorId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const UpdateCarePlanInputSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        COMPLETED: "COMPLETED";
        ON_HOLD: "ON_HOLD";
        PENDING_APPROVAL: "PENDING_APPROVAL";
        DISCONTINUED: "DISCONTINUED";
    }>>;
    priority: z.ZodOptional<z.ZodEnum<{
        MEDIUM: "MEDIUM";
        LOW: "LOW";
        HIGH: "HIGH";
        URGENT: "URGENT";
    }>>;
    expirationDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    reviewDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    goals: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        category: z.ZodEnum<{
            OTHER: "OTHER";
            MOBILITY: "MOBILITY";
            MEDICATION_MANAGEMENT: "MEDICATION_MANAGEMENT";
            ADL: "ADL";
            EMOTIONAL_WELLBEING: "EMOTIONAL_WELLBEING";
            WOUND_CARE: "WOUND_CARE";
            SAFETY: "SAFETY";
            IADL: "IADL";
            NUTRITION: "NUTRITION";
            SOCIAL_ENGAGEMENT: "SOCIAL_ENGAGEMENT";
            COGNITIVE: "COGNITIVE";
            PAIN_MANAGEMENT: "PAIN_MANAGEMENT";
            CHRONIC_DISEASE_MANAGEMENT: "CHRONIC_DISEASE_MANAGEMENT";
        }>;
        targetDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        status: z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            ON_TRACK: "ON_TRACK";
            ACHIEVED: "ACHIEVED";
            DISCONTINUED: "DISCONTINUED";
            NOT_STARTED: "NOT_STARTED";
            AT_RISK: "AT_RISK";
            PARTIALLY_ACHIEVED: "PARTIALLY_ACHIEVED";
            NOT_ACHIEVED: "NOT_ACHIEVED";
        }>;
        priority: z.ZodEnum<{
            MEDIUM: "MEDIUM";
            LOW: "LOW";
            HIGH: "HIGH";
            URGENT: "URGENT";
        }>;
        measurementType: z.ZodOptional<z.ZodEnum<{
            QUANTITATIVE: "QUANTITATIVE";
            QUALITATIVE: "QUALITATIVE";
            BINARY: "BINARY";
        }>>;
        targetValue: z.ZodOptional<z.ZodNumber>;
        currentValue: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        milestones: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            targetDate: z.ZodCoercedDate<unknown>;
            completedDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            status: z.ZodEnum<{
                PENDING: "PENDING";
                COMPLETED: "COMPLETED";
                MISSED: "MISSED";
            }>;
            notes: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        progressPercentage: z.ZodOptional<z.ZodNumber>;
        lastAssessedDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        interventionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        taskIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        achievedDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        outcome: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    interventions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        category: z.ZodEnum<{
            OTHER: "OTHER";
            AMBULATION_ASSISTANCE: "AMBULATION_ASSISTANCE";
            MEDICATION_REMINDER: "MEDICATION_REMINDER";
            ASSISTANCE_WITH_ADL: "ASSISTANCE_WITH_ADL";
            WOUND_CARE: "WOUND_CARE";
            TRANSFER_ASSISTANCE: "TRANSFER_ASSISTANCE";
            SAFETY_MONITORING: "SAFETY_MONITORING";
            SKIN_CARE: "SKIN_CARE";
            ASSISTANCE_WITH_IADL: "ASSISTANCE_WITH_IADL";
            MEDICATION_ADMINISTRATION: "MEDICATION_ADMINISTRATION";
            VITAL_SIGNS_MONITORING: "VITAL_SIGNS_MONITORING";
            RANGE_OF_MOTION: "RANGE_OF_MOTION";
            FALL_PREVENTION: "FALL_PREVENTION";
            NUTRITION_MEAL_PREP: "NUTRITION_MEAL_PREP";
            FEEDING_ASSISTANCE: "FEEDING_ASSISTANCE";
            HYDRATION_MONITORING: "HYDRATION_MONITORING";
            INCONTINENCE_CARE: "INCONTINENCE_CARE";
            COGNITIVE_STIMULATION: "COGNITIVE_STIMULATION";
            COMPANIONSHIP: "COMPANIONSHIP";
            TRANSPORTATION: "TRANSPORTATION";
            RESPITE_CARE: "RESPITE_CARE";
        }>;
        goalIds: z.ZodArray<z.ZodString>;
        frequency: z.ZodObject<{
            pattern: z.ZodEnum<{
                DAILY: "DAILY";
                CUSTOM: "CUSTOM";
                WEEKLY: "WEEKLY";
                MONTHLY: "MONTHLY";
                BI_WEEKLY: "BI_WEEKLY";
                AS_NEEDED: "AS_NEEDED";
            }>;
            interval: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodOptional<z.ZodEnum<{
                HOURS: "HOURS";
                MINUTES: "MINUTES";
                DAYS: "DAYS";
                WEEKS: "WEEKS";
                MONTHS: "MONTHS";
            }>>;
            timesPerDay: z.ZodOptional<z.ZodNumber>;
            timesPerWeek: z.ZodOptional<z.ZodNumber>;
            specificTimes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            specificDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                MONDAY: "MONDAY";
                WEDNESDAY: "WEDNESDAY";
                FRIDAY: "FRIDAY";
                TUESDAY: "TUESDAY";
                THURSDAY: "THURSDAY";
                SATURDAY: "SATURDAY";
                SUNDAY: "SUNDAY";
            }>>>;
        }, z.core.$strip>;
        duration: z.ZodOptional<z.ZodNumber>;
        instructions: z.ZodString;
        precautions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        performedBy: z.ZodArray<z.ZodEnum<{
            CAREGIVER: "CAREGIVER";
            FAMILY: "FAMILY";
            CLIENT: "CLIENT";
            HHA: "HHA";
            CNA: "CNA";
            RN: "RN";
            LPN: "LPN";
            THERAPIST: "THERAPIST";
        }>>;
        requiresSupervision: z.ZodOptional<z.ZodBoolean>;
        supervisorRole: z.ZodOptional<z.ZodString>;
        requiredEquipment: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requiredSupplies: z.ZodOptional<z.ZodArray<z.ZodString>>;
        requiresDocumentation: z.ZodBoolean;
        documentationTemplate: z.ZodOptional<z.ZodString>;
        status: z.ZodEnum<{
            ACTIVE: "ACTIVE";
            SUSPENDED: "SUSPENDED";
            DISCONTINUED: "DISCONTINUED";
        }>;
        startDate: z.ZodCoercedDate<unknown>;
        endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        expectedOutcome: z.ZodOptional<z.ZodString>;
        contraindications: z.ZodOptional<z.ZodArray<z.ZodString>>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    taskTemplates: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        category: z.ZodEnum<{
            OTHER: "OTHER";
            MOBILITY: "MOBILITY";
            MEDICATION: "MEDICATION";
            PERSONAL_HYGIENE: "PERSONAL_HYGIENE";
            HOUSEKEEPING: "HOUSEKEEPING";
            TRANSFERRING: "TRANSFERRING";
            MONITORING: "MONITORING";
            COMPANIONSHIP: "COMPANIONSHIP";
            TRANSPORTATION: "TRANSPORTATION";
            BATHING: "BATHING";
            DRESSING: "DRESSING";
            GROOMING: "GROOMING";
            TOILETING: "TOILETING";
            AMBULATION: "AMBULATION";
            MEAL_PREPARATION: "MEAL_PREPARATION";
            FEEDING: "FEEDING";
            LAUNDRY: "LAUNDRY";
            SHOPPING: "SHOPPING";
            DOCUMENTATION: "DOCUMENTATION";
        }>;
        interventionIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        frequency: z.ZodObject<{
            pattern: z.ZodEnum<{
                DAILY: "DAILY";
                CUSTOM: "CUSTOM";
                WEEKLY: "WEEKLY";
                MONTHLY: "MONTHLY";
                BI_WEEKLY: "BI_WEEKLY";
                AS_NEEDED: "AS_NEEDED";
            }>;
            interval: z.ZodOptional<z.ZodNumber>;
            unit: z.ZodOptional<z.ZodEnum<{
                HOURS: "HOURS";
                MINUTES: "MINUTES";
                DAYS: "DAYS";
                WEEKS: "WEEKS";
                MONTHS: "MONTHS";
            }>>;
            timesPerDay: z.ZodOptional<z.ZodNumber>;
            timesPerWeek: z.ZodOptional<z.ZodNumber>;
            specificTimes: z.ZodOptional<z.ZodArray<z.ZodString>>;
            specificDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                MONDAY: "MONDAY";
                WEDNESDAY: "WEDNESDAY";
                FRIDAY: "FRIDAY";
                TUESDAY: "TUESDAY";
                THURSDAY: "THURSDAY";
                SATURDAY: "SATURDAY";
                SUNDAY: "SUNDAY";
            }>>>;
        }, z.core.$strip>;
        estimatedDuration: z.ZodOptional<z.ZodNumber>;
        timeOfDay: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            MORNING: "MORNING";
            AFTERNOON: "AFTERNOON";
            EVENING: "EVENING";
            EARLY_MORNING: "EARLY_MORNING";
            NIGHT: "NIGHT";
            OVERNIGHT: "OVERNIGHT";
            ANY: "ANY";
        }>>>;
        instructions: z.ZodString;
        steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
            stepNumber: z.ZodNumber;
            description: z.ZodString;
            isRequired: z.ZodBoolean;
            estimatedDuration: z.ZodOptional<z.ZodNumber>;
            safetyNotes: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        requiresSignature: z.ZodBoolean;
        requiresNote: z.ZodBoolean;
        requiresPhoto: z.ZodOptional<z.ZodBoolean>;
        requiresVitals: z.ZodOptional<z.ZodBoolean>;
        requiredFields: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            fieldType: z.ZodEnum<{
                TEXT: "TEXT";
                CHECKBOX: "CHECKBOX";
                SELECT: "SELECT";
                NUMBER: "NUMBER";
                DATE: "DATE";
                TIME: "TIME";
                BOOLEAN: "BOOLEAN";
                MULTI_SELECT: "MULTI_SELECT";
                TEXTAREA: "TEXTAREA";
                RADIO: "RADIO";
            }>;
            required: z.ZodBoolean;
            options: z.ZodOptional<z.ZodArray<z.ZodString>>;
            validation: z.ZodOptional<z.ZodObject<{
                pattern: z.ZodOptional<z.ZodString>;
                minLength: z.ZodOptional<z.ZodNumber>;
                maxLength: z.ZodOptional<z.ZodNumber>;
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                customValidator: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            defaultValue: z.ZodOptional<z.ZodUnknown>;
            helpText: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
        isOptional: z.ZodBoolean;
        allowSkip: z.ZodBoolean;
        skipReasons: z.ZodOptional<z.ZodArray<z.ZodString>>;
        verificationType: z.ZodOptional<z.ZodEnum<{
            CUSTOM: "CUSTOM";
            CHECKBOX: "CHECKBOX";
            PHOTO: "PHOTO";
            GPS: "GPS";
            NONE: "NONE";
            SIGNATURE: "SIGNATURE";
            BARCODE_SCAN: "BARCODE_SCAN";
            VITAL_SIGNS: "VITAL_SIGNS";
        }>>;
        qualityChecks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            question: z.ZodString;
            checkType: z.ZodEnum<{
                YES_NO: "YES_NO";
                TEXT: "TEXT";
                SCALE: "SCALE";
                CHECKLIST: "CHECKLIST";
            }>;
            required: z.ZodBoolean;
            options: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>>;
        status: z.ZodEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            ARCHIVED: "ARCHIVED";
        }>;
        notes: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    serviceFrequency: z.ZodOptional<z.ZodObject<{
        pattern: z.ZodEnum<{
            DAILY: "DAILY";
            CUSTOM: "CUSTOM";
            WEEKLY: "WEEKLY";
            MONTHLY: "MONTHLY";
            BI_WEEKLY: "BI_WEEKLY";
            AS_NEEDED: "AS_NEEDED";
        }>;
        timesPerWeek: z.ZodOptional<z.ZodNumber>;
        timesPerMonth: z.ZodOptional<z.ZodNumber>;
        specificDays: z.ZodOptional<z.ZodArray<z.ZodEnum<{
            MONDAY: "MONDAY";
            WEDNESDAY: "WEDNESDAY";
            FRIDAY: "FRIDAY";
            TUESDAY: "TUESDAY";
            THURSDAY: "THURSDAY";
            SATURDAY: "SATURDAY";
            SUNDAY: "SUNDAY";
        }>>>;
        customSchedule: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateTaskInstanceInputSchema: z.ZodObject<{
    carePlanId: z.ZodString;
    templateId: z.ZodOptional<z.ZodString>;
    visitId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodString;
    assignedCaregiverId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<{
        OTHER: "OTHER";
        MOBILITY: "MOBILITY";
        MEDICATION: "MEDICATION";
        PERSONAL_HYGIENE: "PERSONAL_HYGIENE";
        HOUSEKEEPING: "HOUSEKEEPING";
        TRANSFERRING: "TRANSFERRING";
        MONITORING: "MONITORING";
        COMPANIONSHIP: "COMPANIONSHIP";
        TRANSPORTATION: "TRANSPORTATION";
        BATHING: "BATHING";
        DRESSING: "DRESSING";
        GROOMING: "GROOMING";
        TOILETING: "TOILETING";
        AMBULATION: "AMBULATION";
        MEAL_PREPARATION: "MEAL_PREPARATION";
        FEEDING: "FEEDING";
        LAUNDRY: "LAUNDRY";
        SHOPPING: "SHOPPING";
        DOCUMENTATION: "DOCUMENTATION";
    }>;
    instructions: z.ZodString;
    scheduledDate: z.ZodCoercedDate<unknown>;
    scheduledTime: z.ZodOptional<z.ZodString>;
    requiredSignature: z.ZodBoolean;
    requiredNote: z.ZodBoolean;
}, z.core.$strip>;
export declare const CompleteTaskInputSchema: z.ZodObject<{
    completionNote: z.ZodOptional<z.ZodString>;
    signature: z.ZodOptional<z.ZodObject<{
        signatureData: z.ZodString;
        signedBy: z.ZodString;
        signedByName: z.ZodString;
        signatureType: z.ZodEnum<{
            ELECTRONIC: "ELECTRONIC";
            STYLUS: "STYLUS";
            TOUCHSCREEN: "TOUCHSCREEN";
        }>;
        ipAddress: z.ZodOptional<z.ZodString>;
        deviceInfo: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    verificationData: z.ZodOptional<z.ZodObject<{
        verificationType: z.ZodEnum<{
            CUSTOM: "CUSTOM";
            CHECKBOX: "CHECKBOX";
            PHOTO: "PHOTO";
            GPS: "GPS";
            NONE: "NONE";
            SIGNATURE: "SIGNATURE";
            BARCODE_SCAN: "BARCODE_SCAN";
            VITAL_SIGNS: "VITAL_SIGNS";
        }>;
        gpsLocation: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            accuracy: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        photoUrls: z.ZodOptional<z.ZodArray<z.ZodString>>;
        barcodeData: z.ZodOptional<z.ZodString>;
        vitalSigns: z.ZodOptional<z.ZodObject<{
            bloodPressureSystolic: z.ZodOptional<z.ZodNumber>;
            bloodPressureDiastolic: z.ZodOptional<z.ZodNumber>;
            heartRate: z.ZodOptional<z.ZodNumber>;
            temperature: z.ZodOptional<z.ZodNumber>;
            temperatureUnit: z.ZodOptional<z.ZodEnum<{
                F: "F";
                C: "C";
            }>>;
            oxygenSaturation: z.ZodOptional<z.ZodNumber>;
            respiratoryRate: z.ZodOptional<z.ZodNumber>;
            bloodGlucose: z.ZodOptional<z.ZodNumber>;
            weight: z.ZodOptional<z.ZodNumber>;
            weightUnit: z.ZodOptional<z.ZodEnum<{
                LBS: "LBS";
                KG: "KG";
            }>>;
            pain: z.ZodOptional<z.ZodNumber>;
            notes: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        customData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    qualityCheckResponses: z.ZodOptional<z.ZodArray<z.ZodObject<{
        checkId: z.ZodString;
        question: z.ZodString;
        response: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString>]>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    customFieldValues: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const CreateProgressNoteInputSchema: z.ZodObject<{
    carePlanId: z.ZodString;
    clientId: z.ZodString;
    visitId: z.ZodOptional<z.ZodString>;
    noteType: z.ZodEnum<{
        OTHER: "OTHER";
        VISIT_NOTE: "VISIT_NOTE";
        WEEKLY_SUMMARY: "WEEKLY_SUMMARY";
        MONTHLY_SUMMARY: "MONTHLY_SUMMARY";
        CARE_PLAN_REVIEW: "CARE_PLAN_REVIEW";
        INCIDENT: "INCIDENT";
        CHANGE_IN_CONDITION: "CHANGE_IN_CONDITION";
        COMMUNICATION: "COMMUNICATION";
    }>;
    content: z.ZodString;
    goalProgress: z.ZodOptional<z.ZodArray<z.ZodObject<{
        goalId: z.ZodString;
        goalName: z.ZodString;
        status: z.ZodEnum<{
            IN_PROGRESS: "IN_PROGRESS";
            ON_TRACK: "ON_TRACK";
            ACHIEVED: "ACHIEVED";
            DISCONTINUED: "DISCONTINUED";
            NOT_STARTED: "NOT_STARTED";
            AT_RISK: "AT_RISK";
            PARTIALLY_ACHIEVED: "PARTIALLY_ACHIEVED";
            NOT_ACHIEVED: "NOT_ACHIEVED";
        }>;
        progressDescription: z.ZodString;
        progressPercentage: z.ZodOptional<z.ZodNumber>;
        barriers: z.ZodOptional<z.ZodArray<z.ZodString>>;
        nextSteps: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    observations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<{
            PHYSICAL: "PHYSICAL";
            BEHAVIORAL: "BEHAVIORAL";
            EMOTIONAL: "EMOTIONAL";
            SOCIAL: "SOCIAL";
            SAFETY: "SAFETY";
            COGNITIVE: "COGNITIVE";
            ENVIRONMENTAL: "ENVIRONMENTAL";
        }>;
        observation: z.ZodString;
        severity: z.ZodOptional<z.ZodEnum<{
            NORMAL: "NORMAL";
            URGENT: "URGENT";
            ATTENTION: "ATTENTION";
        }>>;
        timestamp: z.ZodCoercedDate<unknown>;
    }, z.core.$strip>>>;
    concerns: z.ZodOptional<z.ZodArray<z.ZodString>>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodString>>;
    signature: z.ZodOptional<z.ZodObject<{
        ipAddress: z.ZodOptional<z.ZodString>;
        signatureData: z.ZodString;
        signedBy: z.ZodString;
        signedByName: z.ZodString;
        signatureType: z.ZodEnum<{
            ELECTRONIC: "ELECTRONIC";
            STYLUS: "STYLUS";
            TOUCHSCREEN: "TOUCHSCREEN";
        }>;
        deviceInfo: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CarePlanSearchFiltersSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    branchId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        DRAFT: "DRAFT";
        EXPIRED: "EXPIRED";
        COMPLETED: "COMPLETED";
        ON_HOLD: "ON_HOLD";
        PENDING_APPROVAL: "PENDING_APPROVAL";
        DISCONTINUED: "DISCONTINUED";
    }>>>;
    planType: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        CUSTOM: "CUSTOM";
        PERSONAL_CARE: "PERSONAL_CARE";
        SKILLED_NURSING: "SKILLED_NURSING";
        RESPITE: "RESPITE";
        COMPANION: "COMPANION";
        THERAPY: "THERAPY";
        HOSPICE: "HOSPICE";
        LIVE_IN: "LIVE_IN";
    }>>>;
    coordinatorId: z.ZodOptional<z.ZodString>;
    expiringWithinDays: z.ZodOptional<z.ZodNumber>;
    needsReview: z.ZodOptional<z.ZodBoolean>;
    complianceStatus: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        PENDING_REVIEW: "PENDING_REVIEW";
        EXPIRED: "EXPIRED";
        COMPLIANT: "COMPLIANT";
        NON_COMPLIANT: "NON_COMPLIANT";
    }>>>;
}, z.core.$strip>;
export declare const TaskInstanceSearchFiltersSchema: z.ZodObject<{
    carePlanId: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    assignedCaregiverId: z.ZodOptional<z.ZodString>;
    visitId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        SCHEDULED: "SCHEDULED";
        IN_PROGRESS: "IN_PROGRESS";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
        SKIPPED: "SKIPPED";
        MISSED: "MISSED";
        ISSUE_REPORTED: "ISSUE_REPORTED";
    }>>>;
    category: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        OTHER: "OTHER";
        MOBILITY: "MOBILITY";
        MEDICATION: "MEDICATION";
        PERSONAL_HYGIENE: "PERSONAL_HYGIENE";
        HOUSEKEEPING: "HOUSEKEEPING";
        TRANSFERRING: "TRANSFERRING";
        MONITORING: "MONITORING";
        COMPANIONSHIP: "COMPANIONSHIP";
        TRANSPORTATION: "TRANSPORTATION";
        BATHING: "BATHING";
        DRESSING: "DRESSING";
        GROOMING: "GROOMING";
        TOILETING: "TOILETING";
        AMBULATION: "AMBULATION";
        MEAL_PREPARATION: "MEAL_PREPARATION";
        FEEDING: "FEEDING";
        LAUNDRY: "LAUNDRY";
        SHOPPING: "SHOPPING";
        DOCUMENTATION: "DOCUMENTATION";
    }>>>;
    scheduledDateFrom: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    scheduledDateTo: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    overdue: z.ZodOptional<z.ZodBoolean>;
    requiresSignature: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare class CarePlanValidator {
    static validateCreateCarePlan(input: unknown): {
        clientId: string;
        organizationId: string;
        name: string;
        planType: "CUSTOM" | "PERSONAL_CARE" | "SKILLED_NURSING" | "RESPITE" | "COMPANION" | "THERAPY" | "HOSPICE" | "LIVE_IN";
        effectiveDate: Date;
        goals: {
            name: string;
            status: "IN_PROGRESS" | "ON_TRACK" | "ACHIEVED" | "DISCONTINUED" | "NOT_STARTED" | "AT_RISK" | "PARTIALLY_ACHIEVED" | "NOT_ACHIEVED";
            description: string;
            priority: "MEDIUM" | "LOW" | "HIGH" | "URGENT";
            category: "OTHER" | "MOBILITY" | "MEDICATION_MANAGEMENT" | "ADL" | "EMOTIONAL_WELLBEING" | "WOUND_CARE" | "SAFETY" | "IADL" | "NUTRITION" | "SOCIAL_ENGAGEMENT" | "COGNITIVE" | "PAIN_MANAGEMENT" | "CHRONIC_DISEASE_MANAGEMENT";
            notes?: string | undefined;
            outcome?: string | undefined;
            achievedDate?: Date | undefined;
            targetDate?: Date | undefined;
            interventionIds?: string[] | undefined;
            progressPercentage?: number | undefined;
            lastAssessedDate?: Date | undefined;
            unit?: string | undefined;
            measurementType?: "QUANTITATIVE" | "QUALITATIVE" | "BINARY" | undefined;
            targetValue?: number | undefined;
            currentValue?: number | undefined;
            milestones?: {
                id: string;
                name: string;
                targetDate: Date;
                status: "PENDING" | "COMPLETED" | "MISSED";
                completedDate?: Date | undefined;
                notes?: string | undefined;
            }[] | undefined;
            taskIds?: string[] | undefined;
        }[];
        interventions: {
            name: string;
            status: "ACTIVE" | "SUSPENDED" | "DISCONTINUED";
            description: string;
            category: "OTHER" | "AMBULATION_ASSISTANCE" | "MEDICATION_REMINDER" | "ASSISTANCE_WITH_ADL" | "WOUND_CARE" | "TRANSFER_ASSISTANCE" | "SAFETY_MONITORING" | "SKIN_CARE" | "ASSISTANCE_WITH_IADL" | "MEDICATION_ADMINISTRATION" | "VITAL_SIGNS_MONITORING" | "RANGE_OF_MOTION" | "FALL_PREVENTION" | "NUTRITION_MEAL_PREP" | "FEEDING_ASSISTANCE" | "HYDRATION_MONITORING" | "INCONTINENCE_CARE" | "COGNITIVE_STIMULATION" | "COMPANIONSHIP" | "TRANSPORTATION" | "RESPITE_CARE";
            instructions: string;
            startDate: Date;
            goalIds: string[];
            frequency: {
                pattern: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BI_WEEKLY" | "AS_NEEDED";
                interval?: number | undefined;
                unit?: "HOURS" | "MINUTES" | "DAYS" | "WEEKS" | "MONTHS" | undefined;
                timesPerDay?: number | undefined;
                timesPerWeek?: number | undefined;
                specificTimes?: string[] | undefined;
                specificDays?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            };
            performedBy: ("CAREGIVER" | "FAMILY" | "CLIENT" | "HHA" | "CNA" | "RN" | "LPN" | "THERAPIST")[];
            requiresDocumentation: boolean;
            notes?: string | undefined;
            duration?: number | undefined;
            precautions?: string[] | undefined;
            contraindications?: string[] | undefined;
            requiresSupervision?: boolean | undefined;
            endDate?: Date | undefined;
            supervisorRole?: string | undefined;
            requiredEquipment?: string[] | undefined;
            requiredSupplies?: string[] | undefined;
            documentationTemplate?: string | undefined;
            expectedOutcome?: string | undefined;
        }[];
        branchId?: string | undefined;
        expirationDate?: Date | undefined;
        taskTemplates?: {
            name: string;
            status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
            description: string;
            category: "OTHER" | "MOBILITY" | "MEDICATION" | "PERSONAL_HYGIENE" | "HOUSEKEEPING" | "TRANSFERRING" | "MONITORING" | "COMPANIONSHIP" | "TRANSPORTATION" | "BATHING" | "DRESSING" | "GROOMING" | "TOILETING" | "AMBULATION" | "MEAL_PREPARATION" | "FEEDING" | "LAUNDRY" | "SHOPPING" | "DOCUMENTATION";
            instructions: string;
            requiresSignature: boolean;
            requiresNote: boolean;
            isOptional: boolean;
            frequency: {
                pattern: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BI_WEEKLY" | "AS_NEEDED";
                interval?: number | undefined;
                unit?: "HOURS" | "MINUTES" | "DAYS" | "WEEKS" | "MONTHS" | undefined;
                timesPerDay?: number | undefined;
                timesPerWeek?: number | undefined;
                specificTimes?: string[] | undefined;
                specificDays?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            };
            allowSkip: boolean;
            notes?: string | undefined;
            tags?: string[] | undefined;
            skipReasons?: string[] | undefined;
            qualityChecks?: {
                id: string;
                question: string;
                checkType: "YES_NO" | "TEXT" | "SCALE" | "CHECKLIST";
                required: boolean;
                options?: string[] | undefined;
            }[] | undefined;
            interventionIds?: string[] | undefined;
            steps?: {
                stepNumber: number;
                description: string;
                isRequired: boolean;
                estimatedDuration?: number | undefined;
                safetyNotes?: string | undefined;
            }[] | undefined;
            requiresPhoto?: boolean | undefined;
            estimatedDuration?: number | undefined;
            timeOfDay?: ("MORNING" | "AFTERNOON" | "EVENING" | "EARLY_MORNING" | "NIGHT" | "OVERNIGHT" | "ANY")[] | undefined;
            requiresVitals?: boolean | undefined;
            requiredFields?: {
                id: string;
                name: string;
                fieldType: "TEXT" | "CHECKBOX" | "SELECT" | "NUMBER" | "DATE" | "TIME" | "BOOLEAN" | "MULTI_SELECT" | "TEXTAREA" | "RADIO";
                required: boolean;
                options?: string[] | undefined;
                validation?: {
                    pattern?: string | undefined;
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    min?: number | undefined;
                    max?: number | undefined;
                    customValidator?: string | undefined;
                } | undefined;
                defaultValue?: unknown;
                helpText?: string | undefined;
            }[] | undefined;
            verificationType?: "CUSTOM" | "CHECKBOX" | "PHOTO" | "GPS" | "NONE" | "SIGNATURE" | "BARCODE_SCAN" | "VITAL_SIGNS" | undefined;
        }[] | undefined;
        serviceFrequency?: {
            pattern: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BI_WEEKLY" | "AS_NEEDED";
            timesPerWeek?: number | undefined;
            timesPerMonth?: number | undefined;
            specificDays?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            customSchedule?: string | undefined;
        } | undefined;
        coordinatorId?: string | undefined;
        notes?: string | undefined;
    };
    static validateUpdateCarePlan(input: unknown): {
        name?: string | undefined;
        status?: "ACTIVE" | "DRAFT" | "EXPIRED" | "COMPLETED" | "ON_HOLD" | "PENDING_APPROVAL" | "DISCONTINUED" | undefined;
        priority?: "MEDIUM" | "LOW" | "HIGH" | "URGENT" | undefined;
        expirationDate?: Date | undefined;
        reviewDate?: Date | undefined;
        goals?: {
            id: string;
            name: string;
            description: string;
            category: "OTHER" | "MOBILITY" | "MEDICATION_MANAGEMENT" | "ADL" | "EMOTIONAL_WELLBEING" | "WOUND_CARE" | "SAFETY" | "IADL" | "NUTRITION" | "SOCIAL_ENGAGEMENT" | "COGNITIVE" | "PAIN_MANAGEMENT" | "CHRONIC_DISEASE_MANAGEMENT";
            status: "IN_PROGRESS" | "ON_TRACK" | "ACHIEVED" | "DISCONTINUED" | "NOT_STARTED" | "AT_RISK" | "PARTIALLY_ACHIEVED" | "NOT_ACHIEVED";
            priority: "MEDIUM" | "LOW" | "HIGH" | "URGENT";
            targetDate?: Date | undefined;
            measurementType?: "QUANTITATIVE" | "QUALITATIVE" | "BINARY" | undefined;
            targetValue?: number | undefined;
            currentValue?: number | undefined;
            unit?: string | undefined;
            milestones?: {
                id: string;
                name: string;
                targetDate: Date;
                status: "PENDING" | "COMPLETED" | "MISSED";
                completedDate?: Date | undefined;
                notes?: string | undefined;
            }[] | undefined;
            progressPercentage?: number | undefined;
            lastAssessedDate?: Date | undefined;
            interventionIds?: string[] | undefined;
            taskIds?: string[] | undefined;
            achievedDate?: Date | undefined;
            outcome?: string | undefined;
            notes?: string | undefined;
        }[] | undefined;
        interventions?: {
            id: string;
            name: string;
            description: string;
            category: "OTHER" | "AMBULATION_ASSISTANCE" | "MEDICATION_REMINDER" | "ASSISTANCE_WITH_ADL" | "WOUND_CARE" | "TRANSFER_ASSISTANCE" | "SAFETY_MONITORING" | "SKIN_CARE" | "ASSISTANCE_WITH_IADL" | "MEDICATION_ADMINISTRATION" | "VITAL_SIGNS_MONITORING" | "RANGE_OF_MOTION" | "FALL_PREVENTION" | "NUTRITION_MEAL_PREP" | "FEEDING_ASSISTANCE" | "HYDRATION_MONITORING" | "INCONTINENCE_CARE" | "COGNITIVE_STIMULATION" | "COMPANIONSHIP" | "TRANSPORTATION" | "RESPITE_CARE";
            goalIds: string[];
            frequency: {
                pattern: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BI_WEEKLY" | "AS_NEEDED";
                interval?: number | undefined;
                unit?: "HOURS" | "MINUTES" | "DAYS" | "WEEKS" | "MONTHS" | undefined;
                timesPerDay?: number | undefined;
                timesPerWeek?: number | undefined;
                specificTimes?: string[] | undefined;
                specificDays?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            };
            instructions: string;
            performedBy: ("CAREGIVER" | "FAMILY" | "CLIENT" | "HHA" | "CNA" | "RN" | "LPN" | "THERAPIST")[];
            requiresDocumentation: boolean;
            status: "ACTIVE" | "SUSPENDED" | "DISCONTINUED";
            startDate: Date;
            duration?: number | undefined;
            precautions?: string[] | undefined;
            requiresSupervision?: boolean | undefined;
            supervisorRole?: string | undefined;
            requiredEquipment?: string[] | undefined;
            requiredSupplies?: string[] | undefined;
            documentationTemplate?: string | undefined;
            endDate?: Date | undefined;
            expectedOutcome?: string | undefined;
            contraindications?: string[] | undefined;
            notes?: string | undefined;
        }[] | undefined;
        taskTemplates?: {
            id: string;
            name: string;
            description: string;
            category: "OTHER" | "MOBILITY" | "MEDICATION" | "PERSONAL_HYGIENE" | "HOUSEKEEPING" | "TRANSFERRING" | "MONITORING" | "COMPANIONSHIP" | "TRANSPORTATION" | "BATHING" | "DRESSING" | "GROOMING" | "TOILETING" | "AMBULATION" | "MEAL_PREPARATION" | "FEEDING" | "LAUNDRY" | "SHOPPING" | "DOCUMENTATION";
            frequency: {
                pattern: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BI_WEEKLY" | "AS_NEEDED";
                interval?: number | undefined;
                unit?: "HOURS" | "MINUTES" | "DAYS" | "WEEKS" | "MONTHS" | undefined;
                timesPerDay?: number | undefined;
                timesPerWeek?: number | undefined;
                specificTimes?: string[] | undefined;
                specificDays?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            };
            instructions: string;
            requiresSignature: boolean;
            requiresNote: boolean;
            isOptional: boolean;
            allowSkip: boolean;
            status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
            interventionIds?: string[] | undefined;
            estimatedDuration?: number | undefined;
            timeOfDay?: ("MORNING" | "AFTERNOON" | "EVENING" | "EARLY_MORNING" | "NIGHT" | "OVERNIGHT" | "ANY")[] | undefined;
            steps?: {
                stepNumber: number;
                description: string;
                isRequired: boolean;
                estimatedDuration?: number | undefined;
                safetyNotes?: string | undefined;
            }[] | undefined;
            requiresPhoto?: boolean | undefined;
            requiresVitals?: boolean | undefined;
            requiredFields?: {
                id: string;
                name: string;
                fieldType: "TEXT" | "CHECKBOX" | "SELECT" | "NUMBER" | "DATE" | "TIME" | "BOOLEAN" | "MULTI_SELECT" | "TEXTAREA" | "RADIO";
                required: boolean;
                options?: string[] | undefined;
                validation?: {
                    pattern?: string | undefined;
                    minLength?: number | undefined;
                    maxLength?: number | undefined;
                    min?: number | undefined;
                    max?: number | undefined;
                    customValidator?: string | undefined;
                } | undefined;
                defaultValue?: unknown;
                helpText?: string | undefined;
            }[] | undefined;
            skipReasons?: string[] | undefined;
            verificationType?: "CUSTOM" | "CHECKBOX" | "PHOTO" | "GPS" | "NONE" | "SIGNATURE" | "BARCODE_SCAN" | "VITAL_SIGNS" | undefined;
            qualityChecks?: {
                id: string;
                question: string;
                checkType: "YES_NO" | "TEXT" | "SCALE" | "CHECKLIST";
                required: boolean;
                options?: string[] | undefined;
            }[] | undefined;
            notes?: string | undefined;
            tags?: string[] | undefined;
        }[] | undefined;
        serviceFrequency?: {
            pattern: "DAILY" | "CUSTOM" | "WEEKLY" | "MONTHLY" | "BI_WEEKLY" | "AS_NEEDED";
            timesPerWeek?: number | undefined;
            timesPerMonth?: number | undefined;
            specificDays?: ("MONDAY" | "WEDNESDAY" | "FRIDAY" | "TUESDAY" | "THURSDAY" | "SATURDAY" | "SUNDAY")[] | undefined;
            customSchedule?: string | undefined;
        } | undefined;
        notes?: string | undefined;
    };
    static validateCreateTaskInstance(input: unknown): {
        carePlanId: string;
        clientId: string;
        name: string;
        description: string;
        category: "OTHER" | "MOBILITY" | "MEDICATION" | "PERSONAL_HYGIENE" | "HOUSEKEEPING" | "TRANSFERRING" | "MONITORING" | "COMPANIONSHIP" | "TRANSPORTATION" | "BATHING" | "DRESSING" | "GROOMING" | "TOILETING" | "AMBULATION" | "MEAL_PREPARATION" | "FEEDING" | "LAUNDRY" | "SHOPPING" | "DOCUMENTATION";
        instructions: string;
        scheduledDate: Date;
        requiredSignature: boolean;
        requiredNote: boolean;
        templateId?: string | undefined;
        visitId?: string | undefined;
        assignedCaregiverId?: string | undefined;
        scheduledTime?: string | undefined;
    };
    static validateCompleteTask(input: unknown): {
        completionNote?: string | undefined;
        signature?: {
            signatureData: string;
            signedBy: string;
            signedByName: string;
            signatureType: "ELECTRONIC" | "STYLUS" | "TOUCHSCREEN";
            ipAddress?: string | undefined;
            deviceInfo?: string | undefined;
        } | undefined;
        verificationData?: {
            verificationType: "CUSTOM" | "CHECKBOX" | "PHOTO" | "GPS" | "NONE" | "SIGNATURE" | "BARCODE_SCAN" | "VITAL_SIGNS";
            gpsLocation?: {
                latitude: number;
                longitude: number;
                accuracy?: number | undefined;
            } | undefined;
            photoUrls?: string[] | undefined;
            barcodeData?: string | undefined;
            vitalSigns?: {
                bloodPressureSystolic?: number | undefined;
                bloodPressureDiastolic?: number | undefined;
                heartRate?: number | undefined;
                temperature?: number | undefined;
                temperatureUnit?: "F" | "C" | undefined;
                oxygenSaturation?: number | undefined;
                respiratoryRate?: number | undefined;
                bloodGlucose?: number | undefined;
                weight?: number | undefined;
                weightUnit?: "LBS" | "KG" | undefined;
                pain?: number | undefined;
                notes?: string | undefined;
            } | undefined;
            customData?: Record<string, unknown> | undefined;
        } | undefined;
        qualityCheckResponses?: {
            checkId: string;
            question: string;
            response: string | number | boolean | string[];
            notes?: string | undefined;
        }[] | undefined;
        customFieldValues?: Record<string, unknown> | undefined;
    };
    static validateCreateProgressNote(input: unknown): CreateProgressNoteInput;
    static validateCarePlanSearchFilters(input: unknown): {
        query?: string | undefined;
        clientId?: string | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        status?: ("ACTIVE" | "DRAFT" | "EXPIRED" | "COMPLETED" | "ON_HOLD" | "PENDING_APPROVAL" | "DISCONTINUED")[] | undefined;
        planType?: ("CUSTOM" | "PERSONAL_CARE" | "SKILLED_NURSING" | "RESPITE" | "COMPANION" | "THERAPY" | "HOSPICE" | "LIVE_IN")[] | undefined;
        coordinatorId?: string | undefined;
        expiringWithinDays?: number | undefined;
        needsReview?: boolean | undefined;
        complianceStatus?: ("PENDING_REVIEW" | "EXPIRED" | "COMPLIANT" | "NON_COMPLIANT")[] | undefined;
    };
    static validateTaskInstanceSearchFilters(input: unknown): {
        carePlanId?: string | undefined;
        clientId?: string | undefined;
        assignedCaregiverId?: string | undefined;
        visitId?: string | undefined;
        status?: ("SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "SKIPPED" | "MISSED" | "ISSUE_REPORTED")[] | undefined;
        category?: ("OTHER" | "MOBILITY" | "MEDICATION" | "PERSONAL_HYGIENE" | "HOUSEKEEPING" | "TRANSFERRING" | "MONITORING" | "COMPANIONSHIP" | "TRANSPORTATION" | "BATHING" | "DRESSING" | "GROOMING" | "TOILETING" | "AMBULATION" | "MEAL_PREPARATION" | "FEEDING" | "LAUNDRY" | "SHOPPING" | "DOCUMENTATION")[] | undefined;
        scheduledDateFrom?: Date | undefined;
        scheduledDateTo?: Date | undefined;
        overdue?: boolean | undefined;
        requiresSignature?: boolean | undefined;
    };
    static validateTaskCompletion(task: {
        requiredSignature: boolean;
        requiredNote: boolean;
    }, completion: {
        signature?: unknown;
        completionNote?: string;
    }): {
        valid: boolean;
        errors: string[];
    };
    static validateVitalSigns(vitals: unknown): {
        valid: boolean;
        warnings: string[];
    };
    static validateCarePlanActivation(plan: {
        goals: unknown[];
        interventions: unknown[];
        effectiveDate: Date;
        expirationDate?: Date;
        coordinatorId?: string;
    }): {
        valid: boolean;
        errors: string[];
    };
}
export default CarePlanValidator;
//# sourceMappingURL=care-plan-validator.d.ts.map