/**
 * Caregiver API routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database } from '@care-commons/core';
import { requireAuth } from '../middleware/auth-context';
import { CaregiverService } from '@care-commons/caregiver-staff';
import type { CreateCaregiverInput, UpdateCaregiverInput, CaregiverSearchFilters } from '@care-commons/caregiver-staff';

export function createCaregiverRouter(db: Database): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth);

  /**
   * GET /api/caregivers/me
   * Get authenticated caregiver's profile
   */
  router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const caregiver = await service.getCurrentCaregiverProfile(context);
      res.json(caregiver);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/caregivers
   * Search/list caregivers with filters
   */
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const filters: CaregiverSearchFilters = {
        query: req.query['query'] as string | undefined,
        organizationId: (req.query['organizationId'] as string | undefined) ?? context.organizationId,
        branchId: req.query['branchId'] as string | undefined,
        status: req.query['status'] !== undefined ? (req.query['status'] as string).split(',') as CaregiverSearchFilters['status'] : undefined,
        role: req.query['role'] !== undefined ? (req.query['role'] as string).split(',') as CaregiverSearchFilters['role'] : undefined,
        employmentType: req.query['employmentType'] !== undefined ? (req.query['employmentType'] as string).split(',') as CaregiverSearchFilters['employmentType'] : undefined,
        complianceStatus: req.query['complianceStatus'] !== undefined ? (req.query['complianceStatus'] as string).split(',') as CaregiverSearchFilters['complianceStatus'] : undefined,
        credentialExpiring: req.query['credentialExpiring'] === 'true',
      };

      const pagination = {
        page: parseInt((req.query['page'] as string | undefined) ?? '1', 10),
        limit: parseInt((req.query['limit'] as string | undefined) ?? '20', 10),
      };

      const result = await service.searchCaregivers(filters, pagination, context);
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/caregivers/:id
   * Get caregiver by ID
   */
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const caregiver = await service.getCaregiverById(req.params['id']!, context);
      res.json(caregiver);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/caregivers
   * Create new caregiver
   */
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const input: CreateCaregiverInput = {
        ...req.body,
        organizationId: context.organizationId,
        dateOfBirth: new Date(req.body['dateOfBirth']),
        hireDate: new Date(req.body['hireDate']),
        payRate: {
          ...req.body['payRate'],
          effectiveDate: new Date(req.body['payRate']['effectiveDate']),
        },
      };

      const caregiver = await service.createCaregiver(input, context);
      res.status(201).json(caregiver);
    } catch (error) {
      next(error);
    }
  });

  /**
   * PATCH /api/caregivers/:id
   * Update caregiver
   */
  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const input: UpdateCaregiverInput = req.body;

      const caregiver = await service.updateCaregiver(req.params['id']!, input, context);
      res.json(caregiver);
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/caregivers/:id
   * Soft delete caregiver
   */
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      await service.deleteCaregiver(req.params['id']!, context);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/caregivers/:id/service-authorizations
   * Get service authorizations for caregiver
   */
  router.get('/:id/service-authorizations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const authorizations = await service.getServiceAuthorizations(req.params['id']!, context);
      res.json(authorizations);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/caregivers/:id/service-authorizations
   * Add service authorization for caregiver
   */
  router.post('/:id/service-authorizations', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const authorizationId = await service.addServiceAuthorization(
        req.params['id']!,
        req.body['serviceTypeCode'],
        req.body['serviceTypeName'],
        {
          authorizationSource: req.body['authorizationSource'],
          effectiveDate: req.body['effectiveDate'] !== undefined ? new Date(req.body['effectiveDate']) : undefined,
          expirationDate: req.body['expirationDate'] !== undefined ? new Date(req.body['expirationDate']) : undefined,
          notes: req.body['notes'],
        },
        context
      );

      res.status(201).json({ id: authorizationId });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/caregivers/:id/validate-assignment
   * Validate caregiver eligibility for assignment
   */
  router.post('/:id/validate-assignment', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const result = await service.validateAssignment(
        req.params['id']!,
        req.body['serviceTypeCode'],
        req.body['stateJurisdiction'],
        context
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/caregivers/:id/state-screenings
   * Get state screenings for caregiver
   */
  router.get('/:id/state-screenings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const screenings = await service.getStateScreenings(req.params['id']!, context);
      res.json(screenings);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/caregivers/:id/state-screenings
   * Initiate state background screening
   */
  router.post('/:id/state-screenings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const screeningId = await service.initiateBackgroundScreening(
        req.params['id']!,
        req.body['stateCode'],
        req.body['screeningType'],
        context
      );

      res.status(201).json({ id: screeningId });
    } catch (error) {
      next(error);
    }
  });

  /**
   * PATCH /api/caregivers/:caregiverId/state-screenings/:screeningId
   * Update state screening result
   */
  router.patch('/:caregiverId/state-screenings/:screeningId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      await service.updateBackgroundScreening(
        req.params['screeningId']!,
        {
          status: req.body['status'],
          completionDate: req.body['completionDate'] !== undefined ? new Date(req.body['completionDate']) : undefined,
          expirationDate: req.body['expirationDate'] !== undefined ? new Date(req.body['expirationDate']) : undefined,
          confirmationNumber: req.body['confirmationNumber'],
          clearanceNumber: req.body['clearanceNumber'],
          results: req.body['results'],
          notes: req.body['notes'],
        },
        context
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/caregivers/:id/compliance-status
   * Update compliance status based on current credentials
   */
  router.post('/:id/compliance-status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const caregiver = await service.updateComplianceStatus(req.params['id']!, context);
      res.json(caregiver);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/caregivers/employee-number/:employeeNumber
   * Get caregiver by employee number
   */
  router.get('/employee-number/:employeeNumber', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const caregiver = await service.getCaregiverByEmployeeNumber(
        req.params['employeeNumber']!,
        context.organizationId,
        context
      );
      res.json(caregiver);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/caregivers/branch/:branchId
   * Get caregivers by branch
   */
  router.get('/branch/:branchId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const activeOnly = req.query['activeOnly'] !== 'false';
      const caregivers = await service.getCaregiversByBranch(req.params['branchId']!, activeOnly, context);
      res.json(caregivers);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/caregivers/expiring-credentials
   * Get caregivers with expiring credentials
   */
  router.get('/expiring-credentials', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.userContext!;
      const service = new CaregiverService(db);

      const daysUntilExpiration = parseInt((req.query['days'] as string | undefined) ?? '30', 10);
      const caregivers = await service.getCaregiversWithExpiringCredentials(
        context.organizationId,
        daysUntilExpiration,
        context
      );
      res.json(caregivers);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
