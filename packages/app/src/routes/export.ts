/**
 * Data Export routes
 *
 * Provides API endpoints for one-click full data export
 */

import { Router, type Router as RouterType, type Request, type Response } from 'express';
import { DataExportService } from '@folkcare/core';
import { requireAuth } from '../middleware/auth-context';
import { asyncHandler } from '@folkcare/core';
import { z } from 'zod';

const router: RouterType = Router();

// Apply authentication to all export routes
router.use(requireAuth);

// Validation schema for export request
const exportRequestSchema = z.object({
  format: z.enum(['json', 'csv']),
  includeDeleted: z.boolean().optional().default(false),
  tables: z.array(z.string()).optional(),
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

export default router;
