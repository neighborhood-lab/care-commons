/**
 * Enhanced Interactive Demo Database Seeding Script
 * 
 * Creates a realistic home healthcare agency simulation with:
 * - 20+ caregivers (varied roles, credentials, specialties)
 * - 30+ clients (diverse care needs, risk levels, conditions)
 * - Multiple coordinators (field, scheduling, care coordination)
 * - Administrator
 * - Realistic visit history (completed, in-progress, exceptions)
 * - Active care plans with tasks due today
 * - Pending authorizations
 * - Credential expirations
 * 
 * This seed data powers the rich interactive demo with multi-persona workflows.
 * 
 * PREREQUISITE: Run `npm run db:seed` first to create org, branch, and admin user.
 */

import dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';
import { Database, DatabaseConfig } from '../src/db/connection.js';
import { Pool, PoolClient } from 'pg';
// import { addDays, subDays, format, addHours, setHours, setMinutes } from 'date-fns';

dotenv.config({ path: '.env', quiet: true });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCertificationName(certType: string): string {
  const names: Record<string, string> = {
    'CNA': 'Certified Nursing Assistant',
    'HHA': 'Home Health Aide',
    'RN_LICENSE': 'Registered Nurse License',
    'CPR': 'CPR & AED Certification',
    'FIRST_AID': 'First Aid Certification',
    'DEMENTIA_CARE_SPECIALIST': 'Dementia Care Specialist',
    'WOUND_CARE_SPECIALIST': 'Wound Care Specialist',
    'TRANSFER_SPECIALIST': 'Transfer Specialist',
    'DIABETES_EDUCATOR': 'Diabetes Educator',
    'HOSPICE_CERTIFIED': 'Hospice Care Certified',
    'PTA_CERTIFIED': 'Physical Therapy Assistant',
    'PARKINSONS_SPECIALIST': 'Parkinsons Care Specialist'
  };
  return names[certType] || certType;
}

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

interface CaregiverPersona {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  pronouns: string;
  phone: string;
  email: string;
  role: string;
  specialty?: string;
  languages: string[];
  certifications: string[];
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'PER_DIEM';
  hourlyRate: number;
  maxHoursPerWeek: number;
  availability: { weekdays: boolean; weekends: boolean; nights: boolean };
  complianceStatus: 'COMPLIANT' | 'EXPIRING_SOON' | 'PENDING_VERIFICATION';
  reliabilityScore: number;
}

interface ClientPersona {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  pronouns: string;
  phone: string;
  email?: string;
  conditions: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  mobility: 'INDEPENDENT' | 'WALKER' | 'WHEELCHAIR' | 'BEDRIDDEN';
  authorizedHoursPerWeek: number;
  location: { lat: number; lng: number; address: string };
  specialNeeds?: string;
}

interface CoordinatorPersona {
  firstName: string;
  lastName: string;
  email: string;
  role: 'FIELD_COORDINATOR' | 'SCHEDULING_COORDINATOR' | 'CARE_COORDINATOR' | 'ADMINISTRATOR';
  branch: string;
}

