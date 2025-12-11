/**
 * Medication Administration Record (MAR) Service
 *
 * Manages medication tracking and administration with full compliance support.
 * Features:
 * - Track medication schedules from care plans
 * - Record administrations, refusals, and missed doses
 * - Photo documentation of pill bottles
 * - Electronic signature capture
 * - MAR export for compliance reporting
 * - Offline-first with AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MEDICATIONS_KEY = '@folkcare_medications';
const MAR_RECORDS_KEY = '@folkcare_mar_records';
const SIGNATURES_KEY = '@folkcare_signatures';

export type MedicationRoute = 'oral' | 'sublingual' | 'topical' | 'injection' | 'inhalation' | 'rectal' | 'transdermal' | 'ophthalmic' | 'otic' | 'nasal';

export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_6_hours'
  | 'every_8_hours'
  | 'every_12_hours'
  | 'weekly'
  | 'as_needed'
  | 'other';

export type AdministrationStatus = 'pending' | 'administered' | 'refused' | 'missed' | 'held' | 'not_available';

export interface Medication {
  id: string;
  clientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  unit: string;
  route: MedicationRoute;
  frequency: MedicationFrequency;
  frequencyCustom?: string;
  scheduledTimes: string[]; // Array of times like ['09:00', '21:00']
  instructions?: string;
  warnings?: string[];
  isPRN: boolean;
  prnReason?: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  pharmacy?: string;
  remainingCount?: number;
  refillDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MARRecord {
  id: string;
  medicationId: string;
  medicationName: string;
  clientId: string;
  visitId: string;
  caregiverId: string;
  caregiverName: string;
  organizationId: string;

  // Scheduled info
  scheduledTime: string;
  scheduledDate: string;
  dosage: string;
  route: MedicationRoute;

  // Administration details
  status: AdministrationStatus;
  administeredAt?: string;
  actualDosage?: string;

  // Documentation
  notes?: string;
  photoUri?: string; // Photo of pill bottle
  witnessName?: string;
  witnessInitials?: string;

  // Refusal/missed info
  refusalReason?: string;
  missedReason?: string;
  heldReason?: string; // For medications held by nurse/doctor order
  notAvailableReason?: string;

  // Signature
  signatureUri?: string;
  signatureTimestamp?: string;

  // Sync status
  isSynced: boolean;
  syncPending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ElectronicSignature {
  id: string;
  caregiverId: string;
  caregiverName: string;
  signatureData: string; // Base64 encoded signature image
  createdAt: string;
  visitId?: string;
  marRecordIds: string[];
}

export interface MARExport {
  clientId: string;
  clientName: string;
  dateRange: {
    start: string;
    end: string;
  };
  medications: Medication[];
  records: MARRecord[];
  generatedAt: string;
  generatedBy: string;
}

/**
 * Get route display name
 */
function getRouteDisplayName(route: MedicationRoute): string {
  const names: Record<MedicationRoute, string> = {
    oral: 'Oral (by mouth)',
    sublingual: 'Sublingual (under tongue)',
    topical: 'Topical (on skin)',
    injection: 'Injection',
    inhalation: 'Inhalation',
    rectal: 'Rectal',
    transdermal: 'Transdermal (patch)',
    ophthalmic: 'Ophthalmic (eye)',
    otic: 'Otic (ear)',
    nasal: 'Nasal',
  };
  return names[route];
}

/**
 * Get frequency display name
 */
function getFrequencyDisplayName(frequency: MedicationFrequency): string {
  const names: Record<MedicationFrequency, string> = {
    once_daily: 'Once daily',
    twice_daily: 'Twice daily',
    three_times_daily: 'Three times daily',
    four_times_daily: 'Four times daily',
    every_6_hours: 'Every 6 hours',
    every_8_hours: 'Every 8 hours',
    every_12_hours: 'Every 12 hours',
    weekly: 'Weekly',
    as_needed: 'As needed (PRN)',
    other: 'Custom schedule',
  };
  return names[frequency];
}

export class MedicationService {
  private currentUserId = 'caregiver_1'; // Mock current user
  private currentUserName = 'Maria Garcia';
  private organizationId = 'org_1';

