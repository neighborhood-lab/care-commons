/**
 * Schedule Scenario Service
 *
 * Enables "what-if" scenario planning for schedule changes.
 *
 * Use cases:
 * - Plan for staff vacations/absences
 * - Test schedule optimizations
 * - Evaluate impact of adding/removing clients
 * - Training and onboarding scenarios
 * - Compare multiple scheduling approaches
 *
 * Features:
 * - Create scenario copies of schedules
 * - Make changes without affecting live schedules
 * - Compare scenarios to live data
 * - Apply scenarios to production
 * - Track scenario history
 */

import { UUID } from '@folkcare/core';
import { Pool } from 'pg';
import { format } from 'date-fns';

/**
 * Scenario status
 */
export type ScenarioStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'APPLIED'
  | 'REJECTED'
  | 'ARCHIVED';

/**
 * Scenario type
 */
export type ScenarioType =
  | 'VACATION_COVERAGE'
  | 'STAFF_CHANGE'
  | 'CLIENT_CHANGE'
  | 'OPTIMIZATION'
  | 'TRAINING'
  | 'GENERAL';

/**
 * Schedule scenario
 */
export interface ScheduleScenario {
  id: UUID;
  organizationId: UUID;
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  status: ScenarioStatus;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  baselineDate: Date; // Date when scenario was created (baseline for comparison)
  visitCount: number;
  changeCount: number;
  createdBy: UUID;
  createdAt: Date;
  updatedAt: Date;
  appliedAt?: Date;
  appliedBy?: UUID;
  notes?: string;
}

/**
 * Scenario visit - copy of a visit in a scenario
 */
export interface ScenarioVisit {
  scenarioVisitId: UUID;
  scenarioId: UUID;
  originalVisitId?: UUID; // Null if new visit created in scenario
  clientId: UUID;
  clientName: string;
  caregiverId?: UUID;
  caregiverName?: string;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  changeType: ScenarioChangeType;
  changeReason?: string;
}

/**
 * Change type in scenario
 */
export type ScenarioChangeType =
  | 'UNCHANGED'
  | 'REASSIGNED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'ADDED';

/**
 * Scenario comparison result
 */
export interface ScenarioComparison {
  scenarioId: UUID;
  scenarioName: string;
  dateRange: { start: Date; end: Date };
  totalVisits: {
    baseline: number;
    scenario: number;
    difference: number;
  };
  changes: {
    reassigned: number;
    rescheduled: number;
    cancelled: number;
    added: number;
    unchanged: number;
  };
  affectedCaregivers: Array<{
    caregiverId: UUID;
    caregiverName: string;
    baselineVisits: number;
    scenarioVisits: number;
    hoursChange: number;
  }>;
  affectedClients: Array<{
    clientId: UUID;
    clientName: string;
    baselineVisits: number;
    scenarioVisits: number;
  }>;
  coverageAnalysis: {
    baselineCoverage: number; // percentage
    scenarioCoverage: number;
    unassignedVisitsBaseline: number;
    unassignedVisitsScenario: number;
  };
}

/**
 * Create scenario input
 */
export interface CreateScenarioInput {
  organizationId: UUID;
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  copyFromLive: boolean;
  createdBy: UUID;
}

/**
 * Scenario change input
 */
export interface ScenarioChangeInput {
  scenarioId: UUID;
  visitId: UUID;
  changeType: Exclude<ScenarioChangeType, 'UNCHANGED'>;
  newCaregiverId?: UUID;
  newDate?: Date;
  newStartTime?: string;
  newEndTime?: string;
  reason?: string;
  changedBy: UUID;
}

/**
 * Add visit to scenario input
 */
export interface AddScenarioVisitInput {
  scenarioId: UUID;
  clientId: UUID;
  caregiverId?: UUID;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  serviceTypeId: UUID;
  serviceTypeName: string;
  reason?: string;
  addedBy: UUID;
}

export class ScheduleScenarioService {
  constructor(private pool: Pool) {}

