/**
 * Callout Handling Service
 *
 * Quick workflow for handling same-day caregiver callouts and finding coverage.
 *
 * Features:
 * - Record caregiver callout with reason
 * - Identify all affected visits for the day
 * - Find available replacement caregivers
 * - Rank replacements by suitability (skills, distance, client familiarity)
 * - Track callout patterns for analytics
 */

import { UUID } from '@folkcare/core';
import { Pool, PoolClient } from 'pg';

/**
 * Callout reason categories
 */
export type CalloutReason =
  | 'SICK'
  | 'FAMILY_EMERGENCY'
  | 'CAR_TROUBLE'
  | 'WEATHER'
  | 'PERSONAL'
  | 'NO_SHOW'
  | 'OTHER';

/**
 * Urgency level for callout handling
 */
export type CalloutUrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Callout record
 */
export interface Callout {
  id: UUID;
  caregiverId: UUID;
  caregiverName: string;
  calloutDate: Date;
  reason: CalloutReason;
  reasonDetails?: string;
  reportedAt: Date;
  reportedBy: UUID;
  affectedVisitCount: number;
  resolvedAt?: Date;
  resolutionNotes?: string;
  organizationId: UUID;
}

/**
 * Affected visit from a callout
 */
export interface AffectedVisit {
  id: UUID;
  scheduledDate: Date;
  scheduledStartTime: string;
  scheduledEndTime: string;
  durationMinutes: number;
  clientId: UUID;
  clientName: string;
  clientAddress: string;
  serviceTypeName: string;
  status: 'NEEDS_COVERAGE' | 'REASSIGNED' | 'CANCELLED';
  reassignedTo?: {
    caregiverId: UUID;
    caregiverName: string;
  };
}

/**
 * Replacement caregiver candidate
 */
export interface ReplacementCandidate {
  caregiverId: UUID;
  caregiverName: string;
  phone?: string;
  email?: string;

  // Availability
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;
  currentScheduledHours: number;

  // Suitability scores (0-100)
  overallScore: number;
  skillMatchScore: number;
  distanceScore: number;
  familiarityScore: number;
  workloadScore: number;

  // Details
  hasRequiredSkills: boolean;
  missingSkills: string[];
  estimatedDistance?: number;
  previousVisitsToClient: number;
  scheduledVisitsToday: number;

  // Warnings
  warnings: string[];
}

/**
 * Callout handling result
 */
export interface CalloutHandlingResult {
  callout: Callout;
  affectedVisits: AffectedVisit[];
  replacementCandidates: ReplacementCandidate[];
  urgencyLevel: CalloutUrgencyLevel;
  recommendations: string[];
}

/**
 * Create callout input
 */
export interface CreateCalloutInput {
  caregiverId: UUID;
  calloutDate: Date;
  reason: CalloutReason;
  reasonDetails?: string;
  reportedBy: UUID;
  organizationId: UUID;
}

export class CalloutHandlingService {
  constructor(private pool: Pool) {}

  /**
   * Record a caregiver callout and get handling options
   */
  async handleCallout(input: CreateCalloutInput): Promise<CalloutHandlingResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get caregiver info
      const caregiverResult = await client.query(
        `SELECT first_name || ' ' || last_name as name FROM users WHERE id = $1`,
        [input.caregiverId]
      );
      const caregiverName = caregiverResult.rows[0]?.name || 'Unknown';

      // Get affected visits
      const affectedVisits = await this.getAffectedVisits(
        client,
        input.caregiverId,
        input.calloutDate,
        input.organizationId
      );

      // Create callout record
      const calloutResult = await client.query(
        `INSERT INTO callouts (
          caregiver_id, callout_date, reason, reason_details,
          reported_at, reported_by, affected_visit_count, organization_id
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
        RETURNING id`,
        [
          input.caregiverId,
          input.calloutDate,
          input.reason,
          input.reasonDetails,
          input.reportedBy,
          affectedVisits.length,
          input.organizationId,
        ]
      );

      const calloutId = calloutResult.rows[0].id;

      // Update affected visits status
      for (const visit of affectedVisits) {
        await client.query(
          `UPDATE visits SET status = 'UNASSIGNED', assigned_caregiver_id = NULL, updated_at = NOW()
           WHERE id = $1`,
          [visit.id]
        );
      }

