/**
 * Credential Expiration Service
 * 
 * Monitors caregiver credentials, training, and background checks for expiration.
 * Generates alerts at configurable intervals (30, 60, 90 days) and triggers
 * compliance status updates when items expire.
 * 
 * HIPAA Compliance: This service handles PHI (credential details, dates).
 * All access is logged and role-based permissions are enforced.
 */

import {
  Database,
  UserContext,
  NotFoundError,
} from '@folkcare/core';
import { CaregiverRepository } from '../repository/caregiver-repository.js';
import {
  Caregiver,
  Credential,
  TrainingRecord,
  ComplianceStatus,
  TexasCaregiverData,
  FloridaCaregiverData,
} from '../types/caregiver.js';

/**
 * Alert thresholds in days before expiration
 */
export const DEFAULT_ALERT_THRESHOLDS = [90, 60, 30, 14, 7] as const;

/**
 * Types of expiring items
 */
export type ExpiringItemType = 
  | 'CREDENTIAL'
  | 'TRAINING'
  | 'BACKGROUND_CHECK'
  | 'DRUG_SCREENING'
  | 'HEALTH_SCREENING'
  | 'STATE_SCREENING'
  | 'DELEGATION';

/**
 * Severity levels for expiration alerts
 */
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EXPIRED';

/**
 * An item that is expiring or has expired
 */
export interface ExpiringItem {
  caregiverId: string;
  caregiverName: string;
  caregiverEmployeeNumber: string;
  organizationId: string;
  branchIds: string[];
  
  itemType: ExpiringItemType;
  itemId: string;
  itemName: string;
  itemDetails?: string;
  
  expirationDate: Date;
  daysUntilExpiration: number;
  severity: AlertSeverity;
  
  // For state-specific items
  stateCode?: 'TX' | 'FL';
  
  // Compliance impact
  blocksScheduling: boolean;
  requiresRenewal: boolean;
  renewalInstructions?: string;
}

/**
 * Summary of credential status for an organization
 */
export interface CredentialStatusSummary {
  organizationId: string;
  totalCaregivers: number;
  
  compliant: number;
  pendingVerification: number;
  expiringSoon: number;
  expired: number;
  nonCompliant: number;
  
  expiringItems: {
    within7Days: number;
    within30Days: number;
    within60Days: number;
    within90Days: number;
  };
  
  byType: Record<ExpiringItemType, number>;
  byState: Record<string, number>;
  
  generatedAt: Date;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  thresholdDays: number[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  dashboardAlerts: boolean;
  blockSchedulingOnExpiration: boolean;
  blockSchedulingDaysBeforeExpiration?: number;
}

const DEFAULT_CONFIG: AlertConfig = {
  thresholdDays: [...DEFAULT_ALERT_THRESHOLDS],
  emailNotifications: true,
  smsNotifications: false,
  dashboardAlerts: true,
  blockSchedulingOnExpiration: true,
  blockSchedulingDaysBeforeExpiration: 0,
};

export class CredentialExpirationService {
  private repository: CaregiverRepository;
  private config: AlertConfig;

