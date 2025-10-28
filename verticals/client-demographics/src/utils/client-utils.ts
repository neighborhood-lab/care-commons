/**
 * Client utility functions
 * 
 * Helper functions for common client-related operations
 */

import { Client, RiskFlag, EmergencyContact, ProgramEnrollment } from '../types/client';
import { differenceInYears, differenceInMonths, format, parseISO } from 'date-fns';

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  return differenceInYears(new Date(), dob);
}

/**
 * Calculate age with months for more precise display
 */
export function calculateDetailedAge(dateOfBirth: Date | string): {
  years: number;
  months: number;
} {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  const years = differenceInYears(new Date(), dob);
  const months = differenceInMonths(new Date(), dob) % 12;
  return { years, months };
}

/**
 * Get full name with preferred name handling
 */
export function getFullName(client: Client, includeMiddle: boolean = false): string {
  const parts = [client.firstName];

  if (includeMiddle && client.middleName) {
    parts.push(client.middleName);
  }

  parts.push(client.lastName);

  if (client.preferredName && client.preferredName !== client.firstName) {
    return `${parts.join(' ')} "${client.preferredName}"`;
  }

  return parts.join(' ');
}

/**
 * Get display name (preferred if available, otherwise first name)
 */
export function getDisplayName(client: Client): string {
  return client.preferredName || client.firstName;
}

/**
 * Get primary emergency contact
 */
export function getPrimaryEmergencyContact(client: Client): EmergencyContact | undefined {
  return client.emergencyContacts.find((contact) => contact.isPrimary);
}

/**
 * Get active risk flags
 */
export function getActiveRiskFlags(client: Client): RiskFlag[] {
  return client.riskFlags.filter((flag) => !flag.resolvedDate);
}

/**
 * Get critical active risk flags
 */
export function getCriticalRiskFlags(client: Client): RiskFlag[] {
  return client.riskFlags.filter(
    (flag) => !flag.resolvedDate && flag.severity === 'CRITICAL'
  );
}

/**
 * Check if client has any active critical risk flags
 */
export function hasCriticalRisks(client: Client): boolean {
  return getCriticalRiskFlags(client).length > 0;
}

/**
 * Get active programs
 */
export function getActivePrograms(client: Client): ProgramEnrollment[] {
  return client.programs.filter((program) => program.status === 'ACTIVE');
}

/**
 * Get total authorized hours per week across all programs
 */
export function getTotalAuthorizedHours(client: Client): number {
  return getActivePrograms(client).reduce(
    (total, program) => total + (program.authorizedHoursPerWeek || 0),
    0
  );
}

/**
 * Format address for display
 */
export function formatAddress(
  address: Client['primaryAddress'],
  includeCounty: boolean = false
): string {
  const parts = [address.line1];

  if (address.line2) {
    parts.push(address.line2);
  }

  parts.push(`${address.city}, ${address.state} ${address.postalCode}`);

  if (includeCounty && address.county) {
    parts.push(`${address.county} County`);
  }

  return parts.join('\n');
}

/**
 * Format address for single line display
 */
export function formatAddressSingleLine(address: Client['primaryAddress']): string {
  const parts = [address.line1];

  if (address.line2) {
    parts.push(address.line2);
  }

  return `${parts.join(', ')}, ${address.city}, ${address.state} ${address.postalCode}`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Format with country code +1 (XXX) XXX-XXXX
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return as-is if doesn't match expected format
  return phone;
}

/**
 * Get client status display information
 */
export function getStatusDisplay(status: Client['status']): {
  label: string;
  color: string;
  icon: string;
} {
  const statusMap = {
    INQUIRY: { label: 'Inquiry', color: 'gray', icon: '❓' },
    PENDING_INTAKE: { label: 'Pending Intake', color: 'yellow', icon: '⏳' },
    ACTIVE: { label: 'Active', color: 'green', icon: '✅' },
    INACTIVE: { label: 'Inactive', color: 'orange', icon: '⏸️' },
    ON_HOLD: { label: 'On Hold', color: 'blue', icon: '⏸️' },
    DISCHARGED: { label: 'Discharged', color: 'red', icon: '✖️' },
    DECEASED: { label: 'Deceased', color: 'black', icon: '🕊️' },
  };

  return statusMap[status] || { label: status, color: 'gray', icon: '❓' };
}

/**
 * Check if client is eligible for services
 */
export function isEligibleForServices(client: Client): boolean {
  const eligibility = client.serviceEligibility;

  return (
    eligibility.medicaidEligible ||
    eligibility.medicareEligible ||
    eligibility.veteransBenefits ||
    eligibility.longTermCareInsurance ||
    eligibility.privatePayOnly
  );
}

/**
 * Get primary funding source
 */
export function getPrimaryFundingSource(client: Client) {
  if (!client.fundingSources || client.fundingSources.length === 0) {
    return null;
  }

  return client.fundingSources.reduce((primary, source) => {
    if (!primary || source.priority < primary.priority) {
      return source;
    }
    return primary;
  });
}

/**
 * Check if client has allergies
 */
export function hasAllergies(client: Client): boolean {
  return (client.allergies?.length || 0) > 0;
}