  /**
   * Get all medications for a client
   */
  async getMedicationsForClient(clientId: string): Promise<Medication[]> {
    const stored = await AsyncStorage.getItem(MEDICATIONS_KEY);
    if (!stored) return this.getDemoMedications(clientId);

    const all: Medication[] = JSON.parse(stored);
    const clientMeds = all.filter((m) => m.clientId === clientId && m.isActive);

    // If no meds for client, return demo data
    if (clientMeds.length === 0) {
      return this.getDemoMedications(clientId);
    }

    return clientMeds;
  }

  /**
   * Get demo medications for a client
   */
  private getDemoMedications(clientId: string): Medication[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'med_1',
        clientId,
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        dosage: '10',
        unit: 'mg',
        route: 'oral',
        frequency: 'once_daily',
        scheduledTimes: ['09:00'],
        instructions: 'Take with food. Monitor blood pressure.',
        warnings: ['May cause dizziness', 'Avoid potassium supplements'],
        isPRN: false,
        prescribedBy: 'Dr. Smith',
        pharmacy: 'CVS Pharmacy',
        remainingCount: 28,
        refillDate: '2025-01-15',
        isActive: true,
        startDate: '2024-01-01',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'med_2',
        clientId,
        name: 'Metformin',
        genericName: 'Metformin HCL',
        dosage: '500',
        unit: 'mg',
        route: 'oral',
        frequency: 'twice_daily',
        scheduledTimes: ['09:00', '18:00'],
        instructions: 'Take with meals to reduce stomach upset.',
        warnings: ['May cause GI upset', 'Take with food'],
        isPRN: false,
        prescribedBy: 'Dr. Johnson',
        pharmacy: 'Walgreens',
        remainingCount: 56,
        isActive: true,
        startDate: '2024-06-01',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'med_3',
        clientId,
        name: 'Tylenol',
        genericName: 'Acetaminophen',
        dosage: '325-650',
        unit: 'mg',
        route: 'oral',
        frequency: 'as_needed',
        scheduledTimes: [],
        instructions: 'For pain or fever. Maximum 4000mg per day.',
        warnings: ['Do not exceed 4000mg/day', 'Avoid alcohol'],
        isPRN: true,
        prnReason: 'Pain or fever',
        remainingCount: 20,
        isActive: true,
        startDate: '2024-01-01',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'med_4',
        clientId,
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        dosage: '20',
        unit: 'mg',
        route: 'oral',
        frequency: 'once_daily',
        scheduledTimes: ['08:00'],
        instructions: 'Take 30 minutes before breakfast.',
        isPRN: false,
        prescribedBy: 'Dr. Smith',
        remainingCount: 30,
        isActive: true,
        startDate: '2024-03-01',
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  /**
   * Get all MAR records
   */
  async getAllMARRecords(): Promise<MARRecord[]> {
    const stored = await AsyncStorage.getItem(MAR_RECORDS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  /**
   * Get MAR records for a visit
   */
  async getMARRecordsForVisit(visitId: string): Promise<MARRecord[]> {
    const all = await this.getAllMARRecords();
    return all.filter((r) => r.visitId === visitId);
  }

  /**
   * Get MAR records for a client on a specific date
   */
  async getMARRecordsForDate(clientId: string, date: string): Promise<MARRecord[]> {
    const all = await this.getAllMARRecords();
    return all.filter((r) => r.clientId === clientId && r.scheduledDate === date);
  }

  /**
   * Record medication administration
   */
  async recordAdministration(data: {
    medicationId: string;
    medicationName: string;
    clientId: string;
    visitId: string;
    scheduledTime: string;
    scheduledDate: string;
    dosage: string;
    route: MedicationRoute;
    actualDosage?: string;
    notes?: string;
    photoUri?: string;
    witnessName?: string;
    witnessInitials?: string;
    signatureUri?: string;
  }): Promise<MARRecord> {
    const now = new Date().toISOString();

    const record: MARRecord = {
      id: `mar_${Date.now()}`,
      medicationId: data.medicationId,
      medicationName: data.medicationName,
      clientId: data.clientId,
      visitId: data.visitId,
      caregiverId: this.currentUserId,
      caregiverName: this.currentUserName,
      organizationId: this.organizationId,

      scheduledTime: data.scheduledTime,
      scheduledDate: data.scheduledDate,
      dosage: data.dosage,
      route: data.route,

      status: 'administered',
      administeredAt: now,
      actualDosage: data.actualDosage || data.dosage,

      notes: data.notes,
      photoUri: data.photoUri,
      witnessName: data.witnessName,
      witnessInitials: data.witnessInitials,

      signatureUri: data.signatureUri,
      signatureTimestamp: data.signatureUri ? now : undefined,

      isSynced: false,
      syncPending: true,
      createdAt: now,
      updatedAt: now,
    };

    const records = await this.getAllMARRecords();
    records.unshift(record);
    await AsyncStorage.setItem(MAR_RECORDS_KEY, JSON.stringify(records));

    return record;
  }

  /**
   * Record medication refusal
   */
  async recordRefusal(data: {
    medicationId: string;
    medicationName: string;
    clientId: string;
    visitId: string;
    scheduledTime: string;
    scheduledDate: string;
    dosage: string;
    route: MedicationRoute;
    refusalReason: string;
    notes?: string;
    signatureUri?: string;
  }): Promise<MARRecord> {
    const now = new Date().toISOString();

    const record: MARRecord = {
      id: `mar_${Date.now()}`,
      medicationId: data.medicationId,
      medicationName: data.medicationName,
      clientId: data.clientId,
      visitId: data.visitId,
      caregiverId: this.currentUserId,
      caregiverName: this.currentUserName,
      organizationId: this.organizationId,

      scheduledTime: data.scheduledTime,
      scheduledDate: data.scheduledDate,
      dosage: data.dosage,
      route: data.route,

      status: 'refused',
      refusalReason: data.refusalReason,
      notes: data.notes,

      signatureUri: data.signatureUri,
      signatureTimestamp: data.signatureUri ? now : undefined,

      isSynced: false,
      syncPending: true,
      createdAt: now,
      updatedAt: now,
    };

    const records = await this.getAllMARRecords();
    records.unshift(record);
    await AsyncStorage.setItem(MAR_RECORDS_KEY, JSON.stringify(records));

    return record;
  }

  /**
   * Record missed medication
   */
  async recordMissed(data: {
    medicationId: string;
    medicationName: string;
    clientId: string;
    visitId: string;
    scheduledTime: string;
    scheduledDate: string;
    dosage: string;
    route: MedicationRoute;
    missedReason: string;
    notes?: string;
  }): Promise<MARRecord> {
    const now = new Date().toISOString();

    const record: MARRecord = {
      id: `mar_${Date.now()}`,
      medicationId: data.medicationId,
      medicationName: data.medicationName,
      clientId: data.clientId,
      visitId: data.visitId,
      caregiverId: this.currentUserId,
      caregiverName: this.currentUserName,
      organizationId: this.organizationId,

      scheduledTime: data.scheduledTime,
      scheduledDate: data.scheduledDate,
      dosage: data.dosage,
      route: data.route,

      status: 'missed',
      missedReason: data.missedReason,
      notes: data.notes,

      isSynced: false,
      syncPending: true,
      createdAt: now,
      updatedAt: now,
    };

    const records = await this.getAllMARRecords();
    records.unshift(record);
    await AsyncStorage.setItem(MAR_RECORDS_KEY, JSON.stringify(records));

    return record;
  }

  /**
   * Record held medication (held by clinical order)
   */
  async recordHeld(data: {
    medicationId: string;
    medicationName: string;
    clientId: string;
    visitId: string;
    scheduledTime: string;
    scheduledDate: string;
    dosage: string;
    route: MedicationRoute;
    heldReason: string;
    notes?: string;
  }): Promise<MARRecord> {
    const now = new Date().toISOString();

    const record: MARRecord = {
      id: `mar_${Date.now()}`,
      medicationId: data.medicationId,
      medicationName: data.medicationName,
      clientId: data.clientId,
      visitId: data.visitId,
      caregiverId: this.currentUserId,
      caregiverName: this.currentUserName,
      organizationId: this.organizationId,

      scheduledTime: data.scheduledTime,
      scheduledDate: data.scheduledDate,
      dosage: data.dosage,
      route: data.route,

      status: 'held',
      heldReason: data.heldReason,
      notes: data.notes,

      isSynced: false,
      syncPending: true,
      createdAt: now,
      updatedAt: now,
    };

    const records = await this.getAllMARRecords();
    records.unshift(record);
    await AsyncStorage.setItem(MAR_RECORDS_KEY, JSON.stringify(records));

    return record;
  }

  /**
   * Save electronic signature
   */
  async saveSignature(data: {
    signatureData: string;
    visitId?: string;
    marRecordIds: string[];
  }): Promise<ElectronicSignature> {
    const now = new Date().toISOString();

    const signature: ElectronicSignature = {
      id: `sig_${Date.now()}`,
      caregiverId: this.currentUserId,
      caregiverName: this.currentUserName,
      signatureData: data.signatureData,
      createdAt: now,
      visitId: data.visitId,
      marRecordIds: data.marRecordIds,
    };

    const stored = await AsyncStorage.getItem(SIGNATURES_KEY);
    const signatures: ElectronicSignature[] = stored ? JSON.parse(stored) : [];
    signatures.push(signature);
    await AsyncStorage.setItem(SIGNATURES_KEY, JSON.stringify(signatures));

    return signature;
  }

  /**
   * Generate MAR export for compliance
   */
  async generateMARExport(
    clientId: string,
    clientName: string,
    startDate: string,
    endDate: string
  ): Promise<MARExport> {
    const medications = await this.getMedicationsForClient(clientId);
    const allRecords = await this.getAllMARRecords();

    // Filter records by date range
    const records = allRecords.filter((r) => {
      const recordDate = new Date(r.scheduledDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return r.clientId === clientId && recordDate >= start && recordDate <= end;
    });

    return {
      clientId,
      clientName,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      medications,
      records,
      generatedAt: new Date().toISOString(),
      generatedBy: this.currentUserName,
    };
  }

  /**
   * Get status display info
   */
  getStatusInfo(status: AdministrationStatus): { label: string; color: string; icon: string } {
    const info: Record<AdministrationStatus, { label: string; color: string; icon: string }> = {
      pending: { label: 'Pending', color: '#6b7280', icon: '○' },
      administered: { label: 'Given', color: '#10b981', icon: '✓' },
      refused: { label: 'Refused', color: '#ef4444', icon: '✕' },
      missed: { label: 'Missed', color: '#f59e0b', icon: '⚠' },
      held: { label: 'Held', color: '#8b5cf6', icon: '⏸' },
      not_available: { label: 'Not Available', color: '#6b7280', icon: '?' },
    };
    return info[status];
  }

  /**
   * Get route display info
   */
  getRouteInfo(route: MedicationRoute): { label: string; abbreviation: string } {
    const info: Record<MedicationRoute, { label: string; abbreviation: string }> = {
      oral: { label: 'Oral', abbreviation: 'PO' },
      sublingual: { label: 'Sublingual', abbreviation: 'SL' },
      topical: { label: 'Topical', abbreviation: 'TOP' },
      injection: { label: 'Injection', abbreviation: 'INJ' },
      inhalation: { label: 'Inhalation', abbreviation: 'INH' },
      rectal: { label: 'Rectal', abbreviation: 'PR' },
      transdermal: { label: 'Transdermal', abbreviation: 'TD' },
      ophthalmic: { label: 'Ophthalmic', abbreviation: 'OPH' },
      otic: { label: 'Otic', abbreviation: 'OT' },
      nasal: { label: 'Nasal', abbreviation: 'NAS' },
    };
    return info[route];
  }

  /**
   * Clear all data (for testing)
   */
  async clearAllData(): Promise<void> {
    await AsyncStorage.removeItem(MEDICATIONS_KEY);
    await AsyncStorage.removeItem(MAR_RECORDS_KEY);
    await AsyncStorage.removeItem(SIGNATURES_KEY);
  }
}

export const medicationService = new MedicationService();
