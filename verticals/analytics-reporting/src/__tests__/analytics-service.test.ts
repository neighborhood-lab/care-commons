/**
 * Analytics Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../service/analytics-service';
import { Database } from '@care-commons/core';

// Helper to create mock query builder
function createMockQueryBuilder() {
  const countFn = vi.fn(() => Promise.resolve({ count: '10' }));
  const sumFn = vi.fn(() => Promise.resolve({ total: '100' }));
  const whereBetweenResult = { count: countFn, sum: sumFn };
  const whereBetweenFn = vi.fn(() => whereBetweenResult);
  const whereResult = { whereBetween: whereBetweenFn };
  const whereFn = vi.fn(() => whereResult);
  const fromResult = { where: whereFn };
  const fromFn = vi.fn(() => fromResult);
  
  return { from: fromFn };
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDb: Database;

  beforeEach(() => {
    // Create mock database
    const queryBuilder = createMockQueryBuilder();
    
    mockDb = {
      getConnection: vi.fn(() => queryBuilder),
      healthCheck: vi.fn(),
      close: vi.fn(),
    } as any;

    service = new AnalyticsService(mockDb);
  });

  describe('getOperationalKPIs', () => {
    it('should return operational KPIs', async () => {
      const context = {
        userId: 'user-1',
        organizationId: 'org-1',
        roles: ['ADMIN'],
        permissions: ['analytics:read'],
        branchIds: [],
      };

      const options = {
        organizationId: 'org-1',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      };

      const kpis = await service.getOperationalKPIs(options, context);

      expect(kpis).toBeDefined();
      expect(kpis.visits).toBeDefined();
      expect(kpis.evvCompliance).toBeDefined();
      expect(kpis.revenueMetrics).toBeDefined();
      expect(kpis.staffing).toBeDefined();
      expect(kpis.clientMetrics).toBeDefined();
    });

    it('should throw error for unauthorized access', async () => {
      const context = {
        userId: 'user-1',
        organizationId: 'org-2',
        roles: ['ADMIN'],
        permissions: ['analytics:read'],
        branchIds: [],
      };

      const options = {
        organizationId: 'org-1',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
      };

      await expect(service.getOperationalKPIs(options, context)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('getComplianceAlerts', () => {
    it('should return compliance alerts', async () => {
      const context = {
        userId: 'user-1',
        organizationId: 'org-1',
        roles: ['ADMIN'],
        permissions: ['analytics:read'],
        branchIds: [],
      };

      const alerts = await service.getComplianceAlerts('org-1', undefined, context);

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should sort alerts by severity', async () => {
      const context = {
        userId: 'user-1',
        organizationId: 'org-1',
        roles: ['ADMIN'],
        permissions: ['analytics:read'],
        branchIds: [],
      };

      const alerts = await service.getComplianceAlerts('org-1', undefined, context);

      // Verify alerts are sorted by severity (CRITICAL first)
      for (let i = 0; i < alerts.length - 1; i++) {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, INFO: 4 };
        expect(severityOrder[alerts[i]!.severity]).toBeLessThanOrEqual(
          severityOrder[alerts[i + 1]!.severity]
        );
      }
    });
  });
});
