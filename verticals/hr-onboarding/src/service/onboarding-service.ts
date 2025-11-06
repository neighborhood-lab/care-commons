/**
 * HR & Onboarding Service
 *
 * Business logic layer for onboarding operations
 */

import type { OnboardingRepository } from '../repository/onboarding-repository.js';
import { OnboardingValidator } from '../validation/onboarding-validator.js';
import {
  OnboardingStage
} from '../types/onboarding.js';
import type {
  OnboardingRecord,
  OnboardingDocument,
  BackgroundCheck,
  Training,
  OnboardingTask,
  OnboardingTemplate,
  DocumentStatus,
  BackgroundCheckStatus,
  TrainingStatus
} from '../types/onboarding.js';

export class OnboardingService {
  constructor(private repository: OnboardingRepository) {}

  // ==================== Onboarding Records ====================

  /**
   * Create a new onboarding record
   */
  async createOnboardingRecord(
    input: unknown,
    createdBy: string
  ): Promise<OnboardingRecord> {
    const validated = OnboardingValidator.validateCreateOnboardingRecord(input);

    // Create the onboarding record
    const record = await this.repository.createOnboardingRecord(validated, createdBy);

    // If a template is specified, initialize from template
    if (validated.templateId) {
      await this.initializeFromTemplate(record.id, validated.templateId);
    }

    return record;
  }

  /**
   * Get onboarding record by ID
   */
  async getOnboardingRecordById(id: string): Promise<OnboardingRecord> {
    const record = await this.repository.getOnboardingRecordById(id);
    if (!record) {
      throw new Error('Onboarding record not found');
    }
    return record;
  }

  /**
   * Get onboarding record by employee ID
   */
  async getOnboardingRecordByEmployeeId(employeeId: string): Promise<OnboardingRecord> {
    const record = await this.repository.getOnboardingRecordByEmployeeId(employeeId);
    if (!record) {
      throw new Error('Onboarding record not found for employee');
    }
    return record;
  }

  /**
   * Update onboarding record
   */
  async updateOnboardingRecord(
    id: string,
    input: unknown,
    updatedBy: string
  ): Promise<OnboardingRecord> {
    const validated = OnboardingValidator.validateUpdateOnboardingRecord(input);
    return this.repository.updateOnboardingRecord(id, validated, updatedBy);
  }

  /**
   * List onboarding records with filters
   */
  async listOnboardingRecords(filters?: unknown): Promise<OnboardingRecord[]> {
    const validated = filters
      ? OnboardingValidator.validateListOnboardingRecords(filters)
      : undefined;
    return this.repository.listOnboardingRecords(validated);
  }

  /**
   * Advance onboarding to next stage
   */
  async advanceStage(
    id: string,
    nextStage: OnboardingStage,
    updatedBy: string
  ): Promise<OnboardingRecord> {
    const record = await this.getOnboardingRecordById(id);

    // Validate stage transition (basic validation)
    const stageOrder = Object.values(OnboardingStage);
    const currentIndex = stageOrder.indexOf(record.stage);
    const nextIndex = stageOrder.indexOf(nextStage);

    if (nextIndex < currentIndex && nextStage !== OnboardingStage.ON_HOLD && nextStage !== OnboardingStage.CANCELLED) {
      throw new Error('Cannot move backwards in onboarding stages');
    }

    return this.repository.updateOnboardingRecord(
      id,
      { stage: nextStage },
      updatedBy
    );
  }

