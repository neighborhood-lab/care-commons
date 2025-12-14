/**
 * Satisfaction Survey Routes
 *
 * API routes for family satisfaction surveys.
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { UUID } from '@folkcare/core';
import { SatisfactionSurveyService } from '../services/satisfaction-survey-service.js';

// ============================================================================
// Zod Schemas
// ============================================================================

const surveyTypeSchema = z.enum([
  'SATISFACTION',
  'NPS',
  'CARE_QUALITY',
  'CAREGIVER_FEEDBACK',
  'CUSTOM'
]);

const surveyStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

const triggerTypeSchema = z.enum([
  'MANUAL',
  'SCHEDULED',
  'AFTER_VISIT',
  'AFTER_MILESTONE',
  'AFTER_CARE_PLAN_UPDATE'
]);

const scheduleFrequencySchema = z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']);

const questionTypeSchema = z.enum([
  'RATING',
  'MULTIPLE_CHOICE',
  'TEXT',
  'NPS',
  'YES_NO',
  'SCALE'
]);

const conditionalOperatorSchema = z.enum([
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN',
  'LESS_THAN'
]);

const createSurveyTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  surveyType: surveyTypeSchema,
  estimatedMinutes: z.number().int().min(1).max(60).optional(),
  allowAnonymous: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  minDaysBetweenSurveys: z.number().int().min(1).max(365).optional(),
  triggerType: triggerTypeSchema,
  triggerDaysAfterEvent: z.number().int().min(1).max(30).optional(),
  scheduleFrequency: scheduleFrequencySchema.optional(),
  scheduleDayOfWeek: z.number().int().min(0).max(6).optional(),
  scheduleDayOfMonth: z.number().int().min(1).max(31).optional(),
  welcomeMessage: z.string().optional(),
  thankYouMessage: z.string().optional(),
  logoUrl: z.string().url().optional()
});

const updateSurveyTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: surveyStatusSchema.optional(),
  estimatedMinutes: z.number().int().min(1).max(60).optional(),
  allowAnonymous: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  minDaysBetweenSurveys: z.number().int().min(1).max(365).optional(),
  triggerType: triggerTypeSchema.optional(),
  triggerDaysAfterEvent: z.number().int().min(1).max(30).optional(),
  scheduleFrequency: scheduleFrequencySchema.optional(),
  scheduleDayOfWeek: z.number().int().min(0).max(6).optional(),
  scheduleDayOfMonth: z.number().int().min(1).max(31).optional(),
  welcomeMessage: z.string().optional(),
  thankYouMessage: z.string().optional(),
  logoUrl: z.string().url().optional()
});

const createSurveyQuestionSchema = z.object({
  surveyTemplateId: z.string().uuid(),
  orderIndex: z.number().int().min(1),
  questionType: questionTypeSchema,
  questionText: z.string().min(1),
  helpText: z.string().optional(),
  isRequired: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  minValue: z.number().int().optional(),
  maxValue: z.number().int().optional(),
  minLabel: z.string().max(100).optional(),
  maxLabel: z.string().max(100).optional(),
  conditionalOnQuestionId: z.string().uuid().optional(),
  conditionalOperator: conditionalOperatorSchema.optional(),
  conditionalValue: z.string().max(255).optional(),
  category: z.string().max(100).optional()
});

const sendInvitationSchema = z.object({
  surveyTemplateId: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  clientId: z.string().uuid(),
  scheduledSendAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  triggerEntityId: z.string().uuid().optional(),
  triggerEntityType: z.string().max(50).optional()
});

const startResponseSchema = z.object({
  isAnonymous: z.boolean().optional(),
  deviceType: z.enum(['DESKTOP', 'MOBILE', 'TABLET']).optional(),
  browser: z.string().max(100).optional()
});

const submitAnswerSchema = z.object({
  surveyResponseId: z.string().uuid(),
  surveyQuestionId: z.string().uuid(),
  ratingValue: z.number().int().optional(),
  textValue: z.string().optional(),
  selectedOptions: z.array(z.number().int()).optional(),
  wasSkipped: z.boolean().optional(),
  timeSpentSeconds: z.number().int().optional()
});

const completeResponseSchema = z.object({
  totalTimeSpentSeconds: z.number().int().min(0)
});

const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().uuid())
});

// ============================================================================
// Route Creator
// ============================================================================

export function createSatisfactionSurveyRoutes(pool: Pool): Router {
  const router = Router();
  const service = new SatisfactionSurveyService(pool);

  // ============================================================================
  // Survey Template Routes
  // ============================================================================

  /**
   * GET /surveys/templates
   * Get all survey templates for organization
   */
  router.get('/templates', async (req, res, next) => {
    try {
      const organizationId = req.query.organizationId as UUID;
      const status = req.query.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | undefined;

      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId is required' });
      }

      const templates = await service.getSurveyTemplates(organizationId, status);
      return res.json(templates);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /surveys/templates/:id
   * Get survey template by ID
   */
  router.get('/templates/:id', async (req, res, next) => {
    try {
      const template = await service.getSurveyTemplateById(req.params.id as UUID);

      if (!template) {
        return res.status(404).json({ error: 'Survey template not found' });
      }

      return res.json(template);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/templates
   * Create a new survey template
   */
  router.post('/templates', async (req, res, next) => {
    try {
      const data = createSurveyTemplateSchema.parse(req.body);
      const organizationId = req.body.organizationId as UUID;
      const userId = req.body.userId as UUID;

      if (!organizationId || !userId) {
        return res.status(400).json({ error: 'organizationId and userId are required' });
      }

      const template = await service.createSurveyTemplate(data, organizationId, userId);
      return res.status(201).json(template);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * PATCH /surveys/templates/:id
   * Update a survey template
   */
  router.patch('/templates/:id', async (req, res, next) => {
    try {
      const data = updateSurveyTemplateSchema.parse(req.body);
      const userId = req.body.userId as UUID;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const template = await service.updateSurveyTemplate(
        req.params.id as UUID,
        data,
        userId
      );
      return res.json(template);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/templates/:id/activate
   * Activate a survey template
   */
  router.post('/templates/:id/activate', async (req, res, next) => {
    try {
      const userId = req.body.userId as UUID;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const template = await service.activateSurveyTemplate(req.params.id as UUID, userId);
      return res.json(template);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/templates/:id/archive
   * Archive a survey template
   */
  router.post('/templates/:id/archive', async (req, res, next) => {
    try {
      const userId = req.body.userId as UUID;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const template = await service.archiveSurveyTemplate(req.params.id as UUID, userId);
      return res.json(template);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /surveys/templates/:id/summary
   * Get summary/analytics for a survey template
   */
  router.get('/templates/:id/summary', async (req, res, next) => {
    try {
      const organizationId = req.query.organizationId as UUID;

      if (!organizationId) {
        return res.status(400).json({ error: 'organizationId is required' });
      }

      const summary = await service.getSurveySummary(req.params.id as UUID, organizationId);

      if (!summary) {
        return res.status(404).json({ error: 'Survey template not found' });
      }

      return res.json(summary);
    } catch (error) {
      return next(error);
    }
  });

  // ============================================================================
  // Survey Question Routes
  // ============================================================================

  /**
   * GET /surveys/templates/:id/questions
   * Get questions for a survey template
   */
  router.get('/templates/:id/questions', async (req, res, next) => {
    try {
      const questions = await service.getSurveyQuestions(req.params.id as UUID);
      return res.json(questions);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/questions
   * Add a question to a survey template
   */
  router.post('/questions', async (req, res, next) => {
    try {
      const data = createSurveyQuestionSchema.parse(req.body);
      const userId = req.body.userId as UUID;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const question = await service.addSurveyQuestion(data, userId);
      return res.status(201).json(question);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * DELETE /surveys/questions/:id
   * Delete a survey question
   */
  router.delete('/questions/:id', async (req, res, next) => {
    try {
      await service.deleteSurveyQuestion(req.params.id as UUID);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/templates/:id/questions/reorder
   * Reorder questions in a survey template
   */
  router.post('/templates/:id/questions/reorder', async (req, res, next) => {
    try {
      const { questionIds } = reorderQuestionsSchema.parse(req.body);
      const userId = req.body.userId as UUID;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      await service.reorderSurveyQuestions(req.params.id as UUID, questionIds, userId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  // ============================================================================
  // Survey Invitation Routes
  // ============================================================================

  /**
   * POST /surveys/invitations
   * Send a survey invitation
   */
  router.post('/invitations', async (req, res, next) => {
    try {
      const data = sendInvitationSchema.parse(req.body);
      const organizationId = req.body.organizationId as UUID;
      const userId = req.body.userId as UUID;

      if (!organizationId || !userId) {
        return res.status(400).json({ error: 'organizationId and userId are required' });
      }

      // Convert string dates to Date objects
      const inputData = {
        ...data,
        scheduledSendAt: data.scheduledSendAt ? new Date(data.scheduledSendAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
      };

      const invitation = await service.sendSurveyInvitation(inputData, organizationId, userId);
      return res.status(201).json(invitation);
    } catch (error) {
      if (error instanceof Error && error.message.includes('frequency limit')) {
        return res.status(429).json({ error: error.message });
      }
      return next(error);
    }
  });

  /**
   * GET /surveys/invitations/code/:code
   * Get survey invitation by code (for survey access)
   */
  router.get('/invitations/code/:code', async (req, res, next) => {
    try {
      const invitation = await service.getSurveyInvitationByCode(req.params.code);

      if (!invitation) {
        return res.status(404).json({ error: 'Survey invitation not found' });
      }

      // Check if expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(410).json({ error: 'Survey invitation has expired' });
      }

      // Mark as opened
      await service.markInvitationOpened(invitation.id);

      // Get template and questions for display
      const template = await service.getSurveyTemplateById(invitation.surveyTemplateId);
      const questions = await service.getSurveyQuestions(invitation.surveyTemplateId);

      return res.json({
        invitation: { ...invitation, status: 'OPENED' },
        template,
        questions
      });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /surveys/invitations/family-member/:familyMemberId
   * Get pending invitations for a family member
   */
  router.get('/invitations/family-member/:familyMemberId', async (req, res, next) => {
    try {
      const invitations = await service.getPendingInvitationsForFamilyMember(
        req.params.familyMemberId as UUID
      );
      return res.json(invitations);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/invitations/:id/decline
   * Decline a survey invitation
   */
  router.post('/invitations/:id/decline', async (req, res, next) => {
    try {
      const { reason } = req.body;
      await service.declineInvitation(req.params.id as UUID, reason);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /surveys/invitations/:id/can-send
   * Check if a survey can be sent to a family member
   */
  router.get('/invitations/can-send', async (req, res, next) => {
    try {
      const templateId = req.query.templateId as UUID;
      const familyMemberId = req.query.familyMemberId as UUID;

      if (!templateId || !familyMemberId) {
        return res.status(400).json({ error: 'templateId and familyMemberId are required' });
      }

      const canSend = await service.canSendSurveyToFamilyMember(templateId, familyMemberId);
      return res.json({ canSend });
    } catch (error) {
      return next(error);
    }
  });

  // ============================================================================
  // Survey Response Routes
  // ============================================================================

  /**
   * POST /surveys/invitations/:id/start
   * Start a survey response
   */
  router.post('/invitations/:id/start', async (req, res, next) => {
    try {
      const { isAnonymous, deviceType, browser } = startResponseSchema.parse(req.body);

      const response = await service.startSurveyResponse(
        req.params.id as UUID,
        isAnonymous ?? false,
        deviceType,
        browser
      );
      return res.status(201).json(response);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /surveys/responses/:id
   * Get survey response by ID
   */
  router.get('/responses/:id', async (req, res, next) => {
    try {
      const response = await service.getSurveyResponseById(req.params.id as UUID);

      if (!response) {
        return res.status(404).json({ error: 'Survey response not found' });
      }

      const answers = await service.getSurveyResponseAnswers(req.params.id as UUID);

      return res.json({ response, answers });
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/answers
   * Submit an answer to a survey question
   */
  router.post('/answers', async (req, res, next) => {
    try {
      const data = submitAnswerSchema.parse(req.body);
      const userId = req.body.userId as UUID | undefined;

      const answer = await service.submitAnswer(data, userId);
      return res.status(201).json(answer);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * POST /surveys/responses/:id/complete
   * Complete a survey response
   */
  router.post('/responses/:id/complete', async (req, res, next) => {
    try {
      const { totalTimeSpentSeconds } = completeResponseSchema.parse(req.body);

      const response = await service.completeSurveyResponse(
        req.params.id as UUID,
        totalTimeSpentSeconds
      );
      return res.json(response);
    } catch (error) {
      return next(error);
    }
  });

  /**
   * GET /surveys/responses/client/:clientId
   * Get recent survey responses for a client
   */
  router.get('/responses/client/:clientId', async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const responses = await service.getRecentResponsesForClient(
        req.params.clientId as UUID,
        limit
      );
      return res.json(responses);
    } catch (error) {
      return next(error);
    }
  });

  // ============================================================================
  // Analytics Routes
  // ============================================================================

  /**
   * GET /surveys/templates/:id/analytics
   * Get survey analytics for a template
   */
  router.get('/templates/:id/analytics', async (req, res, next) => {
    try {
      const periodType = (req.query.periodType as 'DAILY' | 'WEEKLY' | 'MONTHLY') || 'WEEKLY';
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const analytics = await service.getSurveyAnalytics(
        req.params.id as UUID,
        periodType,
        startDate,
        endDate
      );
      return res.json(analytics);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
