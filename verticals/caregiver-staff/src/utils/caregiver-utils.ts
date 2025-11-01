/**
 * Caregiver utility functions
 * Helper functions for working with caregiver data in the UI and business logic
 */

import { differenceInYears, differenceInMonths, format, parseISO, isWithinInterval, addDays } from 'date-fns';
import {
  Caregiver,
  Credential,
  TrainingRecord,
  CaregiverStatus,
  ComplianceStatus,
  Phone,
  ShiftType,
} from '../types/caregiver';

/**
 * Calculate caregiver age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  return differenceInYears(new Date(), dob);
}

/**
 * Calculate detailed age (years and months)
 */
export function calculateDetailedAge(dateOfBirth: Date | string): { years: number; months: number } {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  const now = new Date();
  const years = differenceInYears(now, dob);
  const months = differenceInMonths(now, dob) % 12;
  
  return { years, months };
}

/**
 * Calculate years of service
 */
export function calculateYearsOfService(hireDate: Date | string): number {
  const hire = typeof hireDate === 'string' ? parseISO(hireDate) : hireDate;
  return differenceInYears(new Date(), hire);
}

/**
 * Get caregiver full name
 */
export function getFullName(
  caregiver: Pick<Caregiver, 'firstName' | 'middleName' | 'lastName' | 'preferredName'>,
  options: { includeMiddle?: boolean; showPreferred?: boolean } = {}
): string {
  const { includeMiddle = false, showPreferred = false } = options;
  
  let name = caregiver.firstName;
  
  if (includeMiddle && caregiver.middleName) {
    name += ` ${caregiver.middleName}`;
  }
  
  name += ` ${caregiver.lastName}`;
  
  if (showPreferred && caregiver.preferredName && caregiver.preferredName !== caregiver.firstName) {
    name += ` "${caregiver.preferredName}"`;
  }
  
  return name;
}

/**
 * Get display name (preferred name or first name)
 */
export function getDisplayName(
  caregiver: Pick<Caregiver, 'firstName' | 'preferredName'>
): string {
  return caregiver.preferredName || caregiver.firstName;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | Phone): string {
  const phoneNumber = typeof phone === 'string' ? phone : phone.number;
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Format as +X (XXX) XXX-XXXX for 11-digit numbers
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return as-is if format is not recognized
  return phoneNumber;
}

/**
 * Get primary emergency contact
 */
export function getPrimaryEmergencyContact(caregiver: Pick<Caregiver, 'emergencyContacts'>): Caregiver['emergencyContacts'][0] | undefined {
  return caregiver.emergencyContacts.find(contact => contact.isPrimary) || caregiver.emergencyContacts[0];
}

/**
 * Check if caregiver has active credentials
 */
export function hasActiveCredentials(
  caregiver: Pick<Caregiver, 'credentials'>,
  types?: string[]
): boolean {
  const activeCredentials = caregiver.credentials.filter(
    cred => cred.status === 'ACTIVE' && (!cred.expirationDate || new Date(cred.expirationDate) >= new Date())
  );
  
  if (!types || types.length === 0) {
    return activeCredentials.length > 0;
  }
  
  return types.every(type =>
    activeCredentials.some(cred => cred.type === type)
  );
}

/**
 * Get expiring credentials (within specified days)
 */
export function getExpiringCredentials(
  caregiver: Pick<Caregiver, 'credentials'>,
  daysUntilExpiration: number = 30
): Credential[] {
  const now = new Date();
  const expirationThreshold = addDays(now, daysUntilExpiration);
  
  return caregiver.credentials.filter(cred => {
    if (!cred.expirationDate || cred.status !== 'ACTIVE') {
      return false;
    }
    
    const expDate = typeof cred.expirationDate === 'string' 
      ? parseISO(cred.expirationDate) 
      : cred.expirationDate;
      
    return expDate >= now && expDate <= expirationThreshold;
  });
}

/**
 * Get expired credentials
 */
export function getExpiredCredentials(
  caregiver: Pick<Caregiver, 'credentials'>
): Credential[] {
  const now = new Date();
  
  return caregiver.credentials.filter(cred => {
    if (!cred.expirationDate) {
      return false;
    }
    
    const expDate = typeof cred.expirationDate === 'string'
      ? parseISO(cred.expirationDate)
      : cred.expirationDate;
      
    return expDate < now && cred.status === 'ACTIVE';
  });
}

/**
 * Check if caregiver has critical compliance issues
 */
export function hasCriticalComplianceIssues(caregiver: Pick<Caregiver, 'complianceStatus'>): boolean {
  return ['EXPIRED', 'NON_COMPLIANT'].includes(caregiver.complianceStatus);
}

