import { Caregiver, Credential, TrainingRecord, CaregiverStatus, ComplianceStatus, Phone } from '../types/caregiver';
export declare function calculateAge(dateOfBirth: Date | string): number;
export declare function calculateDetailedAge(dateOfBirth: Date | string): {
    years: number;
    months: number;
};
export declare function calculateYearsOfService(hireDate: Date | string): number;
export declare function getFullName(caregiver: Pick<Caregiver, 'firstName' | 'middleName' | 'lastName' | 'preferredName'>, options?: {
    includeMiddle?: boolean;
    showPreferred?: boolean;
}): string;
export declare function getDisplayName(caregiver: Pick<Caregiver, 'firstName' | 'preferredName'>): string;
export declare function formatPhoneNumber(phone: string | Phone): string;
export declare function getPrimaryEmergencyContact(caregiver: Pick<Caregiver, 'emergencyContacts'>): import("../types/caregiver").EmergencyContact;
export declare function hasActiveCredentials(caregiver: Pick<Caregiver, 'credentials'>, types?: string[]): boolean;
export declare function getExpiringCredentials(caregiver: Pick<Caregiver, 'credentials'>, daysUntilExpiration?: number): Credential[];
export declare function getExpiredCredentials(caregiver: Pick<Caregiver, 'credentials'>): Credential[];
export declare function hasCriticalComplianceIssues(caregiver: Pick<Caregiver, 'complianceStatus'>): boolean;
export declare function getCompletedTraining(caregiver: Pick<Caregiver, 'training'>, category?: string): TrainingRecord[];
export declare function calculateTotalTrainingHours(caregiver: Pick<Caregiver, 'training'>): number;
export declare function isAvailableOnDay(caregiver: Pick<Caregiver, 'availability'>, dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'): boolean;
export declare function isAvailableOnDate(caregiver: Pick<Caregiver, 'availability'>, date: Date | string): boolean;
export declare function getStatusDisplay(status: CaregiverStatus): {
    label: string;
    color: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
    description: string;
};
export declare function getComplianceStatusDisplay(status: ComplianceStatus): {
    label: string;
    color: 'green' | 'yellow' | 'red' | 'gray';
    icon: string;
    description: string;
};
export declare function canBeAssignedToVisits(caregiver: Pick<Caregiver, 'status' | 'employmentStatus' | 'complianceStatus'>): boolean;
export declare function getAssignmentBlockers(caregiver: Pick<Caregiver, 'status' | 'employmentStatus' | 'complianceStatus' | 'credentials'>): string[];
export declare function calculateReliabilityScore(caregiver: Pick<Caregiver, 'reliabilityScore'>): number;
export declare function formatYearsOfService(hireDate: Date | string): string;
export declare function isNewHire(hireDate: Date | string): boolean;
export declare function getSkillsByCategory(caregiver: Pick<Caregiver, 'skills'>, category: string): typeof caregiver.skills;
export declare function hasSkill(caregiver: Pick<Caregiver, 'skills'>, skillName: string, minProficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'): boolean;
export declare function compareCaregivers(a: Caregiver, b: Caregiver, sortBy?: 'name' | 'hireDate' | 'employeeNumber' | 'reliability'): number;
export declare function filterByLanguages(caregivers: Caregiver[], requiredLanguages: string[]): Caregiver[];
export declare function filterByShiftPreference(caregivers: Pick<Caregiver, 'workPreferences' | 'availability'>[], shiftType: string): typeof caregivers;
//# sourceMappingURL=caregiver-utils.d.ts.map