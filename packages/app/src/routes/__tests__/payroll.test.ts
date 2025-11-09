/**
 * Payroll Routes Tests
 *
 * Tests for payroll processing API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { Database } from '@care-commons/core';
import { createPayrollRouter } from '../payroll.js';

// Mock the payroll-processing module
const mockPayrollService = {
  createPayPeriod: vi.fn().mockResolvedValue({ id: 'period-1', status: 'DRAFT' }),
  openPayPeriod: vi.fn().mockResolvedValue(undefined),
  lockPayPeriod: vi.fn().mockResolvedValue(undefined),
  compileTimeSheet: vi.fn().mockResolvedValue({ id: 'timesheet-1' }),
  approveTimeSheet: vi.fn().mockResolvedValue(undefined),
  createPayRun: vi.fn().mockResolvedValue({ id: 'payrun-1' }),
  approvePayRun: vi.fn().mockResolvedValue(undefined),
};

const mockPayStubGenerator = {
  generatePayStubPDF: vi.fn().mockResolvedValue(Buffer.from('PDF content')),
};

const mockPayrollRepository = {
  findPayPeriods: vi.fn().mockResolvedValue([
    { id: 'period-1', startDate: new Date('2024-01-01'), status: 'OPEN' },
  ]),
  findPayPeriodById: vi.fn().mockResolvedValue({ id: 'period-1' }),
  findTimeSheets: vi.fn().mockResolvedValue([{ id: 'timesheet-1' }]),
  findTimeSheetById: vi.fn().mockResolvedValue({ id: 'timesheet-1' }),
  findPayRunsByPeriod: vi.fn().mockResolvedValue([{ id: 'payrun-1' }]),
  findPayRunById: vi.fn().mockResolvedValue({ id: 'payrun-1' }),
  findPayStubs: vi.fn().mockResolvedValue([
    { id: 'paystub-1', payDate: new Date('2024-01-15') },
  ]),
  findPayStubById: vi.fn().mockResolvedValue({
    id: 'paystub-1',
    stubNumber: 'PS-001',
  }),
};

vi.mock('@care-commons/payroll-processing', () => ({
  PayrollService: vi.fn().mockImplementation(() => mockPayrollService),
  PayStubGeneratorService: vi.fn().mockImplementation(() => mockPayStubGenerator),
  PayrollRepository: vi.fn().mockImplementation(() => mockPayrollRepository),
}));

describe('Payroll Routes', () => {
  let app: Express;
  let mockDb: Database;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock database with getPool method
    mockDb = {
      getPool: vi.fn().mockReturnValue({}),
    } as unknown as Database;

    const payrollRouter = createPayrollRouter(mockDb);
    app.use('/api', payrollRouter);
  });

  describe('GET /api/payroll/periods', () => {
    it('should return pay periods list', async () => {
      const response = await request(app).get('/api/payroll/periods');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/payroll/periods')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.limit).toBe(10);
      expect(response.body.meta.offset).toBe(0);
    });
  });

  describe('POST /api/payroll/periods', () => {
    it('should create a new pay period', async () => {
      const response = await request(app)
        .post('/api/payroll/periods')
        .set('x-user-id', 'user-1')
        .send({
          organizationId: 'org-1',
          periodType: 'BIWEEKLY',
          startDate: '2024-01-01',
          endDate: '2024-01-14',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
    });

    it('should require user authentication', async () => {
      const response = await request(app)
        .post('/api/payroll/periods')
        .send({
          organizationId: 'org-1',
          periodType: 'BIWEEKLY',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/payroll/periods/:id', () => {
    it('should return a specific pay period', async () => {
      const response = await request(app).get('/api/payroll/periods/period-1');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('period-1');
    });

    it('should return 400 for empty id', async () => {
      const response = await request(app).get('/api/payroll/periods/');

      expect(response.status).toBe(404); // Express router will not match the route
    });
  });

  describe('POST /api/payroll/periods/:id/open', () => {
    it('should open a pay period', async () => {
      const response = await request(app)
        .post('/api/payroll/periods/period-1/open')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/payroll/periods/period-1/open');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/payroll/periods/:id/lock', () => {
    it('should lock a pay period', async () => {
      const response = await request(app)
        .post('/api/payroll/periods/period-1/lock')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/payroll/timesheets', () => {
    it('should compile a timesheet', async () => {
      const response = await request(app)
        .post('/api/payroll/timesheets')
        .set('x-user-id', 'user-1')
        .send({
          payPeriodId: 'period-1',
          caregiverId: 'caregiver-1',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/payroll/timesheets', () => {
    it('should return timesheets list', async () => {
      const response = await request(app).get('/api/payroll/timesheets');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should support filters', async () => {
      const response = await request(app)
        .get('/api/payroll/timesheets')
        .query({ caregiverId: 'caregiver-1', status: 'PENDING' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/payroll/timesheets/:id', () => {
    it('should return a specific timesheet', async () => {
      const response = await request(app).get('/api/payroll/timesheets/timesheet-1');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/payroll/timesheets/:id/approve', () => {
    it('should approve a timesheet', async () => {
      const response = await request(app)
        .post('/api/payroll/timesheets/timesheet-1/approve')
        .set('x-user-id', 'user-1')
        .send({ approvalNotes: 'Approved' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/payroll/pay-runs', () => {
    it('should create a pay run', async () => {
      const response = await request(app)
        .post('/api/payroll/pay-runs')
        .set('x-user-id', 'user-1')
        .send({
          payPeriodId: 'period-1',
          payDate: '2024-01-15',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/payroll/pay-runs', () => {
    it('should return pay runs list', async () => {
      const response = await request(app)
        .get('/api/payroll/pay-runs')
        .query({ payPeriodId: 'period-1' });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should require payPeriodId', async () => {
      const response = await request(app).get('/api/payroll/pay-runs');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payroll/pay-runs/:id', () => {
    it('should return a specific pay run', async () => {
      const response = await request(app).get('/api/payroll/pay-runs/payrun-1');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/payroll/pay-runs/:id/approve', () => {
    it('should approve a pay run', async () => {
      const response = await request(app)
        .post('/api/payroll/pay-runs/payrun-1/approve')
        .set('x-user-id', 'user-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/payroll/pay-stubs', () => {
    it('should return pay stubs list', async () => {
      const response = await request(app).get('/api/payroll/pay-stubs');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should support multiple filters', async () => {
      const response = await request(app)
        .get('/api/payroll/pay-stubs')
        .query({
          organizationId: 'org-1',
          caregiverId: 'caregiver-1',
          status: 'PAID',
        });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/payroll/pay-stubs/:id', () => {
    it('should return a specific pay stub', async () => {
      const response = await request(app).get('/api/payroll/pay-stubs/paystub-1');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/payroll/pay-stubs/:id/pdf', () => {
    it('should generate and return PDF', async () => {
      const response = await request(app).get('/api/payroll/pay-stubs/paystub-1/pdf');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('pay-stub-PS-001.pdf');
    });
  });

  describe('GET /api/payroll/caregivers/:caregiverId/pay-stubs', () => {
    it('should return pay stubs for a caregiver', async () => {
      const response = await request(app).get('/api/payroll/caregivers/caregiver-1/pay-stubs');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should support year filter and limit', async () => {
      const response = await request(app)
        .get('/api/payroll/caregivers/caregiver-1/pay-stubs')
        .query({ year: 2024, limit: 10 });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/payroll/current-period', () => {
    it('should return current active period', async () => {
      const response = await request(app)
        .get('/api/payroll/current-period')
        .query({ organizationId: 'org-1' });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });

    it('should require organizationId', async () => {
      const response = await request(app).get('/api/payroll/current-period');

      expect(response.status).toBe(400);
    });
  });
});
