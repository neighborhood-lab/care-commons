/**
 * Onboarding Service
 * 
 * Manages organization onboarding progress and go-live checklist.
 * Tracks completion of required steps before an agency can go live.
 */

import { Database } from '../db/connection.js';
import { UUID, NotFoundError, ValidationError } from '../types/base.js';
import {
  OnboardingProgress,
  OnboardingStep,
  OnboardingStepId,
  GoLiveChecklistItem,
  GoLiveCategory,
  ChecklistItemStatus,
  UpdateStepRequest,
  UpdateChecklistItemRequest,
  DEFAULT_GO_LIVE_CHECKLIST,
  GO_LIVE_CATEGORY_LABELS,
} from '../types/onboarding.js';

/**
 * Onboarding step definitions with order
 */
const ONBOARDING_STEPS: { id: OnboardingStepId; order: number }[] = [
  { id: 'email_verified', order: 1 },
  { id: 'services_configured', order: 2 },
  { id: 'payors_added', order: 3 },
  { id: 'evv_configured', order: 4 },
  { id: 'first_caregiver', order: 5 },
  { id: 'first_client', order: 6 },
  { id: 'test_visit', order: 7 },
  { id: 'team_invited', order: 8 },
];

/**
 * OnboardingService
 * 
 * Handles all onboarding and go-live checklist operations
 */
export class OnboardingService {
  constructor(private db: Database) {}

  /**
   * Initialize onboarding progress for a new organization
   */
  async initializeOnboarding(
    organizationId: UUID,
    stateCode: string,
    userId: UUID
  ): Promise<OnboardingProgress> {
    // Create initial steps
    const steps: OnboardingStep[] = ONBOARDING_STEPS.map(s => ({
      id: s.id,
      status: 'not_started' as ChecklistItemStatus,
    }));

    // Create go-live checklist with state-specific filtering
    const goLiveChecklist: GoLiveChecklistItem[] = DEFAULT_GO_LIVE_CHECKLIST
      .filter(item => {
        // Include if not state-specific, or if applicable to this state
        if (item.stateSpecific !== true) return true;
        if (item.applicableStates === undefined) return true;
        return item.applicableStates.includes(stateCode);
      })
      .map(item => ({
        ...item,
        status: 'not_started' as ChecklistItemStatus,
      }));

    const now = new Date();
    const progress: OnboardingProgress = {
      organizationId,
      steps,
      currentStep: 'email_verified',
      goLiveChecklist,
      overallProgress: 0,
      requiredItemsComplete: 0,
      requiredItemsTotal: goLiveChecklist.filter(i => i.required).length,
      optionalItemsComplete: 0,
      optionalItemsTotal: goLiveChecklist.filter(i => !i.required).length,
      startedAt: now,
      updatedAt: now,
    };

    // Store in organization settings
    await this.saveOnboardingProgress(organizationId, progress, userId);

    return progress;
  }

