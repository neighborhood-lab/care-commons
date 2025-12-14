/**
 * Family Onboarding Service
 *
 * Provides a welcome guide for new families explaining how to use the portal
 * and what to expect from their care experience.
 *
 * Features:
 * - Personalized welcome message
 * - Step-by-step onboarding flow
 * - Progress tracking
 * - Video tutorials, articles, and checklists
 * - FAQ sections for common questions
 */

import type { UUID } from '@folkcare/core';
import type {
  FamilyMember,
  FamilyOnboardingGuide,
  FamilyOnboardingProgress,
  OnboardingStep,
  OnboardingStepContent,
  OnboardingStepProgress,
  OnboardingStepWithContent,
  OnboardingCategoryInfo,
  OnboardingCategory,
  OnboardingCompletionSummary,
  StartOnboardingInput,
  CompleteOnboardingStepInput,
  SkipOnboardingStepInput,
} from '../types/family-engagement.js';

/**
 * Error thrown when family member lacks portal access
 */
export class OnboardingAccessDeniedError extends Error {
  constructor(familyMemberId: UUID) {
    super(`Family member ${familyMemberId} does not have portal access`);
    this.name = 'OnboardingAccessDeniedError';
  }
}

/**
 * Repository interface for family member data
 */
export interface OnboardingFamilyMemberRepository {
  getFamilyMemberForClient(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember | null>;
}

/**
 * Repository interface for onboarding data
 */
export interface OnboardingDataRepository {
  getOnboardingSteps(organizationId: UUID): Promise<RawOnboardingStep[]>;
  getStepContent(stepId: string): Promise<RawStepContent | null>;
  getProgress(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<RawOnboardingProgress | null>;
  createProgress(
    familyMemberId: UUID,
    clientId: UUID,
    organizationId: UUID
  ): Promise<RawOnboardingProgress>;
  updateProgress(
    familyMemberId: UUID,
    clientId: UUID,
    updates: Partial<RawOnboardingProgress>
  ): Promise<void>;
  getOrganizationInfo(organizationId: UUID): Promise<RawOrgInfo>;
  getCareCoordinator(clientId: UUID): Promise<RawCareCoordinator | null>;
  getClientInfo(clientId: UUID): Promise<RawClientInfo | null>;
}

// ---- Raw data types ----

interface RawOnboardingStep {
  id: UUID;
  stepId: string;
  order: number;
  category: string;
  title: string;
  description: string;
  contentType: string;
  estimatedMinutes: number;
  isRequired: boolean;
  canSkip: boolean;
  iconName?: string;
  organizationId: UUID;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UUID;
  updatedBy: UUID;
  version: number;
}

interface RawStepContent {
  stepId: string;
  bodyContent: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDurationSeconds?: number;
  checklistItemsJson?: string;
  faqItemsJson?: string;
  tipsJson?: string;
  actionButtonText?: string;
  actionButtonUrl?: string;
  relatedStepIdsJson?: string;
}

interface RawOnboardingProgress {
  id: UUID;
  familyMemberId: UUID;
  clientId: UUID;
  organizationId: UUID;
  overallProgress: number;
  stepProgressJson: string;
  startedAt: Date;
  completedAt?: Date;
  isComplete: boolean;
  totalTimeSpentMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UUID;
  updatedBy: UUID;
  version: number;
}

interface RawOrgInfo {
  name: string;
  emergencyPhone: string;
  emergencyInstructions: string;
  welcomeMessage?: string;
}

interface RawCareCoordinator {
  name: string;
  phone: string;
  email: string;
  photoUrl?: string;
}

interface RawClientInfo {
  firstName: string;
  lastName: string;
}

/**
 * Service for managing family onboarding experience
 */
export class FamilyOnboardingService {
  constructor(
    private familyMemberRepo: OnboardingFamilyMemberRepository,
    private onboardingRepo: OnboardingDataRepository
  ) {}