// Texas locations (Dallas/Fort Worth area)
const CAREGIVER_PERSONAS: CaregiverPersona[] = [
  {
    firstName: 'Maria',
    middleName: 'Elena',
    lastName: 'Rodriguez',
    preferredName: 'Mari',
    dateOfBirth: '1985-04-15',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1001',
    email: 'maria.rodriguez@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    specialty: 'dementia_care',
    languages: ['English', 'Spanish'],
    certifications: ['CNA', 'CPR', 'FIRST_AID', 'DEMENTIA_CARE_SPECIALIST'],
    employmentType: 'FULL_TIME',
    hourlyRate: 19.50,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.97
  },
  {
    firstName: 'James',
    middleName: 'Michael',
    lastName: 'Wilson',
    preferredName: 'Mike',
    dateOfBirth: '1990-08-22',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1002',
    email: 'james.wilson@demo.carecommons.example',
    role: 'HOME_HEALTH_AIDE',
    specialty: 'mobility_assistance',
    languages: ['English'],
    certifications: ['HHA', 'CPR', 'FIRST_AID', 'TRANSFER_SPECIALIST'],
    employmentType: 'FULL_TIME',
    hourlyRate: 18.00,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: true, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.94
  },
  {
    firstName: 'Aisha',
    lastName: 'Johnson',
    dateOfBirth: '1978-11-30',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1003',
    email: 'aisha.johnson@demo.carecommons.example',
    role: 'REGISTERED_NURSE',
    specialty: 'wound_care',
    languages: ['English'],
    certifications: ['RN_LICENSE', 'CPR', 'WOUND_CARE_SPECIALIST'],
    employmentType: 'FULL_TIME',
    hourlyRate: 32.00,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.98
  },
  {
    firstName: 'David',
    middleName: 'Lee',
    lastName: 'Chen',
    dateOfBirth: '1995-03-18',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1004',
    email: 'david.chen@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    languages: ['English', 'Mandarin'],
    certifications: ['CNA', 'CPR', 'FIRST_AID'],
    employmentType: 'FULL_TIME',
    hourlyRate: 17.00,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: true, nights: true },
    complianceStatus: 'PENDING_VERIFICATION',
    reliabilityScore: 0.88
  },
  {
    firstName: 'Sarah',
    middleName: 'Grace',
    lastName: 'Martinez',
    preferredName: 'Grace',
    dateOfBirth: '1982-06-25',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1005',
    email: 'sarah.martinez@demo.carecommons.example',
    role: 'HOME_HEALTH_AIDE',
    specialty: 'post_surgical_care',
    languages: ['English', 'Spanish'],
    certifications: ['HHA', 'CPR', 'FIRST_AID'],
    employmentType: 'FULL_TIME',
    hourlyRate: 18.50,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.96
  },
  {
    firstName: 'Michael',
    lastName: 'Thompson',
    dateOfBirth: '1988-12-10',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1006',
    email: 'michael.thompson@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    specialty: 'diabetes_management',
    languages: ['English'],
    certifications: ['CNA', 'CPR', 'FIRST_AID', 'DIABETES_EDUCATOR'],
    employmentType: 'FULL_TIME',
    hourlyRate: 19.00,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.95
  },
  {
    firstName: 'Lisa',
    middleName: 'Ann',
    lastName: 'Washington',
    dateOfBirth: '1992-09-05',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1007',
    email: 'lisa.washington@demo.carecommons.example',
    role: 'HOME_HEALTH_AIDE',
    languages: ['English'],
    certifications: ['HHA', 'CPR', 'FIRST_AID'],
    employmentType: 'PART_TIME',
    hourlyRate: 17.50,
    maxHoursPerWeek: 25,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'EXPIRING_SOON',
    reliabilityScore: 0.91
  },
  {
    firstName: 'Robert',
    middleName: 'James',
    lastName: 'Davis',
    preferredName: 'Bobby',
    dateOfBirth: '1975-07-14',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1008',
    email: 'robert.davis@demo.carecommons.example',
    role: 'SENIOR_CAREGIVER',
    specialty: 'hospice_care',
    languages: ['English'],
    certifications: ['CNA', 'CPR', 'FIRST_AID', 'HOSPICE_CERTIFIED'],
    employmentType: 'FULL_TIME',
    hourlyRate: 20.00,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: true, nights: true },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.99
  },
  {
    firstName: 'Jennifer',
    lastName: 'Garcia',
    dateOfBirth: '1987-02-20',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1009',
    email: 'jennifer.garcia@demo.carecommons.example',
    role: 'COMPANION',
    languages: ['English', 'Spanish'],
    certifications: ['CPR', 'FIRST_AID'],
    employmentType: 'PART_TIME',
    hourlyRate: 15.00,
    maxHoursPerWeek: 20,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.93
  },
  {
    firstName: 'Marcus',
    lastName: 'Brown',
    dateOfBirth: '1993-05-08',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1010',
    email: 'marcus.brown@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    languages: ['English'],
    certifications: ['CNA', 'CPR', 'FIRST_AID'],
    employmentType: 'PER_DIEM',
    hourlyRate: 18.00,
    maxHoursPerWeek: 20,
    availability: { weekdays: false, weekends: true, nights: true },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.87
  },
  // Additional caregivers 11-20 to reach 20+ total
  {
    firstName: 'Patricia',
    lastName: 'Miller',
    dateOfBirth: '1980-01-15',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1011',
    email: 'patricia.miller@demo.carecommons.example',
    role: 'HOME_HEALTH_AIDE',
    languages: ['English'],
    certifications: ['HHA', 'CPR', 'FIRST_AID'],
    employmentType: 'FULL_TIME',
    hourlyRate: 17.75,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.92
  },
  {
    firstName: 'Carlos',
    lastName: 'Hernandez',
    dateOfBirth: '1991-11-28',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1012',
    email: 'carlos.hernandez@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    languages: ['English', 'Spanish'],
    certifications: ['CNA', 'CPR', 'FIRST_AID'],
    employmentType: 'FULL_TIME',
    hourlyRate: 18.25,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: true, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.94
  },
  {
    firstName: 'Amanda',
    lastName: 'Taylor',
    dateOfBirth: '1994-04-12',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1013',
    email: 'amanda.taylor@demo.carecommons.example',
    role: 'HOME_HEALTH_AIDE',
    languages: ['English'],
    certifications: ['HHA', 'CPR', 'FIRST_AID'],
    employmentType: 'PART_TIME',
    hourlyRate: 17.00,
    maxHoursPerWeek: 25,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.90
  },
  {
    firstName: 'Kevin',
    lastName: 'Anderson',
    dateOfBirth: '1986-09-19',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1014',
    email: 'kevin.anderson@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    specialty: 'physical_therapy_assistance',
    languages: ['English'],
    certifications: ['CNA', 'CPR', 'FIRST_AID', 'PTA_CERTIFIED'],
    employmentType: 'FULL_TIME',
    hourlyRate: 19.25,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.96
  },
  {
    firstName: 'Nicole',
    lastName: 'White',
    dateOfBirth: '1989-07-22',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1015',
    email: 'nicole.white@demo.carecommons.example',
    role: 'HOME_HEALTH_AIDE',
    languages: ['English'],
    certifications: ['HHA', 'CPR', 'FIRST_AID'],
    employmentType: 'FULL_TIME',
    hourlyRate: 17.50,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: true, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.93
  },
  {
    firstName: 'Thomas',
    lastName: 'Harris',
    dateOfBirth: '1983-12-03',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1016',
    email: 'thomas.harris@demo.carecommons.example',
    role: 'SENIOR_CAREGIVER',
    specialty: 'parkinsons_care',
    languages: ['English'],
    certifications: ['CNA', 'CPR', 'FIRST_AID', 'PARKINSONS_SPECIALIST'],
    employmentType: 'FULL_TIME',
    hourlyRate: 20.50,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.97
  },
  {
    firstName: 'Angela',
    lastName: 'Lewis',
    dateOfBirth: '1990-05-16',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1017',
    email: 'angela.lewis@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    languages: ['English'],
    certifications: ['CNA', 'CPR', 'FIRST_AID'],
    employmentType: 'FULL_TIME',
    hourlyRate: 18.00,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'EXPIRING_SOON',
    reliabilityScore: 0.91
  },
  {
    firstName: 'Christopher',
    lastName: 'Robinson',
    preferredName: 'Chris',
    dateOfBirth: '1985-08-29',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1018',
    email: 'christopher.robinson@demo.carecommons.example',
    role: 'HOME_HEALTH_AIDE',
    languages: ['English'],
    certifications: ['HHA', 'CPR', 'FIRST_AID'],
    employmentType: 'FULL_TIME',
    hourlyRate: 17.75,
    maxHoursPerWeek: 40,
    availability: { weekdays: true, weekends: true, nights: true },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.95
  },
  {
    firstName: 'Diana',
    lastName: 'Martinez-Lee',
    dateOfBirth: '1992-03-11',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-1019',
    email: 'diana.lee@demo.carecommons.example',
    role: 'COMPANION',
    languages: ['English', 'Korean'],
    certifications: ['CPR', 'FIRST_AID'],
    employmentType: 'PART_TIME',
    hourlyRate: 15.50,
    maxHoursPerWeek: 20,
    availability: { weekdays: true, weekends: false, nights: false },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.89
  },
  {
    firstName: 'Brandon',
    lastName: 'Clark',
    dateOfBirth: '1996-10-07',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-1020',
    email: 'brandon.clark@demo.carecommons.example',
    role: 'CERTIFIED_NURSING_ASSISTANT',
    languages: ['English'],
    certifications: ['CNA', 'CPR', 'FIRST_AID'],
    employmentType: 'PER_DIEM',
    hourlyRate: 17.50,
    maxHoursPerWeek: 15,
    availability: { weekdays: false, weekends: true, nights: true },
    complianceStatus: 'COMPLIANT',
    reliabilityScore: 0.85
  }
];