  constructor(database: Database, config: Partial<AlertConfig> = {}) {
    this.repository = new CaregiverRepository(database);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get all expiring items for an organization
   */
  async getExpiringItems(
    organizationId: string,
    options: {
      daysAhead?: number;
      includeExpired?: boolean;
      itemTypes?: ExpiringItemType[];
      branchId?: string;
    } = {}
  ): Promise<ExpiringItem[]> {
    const {
      daysAhead = 90,
      includeExpired = true,
      itemTypes,
      branchId,
    } = options;

    const now = new Date();
    const cutoffDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    // Get caregivers with potential expiring items
    const caregivers = await this.repository.findWithExpiringCredentials(
      organizationId,
      daysAhead
    );

    const expiringItems: ExpiringItem[] = [];

    for (const caregiver of caregivers) {
      // Filter by branch if specified
      if (branchId && !caregiver.branchIds.includes(branchId)) {
        continue;
      }

      // Check credentials
      if (!itemTypes || itemTypes.includes('CREDENTIAL')) {
        const credentialItems = this.checkCredentials(caregiver, now, cutoffDate, includeExpired);
        expiringItems.push(...credentialItems);
      }

      // Check training
      if (!itemTypes || itemTypes.includes('TRAINING')) {
        const trainingItems = this.checkTraining(caregiver, now, cutoffDate, includeExpired);
        expiringItems.push(...trainingItems);
      }

      // Check background check
      if (!itemTypes || itemTypes.includes('BACKGROUND_CHECK')) {
        const bgCheckItems = this.checkBackgroundCheck(caregiver, now, cutoffDate, includeExpired);
        expiringItems.push(...bgCheckItems);
      }

      // Check drug screening
      if (!itemTypes || itemTypes.includes('DRUG_SCREENING')) {
        const drugItems = this.checkDrugScreening(caregiver, now, cutoffDate, includeExpired);
        expiringItems.push(...drugItems);
      }

      // Check health screening
      if (!itemTypes || itemTypes.includes('HEALTH_SCREENING')) {
        const healthItems = this.checkHealthScreening(caregiver, now, cutoffDate, includeExpired);
        expiringItems.push(...healthItems);
      }

      // Check state-specific items
      if (!itemTypes || itemTypes.includes('STATE_SCREENING') || itemTypes.includes('DELEGATION')) {
        const stateItems = this.checkStateSpecificItems(caregiver, now, cutoffDate, includeExpired, itemTypes);
        expiringItems.push(...stateItems);
      }
    }

    // Sort by days until expiration (expired first, then closest to expiring)
    expiringItems.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

    return expiringItems;
  }

  /**
   * Get credential status summary for organization dashboard
   */
  async getStatusSummary(organizationId: string): Promise<CredentialStatusSummary> {
    const now = new Date();
    
    // Get all caregivers
    const result = await this.repository.search(
      { organizationId },
      { page: 1, limit: 10000 }
    );
    const caregivers = result.items;

    // Initialize counters
    const summary: CredentialStatusSummary = {
      organizationId,
      totalCaregivers: caregivers.length,
      compliant: 0,
      pendingVerification: 0,
      expiringSoon: 0,
      expired: 0,
      nonCompliant: 0,
      expiringItems: {
        within7Days: 0,
        within30Days: 0,
        within60Days: 0,
        within90Days: 0,
      },
      byType: {
        CREDENTIAL: 0,
        TRAINING: 0,
        BACKGROUND_CHECK: 0,
        DRUG_SCREENING: 0,
        HEALTH_SCREENING: 0,
        STATE_SCREENING: 0,
        DELEGATION: 0,
      },
      byState: {},
      generatedAt: now,
    };

    // Count by compliance status
    for (const caregiver of caregivers) {
      switch (caregiver.complianceStatus) {
        case 'COMPLIANT':
          summary.compliant++;
          break;
        case 'PENDING_VERIFICATION':
          summary.pendingVerification++;
          break;
        case 'EXPIRING_SOON':
          summary.expiringSoon++;
          break;
        case 'EXPIRED':
          summary.expired++;
          break;
        case 'NON_COMPLIANT':
          summary.nonCompliant++;
          break;
      }
    }

    // Get all expiring items for detailed breakdown
    const expiringItems = await this.getExpiringItems(organizationId, {
      daysAhead: 90,
      includeExpired: false,
    });

    for (const item of expiringItems) {
      // Count by days until expiration
      if (item.daysUntilExpiration <= 7) {
        summary.expiringItems.within7Days++;
      }
      if (item.daysUntilExpiration <= 30) {
        summary.expiringItems.within30Days++;
      }
      if (item.daysUntilExpiration <= 60) {
        summary.expiringItems.within60Days++;
      }
      if (item.daysUntilExpiration <= 90) {
        summary.expiringItems.within90Days++;
      }

      // Count by type
      summary.byType[item.itemType]++;

      // Count by state
      if (item.stateCode) {
        summary.byState[item.stateCode] = (summary.byState[item.stateCode] || 0) + 1;
      }
    }

    return summary;
  }

  /**
   * Check if a caregiver can be scheduled based on credential status
   * 
   * This is the core compliance gate for scheduling
   */
  async canBeScheduled(
    caregiverId: string,
    serviceDate: Date,
    context: UserContext
  ): Promise<{ canSchedule: boolean; blockingReasons: string[] }> {
    const caregiver = await this.repository.findById(caregiverId);
    if (!caregiver) {
      throw new NotFoundError(`Caregiver not found: ${caregiverId}`);
    }

    const blockingReasons: string[] = [];
    const checkDate = serviceDate;

    // Check compliance status
    if (caregiver.complianceStatus === 'NON_COMPLIANT') {
      blockingReasons.push('Caregiver is non-compliant');
    }

    if (caregiver.complianceStatus === 'EXPIRED') {
      blockingReasons.push('Caregiver has expired credentials');
    }

    // Check for items that will be expired by service date
    const expiringItems = await this.getExpiringItems(
      context.organizationId!,
      { daysAhead: 0, includeExpired: true }
    );

    const caregiverExpiredItems = expiringItems.filter(
      (item) =>
        item.caregiverId === caregiverId &&
        item.blocksScheduling &&
        new Date(item.expirationDate) < checkDate
    );

    for (const item of caregiverExpiredItems) {
      blockingReasons.push(
        `${item.itemName} expired on ${item.expirationDate.toLocaleDateString()}`
      );
    }

    // Check employment status
    if (caregiver.employmentStatus !== 'ACTIVE') {
      blockingReasons.push(`Employment status is ${caregiver.employmentStatus}`);
    }

    // Check caregiver status
    if (caregiver.status !== 'ACTIVE') {
      blockingReasons.push(`Caregiver status is ${caregiver.status}`);
    }

    return {
      canSchedule: blockingReasons.length === 0,
      blockingReasons,
    };
  }

  /**
   * Update compliance status for all caregivers in an organization
   * 
   * This should be run daily via a scheduled job
   */
  async updateAllComplianceStatuses(
    organizationId: string,
    context: UserContext
  ): Promise<{ updated: number; errors: string[] }> {
    const result = await this.repository.search(
      { organizationId },
      { page: 1, limit: 10000 }
    );
    const caregivers = result.items;

    let updated = 0;
    const errors: string[] = [];

    for (const caregiver of caregivers) {
      try {
        const newStatus = this.calculateComplianceStatus(caregiver);
        if (newStatus !== caregiver.complianceStatus) {
          await this.repository.updateComplianceStatus(
            caregiver.id,
            newStatus,
            context
          );
          updated++;
        }
      } catch (error) {
        errors.push(
          `Failed to update ${caregiver.employeeNumber}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { updated, errors };
  }

  /**
   * Generate expiration alert notifications
   * 
   * Returns alerts that should be sent based on threshold configuration
   */
  async generateAlerts(
    organizationId: string,
    options: { forceAll?: boolean } = {}
  ): Promise<ExpiringItem[]> {
    const expiringItems = await this.getExpiringItems(organizationId, {
      daysAhead: Math.max(...this.config.thresholdDays),
      includeExpired: true,
    });

    // Filter to items at threshold boundaries
    const alertItems = expiringItems.filter((item) => {
      if (options.forceAll) return true;
      
      // Alert if at a threshold boundary or expired
      if (item.daysUntilExpiration < 0) return true; // Expired
      
      return this.config.thresholdDays.some(
        (threshold) => item.daysUntilExpiration === threshold
      );
    });

    return alertItems;
  }

  // Private helper methods

  private checkCredentials(
    caregiver: Caregiver,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];

    for (const credential of caregiver.credentials || []) {
      if (!credential.expirationDate) continue;
      if (credential.status === 'REVOKED') continue;

      const expDate = new Date(credential.expirationDate);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
        items.push(this.createExpiringItem(
          caregiver,
          'CREDENTIAL',
          credential.id,
          credential.name,
          credential.type,
          expDate,
          daysUntil,
          this.isBlockingCredential(credential)
        ));
      }
    }

    return items;
  }

  private checkTraining(
    caregiver: Caregiver,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];

    for (const training of caregiver.training || []) {
      if (!training.expirationDate) continue;
      if (training.status !== 'COMPLETED') continue;

      const expDate = new Date(training.expirationDate);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
        items.push(this.createExpiringItem(
          caregiver,
          'TRAINING',
          training.id,
          training.name,
          training.category,
          expDate,
          daysUntil,
          this.isBlockingTraining(training)
        ));
      }
    }

    return items;
  }

  private checkBackgroundCheck(
    caregiver: Caregiver,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];
    const bgCheck = caregiver.backgroundCheck;

    if (!bgCheck?.expirationDate) return items;

    const expDate = new Date(bgCheck.expirationDate);
    const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
      items.push(this.createExpiringItem(
        caregiver,
        'BACKGROUND_CHECK',
        bgCheck.reportId || 'bg-check',
        `Background Check (${bgCheck.provider})`,
        bgCheck.provider,
        expDate,
        daysUntil,
        true // Background checks always block scheduling
      ));
    }

    return items;
  }

  private checkDrugScreening(
    caregiver: Caregiver,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];
    const drugScreen = caregiver.drugScreening;

    if (!drugScreen?.expirationDate) return items;

    const expDate = new Date(drugScreen.expirationDate);
    const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
      items.push(this.createExpiringItem(
        caregiver,
        'DRUG_SCREENING',
        drugScreen.reportId || 'drug-screen',
        `Drug Screening (${drugScreen.provider})`,
        drugScreen.provider,
        expDate,
        daysUntil,
        true // Drug screenings always block scheduling
      ));
    }

    return items;
  }

  private checkHealthScreening(
    caregiver: Caregiver,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];
    const healthScreen = caregiver.healthScreening;

    if (!healthScreen?.expirationDate) return items;

    const expDate = new Date(healthScreen.expirationDate);
    const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
      items.push(this.createExpiringItem(
        caregiver,
        'HEALTH_SCREENING',
        'health-screen',
        `Health Screening (${healthScreen.provider})`,
        healthScreen.provider,
        expDate,
        daysUntil,
        true // Health screenings always block scheduling
      ));
    }

    return items;
  }

  private checkStateSpecificItems(
    caregiver: Caregiver,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean,
    itemTypes?: ExpiringItemType[]
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];
    const stateData = caregiver.stateSpecific;

    if (!stateData) return items;

    if (stateData.state === 'TX' && stateData.texas) {
      items.push(...this.checkTexasItems(caregiver, stateData.texas, now, cutoffDate, includeExpired, itemTypes));
    }

    if (stateData.state === 'FL' && stateData.florida) {
      items.push(...this.checkFloridaItems(caregiver, stateData.florida, now, cutoffDate, includeExpired, itemTypes));
    }

    return items;
  }

  private checkTexasItems(
    caregiver: Caregiver,
    texas: TexasCaregiverData,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean,
    itemTypes?: ExpiringItemType[]
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];

    // Employee Misconduct Registry
    if ((!itemTypes || itemTypes.includes('STATE_SCREENING')) && texas.employeeMisconductRegistryCheck?.expirationDate) {
      const expDate = new Date(texas.employeeMisconductRegistryCheck.expirationDate);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
        items.push({
          ...this.createExpiringItem(
            caregiver,
            'STATE_SCREENING',
            texas.employeeMisconductRegistryCheck.confirmationNumber || 'emr-check',
            'Texas Employee Misconduct Registry Check',
            'Required every 2 years per 26 TAC §558',
            expDate,
            daysUntil,
            true
          ),
          stateCode: 'TX',
          renewalInstructions: 'Contact HHSC or initiate through HHAeXchange',
        });
      }
    }

    // Nurse Aide Registry
    if ((!itemTypes || itemTypes.includes('STATE_SCREENING')) && texas.nurseAideRegistryCheck?.expirationDate) {
      const expDate = new Date(texas.nurseAideRegistryCheck.expirationDate);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
        items.push({
          ...this.createExpiringItem(
            caregiver,
            'STATE_SCREENING',
            texas.nurseAideRegistryCheck.confirmationNumber || 'nar-check',
            'Texas Nurse Aide Registry Check',
            'Required for CNAs per HHSC regulations',
            expDate,
            daysUntil,
            true
          ),
          stateCode: 'TX',
          renewalInstructions: 'Verify through Texas DADS Nurse Aide Registry',
        });
      }
    }

    // Delegation records
    if ((!itemTypes || itemTypes.includes('DELEGATION')) && texas.delegationRecords) {
      for (const delegation of texas.delegationRecords) {
        if (!delegation.expirationDate) continue;
        if (delegation.status === 'REVOKED') continue;

        const expDate = new Date(delegation.expirationDate);
        const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
          items.push({
            ...this.createExpiringItem(
              caregiver,
              'DELEGATION',
              delegation.id,
              `Task Delegation: ${delegation.taskName}`,
              `HHSC Form 1727 - ${delegation.formNumber || 'N/A'}`,
              expDate,
              daysUntil,
              true
            ),
            stateCode: 'TX',
            renewalInstructions: 'RN supervisor must re-delegate and verify competency',
          });
        }
      }
    }

    return items;
  }

  private checkFloridaItems(
    caregiver: Caregiver,
    florida: FloridaCaregiverData,
    now: Date,
    cutoffDate: Date,
    includeExpired: boolean,
    itemTypes?: ExpiringItemType[]
  ): ExpiringItem[] {
    const items: ExpiringItem[] = [];

    // Level 2 Background Screening
    if ((!itemTypes || itemTypes.includes('STATE_SCREENING')) && florida.level2BackgroundScreening?.expirationDate) {
      const expDate = new Date(florida.level2BackgroundScreening.expirationDate);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
        items.push({
          ...this.createExpiringItem(
            caregiver,
            'STATE_SCREENING',
            florida.level2BackgroundScreening.ahcaClearanceNumber || 'l2-screen',
            'Florida Level 2 Background Screening',
            '5-year rescreening required per Chapter 435, F.S.',
            expDate,
            daysUntil,
            true
          ),
          stateCode: 'FL',
          renewalInstructions: 'Submit through AHCA Background Screening Clearinghouse',
        });
      }
    }

    // Florida License
    if ((!itemTypes || itemTypes.includes('CREDENTIAL')) && florida.flLicenseExpiration) {
      const expDate = new Date(florida.flLicenseExpiration);
      const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
        items.push({
          ...this.createExpiringItem(
            caregiver,
            'CREDENTIAL',
            florida.flLicenseNumber || 'fl-license',
            `Florida ${florida.flLicenseType} License`,
            `License #${florida.flLicenseNumber}`,
            expDate,
            daysUntil,
            true
          ),
          stateCode: 'FL',
          renewalInstructions: 'Renew through Florida DOH MQA Online Services',
        });
      }
    }