/**
 * Check if client has life-threatening allergies
 */
export function hasLifeThreateningAllergies(client: Client): boolean {
  return (
    client.allergies?.some((allergy) => allergy.severity === 'LIFE_THREATENING') || false
  );
}

/**
 * Check if client requires wheelchair access
 */
export function requiresWheelchairAccess(client: Client): boolean {
  return client.mobilityInfo?.requiresWheelchair || false;
}

/**
 * Get days since intake
 */
export function getDaysSinceIntake(client: Client): number | null {
  if (!client.intakeDate) {
    return null;
  }

  const intakeDate = typeof client.intakeDate === 'string'
    ? parseISO(client.intakeDate)
    : client.intakeDate;

  return differenceInYears(new Date(), intakeDate) * 365 +
    differenceInMonths(new Date(), intakeDate) % 12 * 30;
}

/**
 * Check if client is new (intake within last 30 days)
 */
export function isNewClient(client: Client, daysThreshold: number = 30): boolean {
  const days = getDaysSinceIntake(client);
  return days !== null && days <= daysThreshold;
}

/**
 * Generate client summary for reports/exports
 */
export function generateClientSummary(client: Client): {
  basicInfo: string;
  contactInfo: string;
  careInfo: string;
  riskInfo: string;
} {
  const age = calculateAge(client.dateOfBirth);
  const activeRisks = getActiveRiskFlags(client);
  const activePrograms = getActivePrograms(client);

  return {
    basicInfo: `${getFullName(client, true)}, ${age} years old, ${client.gender || 'Gender not specified'}`,
    contactInfo: `${formatAddressSingleLine(client.primaryAddress)}${client.primaryPhone ? `, Phone: ${formatPhoneNumber(client.primaryPhone.number)}` : ''}`,
    careInfo: `Programs: ${activePrograms.map((p) => p.programName).join(', ') || 'None'}`,
    riskInfo: activeRisks.length > 0
      ? `Active risk flags: ${activeRisks.map((r) => `${r.type} (${r.severity})`).join(', ')}`
      : 'No active risk flags',
  };
}

/**
 * Validate client data before operations
 */
export function validateClientData(client: Partial<Client>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (client.firstName && client.firstName.trim().length === 0) {
    errors.push('First name cannot be empty');
  }

  if (client.lastName && client.lastName.trim().length === 0) {
    errors.push('Last name cannot be empty');
  }

  if (client.dateOfBirth) {
    const age = calculateAge(client.dateOfBirth);
    if (age < 0 || age > 150) {
      errors.push('Invalid date of birth');
    }
  }

  if (client.primaryPhone) {
    const digits = client.primaryPhone.number.replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 11) {
      errors.push('Invalid phone number format');
    }
  }

  if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Compare two clients for sorting
 */
export function compareClients(
  a: Client,
  b: Client,
  sortBy: 'name' | 'age' | 'status' | 'clientNumber' = 'name'
): number {
  switch (sortBy) {
    case 'name':
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);

    case 'age':
      return calculateAge(a.dateOfBirth) - calculateAge(b.dateOfBirth);

    case 'status':
      return a.status.localeCompare(b.status);

    case 'clientNumber':
      return a.clientNumber.localeCompare(b.clientNumber);

    default:
      return 0;
  }
}

/**
 * Filter clients by search term
 */
export function filterClientsBySearchTerm(clients: Client[], searchTerm: string): Client[] {
  const term = searchTerm.toLowerCase().trim();

  if (!term) {
    return clients;
  }

  return clients.filter((client) => {
    const searchableText = [
      client.firstName,
      client.middleName,
      client.lastName,
      client.preferredName,
      client.clientNumber,
      client.email,
      client.primaryPhone?.number,
      client.primaryAddress.city,
      client.primaryAddress.state,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(term);
  });
}

/**
 * Export client data to CSV-compatible format
 */
export function exportClientToCSV(client: Client): Record<string, string> {
  const age = calculateAge(client.dateOfBirth);
  const primaryContact = getPrimaryEmergencyContact(client);

  return {
    'Client Number': client.clientNumber,
    'First Name': client.firstName,
    'Middle Name': client.middleName || '',
    'Last Name': client.lastName,
    'Preferred Name': client.preferredName || '',
    'Date of Birth': format(new Date(client.dateOfBirth), 'MM/dd/yyyy'),
    'Age': age.toString(),
    'Gender': client.gender || '',
    'Status': client.status,
    'Phone': client.primaryPhone ? formatPhoneNumber(client.primaryPhone.number) : '',
    'Email': client.email || '',
    'Address': formatAddressSingleLine(client.primaryAddress),
    'Emergency Contact': primaryContact ? primaryContact.name : '',
    'Emergency Contact Phone': primaryContact
      ? formatPhoneNumber(primaryContact.phone.number)
      : '',
    'Active Programs': getActivePrograms(client)
      .map((p) => p.programName)
      .join('; '),
    'Authorized Hours/Week': getTotalAuthorizedHours(client).toString(),
    'Active Risk Flags': getActiveRiskFlags(client).length.toString(),
    'Intake Date': client.intakeDate ? format(new Date(client.intakeDate), 'MM/dd/yyyy') : '',
  };
}
