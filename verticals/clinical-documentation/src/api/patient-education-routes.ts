/**
 * Patient Education API Routes
 *
 * Endpoints for managing patient/family education documentation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { PatientEducationService } from '../service/patient-education-service.js';

const educationCategories = [
  'DISEASE_MANAGEMENT',
  'MEDICATION',
  'SAFETY',
  'NUTRITION',
  'EXERCISE',
  'WOUND_CARE',
  'DME_EQUIPMENT',
  'FALL_PREVENTION',
  'INFECTION_CONTROL',
  'PAIN_MANAGEMENT',
  'RESPIRATORY',
  'CARDIAC',
  'DIABETES',
  'MENTAL_HEALTH',
  'END_OF_LIFE',
  'CAREGIVER_TRAINING',
  'EMERGENCY_PROCEDURES',
  'COMMUNITY_RESOURCES',
  'OTHER',
] as const;

const materialTypes = [
  'HANDOUT',
  'BROCHURE',
  'BOOKLET',
  'POSTER',
  'VIDEO',
  'AUDIO',
  'WEBSITE',
  'APP',
  'DEMONSTRATION_GUIDE',
  'CHECKLIST',
  'OTHER',
] as const;

const learnerTypes = ['PATIENT', 'FAMILY_MEMBER', 'CAREGIVER', 'MULTIPLE', 'OTHER'] as const;

const teachingMethods = [
  'VERBAL_INSTRUCTION',
  'DEMONSTRATION',
  'RETURN_DEMONSTRATION',
  'WRITTEN_MATERIALS',
  'VIDEO',
  'HANDS_ON_PRACTICE',
  'DISCUSSION',
  'COMBINATION',
  'OTHER',
] as const;

const comprehensionLevels = [
  'FULLY_UNDERSTOOD',
  'MOSTLY_UNDERSTOOD',
  'PARTIALLY_UNDERSTOOD',
  'NEEDS_REINFORCEMENT',
  'UNABLE_TO_LEARN',
  'NOT_ASSESSED',
] as const;

const returnDemoResults = [
  'SUCCESSFUL',
  'PARTIALLY_SUCCESSFUL',
  'NEEDS_MORE_PRACTICE',
  'UNSUCCESSFUL',
] as const;

const learningBarriers = [
  'LANGUAGE',
  'COGNITIVE',
  'VISION',
  'HEARING',
  'LITERACY',
  'EMOTIONAL',
  'PHYSICAL',
  'CULTURAL',
  'MOTIVATION',
  'OTHER',
] as const;

/**
 * Create patient education routes
 */