const CLIENT_PERSONAS: ClientPersona[] = [
  {
    firstName: 'Dorothy',
    middleName: 'Mae',
    lastName: 'Chen',
    preferredName: 'Dottie',
    dateOfBirth: '1937-03-15',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2001',
    email: 'dorothy.chen@family.example',
    conditions: ['Alzheimers Disease', 'Type 2 Diabetes', 'Hypertension'],
    riskLevel: 'HIGH',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 35,
    location: { lat: 32.7767, lng: -96.7970, address: '123 Oak Lane, Dallas, TX 75201' },
    specialNeeds: 'Dementia care specialist required. Medication reminders critical.'
  },
  {
    firstName: 'Robert',
    middleName: 'Lee',
    lastName: 'Martinez',
    preferredName: 'Bobby',
    dateOfBirth: '1952-11-22',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2002',
    conditions: ['Parkinsons Disease', 'Depression'],
    riskLevel: 'MEDIUM',
    mobility: 'WHEELCHAIR',
    authorizedHoursPerWeek: 28,
    location: { lat: 32.7555, lng: -96.8122, address: '456 Maple Drive, Dallas, TX 75203' },
    specialNeeds: 'Transfer assistance required. Prefers male caregivers.'
  },
  {
    firstName: 'Margaret',
    middleName: 'Rose',
    lastName: 'Thompson',
    preferredName: 'Maggie',
    dateOfBirth: '1942-06-15',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2003',
    conditions: ['Congestive Heart Failure', 'COPD', 'Chronic Pain'],
    riskLevel: 'HIGH',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 42,
    location: { lat: 32.7357, lng: -96.8086, address: '789 Pine Street, Dallas, TX 75204' },
    specialNeeds: 'Oxygen dependent. Wound care needed twice weekly.'
  },
  {
    firstName: 'William',
    middleName: 'Henry',
    lastName: 'Jackson',
    preferredName: 'Bill',
    dateOfBirth: '1945-09-08',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2004',
    conditions: ['Post-Stroke', 'Aphasia', 'Right-Side Weakness'],
    riskLevel: 'HIGH',
    mobility: 'WHEELCHAIR',
    authorizedHoursPerWeek: 40,
    location: { lat: 32.7826, lng: -96.8067, address: '321 Elm Avenue, Dallas, TX 75202' },
    specialNeeds: 'Speech therapy assistance. Patient with communication.'
  },
  {
    firstName: 'Elizabeth',
    middleName: 'Ann',
    lastName: 'Williams',
    preferredName: 'Betty',
    dateOfBirth: '1948-12-20',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2005',
    email: 'betty.williams@example.com',
    conditions: ['Osteoarthritis', 'Macular Degeneration', 'Anxiety'],
    riskLevel: 'LOW',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 20,
    location: { lat: 32.7902, lng: -96.8195, address: '654 Cedar Court, Dallas, TX 75205' },
    specialNeeds: 'Visual impairment. Large print materials needed.'
  },
  // Additional 25 clients to reach 30+ total
  {
    firstName: 'George',
    lastName: 'Anderson',
    dateOfBirth: '1940-05-12',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2006',
    conditions: ['Dementia', 'Incontinence'],
    riskLevel: 'MEDIUM',
    mobility: 'INDEPENDENT',
    authorizedHoursPerWeek: 25,
    location: { lat: 32.7468, lng: -96.7896, address: '111 Birch Lane, Dallas, TX 75206' }
  },
  {
    firstName: 'Helen',
    lastName: 'Taylor',
    dateOfBirth: '1939-08-25',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2007',
    conditions: ['Osteoporosis', 'Fall History'],
    riskLevel: 'MEDIUM',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 18,
    location: { lat: 32.7640, lng: -96.8298, address: '222 Willow Way, Dallas, TX 75207' }
  },
  {
    firstName: 'Charles',
    lastName: 'Moore',
    dateOfBirth: '1946-02-14',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2008',
    conditions: ['Diabetes', 'Peripheral Neuropathy', 'Kidney Disease'],
    riskLevel: 'HIGH',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 30,
    location: { lat: 32.7712, lng: -96.8452, address: '333 Aspen Drive, Dallas, TX 75208' }
  },
  {
    firstName: 'Barbara',
    lastName: 'Harris',
    dateOfBirth: '1944-07-30',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2009',
    conditions: ['Breast Cancer Survivor', 'Lymphedema'],
    riskLevel: 'MEDIUM',
    mobility: 'INDEPENDENT',
    authorizedHoursPerWeek: 15,
    location: { lat: 32.7543, lng: -96.7625, address: '444 Spruce Street, Dallas, TX 75209' }
  },
  {
    firstName: 'Joseph',
    lastName: 'Martin',
    dateOfBirth: '1941-11-18',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2010',
    conditions: ['COPD', 'Emphysema'],
    riskLevel: 'HIGH',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 28,
    location: { lat: 32.7889, lng: -96.7735, address: '555 Poplar Place, Dallas, TX 75210' }
  },
  {
    firstName: 'Nancy',
    lastName: 'Garcia',
    dateOfBirth: '1950-04-22',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2011',
    conditions: ['Rheumatoid Arthritis', 'Chronic Fatigue'],
    riskLevel: 'LOW',
    mobility: 'INDEPENDENT',
    authorizedHoursPerWeek: 12,
    location: { lat: 32.7301, lng: -96.8143, address: '666 Sycamore Ave, Dallas, TX 75211' }
  },
  {
    firstName: 'Richard',
    lastName: 'Rodriguez',
    dateOfBirth: '1943-09-05',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2012',
    conditions: ['Heart Failure', 'Atrial Fibrillation', 'Pacemaker'],
    riskLevel: 'HIGH',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 35,
    location: { lat: 32.7421, lng: -96.8372, address: '777 Hickory Hill, Dallas, TX 75212' }
  },
  {
    firstName: 'Susan',
    lastName: 'Wilson',
    dateOfBirth: '1947-06-10',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2013',
    conditions: ['Multiple Sclerosis', 'Vision Impairment'],
    riskLevel: 'MEDIUM',
    mobility: 'WHEELCHAIR',
    authorizedHoursPerWeek: 30,
    location: { lat: 32.7668, lng: -96.7512, address: '888 Magnolia Court, Dallas, TX 75213' }
  },
  {
    firstName: 'Thomas',
    lastName: 'Brown',
    dateOfBirth: '1938-01-28',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2014',
    conditions: ['Dementia', 'Wandering Risk', 'Hearing Loss'],
    riskLevel: 'CRITICAL',
    mobility: 'INDEPENDENT',
    authorizedHoursPerWeek: 50,
    location: { lat: 32.7512, lng: -96.8689, address: '999 Dogwood Lane, Dallas, TX 75214' },
    specialNeeds: '24/7 supervision required. GPS tracking bracelet.'
  },
  {
    firstName: 'Linda',
    lastName: 'Davis',
    dateOfBirth: '1949-03-17',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2015',
    conditions: ['Osteoarthritis', 'Depression'],
    riskLevel: 'LOW',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 16,
    location: { lat: 32.7734, lng: -96.7823, address: '1010 Redwood Road, Dallas, TX 75215' }
  },
  {
    firstName: 'Edward',
    lastName: 'Miller',
    dateOfBirth: '1944-12-03',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2016',
    conditions: ['Prostate Cancer', 'Incontinence', 'Chronic Pain'],
    riskLevel: 'MEDIUM',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 24,
    location: { lat: 32.7456, lng: -96.7934, address: '1111 Walnut Way, Dallas, TX 75216' }
  },
  {
    firstName: 'Patricia',
    lastName: 'Martinez',
    dateOfBirth: '1946-08-19',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2017',
    conditions: ['Stroke Recovery', 'Left-Side Weakness'],
    riskLevel: 'MEDIUM',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 28,
    location: { lat: 32.7889, lng: -96.8234, address: '1212 Chestnut Circle, Dallas, TX 75217' }
  },
  {
    firstName: 'James',
    lastName: 'Hernandez',
    dateOfBirth: '1942-05-24',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2018',
    conditions: ['Parkinsons', 'Dysphagia', 'Aspiration Risk'],
    riskLevel: 'HIGH',
    mobility: 'WHEELCHAIR',
    authorizedHoursPerWeek: 40,
    location: { lat: 32.7623, lng: -96.8456, address: '1313 Beech Boulevard, Dallas, TX 75218' }
  },
  {
    firstName: 'Mary',
    lastName: 'Lopez',
    dateOfBirth: '1951-10-09',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2019',
    conditions: ['Diabetes', 'Diabetic Retinopathy', 'Neuropathy'],
    riskLevel: 'MEDIUM',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 20,
    location: { lat: 32.7301, lng: -96.7723, address: '1414 Cypress Street, Dallas, TX 75219' }
  },
  {
    firstName: 'David',
    lastName: 'Gonzalez',
    dateOfBirth: '1940-02-15',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2020',
    conditions: ['Lung Cancer', 'Chemotherapy', 'Immunocompromised'],
    riskLevel: 'CRITICAL',
    mobility: 'BEDRIDDEN',
    authorizedHoursPerWeek: 56,
    location: { lat: 32.7567, lng: -96.8567, address: '1515 Fir Avenue, Dallas, TX 75220' },
    specialNeeds: 'Hospice care. Infection control protocols mandatory.'
  },
  {
    firstName: 'Karen',
    lastName: 'Perez',
    dateOfBirth: '1948-11-30',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2021',
    conditions: ['Alzheimers', 'Sundowning'],
    riskLevel: 'HIGH',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 35,
    location: { lat: 32.7412, lng: -96.8012, address: '1616 Holly Lane, Dallas, TX 75221' }
  },
  {
    firstName: 'Kenneth',
    lastName: 'Sanchez',
    dateOfBirth: '1945-07-12',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2022',
    conditions: ['ALS', 'Feeding Tube', 'Ventilator'],
    riskLevel: 'CRITICAL',
    mobility: 'BEDRIDDEN',
    authorizedHoursPerWeek: 60,
    location: { lat: 32.7689, lng: -96.7456, address: '1717 Juniper Court, Dallas, TX 75222' },
    specialNeeds: 'Skilled nursing required. Respiratory therapy.'
  },
  {
    firstName: 'Donna',
    lastName: 'Torres',
    dateOfBirth: '1953-04-07',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2023',
    conditions: ['Hip Replacement Recovery', 'Physical Therapy'],
    riskLevel: 'MEDIUM',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 20,
    location: { lat: 32.7834, lng: -96.8123, address: '1818 Laurel Drive, Dallas, TX 75223' }
  },
  {
    firstName: 'Paul',
    lastName: 'Rivera',
    dateOfBirth: '1941-09-21',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2024',
    conditions: ['Vascular Dementia', 'Hypertension', 'Stroke History'],
    riskLevel: 'HIGH',
    mobility: 'WHEELCHAIR',
    authorizedHoursPerWeek: 32,
    location: { lat: 32.7456, lng: -96.8345, address: '1919 Maple Terrace, Dallas, TX 75224' }
  },
  {
    firstName: 'Sandra',
    lastName: 'Flores',
    dateOfBirth: '1950-06-18',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2025',
    conditions: ['Fibromyalgia', 'Chronic Fatigue Syndrome'],
    riskLevel: 'LOW',
    mobility: 'INDEPENDENT',
    authorizedHoursPerWeek: 10,
    location: { lat: 32.7523, lng: -96.7789, address: '2020 Oak Ridge Road, Dallas, TX 75225' }
  },
  {
    firstName: 'Mark',
    lastName: 'Ramirez',
    dateOfBirth: '1947-01-29',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2026',
    conditions: ['Spinal Stenosis', 'Chronic Back Pain', 'Limited Mobility'],
    riskLevel: 'MEDIUM',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 22,
    location: { lat: 32.7678, lng: -96.8234, address: '2121 Pine Grove Lane, Dallas, TX 75226' }
  },
  {
    firstName: 'Carol',
    lastName: 'Cruz',
    dateOfBirth: '1949-12-11',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2027',
    conditions: ['Macular Degeneration', 'Glaucoma', 'Legally Blind'],
    riskLevel: 'MEDIUM',
    mobility: 'INDEPENDENT',
    authorizedHoursPerWeek: 18,
    location: { lat: 32.7345, lng: -96.7912, address: '2222 Elm Park Circle, Dallas, TX 75227' }
  },
  {
    firstName: 'Steven',
    lastName: 'Morales',
    dateOfBirth: '1943-03-26',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2028',
    conditions: ['COPD', 'Oxygen Dependent', 'Pulmonary Hypertension'],
    riskLevel: 'HIGH',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 30,
    location: { lat: 32.7812, lng: -96.8456, address: '2323 Cedar Heights Drive, Dallas, TX 75228' }
  },
  {
    firstName: 'Betty',
    lastName: 'Reyes',
    dateOfBirth: '1946-10-14',
    gender: 'FEMALE',
    pronouns: 'she/her',
    phone: '214-555-2029',
    conditions: ['Rheumatoid Arthritis', 'Joint Replacement'],
    riskLevel: 'LOW',
    mobility: 'WALKER',
    authorizedHoursPerWeek: 14,
    location: { lat: 32.7567, lng: -96.7634, address: '2424 Willow Creek Way, Dallas, TX 75229' }
  },
  {
    firstName: 'Ronald',
    lastName: 'Jimenez',
    dateOfBirth: '1939-05-03',
    gender: 'MALE',
    pronouns: 'he/him',
    phone: '214-555-2030',
    conditions: ['Heart Failure', 'Kidney Failure', 'Dialysis Patient'],
    riskLevel: 'CRITICAL',
    mobility: 'WHEELCHAIR',
    authorizedHoursPerWeek: 45,
    location: { lat: 32.7423, lng: -96.8178, address: '2525 Birch Valley Court, Dallas, TX 75230' },
    specialNeeds: 'Transportation to dialysis 3x per week. Fluid restriction monitoring.'
  }
];