  /**
   * Create a new schedule scenario
   */
  async createScenario(input: CreateScenarioInput): Promise<ScheduleScenario> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create the scenario record
      const scenarioResult = await client.query(
        `INSERT INTO schedule_scenarios (
           organization_id, name, description, scenario_type,
           status, date_range_start, date_range_end, baseline_date,
           created_by, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, 'DRAFT', $5, $6, NOW(), $7, NOW(), NOW())
         RETURNING id, created_at, updated_at`,
        [
          input.organizationId,
          input.name,
          input.description || null,
          input.scenarioType,
          format(input.dateRangeStart, 'yyyy-MM-dd'),
          format(input.dateRangeEnd, 'yyyy-MM-dd'),
          input.createdBy,
        ]
      );

      const scenarioId = scenarioResult.rows[0].id;
      let visitCount = 0;

      // Copy visits from live schedule if requested
      if (input.copyFromLive) {
        const copyResult = await client.query(
          `INSERT INTO scenario_visits (
             scenario_id, original_visit_id, client_id, caregiver_id,
             scheduled_date, scheduled_start_time, scheduled_end_time,
             status, change_type, created_at
           )
           SELECT
             $1,
             v.id,
             v.client_id,
             v.assigned_caregiver_id,
             v.scheduled_date,
             v.scheduled_start_time,
             v.scheduled_end_time,
             v.status,
             'UNCHANGED',
             NOW()
           FROM visits v
           WHERE v.organization_id = $2
             AND v.scheduled_date >= $3
             AND v.scheduled_date <= $4
             AND v.status NOT IN ('CANCELLED')
             AND v.is_deleted = false
           RETURNING id`,
          [
            scenarioId,
            input.organizationId,
            format(input.dateRangeStart, 'yyyy-MM-dd'),
            format(input.dateRangeEnd, 'yyyy-MM-dd'),
          ]
        );
        visitCount = copyResult.rows.length;
      }

      // Update visit count
      await client.query(
        `UPDATE schedule_scenarios SET visit_count = $1, change_count = 0 WHERE id = $2`,
        [visitCount, scenarioId]
      );

      await client.query('COMMIT');

