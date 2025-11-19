/**
 * Import API routes
 * 
 * Bulk data import endpoints with file upload support
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { asyncHandler, Database, AuthMiddleware, UserContext } from '@care-commons/core';
import { ClientImportService } from '@care-commons/client-demographics';

export function createImportRoutes(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);

  // Configure multer for file uploads (memory storage)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (_req, file, cb) => {
      // Accept only CSV and Excel files
      const allowedMimeTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
      }
    },
  });

  /**
   * POST /api/import/clients
   * 
   * Import clients from CSV file
   */
  router.post(
    '/clients',
    authMiddleware.requireAuth,
    upload.single('file'),
    asyncHandler(async (req: Request, res: Response) => {
      const file = req.file;
      if (file === undefined) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Build user context from authenticated user
      const user = req.user!;
      const context: UserContext = {
        userId: user.userId,
        organizationId: user.organizationId,
        roles: user.roles,
        permissions: user.permissions,
        branchIds: user.branchIds ?? [],
      };

      const dryRun = req.body.dryRun === 'true' || req.body.dryRun === true;
      const updateExisting = req.body.updateExisting === 'true' || req.body.updateExisting === true;

      // Parse CSV file
      const importService = new ClientImportService(db);
      
      const parseResult = await importService.parseFile(file.buffer, file.originalname);
      
      // If parsing failed, return errors immediately
      const hasErrors = parseResult.errors.some((e) => e.severity === 'ERROR');
      if (parseResult.errors.length > 0 && hasErrors) {
        res.status(400).json({
          success: false,
          error: 'File parsing failed',
          errors: parseResult.errors,
        });
        return;
      }

      // Import records
      const importResult = await importService.import(parseResult.records, {
        organizationId: context.organizationId!,
        userId: context.userId,
        dryRun,
        updateExisting,
        batchSize: 100,
      });

      // Update metadata with actual file info
      importResult.metadata.sourceFile = {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };

      res.json(importResult);
    })
  );

  /**
   * GET /api/import/clients/template
   * 
   * Download CSV template for client import
   */
  router.get(
    '/clients/template',
    asyncHandler(async (_req: Request, res: Response) => {
      const template = [
        'first_name,last_name,date_of_birth,branch_id,address_line1,address_line2,address_city,address_state,address_postal_code,address_county,phone_number,phone_type,phone_can_sms,email,gender,status,referral_source,intake_date,emergency_contact_name,emergency_contact_relationship,emergency_contact_phone',
        'John,Doe,1950-01-15,00000000-0000-0000-0000-000000000000,123 Main St,,Austin,TX,78701,Travis,512-555-1234,MOBILE,true,john.doe@example.com,MALE,ACTIVE,Hospital Referral,2024-01-15,Jane Doe,Daughter,512-555-5678',
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=client_import_template.csv');
      res.send(template);
    })
  );

  return router;
}
