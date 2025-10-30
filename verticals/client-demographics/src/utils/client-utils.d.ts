import { Client, RiskFlag, EmergencyContact, ProgramEnrollment } from '../types/client';
export declare function calculateAge(dateOfBirth: Date | string): number;
export declare function calculateDetailedAge(dateOfBirth: Date | string): {
    years: number;
    months: number;
};
export declare function getFullName(client: Client, includeMiddle?: boolean): string;
export declare function getDisplayName(client: Client): string;
export declare function getPrimaryEmergencyContact(client: Client): EmergencyContact | undefined;
export declare function getActiveRiskFlags(client: Client): RiskFlag[];
export declare function getCriticalRiskFlags(client: Client): RiskFlag[];
export declare function hasCriticalRisks(client: Client): boolean;
export declare function getActivePrograms(client: Client): ProgramEnrollment[];
export declare function getTotalAuthorizedHours(client: Client): number;
export declare function formatAddress(address: Client['primaryAddress'], includeCounty?: boolean): string;
export declare function formatAddressSingleLine(address: Client['primaryAddress']): string;
export declare function formatPhoneNumber(phone: string): string;
export declare function getStatusDisplay(status: Client['status']): {
    label: string;
    color: string;
    icon: string;
};
export declare function isEligibleForServices(client: Client): boolean;
export declare function getPrimaryFundingSource(client: Client): import("../types/client").FundingSource | null;
export declare function hasAllergies(client: Client): boolean;
export declare function hasLifeThreateningAllergies(client: Client): boolean;
export declare function requiresWheelchairAccess(client: Client): boolean;
export declare function getDaysSinceIntake(client: Client): number | null;
export declare function isNewClient(client: Client, daysThreshold?: number): boolean;
export declare function generateClientSummary(client: Client): {
    basicInfo: string;
    contactInfo: string;
    careInfo: string;
    riskInfo: string;
};
export declare function validateClientData(client: Partial<Client>): {
    valid: boolean;
    errors: string[];
};
export declare function compareClients(a: Client, b: Client, sortBy?: 'name' | 'age' | 'status' | 'clientNumber'): number;
export declare function filterClientsBySearchTerm(clients: Client[], searchTerm: string): Client[];
export declare function exportClientToCSV(client: Client): Record<string, string>;
//# sourceMappingURL=client-utils.d.ts.map