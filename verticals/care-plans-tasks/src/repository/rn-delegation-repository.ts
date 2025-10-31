import { Repository } from '@care-commons/core/src/db/repository';
import { Database } from '@care-commons/core/src/db/connection';
import { UUID } from '@care-commons/core';
import { RNDelegation } from '../types/state-specific';

export class RNDelegationRepository extends Repository<RNDelegation> {
  constructor(database: Database) {
    super({
      tableName: 'rn_delegations',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapRowToEntity(row: any): RNDelegation {
    return {
      id: row.id,
      carePlanId: row.care_plan_id,
      clientId: row.client_id,
      organizationId: row.organization_id,
      branchId: row.branch_id,
      delegatingRnId: row.delegating_rn_id,
      delegatingRnName: row.delegating_rn_name,
      delegatingRnLicense: row.delegating_rn_license,
      delegatedToCaregiverId: row.delegated_to_caregiver_id,
      delegatedToCaregiverName: row.delegated_to_caregiver_name,
      delegatedToCredentialType: row.delegated_to_credential_type,
      delegatedToCredentialNumber: row.delegated_to_credential_number,
      taskCategory: row.task_category,
      taskDescription: row.task_description,
      specificSkillsDelegated: row.specific_skills_delegated,
      limitations: row.limitations,
      trainingProvided: row.training_provided,
      trainingDate: row.training_date,
      trainingMethod: row.training_method,
      competencyEvaluated: row.competency_evaluated,
      competencyEvaluationDate: row.competency_evaluation_date,
      competencyEvaluatorId: row.competency_evaluator_id,
      evaluationResult: row.evaluation_result,
      effectiveDate: row.effective_date,
      expirationDate: row.expiration_date,
      supervisionFrequency: row.supervision_frequency,
      lastSupervisionDate: row.last_supervision_date,
      nextSupervisionDue: row.next_supervision_due,
      status: row.status,
      revocationReason: row.revocation_reason,
      revokedBy: row.revoked_by,
      revokedAt: row.revoked_at,
      ahcaDelegationFormNumber: row.ahca_delegation_form_number,
      stateSpecificData: row.state_specific_data,
      notes: row.notes,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected mapEntityToRow(entity: Partial<RNDelegation>): Record<string, any> {
    return {
      care_plan_id: entity.carePlanId,
      client_id: entity.clientId,
      organization_id: entity.organizationId,
      branch_id: entity.branchId,
      delegating_rn_id: entity.delegatingRnId,
      delegating_rn_name: entity.delegatingRnName,
      delegating_rn_license: entity.delegatingRnLicense,
      delegated_to_caregiver_id: entity.delegatedToCaregiverId,
      delegated_to_caregiver_name: entity.delegatedToCaregiverName,
      delegated_to_credential_type: entity.delegatedToCredentialType,
      delegated_to_credential_number: entity.delegatedToCredentialNumber,
      task_category: entity.taskCategory,
      task_description: entity.taskDescription,
      specific_skills_delegated: entity.specificSkillsDelegated,
      limitations: entity.limitations,
      training_provided: entity.trainingProvided,
      training_date: entity.trainingDate,
      training_method: entity.trainingMethod,
      competency_evaluated: entity.competencyEvaluated,
      competency_evaluation_date: entity.competencyEvaluationDate,
      competency_evaluator_id: entity.competencyEvaluatorId,
      evaluation_result: entity.evaluationResult,
      effective_date: entity.effectiveDate,
      expiration_date: entity.expirationDate,
      supervision_frequency: entity.supervisionFrequency,
      last_supervision_date: entity.lastSupervisionDate,
      next_supervision_due: entity.nextSupervisionDue,
      status: entity.status || 'PENDING_TRAINING',
      revocation_reason: entity.revocationReason,
      revoked_by: entity.revokedBy,
      revoked_at: entity.revokedAt,
      ahca_delegation_form_number: entity.ahcaDelegationFormNumber,
      state_specific_data: entity.stateSpecificData || {},
      notes: entity.notes,
    };
  }

  async findActiveDelegationsForCaregiver(
    caregiverId: UUID,
    taskCategory?: string
  ): Promise<RNDelegation[]> {
    let query = `
      SELECT * FROM rn_delegations
      WHERE delegated_to_caregiver_id = $1
        AND status = 'ACTIVE'
        AND competency_evaluated = true
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE)
        AND deleted_at IS NULL
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [caregiverId];

    if (taskCategory) {
      query += ` AND task_category = $2`;
      params.push(taskCategory);
    }

    query += ` ORDER BY effective_date DESC`;

    const result = await this.database.query(query, params);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.rows.map((row: any) => this.mapRowToEntity(row));
  }
}