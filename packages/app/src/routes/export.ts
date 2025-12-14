/**
 * Data Export routes
 *
 * Provides API endpoints for one-click full data export
 * including FHIR R4 format for healthcare interoperability.
 */

import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { DataExportService, FHIRExportService } from '@folkcare/core';
import { requireAuth } from '../middleware/auth-context';
import { asyncHandler } from '@folkcare/core';
import { z } from 'zod';
import type { UUID } from '@folkcare/core';

const router: RouterType = Router();

// Apply authentication to all export routes
router.use(requireAuth);

// Validation schema for export request
const exportRequestSchema = z.object({
  format: z.enum(['json', 'csv']),
  includeDeleted: z.boolean().optional().default(false),
  tables: z.array(z.string()).optional(),
});

// Validation schema for audit log export
const auditLogExportSchema = z.object({
  format: z.enum(['json', 'csv']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  includeRevisions: z.boolean().optional().default(true),
  includeSecurityEvents: z.boolean().optional().default(true),
});

/**
 * Get export metadata (preview before download)
 *
 * @route GET /export/metadata
 * @security Requires authentication and organization scope
 */
router.get('/metadata', asyncHandler(async (req: Request, res: Response) => {
  // Get organization ID from authenticated user
  const organizationId = req.user?.organizationId;

  if (organizationId === undefined) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  const exportService = new DataExportService();
  const metadata = await exportService.getExportMetadata(organizationId);

  res.json({
    organizationId,
    ...metadata,
    estimatedSizeMB: (metadata.estimatedSize / (1024 * 1024)).toFixed(2),
  });
}));

/**
 * Export organization data
 *
 * @route POST /export
 * @security Requires authentication and organization scope
 * @body {format: 'json' | 'csv', includeDeleted?: boolean, tables?: string[]}
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  // Get organization ID from authenticated user
  const organizationId = req.user?.organizationId;

  if (organizationId === undefined) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  // Validate request body
  const validatedBody = exportRequestSchema.parse(req.body);

  const exportService = new DataExportService();
  const result = await exportService.exportData({
    organizationId,
    ...validatedBody,
  });

  // Set appropriate content type and filename
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const filename = `folkcare-export-${organizationId.slice(0, 8)}-${timestamp}.${validatedBody.format}`;

  if (validatedBody.format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(result.data);
  } else {
    // CSV format
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  }
}));

/**
 * Export audit logs
 *
 * @route POST /export/audit-logs
 * @security Requires authentication and admin privileges
 * @body {format, startDate?, endDate?, userId?, eventType?, resource?, action?, includeRevisions?, includeSecurityEvents?}
 */
router.post('/audit-logs', asyncHandler(async (req: Request, res: Response) => {
  // Get organization ID from authenticated user
  const organizationId = req.user?.organizationId;

  if (organizationId === undefined) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  // Validate request body
  const validatedBody = auditLogExportSchema.parse(req.body);

  const exportService = new DataExportService();
  const result = await exportService.exportAuditLogs({
    organizationId,
    ...validatedBody,
  });

  // Set appropriate content type and filename
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const filename = `folkcare-audit-logs-${organizationId.slice(0, 8)}-${timestamp}.${validatedBody.format}`;

  if (validatedBody.format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(result.data);
  } else {
    // CSV format
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  }
}));

// ============================================================================
// FHIR R4 Export Routes
// ============================================================================

// Validation schema for FHIR batch export
const fhirBatchExportSchema = z.object({
  clientIds: z.array(z.string().uuid()).min(1).max(100),
  includeOrganization: z.boolean().optional().default(true),
});

/**
 * Export single patient as FHIR R4 Bundle
 *
 * @route GET /export/fhir/patient/:clientId
 * @security Requires authentication and organization scope
 */
router.get('/fhir/patient/:clientId', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (organizationId === undefined) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  const clientId = req.params.clientId;
  if (clientId === undefined || clientId === '' || !z.string().uuid().safeParse(clientId).success) {
    res.status(400).json({ error: 'Valid client ID required' });
    return;
  }

  const includeOrganization = req.query.includeOrganization !== 'false';

  const fhirService = new FHIRExportService();
  const bundle = await fhirService.exportPatientBundle(
    clientId as UUID,
    organizationId,
    { includeOrganization }
  );

  // Set FHIR-specific headers
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const filename = `fhir-patient-${clientId.slice(0, 8)}-${timestamp}.json`;

  res.setHeader('Content-Type', 'application/fhir+json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(bundle);
}));

/**
 * Export multiple patients as FHIR R4 searchset Bundle
 *
 * @route POST /export/fhir/patients
 * @security Requires authentication and organization scope
 * @body {clientIds: string[], includeOrganization?: boolean}
 */
router.post('/fhir/patients', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (organizationId === undefined) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  // Validate request body
  const validatedBody = fhirBatchExportSchema.parse(req.body);

  const fhirService = new FHIRExportService();
  const bundle = await fhirService.exportPatientSearchSet(
    validatedBody.clientIds as UUID[],
    organizationId,
    { includeOrganization: validatedBody.includeOrganization }
  );

  // Set FHIR-specific headers
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const filename = `fhir-patients-${organizationId.slice(0, 8)}-${timestamp}.json`;

  res.setHeader('Content-Type', 'application/fhir+json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(bundle);
}));

/**
 * Get FHIR export metadata (available patients and estimated size)
 *
 * @route GET /export/fhir/metadata
 * @security Requires authentication and organization scope
 */
router.get('/fhir/metadata', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (organizationId === undefined) {
    res.status(400).json({ error: 'Organization ID required' });
    return;
  }

  const fhirService = new FHIRExportService();
  const metadata = await fhirService.getExportMetadata(organizationId);

  res.json({
    organizationId,
    format: 'FHIR R4',
    contentType: 'application/fhir+json',
    ...metadata,
  });
}));

export default router;