  /**
   * Verify family member has portal access
   */
  private async verifyAccess(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyMember> {
    const familyMember = await this.familyMemberRepo.getFamilyMemberForClient(
      familyMemberId,
      clientId
    );

    if (familyMember === null) {
      throw new OnboardingAccessDeniedError(familyMemberId);
    }

    if (
      familyMember.status !== 'ACTIVE' ||
      familyMember.invitationStatus !== 'ACCEPTED'
    ) {
      throw new OnboardingAccessDeniedError(familyMemberId);
    }

    return familyMember;
  }

  /**
   * Get the complete onboarding guide for a family member
   */
  async getOnboardingGuide(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyOnboardingGuide> {
    const familyMember = await this.verifyAccess(familyMemberId, clientId);
    const organizationId = familyMember.organizationId;

    // Fetch all data in parallel
    const [steps, progress, orgInfo, coordinator, clientInfo] =
      await Promise.all([
        this.onboardingRepo.getOnboardingSteps(organizationId),
        this.onboardingRepo.getProgress(familyMemberId, clientId),
        this.onboardingRepo.getOrganizationInfo(organizationId),
        this.onboardingRepo.getCareCoordinator(clientId),
        this.onboardingRepo.getClientInfo(clientId),
      ]);

    // Create progress if doesn't exist
    const actualProgress =
      progress ??
      (await this.onboardingRepo.createProgress(
        familyMemberId,
        clientId,
        organizationId
      ));

    // Get content for all steps
    const stepsWithContent: OnboardingStepWithContent[] = [];
    const stepProgress = this.parseStepProgress(actualProgress.stepProgressJson);

    for (const step of steps) {
      const content = await this.onboardingRepo.getStepContent(step.stepId);
      stepsWithContent.push({
        ...this.transformStep(step),
        content: content !== null
          ? this.transformContent(content)
          : this.getDefaultContent(step.stepId),
        progress: stepProgress.find((p) => p.stepId === step.stepId),
      });
    }

    // Group by category
    const categories = this.buildCategoryInfo(stepsWithContent, stepProgress);

    return {
      familyMemberName: `${familyMember.firstName} ${familyMember.lastName}`,
      clientName: clientInfo !== null
        ? `${clientInfo.firstName} ${clientInfo.lastName}`
        : 'Your loved one',
      welcomeMessage:
        orgInfo.welcomeMessage ??
        `Welcome to the Family Portal! We're so glad you're here. This guide will help you get started and make the most of your experience.`,
      organizationName: orgInfo.name,
      careCoordinatorContact:
        coordinator !== null
          ? {
              name: coordinator.name,
              phone: coordinator.phone,
              email: coordinator.email,
              photoUrl: coordinator.photoUrl,
            }
          : undefined,
      steps: stepsWithContent,
      progress: this.transformProgress(actualProgress),
      categories,
      quickStartTips: this.getQuickStartTips(),
      emergencyContact: {
        phone: orgInfo.emergencyPhone,
        instructions: orgInfo.emergencyInstructions,
      },
    };
  }

  /**
   * Get onboarding progress for a family member
   */
  async getProgress(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<FamilyOnboardingProgress> {
    const familyMember = await this.verifyAccess(familyMemberId, clientId);
    const organizationId = familyMember.organizationId;

    let progress = await this.onboardingRepo.getProgress(
      familyMemberId,
      clientId
    );

    if (progress === null) {
      progress = await this.onboardingRepo.createProgress(
        familyMemberId,
        clientId,
        organizationId
      );
    }

    return this.transformProgress(progress);
  }

  /**
   * Start the onboarding process
   */
  async startOnboarding(
    input: StartOnboardingInput
  ): Promise<FamilyOnboardingProgress> {
    const familyMember = await this.verifyAccess(
      input.familyMemberId,
      input.clientId
    );
    const organizationId = familyMember.organizationId;

    let progress = await this.onboardingRepo.getProgress(
      input.familyMemberId,
      input.clientId
    );

    if (progress === null) {
      progress = await this.onboardingRepo.createProgress(
        input.familyMemberId,
        input.clientId,
        organizationId
      );
    }

    return this.transformProgress(progress);
  }

  /**
   * Mark an onboarding step as complete
   */
  async completeStep(
    input: CompleteOnboardingStepInput
  ): Promise<FamilyOnboardingProgress> {
    const familyMember = await this.verifyAccess(
      input.familyMemberId,
      input.clientId
    );
    const organizationId = familyMember.organizationId;

    let progress = await this.onboardingRepo.getProgress(
      input.familyMemberId,
      input.clientId
    );

    if (progress === null) {
      progress = await this.onboardingRepo.createProgress(
        input.familyMemberId,
        input.clientId,
        organizationId
      );
    }

    const stepProgress = this.parseStepProgress(progress.stepProgressJson);
    const existingStep = stepProgress.find((p) => p.stepId === input.stepId);

    const updatedStepProgress: OnboardingStepProgress = {
      stepId: input.stepId,
      status: 'COMPLETED',
      startedAt: existingStep?.startedAt ?? new Date(),
      completedAt: new Date(),
      timeSpentMinutes:
        input.timeSpentMinutes ?? existingStep?.timeSpentMinutes ?? 0,
      checklistProgress: input.checklistProgress ?? existingStep?.checklistProgress,
    };

    // Update step progress array
    const newStepProgress = stepProgress.filter((p) => p.stepId !== input.stepId);
    newStepProgress.push(updatedStepProgress);

    // Get steps to calculate overall progress
    const steps = await this.onboardingRepo.getOnboardingSteps(organizationId);
    const requiredSteps = steps.filter((s) => s.isRequired);
    const completedRequired = newStepProgress.filter(
      (p) =>
        p.status === 'COMPLETED' &&
        requiredSteps.some((s) => s.stepId === p.stepId)
    );

    const overallProgress =
      requiredSteps.length > 0
        ? Math.round((completedRequired.length / requiredSteps.length) * 100)
        : 100;

    const isComplete =
      overallProgress === 100 ||
      requiredSteps.every(
        (s) =>
          newStepProgress.find((p) => p.stepId === s.stepId)?.status ===
          'COMPLETED'
      );

    const totalTimeSpent = newStepProgress.reduce(
      (sum, p) => sum + p.timeSpentMinutes,
      0
    );

    await this.onboardingRepo.updateProgress(
      input.familyMemberId,
      input.clientId,
      {
        stepProgressJson: JSON.stringify(newStepProgress),
        overallProgress,
        isComplete,
        totalTimeSpentMinutes: totalTimeSpent,
        completedAt: isComplete ? new Date() : undefined,
      }
    );

    return this.getProgress(input.familyMemberId, input.clientId);
  }

  /**
   * Skip an onboarding step
   */
  async skipStep(input: SkipOnboardingStepInput): Promise<FamilyOnboardingProgress> {
    const familyMember = await this.verifyAccess(
      input.familyMemberId,
      input.clientId
    );
    const organizationId = familyMember.organizationId;

    // Verify step can be skipped
    const steps = await this.onboardingRepo.getOnboardingSteps(organizationId);
    const step = steps.find((s) => s.stepId === input.stepId);

    if (step === undefined || !step.canSkip) {
      throw new Error(`Step ${input.stepId} cannot be skipped`);
    }

    let progress = await this.onboardingRepo.getProgress(
      input.familyMemberId,
      input.clientId
    );

    if (progress === null) {
      progress = await this.onboardingRepo.createProgress(
        input.familyMemberId,
        input.clientId,
        organizationId
      );
    }

    const stepProgress = this.parseStepProgress(progress.stepProgressJson);
    const existingStep = stepProgress.find((p) => p.stepId === input.stepId);

    const updatedStepProgress: OnboardingStepProgress = {
      stepId: input.stepId,
      status: 'SKIPPED',
      startedAt: existingStep?.startedAt,
      skippedAt: new Date(),
      timeSpentMinutes: existingStep?.timeSpentMinutes ?? 0,
    };

    const newStepProgress = stepProgress.filter((p) => p.stepId !== input.stepId);
    newStepProgress.push(updatedStepProgress);

    await this.onboardingRepo.updateProgress(
      input.familyMemberId,
      input.clientId,
      {
        stepProgressJson: JSON.stringify(newStepProgress),
      }
    );

    return this.getProgress(input.familyMemberId, input.clientId);
  }

  /**
   * Get completion summary when onboarding is finished
   */
  async getCompletionSummary(
    familyMemberId: UUID,
    clientId: UUID
  ): Promise<OnboardingCompletionSummary | null> {
    await this.verifyAccess(familyMemberId, clientId);

    const progress = await this.onboardingRepo.getProgress(
      familyMemberId,
      clientId
    );

    if (progress === null || !progress.isComplete) {
      return null;
    }

    const stepProgress = this.parseStepProgress(progress.stepProgressJson);

    return {
      familyMemberId,
      clientId,
      completedStepsCount: stepProgress.filter((p) => p.status === 'COMPLETED')
        .length,
      totalStepsCount: stepProgress.length,
      skippedStepsCount: stepProgress.filter((p) => p.status === 'SKIPPED').length,
      totalTimeSpentMinutes: progress.totalTimeSpentMinutes,
      completedAt: progress.completedAt ?? new Date(),
      nextRecommendedAction: {
        title: 'View Care Schedule',
        description:
          "Now that you're set up, take a look at your loved one's upcoming care visits.",
        actionUrl: '/family/schedule',
      },
    };
  }

  // ---- Private helper methods ----

  private parseStepProgress(json: string): OnboardingStepProgress[] {
    try {
      const parsed = JSON.parse(json) as OnboardingStepProgress[];
      return parsed;
    } catch {
      return [];
    }
  }

  private transformStep(raw: RawOnboardingStep): OnboardingStep {
    return {
      id: raw.id,
      stepId: raw.stepId,
      order: raw.order,
      category: this.mapCategory(raw.category),
      title: raw.title,
      description: raw.description,
      contentType: this.mapContentType(raw.contentType),
      estimatedMinutes: raw.estimatedMinutes,
      isRequired: raw.isRequired,
      canSkip: raw.canSkip,
      iconName: raw.iconName,
      organizationId: raw.organizationId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdBy: raw.createdBy,
      updatedBy: raw.updatedBy,
      version: raw.version,
    };
  }

  private transformContent(raw: RawStepContent): OnboardingStepContent {
    return {
      stepId: raw.stepId,
      bodyContent: raw.bodyContent,
      videoUrl: raw.videoUrl,
      videoThumbnail: raw.videoThumbnail,
      videoDurationSeconds: raw.videoDurationSeconds,
      checklistItems: raw.checklistItemsJson !== undefined
        ? JSON.parse(raw.checklistItemsJson)
        : undefined,
      faqItems: raw.faqItemsJson !== undefined
        ? JSON.parse(raw.faqItemsJson)
        : undefined,
      tips: raw.tipsJson !== undefined
        ? JSON.parse(raw.tipsJson)
        : undefined,
      actionButtonText: raw.actionButtonText,
      actionButtonUrl: raw.actionButtonUrl,
      relatedStepIds: raw.relatedStepIdsJson !== undefined
        ? JSON.parse(raw.relatedStepIdsJson)
        : undefined,
    };
  }

  private getDefaultContent(stepId: string): OnboardingStepContent {
    return {
      stepId,
      bodyContent: 'Content coming soon.',
    };
  }

  private transformProgress(raw: RawOnboardingProgress): FamilyOnboardingProgress {
    return {
      id: raw.id,
      familyMemberId: raw.familyMemberId,
      clientId: raw.clientId,
      overallProgress: raw.overallProgress,
      stepProgress: this.parseStepProgress(raw.stepProgressJson),
      startedAt: raw.startedAt,
      completedAt: raw.completedAt,
      isComplete: raw.isComplete,
      totalTimeSpentMinutes: raw.totalTimeSpentMinutes,
      organizationId: raw.organizationId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdBy: raw.createdBy,
      updatedBy: raw.updatedBy,
      version: raw.version,
    };
  }

  private buildCategoryInfo(
    steps: OnboardingStepWithContent[],
    progress: OnboardingStepProgress[]
  ): OnboardingCategoryInfo[] {
    const categoryDisplayNames: Record<OnboardingCategory, { name: string; desc: string; icon: string }> = {
      GETTING_STARTED: {
        name: 'Getting Started',
        desc: 'Essential first steps to begin your journey',
        icon: 'play-circle',
      },
      PORTAL_NAVIGATION: {
        name: 'Using the Portal',
        desc: 'Learn how to navigate and find information',
        icon: 'compass',
      },
      CARE_TEAM: {
        name: 'Your Care Team',
        desc: 'Meet the people caring for your loved one',
        icon: 'users',
      },
      COMMUNICATION: {
        name: 'Communication',
        desc: 'How to stay connected with the care team',
        icon: 'message-circle',
      },
      SCHEDULING: {
        name: 'Schedules & Visits',
        desc: 'Understanding care schedules and visits',
        icon: 'calendar',
      },
      BILLING: {
        name: 'Billing & Payments',
        desc: 'Managing billing and payment information',
        icon: 'credit-card',
      },
      DOCUMENTS: {
        name: 'Documents',
        desc: 'Accessing and managing important documents',
        icon: 'file-text',
      },
      EMERGENCY: {
        name: 'Emergency Info',
        desc: 'What to do in case of emergency',
        icon: 'alert-circle',
      },
      RESOURCES: {
        name: 'Resources',
        desc: 'Additional resources and support',
        icon: 'book-open',
      },
    };

    const categories: OnboardingCategoryInfo[] = [];
    const seenCategories = new Set<OnboardingCategory>();

    for (const step of steps) {
      if (!seenCategories.has(step.category)) {
        seenCategories.add(step.category);
        const categorySteps = steps.filter((s) => s.category === step.category);
        const completedInCategory = categorySteps.filter(
          (s) =>
            progress.find((p) => p.stepId === s.stepId)?.status === 'COMPLETED'
        );

        const info = categoryDisplayNames[step.category];
        categories.push({
          category: step.category,
          displayName: info.name,
          description: info.desc,
          iconName: info.icon,
          stepCount: categorySteps.length,
          completedCount: completedInCategory.length,
        });
      }
    }

    return categories;
  }

  private getQuickStartTips(): string[] {
    return [
      'Check the schedule regularly to see upcoming visits',
      'Use the messaging feature to communicate with your care team',
      'Set up notifications to stay informed about important updates',
      'Save emergency contact numbers to your phone',
      "Review your loved one's care plan to understand their needs",
    ];
  }

  private mapCategory(raw: string): OnboardingCategory {
    const mapping: Record<string, OnboardingCategory> = {
      GETTING_STARTED: 'GETTING_STARTED',
      PORTAL_NAVIGATION: 'PORTAL_NAVIGATION',
      CARE_TEAM: 'CARE_TEAM',
      COMMUNICATION: 'COMMUNICATION',
      SCHEDULING: 'SCHEDULING',
      BILLING: 'BILLING',
      DOCUMENTS: 'DOCUMENTS',
      EMERGENCY: 'EMERGENCY',
      RESOURCES: 'RESOURCES',
    };
    return mapping[raw] ?? 'GETTING_STARTED';
  }

  private mapContentType(raw: string): OnboardingStep['contentType'] {
    const mapping: Record<string, OnboardingStep['contentType']> = {
      WELCOME: 'WELCOME',
      VIDEO: 'VIDEO',
      ARTICLE: 'ARTICLE',
      CHECKLIST: 'CHECKLIST',
      INTERACTIVE: 'INTERACTIVE',
      FAQ: 'FAQ',
    };
    return mapping[raw] ?? 'ARTICLE';
  }
}