      return {
        id: scenarioId,
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        scenarioType: input.scenarioType,
        status: 'DRAFT',
        dateRangeStart: input.dateRangeStart,
        dateRangeEnd: input.dateRangeEnd,
        baselineDate: new Date(),
        visitCount,
        changeCount: 0,
        createdBy: input.createdBy,
        createdAt: scenarioResult.rows[0].created_at,
        updatedAt: scenarioResult.rows[0].updated_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a scenario by ID
   */
  async getScenario(scenarioId: UUID): Promise<ScheduleScenario | null> {
    const result = await this.pool.query(
      `SELECT
         id, organization_id, name, description, scenario_type,
         status, date_range_start, date_range_end, baseline_date,
         visit_count, change_count, created_by, created_at, updated_at,
         applied_at, applied_by, notes
       FROM schedule_scenarios
       WHERE id = $1 AND is_deleted = false`,
      [scenarioId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return this.mapRowToScenario(row);
  }

  /**
   * Get all scenarios for an organization
   */
  async getOrganizationScenarios(
    organizationId: UUID,
    status?: ScenarioStatus
  ): Promise<ScheduleScenario[]> {
    let query = `
      SELECT
        id, organization_id, name, description, scenario_type,
        status, date_range_start, date_range_end, baseline_date,
        visit_count, change_count, created_by, created_at, updated_at,
        applied_at, applied_by, notes
      FROM schedule_scenarios
      WHERE organization_id = $1 AND is_deleted = false
    `;

    const params: (string | UUID)[] = [organizationId];

    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapRowToScenario(row));
  }

  /**
   * Get visits in a scenario
   */
  async getScenarioVisits(scenarioId: UUID): Promise<ScenarioVisit[]> {
    const result = await this.pool.query(
      `SELECT
         sv.id as scenario_visit_id,
         sv.scenario_id,
         sv.original_visit_id,
         sv.client_id,
         c.first_name || ' ' || c.last_name as client_name,
         sv.caregiver_id,
         u.first_name || ' ' || u.last_name as caregiver_name,
         sv.scheduled_date,
         sv.scheduled_start_time,
         sv.scheduled_end_time,
         sv.status,
         sv.change_type,
         sv.change_reason
       FROM scenario_visits sv
       JOIN clients c ON sv.client_id = c.id
       LEFT JOIN users u ON sv.caregiver_id = u.id
       WHERE sv.scenario_id = $1
       ORDER BY sv.scheduled_date, sv.scheduled_start_time`,
      [scenarioId]
    );

    return result.rows.map((row) => ({
      scenarioVisitId: row.scenario_visit_id,
      scenarioId: row.scenario_id,
      originalVisitId: row.original_visit_id,
      clientId: row.client_id,
      clientName: row.client_name,
      caregiverId: row.caregiver_id,
      caregiverName: row.caregiver_name,
      scheduledDate: new Date(row.scheduled_date),
      scheduledStartTime: row.scheduled_start_time,
      scheduledEndTime: row.scheduled_end_time,
      status: row.status,
      changeType: row.change_type,
      changeReason: row.change_reason,
    }));
  }

  /**
   * Make a change to a visit in a scenario
   */
  async makeScenarioChange(input: ScenarioChangeInput): Promise<ScenarioVisit> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get the current scenario visit
      const visitResult = await client.query(
        `SELECT * FROM scenario_visits WHERE scenario_id = $1 AND original_visit_id = $2`,
        [input.scenarioId, input.visitId]
      );

      if (visitResult.rows.length === 0) {
        throw new Error('Visit not found in scenario');
      }

      // Apply changes based on change type - using static SQL for safety
      const newDate = input.newDate ? format(input.newDate, 'yyyy-MM-dd') : null;
      const newStatus = input.changeType === 'CANCELLED' ? 'CANCELLED' : null;

      await client.query(
        `UPDATE scenario_visits
         SET change_type = $3,
             change_reason = $4,
             updated_at = NOW(),
             caregiver_id = CASE WHEN $5::uuid IS NOT NULL THEN $5::uuid ELSE caregiver_id END,
             scheduled_date = CASE WHEN $6::date IS NOT NULL THEN $6::date ELSE scheduled_date END,
             scheduled_start_time = CASE WHEN $7::time IS NOT NULL THEN $7::time ELSE scheduled_start_time END,
             scheduled_end_time = CASE WHEN $8::time IS NOT NULL THEN $8::time ELSE scheduled_end_time END,
             status = CASE WHEN $9::text IS NOT NULL THEN $9::text ELSE status END
         WHERE scenario_id = $1 AND original_visit_id = $2`,
        [
          input.scenarioId,
          input.visitId,
          input.changeType,
          input.reason || null,
          input.changeType === 'REASSIGNED' ? input.newCaregiverId : null,
          input.changeType === 'RESCHEDULED' ? newDate : null,
          input.changeType === 'RESCHEDULED' ? input.newStartTime : null,
          input.changeType === 'RESCHEDULED' ? input.newEndTime : null,
          newStatus,
        ]
      );

      // Update scenario change count
      await client.query(
        `UPDATE schedule_scenarios
         SET change_count = (
           SELECT COUNT(*) FROM scenario_visits
           WHERE scenario_id = $1 AND change_type != 'UNCHANGED'
         ), updated_at = NOW()
         WHERE id = $1`,
        [input.scenarioId]
      );

      await client.query('COMMIT');

      // Get updated visit with names
      const updatedResult = await client.query(
        `SELECT
           sv.id as scenario_visit_id,
           sv.scenario_id,
           sv.original_visit_id,
           sv.client_id,
           c.first_name || ' ' || c.last_name as client_name,
           sv.caregiver_id,
           u.first_name || ' ' || u.last_name as caregiver_name,
           sv.scheduled_date,
           sv.scheduled_start_time,
           sv.scheduled_end_time,
           sv.status,
           sv.change_type,
           sv.change_reason
         FROM scenario_visits sv
         JOIN clients c ON sv.client_id = c.id
         LEFT JOIN users u ON sv.caregiver_id = u.id
         WHERE sv.scenario_id = $1 AND sv.original_visit_id = $2`,
        [input.scenarioId, input.visitId]
      );

      const row = updatedResult.rows[0];
      return {
        scenarioVisitId: row.scenario_visit_id,
        scenarioId: row.scenario_id,
        originalVisitId: row.original_visit_id,
        clientId: row.client_id,
        clientName: row.client_name,
        caregiverId: row.caregiver_id,
        caregiverName: row.caregiver_name,
        scheduledDate: new Date(row.scheduled_date),
        scheduledStartTime: row.scheduled_start_time,
        scheduledEndTime: row.scheduled_end_time,
        status: row.status,
        changeType: row.change_type,
        changeReason: row.change_reason,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add a new visit to a scenario
   */
  async addScenarioVisit(input: AddScenarioVisitInput): Promise<ScenarioVisit> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert new scenario visit
      const result = await client.query(
        `INSERT INTO scenario_visits (
           scenario_id, original_visit_id, client_id, caregiver_id,
           scheduled_date, scheduled_start_time, scheduled_end_time,
           status, change_type, change_reason, created_at
         ) VALUES ($1, NULL, $2, $3, $4, $5, $6, 'SCHEDULED', 'ADDED', $7, NOW())
         RETURNING id`,
        [
          input.scenarioId,
          input.clientId,
          input.caregiverId || null,
          format(input.scheduledDate, 'yyyy-MM-dd'),
          input.scheduledStartTime,
          input.scheduledEndTime,
          input.reason || null,
        ]
      );

      // Update scenario counts
      await client.query(
        `UPDATE schedule_scenarios
         SET visit_count = visit_count + 1,
             change_count = change_count + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [input.scenarioId]
      );

      await client.query('COMMIT');

      // Get client and caregiver names
      const namesResult = await client.query(
        `SELECT
           c.first_name || ' ' || c.last_name as client_name,
           u.first_name || ' ' || u.last_name as caregiver_name
         FROM clients c
         LEFT JOIN users u ON u.id = $2
         WHERE c.id = $1`,
        [input.clientId, input.caregiverId || null]
      );

      return {
        scenarioVisitId: result.rows[0].id,
        scenarioId: input.scenarioId,
        originalVisitId: undefined,
        clientId: input.clientId,
        clientName: namesResult.rows[0]?.client_name || 'Unknown',
        caregiverId: input.caregiverId,
        caregiverName: namesResult.rows[0]?.caregiver_name,
        scheduledDate: input.scheduledDate,
        scheduledStartTime: input.scheduledStartTime,
        scheduledEndTime: input.scheduledEndTime,
        status: 'SCHEDULED',
        changeType: 'ADDED',
        changeReason: input.reason,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Compare a scenario to the live schedule
   */
  async compareScenarioToLive(scenarioId: UUID): Promise<ScenarioComparison> {
    const scenario = await this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    const scenarioVisits = await this.getScenarioVisits(scenarioId);

    // Get baseline visits (live schedule at scenario creation)
    const baselineResult = await this.pool.query(
      `SELECT
         v.id,
         v.client_id,
         v.assigned_caregiver_id as caregiver_id,
         c.first_name || ' ' || c.last_name as client_name,
         u.first_name || ' ' || u.last_name as caregiver_name,
         v.scheduled_duration
       FROM visits v
       JOIN clients c ON v.client_id = c.id
       LEFT JOIN users u ON v.assigned_caregiver_id = u.id
       WHERE v.organization_id = $1
         AND v.scheduled_date >= $2
         AND v.scheduled_date <= $3
         AND v.status NOT IN ('CANCELLED')
         AND v.is_deleted = false`,
      [
        scenario.organizationId,
        format(scenario.dateRangeStart, 'yyyy-MM-dd'),
        format(scenario.dateRangeEnd, 'yyyy-MM-dd'),
      ]
    );

    // Count changes by type
    const changes = {
      reassigned: scenarioVisits.filter((v) => v.changeType === 'REASSIGNED').length,
      rescheduled: scenarioVisits.filter((v) => v.changeType === 'RESCHEDULED').length,
      cancelled: scenarioVisits.filter((v) => v.changeType === 'CANCELLED').length,
      added: scenarioVisits.filter((v) => v.changeType === 'ADDED').length,
      unchanged: scenarioVisits.filter((v) => v.changeType === 'UNCHANGED').length,
    };

    // Calculate affected caregivers
    const caregiverMap = new Map<UUID, { name: string; baseline: number; scenario: number; hours: number }>();

    for (const visit of baselineResult.rows) {
      if (visit.caregiver_id) {
        const existing = caregiverMap.get(visit.caregiver_id) || {
          name: visit.caregiver_name,
          baseline: 0,
          scenario: 0,
          hours: 0,
        };
        existing.baseline++;
        existing.hours -= (visit.scheduled_duration || 60) / 60;
        caregiverMap.set(visit.caregiver_id, existing);
      }
    }

    for (const visit of scenarioVisits) {
      if (visit.caregiverId && visit.changeType !== 'CANCELLED') {
        const existing = caregiverMap.get(visit.caregiverId) || {
          name: visit.caregiverName || 'Unknown',
          baseline: 0,
          scenario: 0,
          hours: 0,
        };
        existing.scenario++;
        // Estimate duration as 1 hour if not available
        existing.hours += 1;
        caregiverMap.set(visit.caregiverId, existing);
      }
    }

    const affectedCaregivers = Array.from(caregiverMap.entries())
      .map(([caregiverId, data]) => ({
        caregiverId,
        caregiverName: data.name,
        baselineVisits: data.baseline,
        scenarioVisits: data.scenario,
        hoursChange: Math.round(data.hours * 100) / 100,
      }))
      .filter((c) => c.baselineVisits !== c.scenarioVisits);

    // Calculate affected clients
    const clientMap = new Map<UUID, { name: string; baseline: number; scenario: number }>();

    for (const visit of baselineResult.rows) {
      const existing = clientMap.get(visit.client_id) || {
        name: visit.client_name,
        baseline: 0,
        scenario: 0,
      };
      existing.baseline++;
      clientMap.set(visit.client_id, existing);
    }

    for (const visit of scenarioVisits) {
      if (visit.changeType !== 'CANCELLED') {
        const existing = clientMap.get(visit.clientId) || {
          name: visit.clientName,
          baseline: 0,
          scenario: 0,
        };
        existing.scenario++;
        clientMap.set(visit.clientId, existing);
      }
    }

    const affectedClients = Array.from(clientMap.entries())
      .map(([clientId, data]) => ({
        clientId,
        clientName: data.name,
        baselineVisits: data.baseline,
        scenarioVisits: data.scenario,
      }))
      .filter((c) => c.baselineVisits !== c.scenarioVisits);

    // Coverage analysis
    const baselineUnassigned = baselineResult.rows.filter((v) => !v.caregiver_id).length;
    const scenarioUnassigned = scenarioVisits.filter(
      (v) => !v.caregiverId && v.changeType !== 'CANCELLED'
    ).length;

    const baselineTotal = baselineResult.rows.length;
    const scenarioTotal = scenarioVisits.filter((v) => v.changeType !== 'CANCELLED').length;

    return {
      scenarioId,
      scenarioName: scenario.name,
      dateRange: {
        start: scenario.dateRangeStart,
        end: scenario.dateRangeEnd,
      },
      totalVisits: {
        baseline: baselineTotal,
        scenario: scenarioTotal,
        difference: scenarioTotal - baselineTotal,
      },
      changes,
      affectedCaregivers,
      affectedClients,
      coverageAnalysis: {
        baselineCoverage:
          baselineTotal > 0
            ? Math.round(((baselineTotal - baselineUnassigned) / baselineTotal) * 100)
            : 100,
        scenarioCoverage:
          scenarioTotal > 0
            ? Math.round(((scenarioTotal - scenarioUnassigned) / scenarioTotal) * 100)
            : 100,
        unassignedVisitsBaseline: baselineUnassigned,
        unassignedVisitsScenario: scenarioUnassigned,
      },
    };
  }

  /**
   * Apply a scenario to the live schedule
   */
  async applyScenario(scenarioId: UUID, appliedBy: UUID): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get scenario details
      const scenario = await this.getScenario(scenarioId);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      if (scenario.status !== 'APPROVED') {
        throw new Error('Scenario must be approved before applying');
      }

      // Get scenario visits with changes
      const changedVisits = await client.query(
        `SELECT * FROM scenario_visits
         WHERE scenario_id = $1 AND change_type != 'UNCHANGED'`,
        [scenarioId]
      );

      // Apply each change to the live visits
      for (const sv of changedVisits.rows) {
        if (sv.change_type === 'ADDED') {
          // Create new visit
          await client.query(
            `INSERT INTO visits (
               organization_id, branch_id, client_id, visit_number, visit_type,
               service_type_id, service_type_name, scheduled_date,
               scheduled_start_time, scheduled_end_time, scheduled_duration,
               timezone, assigned_caregiver_id, status, assignment_method,
               address, is_urgent, is_priority, requires_supervision,
               signature_required, internal_notes, created_by, created_at
             )
             SELECT
               $1, branch_id, $2,
               'V-' || LPAD((COALESCE(MAX(SUBSTRING(visit_number FROM 3)::INT), 0) + 1)::TEXT, 6, '0'),
               'REGULAR', service_type_id, service_type_name, $3, $4, $5,
               EXTRACT(EPOCH FROM ($5::TIME - $4::TIME))/60,
               'America/Chicago', $6,
               CASE WHEN $6 IS NOT NULL THEN 'ASSIGNED' ELSE 'UNASSIGNED' END,
               'MANUAL', address, false, false, false, true,
               'Created from scenario: ' || $7, $8, NOW()
             FROM visits
             WHERE organization_id = $1
             LIMIT 1`,
            [
              scenario.organizationId,
              sv.client_id,
              sv.scheduled_date,
              sv.scheduled_start_time,
              sv.scheduled_end_time,
              sv.caregiver_id,
              scenario.name,
              appliedBy,
            ]
          );
        } else if (sv.original_visit_id) {
          if (sv.change_type === 'CANCELLED') {
            await client.query(
              `UPDATE visits SET status = 'CANCELLED', updated_at = NOW(), updated_by = $1
               WHERE id = $2`,
              [appliedBy, sv.original_visit_id]
            );
          } else if (sv.change_type === 'REASSIGNED') {
            await client.query(
              `UPDATE visits
               SET assigned_caregiver_id = $1, assigned_at = NOW(), assigned_by = $2,
                   status = CASE WHEN status = 'UNASSIGNED' THEN 'ASSIGNED' ELSE status END,
                   updated_at = NOW(), updated_by = $2
               WHERE id = $3`,
              [sv.caregiver_id, appliedBy, sv.original_visit_id]
            );
          } else if (sv.change_type === 'RESCHEDULED') {
            await client.query(
              `UPDATE visits
               SET scheduled_date = $1, scheduled_start_time = $2, scheduled_end_time = $3,
                   updated_at = NOW(), updated_by = $4
               WHERE id = $5`,
              [
                sv.scheduled_date,
                sv.scheduled_start_time,
                sv.scheduled_end_time,
                appliedBy,
                sv.original_visit_id,
              ]
            );
          }
        }
      }

      // Update scenario status
      await client.query(
        `UPDATE schedule_scenarios
         SET status = 'APPLIED', applied_at = NOW(), applied_by = $1, updated_at = NOW()
         WHERE id = $2`,
        [appliedBy, scenarioId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update scenario status
   */
  async updateScenarioStatus(
    scenarioId: UUID,
    status: ScenarioStatus,
    _updatedBy: UUID,
    notes?: string
  ): Promise<void> {
    await this.pool.query(
      `UPDATE schedule_scenarios
       SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3`,
      [status, notes, scenarioId]
    );
  }

  /**
   * Delete (archive) a scenario
   */
  async deleteScenario(scenarioId: UUID, _deletedBy: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE schedule_scenarios
       SET is_deleted = true, status = 'ARCHIVED', updated_at = NOW()
       WHERE id = $1`,
      [scenarioId]
    );
  }

  // Helper method to map database row to scenario
  private mapRowToScenario(row: Record<string, unknown>): ScheduleScenario {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      name: row.name as string,
      description: row.description as string | undefined,
      scenarioType: row.scenario_type as ScenarioType,
      status: row.status as ScenarioStatus,
      dateRangeStart: new Date(row.date_range_start as string),
      dateRangeEnd: new Date(row.date_range_end as string),
      baselineDate: new Date(row.baseline_date as string),
      visitCount: row.visit_count as number,
      changeCount: row.change_count as number,
      createdBy: row.created_by as UUID,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      appliedAt: row.applied_at ? new Date(row.applied_at as string) : undefined,
      appliedBy: row.applied_by as UUID | undefined,
      notes: row.notes as string | undefined,
    };
  }
}
