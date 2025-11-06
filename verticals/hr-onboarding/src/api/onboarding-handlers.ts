/**
 * HR & Onboarding API Handlers
 *
 * Express route handlers for onboarding endpoints
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import type { OnboardingService } from '../service/onboarding-service.js';

export class OnboardingHandlers {
  constructor(private service: OnboardingService) {}

  private getUserId(req: Request): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req as any).user?.userId || 'system';
  }

  // ==================== Onboarding Records ====================

  /**
   * Create a new onboarding record
   * POST /api/onboarding
   */
  createOnboardingRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const record = await this.service.createOnboardingRecord(req.body, userId);
      res.status(201).json(record);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get onboarding record by ID
   * GET /api/onboarding/:id
   */
  getOnboardingRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await this.service.getOnboardingRecordById(req.params.id!);
      res.json(record);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get onboarding record by employee ID
   * GET /api/onboarding/employee/:employeeId
   */
  getOnboardingRecordByEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
      const record = await this.service.getOnboardingRecordByEmployeeId(req.params.employeeId!);
      res.json(record);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update onboarding record
   * PATCH /api/onboarding/:id
   */
  updateOnboardingRecord = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const record = await this.service.updateOnboardingRecord(
        req.params.id!,
        req.body,
        userId
      );
      res.json(record);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * List onboarding records
   * GET /api/onboarding
   */
  listOnboardingRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const records = await this.service.listOnboardingRecords(req.query);
      res.json(records);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Advance onboarding stage
   * POST /api/onboarding/:id/advance
   */
  advanceStage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { nextStage } = req.body;
      const record = await this.service.advanceStage(req.params.id!, nextStage, userId);
      res.json(record);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get full onboarding details
   * GET /api/onboarding/:id/full
   */
  getFullOnboardingDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const details = await this.service.getFullOnboardingDetails(req.params.id!);
      res.json(details);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Check if onboarding is on track
   * GET /api/onboarding/:id/tracking
   */
  checkOnTrack = async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await this.service.checkOnTrack(req.params.id!);
      res.json(status);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ==================== Documents ====================

  /**
   * Upload a document
   * POST /api/onboarding/:id/documents
   */
  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const document = await this.service.uploadDocument(
        { ...req.body, onboardingId: req.params.id! },
        userId
      );
      res.status(201).json(document);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * List documents
   * GET /api/onboarding/:id/documents
   */
  listDocuments = async (req: Request, res: Response): Promise<void> => {
    try {
      const documents = await this.service.listDocuments(req.params.id!);
      res.json(documents);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update document status
   * PATCH /api/onboarding/documents/:documentId/status
   */
  updateDocumentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const document = await this.service.updateDocumentStatus(
        req.params.documentId!,
        req.body
      );
      res.json(document);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ==================== Background Checks ====================

  /**
   * Initiate background check
   * POST /api/onboarding/:id/background-checks
   */
  initiateBackgroundCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const check = await this.service.initiateBackgroundCheck(
        { ...req.body, onboardingId: req.params.id! },
        userId
      );
      res.status(201).json(check);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * List background checks
   * GET /api/onboarding/:id/background-checks
   */
  listBackgroundChecks = async (req: Request, res: Response): Promise<void> => {
    try {
      const checks = await this.service.listBackgroundChecks(req.params.id!);
      res.json(checks);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update background check status
   * PATCH /api/onboarding/background-checks/:checkId/status
   */
  updateBackgroundCheckStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const check = await this.service.updateBackgroundCheckStatus(
        req.params.checkId!,
        req.body
      );
      res.json(check);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ==================== Trainings ====================

  /**
   * Schedule training
   * POST /api/onboarding/:id/trainings
   */
  scheduleTraining = async (req: Request, res: Response): Promise<void> => {
    try {
      const training = await this.service.scheduleTraining({
        ...req.body,
        onboardingId: req.params.id!
      });
      res.status(201).json(training);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * List trainings
   * GET /api/onboarding/:id/trainings
   */
  listTrainings = async (req: Request, res: Response): Promise<void> => {
    try {
      const trainings = await this.service.listTrainings(req.params.id!);
      res.json(trainings);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update training status
   * PATCH /api/onboarding/trainings/:trainingId/status
   */
  updateTrainingStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const training = await this.service.updateTrainingStatus(
        req.params.trainingId!,
        req.body
      );
      res.json(training);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ==================== Tasks ====================

  /**
   * Create task
   * POST /api/onboarding/:id/tasks
   */
  createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await this.service.createTask({
        ...req.body,
        onboardingId: req.params.id!
      });
      res.status(201).json(task);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * List tasks
   * GET /api/onboarding/:id/tasks
   */
  listTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await this.service.listTasks(req.params.id!);
      res.json(tasks);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Update task status
   * PATCH /api/onboarding/tasks/:taskId/status
   */
  updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const task = await this.service.updateTaskStatus(
        req.params.taskId!,
        req.body
      );
      res.json(task);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Check if task can start
   * GET /api/onboarding/tasks/:taskId/can-start
   */
  canStartTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.service.canStartTask(req.params.taskId!);
      res.json(result);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ==================== Templates ====================

  /**
   * List active templates
   * GET /api/onboarding/templates
   */
  listActiveTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const templates = await this.service.listActiveTemplates();
      res.json(templates);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get template for position
   * GET /api/onboarding/templates/position/:position
   */
  getTemplateForPosition = async (req: Request, res: Response): Promise<void> => {
    try {
      const template = await this.service.getTemplateForPosition(req.params.position!);
      if (!template) {
        res.status(404).json({ error: 'Template not found for position' });
        return;
      }
      res.json(template);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  // ==================== Error Handling ====================

  private handleError(error: unknown, res: Response): void {
    console.error('Onboarding API Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation error',
          details: error
        });
        return;
      }

      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Create router for onboarding endpoints
 */
export function createOnboardingRouter(service: OnboardingService) {
  const handlers = new OnboardingHandlers(service);
  const router = Router();

  // Onboarding records
  router.post('/onboarding', handlers.createOnboardingRecord);
  router.get('/onboarding', handlers.listOnboardingRecords);
  router.get('/onboarding/:id', handlers.getOnboardingRecord);
  router.get('/onboarding/employee/:employeeId', handlers.getOnboardingRecordByEmployee);
  router.patch('/onboarding/:id', handlers.updateOnboardingRecord);
  router.post('/onboarding/:id/advance', handlers.advanceStage);
  router.get('/onboarding/:id/full', handlers.getFullOnboardingDetails);
  router.get('/onboarding/:id/tracking', handlers.checkOnTrack);

  // Documents
  router.post('/onboarding/:id/documents', handlers.uploadDocument);
  router.get('/onboarding/:id/documents', handlers.listDocuments);
  router.patch('/onboarding/documents/:documentId/status', handlers.updateDocumentStatus);

  // Background checks
  router.post('/onboarding/:id/background-checks', handlers.initiateBackgroundCheck);
  router.get('/onboarding/:id/background-checks', handlers.listBackgroundChecks);
  router.patch('/onboarding/background-checks/:checkId/status', handlers.updateBackgroundCheckStatus);

  // Trainings
  router.post('/onboarding/:id/trainings', handlers.scheduleTraining);
  router.get('/onboarding/:id/trainings', handlers.listTrainings);
  router.patch('/onboarding/trainings/:trainingId/status', handlers.updateTrainingStatus);

  // Tasks
  router.post('/onboarding/:id/tasks', handlers.createTask);
  router.get('/onboarding/:id/tasks', handlers.listTasks);
  router.patch('/onboarding/tasks/:taskId/status', handlers.updateTaskStatus);
  router.get('/onboarding/tasks/:taskId/can-start', handlers.canStartTask);

  // Templates
  router.get('/onboarding/templates', handlers.listActiveTemplates);
  router.get('/onboarding/templates/position/:position', handlers.getTemplateForPosition);

  return router;
}
