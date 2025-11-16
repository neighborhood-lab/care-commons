/**
 * Visit Routes Tests
 *
 * Tests for visit API endpoints including my-visits, calendar, assignments, and notes
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createVisitRouter } from '../visits';
import type { Database } from '@care-commons/core';
import type { Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';

describe('Visit Routes', () => {
  let mockDb: Database;
  let mockPool: Pool;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;
  let nextMock: NextFunction;

  beforeEach(() => {
    // Mock pool
    mockPool = {} as Pool;

    // Mock database
    mockDb = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
      getPool: vi.fn().mockReturnValue(mockPool),
    } as unknown as Database;

    // Mock response
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    } as unknown as Response;

    // Mock next function
    nextMock = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /my-visits', () => {
    beforeEach(() => {
      mockRequest = {
        query: {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        },
        userContext: {
          userId: 'user-123',
          organizationId: 'org-123',
          branchIds: ['branch-123'],
          roles: ['CAREGIVER'],
          permissions: ['visits:read'],
        },
      };
    });

    it('should lookup user email and caregiver record', async () => {
      // NOTE: Full integration test would require mocking ScheduleRepository
      // This test verifies that the route exists and is properly configured
      const router = createVisitRouter(mockDb);
      const myVisitsRoute = router.stack.find((layer: any) =>
        layer.route?.path === '/my-visits'
      );

      expect(myVisitsRoute).toBeDefined();
      expect(myVisitsRoute?.route?.path).toBe('/my-visits');
    });

    it('should return empty array for user without caregiver record', async () => {
      // Mock user lookup
      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({
          rows: [{ email: 'coordinator@example.com' }],
        } as any)
        // Mock caregiver lookup - no results
        .mockResolvedValueOnce({
          rows: [],
        } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/my-visits')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
          meta: expect.objectContaining({
            count: 0,
            message: 'No caregiver record found for this user',
          }),
        })
      );
    });

    it('should return 400 for missing start_date', async () => {
      mockRequest.query = { end_date: '2025-01-31' };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/my-visits')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Missing required parameters: start_date and end_date',
        })
      );
    });

    it('should return 400 for invalid date format', async () => {
      mockRequest.query = { start_date: 'invalid', end_date: '2025-01-31' };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/my-visits')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD format',
        })
      );
    });

    it('should return 400 for date range exceeding 31 days', async () => {
      mockRequest.query = { start_date: '2025-01-01', end_date: '2025-03-01' };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/my-visits')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Date range cannot exceed 31 days',
        })
      );
    });

    it('should return 400 for end date before start date', async () => {
      mockRequest.query = { start_date: '2025-01-31', end_date: '2025-01-01' };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/my-visits')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'End date must be after start date',
        })
      );
    });

    it('should return 404 when user not found', async () => {
      // Mock user lookup - no results
      vi.mocked(mockDb.query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/my-visits')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        })
      );
    });
  });

  describe('GET /calendar', () => {
    beforeEach(() => {
      mockRequest = {
        query: {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        },
        userContext: {
          userId: 'user-123',
          organizationId: 'org-123',
          branchIds: ['branch-123'],
          roles: ['COORDINATOR'],
          permissions: ['visits:read'],
        },
      };
    });

    it('should have calendar route configured', async () => {
      // NOTE: Full integration test would require mocking ScheduleRepository
      // This test verifies that the route exists and is properly configured
      const router = createVisitRouter(mockDb);
      const calendarRoute = router.stack.find((layer: any) =>
        layer.route?.path === '/calendar'
      );

      expect(calendarRoute).toBeDefined();
      expect(calendarRoute?.route?.path).toBe('/calendar');
    });

    it('should return 400 for date range exceeding 60 days', async () => {
      mockRequest.query = { start_date: '2025-01-01', end_date: '2025-04-01' };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/calendar')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Date range cannot exceed 60 days',
        })
      );
    });

    it('should return 400 when organization_id is missing', async () => {
      mockRequest.userContext = {
        userId: 'user-123',
        organizationId: undefined,
        branchIds: ['branch-123'],
        roles: ['COORDINATOR'],
        permissions: ['visits:read'],
      };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/calendar')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Organization ID is required for this endpoint',
        })
      );
    });

    it('should return 400 when organization_id is invalid UUID', async () => {
      mockRequest.userContext = {
        userId: 'user-123',
        organizationId: 'invalid-uuid',
        branchIds: ['branch-123'],
        roles: ['COORDINATOR'],
        permissions: ['visits:read'],
      };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/calendar')?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid organization ID format',
        })
      );
    });
  });

  describe('PUT /:id/assign', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'visit-123' },
        body: {
          caregiverId: 'caregiver-456',
          checkConflicts: true,
        },
        userContext: {
          userId: 'user-123',
          organizationId: '550e8400-e29b-41d4-a716-446655440000',
          branchIds: ['branch-123'],
          roles: ['COORDINATOR'],
          permissions: ['visits:update'],
        },
      };
    });

    it('should assign caregiver to visit successfully', async () => {
      // Mock visit lookup
      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({
          rows: [{
            id: 'visit-123',
            organization_id: '550e8400-e29b-41d4-a716-446655440000',
            branch_id: 'branch-123',
            scheduled_date: new Date('2025-01-15'),
            scheduled_start_time: '09:00:00',
            scheduled_end_time: '10:00:00',
            status: 'UNASSIGNED',
          }],
        } as any)
        // Mock caregiver lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'caregiver-456', status: 'ACTIVE' }],
        } as any)
        // Mock conflict check
        .mockResolvedValueOnce({
          rows: [],
        } as any)
        // Mock assignment update
        .mockResolvedValueOnce({
          rows: [{
            id: 'visit-123',
            assigned_caregiver_id: 'caregiver-456',
            status: 'ASSIGNED',
          }],
        } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/assign')?.route?.stack.find((s: any) => s.method === 'put')?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'visit-123',
            assigned_caregiver_id: 'caregiver-456',
            status: 'ASSIGNED',
          }),
        })
      );
    });

    it('should return 400 for missing caregiverId', async () => {
      mockRequest.body = { checkConflicts: true };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/assign')?.route?.stack.find((s: any) => s.method === 'put')?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'caregiverId is required',
        })
      );
    });

    it('should return 404 for non-existent visit', async () => {
      // Mock visit lookup - no results
      vi.mocked(mockDb.query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/assign')?.route?.stack.find((s: any) => s.method === 'put')?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Visit not found',
        })
      );
    });

    it('should return 409 for scheduling conflicts', async () => {
      // Mock visit lookup
      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({
          rows: [{
            id: 'visit-123',
            organization_id: '550e8400-e29b-41d4-a716-446655440000',
            branch_id: 'branch-123',
            scheduled_date: new Date('2025-01-15'),
            scheduled_start_time: '09:00:00',
            scheduled_end_time: '10:00:00',
            status: 'UNASSIGNED',
          }],
        } as any)
        // Mock caregiver lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'caregiver-456', status: 'ACTIVE' }],
        } as any)
        // Mock conflict check - conflicts found
        .mockResolvedValueOnce({
          rows: [{
            id: 'visit-789',
            scheduled_start_time: '09:30:00',
            scheduled_end_time: '11:00:00',
            client_id: 'client-999',
          }],
        } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/assign')?.route?.stack.find((s: any) => s.method === 'put')?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Scheduling conflict detected',
          conflicts: expect.any(Array),
        })
      );
    });
  });

  describe('POST /:id/notes', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: 'visit-123' },
        body: {
          noteType: 'GENERAL',
          noteText: 'Client was happy and engaged during the visit.',
          clientMood: 'GOOD',
          activitiesPerformed: ['MEAL_PREP', 'LIGHT_HOUSEKEEPING'],
          isIncident: false,
        },
        userContext: {
          userId: 'user-123',
          organizationId: 'org-123',
          branchIds: ['branch-123'],
          roles: ['CAREGIVER'],
          permissions: ['visit_notes:create'],
        },
      };
    });

    it('should create visit note successfully', async () => {
      // Mock visit lookup
      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({
          rows: [{
            id: 'visit-123',
            assigned_caregiver_id: 'caregiver-456',
            organization_id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'COMPLETED',
          }],
        } as any)
        // Mock caregiver lookup
        .mockResolvedValueOnce({
          rows: [{ id: 'caregiver-456' }],
        } as any)
        // Mock note insertion
        .mockResolvedValueOnce({
          rows: [{
            id: 'note-789',
            visit_id: 'visit-123',
            note_type: 'GENERAL',
            note_text: 'Client was happy and engaged during the visit.',
            client_mood: 'GOOD',
          }],
        } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/notes' && layer.route?.methods?.post)?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'note-789',
            visit_id: 'visit-123',
          }),
        })
      );
    });

    it('should return 400 for missing noteText', async () => {
      mockRequest.body = {
        noteType: 'GENERAL',
        clientMood: 'GOOD',
      };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/notes' && layer.route?.methods?.post)?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'noteText is required',
        })
      );
    });

    it('should return 400 for incident without severity', async () => {
      mockRequest.body = {
        noteText: 'Client fell.',
        isIncident: true,
        // Missing incidentSeverity
      };

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/notes' && layer.route?.methods?.post)?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'incidentSeverity is required when isIncident is true',
        })
      );
    });

    it('should return 404 for non-existent visit', async () => {
      // Mock visit lookup - no results
      vi.mocked(mockDb.query).mockResolvedValueOnce({
        rows: [],
      } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/notes' && layer.route?.methods?.post)?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Visit not found',
        })
      );
    });

    it('should return 400 for visit without assigned caregiver', async () => {
      // Mock visit lookup - visit with no caregiver
      vi.mocked(mockDb.query).mockResolvedValueOnce({
        rows: [{
          id: 'visit-123',
          assigned_caregiver_id: null,
          organization_id: 'org-123',
          status: 'UNASSIGNED',
        }],
      } as any);

      const router = createVisitRouter(mockDb);
      const handler = router.stack.find((layer: any) => layer.route?.path === '/:id/notes' && layer.route?.methods?.post)?.route?.stack[0]?.handle;

      if (!handler) {
        throw new Error('Handler not found');
      }

      await handler(mockRequest as Request, mockResponse as Response, nextMock);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Visit is not assigned to a caregiver',
        })
      );
    });
  });
});