export function createPatientEducationRoutes(pool: Pool): Router {
  const router = Router();
  const educationService = new PatientEducationService(pool);

  // ==================== EDUCATION TOPICS ====================

  /**
   * Get education topics
   * GET /api/patient-education/topics
   */
  router.get(
    '/topics',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          category: z.enum(educationCategories).optional(),
          activeOnly: z.coerce.boolean().optional(),
          search: z.string().optional(),
        });

        const { category, activeOnly, search } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const topics = await educationService.getEducationTopics(organizationId, {
          category,
          activeOnly,
          search,
        });

        res.json({ topics, count: topics.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get education topic by ID
   * GET /api/patient-education/topics/:topicId
   */
  router.get(
    '/topics/:topicId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          topicId: z.string().uuid(),
        });

        const { topicId } = paramsSchema.parse(req.params);

        const topic = await educationService.getEducationTopicById(topicId);

        if (!topic) {
          res.status(404).json({ error: 'Education topic not found' });
          return;
        }

        res.json(topic);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create education topic
   * POST /api/patient-education/topics
   */
  router.post(
    '/topics',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          name: z.string().min(1).max(200),
          description: z.string().optional(),
          category: z.enum(educationCategories),
          learningObjectives: z.string().optional(),
          keyPoints: z.string().optional(),
          suggestedMaterials: z.string().max(500).optional(),
          displayOrder: z.number().int().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId } = req.user as { organizationId: string };

        const topic = await educationService.createEducationTopic({
          organizationId,
          ...data,
        });

        res.status(201).json(topic);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update education topic
   * PATCH /api/patient-education/topics/:topicId
   */
  router.patch(
    '/topics/:topicId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          topicId: z.string().uuid(),
        });
        const bodySchema = z.object({
          name: z.string().min(1).max(200).optional(),
          description: z.string().optional(),
          category: z.enum(educationCategories).optional(),
          learningObjectives: z.string().optional(),
          keyPoints: z.string().optional(),
          suggestedMaterials: z.string().max(500).optional(),
          displayOrder: z.number().int().optional(),
        });

        const { topicId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const topic = await educationService.updateEducationTopic(topicId, data);

        res.json(topic);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Deactivate education topic
   * DELETE /api/patient-education/topics/:topicId
   */
  router.delete(
    '/topics/:topicId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          topicId: z.string().uuid(),
        });

        const { topicId } = paramsSchema.parse(req.params);

        await educationService.deactivateEducationTopic(topicId);

        res.json({ success: true, message: 'Education topic deactivated' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== EDUCATION MATERIALS ====================

  /**
   * Get education materials
   * GET /api/patient-education/materials
   */
  router.get(
    '/materials',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          topicId: z.string().uuid().optional(),
          materialType: z.enum(materialTypes).optional(),
          language: z.string().optional(),
          activeOnly: z.coerce.boolean().optional(),
        });

        const { topicId, materialType, language, activeOnly } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const materials = await educationService.getEducationMaterials(organizationId, {
          topicId,
          materialType,
          language,
          activeOnly,
        });

        res.json({ materials, count: materials.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create education material
   * POST /api/patient-education/materials
   */
  router.post(
    '/materials',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          topicId: z.string().uuid().optional(),
          name: z.string().min(1).max(200),
          description: z.string().optional(),
          materialType: z.enum(materialTypes),
          language: z.string().max(50).optional(),
          readingLevel: z.string().max(50).optional(),
          fileUrl: z.string().max(500).optional(),
          source: z.string().max(200).optional(),
          displayOrder: z.number().int().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId } = req.user as { organizationId: string };

        const material = await educationService.createEducationMaterial({
          organizationId,
          ...data,
        });

        res.status(201).json(material);
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== PATIENT EDUCATION RECORDS ====================

  /**
   * Create patient education record
   * POST /api/patient-education
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          branchId: z.string().uuid().optional(),
          clientId: z.string().uuid(),
          visitId: z.string().uuid().optional(),
          topicId: z.string().uuid().optional(),
          topicName: z.string().min(1).max(200),
          category: z.enum(educationCategories),
          specificContent: z.string().optional(),
          learningObjectives: z.string().optional(),
          learnerType: z.enum(learnerTypes),
          learnerName: z.string().max(200).optional(),
          learnerRelationship: z.string().max(100).optional(),
          teachingMethod: z.enum(teachingMethods),
          methodDetails: z.string().optional(),
          materialsProvided: z.array(z.string()).optional(),
          materialsNotes: z.string().optional(),
          comprehensionLevel: z.enum(comprehensionLevels),
          comprehensionNotes: z.string().optional(),
          learningBarriers: z.array(z.enum(learningBarriers)).optional(),
          barrierNotes: z.string().optional(),
          returnDemoPerformed: z.boolean().optional(),
          returnDemoResult: z.enum(returnDemoResults).optional(),
          returnDemoNotes: z.string().optional(),
          followUpNeeded: z.boolean().optional(),
          followUpPlan: z.string().optional(),
          followUpDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          documentedByName: z.string().min(1).max(200),
          documentedByCredentials: z.string().max(50).optional(),
          educationDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          timeSpentMinutes: z.number().int().min(1).max(480).optional(),
          clinicalNotes: z.string().optional(),
          patientResponse: z.string().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const education = await educationService.createPatientEducation({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          visitId: data.visitId,
          topicId: data.topicId,
          topicName: data.topicName,
          category: data.category,
          specificContent: data.specificContent,
          learningObjectives: data.learningObjectives,
          learnerType: data.learnerType,
          learnerName: data.learnerName,
          learnerRelationship: data.learnerRelationship,
          teachingMethod: data.teachingMethod,
          methodDetails: data.methodDetails,
          materialsProvided: data.materialsProvided,
          materialsNotes: data.materialsNotes,
          comprehensionLevel: data.comprehensionLevel,
          comprehensionNotes: data.comprehensionNotes,
          learningBarriers: data.learningBarriers,
          barrierNotes: data.barrierNotes,
          returnDemoPerformed: data.returnDemoPerformed,
          returnDemoResult: data.returnDemoResult,
          returnDemoNotes: data.returnDemoNotes,
          followUpNeeded: data.followUpNeeded,
          followUpPlan: data.followUpPlan,
          followUpDate: data.followUpDate,
          documentedBy: userId,
          documentedByName: data.documentedByName,
          documentedByCredentials: data.documentedByCredentials,
          educationDate: data.educationDate,
          timeSpentMinutes: data.timeSpentMinutes,
          clinicalNotes: data.clinicalNotes,
          patientResponse: data.patientResponse,
        });

        res.status(201).json(education);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get patient education by ID
   * GET /api/patient-education/:educationId
   */
  router.get(
    '/:educationId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          educationId: z.string().uuid(),
        });

        const { educationId } = paramsSchema.parse(req.params);

        const education = await educationService.getPatientEducationById(educationId);

        if (!education) {
          res.status(404).json({ error: 'Patient education record not found' });
          return;
        }

        res.json(education);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get education for a client
   * GET /api/patient-education/client/:clientId
   */
  router.get(
    '/client/:clientId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          category: z.enum(educationCategories).optional(),
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { category, startDate, endDate, limit, offset } = querySchema.parse(req.query);

        const education = await educationService.getClientEducation(clientId, {
          category,
          startDate,
          endDate,
          limit,
          offset,
        });

        res.json({ clientId, education, count: education.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get education for a visit
   * GET /api/patient-education/visit/:visitId
   */
  router.get(
    '/visit/:visitId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          visitId: z.string().uuid(),
        });

        const { visitId } = paramsSchema.parse(req.params);

        const education = await educationService.getVisitEducation(visitId);

        res.json({ visitId, education, count: education.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get education needing follow-up
   * GET /api/patient-education/follow-up/organization
   */
  router.get(
    '/follow-up/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const education = await educationService.getEducationNeedingFollowUp(organizationId);

        res.json({ education, count: education.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get education with low comprehension
   * GET /api/patient-education/low-comprehension/organization
   */
  router.get(
    '/low-comprehension/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const education = await educationService.getLowComprehensionEducation(organizationId);

        res.json({ education, count: education.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update patient education
   * PATCH /api/patient-education/:educationId
   */
  router.patch(
    '/:educationId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          educationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          specificContent: z.string().optional(),
          comprehensionLevel: z.enum(comprehensionLevels).optional(),
          comprehensionNotes: z.string().optional(),
          returnDemoPerformed: z.boolean().optional(),
          returnDemoResult: z.enum(returnDemoResults).optional(),
          returnDemoNotes: z.string().optional(),
          followUpNeeded: z.boolean().optional(),
          followUpPlan: z.string().optional(),
          followUpDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          clinicalNotes: z.string().optional(),
          patientResponse: z.string().optional(),
        });

        const { educationId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);

        const education = await educationService.updatePatientEducation({
          id: educationId,
          ...data,
        });

        res.json(education);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Mark follow-up complete
   * POST /api/patient-education/:educationId/complete-follow-up
   */
  router.post(
    '/:educationId/complete-follow-up',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          educationId: z.string().uuid(),
        });
        const bodySchema = z.object({
          notes: z.string().min(1),
        });

        const { educationId } = paramsSchema.parse(req.params);
        const { notes } = bodySchema.parse(req.body);

        const education = await educationService.markFollowUpComplete(educationId, notes);

        res.json(education);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete patient education
   * DELETE /api/patient-education/:educationId
   */
  router.delete(
    '/:educationId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          educationId: z.string().uuid(),
        });

        const { educationId } = paramsSchema.parse(req.params);

        await educationService.deletePatientEducation(educationId);

        res.json({ success: true, message: 'Patient education record deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== SUMMARY ====================

  /**
   * Get education summary
   * GET /api/patient-education/summary/organization
   */
  router.get(
    '/summary/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const summary = await educationService.getEducationSummary(organizationId);

        res.json(summary);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Generate printable education report for client
   * GET /api/patient-education/client/:clientId/report
   */
  router.get(
    '/client/:clientId/report',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          clientName: z.string().min(1),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { clientName } = querySchema.parse(req.query);

        const education = await educationService.getClientEducation(clientId);
        const report = educationService.generateEducationReport(clientName, education);

        res.setHeader('Content-Type', 'text/plain');
        res.send(report);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