  /**
   * Get onboarding progress for an organization
   */
  async getOnboardingProgress(organizationId: UUID): Promise<OnboardingProgress> {
    const result = await this.db.query<{ settings: Record<string, unknown> }>(
      `SELECT settings FROM organizations WHERE id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Organization not found');
    }

    const settings = result.rows[0]?.settings ?? {};
    const onboardingData = settings['onboarding'] as OnboardingProgress | undefined;

    if (onboardingData === undefined) {
      // Return empty progress - will need to initialize
      throw new NotFoundError('Onboarding not initialized for this organization');
    }

    // Recalculate progress
    return this.calculateProgress(onboardingData);
  }

  /**
   * Update an onboarding step status
   */
  async updateStep(
    organizationId: UUID,
    request: UpdateStepRequest,
    userId: UUID
  ): Promise<OnboardingProgress> {
    const progress = await this.getOnboardingProgress(organizationId);

    // Find the step
    const stepIndex = progress.steps.findIndex(s => s.id === request.stepId);
    if (stepIndex === -1) {
      throw new ValidationError(`Invalid step ID: ${request.stepId}`);
    }

    const step = progress.steps[stepIndex];
    if (step === undefined) {
      throw new ValidationError(`Step not found: ${request.stepId}`);
    }
    const now = new Date();

    // Update step status
    if (request.status === 'completed') {
      step.status = 'completed';
      step.completedAt = now;
      step.completedBy = userId;
    } else if (request.status === 'skipped') {
      step.status = 'skipped';
      step.skippedAt = now;
      step.skippedBy = userId;
    } else {
      step.status = request.status;
    }

    if (request.metadata !== undefined) {
      step.metadata = { ...step.metadata, ...request.metadata };
    }

    progress.steps[stepIndex] = step;

    // Update current step to next incomplete step
    progress.currentStep = this.findNextIncompleteStep(progress.steps);

    // Check if wizard is complete
    const allStepsComplete = progress.steps.every(
      s => s.status === 'completed' || s.status === 'skipped'
    );
    if (allStepsComplete && progress.wizardCompletedAt === undefined) {
      progress.wizardCompletedAt = now;
    }

    progress.updatedAt = now;

    // Also update corresponding go-live checklist items
    await this.autoUpdateChecklistFromStep(progress, request.stepId);

    // Recalculate and save
    const updatedProgress = this.calculateProgress(progress);
    await this.saveOnboardingProgress(organizationId, updatedProgress, userId);

    return updatedProgress;
  }

  /**
   * Update a go-live checklist item
   */
  async updateChecklistItem(
    organizationId: UUID,
    request: UpdateChecklistItemRequest,
    userId: UUID
  ): Promise<OnboardingProgress> {
    const progress = await this.getOnboardingProgress(organizationId);

    // Find the item
    const itemIndex = progress.goLiveChecklist.findIndex(i => i.id === request.itemId);
    if (itemIndex === -1) {
      throw new ValidationError(`Invalid checklist item ID: ${request.itemId}`);
    }

    const item = progress.goLiveChecklist[itemIndex];
    if (item === undefined) {
      throw new ValidationError(`Checklist item not found: ${request.itemId}`);
    }
    const now = new Date();

    // Update status
    if (request.status === 'completed') {
      item.status = 'completed';
      item.completedAt = now;
      item.completedBy = userId;
    } else {
      item.status = request.status;
      item.completedAt = undefined;
      item.completedBy = undefined;
    }

    progress.goLiveChecklist[itemIndex] = item;
    progress.updatedAt = now;

    // Recalculate and save
    const updatedProgress = this.calculateProgress(progress);
    await this.saveOnboardingProgress(organizationId, updatedProgress, userId);

    return updatedProgress;
  }

  /**
   * Run auto-verification checks for all verifiable items
   */
  async runAutoVerification(organizationId: UUID, userId: UUID): Promise<OnboardingProgress> {
    const progress = await this.getOnboardingProgress(organizationId);

    // Check each auto-verifiable item
    for (const item of progress.goLiveChecklist) {
      if (item.autoVerifiable && item.status !== 'completed') {
        const isComplete = await this.checkItemCompletion(organizationId, item.id);
        if (isComplete) {
          item.status = 'completed';
          item.completedAt = new Date();
          item.completedBy = userId;
        }
      }
    }

    progress.updatedAt = new Date();

    // Recalculate and save
    const updatedProgress = this.calculateProgress(progress);
    await this.saveOnboardingProgress(organizationId, updatedProgress, userId);

    return updatedProgress;
  }

  /**
   * Mark organization as go-live ready
   */
  async approveGoLive(organizationId: UUID, userId: UUID): Promise<OnboardingProgress> {
    const progress = await this.getOnboardingProgress(organizationId);

    // Check all required items are complete
    const incompleteRequired = progress.goLiveChecklist.filter(
      i => i.required && i.status !== 'completed'
    );

    if (incompleteRequired.length > 0) {
      throw new ValidationError('Cannot approve go-live: required items incomplete', {
        incompleteItems: incompleteRequired.map(i => i.id),
      });
    }

    const now = new Date();
    progress.goLiveReadyAt = now;
    progress.goLiveApprovedAt = now;
    progress.goLiveApprovedBy = userId;
    progress.updatedAt = now;

    await this.saveOnboardingProgress(organizationId, progress, userId);

    // Update organization status
    await this.db.query(
      `UPDATE organizations 
       SET status = 'ACTIVE', updated_at = NOW(), updated_by = $2 
       WHERE id = $1`,
      [organizationId, userId]
    );

    return progress;
  }

  /**
   * Get progress summary by category
   */
  getCategorySummary(progress: OnboardingProgress): Record<GoLiveCategory, {
    label: string;
    total: number;
    completed: number;
    percentage: number;
  }> {
    const categories: GoLiveCategory[] = [
      'organization_setup',
      'compliance',
      'billing',
      'staff_setup',
      'client_setup',
      'operations',
    ];

    const summary: Record<string, { label: string; total: number; completed: number; percentage: number }> = {};

    for (const category of categories) {
      const items = progress.goLiveChecklist.filter(i => i.category === category);
      const completed = items.filter(i => i.status === 'completed').length;
      summary[category] = {
        label: GO_LIVE_CATEGORY_LABELS[category],
        total: items.length,
        completed,
        percentage: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
      };
    }

    return summary as Record<GoLiveCategory, { label: string; total: number; completed: number; percentage: number }>;
  }

  // Private helper methods

  /**
   * Save onboarding progress to organization settings
   */
  private async saveOnboardingProgress(
    organizationId: UUID,
    progress: OnboardingProgress,
    userId: UUID
  ): Promise<void> {
    await this.db.query(
      `UPDATE organizations 
       SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{onboarding}', $2::jsonb),
           updated_at = NOW(),
           updated_by = $3
       WHERE id = $1`,
      [organizationId, JSON.stringify(progress), userId]
    );
  }

  /**
   * Calculate overall progress
   */
  private calculateProgress(progress: OnboardingProgress): OnboardingProgress {
    const requiredItems = progress.goLiveChecklist.filter(i => i.required);
    const optionalItems = progress.goLiveChecklist.filter(i => !i.required);

    progress.requiredItemsComplete = requiredItems.filter(i => i.status === 'completed').length;
    progress.requiredItemsTotal = requiredItems.length;
    progress.optionalItemsComplete = optionalItems.filter(i => i.status === 'completed').length;
    progress.optionalItemsTotal = optionalItems.length;

    // Calculate overall percentage (required items weighted more heavily)
    const requiredWeight = 0.8;
    const optionalWeight = 0.2;

    const requiredPct = progress.requiredItemsTotal > 0
      ? progress.requiredItemsComplete / progress.requiredItemsTotal
      : 1;
    const optionalPct = progress.optionalItemsTotal > 0
      ? progress.optionalItemsComplete / progress.optionalItemsTotal
      : 1;

    progress.overallProgress = Math.round(
      (requiredPct * requiredWeight + optionalPct * optionalWeight) * 100
    );

    // Check if go-live ready
    if (progress.requiredItemsComplete === progress.requiredItemsTotal && progress.goLiveReadyAt === undefined) {
      progress.goLiveReadyAt = new Date();
    }

    return progress;
  }

  /**
   * Find the next incomplete step
   */
  private findNextIncompleteStep(steps: OnboardingStep[]): OnboardingStepId {
    const orderedSteps = [...ONBOARDING_STEPS].sort((a, b) => a.order - b.order);
    
    for (const stepDef of orderedSteps) {
      const step = steps.find(s => s.id === stepDef.id);
      if (step !== undefined && step.status !== 'completed' && step.status !== 'skipped') {
        return step.id;
      }
    }

    // All complete, return last step
    return 'team_invited';
  }

  /**
   * Auto-update checklist items when wizard steps complete
   */
  private async autoUpdateChecklistFromStep(
    progress: OnboardingProgress,
    stepId: OnboardingStepId
  ): Promise<void> {
    // Map wizard steps to checklist items
    const stepToChecklistMap: Record<string, string[]> = {
      email_verified: ['admin_email_verified'],
      services_configured: ['service_rates_configured'],
      payors_added: ['payor_configured'],
      evv_configured: ['evv_aggregator_configured'],
      first_caregiver: ['first_caregiver_added'],
      first_client: ['first_client_added'],
      test_visit: ['first_visit_scheduled', 'test_clock_in_out'],
    };

    const checklistItemIds = stepToChecklistMap[stepId];
    if (checklistItemIds === undefined) return;

    const step = progress.steps.find(s => s.id === stepId);
    if (step?.status !== 'completed') return;

    for (const itemId of checklistItemIds) {
      const item = progress.goLiveChecklist.find(i => i.id === itemId);
      if (item !== undefined && item.status !== 'completed') {
        item.status = 'completed';
        item.completedAt = step.completedAt;
        item.completedBy = step.completedBy;
      }
    }
  }

  /**
   * Check if a specific checklist item is complete
   * This performs actual database checks for auto-verifiable items
   */
  private async checkItemCompletion(organizationId: UUID, itemId: string): Promise<boolean> {
    switch (itemId) {
      case 'org_profile_complete':
        return this.checkOrgProfileComplete(organizationId);
      
      case 'admin_email_verified':
        return this.checkAdminEmailVerified(organizationId);
      
      case 'first_caregiver_added':
        return this.checkHasCaregivers(organizationId);
      
      case 'first_client_added':
        return this.checkHasClients(organizationId);
      
      case 'first_visit_scheduled':
        return this.checkHasVisits(organizationId);
      
      case 'care_plan_created':
        return this.checkHasCarePlans(organizationId);
      
      case 'payor_configured':
        return this.checkHasPayors(organizationId);
      
      default:
        // For items we can't auto-verify, return current status
        return false;
    }
  }

  private async checkOrgProfileComplete(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query<{ 
      legal_name: string | null; 
      tax_id: string | null;
      license_number: string | null;
    }>(
      `SELECT legal_name, tax_id, license_number 
       FROM organizations WHERE id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    
    if (result.rows.length === 0) return false;
    const org = result.rows[0];
    return org !== undefined && 
           org.legal_name !== null && org.legal_name !== '' &&
           org.tax_id !== null && org.tax_id !== '' &&
           org.license_number !== null && org.license_number !== '';
  }

  private async checkAdminEmailVerified(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users 
       WHERE organization_id = $1 
       AND 'ORG_ADMIN' = ANY(roles)
       AND status = 'ACTIVE'
       AND deleted_at IS NULL`,
      [organizationId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  private async checkHasCaregivers(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM caregivers 
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  private async checkHasClients(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM clients 
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  private async checkHasVisits(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM visits 
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  private async checkHasCarePlans(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM care_plans 
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }

  private async checkHasPayors(organizationId: UUID): Promise<boolean> {
    const result = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM payors 
       WHERE organization_id = $1 AND deleted_at IS NULL`,
      [organizationId]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10) > 0;
  }
}
