"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAge = calculateAge;
exports.calculateDetailedAge = calculateDetailedAge;
exports.getFullName = getFullName;
exports.getDisplayName = getDisplayName;
exports.getPrimaryEmergencyContact = getPrimaryEmergencyContact;
exports.getActiveRiskFlags = getActiveRiskFlags;
exports.getCriticalRiskFlags = getCriticalRiskFlags;
exports.hasCriticalRisks = hasCriticalRisks;
exports.getActivePrograms = getActivePrograms;
exports.getTotalAuthorizedHours = getTotalAuthorizedHours;
exports.formatAddress = formatAddress;
exports.formatAddressSingleLine = formatAddressSingleLine;
exports.formatPhoneNumber = formatPhoneNumber;
exports.getStatusDisplay = getStatusDisplay;
exports.isEligibleForServices = isEligibleForServices;
exports.getPrimaryFundingSource = getPrimaryFundingSource;
exports.hasAllergies = hasAllergies;
exports.hasLifeThreateningAllergies = hasLifeThreateningAllergies;
exports.requiresWheelchairAccess = requiresWheelchairAccess;
exports.getDaysSinceIntake = getDaysSinceIntake;
exports.isNewClient = isNewClient;
exports.generateClientSummary = generateClientSummary;
exports.validateClientData = validateClientData;
exports.compareClients = compareClients;
exports.filterClientsBySearchTerm = filterClientsBySearchTerm;
exports.exportClientToCSV = exportClientToCSV;
const date_fns_1 = require("date-fns");
function calculateAge(dateOfBirth) {
    const dob = typeof dateOfBirth === 'string' ? (0, date_fns_1.parseISO)(dateOfBirth) : dateOfBirth;
    return (0, date_fns_1.differenceInYears)(new Date(), dob);
}
function calculateDetailedAge(dateOfBirth) {
    const dob = typeof dateOfBirth === 'string' ? (0, date_fns_1.parseISO)(dateOfBirth) : dateOfBirth;
    const years = (0, date_fns_1.differenceInYears)(new Date(), dob);
    const months = (0, date_fns_1.differenceInMonths)(new Date(), dob) % 12;
    return { years, months };
}
function getFullName(client, includeMiddle = false) {
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
function getDisplayName(client) {
    return client.preferredName || client.firstName;
}
function getPrimaryEmergencyContact(client) {
    return client.emergencyContacts.find((contact) => contact.isPrimary);
}
function getActiveRiskFlags(client) {
    return client.riskFlags.filter((flag) => !flag.resolvedDate);
}
function getCriticalRiskFlags(client) {
    return client.riskFlags.filter((flag) => !flag.resolvedDate && flag.severity === 'CRITICAL');
}
function hasCriticalRisks(client) {
    return getCriticalRiskFlags(client).length > 0;
}
function getActivePrograms(client) {
    return client.programs.filter((program) => program.status === 'ACTIVE');
}
function getTotalAuthorizedHours(client) {
    return getActivePrograms(client).reduce((total, program) => total + (program.authorizedHoursPerWeek || 0), 0);
}
function formatAddress(address, includeCounty = false) {
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
function formatAddressSingleLine(address) {
    const parts = [address.line1];
    if (address.line2) {
        parts.push(address.line2);
    }
    return `${parts.join(', ')}, ${address.city}, ${address.state} ${address.postalCode}`;
}
function formatPhoneNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
}
function getStatusDisplay(status) {
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
function isEligibleForServices(client) {
    const eligibility = client.serviceEligibility;
    return (eligibility.medicaidEligible ||
        eligibility.medicareEligible ||
        eligibility.veteransBenefits ||
        eligibility.longTermCareInsurance ||
        eligibility.privatePayOnly);
}
function getPrimaryFundingSource(client) {
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
function hasAllergies(client) {
    return (client.allergies?.length || 0) > 0;
}
function hasLifeThreateningAllergies(client) {
    return (client.allergies?.some((allergy) => allergy.severity === 'LIFE_THREATENING') || false);
}
function requiresWheelchairAccess(client) {
    return client.mobilityInfo?.requiresWheelchair || false;
}
function getDaysSinceIntake(client) {
    if (!client.intakeDate) {
        return null;
    }
    const intakeDate = typeof client.intakeDate === 'string'
        ? (0, date_fns_1.parseISO)(client.intakeDate)
        : client.intakeDate;
    return (0, date_fns_1.differenceInYears)(new Date(), intakeDate) * 365 +
        (0, date_fns_1.differenceInMonths)(new Date(), intakeDate) % 12 * 30;
}
function isNewClient(client, daysThreshold = 30) {
    const days = getDaysSinceIntake(client);
    return days !== null && days <= daysThreshold;
}
function generateClientSummary(client) {
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
function validateClientData(client) {
    const errors = [];
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
function compareClients(a, b, sortBy = 'name') {
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
function filterClientsBySearchTerm(clients, searchTerm) {
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
function exportClientToCSV(client) {
    const age = calculateAge(client.dateOfBirth);
    const primaryContact = getPrimaryEmergencyContact(client);
    return {
        'Client Number': client.clientNumber,
        'First Name': client.firstName,
        'Middle Name': client.middleName || '',
        'Last Name': client.lastName,
        'Preferred Name': client.preferredName || '',
        'Date of Birth': (0, date_fns_1.format)(new Date(client.dateOfBirth), 'MM/dd/yyyy'),
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
        'Intake Date': client.intakeDate ? (0, date_fns_1.format)(new Date(client.intakeDate), 'MM/dd/yyyy') : '',
    };
}
//# sourceMappingURL=client-utils.js.map