  /**
   * Check if onboarding is on track
   */
  async checkOnTrack(id: string): Promise<{ isOnTrack: boolean; blockers: string[] }> {
    const record = await this.getOnboardingRecordById(id);
    const blockers: string[] = [];

    // Check if target completion date is approaching or passed
    if (record.targetCompletionDate) {
      const daysUntilTarget = Math.ceil(
        (record.targetCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilTarget < 0) {
        blockers.push(`Target completion date passed by ${Math.abs(daysUntilTarget)} days`);
      } else if (daysUntilTarget < 7 && record.overallProgress < 80) {
        blockers.push(`Target completion in ${daysUntilTarget} days but only ${record.overallProgress}% complete`);
      }
    }

    // Check for blocked background checks
    const backgroundChecks = await this.repository.listBackgroundChecks(id);
    const failedChecks = backgroundChecks.filter(c => c.status === 'failed');
    if (failedChecks.length > 0) {
      blockers.push(`${failedChecks.length} background check(s) failed`);
    }

    // Check for rejected documents
    const documents = await this.repository.listDocuments(id);
    const rejectedDocs = documents.filter(d => d.status === 'rejected');
    if (rejectedDocs.length > 0) {
      blockers.push(`${rejectedDocs.length} document(s) rejected`);
    }

    // Check for expired documents
    const expiredDocs = documents.filter(d => d.expiresAt && d.expiresAt < new Date());
    if (expiredDocs.length > 0) {
      blockers.push(`${expiredDocs.length} document(s) expired`);
    }

    // Check for overdue tasks
    const tasks = await this.repository.listTasks(id);
    const overdueTasks = tasks.filter(
      t => t.dueDate && t.dueDate < new Date() && t.status !== 'completed'
    );
    if (overdueTasks.length > 0) {
      blockers.push(`${overdueTasks.length} task(s) overdue`);
    }

    const isOnTrack = blockers.length === 0;

    // Update record if status changed (note: these fields are not in UpdateOnboardingRecordInput)
    // We would need to update the record directly or extend the input type
    // For now, this is a limitation that should be addressed

    return { isOnTrack, blockers };
  }

  /**
   * Get full onboarding details
   */
  async getFullOnboardingDetails(id: string): Promise<{
    record: OnboardingRecord;
    documents: OnboardingDocument[];
    backgroundChecks: BackgroundCheck[];
    trainings: Training[];
    tasks: OnboardingTask[];
    isOnTrack: boolean;
    blockers: string[];
  }> {
    const [record, documents, backgroundChecks, trainings, tasks, trackingStatus] = await Promise.all([
      this.getOnboardingRecordById(id),
      this.repository.listDocuments(id),
      this.repository.listBackgroundChecks(id),
      this.repository.listTrainings(id),
      this.repository.listTasks(id),
      this.checkOnTrack(id)
    ]);

    return {
      record,
      documents,
      backgroundChecks,
      trainings,
      tasks,
      isOnTrack: trackingStatus.isOnTrack,
      blockers: trackingStatus.blockers
    };
  }

  // ==================== Documents ====================

  /**
   * Upload a document
   */
  async uploadDocument(input: unknown, uploadedBy: string): Promise<OnboardingDocument> {
    const validated = OnboardingValidator.validateCreateDocument(input);
    return this.repository.createDocument(validated, uploadedBy);
  }

  /**
   * List documents for an onboarding
   */
  async listDocuments(onboardingId: string): Promise<OnboardingDocument[]> {
    return this.repository.listDocuments(onboardingId);
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    id: string,
    input: unknown
  ): Promise<OnboardingDocument> {
    const validated = OnboardingValidator.validateUpdateDocumentStatus(input);
    return this.repository.updateDocumentStatus(
      id,
      validated.status as DocumentStatus,
      validated.verifiedBy,
      validated.rejectionReason
    );
  }

  // ==================== Background Checks ====================

  /**
   * Initiate a background check
   */
  async initiateBackgroundCheck(
    input: unknown,
    initiatedBy: string
  ): Promise<BackgroundCheck> {
    const validated = OnboardingValidator.validateCreateBackgroundCheck(input);
    return this.repository.createBackgroundCheck(validated, initiatedBy);
  }

  /**
   * List background checks for an onboarding
   */
  async listBackgroundChecks(onboardingId: string): Promise<BackgroundCheck[]> {
    return this.repository.listBackgroundChecks(onboardingId);
  }

  /**
   * Update background check status
   */
  async updateBackgroundCheckStatus(
    id: string,
    input: unknown
  ): Promise<BackgroundCheck> {
    const validated = OnboardingValidator.validateUpdateBackgroundCheckStatus(input);
    return this.repository.updateBackgroundCheckStatus(
      id,
      validated.status as BackgroundCheckStatus,
      validated.result,
      validated.findings
    );
  }

  // ==================== Trainings ====================

  /**
   * Schedule a training
   */
  async scheduleTraining(input: unknown): Promise<Training> {
    const validated = OnboardingValidator.validateCreateTraining(input);
    return this.repository.createTraining(validated);
  }

  /**
   * List trainings for an onboarding
   */
  async listTrainings(onboardingId: string): Promise<Training[]> {
    return this.repository.listTrainings(onboardingId);
  }

  /**
   * Update training status
   */
  async updateTrainingStatus(
    id: string,
    input: unknown
  ): Promise<Training> {
    const validated = OnboardingValidator.validateUpdateTrainingStatus(input);
    return this.repository.updateTrainingStatus(
      id,
      validated.status as TrainingStatus,
      validated.score,
      validated.certificateUrl
    );
  }

  // ==================== Tasks ====================

  /**
   * Create a task
   */
  async createTask(input: unknown): Promise<OnboardingTask> {
    const validated = OnboardingValidator.validateCreateTask(input);
    return this.repository.createTask(validated);
  }

  /**
   * List tasks for an onboarding
   */
  async listTasks(onboardingId: string): Promise<OnboardingTask[]> {
    return this.repository.listTasks(onboardingId);
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    id: string,
    input: unknown
  ): Promise<OnboardingTask> {
    const validated = OnboardingValidator.validateUpdateTaskStatus(input);
    return this.repository.updateTaskStatus(
      id,
      validated.status,
      validated.completedBy
    );
  }

  /**
   * Check if task dependencies are met
   */
  async canStartTask(taskId: string): Promise<{ canStart: boolean; reason?: string }> {
    const tasks = await this.repository.listTasks(''); // Would need to get onboarding ID first
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return { canStart: false, reason: 'Task not found' };
    }

    if (!task.dependsOn || task.dependsOn.length === 0) {
      return { canStart: true };
    }

    const dependencies = tasks.filter(t => task.dependsOn?.includes(t.id));
    const incompleteDeps = dependencies.filter(d => d.status !== 'completed');

    if (incompleteDeps.length > 0) {
      return {
        canStart: false,
        reason: `Waiting on ${incompleteDeps.length} dependent task(s)`
      };
    }

    return { canStart: true };
  }

