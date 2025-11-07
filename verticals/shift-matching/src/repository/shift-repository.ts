import { Repository, Database, UUID, Entity } from '@care-commons/core';

export interface ShiftRequirement extends Entity {
  clientId: UUID;
  visitId?: UUID;
  serviceType: string;
  startTime: Date;
  endTime: Date;
  requiredSkills: string[];
  requiredCertifications: string[];
  languagePreference?: string;
  genderPreference?: string;
  maxDistanceMiles?: number;
  state: string;
  status: 'OPEN' | 'ASSIGNED' | 'FULFILLED' | 'CANCELLED';
  assignedCaregiverId?: UUID;
  createdBy: UUID;
  createdAt: Date;
}

export interface CaregiverMatch {
  caregiverId: UUID;
  score: number;
  matchReasons: string[];
  blockers: string[];
  warnings: string[];
}

export class ShiftRepository extends Repository<ShiftRequirement> {
  constructor(database: Database) {
    super({ tableName: 'shift_requirements', database, enableAudit: true, enableSoftDelete: true });
  }

  protected mapRowToEntity(row: Record<string, unknown>): ShiftRequirement {
    return {
      id: row.id as string,
      clientId: row.client_id as string,
      visitId: row.visit_id as string,
      serviceType: row.service_type as string,
      startTime: row.start_time as Date,
      endTime: row.end_time as Date,
      requiredSkills: (row.required_skills ?? []) as string[],
      requiredCertifications: (row.required_certifications ?? []) as string[],
      languagePreference: row.language_preference as string | undefined,
      genderPreference: row.gender_preference as string | undefined,
      maxDistanceMiles: row.max_distance_miles as number | undefined,
      state: row.state as string,
      status: row.status as 'OPEN' | 'ASSIGNED' | 'FULFILLED' | 'CANCELLED',
      assignedCaregiverId: row.assigned_caregiver_id as string | undefined,
      createdBy: row.created_by as string,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
      updatedBy: row.updated_by as string,
      version: row.version as number
    };
  }

  protected mapEntityToRow(entity: Partial<ShiftRequirement>): Record<string, unknown> {
    return {
      client_id: entity.clientId,
      visit_id: entity.visitId,
      service_type: entity.serviceType,
      start_time: entity.startTime,
      end_time: entity.endTime,
      required_skills: entity.requiredSkills,
      required_certifications: entity.requiredCertifications,
      language_preference: entity.languagePreference,
      gender_preference: entity.genderPreference,
      max_distance_miles: entity.maxDistanceMiles,
      state: entity.state,
      status: entity.status,
      assigned_caregiver_id: entity.assignedCaregiverId
    };
  }

  async findEligibleCaregivers(shiftId: UUID): Promise<CaregiverMatch[]> {
    const query = `
      WITH shift AS (
        SELECT * FROM shift_requirements WHERE id = $1
      ),
      eligible_caregivers AS (
        SELECT 
          c.id,
          c.first_name || ' ' || c.last_name as name,
          c.state,
          c.certifications,
          c.languages_spoken,
          c.state_specific,
          COALESCE(rr.status, 'CLEAR') as registry_status
        FROM caregivers c
        LEFT JOIN registry_check_results rr ON rr.caregiver_id = c.id
          AND rr.registry_type IN ('TX_EMPLOYEE_MISCONDUCT', 'FL_LEVEL2_BACKGROUND')
          AND rr.status IN ('CLEAR', 'CLEARED')
        WHERE c.status = 'ACTIVE'
          AND c.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM registry_check_results rr2
            WHERE rr2.caregiver_id = c.id
              AND rr2.status = 'LISTED'
          )
      )
      SELECT 
        ec.*,
        CASE 
          WHEN shift.state = 'TX' THEN 
            CASE WHEN ec.state_specific->'texas'->>'evv_attendant_id' IS NOT NULL THEN 10 ELSE 0 END
          WHEN shift.state = 'FL' THEN
            CASE WHEN ec.state_specific->'florida'->>'medicaid_provider_id' IS NOT NULL THEN 10 ELSE 0 END
          ELSE 0
        END as compliance_score
      FROM eligible_caregivers ec, shift
      WHERE ec.state = shift.state
    `;

    const result = await this.database.query(query, [shiftId]);

    return result.rows.map((row: Record<string, unknown>) => ({
      caregiverId: row['id'] as string,
      score: (Number(row['compliance_score']) > 0 ? Number(row['compliance_score']) : 0),
      matchReasons: [],
      blockers: [],
      warnings: []
    }));
  }

  async assignCaregiver(shiftId: UUID, caregiverId: UUID, assignedBy: UUID): Promise<void> {
    await this.database.query(`
      UPDATE shift_requirements
      SET assigned_caregiver_id = $1, status = 'ASSIGNED', updated_by = $2, updated_at = NOW()
      WHERE id = $3
    `, [caregiverId, assignedBy, shiftId]);
  }
}