/**
 * Get completed training in a category
 */
export function getCompletedTraining(
  caregiver: Pick<Caregiver, 'training'>,
  category?: string
): TrainingRecord[] {
  let training = caregiver.training.filter(t => t.status === 'COMPLETED');
  
  if (category) {
    training = training.filter(t => t.category === category);
  }
  
  return training;
}

/**
 * Calculate total training hours
 */
export function calculateTotalTrainingHours(caregiver: Pick<Caregiver, 'training'>): number {
  return caregiver.training
    .filter(t => t.status === 'COMPLETED')
    .reduce((total, t) => total + (t.hours || 0), 0);
}

/**
 * Check if caregiver is available on a specific day
 */
export function isAvailableOnDay(
  caregiver: Pick<Caregiver, 'availability'>,
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
): boolean {
  return caregiver.availability.schedule[dayOfWeek].available;
}

/**
 * Check if caregiver is available on a specific date
 */
export function isAvailableOnDate(
  caregiver: Pick<Caregiver, 'availability'>,
  date: Date | string
): boolean {
  const checkDate = typeof date === 'string' ? parseISO(date) : date;
  
  // Check blackout dates
  if (caregiver.availability.blackoutDates) {
    const isBlackedOut = caregiver.availability.blackoutDates.some(blackout => {
      const start = typeof blackout.startDate === 'string' 
        ? parseISO(blackout.startDate) 
        : blackout.startDate;
      const end = typeof blackout.endDate === 'string'
        ? parseISO(blackout.endDate)
        : blackout.endDate;
        
      return isWithinInterval(checkDate, { start, end });
    });
    
    if (isBlackedOut) {
      return false;
    }
  }
  
  // Check day of week availability
  const dayOfWeek = format(checkDate, 'EEEE').toLowerCase() as 
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    
  return isAvailableOnDay(caregiver, dayOfWeek);
}

/**
 * Get status display information
 */
export function getStatusDisplay(status: CaregiverStatus): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
  description: string;
} {
  const statusMap: Record<CaregiverStatus, ReturnType<typeof getStatusDisplay>> = {
    APPLICATION: {
      label: 'Application',
      color: 'gray',
      description: 'Application submitted, pending review',
    },
    INTERVIEWING: {
      label: 'Interviewing',
      color: 'blue',
      description: 'Currently in interview process',
    },
    PENDING_ONBOARDING: {
      label: 'Pending Onboarding',
      color: 'yellow',
      description: 'Hired, awaiting onboarding',
    },
    ONBOARDING: {
      label: 'Onboarding',
      color: 'blue',
      description: 'Currently onboarding',
    },
    ACTIVE: {
      label: 'Active',
      color: 'green',
      description: 'Active and available for assignments',
    },
    INACTIVE: {
      label: 'Inactive',
      color: 'gray',
      description: 'Not currently active',
    },
    ON_LEAVE: {
      label: 'On Leave',
      color: 'yellow',
      description: 'Temporarily on leave',
    },
    SUSPENDED: {
      label: 'Suspended',
      color: 'red',
      description: 'Temporarily suspended',
    },
    TERMINATED: {
      label: 'Terminated',
      color: 'red',
      description: 'Employment terminated',
    },
    RETIRED: {
      label: 'Retired',
      color: 'gray',
      description: 'Retired from service',
    },
  };
  
  return statusMap[status];
}

/**
 * Get compliance status display information
 */
export function getComplianceStatusDisplay(status: ComplianceStatus): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
  icon: string;
  description: string;
} {
  const statusMap: Record<ComplianceStatus, ReturnType<typeof getComplianceStatusDisplay>> = {
    COMPLIANT: {
      label: 'Compliant',
      color: 'green',
      icon: '✓',
      description: 'All requirements met',
    },
    PENDING_VERIFICATION: {
      label: 'Pending Verification',
      color: 'gray',
      icon: '⏳',
      description: 'Awaiting verification of credentials',
    },
    EXPIRING_SOON: {
      label: 'Expiring Soon',
      color: 'yellow',
      icon: '⚠',
      description: 'Credentials expiring within 30 days',
    },
    EXPIRED: {
      label: 'Expired',
      color: 'red',
      icon: '✕',
      description: 'One or more credentials expired',
    },
    NON_COMPLIANT: {
      label: 'Non-Compliant',
      color: 'red',
      icon: '✕',
      description: 'Does not meet compliance requirements',
    },
  };
  
  return statusMap[status];
}

