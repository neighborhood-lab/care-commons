import { UUID, UserContext, PermissionService } from '@care-commons/core';
import { ShiftRepository, CaregiverMatch } from '../repository/shift-repository';
import { Database } from '@care-commons/core';

/**
 * State-Specific Shift Matching Service with TX/FL compliance rules
 * SOLID: Single Responsibility - only handles state-specific matching logic
 */
export class StateSpecificMatchingService {
  constructor(
    private repository: ShiftRepository,
    private database: Database,
    private permissionService: PermissionService
  ) {}

  /**
   * Find best caregivers for a shift with TX/FL compliance
   */
  async findMatches(
    shiftId: UUID,
    userContext: UserContext
  ): Promise<CaregiverMatch[]> {
    // Get eligible caregivers (registry checks applied in repository)
    const eligible = await this.repository.findEligibleCaregivers(shiftId);
    
    // Get shift details
    const shift = await this.repository.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    // Apply state-specific scoring
    const scored = await Promise.all(
      eligible.map(match => this.scoreMatch(match, shift))
    );

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Assign caregiver to shift with compliance validation
   */
  async assignShift(
    shiftId: UUID,
    caregiverId: UUID,
    userContext: UserContext
  ): Promise<void> {
    if (!this.permissionService.hasPermission(userContext, 'shifts:assign')) {
      throw new Error('User does not have permission to assign shifts');
    }

    // Validate state-specific requirements
    const shift = await this.repository.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }

    await this.validateStateCompliance(shift, caregiverId);
    await this.repository.assignCaregiver(shiftId, caregiverId, userContext.userId);
  }

  private async scoreMatch(
    match: CaregiverMatch,
    shift: any
  ): Promise<CaregiverMatch> {
    let score = match.score;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Get caregiver details
    const cg = await this.database.query(`
      SELECT * FROM caregivers WHERE id = $1
    `, [match.caregiverId]);

    if (!cg.rows[0]) return match;

    const caregiver = cg.rows[0];

    // Skills match
    const hasAllSkills = shift.requiredSkills.every((skill: string) =>
      (caregiver.certifications as string[] || []).includes(skill)
    );
    if (hasAllSkills) {
      score += 20;
      reasons.push('Has all required skills');
    } else {
      warnings.push('Missing some required skills');
    }

    // Language match
    if (shift.languagePreference) {
      if ((caregiver.languages_spoken as string[] || []).includes(shift.languagePreference)) {
        score += 15;
        reasons.push(`Speaks ${shift.languagePreference}`);
      }
    }

    // State-specific compliance (TX/FL)
    if (shift.state === 'TX') {
      const txData = (caregiver.state_specific as any)?.texas;
      if (txData?.employee_misconduct_check?.status === 'CLEAR') {
        score += 10;
        reasons.push('TX Employee Misconduct Registry: CLEAR');
      }
      if (txData?.evv_attendant_id) {
        score += 5;
        reasons.push('TX EVV enrolled');
      }
    }

    if (shift.state === 'FL') {
      const flData = (caregiver.state_specific as any)?.florida;
      if (flData?.level2_screening?.status === 'CLEARED') {
        score += 10;
        reasons.push('FL Level 2 screening: CLEARED');
      }
      if (flData?.medicaid_provider_id) {
        score += 5;
        reasons.push('FL Medicaid provider ID active');
      }
    }

    return {
      ...match,
      score,
      matchReasons: reasons,
      warnings
    };
  }

  private async validateStateCompliance(shift: any, caregiverId: UUID): Promise<void> {
    const caregiver = await this.database.query(`
      SELECT state_specific FROM caregivers WHERE id = $1
    `, [caregiverId]);

    if (!caregiver.rows[0]) {
      throw new Error('Caregiver not found');
    }

    if (shift.state === 'TX') {
      const txData = (caregiver.rows[0].state_specific as any)?.texas;
      if (!txData?.employee_misconduct_check || txData.employee_misconduct_check.status !== 'CLEAR') {
        throw new Error('TX: Caregiver must have clear Employee Misconduct Registry check');
      }
    }

    if (shift.state === 'FL') {
      const flData = (caregiver.rows[0].state_specific as any)?.florida;
      if (!flData?.level2_screening || flData.level2_screening.status !== 'CLEARED') {
        throw new Error('FL: Caregiver must have cleared Level 2 background screening');
      }
    }
  }
}