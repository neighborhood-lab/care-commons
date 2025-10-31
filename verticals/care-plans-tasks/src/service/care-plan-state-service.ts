import { UUID, PermissionService } from '@care-commons/core';
import { CarePlan, TaskInstance } from '../types/care-plan';
import { Database } from '@care-commons/core';

/**
 * State-specific care plan business logic
 * SOLID: Single Responsibility - handles only state-specific validation/enforcement
 * APIE: Abstraction - interface separates state logic from core care plan service
 */
export interface StateSpecificCarePlanRules {
  validatePlanOfCare(carePlan: CarePlan, stateCode: string): Promise<ValidationResult>;
  enforceSupervisoryVisits(carePlan: CarePlan): Promise<SupervisoryVisitCheck>;
  validateServiceAuthorization(taskInstance: TaskInstance, stateCode: string): Promise<boolean>;
}

export class CarePlanStateService implements StateSpecificCarePlanRules {
  constructor(
    private database: Database,
    private permissionService: PermissionService
  ) {}

  /**
   * TX 26 TAC §558.287: Physician orders required
   * FL AHCA 59A-8.0095: RN supervision mandatory for certain services
   */
  async validatePlanOfCare(carePlan: CarePlan, stateCode: string): Promise<ValidationResult> {
    const query = `
      SELECT state_jurisdiction, ordering_provider_name, ordering_provider_npi,
             rn_supervisor_id, plan_review_interval_days, next_review_due
      FROM care_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.database.query(query, [carePlan.id]);
    
    if (!result.rows[0]) {
      return { valid: false, errors: ['Care plan not found'] };
    }

    const plan = result.rows[0];
    const errors: string[] = [];

    if (stateCode === 'TX') {
      // TX requires physician order for plan initiation
      if (!plan.ordering_provider_name || !plan.ordering_provider_npi) {
        errors.push('TX compliance: Physician order with NPI required (26 TAC §558.287)');
      }
      // TX: Plan review every 60 days minimum
      if (!plan.next_review_due) {
        errors.push('TX compliance: Next review date required');
      }
    }

    if (stateCode === 'FL') {
      // FL requires RN supervisor for skilled services
      const needsRNSupervision = await this.checkIfNeedsRNSupervision(carePlan.id);
      if (needsRNSupervision && !plan.rn_supervisor_id) {
        errors.push('FL AHCA 59A-8.0095: RN supervisor required for this service type');
      }
      // FL: Plan review every 60-90 days per Florida Statute 400.487
      if (!plan.plan_review_interval_days || plan.plan_review_interval_days > 90) {
        errors.push('FL Statute 400.487: Plan review interval must be ≤90 days');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * FL AHCA 59A-8.0095: RN supervisory visit requirements
   */
  async enforceSupervisoryVisits(carePlan: CarePlan): Promise<SupervisoryVisitCheck> {
    const query = `
      SELECT last_supervisory_visit_date, next_supervisory_visit_due, state_jurisdiction
      FROM care_plans
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.database.query(query, [carePlan.id]);
    
    if (!result.rows[0] || result.rows[0].state_jurisdiction !== 'FL') {
      return { required: false, overdue: false };
    }

    const plan = result.rows[0];
    const now = new Date();
    const nextDue = plan.next_supervisory_visit_due ? new Date(plan.next_supervisory_visit_due) : null;

    return {
      required: true,
      overdue: nextDue ? nextDue < now : false,
      lastVisitDate: plan.last_supervisory_visit_date,
      nextDueDate: nextDue
    };
  }

  /**
   * TX HHSC Form 4100 / FL Service Authorization validation
   * Ensures tasks align with authorized services
   */
  async validateServiceAuthorization(taskInstance: TaskInstance): Promise<boolean> {
    const query = `
      SELECT sa.status, sa.units_authorized, sa.units_consumed, sa.units_remaining,
             sa.authorization_start_date, sa.authorization_end_date, sa.service_code
      FROM service_authorizations sa
      JOIN care_plans cp ON cp.id = $1
      WHERE sa.client_id = cp.client_id
        AND sa.service_code = $2
        AND sa.status = 'ACTIVE'
        AND sa.authorization_start_date <= CURRENT_DATE
        AND (sa.authorization_end_date IS NULL OR sa.authorization_end_date >= CURRENT_DATE)
        AND sa.deleted_at IS NULL
      ORDER BY sa.authorization_end_date DESC NULLS LAST
      LIMIT 1
    `;
    
    const serviceCode = this.mapTaskCategoryToServiceCode(taskInstance.category);
    const result = await this.database.query(query, [
      taskInstance.carePlanId,
      serviceCode
    ]);

    if (!result.rows[0]) {
      throw new Error(`No active service authorization found for service code: ${serviceCode}`);
    }

    const auth = result.rows[0];
    if (auth.units_remaining <= 0) {
      throw new Error(`Service authorization exhausted. Units remaining: ${auth.units_remaining}`);
    }

    return true;
  }

  private mapTaskCategoryToServiceCode(category: string): string {
    // Map task categories to standard service codes for authorization validation
    const codeMap: Record<string, string> = {
      'PERSONAL_HYGIENE': 'S5125',
      'BATHING': 'S5125',
      'DRESSING': 'S5125',
      'GROOMING': 'S5125',
      'TOILETING': 'S5125',
      'MOBILITY': 'S5125',
      'TRANSFERRING': 'S5125',
      'AMBULATION': 'S5125',
      'MEDICATION': 'S0215',
      'MEAL_PREPARATION': 'S5125',
      'FEEDING': 'S5125',
      'HOUSEKEEPING': 'S5125',
      'LAUNDRY': 'S5125',
      'SHOPPING': 'S5125',
      'TRANSPORTATION': 'S5125',
      'COMPANIONSHIP': 'S5125',
      'MONITORING': 'S0215',
      'DOCUMENTATION': 'S0215'
    };
    return codeMap[category] || 'UNKNOWN';
  }

  private async checkIfNeedsRNSupervision(carePlanId: UUID): Promise<boolean> {
    // Check if any interventions or tasks require RN supervision
    const query = `
      SELECT 1 FROM care_plans
      WHERE id = $1
        AND (
          interventions::text LIKE '%SKILLED_NURSING%'
          OR interventions::text LIKE '%WOUND_CARE%'
          OR interventions::text LIKE '%MEDICATION_ADMINISTRATION%'
        )
        AND deleted_at IS NULL
      LIMIT 1
    `;
    const result = await this.database.query(query, [carePlanId]);
    return result.rows.length > 0;
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface SupervisoryVisitCheck {
  required: boolean;
  overdue: boolean;
  lastVisitDate?: Date;
  nextDueDate?: Date | null;
}