import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import type { UserContext } from '@care-commons/core';
import { MedicationService } from '../service/medication-service.js';
import {
  createMedicationSchema,
  updateMedicationSchema,
  recordAdministrationSchema,
  createAllergySchema,
  updateAllergySchema,
  medicationSearchFiltersSchema,
  administrationSearchFiltersSchema,
  allergySearchFiltersSchema,
  paginationSchema,
  administrationReportSchema,
} from '../validation/medication-validator.js';

/**
 * Extract user context from authenticated request
 */
function getUserContext(req: Request): UserContext {
  // In production, this would be populated by auth middleware
  return (req as Request & { userContext: UserContext }).userContext;
}

/**
 * Handle async route errors
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Medication API handlers
 */
export class MedicationHandlers {
  constructor(private medicationService: MedicationService) {}

  // Medication endpoints

  searchMedications = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = medicationSearchFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    const result = await this.medicationService.searchMedications(filters, pagination, context);
    res.json({ success: true, data: result });
  });

  getMedicationById = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const id = req.params.id!;

    const medication = await this.medicationService.getMedicationById(id, context);

    if (!medication) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }

    res.json({ success: true, data: medication });
  });

  getMedicationWithDetails = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const id = req.params.id!;

    const medication = await this.medicationService.getMedicationWithDetails(id, context);

    if (!medication) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }

    res.json({ success: true, data: medication });
  });

  createMedication = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input = createMedicationSchema.parse(req.body);

    const medication = await this.medicationService.createMedication(input, context);
    res.status(201).json({ success: true, data: medication });
  });

  updateMedication = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const id = req.params.id!;
    const input = updateMedicationSchema.parse(req.body);

    const medication = await this.medicationService.updateMedication(id, input, context);
    res.json({ success: true, data: medication });
  });

  deleteMedication = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const id = req.params.id!;

    await this.medicationService.deleteMedication(id, context);
    res.json({ success: true, message: 'Medication discontinued' });
  });

  getMedicationsByClientId = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const clientId = req.params.clientId!;

    const medications = await this.medicationService.getMedicationsByClientId(clientId, context);
    res.json({ success: true, data: medications });
  });

  // Administration endpoints

  searchAdministrations = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = administrationSearchFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    const result = await this.medicationService.searchAdministrations(filters, pagination, context);
    res.json({ success: true, data: result });
  });

  recordAdministration = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input = recordAdministrationSchema.parse(req.body);

    const administration = await this.medicationService.recordAdministration(input, context);
    res.status(201).json({ success: true, data: administration });
  });

  getAdministrationReport = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const params = administrationReportSchema.parse(req.query);

    const report = await this.medicationService.getAdministrationReport(
      params.client_id,
      params.period_start,
      params.period_end,
      context
    );
    res.json({ success: true, data: report });
  });

  // Allergy endpoints

  searchAllergies = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = allergySearchFiltersSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);

    const result = await this.medicationService.searchAllergies(filters, pagination, context);
    res.json({ success: true, data: result });
  });

  createAllergy = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input = createAllergySchema.parse(req.body);

    const allergy = await this.medicationService.createAllergy(input, context);
    res.status(201).json({ success: true, data: allergy });
  });

  updateAllergy = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const id = req.params.id!;
    const input = updateAllergySchema.parse(req.body);

    const allergy = await this.medicationService.updateAllergy(id, input, context);
    res.json({ success: true, data: allergy });
  });

  getActiveAllergiesByClientId = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const clientId = req.params.clientId!;

    const allergies = await this.medicationService.getActiveAllergiesByClientId(clientId, context);
    res.json({ success: true, data: allergies });
  });
}

/**
 * Create medication router
 */
export function createMedicationRouter(medicationService: MedicationService): Router {
  const router = Router();
  const handlers = new MedicationHandlers(medicationService);

  // Note: Authentication middleware should be applied by the app

  // Medication routes
  router.get('/medications', handlers.searchMedications);
  router.get('/medications/:id', handlers.getMedicationById);
  router.get('/medications/:id/details', handlers.getMedicationWithDetails);
  router.post('/medications', handlers.createMedication);
  router.patch('/medications/:id', handlers.updateMedication);
  router.delete('/medications/:id', handlers.deleteMedication);
  router.get('/clients/:clientId/medications', handlers.getMedicationsByClientId);

  // Administration routes
  router.get('/medication-administrations', handlers.searchAdministrations);
  router.post('/medication-administrations', handlers.recordAdministration);
  router.get('/medication-administrations/report', handlers.getAdministrationReport);

  // Allergy routes
  router.get('/medication-allergies', handlers.searchAllergies);
  router.post('/medication-allergies', handlers.createAllergy);
  router.patch('/medication-allergies/:id', handlers.updateAllergy);
  router.get('/clients/:clientId/medication-allergies', handlers.getActiveAllergiesByClientId);

  return router;
}
