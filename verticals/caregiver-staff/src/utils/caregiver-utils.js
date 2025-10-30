"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAge = calculateAge;
exports.calculateDetailedAge = calculateDetailedAge;
exports.calculateYearsOfService = calculateYearsOfService;
exports.getFullName = getFullName;
exports.getDisplayName = getDisplayName;
exports.formatPhoneNumber = formatPhoneNumber;
exports.getPrimaryEmergencyContact = getPrimaryEmergencyContact;
exports.hasActiveCredentials = hasActiveCredentials;
exports.getExpiringCredentials = getExpiringCredentials;
exports.getExpiredCredentials = getExpiredCredentials;
exports.hasCriticalComplianceIssues = hasCriticalComplianceIssues;
exports.getCompletedTraining = getCompletedTraining;
exports.calculateTotalTrainingHours = calculateTotalTrainingHours;
exports.isAvailableOnDay = isAvailableOnDay;
exports.isAvailableOnDate = isAvailableOnDate;
exports.getStatusDisplay = getStatusDisplay;
exports.getComplianceStatusDisplay = getComplianceStatusDisplay;
exports.canBeAssignedToVisits = canBeAssignedToVisits;
exports.getAssignmentBlockers = getAssignmentBlockers;
exports.calculateReliabilityScore = calculateReliabilityScore;
exports.formatYearsOfService = formatYearsOfService;
exports.isNewHire = isNewHire;
exports.getSkillsByCategory = getSkillsByCategory;
exports.hasSkill = hasSkill;
exports.compareCaregivers = compareCaregivers;
exports.filterByLanguages = filterByLanguages;
exports.filterByShiftPreference = filterByShiftPreference;
const date_fns_1 = require("date-fns");
function calculateAge(dateOfBirth) {
    const dob = typeof dateOfBirth === 'string' ? (0, date_fns_1.parseISO)(dateOfBirth) : dateOfBirth;
    return (0, date_fns_1.differenceInYears)(new Date(), dob);
}
function calculateDetailedAge(dateOfBirth) {
    const dob = typeof dateOfBirth === 'string' ? (0, date_fns_1.parseISO)(dateOfBirth) : dateOfBirth;
    const now = new Date();
    const years = (0, date_fns_1.differenceInYears)(now, dob);
    const months = (0, date_fns_1.differenceInMonths)(now, dob) % 12;
    return { years, months };
}
function calculateYearsOfService(hireDate) {
    const hire = typeof hireDate === 'string' ? (0, date_fns_1.parseISO)(hireDate) : hireDate;
    return (0, date_fns_1.differenceInYears)(new Date(), hire);
}
function getFullName(caregiver, options = {}) {
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
function getDisplayName(caregiver) {
    return caregiver.preferredName || caregiver.firstName;
}
function formatPhoneNumber(phone) {
    const phoneNumber = typeof phone === 'string' ? phone : phone.number;
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phoneNumber;
}
function getPrimaryEmergencyContact(caregiver) {
    return caregiver.emergencyContacts.find(contact => contact.isPrimary) || caregiver.emergencyContacts[0];
}
function hasActiveCredentials(caregiver, types) {
    const activeCredentials = caregiver.credentials.filter(cred => cred.status === 'ACTIVE' && (!cred.expirationDate || new Date(cred.expirationDate) >= new Date()));
    if (!types || types.length === 0) {
        return activeCredentials.length > 0;
    }
    return types.every(type => activeCredentials.some(cred => cred.type === type));
}
function getExpiringCredentials(caregiver, daysUntilExpiration = 30) {
    const now = new Date();
    const expirationThreshold = (0, date_fns_1.addDays)(now, daysUntilExpiration);
    return caregiver.credentials.filter(cred => {
        if (!cred.expirationDate || cred.status !== 'ACTIVE') {
            return false;
        }
        const expDate = typeof cred.expirationDate === 'string'
            ? (0, date_fns_1.parseISO)(cred.expirationDate)
            : cred.expirationDate;
        return expDate >= now && expDate <= expirationThreshold;
    });
}
function getExpiredCredentials(caregiver) {
    const now = new Date();
    return caregiver.credentials.filter(cred => {
        if (!cred.expirationDate) {
            return false;
        }
        const expDate = typeof cred.expirationDate === 'string'
            ? (0, date_fns_1.parseISO)(cred.expirationDate)
            : cred.expirationDate;
        return expDate < now && cred.status === 'ACTIVE';
    });
}
function hasCriticalComplianceIssues(caregiver) {
    return ['EXPIRED', 'NON_COMPLIANT'].includes(caregiver.complianceStatus);
}
function getCompletedTraining(caregiver, category) {
    let training = caregiver.training.filter(t => t.status === 'COMPLETED');
    if (category) {
        training = training.filter(t => t.category === category);
    }
    return training;
}
function calculateTotalTrainingHours(caregiver) {
    return caregiver.training
        .filter(t => t.status === 'COMPLETED')
        .reduce((total, t) => total + (t.hours || 0), 0);
}
function isAvailableOnDay(caregiver, dayOfWeek) {
    return caregiver.availability.schedule[dayOfWeek].available;
}
function isAvailableOnDate(caregiver, date) {
    const checkDate = typeof date === 'string' ? (0, date_fns_1.parseISO)(date) : date;
    if (caregiver.availability.blackoutDates) {
        const isBlackedOut = caregiver.availability.blackoutDates.some(blackout => {
            const start = typeof blackout.startDate === 'string'
                ? (0, date_fns_1.parseISO)(blackout.startDate)
                : blackout.startDate;
            const end = typeof blackout.endDate === 'string'
                ? (0, date_fns_1.parseISO)(blackout.endDate)
                : blackout.endDate;
            return (0, date_fns_1.isWithinInterval)(checkDate, { start, end });
        });
        if (isBlackedOut) {
            return false;
        }
    }
    const dayOfWeek = (0, date_fns_1.format)(checkDate, 'EEEE').toLowerCase();
    return isAvailableOnDay(caregiver, dayOfWeek);
}
function getStatusDisplay(status) {
    const statusMap = {
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
function getComplianceStatusDisplay(status) {
    const statusMap = {
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
function canBeAssignedToVisits(caregiver) {
    return (caregiver.status === 'ACTIVE' &&
        caregiver.employmentStatus === 'ACTIVE' &&
        caregiver.complianceStatus === 'COMPLIANT');
}
function getAssignmentBlockers(caregiver) {
    const blockers = [];
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
function calculateReliabilityScore(caregiver) {
    return caregiver.reliabilityScore || 0;
}
function formatYearsOfService(hireDate) {
    const years = calculateYearsOfService(hireDate);
    if (years === 0) {
        const hire = typeof hireDate === 'string' ? (0, date_fns_1.parseISO)(hireDate) : hireDate;
        const months = (0, date_fns_1.differenceInMonths)(new Date(), hire);
        if (months === 0) {
            return 'New hire';
        }
        return `${months} month${months === 1 ? '' : 's'}`;
    }
    return `${years} year${years === 1 ? '' : 's'}`;
}
function isNewHire(hireDate) {
    const hire = typeof hireDate === 'string' ? (0, date_fns_1.parseISO)(hireDate) : hireDate;
    const ninetyDaysAgo = (0, date_fns_1.addDays)(new Date(), -90);
    return hire >= ninetyDaysAgo;
}
function getSkillsByCategory(caregiver, category) {
    return caregiver.skills.filter(skill => skill.category === category);
}
function hasSkill(caregiver, skillName, minProficiency) {
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
function compareCaregivers(a, b, sortBy = 'name') {
    switch (sortBy) {
        case 'name':
            const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
            const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
            return nameA.localeCompare(nameB);
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
function filterByLanguages(caregivers, requiredLanguages) {
    return caregivers.filter(caregiver => requiredLanguages.every(lang => caregiver.languages?.includes(lang)));
}
function filterByShiftPreference(caregivers, shiftType) {
    return caregivers.filter(caregiver => {
        if (!caregiver.workPreferences?.preferredShiftTypes) {
            return true;
        }
        return caregiver.workPreferences.preferredShiftTypes.includes(shiftType);
    });
}
//# sourceMappingURL=caregiver-utils.js.map