const COORDINATOR_PERSONAS: CoordinatorPersona[] = [
  {
    firstName: 'Sarah',
    lastName: 'Kim',
    email: 'sarah.kim@demo.carecommons.example',
    role: 'FIELD_COORDINATOR',
    branch: 'North Dallas'
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@demo.carecommons.example',
    role: 'SCHEDULING_COORDINATOR',
    branch: 'Main Office'
  },
  {
    firstName: 'Jennifer',
    lastName: 'Lopez',
    email: 'jennifer.lopez@demo.carecommons.example',
    role: 'CARE_COORDINATOR',
    branch: 'North Dallas'
  }
];

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

async function seedDatabase() {
  console.log('🎭 Seeding enhanced interactive demo data...\n');

  const env = process.env.NODE_ENV || 'development';
  const dbName = process.env.DB_NAME || 'care_commons';

  let db: Database | { transaction: (callback: (client: PoolClient) => Promise<void>) => Promise<void>; close: () => Promise<void> };

  if (process.env.DATABASE_URL) {
    console.log('📝 Using DATABASE_URL for seeding\n');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    db = {
      transaction: async (callback: (client: PoolClient) => Promise<void>) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await callback(client);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      close: async () => await pool.end(),
    };
  } else {
    const database = env === 'test' ? `${dbName}_test` : dbName;
    
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
    };
    
    db = new Database(config);
  }

  try {
    await db.transaction(async (client: PoolClient) => {
      // Fetch existing organization, branch, and user
      console.log('Fetching existing organization...');
      const orgResult = await client.query(
        'SELECT id, name FROM organizations ORDER BY created_at ASC LIMIT 1'
      );
      
      if (orgResult.rows.length === 0) {
        throw new Error('No organization found. Please run "npm run db:seed" first.');
      }
      
      const orgId = orgResult.rows[0].id;
      const orgName = orgResult.rows[0].name;
      
      console.log(`Using organization: ${orgName} (${orgId})`);
      
      const branchResult = await client.query(
        'SELECT id, name FROM branches WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1',
        [orgId]
      );
      
      if (branchResult.rows.length === 0) {
        throw new Error('No branch found. Please run "npm run db:seed" first.');
      }
      
      const branchId = branchResult.rows[0].id;
      const branchName = branchResult.rows[0].name;
      
      console.log(`Using branch: ${branchName} (${branchId})`);
      
      const userResult = await client.query(
        'SELECT id FROM users WHERE organization_id = $1 ORDER BY created_at ASC LIMIT 1',
        [orgId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('No user found. Please run "npm run db:seed" first.');
      }
      
      const systemUserId = userResult.rows[0].id;
      
      console.log(`Using system user: ${systemUserId}\n`);

      // Create program for demo
      const programId = uuidv4();
      console.log('Creating Personal Care Services program...');
      await client.query(
        `INSERT INTO programs (
          id, organization_id, name, code, description,
          program_type, funding_source, status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          programId,
          orgId,
          'Personal Care Services',
          'PCS',
          'In-home personal care assistance and support services',
          'HOME_CARE',
          'MEDICAID',
          'ACTIVE',
          systemUserId,
          systemUserId
        ]
      );

      console.log(`✅ Created program: ${programId}\n`);

      // ========================================================================
      // SEED CAREGIVERS
      // ========================================================================
      console.log('📝 Seeding 20+ caregivers...');
      
      // Track caregiver IDs for future visit generation (Phase 1.2)
      const caregiverIds = new Map<string, string>();
      let caregiverCount = 0;
      
      for (const [index, persona] of CAREGIVER_PERSONAS.entries()) {
        const caregiverId = uuidv4();
        const employeeNumber = `EMP-${String(index + 1).padStart(4, '0')}`;
        
        // Calculate credential expiration dates
        const today = new Date();
        const expiringDate = new Date(today);
        expiringDate.setDate(expiringDate.getDate() + 25); // 25 days from now
        const futureDate = new Date(today);
        futureDate.setFullYear(futureDate.getFullYear() + 2); // 2 years from now
        
        const credentials: Array<{
          id: string;
          type: string;
          name: string;
          number: string;
          issuingAuthority: string;
          issueDate: string;
          expirationDate: string;
          status: string;
          verifiedDate: string;
        }> = [];
        
        for (const certType of persona.certifications) {
          const expirationDate = persona.complianceStatus === 'EXPIRING_SOON' && certType === 'CNA'
            ? expiringDate.toISOString().split('T')[0]
            : futureDate.toISOString().split('T')[0];
          
          credentials.push({
            id: uuidv4(),
            type: certType,
            name: getCertificationName(certType),
            number: `${certType}-${Math.floor(Math.random() * 900000) + 100000}`,
            issuingAuthority: 'Texas Department of State Health Services',
            issueDate: '2020-01-01',
            expirationDate,
            status: 'ACTIVE',
            verifiedDate: '2020-01-05'
          });
        }
        
        // Build availability schedule
        const availability = {
          schedule: {
            monday: { available: persona.availability.weekdays, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
            tuesday: { available: persona.availability.weekdays, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
            wednesday: { available: persona.availability.weekdays, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
            thursday: { available: persona.availability.weekdays, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
            friday: { available: persona.availability.weekdays, timeSlots: [{ startTime: '08:00', endTime: '17:00' }] },
            saturday: { available: persona.availability.weekends, timeSlots: persona.availability.weekends ? [{ startTime: '08:00', endTime: '16:00' }] : [] },
            sunday: { available: false, timeSlots: [] }
          },
          lastUpdated: new Date().toISOString()
        };
        
        await client.query(
          `INSERT INTO caregivers (
            id, organization_id, branch_ids, primary_branch_id,
            employee_number, first_name, middle_name, last_name, preferred_name,
            date_of_birth, gender, pronouns,
            primary_phone, email, preferred_contact_method,
            languages, primary_address,
            emergency_contacts, employment_type, employment_status, hire_date,
            role, permissions, credentials, training, skills,
            availability, max_hours_per_week,
            willing_to_travel, max_travel_distance,
            pay_rate, compliance_status, reliability_score,
            status, created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
            $33, $34, $35, $36
          )`,
          [
            caregiverId, orgId, [branchId], branchId,
            employeeNumber, persona.firstName, persona.middleName || null, persona.lastName, persona.preferredName || null,
            persona.dateOfBirth, persona.gender, persona.pronouns,
            JSON.stringify({ number: persona.phone, type: 'MOBILE', canReceiveSMS: true, isPrimary: true }),
            persona.email, 'SMS',
            persona.languages,
            JSON.stringify({
              type: 'HOME',
              line1: `${Math.floor(Math.random() * 9000) + 1000} Care St`,
              city: 'Dallas',
              state: 'TX',
              postalCode: '75201',
              country: 'US'
            }),
            JSON.stringify([{
              id: uuidv4(),
              name: 'Emergency Contact',
              relationship: 'Spouse',
              phone: { number: '214-555-9999', type: 'MOBILE', canReceiveSMS: true },
              isPrimary: true
            }]),
            persona.employmentType, 'ACTIVE', '2020-01-15',
            persona.role,
            ['visits:create', 'visits:read', 'visits:update', 'clients:read'],
            JSON.stringify(credentials),
            JSON.stringify([{
              id: uuidv4(),
              name: 'New Employee Orientation',
              category: 'ORIENTATION',
              completionDate: '2020-01-20',
              hours: 8,
              status: 'COMPLETED'
            }]),
            JSON.stringify(persona.specialty ? [
              { id: uuidv4(), name: 'Personal Care', category: 'Clinical', proficiencyLevel: 'EXPERT' },
              { id: uuidv4(), name: persona.specialty, category: 'Specialized', proficiencyLevel: 'ADVANCED' }
            ] : [
              { id: uuidv4(), name: 'Personal Care', category: 'Clinical', proficiencyLevel: 'INTERMEDIATE' }
            ]),
            JSON.stringify(availability),
            persona.maxHoursPerWeek,
            true, 25,
            JSON.stringify({
              id: uuidv4(),
              rateType: 'BASE',
              amount: persona.hourlyRate,
              unit: 'HOURLY',
              effectiveDate: '2024-01-01',
              overtimeMultiplier: 1.5,
              weekendMultiplier: 1.2
            }),
            persona.complianceStatus, persona.reliabilityScore,
            'ACTIVE', systemUserId, systemUserId
          ]
        );
        
        caregiverIds.set(`${persona.firstName} ${persona.lastName}`, caregiverId);
        caregiverCount++;
      }
      
      console.log(`✅ Created ${caregiverCount} caregivers (${caregiverIds.size} tracked)\n`);

      // ========================================================================
      // SEED CLIENTS
      // ========================================================================
      console.log('📝 Seeding 30+ clients...');
      
      // Track client IDs for future visit generation (Phase 1.2)
      const clientIds = new Map<string, string>();
      let clientCount = 0;
      
      for (const [index, persona] of CLIENT_PERSONAS.entries()) {
        const clientId = uuidv4();
        const clientNumber = `CL-2024-${String(index + 1).padStart(3, '0')}`;
        
        await client.query(
          `INSERT INTO clients (
            id, organization_id, branch_id, client_number,
            first_name, middle_name, last_name, preferred_name,
            date_of_birth, gender, pronouns,
            primary_phone, email, preferred_contact_method,
            primary_address, living_arrangement, mobility_info,
            emergency_contacts, authorized_contacts,
            programs, service_eligibility,
            risk_flags, special_instructions,
            status, intake_date, referral_source,
            created_by, updated_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
          )`,
          [
            clientId, orgId, branchId, clientNumber,
            persona.firstName, persona.middleName || null, persona.lastName, persona.preferredName || null,
            persona.dateOfBirth, persona.gender, persona.pronouns,
            JSON.stringify({ number: persona.phone, type: 'HOME', canReceiveSMS: false }),
            persona.email || null, 'PHONE',
            JSON.stringify({
              type: 'HOME',
              line1: persona.location.address.split(',')[0],
              city: 'Dallas',
              state: 'TX',
              postalCode: '75201',
              country: 'US',
              latitude: persona.location.lat,
              longitude: persona.location.lng
            }),
            JSON.stringify({
              type: 'ALONE',
              householdMembers: 1,
              pets: []
            }),
            JSON.stringify({
              requiresWheelchair: persona.mobility === 'WHEELCHAIR',
              requiresWalker: persona.mobility === 'WALKER',
              transferAssistance: persona.mobility === 'WHEELCHAIR' ? 'MODERATE' : 'MINIMAL',
              notes: `Mobility: ${persona.mobility}`
            }),
            JSON.stringify([{
              id: uuidv4(),
              name: 'Family Member',
              relationship: 'Daughter',
              phone: { number: '214-555-8888', type: 'MOBILE', canReceiveSMS: true },
              email: 'family@example.com',
              isPrimary: true,
              canMakeHealthcareDecisions: true
            }]),
            JSON.stringify([{
              id: uuidv4(),
              name: 'Family Member',
              relationship: 'Daughter',
              phone: { number: '214-555-8888', type: 'MOBILE', canReceiveSMS: true },
              email: 'family@example.com',
              authorizations: [
                { type: 'HIPAA', grantedAt: '2024-01-10T10:00:00Z' },
                { type: 'SCHEDULE_CHANGES', grantedAt: '2024-01-10T10:00:00Z' }
              ]
            }]),
            JSON.stringify([{
              id: uuidv4(),
              programId: programId,
              programName: 'Personal Care Services',
              enrollmentDate: '2024-01-15',
              status: 'ACTIVE',
              authorizedHoursPerWeek: persona.authorizedHoursPerWeek
            }]),
            JSON.stringify({
              medicaidEligible: true,
              medicareEligible: true,
              medicareNumber: `MCR${Math.floor(Math.random() * 1000000000)}`,
              veteransBenefits: false
            }),
            JSON.stringify([{
              id: uuidv4(),
              type: persona.riskLevel === 'HIGH' || persona.riskLevel === 'CRITICAL' ? 'FALL_RISK' : 'MEDICATION_COMPLIANCE',
              severity: persona.riskLevel,
              description: `Risk level: ${persona.riskLevel}. Conditions: ${persona.conditions.join(', ')}`,
              identifiedDate: '2024-01-15',
              requiresAcknowledgment: persona.riskLevel === 'HIGH' || persona.riskLevel === 'CRITICAL'
            }]),
            persona.specialNeeds || `Care for: ${persona.conditions.join(', ')}`,
            'ACTIVE', '2024-01-15', 'Medical Referral',
            systemUserId, systemUserId
          ]
        );
        
        clientIds.set(`${persona.firstName} ${persona.lastName}`, clientId);
        clientCount++;
      }
      
      console.log(`✅ Created ${clientCount} clients (${clientIds.size} tracked)\n`);

      // ========================================================================
      // SEED COORDINATORS
      // ========================================================================
      console.log('📝 Seeding coordinators...');
      
      // Track coordinator IDs for future audit trail generation (Phase 1.2)
      const coordinatorIds = new Map<string, string>();
      let coordinatorCount = 0;
      
      for (const persona of COORDINATOR_PERSONAS) {
        const coordinatorId = uuidv4();
        const username = `${persona.firstName.toLowerCase()}.${persona.lastName.toLowerCase()}`;
        
        await client.query(
          `INSERT INTO users (
            id, organization_id, username, email,
            password_hash, first_name, last_name,
            roles, branch_ids, status,
            created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            coordinatorId, orgId, username, persona.email,
            '$2b$10$placeholder', // Password hash placeholder
            persona.firstName, persona.lastName,
            [persona.role],
            [branchId],
            'ACTIVE',
            systemUserId, systemUserId
          ]
        );
        
        coordinatorIds.set(`${persona.firstName} ${persona.lastName}`, coordinatorId);
        coordinatorCount++;
      }
      
      console.log(`✅ Created ${coordinatorCount} coordinators (${coordinatorIds.size} tracked)\n`);

      // ========================================================================
      // SUMMARY
      // ========================================================================
      console.log('\n✅ Enhanced demo data seeded successfully!\n');
      console.log('📊 Demo data summary:');
      console.log(`  Organization: ${orgName}`);
      console.log(`  Branch: ${branchName}`);
      console.log(`  Program: Personal Care Services (${programId})`);
      console.log(`\n👨‍⚕️ Caregivers: ${CAREGIVER_PERSONAS.length}`);
      console.log(`    - Full-time: ${CAREGIVER_PERSONAS.filter(p => p.employmentType === 'FULL_TIME').length}`);
      console.log(`    - Part-time: ${CAREGIVER_PERSONAS.filter(p => p.employmentType === 'PART_TIME').length}`);
      console.log(`    - Per diem: ${CAREGIVER_PERSONAS.filter(p => p.employmentType === 'PER_DIEM').length}`);
      console.log(`    - Compliant: ${CAREGIVER_PERSONAS.filter(p => p.complianceStatus === 'COMPLIANT').length}`);
      console.log(`    - Expiring credentials: ${CAREGIVER_PERSONAS.filter(p => p.complianceStatus === 'EXPIRING_SOON').length}`);
      console.log(`\n👥 Clients: ${CLIENT_PERSONAS.length}`);
      console.log(`    - Low risk: ${CLIENT_PERSONAS.filter(p => p.riskLevel === 'LOW').length}`);
      console.log(`    - Medium risk: ${CLIENT_PERSONAS.filter(p => p.riskLevel === 'MEDIUM').length}`);
      console.log(`    - High risk: ${CLIENT_PERSONAS.filter(p => p.riskLevel === 'HIGH').length}`);
      console.log(`    - Critical risk: ${CLIENT_PERSONAS.filter(p => p.riskLevel === 'CRITICAL').length}`);
      console.log(`\n👔 Coordinators: ${COORDINATOR_PERSONAS.length}`);
      console.log(`    - Field: ${COORDINATOR_PERSONAS.filter(p => p.role === 'FIELD_COORDINATOR').length}`);
      console.log(`    - Scheduling: ${COORDINATOR_PERSONAS.filter(p => p.role === 'SCHEDULING_COORDINATOR').length}`);
      console.log(`    - Care: ${COORDINATOR_PERSONAS.filter(p => p.role === 'CARE_COORDINATOR').length}`);
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