    // RN Delegation Authorizations
    if ((!itemTypes || itemTypes.includes('DELEGATION')) && florida.rnDelegationAuthorization) {
      for (const auth of florida.rnDelegationAuthorization) {
        if (!auth.expirationDate) continue;
        if (auth.status === 'REVOKED') continue;

        const expDate = new Date(auth.expirationDate);
        const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        if (expDate <= cutoffDate && (includeExpired || expDate > now)) {
          items.push({
            ...this.createExpiringItem(
              caregiver,
              'DELEGATION',
              auth.authId,
              `RN Delegation: ${auth.scope.join(', ')}`,
              `Per 59A-8.0216, F.A.C.`,
              expDate,
              daysUntil,
              true
            ),
            stateCode: 'FL',
            renewalInstructions: 'Authorizing RN must renew delegation authorization',
          });
        }
      }
    }

    return items;
  }

  private createExpiringItem(
    caregiver: Caregiver,
    itemType: ExpiringItemType,
    itemId: string,
    itemName: string,
    itemDetails: string | undefined,
    expirationDate: Date,
    daysUntilExpiration: number,
    blocksScheduling: boolean
  ): ExpiringItem {
    return {
      caregiverId: caregiver.id,
      caregiverName: `${caregiver.firstName} ${caregiver.lastName}`,
      caregiverEmployeeNumber: caregiver.employeeNumber,
      organizationId: caregiver.organizationId,
      branchIds: caregiver.branchIds,
      itemType,
      itemId,
      itemName,
      itemDetails,
      expirationDate,
      daysUntilExpiration,
      severity: this.getSeverity(daysUntilExpiration),
      blocksScheduling,
      requiresRenewal: true,
    };
  }

