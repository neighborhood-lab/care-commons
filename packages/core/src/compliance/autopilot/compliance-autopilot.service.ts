/**
 * Compliance Autopilot Service
 * 
 * Proactive compliance monitoring service that tracks deadlines,
 * generates alerts, and prevents scheduling when credentials expire.
 * 
 * Domain Knowledge Applied:
 * - Tracks all credential expirations for caregivers
 * - Monitors authorization usage and expiration
 * - Calculates care plan review due dates by state
 * - Blocks scheduling for non-compliant caregivers
 * - Generates audit-ready compliance reports
 */

import { Database } from '../../db/connection.js';
import { UUID, StateCode } from '../../types/base.js';
import { StateComplianceService } from '../state-compliance-service.js';
import {
  ComplianceDeadline,
  ComplianceDeadlineCategory,
  DeadlineStatus,
  AlertPriority,
  DeadlineEntityType,
  AuthorizationUsage,
  CaregiverCredentialStatus,
  ComplianceDashboardSummary,
  CreateDeadlineRequest,
  ResolveDeadlineRequest,
  ComplianceAuditReport,
  DEFAULT_ALERT_CONFIGS,
  DEADLINE_CATEGORY_LABELS,
} from './types.js';

interface CaregiverRow {
  [key: string]: unknown;
  id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  credentials: unknown;
  background_check: unknown;
  training: unknown;
  compliance_status: string;
}

interface CarePlanRow {
  [key: string]: unknown;
  id: string;
  organization_id: string;
  client_id: string;
  plan_type: string;
  status: string;
  review_date: Date | null;
  last_reviewed_date: Date | null;
  authorization_number: string | null;
  authorization_hours: number | null;
  authorization_start_date: Date | null;
  authorization_end_date: Date | null;
  client_first_name: string;
  client_last_name: string;
}

// VisitRow is defined for future use when we add visit-related compliance tracking
// interface VisitRow {
//   [key: string]: unknown;
//   id: string;
//   organization_id: string;
//   client_id: string;
//   caregiver_id: string;
//   scheduled_start: Date;
//   scheduled_end: Date;
//   actual_hours: number | null;
// }

interface DeadlineRow {
  [key: string]: unknown;
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  category: string;
  title: string;
  description: string;
  deadline_date: Date;
  warning_date: Date;
  urgent_date: Date;
  status: string;
  priority: string;
  state_code: string | null;
  regulation: string | null;
  resolved_at: Date | null;
  resolved_by: string | null;
  resolution_note: string | null;
  action_url: string | null;
  action_label: string | null;
  blocks_scheduling: boolean;
  blocks_assignment: boolean;
  last_notified_at: Date | null;
  notification_count: number;
  metadata: unknown;
  created_at: Date;
  updated_at: Date;
}

/**
 * ComplianceAutopilotService
 * 
 * Core service for proactive compliance monitoring and alerting.
 */
export class ComplianceAutopilotService {
  // StateComplianceService available for future state-specific deadline calculations
  private _stateComplianceService: StateComplianceService;
  
  constructor(private db: Database) {
    this._stateComplianceService = new StateComplianceService();
  }
  
  /** Get state compliance service for state-specific calculations */
  get stateCompliance(): StateComplianceService {
    return this._stateComplianceService;
  }

  /**
   * Scan organization for compliance deadlines
   * 
   * This is the main entry point that scans all caregivers, clients,
   * and care plans to identify upcoming and overdue deadlines.
   */
  async scanOrganization(organizationId: UUID): Promise<ComplianceDeadline[]> {
    const deadlines: ComplianceDeadline[] = [];
    
    // Scan caregiver credentials
    const caregiverDeadlines = await this.scanCaregiverCredentials(organizationId);
    deadlines.push(...caregiverDeadlines);
    
    // Scan client authorizations
    const authDeadlines = await this.scanClientAuthorizations(organizationId);
    deadlines.push(...authDeadlines);
    
    // Scan care plan reviews
    const carePlanDeadlines = await this.scanCarePlanReviews(organizationId);
    deadlines.push(...carePlanDeadlines);
    
    // Save deadlines to database
    await this.saveDeadlines(organizationId, deadlines);
    
    return deadlines;
  }

  /**
   * Get compliance dashboard summary
   */
  async getDashboardSummary(organizationId: UUID): Promise<ComplianceDashboardSummary> {
    // Get all active deadlines
    const deadlines = await this.getActiveDeadlines(organizationId);
    
    // Calculate counts by status
    const overdue = deadlines.filter(d => d.status === 'OVERDUE' || d.status === 'BLOCKED');
    const dueSoon = deadlines.filter(d => d.status === 'DUE_SOON');
    const upcoming = deadlines.filter(d => d.status === 'UPCOMING');
    const current = deadlines.filter(d => d.status === 'CURRENT');
    
    // Get category breakdown
    const categoryBreakdown = this.getCategoryBreakdown(deadlines);
    
    // Get critical items (overdue with high priority)
    const criticalItems = deadlines
      .filter(d => (d.status === 'OVERDUE' || d.status === 'BLOCKED') && 
                   (d.priority === 'CRITICAL' || d.priority === 'HIGH'))
      .slice(0, 10);
    
    // Get caregiver compliance stats
    const caregiverCompliance = await this.getCaregiverComplianceStats(organizationId);
    
    // Get authorization alerts
    const authorizationAlerts = await this.getAuthorizationAlerts(organizationId);
    
    // Get upcoming deadlines (next 7 days)
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingDeadlines = deadlines
      .filter(d => d.deadlineDate <= sevenDaysFromNow && d.status !== 'CURRENT')
      .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime())
      .slice(0, 20);
    