  // ==================== Templates ====================

  /**
   * Initialize onboarding from template
   */
  async initializeFromTemplate(
    onboardingId: string,
    templateId: string
  ): Promise<void> {
    const template = await this.repository.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const record = await this.getOnboardingRecordById(onboardingId);

    // Create tasks from template
    const taskPromises = template.tasks.map((taskTemplate) => {
      const dueDate = new Date(record.startDate);
      dueDate.setDate(dueDate.getDate() + taskTemplate.dayOffset);

      return this.repository.createTask({
        onboardingId,
        title: taskTemplate.title,
        description: taskTemplate.description,
        category: taskTemplate.category,
        dueDate,
        order: taskTemplate.order,
        required: taskTemplate.required
      });
    });

    // Create required trainings from template
    const trainingPromises = template.requiredTrainings.map((trainingTemplate) => {
      return this.repository.createTraining({
        onboardingId,
        employeeId: record.employeeId,
        trainingType: trainingTemplate.type,
        title: trainingTemplate.title,
        required: true
      });
    });

    // Create required background checks from template
    const backgroundCheckPromises = template.requiredBackgroundChecks.map((checkType) => {
      return this.repository.createBackgroundCheck(
        {
          onboardingId,
          employeeId: record.employeeId,
          checkType
        },
        'system'
      );
    });

    await Promise.all([...taskPromises, ...trainingPromises, ...backgroundCheckPromises]);

    // Update progress
    await this.repository.updateOnboardingProgress(onboardingId);
  }

  /**
   * List active templates
   */
  async listActiveTemplates(): Promise<OnboardingTemplate[]> {
    return this.repository.listActiveTemplates();
  }

  /**
   * Get template for position
   */
  async getTemplateForPosition(position: string): Promise<OnboardingTemplate | null> {
    return this.repository.getTemplateByPosition(position);
  }
}
