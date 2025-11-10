/**
 * Unit tests for WhiteLabelService
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhiteLabelService } from '../../service/white-label.service';
import type { BrandingRepository } from '../../repository/branding-repository';
import type { FeatureFlagRepository } from '../../repository/feature-flag-repository';
import type { UpsertBrandingRequest } from '../../types/branding';
import { BillingTier } from '../../types/feature-flags';

describe('WhiteLabelService', () => {
  let service: WhiteLabelService;
  let mockBrandingRepo: BrandingRepository;
  let mockFeatureFlagRepo: FeatureFlagRepository;

  beforeEach(() => {
    mockBrandingRepo = {
      getBrandingByOrganizationId: vi.fn(),
      upsertBranding: vi.fn(),
      deleteBranding: vi.fn(),
    } as any;

    mockFeatureFlagRepo = {
      getFeatureFlagsByOrganizationId: vi.fn(),
      getFeatureFlagByKey: vi.fn(),
      createFeatureFlag: vi.fn(),
      updateFeatureFlag: vi.fn(),
      deleteFeatureFlag: vi.fn(),
      isFeatureEnabled: vi.fn(),
    } as any;

    service = new WhiteLabelService(mockBrandingRepo, mockFeatureFlagRepo);
  });

  describe('getBranding', () => {
    it('should return branding from repository', async () => {
      const mockBranding = {
        id: 'branding-id',
        organizationId: 'org-id',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#0ea5e9',
        secondaryColor: null,
        accentColor: null,
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444',
        infoColor: '#3b82f6',
        fontFamily: 'Inter',
        headingFontFamily: null,
        brandName: null,
        tagline: null,
        customCss: null,
        themeOverrides: null,
        componentOverrides: null,
        logoDarkUrl: null,
        faviconUrl: null,
        logoSquareUrl: null,
        termsOfServiceUrl: null,
        privacyPolicyUrl: null,
        supportEmail: null,
        supportPhone: null,
        supportUrl: null,
        emailHeaderHtml: null,
        emailFooterHtml: null,
        emailFromName: null,
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      vi.mocked(mockBrandingRepo.getBrandingByOrganizationId).mockResolvedValue(mockBranding);

      const result = await service.getBranding('org-id');

      expect(result).toEqual(mockBranding);
      expect(mockBrandingRepo.getBrandingByOrganizationId).toHaveBeenCalledWith('org-id');
    });

    it('should return null when branding not found', async () => {
      vi.mocked(mockBrandingRepo.getBrandingByOrganizationId).mockResolvedValue(null);

      const result = await service.getBranding('org-id');

      expect(result).toBeNull();
    });
  });

  describe('upsertBranding', () => {
    it('should validate and upsert branding', async () => {
      const request: UpsertBrandingRequest = {
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#0ea5e9',
        brandName: 'Test Agency',
      };

      const savedBranding = {
        id: 'branding-id',
        organizationId: 'org-id',
        logoUrl: request.logoUrl ?? null,
        primaryColor: request.primaryColor ?? '#0ea5e9',
        brandName: request.brandName ?? null,
        secondaryColor: null,
        accentColor: null,
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444',
        infoColor: '#3b82f6',
        fontFamily: 'Inter',
        headingFontFamily: null,
        tagline: null,
        customCss: null,
        themeOverrides: null,
        componentOverrides: null,
        logoDarkUrl: null,
        faviconUrl: null,
        logoSquareUrl: null,
        termsOfServiceUrl: null,
        privacyPolicyUrl: null,
        supportEmail: null,
        supportPhone: null,
        supportUrl: null,
        emailHeaderHtml: null,
        emailFooterHtml: null,
        emailFromName: null,
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      vi.mocked(mockBrandingRepo.upsertBranding).mockResolvedValue(savedBranding);

      const result = await service.upsertBranding('org-id', request, 'user-id');

      expect(result).toEqual(savedBranding);
      expect(mockBrandingRepo.upsertBranding).toHaveBeenCalledWith('org-id', request, 'user-id');
    });

    it('should validate hex colors', async () => {
      const invalidRequest: UpsertBrandingRequest = {
        primaryColor: 'invalid-color',
      };

      await expect(
        service.upsertBranding('org-id', invalidRequest, 'user-id')
      ).rejects.toThrow(/Invalid hex color/);
    });

    it('should accept valid hex colors', async () => {
      const validColors: UpsertBrandingRequest = {
        primaryColor: '#0ea5e9',
        secondaryColor: '#10b981',
        accentColor: '#f59e0b',
      };

      vi.mocked(mockBrandingRepo.upsertBranding).mockResolvedValue({
        id: 'branding-id',
        organizationId: 'org-id',
        primaryColor: validColors.primaryColor ?? '#0ea5e9',
        secondaryColor: validColors.secondaryColor ?? null,
        accentColor: validColors.accentColor ?? null,
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444',
        infoColor: '#3b82f6',
        fontFamily: 'Inter',
        headingFontFamily: null,
        brandName: null,
        tagline: null,
        customCss: null,
        themeOverrides: null,
        componentOverrides: null,
        logoUrl: null,
        logoDarkUrl: null,
        faviconUrl: null,
        logoSquareUrl: null,
        termsOfServiceUrl: null,
        privacyPolicyUrl: null,
        supportEmail: null,
        supportPhone: null,
        supportUrl: null,
        emailHeaderHtml: null,
        emailFooterHtml: null,
        emailFromName: null,
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      });

      await expect(
        service.upsertBranding('org-id', validColors, 'user-id')
      ).resolves.not.toThrow();
    });

    it('should allow null for optional color fields', async () => {
      const request: UpsertBrandingRequest = {
        secondaryColor: null,
        accentColor: null,
      };

      vi.mocked(mockBrandingRepo.upsertBranding).mockResolvedValue({
        id: 'branding-id',
        organizationId: 'org-id',
        primaryColor: '#0ea5e9',
        secondaryColor: null,
        accentColor: null,
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444',
        infoColor: '#3b82f6',
        fontFamily: 'Inter',
        headingFontFamily: null,
        brandName: null,
        tagline: null,
        customCss: null,
        themeOverrides: null,
        componentOverrides: null,
        logoUrl: null,
        logoDarkUrl: null,
        faviconUrl: null,
        logoSquareUrl: null,
        termsOfServiceUrl: null,
        privacyPolicyUrl: null,
        supportEmail: null,
        supportPhone: null,
        supportUrl: null,
        emailHeaderHtml: null,
        emailFooterHtml: null,
        emailFromName: null,
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      });

      await expect(
        service.upsertBranding('org-id', request, 'user-id')
      ).resolves.not.toThrow();
    });
  });

  describe('getCompiledTheme', () => {
    it('should return compiled theme from branding', async () => {
      const mockBranding = {
        id: 'branding-id',
        organizationId: 'org-id',
        logoUrl: 'https://example.com/logo.png',
        logoDarkUrl: 'https://example.com/logo-dark.png',
        faviconUrl: 'https://example.com/favicon.ico',
        logoSquareUrl: null,
        primaryColor: '#0ea5e9',
        secondaryColor: '#10b981',
        accentColor: '#f59e0b',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444',
        infoColor: '#3b82f6',
        fontFamily: 'Inter',
        headingFontFamily: 'Montserrat',
        brandName: 'Test Agency',
        tagline: 'Quality Care',
        customCss: '.custom { color: red; }',
        themeOverrides: null,
        componentOverrides: null,
        termsOfServiceUrl: null,
        privacyPolicyUrl: null,
        supportEmail: null,
        supportPhone: null,
        supportUrl: null,
        emailHeaderHtml: null,
        emailFooterHtml: null,
        emailFromName: null,
        isActive: true,
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      vi.mocked(mockBrandingRepo.getBrandingByOrganizationId).mockResolvedValue(mockBranding);

      const result = await service.getCompiledTheme('org-id');

      expect(result.colors.primary).toBe('#0ea5e9');
      expect(result.colors.secondary).toBe('#10b981');
      expect(result.colors.accent).toBe('#f59e0b');
      expect(result.fontFamily).toBe('Inter');
      expect(result.headingFontFamily).toBe('Montserrat');
      expect(result.customCss).toBe('.custom { color: red; }');
      expect(result.logoUrl).toBe('https://example.com/logo.png');
      expect(result.logoDarkUrl).toBe('https://example.com/logo-dark.png');
      expect(result.faviconUrl).toBe('https://example.com/favicon.ico');
      expect(result.brandName).toBe('Test Agency');
      expect(result.tagline).toBe('Quality Care');
    });

    it('should return default theme when branding not found', async () => {
      vi.mocked(mockBrandingRepo.getBrandingByOrganizationId).mockResolvedValue(null);

      const result = await service.getCompiledTheme('org-id');

      expect(result.colors.primary).toBe('#0ea5e9');
      expect(result.colors.success).toBe('#10b981');
      expect(result.fontFamily).toBe('Inter, system-ui, sans-serif');
      expect(result.logoUrl).toBeUndefined();
    });
  });

  describe('getFeatureFlags', () => {
    it('should return all feature flags', async () => {
      const mockFlags = [
        {
          id: 'flag-1',
          organizationId: 'org-id',
          featureKey: 'advanced_reporting',
          featureName: 'Advanced Reporting',
          description: null,
          isEnabled: true,
          enabledAt: new Date(),
          enabledBy: 'user-id',
          configuration: null,
          limits: null,
          rolloutPercentage: 100,
          rolloutUserIds: [],
          rolloutBranchIds: [],
          billingTier: null,
          monthlyCost: null,
          requiresUpgrade: false,
          dependsOn: [],
          conflictsWith: [],
          createdAt: new Date(),
          createdBy: 'user-id',
          updatedAt: new Date(),
          updatedBy: 'user-id',
          version: 1,
        },
      ];

      vi.mocked(mockFeatureFlagRepo.getFeatureFlagsByOrganizationId).mockResolvedValue(mockFlags);

      const result = await service.getFeatureFlags('org-id');

      expect(result).toEqual(mockFlags);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should check if feature is enabled', async () => {
      vi.mocked(mockFeatureFlagRepo.isFeatureEnabled).mockResolvedValue(true);

      const result = await service.isFeatureEnabled('org-id', 'test_feature', 'user-id');

      expect(result).toBe(true);
      expect(mockFeatureFlagRepo.isFeatureEnabled).toHaveBeenCalledWith('org-id', 'test_feature', 'user-id');
    });
  });

  describe('evaluateFeature', () => {
    it('should return not found when feature does not exist', async () => {
      vi.mocked(mockFeatureFlagRepo.getFeatureFlagByKey).mockResolvedValue(null);

      const result = await service.evaluateFeature('org-id', 'nonexistent');

      expect(result.featureKey).toBe('nonexistent');
      expect(result.isEnabled).toBe(false);
      expect(result.reason).toBe('Feature flag not found');
    });

    it('should return disabled when feature is disabled', async () => {
      const mockFlag = {
        id: 'flag-id',
        organizationId: 'org-id',
        featureKey: 'test_feature',
        featureName: 'Test Feature',
        description: null,
        isEnabled: false,
        enabledAt: null,
        enabledBy: null,
        configuration: null,
        limits: null,
        rolloutPercentage: 100,
        rolloutUserIds: [],
        rolloutBranchIds: [],
        billingTier: null,
        monthlyCost: null,
        requiresUpgrade: false,
        dependsOn: [],
        conflictsWith: [],
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      vi.mocked(mockFeatureFlagRepo.getFeatureFlagByKey).mockResolvedValue(mockFlag);

      const result = await service.evaluateFeature('org-id', 'test_feature');

      expect(result.isEnabled).toBe(false);
      expect(result.reason).toBe('Feature is disabled');
    });

    it('should return enabled when feature is fully enabled', async () => {
      const mockFlag = {
        id: 'flag-id',
        organizationId: 'org-id',
        featureKey: 'test_feature',
        featureName: 'Test Feature',
        description: null,
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy: 'user-id',
        configuration: { setting: 'value' },
        limits: { maxUsers: 100 },
        rolloutPercentage: 100,
        rolloutUserIds: [],
        rolloutBranchIds: [],
        billingTier: 'PREMIUM' as BillingTier,
        monthlyCost: 99.99,
        requiresUpgrade: false,
        dependsOn: [],
        conflictsWith: [],
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      vi.mocked(mockFeatureFlagRepo.getFeatureFlagByKey).mockResolvedValue(mockFlag);

      const result = await service.evaluateFeature('org-id', 'test_feature');

      expect(result.isEnabled).toBe(true);
      expect(result.configuration).toEqual({ setting: 'value' });
      expect(result.limits).toEqual({ maxUsers: 100 });
      // Note: billingTier is part of FeatureFlag entity, not FeatureFlagEvaluation
    });

    it('should handle rollout percentage', async () => {
      const mockFlag = {
        id: 'flag-id',
        organizationId: 'org-id',
        featureKey: 'test_feature',
        featureName: 'Test Feature',
        description: null,
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy: 'user-id',
        configuration: null,
        limits: null,
        rolloutPercentage: 50,
        rolloutUserIds: [],
        rolloutBranchIds: [],
        billingTier: null,
        monthlyCost: null,
        requiresUpgrade: false,
        dependsOn: [],
        conflictsWith: [],
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      vi.mocked(mockFeatureFlagRepo.getFeatureFlagByKey).mockResolvedValue(mockFlag);
      vi.mocked(mockFeatureFlagRepo.isFeatureEnabled).mockResolvedValue(false);

      const result = await service.evaluateFeature('org-id', 'test_feature', 'user-id');

      expect(result.isEnabled).toBe(false);
      expect(result.reason).toBe('User not in rollout group');
    });

    it('should check feature dependencies', async () => {
      const mockFlag = {
        id: 'flag-id',
        organizationId: 'org-id',
        featureKey: 'advanced_feature',
        featureName: 'Advanced Feature',
        description: null,
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy: 'user-id',
        configuration: null,
        limits: null,
        rolloutPercentage: 100,
        rolloutUserIds: [],
        rolloutBranchIds: [],
        billingTier: null,
        monthlyCost: null,
        requiresUpgrade: false,
        dependsOn: ['base_feature'],
        conflictsWith: [],
        createdAt: new Date(),
        createdBy: 'user-id',
        updatedAt: new Date(),
        updatedBy: 'user-id',
        version: 1,
      };

      vi.mocked(mockFeatureFlagRepo.getFeatureFlagByKey).mockResolvedValue(mockFlag);
      vi.mocked(mockFeatureFlagRepo.isFeatureEnabled)
        .mockResolvedValueOnce(false); // base_feature is disabled

      const result = await service.evaluateFeature('org-id', 'advanced_feature');

      expect(result.isEnabled).toBe(false);
      expect(result.reason).toContain('Depends on');
    });
  });
});