    // Calculate overall score
    const totalDeadlines = deadlines.length;
    const overdueCount = overdue.length;
    const overallScore = totalDeadlines > 0 
      ? Math.round(((totalDeadlines - overdueCount) / totalDeadlines) * 100)
      : 100;
    
    // Determine overall status
    let overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (overdueCount > 0 && criticalItems.length > 0) {
      overallStatus = 'CRITICAL';
    } else if (overdueCount > 0 || dueSoon.length > 5) {
      overallStatus = 'WARNING';
    }
    
    return {
      organizationId,
      generatedAt: new Date(),
      overallScore,
      overallStatus,
      deadlineCounts: {
        overdue: overdue.length,
        dueSoon: dueSoon.length,
        upcoming: upcoming.length,
        current: current.length,
      },
      categoryBreakdown,
      criticalItems,
      caregiverCompliance,
      authorizationAlerts,
      upcomingDeadlines,
    };
  }

  /**
   * Get active deadlines for an organization
   */
  async getActiveDeadlines(organizationId: UUID): Promise<ComplianceDeadline[]> {
    const result = await this.db.query<DeadlineRow>(
      `SELECT * FROM compliance_deadlines 
       WHERE organization_id = $1 
         AND resolved_at IS NULL
       ORDER BY deadline_date ASC`,
      [organizationId]
    );
    
    return result.rows.map(row => this.mapRowToDeadline(row));
  }

  /**
   * Get deadlines by category
   */
  async getDeadlinesByCategory(
    organizationId: UUID,
    category: ComplianceDeadlineCategory
  ): Promise<ComplianceDeadline[]> {
    const result = await this.db.query<DeadlineRow>(
      `SELECT * FROM compliance_deadlines 
       WHERE organization_id = $1 
         AND category = $2
         AND resolved_at IS NULL
       ORDER BY deadline_date ASC`,
      [organizationId, category]
    );
    
    return result.rows.map(row => this.mapRowToDeadline(row));
  }

  /**
   * Get deadlines for a specific entity (caregiver, client, etc.)
   */
  async getDeadlinesForEntity(
    organizationId: UUID,
    entityType: DeadlineEntityType,
    entityId: UUID
  ): Promise<ComplianceDeadline[]> {
    const result = await this.db.query<DeadlineRow>(
      `SELECT * FROM compliance_deadlines 
       WHERE organization_id = $1 
         AND entity_type = $2
         AND entity_id = $3
         AND resolved_at IS NULL
       ORDER BY deadline_date ASC`,
      [organizationId, entityType, entityId]
    );
    
    return result.rows.map(row => this.mapRowToDeadline(row));
  }

  /**
   * Check if a caregiver can be scheduled
   */
  async canCaregiverBeScheduled(
    organizationId: UUID,
    caregiverId: UUID
  ): Promise<{ canSchedule: boolean; blockingIssues: string[] }> {
    const result = await this.db.query<DeadlineRow>(
      `SELECT * FROM compliance_deadlines 
       WHERE organization_id = $1 
         AND entity_type = 'CAREGIVER'
         AND entity_id = $2
         AND blocks_scheduling = true
         AND status IN ('OVERDUE', 'BLOCKED')
         AND resolved_at IS NULL`,
      [organizationId, caregiverId]
    );
    
    const blockingIssues = result.rows.map(row => row.title);
    
    return {
      canSchedule: blockingIssues.length === 0,
      blockingIssues,
    };
  }

  /**
   * Check if a caregiver can be assigned to a client
   */
  async canCaregiverBeAssigned(
    organizationId: UUID,
    caregiverId: UUID
  ): Promise<{ canAssign: boolean; blockingIssues: string[] }> {
    const result = await this.db.query<DeadlineRow>(
      `SELECT * FROM compliance_deadlines 
       WHERE organization_id = $1 
         AND entity_type = 'CAREGIVER'
         AND entity_id = $2
         AND blocks_assignment = true
         AND status IN ('OVERDUE', 'BLOCKED')
         AND resolved_at IS NULL`,
      [organizationId, caregiverId]
    );
    
    const blockingIssues = result.rows.map(row => row.title);
    
    return {
      canAssign: blockingIssues.length === 0,
      blockingIssues,
    };
  }

  /**
   * Create a manual compliance deadline
   */
  async createDeadline(
    organizationId: UUID,
    request: CreateDeadlineRequest,
    _userId: UUID
  ): Promise<ComplianceDeadline> {
    const config = DEFAULT_ALERT_CONFIGS[request.category];
    const deadlineDate = new Date(request.deadlineDate);
    
    const warningDate = new Date(deadlineDate);
    warningDate.setDate(warningDate.getDate() - config.warningDays);
    
    const urgentDate = new Date(deadlineDate);
    urgentDate.setDate(urgentDate.getDate() - config.urgentDays);
    
    const status = this.calculateStatus(deadlineDate, warningDate, urgentDate);
    const priority = this.calculatePriority(status, config);
    
    const result = await this.db.query<DeadlineRow>(
      `INSERT INTO compliance_deadlines (
        organization_id, entity_type, entity_id, entity_name, category,
        title, description, deadline_date, warning_date, urgent_date,
        status, priority, state_code, regulation, action_url, action_label,
        blocks_scheduling, blocks_assignment, notification_count, metadata,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, 0, $19, NOW(), NOW()
      ) RETURNING *`,
      [
        organizationId,
        request.entityType,
        request.entityId,
        request.entityName,
        request.category,
        request.title,
        request.description,
        deadlineDate,
        warningDate,
        urgentDate,
        status,
        priority,
        request.stateCode ?? null,
        request.regulation ?? null,
        request.actionUrl ?? null,
        request.actionLabel ?? null,
        config.blocksScheduling,
        config.blocksAssignment,
        request.metadata !== undefined ? JSON.stringify(request.metadata) : null,
      ]
    );
    
    return this.mapRowToDeadline(result.rows[0]!);
  }

  /**
   * Resolve a compliance deadline
   */
  async resolveDeadline(
    organizationId: UUID,
    request: ResolveDeadlineRequest,
    userId: UUID
  ): Promise<ComplianceDeadline> {
    const result = await this.db.query<DeadlineRow>(
      `UPDATE compliance_deadlines 
       SET resolved_at = NOW(),
           resolved_by = $3,
           resolution_note = $4,
           status = 'CURRENT',
           updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [request.deadlineId, organizationId, userId, request.resolutionNote ?? null]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Deadline not found');
    }
    
    // If a new deadline date is provided, create a new deadline
    if (request.newDeadlineDate !== undefined) {
      const existingDeadline = this.mapRowToDeadline(result.rows[0]!);
      await this.createDeadline(organizationId, {
        entityType: existingDeadline.entityType,
        entityId: existingDeadline.entityId,
        entityName: existingDeadline.entityName,
        category: existingDeadline.category,
        title: existingDeadline.title,
        description: existingDeadline.description,
        deadlineDate: request.newDeadlineDate,
        stateCode: existingDeadline.stateCode,
        regulation: existingDeadline.regulation,
        actionUrl: existingDeadline.actionUrl ?? undefined,
        actionLabel: existingDeadline.actionLabel ?? undefined,
      }, userId);
    }
    
    return this.mapRowToDeadline(result.rows[0]!);
  }

  /**
   * Update deadline statuses (should be run periodically via cron)
   */
  async updateDeadlineStatuses(organizationId: UUID): Promise<number> {
    const now = new Date();
    
    // Update to OVERDUE
    await this.db.query(
      `UPDATE compliance_deadlines 
       SET status = 'OVERDUE', priority = 'CRITICAL', updated_at = NOW()
       WHERE organization_id = $1 
         AND resolved_at IS NULL
         AND deadline_date < $2
         AND status != 'OVERDUE'`,
      [organizationId, now]
    );
    
    // Update to DUE_SOON
    await this.db.query(
      `UPDATE compliance_deadlines 
       SET status = 'DUE_SOON', priority = 'HIGH', updated_at = NOW()
       WHERE organization_id = $1 
         AND resolved_at IS NULL
         AND deadline_date >= $2
         AND urgent_date <= $2
         AND status NOT IN ('OVERDUE', 'DUE_SOON')`,
      [organizationId, now]
    );
    
    // Update to UPCOMING
    await this.db.query(
      `UPDATE compliance_deadlines 
       SET status = 'UPCOMING', priority = 'MEDIUM', updated_at = NOW()
       WHERE organization_id = $1 
         AND resolved_at IS NULL
         AND urgent_date > $2
         AND warning_date <= $2
         AND status NOT IN ('OVERDUE', 'DUE_SOON', 'UPCOMING')`,
      [organizationId, now]
    );
    
    // Count updated
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM compliance_deadlines 
       WHERE organization_id = $1 
         AND resolved_at IS NULL
         AND status != 'CURRENT'`,
      [organizationId]
    );
    
    return parseInt(countResult.rows[0]?.count ?? '0', 10);
  }

  /**
   * Get caregiver credential status
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity -- Well-structured with clear sections
  async getCaregiverCredentialStatus(
    organizationId: UUID,
    caregiverId: UUID
  ): Promise<CaregiverCredentialStatus> {
    const result = await this.db.query<CaregiverRow>(
      `SELECT * FROM caregivers 
       WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL`,
      [caregiverId, organizationId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Caregiver not found');
    }
    
    const caregiver = result.rows[0]!;
    const credentials = caregiver.credentials as { type: string; name: string; status: string; expirationDate?: string }[] ?? [];
    const backgroundCheck = caregiver.background_check as { checkDate?: string; expirationDate?: string; status?: string } | null;
    const training = caregiver.training as { type: string; completedDate?: string }[] ?? [];
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // Process credentials
    const credentialStatuses = credentials.map(cred => {
      const expDate = cred.expirationDate !== undefined ? new Date(cred.expirationDate) : undefined;
      let status: 'CURRENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING' = 'CURRENT';
      let daysUntilExpiration: number | undefined;
      
      if (expDate !== undefined) {
        daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (expDate < now) {
          status = 'EXPIRED';
        } else if (expDate < thirtyDaysFromNow) {
          status = 'EXPIRING_SOON';
        }
      }
      
      return {
        type: cred.type,
        name: cred.name,
        status,
        expirationDate: expDate,
        daysUntilExpiration,
        required: true, // State-specific requirements can be added later
      };
    });
    
    // Process background check
    let backgroundCheckStatus: CaregiverCredentialStatus['backgroundCheck'];
    if (backgroundCheck !== null) {
      const expDate = backgroundCheck.expirationDate !== undefined ? new Date(backgroundCheck.expirationDate) : undefined;
      let status: 'CURRENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING' = 'CURRENT';
      let daysUntilExpiration: number | undefined;
      
      if (expDate !== undefined) {
        daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (expDate < now) {
          status = 'EXPIRED';
        } else if (expDate < thirtyDaysFromNow) {
          status = 'EXPIRING_SOON';
        }
      }
      
      backgroundCheckStatus = {
        status,
        checkDate: backgroundCheck.checkDate !== undefined ? new Date(backgroundCheck.checkDate) : undefined,
        expirationDate: expDate,
        daysUntilExpiration,
      };
    }
    
    // Calculate training status
    const hipaaTraining = training.find(t => t.type === 'HIPAA');
    const hipaaDate = hipaaTraining?.completedDate !== undefined ? new Date(hipaaTraining.completedDate) : undefined;
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const trainingStatus = {
      annualHoursRequired: 12, // State-specific requirements can be configured
      annualHoursCompleted: training.length * 2, // Simplified calculation
      hipaaTrainingCurrent: hipaaDate !== undefined && hipaaDate > oneYearAgo,
      lastHipaaTrainingDate: hipaaDate,
    };
    
    // Determine overall status and blocking issues
    const blockingIssues: string[] = [];
    let overallStatus: CaregiverCredentialStatus['overallStatus'] = 'COMPLIANT';
    
    const expiredCredentials = credentialStatuses.filter(c => c.status === 'EXPIRED');
    const expiringSoonCredentials = credentialStatuses.filter(c => c.status === 'EXPIRING_SOON');
    
    if (expiredCredentials.length > 0) {
      overallStatus = 'EXPIRED';
      blockingIssues.push(...expiredCredentials.map(c => `${c.name} expired`));
    } else if (expiringSoonCredentials.length > 0) {
      overallStatus = 'EXPIRING_SOON';
    }
    
    if (backgroundCheckStatus?.status === 'EXPIRED') {
      overallStatus = 'EXPIRED';
      blockingIssues.push('Background check expired');
    }
    
    const canBeScheduled = blockingIssues.length === 0;
    
    return {
      caregiverId,
      caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
      overallStatus,
      credentials: credentialStatuses,
      backgroundCheck: backgroundCheckStatus,
      trainingStatus,
      canBeScheduled,
      blockingIssues,
    };
  }

  /**
   * Get authorization usage for a client
   */
  async getAuthorizationUsage(
    organizationId: UUID,
    clientId: UUID
  ): Promise<AuthorizationUsage[]> {
    const result = await this.db.query<CarePlanRow>(
      `SELECT cp.*, c.first_name as client_first_name, c.last_name as client_last_name
       FROM care_plans cp
       JOIN clients c ON c.id = cp.client_id
       WHERE cp.organization_id = $1 
         AND cp.client_id = $2
         AND cp.authorization_number IS NOT NULL
         AND cp.status = 'ACTIVE'
         AND cp.deleted_at IS NULL`,
      [organizationId, clientId]
    );
    
    const usages: AuthorizationUsage[] = [];
    
    for (const plan of result.rows) {
      if (plan.authorization_hours === null || plan.authorization_end_date === null) continue;
      
      // Get used hours from visits
      const visitResult = await this.db.query<{ total_hours: string }>(
        `SELECT COALESCE(SUM(actual_hours), 0) as total_hours
         FROM visits
         WHERE client_id = $1 
           AND scheduled_start >= $2
           AND scheduled_start <= $3
           AND status IN ('COMPLETED', 'VERIFIED')
           AND deleted_at IS NULL`,
        [clientId, plan.authorization_start_date, plan.authorization_end_date]
      );
      
      const usedUnits = parseFloat(visitResult.rows[0]?.total_hours ?? '0');
      const totalUnits = plan.authorization_hours;
      const remainingUnits = Math.max(0, totalUnits - usedUnits);
      const usagePercentage = Math.round((usedUnits / totalUnits) * 100);
      
      const now = new Date();
      const endDate = new Date(plan.authorization_end_date);
      const startDate = plan.authorization_start_date !== null ? new Date(plan.authorization_start_date) : now;
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate average usage
      const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const averageUnitsPerDay = daysPassed > 0 ? usedUnits / daysPassed : 0;
      
      // Project exhaustion date
      let projectedExhaustionDate: Date | undefined;
      if (averageUnitsPerDay > 0 && remainingUnits > 0) {
        const daysUntilExhaustion = remainingUnits / averageUnitsPerDay;
        projectedExhaustionDate = new Date(now);
        projectedExhaustionDate.setDate(projectedExhaustionDate.getDate() + daysUntilExhaustion);
      }
      
      // Determine status
      let status: AuthorizationUsage['status'] = 'HEALTHY';
      let alertMessage: string | undefined;
      
      if (endDate < now) {
        status = 'EXPIRED';
        alertMessage = 'Authorization has expired';
      } else if (remainingUnits <= 0) {
        status = 'EXHAUSTED';
        alertMessage = 'Authorization units exhausted';
      } else if (usagePercentage >= 90) {
        status = 'WARNING_90';
        alertMessage = `Only ${remainingUnits.toFixed(1)} hours remaining (${100 - usagePercentage}%)`;
      } else if (usagePercentage >= 80) {
        status = 'WARNING_80';
        alertMessage = `${remainingUnits.toFixed(1)} hours remaining (${100 - usagePercentage}%)`;
      }
      
      usages.push({
        authorizationId: plan.id,
        clientId: plan.client_id,
        clientName: `${plan.client_first_name} ${plan.client_last_name}`,
        authorizationNumber: plan.authorization_number ?? '',
        totalUnits,
        usedUnits,
        remainingUnits,
        usagePercentage,
        startDate,
        endDate,
        daysRemaining,
        status,
        averageUnitsPerDay,
        projectedExhaustionDate,
        alertMessage,
      });
    }
    
    return usages;
  }

  /**
   * Generate compliance audit report
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity -- Multi-section report aggregation
  async generateAuditReport(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceAuditReport> {
    // Get caregiver credential data
    const caregiverResult = await this.db.query<CaregiverRow>(
      `SELECT * FROM caregivers 
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    
    const credentialExpirations: ComplianceAuditReport['caregiverCredentialReport']['credentialExpirations'] = [];
    const backgroundCheckExpirations: ComplianceAuditReport['caregiverCredentialReport']['backgroundCheckExpirations'] = [];
    let compliantCaregivers = 0;
    
    for (const caregiver of caregiverResult.rows) {
      const credentials = caregiver.credentials as { type: string; expirationDate?: string; status?: string }[] ?? [];
      const backgroundCheck = caregiver.background_check as { expirationDate?: string; status?: string } | null;
      let isCompliant = true;
      
      for (const cred of credentials) {
        if (cred.expirationDate !== undefined) {
          const expDate = new Date(cred.expirationDate);
          if (expDate >= startDate && expDate <= endDate) {
            credentialExpirations.push({
              caregiverId: caregiver.id,
              caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
              credentialType: cred.type,
              expirationDate: expDate,
              status: expDate < new Date() ? 'EXPIRED' : 'EXPIRING',
            });
            if (expDate < new Date()) isCompliant = false;
          }
        }
      }
      
      if (backgroundCheck?.expirationDate !== undefined) {
        const expDate = new Date(backgroundCheck.expirationDate);
        if (expDate >= startDate && expDate <= endDate) {
          backgroundCheckExpirations.push({
            caregiverId: caregiver.id,
            caregiverName: `${caregiver.first_name} ${caregiver.last_name}`,
            expirationDate: expDate,
            status: expDate < new Date() ? 'EXPIRED' : 'EXPIRING',
          });
          if (expDate < new Date()) isCompliant = false;
        }
      }
      
      if (isCompliant) compliantCaregivers++;
    }
    
    // Get authorization data
    const authUsages: AuthorizationUsage[] = [];
    const clientResult = await this.db.query<{ id: string }>(
      `SELECT id FROM clients WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    
    for (const client of clientResult.rows) {
      const usages = await this.getAuthorizationUsage(organizationId, client.id);
      authUsages.push(...usages);
    }
    
    // Get care plan review data
    const carePlanResult = await this.db.query<CarePlanRow>(
      `SELECT cp.*, c.first_name as client_first_name, c.last_name as client_last_name
       FROM care_plans cp
       JOIN clients c ON c.id = cp.client_id
       WHERE cp.organization_id = $1 
         AND cp.status = 'ACTIVE'
         AND cp.deleted_at IS NULL`,
      [organizationId]
    );
    
    const overdueCarePlans: ComplianceAuditReport['carePlanReport']['overdueDetails'] = [];
    let reviewsOverdue = 0;
    let reviewsDueSoon = 0;
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    for (const plan of carePlanResult.rows) {
      if (plan.review_date !== null) {
        const reviewDate = new Date(plan.review_date);
        if (reviewDate < now) {
          reviewsOverdue++;
          overdueCarePlans.push({
            clientId: plan.client_id,
            clientName: `${plan.client_first_name} ${plan.client_last_name}`,
            carePlanId: plan.id,
            lastReviewDate: plan.last_reviewed_date ?? plan.review_date,
            dueDate: reviewDate,
          });
        } else if (reviewDate < sevenDaysFromNow) {
          reviewsDueSoon++;
        }
      }
    }
    
    // Get EVV data
    const evvResult = await this.db.query<{ total: string; compliant: string }>(
      `SELECT 
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE evv_status = 'VERIFIED') as compliant
       FROM visits
       WHERE organization_id = $1 
         AND scheduled_start >= $2
         AND scheduled_start <= $3
         AND deleted_at IS NULL`,
      [organizationId, startDate, endDate]
    );
    
    const totalVisits = parseInt(evvResult.rows[0]?.total ?? '0', 10);
    const compliantVisits = parseInt(evvResult.rows[0]?.compliant ?? '0', 10);
    
    return {
      organizationId,
      generatedAt: new Date(),
      reportPeriod: { startDate, endDate },
      caregiverCredentialReport: {
        totalCaregivers: caregiverResult.rows.length,
        compliantCaregivers,
        credentialExpirations,
        backgroundCheckExpirations,
      },
      authorizationReport: {
        totalClients: clientResult.rows.length,
        authorizationsExpired: authUsages.filter(a => a.status === 'EXPIRED').length,
        authorizationsExhausted: authUsages.filter(a => a.status === 'EXHAUSTED').length,
        authorizationDetails: authUsages,
      },
      carePlanReport: {
        totalCarePlans: carePlanResult.rows.length,
        reviewsOverdue,
        reviewsDueSoon,
        overdueDetails: overdueCarePlans,
      },
      evvReport: {
        totalVisits,
        compliantVisits,
        complianceRate: totalVisits > 0 ? Math.round((compliantVisits / totalVisits) * 100) : 100,
        submissionsPending: 0, // Pending submission tracking not yet implemented
        submissionsOverdue: 0,
      },
      complianceHistory: [], // Historical data tracking not yet implemented
    };
  }

  // ==================== Private Helper Methods ====================

  /**
   * Scan caregiver credentials for expiring items
   */
  private async scanCaregiverCredentials(organizationId: UUID): Promise<ComplianceDeadline[]> {
    const deadlines: ComplianceDeadline[] = [];
    
    const result = await this.db.query<CaregiverRow>(
      `SELECT * FROM caregivers 
       WHERE organization_id = $1 
         AND deleted_at IS NULL
         AND status IN ('ACTIVE', 'ONBOARDING')`,
      [organizationId]
    );
    
    const now = new Date();
    
    for (const caregiver of result.rows) {
      const caregiverName = `${caregiver.first_name} ${caregiver.last_name}`;
      
      // Check credentials
      const credentials = caregiver.credentials as { type: string; name: string; expirationDate?: string }[] ?? [];
      for (const cred of credentials) {
        if (cred.expirationDate !== undefined) {
          const expDate = new Date(cred.expirationDate);
          const config = DEFAULT_ALERT_CONFIGS.CAREGIVER_CREDENTIAL;
          
          const warningDate = new Date(expDate);
          warningDate.setDate(warningDate.getDate() - config.warningDays);
          
          const urgentDate = new Date(expDate);
          urgentDate.setDate(urgentDate.getDate() - config.urgentDays);
          
          // Only include if within warning period or overdue
          if (expDate <= new Date(now.getTime() + config.warningDays * 24 * 60 * 60 * 1000)) {
            deadlines.push({
              id: `${caregiver.id}-${cred.type}` as UUID, // Will be replaced on insert
              organizationId,
              entityType: 'CAREGIVER',
              entityId: caregiver.id as UUID,
              entityName: caregiverName,
              category: 'CAREGIVER_CREDENTIAL',
              title: `${cred.name ?? cred.type} Expiring`,
              description: `Credential ${cred.name ?? cred.type} for ${caregiverName} expires on ${expDate.toLocaleDateString()}`,
              deadlineDate: expDate,
              warningDate,
              urgentDate,
              status: this.calculateStatus(expDate, warningDate, urgentDate),
              priority: this.calculatePriority(this.calculateStatus(expDate, warningDate, urgentDate), config),
              blocksScheduling: config.blocksScheduling,
              blocksAssignment: config.blocksAssignment,
              notificationCount: 0,
              actionUrl: `/caregivers/${caregiver.id}/credentials`,
              actionLabel: 'Update Credential',
              createdAt: now,
              updatedAt: now,
            });
          }
        }
      }
      
      // Check background check
      const backgroundCheck = caregiver.background_check as { expirationDate?: string } | null;
      if (backgroundCheck?.expirationDate !== undefined) {
        const expDate = new Date(backgroundCheck.expirationDate);
        const config = DEFAULT_ALERT_CONFIGS.CAREGIVER_BACKGROUND_CHECK;
        
        const warningDate = new Date(expDate);
        warningDate.setDate(warningDate.getDate() - config.warningDays);
        
        const urgentDate = new Date(expDate);
        urgentDate.setDate(urgentDate.getDate() - config.urgentDays);
        
        if (expDate <= new Date(now.getTime() + config.warningDays * 24 * 60 * 60 * 1000)) {
          deadlines.push({
            id: `${caregiver.id}-background` as UUID,
            organizationId,
            entityType: 'CAREGIVER',
            entityId: caregiver.id as UUID,
            entityName: caregiverName,
            category: 'CAREGIVER_BACKGROUND_CHECK',
            title: 'Background Check Expiring',
            description: `Background check for ${caregiverName} expires on ${expDate.toLocaleDateString()}`,
            deadlineDate: expDate,
            warningDate,
            urgentDate,
            status: this.calculateStatus(expDate, warningDate, urgentDate),
            priority: this.calculatePriority(this.calculateStatus(expDate, warningDate, urgentDate), config),
            blocksScheduling: config.blocksScheduling,
            blocksAssignment: config.blocksAssignment,
            notificationCount: 0,
            actionUrl: `/caregivers/${caregiver.id}/background-check`,
            actionLabel: 'Initiate Background Check',
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }
    
    return deadlines;
  }

  /**
   * Scan client authorizations for expiring/exhausted items
   */
  private async scanClientAuthorizations(organizationId: UUID): Promise<ComplianceDeadline[]> {
    const deadlines: ComplianceDeadline[] = [];
    
    const result = await this.db.query<CarePlanRow>(
      `SELECT cp.*, c.first_name as client_first_name, c.last_name as client_last_name
       FROM care_plans cp
       JOIN clients c ON c.id = cp.client_id
       WHERE cp.organization_id = $1 
         AND cp.authorization_end_date IS NOT NULL
         AND cp.status = 'ACTIVE'
         AND cp.deleted_at IS NULL`,
      [organizationId]
    );
    
    const now = new Date();
    const config = DEFAULT_ALERT_CONFIGS.CLIENT_AUTHORIZATION;
    
    for (const plan of result.rows) {
      if (plan.authorization_end_date === null) continue;
      
      const clientName = `${plan.client_first_name} ${plan.client_last_name}`;
      const expDate = new Date(plan.authorization_end_date);
      
      const warningDate = new Date(expDate);
      warningDate.setDate(warningDate.getDate() - config.warningDays);
      
      const urgentDate = new Date(expDate);
      urgentDate.setDate(urgentDate.getDate() - config.urgentDays);
      
      // Only include if within warning period or overdue
      if (expDate <= new Date(now.getTime() + config.warningDays * 24 * 60 * 60 * 1000)) {
        deadlines.push({
          id: `${plan.id}-auth` as UUID,
          organizationId,
          entityType: 'CLIENT',
          entityId: plan.client_id as UUID,
          entityName: clientName,
          category: 'CLIENT_AUTHORIZATION',
          title: 'Authorization Expiring',
          description: `Service authorization ${plan.authorization_number ?? ''} for ${clientName} expires on ${expDate.toLocaleDateString()}`,
          deadlineDate: expDate,
          warningDate,
          urgentDate,
          status: this.calculateStatus(expDate, warningDate, urgentDate),
          priority: this.calculatePriority(this.calculateStatus(expDate, warningDate, urgentDate), config),
          blocksScheduling: config.blocksScheduling,
          blocksAssignment: config.blocksAssignment,
          notificationCount: 0,
          actionUrl: `/clients/${plan.client_id}/authorizations`,
          actionLabel: 'Renew Authorization',
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    return deadlines;
  }

  /**
   * Scan care plan reviews
   */
  private async scanCarePlanReviews(organizationId: UUID): Promise<ComplianceDeadline[]> {
    const deadlines: ComplianceDeadline[] = [];
    
    const result = await this.db.query<CarePlanRow>(
      `SELECT cp.*, c.first_name as client_first_name, c.last_name as client_last_name
       FROM care_plans cp
       JOIN clients c ON c.id = cp.client_id
       WHERE cp.organization_id = $1 
         AND cp.review_date IS NOT NULL
         AND cp.status = 'ACTIVE'
         AND cp.deleted_at IS NULL`,
      [organizationId]
    );
    
    const now = new Date();
    const config = DEFAULT_ALERT_CONFIGS.CLIENT_CARE_PLAN;
    
    for (const plan of result.rows) {
      if (plan.review_date === null) continue;
      
      const clientName = `${plan.client_first_name} ${plan.client_last_name}`;
      const reviewDate = new Date(plan.review_date);
      
      const warningDate = new Date(reviewDate);
      warningDate.setDate(warningDate.getDate() - config.warningDays);
      
      const urgentDate = new Date(reviewDate);
      urgentDate.setDate(urgentDate.getDate() - config.urgentDays);
      
      // Only include if within warning period or overdue
      if (reviewDate <= new Date(now.getTime() + config.warningDays * 24 * 60 * 60 * 1000)) {
        deadlines.push({
          id: `${plan.id}-review` as UUID,
          organizationId,
          entityType: 'CARE_PLAN',
          entityId: plan.id as UUID,
          entityName: `${clientName} - ${plan.plan_type}`,
          category: 'CLIENT_CARE_PLAN',
          title: 'Care Plan Review Due',
          description: `Care plan for ${clientName} requires review by ${reviewDate.toLocaleDateString()}`,
          deadlineDate: reviewDate,
          warningDate,
          urgentDate,
          status: this.calculateStatus(reviewDate, warningDate, urgentDate),
          priority: this.calculatePriority(this.calculateStatus(reviewDate, warningDate, urgentDate), config),
          blocksScheduling: config.blocksScheduling,
          blocksAssignment: config.blocksAssignment,
          notificationCount: 0,
          actionUrl: `/care-plans/${plan.id}/review`,
          actionLabel: 'Review Care Plan',
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    return deadlines;
  }

  /**
   * Save deadlines to database (upsert)
   */
  private async saveDeadlines(organizationId: UUID, deadlines: ComplianceDeadline[]): Promise<void> {
    for (const deadline of deadlines) {
      // Check if deadline already exists
      const existing = await this.db.query<DeadlineRow>(
        `SELECT id FROM compliance_deadlines 
         WHERE organization_id = $1 
           AND entity_type = $2
           AND entity_id = $3
           AND category = $4
           AND resolved_at IS NULL`,
        [organizationId, deadline.entityType, deadline.entityId, deadline.category]
      );
      
      if (existing.rows.length > 0) {
        // Update existing
        await this.db.query(
          `UPDATE compliance_deadlines 
           SET title = $2, description = $3, deadline_date = $4, warning_date = $5,
               urgent_date = $6, status = $7, priority = $8, updated_at = NOW()
           WHERE id = $1`,
          [
            existing.rows[0]!.id,
            deadline.title,
            deadline.description,
            deadline.deadlineDate,
            deadline.warningDate,
            deadline.urgentDate,
            deadline.status,
            deadline.priority,
          ]
        );
      } else {
        // Insert new
        await this.db.query(
          `INSERT INTO compliance_deadlines (
            organization_id, entity_type, entity_id, entity_name, category,
            title, description, deadline_date, warning_date, urgent_date,
            status, priority, blocks_scheduling, blocks_assignment,
            notification_count, action_url, action_label, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, $15, $16, NOW(), NOW())`,
          [
            organizationId,
            deadline.entityType,
            deadline.entityId,
            deadline.entityName,
            deadline.category,
            deadline.title,
            deadline.description,
            deadline.deadlineDate,
            deadline.warningDate,
            deadline.urgentDate,
            deadline.status,
            deadline.priority,
            deadline.blocksScheduling,
            deadline.blocksAssignment,
            deadline.actionUrl ?? null,
            deadline.actionLabel ?? null,
          ]
        );
      }
    }
  }

  /**
   * Calculate deadline status based on dates
   */
  private calculateStatus(
    deadlineDate: Date,
    warningDate: Date,
    urgentDate: Date
  ): DeadlineStatus {
    const now = new Date();
    
    if (deadlineDate < now) {
      return 'OVERDUE';
    } else if (urgentDate <= now) {
      return 'DUE_SOON';
    } else if (warningDate <= now) {
      return 'UPCOMING';
    } else {
      return 'CURRENT';
    }
  }

  /**
   * Calculate priority based on status and config
   */
  private calculatePriority(
    status: DeadlineStatus,
    config: { blocksScheduling: boolean; blocksAssignment: boolean }
  ): AlertPriority {
    if (status === 'OVERDUE' || status === 'BLOCKED') {
      return config.blocksScheduling || config.blocksAssignment ? 'CRITICAL' : 'HIGH';
    } else if (status === 'DUE_SOON') {
      return 'HIGH';
    } else if (status === 'UPCOMING') {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Get category breakdown from deadlines
   */
  private getCategoryBreakdown(deadlines: ComplianceDeadline[]): Array<{
    category: ComplianceDeadlineCategory;
    total: number;
    overdue: number;
    dueSoon: number;
    upcoming: number;
  }> {
    const categories = Object.keys(DEADLINE_CATEGORY_LABELS) as ComplianceDeadlineCategory[];
    
    return categories.map(category => {
      const categoryDeadlines = deadlines.filter(d => d.category === category);
      return {
        category,
        total: categoryDeadlines.length,
        overdue: categoryDeadlines.filter(d => d.status === 'OVERDUE' || d.status === 'BLOCKED').length,
        dueSoon: categoryDeadlines.filter(d => d.status === 'DUE_SOON').length,
        upcoming: categoryDeadlines.filter(d => d.status === 'UPCOMING').length,
      };
    }).filter(c => c.total > 0);
  }

  /**
   * Get caregiver compliance stats
   */
  private async getCaregiverComplianceStats(organizationId: UUID): Promise<{
    total: number;
    compliant: number;
    expiringSoon: number;
    expired: number;
    blocked: number;
  }> {
    const result = await this.db.query<{ status: string; count: string }>(
      `SELECT compliance_status as status, COUNT(*) as count
       FROM caregivers
       WHERE organization_id = $1 
         AND deleted_at IS NULL
         AND status IN ('ACTIVE', 'ONBOARDING')
       GROUP BY compliance_status`,
      [organizationId]
    );
    
    const stats = {
      total: 0,
      compliant: 0,
      expiringSoon: 0,
      expired: 0,
      blocked: 0,
    };
    
    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      stats.total += count;
      
      switch (row.status) {
        case 'COMPLIANT':
          stats.compliant += count;
          break;
        case 'EXPIRING_SOON':
          stats.expiringSoon += count;
          break;
        case 'EXPIRED':
        case 'NON_COMPLIANT':
          stats.expired += count;
          stats.blocked += count;
          break;
      }
    }
    
    return stats;
  }

  /**
   * Get authorization alerts (over 80% usage)
   */
  private async getAuthorizationAlerts(organizationId: UUID): Promise<AuthorizationUsage[]> {
    const alerts: AuthorizationUsage[] = [];
    
    const clientResult = await this.db.query<{ id: string }>(
      `SELECT DISTINCT client_id as id FROM care_plans 
       WHERE organization_id = $1 
         AND authorization_number IS NOT NULL
         AND status = 'ACTIVE'
         AND deleted_at IS NULL`,
      [organizationId]
    );
    
    for (const client of clientResult.rows) {
      const usages = await this.getAuthorizationUsage(organizationId, client.id);
      alerts.push(...usages.filter(u => u.status !== 'HEALTHY'));
    }
    
    return alerts.slice(0, 10); // Top 10 alerts
  }

  /**
   * Map database row to ComplianceDeadline
   */
  private mapRowToDeadline(row: DeadlineRow): ComplianceDeadline {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      entityType: row.entity_type as DeadlineEntityType,
      entityId: row.entity_id as UUID,
      entityName: row.entity_name,
      category: row.category as ComplianceDeadlineCategory,
      title: row.title,
      description: row.description,
      deadlineDate: new Date(row.deadline_date),
      warningDate: new Date(row.warning_date),
      urgentDate: new Date(row.urgent_date),
      status: row.status as DeadlineStatus,
      priority: row.priority as AlertPriority,
      stateCode: row.state_code as StateCode | undefined,
      regulation: row.regulation ?? undefined,
      resolvedAt: row.resolved_at !== null ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by as UUID | undefined,
      resolutionNote: row.resolution_note ?? undefined,
      actionUrl: row.action_url ?? undefined,
      actionLabel: row.action_label ?? undefined,
      blocksScheduling: row.blocks_scheduling,
      blocksAssignment: row.blocks_assignment,
      lastNotifiedAt: row.last_notified_at !== null ? new Date(row.last_notified_at) : undefined,
      notificationCount: row.notification_count,
      metadata: row.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