      await client.query('COMMIT');

      // Find replacement candidates
      const replacementCandidates = await this.findReplacementCandidates(
        input.caregiverId,
        input.calloutDate,
        affectedVisits,
        input.organizationId
      );

      // Determine urgency
      const urgencyLevel = this.calculateUrgency(affectedVisits);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        affectedVisits,
        replacementCandidates,
        urgencyLevel
      );

      const callout: Callout = {
        id: calloutId,
        caregiverId: input.caregiverId,
        caregiverName,
        calloutDate: input.calloutDate,
        reason: input.reason,
        reasonDetails: input.reasonDetails,
        reportedAt: new Date(),
        reportedBy: input.reportedBy,
        affectedVisitCount: affectedVisits.length,
        organizationId: input.organizationId,
      };

      return {
        callout,
        affectedVisits,
        replacementCandidates,
        urgencyLevel,
        recommendations,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get visits affected by a caregiver callout
   */
  private async getAffectedVisits(
    client: PoolClient,
    caregiverId: UUID,
    calloutDate: Date,
    organizationId: UUID
  ): Promise<AffectedVisit[]> {
    const dateStr = calloutDate.toISOString().split('T')[0];

    const result = await client.query(
      `SELECT
        v.id,
        v.scheduled_date,
        v.scheduled_start_time,
        v.scheduled_end_time,
        v.client_id,
        c.first_name || ' ' || c.last_name as client_name,
        COALESCE(c.primary_address->>'line1', '') || ', ' ||
        COALESCE(c.primary_address->>'city', '') || ', ' ||
        COALESCE(c.primary_address->>'state', '') as client_address,
        st.name as service_type_name
      FROM visits v
      JOIN clients c ON v.client_id = c.id
      JOIN service_types st ON v.service_type_id = st.id
      WHERE v.assigned_caregiver_id = $1
        AND v.scheduled_date = $2
        AND v.organization_id = $3
        AND v.status NOT IN ('CANCELLED', 'COMPLETED')
        AND v.is_deleted = false
      ORDER BY v.scheduled_start_time`,
      [caregiverId, dateStr, organizationId]
    );

    return result.rows.map((row: {
      id: string;
      scheduled_date: Date;
      scheduled_start_time: string;
      scheduled_end_time: string;
      client_id: string;
      client_name: string;
      client_address: string;
      service_type_name: string;
    }) => {
      const startParts = row.scheduled_start_time.split(':').map(Number);
      const endParts = row.scheduled_end_time.split(':').map(Number);
      const startMinutes = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0);
      const endMinutes = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0);

      return {
        id: row.id,
        scheduledDate: row.scheduled_date,
        scheduledStartTime: row.scheduled_start_time,
        scheduledEndTime: row.scheduled_end_time,
        durationMinutes: endMinutes - startMinutes,
        clientId: row.client_id,
        clientName: row.client_name,
        clientAddress: row.client_address,
        serviceTypeName: row.service_type_name,
        status: 'NEEDS_COVERAGE' as const,
      };
    });
  }

  /**
   * Find available replacement caregivers
   */
  async findReplacementCandidates(
    excludeCaregiverId: UUID,
    date: Date,
    affectedVisits: AffectedVisit[],
    organizationId: UUID
  ): Promise<ReplacementCandidate[]> {
    if (affectedVisits.length === 0) {
      return [];
    }

    const dateStr = date.toISOString().split('T')[0];

    // Get all active caregivers except the one who called out
    const caregiversResult = await this.pool.query(
      `SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.phone,
        u.email
      FROM users u
      WHERE u.organization_id = $1
        AND u.role = 'caregiver'
        AND u.id != $2
        AND u.is_deleted = false
        AND u.status = 'ACTIVE'
      ORDER BY u.last_name, u.first_name`,
      [organizationId, excludeCaregiverId]
    );

    const candidates: ReplacementCandidate[] = [];

    for (const caregiver of caregiversResult.rows) {
      // Get their current schedule for the day
      const scheduleResult = await this.pool.query(
        `SELECT
          scheduled_start_time,
          scheduled_end_time
        FROM visits
        WHERE assigned_caregiver_id = $1
          AND scheduled_date = $2
          AND status NOT IN ('CANCELLED')
          AND is_deleted = false
        ORDER BY scheduled_start_time`,
        [caregiver.id, dateStr]
      );

      const scheduledVisits = scheduleResult.rows;
      const scheduledVisitsToday = scheduledVisits.length;

      // Calculate total scheduled hours
      let totalMinutes = 0;
      for (const visit of scheduledVisits) {
        const startParts = visit.scheduled_start_time.split(':').map(Number);
        const endParts = visit.scheduled_end_time.split(':').map(Number);
        const startMins = (startParts[0] ?? 0) * 60 + (startParts[1] ?? 0);
        const endMins = (endParts[0] ?? 0) * 60 + (endParts[1] ?? 0);
        totalMinutes += endMins - startMins;
      }

      // Check availability against affected visits (simplified)
      const isAvailable = this.checkAvailability(scheduledVisits, affectedVisits);

      // Get previous visits to affected clients
      const clientIds = affectedVisits.map((v) => v.clientId);
      const familiarityResult = await this.pool.query(
        `SELECT COUNT(DISTINCT client_id) as familiar_clients
        FROM visits
        WHERE assigned_caregiver_id = $1
          AND client_id = ANY($2)
          AND status = 'COMPLETED'`,
        [caregiver.id, clientIds]
      );
      const previousVisitsToClient = parseInt(familiarityResult.rows[0]?.familiar_clients || '0');

      // Calculate scores
      const familiarityScore = Math.min(100, previousVisitsToClient * 20);
      const workloadScore = Math.max(0, 100 - scheduledVisitsToday * 15);
      const skillMatchScore = 80; // Simplified - would need skill matching logic
      const distanceScore = 70; // Simplified - would need geolocation

      const overallScore = Math.round(
        familiarityScore * 0.3 +
          workloadScore * 0.25 +
          skillMatchScore * 0.25 +
          distanceScore * 0.2
      );

      const warnings: string[] = [];
      if (scheduledVisitsToday >= 5) {
        warnings.push('Heavy schedule today');
      }
      if (totalMinutes / 60 >= 8) {
        warnings.push('Already at 8+ hours');
      }

      candidates.push({
        caregiverId: caregiver.id,
        caregiverName: caregiver.name,
        phone: caregiver.phone,
        email: caregiver.email,
        isAvailable,
        currentScheduledHours: Math.round(totalMinutes / 60 * 10) / 10,
        overallScore,
        skillMatchScore,
        distanceScore,
        familiarityScore,
        workloadScore,
        hasRequiredSkills: true, // Simplified
        missingSkills: [],
        previousVisitsToClient,
        scheduledVisitsToday,
        warnings,
      });
    }

    // Sort by overall score (highest first), then by availability
    return candidates.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      return b.overallScore - a.overallScore;
    });
  }

  /**
   * Check if caregiver is available for any of the affected visits
   */
  private checkAvailability(
    currentSchedule: Array<{ scheduled_start_time: string; scheduled_end_time: string }>,
    affectedVisits: AffectedVisit[]
  ): boolean {
    // Simple check - in reality would need to check each visit time slot
    if (currentSchedule.length === 0) return true;
    if (currentSchedule.length >= 8) return false; // Too busy

    // Check for at least one non-overlapping slot
    for (const affected of affectedVisits) {
      let hasConflict = false;
      for (const scheduled of currentSchedule) {
        if (this.timesOverlap(
          affected.scheduledStartTime,
          affected.scheduledEndTime,
          scheduled.scheduled_start_time,
          scheduled.scheduled_end_time
        )) {
          hasConflict = true;
          break;
        }
      }
      if (!hasConflict) return true;
    }

    return false;
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const toMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return (h ?? 0) * 60 + (m ?? 0);
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && s2 < e1;
  }

  /**
   * Calculate urgency based on affected visits
   */
  private calculateUrgency(affectedVisits: AffectedVisit[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (affectedVisits.length === 0) return 'LOW';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check if any visit is starting soon
    for (const visit of affectedVisits) {
      const [h, m] = visit.scheduledStartTime.split(':').map(Number);
      const visitMinutes = (h ?? 0) * 60 + (m ?? 0);
      const minutesUntilStart = visitMinutes - currentMinutes;

      if (minutesUntilStart <= 30) return 'CRITICAL';
      if (minutesUntilStart <= 60) return 'HIGH';
    }

    if (affectedVisits.length >= 5) return 'HIGH';
    if (affectedVisits.length >= 3) return 'MEDIUM';

    return 'LOW';
  }

  /**
   * Generate recommendations based on situation
   */
  private generateRecommendations(
    affectedVisits: AffectedVisit[],
    candidates: ReplacementCandidate[],
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ): string[] {
    const recommendations: string[] = [];

    if (affectedVisits.length === 0) {
      recommendations.push('No visits affected - no action needed');
      return recommendations;
    }

    const availableCandidates = candidates.filter((c) => c.isAvailable);

    if (urgency === 'CRITICAL') {
      recommendations.push('URGENT: Visit starting within 30 minutes - prioritize immediate reassignment');
    }

    if (availableCandidates.length === 0) {
      recommendations.push('No available caregivers found - consider cancelling or rescheduling visits');
      recommendations.push('Contact clients to inform them of the situation');
    } else if (availableCandidates.length < affectedVisits.length) {
      recommendations.push(
        `Only ${availableCandidates.length} caregivers available for ${affectedVisits.length} visits - may need to prioritize`
      );
    }

    const topCandidate = availableCandidates[0];
    if (topCandidate && topCandidate.familiarityScore > 50) {
      recommendations.push(
        `${topCandidate.caregiverName} has prior experience with affected clients - recommended first choice`
      );
    }

    if (affectedVisits.length >= 3) {
      recommendations.push('Multiple visits affected - consider splitting among multiple caregivers');
    }

    return recommendations;
  }

  /**
   * Reassign a visit to a new caregiver
   */
  async reassignVisit(
    visitId: UUID,
    newCaregiverId: UUID,
    reassignedBy: UUID
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.pool.query(
        `UPDATE visits
         SET assigned_caregiver_id = $1,
             status = 'SCHEDULED',
             updated_at = NOW(),
             updated_by = $2
         WHERE id = $3`,
        [newCaregiverId, reassignedBy, visitId]
      );

      return { success: true, message: 'Visit successfully reassigned' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reassign visit',
      };
    }
  }

  /**
   * Get callout history for analytics
   */
  async getCalloutHistory(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCallouts: number;
    byReason: Record<CalloutReason, number>;
    byCaregiverId: Array<{ caregiverId: UUID; caregiverName: string; count: number }>;
    averageAffectedVisits: number;
  }> {
    const result = await this.pool.query(
      `SELECT
        c.id,
        c.caregiver_id,
        u.first_name || ' ' || u.last_name as caregiver_name,
        c.reason,
        c.affected_visit_count
      FROM callouts c
      JOIN users u ON c.caregiver_id = u.id
      WHERE c.organization_id = $1
        AND c.callout_date >= $2
        AND c.callout_date <= $3
      ORDER BY c.callout_date DESC`,
      [organizationId, startDate, endDate]
    );

    const byReason: Record<CalloutReason, number> = {
      SICK: 0,
      FAMILY_EMERGENCY: 0,
      CAR_TROUBLE: 0,
      WEATHER: 0,
      PERSONAL: 0,
      NO_SHOW: 0,
      OTHER: 0,
    };

    const caregiverCounts: Map<string, { caregiverId: UUID; caregiverName: string; count: number }> = new Map();
    let totalAffectedVisits = 0;

    for (const row of result.rows) {
      byReason[row.reason as CalloutReason]++;
      totalAffectedVisits += row.affected_visit_count;

      const existing = caregiverCounts.get(row.caregiver_id);
      if (existing) {
        existing.count++;
      } else {
        caregiverCounts.set(row.caregiver_id, {
          caregiverId: row.caregiver_id,
          caregiverName: row.caregiver_name,
          count: 1,
        });
      }
    }

    return {
      totalCallouts: result.rows.length,
      byReason,
      byCaregiverId: Array.from(caregiverCounts.values()).sort((a, b) => b.count - a.count),
      averageAffectedVisits:
        result.rows.length > 0 ? Math.round((totalAffectedVisits / result.rows.length) * 10) / 10 : 0,
    };
  }
}
