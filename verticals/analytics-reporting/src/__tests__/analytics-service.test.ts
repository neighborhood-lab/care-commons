/**
 * Analytics Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../service/analytics-service';
import { Database } from '@care-commons/core';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockDb: Database;

  beforeEach(() => {
    // Create mock database
    /* eslint-disable sonarjs/no-nested-functions */
    mockDb = {
      getConnection: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            whereBetween: vi.fn(() => ({
              count: vi.fn(() => Promise.resolve({ count: '10' })),
              sum: vi.fn(() => Promise.resolve({ total: '100' })),
            })),
          })),
        })),
      })),
      healthCheck: vi.fn(),
      close: vi.fn(),
    } as any;
    /* eslint-enable sonarjs/no-nested-functions */

    service = new AnalyticsService(mockDb);
  });

  describe('getOperationalKPIs', () => {
    it('should return operational KPIs', async () => {
      const context = {
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'ADMIN',
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
        role: 'ADMIN',
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
        role: 'ADMIN',
      };

      const alerts = await service.getComplianceAlerts('org-1', undefined, context);

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should sort alerts by severity', async () => {
      const context = {
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'ADMIN',
      };

      const alerts = await service.getComplianceAlerts('org-1', undefined, context);

      // Verify alerts are sorted by severity (CRITICAL first)
      for (let i = 0; i < alerts.length - 1; i++) {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, WARNING: 3, INFO: 4 };
        expect(severityOrder[alerts[i].severity]).toBeLessThanOrEqual(
          severityOrder[alerts[i + 1].severity]
        );
      }
    });
  });
});