/**
 * Check if caregiver can be assigned to visits
 */
export function canBeAssignedToVisits(
  caregiver: Pick<Caregiver, 'status' | 'employmentStatus' | 'complianceStatus'>
): boolean {
  return (
    caregiver.status === 'ACTIVE' &&
    caregiver.employmentStatus === 'ACTIVE' &&
    caregiver.complianceStatus === 'COMPLIANT'
  );
}

/**
 * Get reasons why caregiver cannot be assigned
 */
export function getAssignmentBlockers(
  caregiver: Pick<Caregiver, 'status' | 'employmentStatus' | 'complianceStatus' | 'credentials'>
): string[] {
  const blockers: string[] = [];
  
  if (caregiver.status !== 'ACTIVE') {
    blockers.push(`Status is ${caregiver.status}`);
  }
  
  if (caregiver.employmentStatus !== 'ACTIVE') {
    blockers.push(`Employment status is ${caregiver.employmentStatus}`);
  }
  
  if (caregiver.complianceStatus !== 'COMPLIANT') {
    blockers.push(`Compliance status is ${caregiver.complianceStatus}`);
  }
  
  const expired = getExpiredCredentials(caregiver);
  if (expired.length > 0) {
    blockers.push(`${expired.length} credential(s) expired`);
  }
  
  return blockers;
}

/**
 * Calculate reliability score based on various factors
 * (This would typically be calculated from historical data in the scheduling system)
 */
export function calculateReliabilityScore(caregiver: Pick<Caregiver, 'reliabilityScore'>): number {
  return caregiver.reliabilityScore || 0;
}

/**
 * Format years of service for display
 */
export function formatYearsOfService(hireDate: Date | string): string {
  const years = calculateYearsOfService(hireDate);
  
  if (years === 0) {
    const hire = typeof hireDate === 'string' ? parseISO(hireDate) : hireDate;
    const months = differenceInMonths(new Date(), hire);
    
    if (months === 0) {
      return 'New hire';
    }
    
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  
  return `${years} year${years === 1 ? '' : 's'}`;
}

/**
 * Check if caregiver is a new hire (hired within last 90 days)
 */
export function isNewHire(hireDate: Date | string): boolean {
  const hire = typeof hireDate === 'string' ? parseISO(hireDate) : hireDate;
  const ninetyDaysAgo = addDays(new Date(), -90);
  
  return hire >= ninetyDaysAgo;
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(
  caregiver: Pick<Caregiver, 'skills'>,
  category: string
): typeof caregiver.skills {
  return caregiver.skills.filter(skill => skill.category === category);
}

/**
 * Check if caregiver has specific skill
 */
export function hasSkill(
  caregiver: Pick<Caregiver, 'skills'>,
  skillName: string,
  minProficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
): boolean {
  const skill = caregiver.skills.find(s => s.name === skillName);
  
  if (!skill) {
    return false;
  }
  
  if (!minProficiency) {
    return true;
  }
  
  const proficiencyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const skillLevel = proficiencyLevels.indexOf(skill.proficiencyLevel);
  const minLevel = proficiencyLevels.indexOf(minProficiency);
  
  return skillLevel >= minLevel;
}

/**
 * Sort caregivers by various criteria
 */
export function compareCaregivers(
  a: Caregiver,
  b: Caregiver,
  sortBy: 'name' | 'hireDate' | 'employeeNumber' | 'reliability' = 'name'
): number {
  switch (sortBy) {
    case 'name': {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    }
      
    case 'hireDate':
      return new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
      
    case 'employeeNumber':
      return a.employeeNumber.localeCompare(b.employeeNumber);
      
    case 'reliability':
      return (b.reliabilityScore || 0) - (a.reliabilityScore || 0);
      
    default:
      return 0;
  }
}

/**
 * Filter caregivers who speak specific languages
 */
export function filterByLanguages(
  caregivers: Caregiver[],
  requiredLanguages: string[]
): Caregiver[] {
  return caregivers.filter(caregiver =>
    requiredLanguages.every(lang =>
      caregiver.languages?.includes(lang)
    )
  );
}

/**
 * Get caregivers available for a specific shift type
 */
export function filterByShiftPreference(
  caregivers: Pick<Caregiver, 'workPreferences' | 'availability'>[],
  shiftType: string
): typeof caregivers {
  return caregivers.filter(caregiver => {
    if (!caregiver.workPreferences?.preferredShiftTypes) {
      return true; // No preference means available for any shift
    }
    
    return caregiver.workPreferences.preferredShiftTypes.includes(shiftType as ShiftType);
  });
}
