/**
 * Unit tests for FeatureFlagRepository
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FeatureFlagRepository } from '../../repository/feature-flag-repository.js';
import type { Database } from '../../db/connection.js';
import type { CreateFeatureFlagRequest, UpdateFeatureFlagRequest } from '../../types/feature-flags.js';

describe('FeatureFlagRepository', () => {
  let repository: FeatureFlagRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    } as unknown as Database;
    repository = new FeatureFlagRepository(mockDb);
  });

  describe('getFeatureFlagsByOrganizationId', () => {
    it('should return all feature flags for organization', async () => {
      const mockRows = [
        {
          id: 'flag-1',
          organization_id: 'org-id',
          feature_key: 'advanced_reporting',
          feature_name: 'Advanced Reporting',
          description: 'Advanced analytics and reporting',
          is_enabled: true,
          enabled_at: new Date(),
          enabled_by: 'user-id',
          configuration: { maxReports: 100 },
          limits: { dailyLimit: 50 },
          rollout_percentage: 100,
          rollout_user_ids: [],
          rollout_branch_ids: [],
          billing_tier: 'PREMIUM',
          monthly_cost: 99.99,
          requires_upgrade: false,
          depends_on: [],
          conflicts_with: [],
          created_at: new Date(),
          created_by: 'user-id',
          updated_at: new Date(),
          updated_by: 'user-id',
          version: 1,
        },
        {
          id: 'flag-2',
          organization_id: 'org-id',
          feature_key: 'mobile_app',
          feature_name: 'Mobile App Access',
          description: null,
          is_enabled: false,
          enabled_at: null,
          enabled_by: null,
          configuration: null,
          limits: null,
          rollout_percentage: 50,
          rollout_user_ids: ['user-1', 'user-2'],
          rollout_branch_ids: [],
          billing_tier: null,
          monthly_cost: null,
          requires_upgrade: true,
          depends_on: ['advanced_reporting'],
          conflicts_with: [],
          created_at: new Date(),
          created_by: 'user-id',
          updated_at: new Date(),
          updated_by: 'user-id',
          version: 1,
        },
      ];

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: mockRows,
        rowCount: 2,
      } as any);

      const result = await repository.getFeatureFlagsByOrganizationId('org-id');

      expect(result).toHaveLength(2);
      expect(result[0]?.featureKey).toBe('advanced_reporting');
      expect(result[0]?.isEnabled).toBe(true);
      expect(result[1]?.featureKey).toBe('mobile_app');
      expect(result[1]?.isEnabled).toBe(false);
      expect(result[1]?.rolloutUserIds).toEqual(['user-1', 'user-2']);
    });

    it('should return empty array when no flags exist', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await repository.getFeatureFlagsByOrganizationId('org-id');

      expect(result).toEqual([]);
    });
  });

  describe('getFeatureFlagByKey', () => {
    it('should return feature flag by key', async () => {
      const mockRow = {
        id: 'flag-id',
        organization_id: 'org-id',
        feature_key: 'advanced_reporting',
        feature_name: 'Advanced Reporting',
        description: 'Advanced analytics',
        is_enabled: true,
        enabled_at: new Date(),
        enabled_by: 'user-id',
        configuration: { maxReports: 100 },
        limits: { dailyLimit: 50 },
        rollout_percentage: 100,
        rollout_user_ids: [],
        rollout_branch_ids: [],
        billing_tier: 'PREMIUM',
        monthly_cost: 99.99,
        requires_upgrade: false,
        depends_on: [],
        conflicts_with: [],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      } as any);

      const result = await repository.getFeatureFlagByKey('org-id', 'advanced_reporting');

      expect(result).toBeDefined();
      expect(result?.featureKey).toBe('advanced_reporting');
      expect(result?.isEnabled).toBe(true);
      expect(result?.configuration).toEqual({ maxReports: 100 });
    });

    it('should return null when flag not found', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await repository.getFeatureFlagByKey('org-id', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createFeatureFlag', () => {
    it('should create feature flag with all fields', async () => {
      const request: CreateFeatureFlagRequest = {
        featureKey: 'new_feature',
        featureName: 'New Feature',
        description: 'A new feature',
        isEnabled: true,
        configuration: { setting: 'value' },
        limits: { maxUsers: 100 },
        rolloutPercentage: 50,
        rolloutUserIds: ['user-1'],
        rolloutBranchIds: ['branch-1'],
        billingTier: 'PREMIUM',
        monthlyCost: 49.99,
        requiresUpgrade: false,
        dependsOn: ['base_feature'],
        conflictsWith: ['old_feature'],
      };

      const createdRow = {
        id: 'new-flag-id',
        organization_id: 'org-id',
        feature_key: 'new_feature',
        feature_name: 'New Feature',
        description: 'A new feature',
        is_enabled: true,
        enabled_at: new Date(),
        enabled_by: 'user-id',
        configuration: { setting: 'value' },
        limits: { maxUsers: 100 },
        rollout_percentage: 50,
        rollout_user_ids: ['user-1'],
        rollout_branch_ids: ['branch-1'],
        billing_tier: 'PREMIUM',
        monthly_cost: 49.99,
        requires_upgrade: false,
        depends_on: ['base_feature'],
        conflicts_with: ['old_feature'],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [createdRow],
        rowCount: 1,
      } as any);

      const result = await repository.createFeatureFlag('org-id', request, 'user-id');

      expect(result.id).toBe('new-flag-id');
      expect(result.featureKey).toBe('new_feature');
      expect(result.isEnabled).toBe(true);
      expect(result.rolloutPercentage).toBe(50);
      expect(result.billingTier).toBe('PREMIUM');
    });

    it('should create feature flag with minimal fields', async () => {
      const request: CreateFeatureFlagRequest = {
        featureKey: 'simple_feature',
        featureName: 'Simple Feature',
      };

      const createdRow = {
        id: 'flag-id',
        organization_id: 'org-id',
        feature_key: 'simple_feature',
        feature_name: 'Simple Feature',
        description: null,
        is_enabled: false,
        enabled_at: null,
        enabled_by: null,
        configuration: null,
        limits: null,
        rollout_percentage: 100,
        rollout_user_ids: [],
        rollout_branch_ids: [],
        billing_tier: null,
        monthly_cost: null,
        requires_upgrade: false,
        depends_on: [],
        conflicts_with: [],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [createdRow],
        rowCount: 1,
      } as any);

      const result = await repository.createFeatureFlag('org-id', request, 'user-id');

      expect(result.featureKey).toBe('simple_feature');
      expect(result.isEnabled).toBe(false);
      expect(result.rolloutPercentage).toBe(100);
    });
  });

  describe('updateFeatureFlag', () => {
    it('should update feature flag', async () => {
      const request: UpdateFeatureFlagRequest = {
        isEnabled: true,
        rolloutPercentage: 75,
      };

      const updatedRow = {
        id: 'flag-id',
        organization_id: 'org-id',
        feature_key: 'test_feature',
        feature_name: 'Test Feature',
        description: null,
        is_enabled: true,
        enabled_at: new Date(),
        enabled_by: 'user-id',
        configuration: null,
        limits: null,
        rollout_percentage: 75,
        rollout_user_ids: [],
        rollout_branch_ids: [],
        billing_tier: null,
        monthly_cost: null,
        requires_upgrade: false,
        depends_on: [],
        conflicts_with: [],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 2,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [updatedRow],
        rowCount: 1,
      } as any);

      const result = await repository.updateFeatureFlag('flag-id', request, 'user-id');

      expect(result.isEnabled).toBe(true);
      expect(result.rolloutPercentage).toBe(75);
      expect(result.version).toBe(2);
    });

    it('should handle enabling feature', async () => {
      const request: UpdateFeatureFlagRequest = {
        isEnabled: true,
      };

      const updatedRow = {
        id: 'flag-id',
        organization_id: 'org-id',
        feature_key: 'test_feature',
        feature_name: 'Test Feature',
        description: null,
        is_enabled: true,
        enabled_at: new Date(),
        enabled_by: 'user-id',
        configuration: null,
        limits: null,
        rollout_percentage: 100,
        rollout_user_ids: [],
        rollout_branch_ids: [],
        billing_tier: null,
        monthly_cost: null,
        requires_upgrade: false,
        depends_on: [],
        conflicts_with: [],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 2,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [updatedRow],
        rowCount: 1,
      } as any);

      const result = await repository.updateFeatureFlag('flag-id', request, 'user-id');

      expect(result.isEnabled).toBe(true);
      expect(result.enabledBy).toBe('user-id');
      expect(result.enabledAt).toBeDefined();
    });
  });

  describe('deleteFeatureFlag', () => {
    it('should delete feature flag', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      await repository.deleteFeatureFlag('flag-id');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['flag-id']
      );
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true when feature is enabled at 100%', async () => {
      const mockFlag = {
        id: 'flag-id',
        organization_id: 'org-id',
        feature_key: 'test_feature',
        feature_name: 'Test Feature',
        description: null,
        is_enabled: true,
        enabled_at: new Date(),
        enabled_by: 'user-id',
        configuration: null,
        limits: null,
        rollout_percentage: 100,
        rollout_user_ids: [],
        rollout_branch_ids: [],
        billing_tier: null,
        monthly_cost: null,
        requires_upgrade: false,
        depends_on: [],
        conflicts_with: [],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [mockFlag],
        rowCount: 1,
      } as any);

      const result = await repository.isFeatureEnabled('org-id', 'test_feature');

      expect(result).toBe(true);
    });

    it('should return false when feature is disabled', async () => {
      const mockFlag = {
        id: 'flag-id',
        organization_id: 'org-id',
        feature_key: 'test_feature',
        feature_name: 'Test Feature',
        description: null,
        is_enabled: false,
        enabled_at: null,
        enabled_by: null,
        configuration: null,
        limits: null,
        rollout_percentage: 100,
        rollout_user_ids: [],
        rollout_branch_ids: [],
        billing_tier: null,
        monthly_cost: null,
        requires_upgrade: false,
        depends_on: [],
        conflicts_with: [],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [mockFlag],
        rowCount: 1,
      } as any);

      const result = await repository.isFeatureEnabled('org-id', 'test_feature');

      expect(result).toBe(false);
    });

    it('should return false when feature not found', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await repository.isFeatureEnabled('org-id', 'nonexistent');

      expect(result).toBe(false);
    });

    it('should check rollout user list', async () => {
      const mockFlag = {
        id: 'flag-id',
        organization_id: 'org-id',
        feature_key: 'test_feature',
        feature_name: 'Test Feature',
        description: null,
        is_enabled: true,
        enabled_at: new Date(),
        enabled_by: 'user-id',
        configuration: null,
        limits: null,
        rollout_percentage: 100,
        rollout_user_ids: ['user-1', 'user-2'],
        rollout_branch_ids: [],
        billing_tier: null,
        monthly_cost: null,
        requires_upgrade: false,
        depends_on: [],
        conflicts_with: [],
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [mockFlag],
        rowCount: 1,
      } as any);

      const resultInList = await repository.isFeatureEnabled('org-id', 'test_feature', 'user-1');
      const resultNotInList = await repository.isFeatureEnabled('org-id', 'test_feature', 'user-3');

      expect(resultInList).toBe(true);
      expect(resultNotInList).toBe(false);
    });
  });
});