  private getSeverity(daysUntilExpiration: number): AlertSeverity {
    if (daysUntilExpiration < 0) return 'EXPIRED';
    if (daysUntilExpiration <= 7) return 'CRITICAL';
    if (daysUntilExpiration <= 30) return 'WARNING';
    return 'INFO';
  }

  private isBlockingCredential(credential: Credential): boolean {
    // These credential types block scheduling if expired
    const blockingTypes = [
      'CNA', 'HHA', 'PCA', 'RN', 'LPN',
      'CPR', 'FIRST_AID', 'TB_TEST',
      'DRIVERS_LICENSE', 'VEHICLE_INSURANCE',
    ];
    return blockingTypes.includes(credential.type);
  }

  private isBlockingTraining(training: TrainingRecord): boolean {
    // These training categories block scheduling if expired
    const blockingCategories = [
      'MANDATORY_COMPLIANCE',
      'CLINICAL_SKILLS',
      'SAFETY',
    ];
    return blockingCategories.includes(training.category);
  }

  private calculateComplianceStatus(caregiver: Caregiver): ComplianceStatus {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check for expired credentials
    const hasExpiredCredentials = caregiver.credentials?.some(
      (cred) =>
        cred.expirationDate &&
        new Date(cred.expirationDate) < now &&
        cred.status === 'ACTIVE'
    );
    if (hasExpiredCredentials) return 'EXPIRED';

    // Check for expiring credentials
    const hasExpiringCredentials = caregiver.credentials?.some(
      (cred) =>
        cred.expirationDate &&
        new Date(cred.expirationDate) <= thirtyDaysFromNow &&
        new Date(cred.expirationDate) >= now &&
        cred.status === 'ACTIVE'
    );
    if (hasExpiringCredentials) return 'EXPIRING_SOON';

    // Check background check
    if (caregiver.backgroundCheck) {
      if (caregiver.backgroundCheck.status === 'FLAGGED') return 'NON_COMPLIANT';
      if (caregiver.backgroundCheck.status === 'EXPIRED') return 'EXPIRED';
      if (caregiver.backgroundCheck.status === 'PENDING') return 'PENDING_VERIFICATION';
    } else {
      return 'PENDING_VERIFICATION';
    }

    // Check drug screening
    if (caregiver.drugScreening) {
      if (caregiver.drugScreening.status === 'FAILED') return 'NON_COMPLIANT';
      if (caregiver.drugScreening.status === 'EXPIRED') return 'EXPIRED';
      if (caregiver.drugScreening.status === 'PENDING') return 'PENDING_VERIFICATION';
    }

    // Check health screening
    if (caregiver.healthScreening) {
      if (caregiver.healthScreening.status === 'EXPIRED') return 'EXPIRED';
      if (caregiver.healthScreening.status === 'PENDING') return 'PENDING_VERIFICATION';
    }

    return 'COMPLIANT';
  }
}
