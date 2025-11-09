/**
 * @care-commons/core - White Label Service
 *
 * Business logic for multi-agency white-labeling
 */

import { UUID } from '../types/base';
import {
  OrganizationBranding,
  UpsertBrandingRequest,
  CompiledTheme,
} from '../types/branding';
import { FeatureFlag, FeatureFlagEvaluation } from '../types/feature-flags';
import { BrandingRepository } from '../repository/branding-repository';
import { FeatureFlagRepository } from '../repository/feature-flag-repository';
import { UnauthorizedError } from '../errors/app-errors';

export interface IWhiteLabelService {
  getBranding(organizationId: UUID): Promise<OrganizationBranding | null>;
  upsertBranding(
    organizationId: UUID,
    branding: UpsertBrandingRequest,
    userId: UUID
  ): Promise<OrganizationBranding>;
  getCompiledTheme(organizationId: UUID): Promise<CompiledTheme>;

  getFeatureFlags(organizationId: UUID): Promise<FeatureFlag[]>;
  isFeatureEnabled(organizationId: UUID, featureKey: string, userId?: UUID): Promise<boolean>;
  evaluateFeature(
    organizationId: UUID,
    featureKey: string,
    userId?: UUID
  ): Promise<FeatureFlagEvaluation>;

  requireFeature(organizationId: UUID, featureKey: string, userId?: UUID): Promise<void>;
}

export class WhiteLabelService implements IWhiteLabelService {
  constructor(
    private brandingRepository: BrandingRepository,
    private featureFlagRepository: FeatureFlagRepository
  ) {}

  async getBranding(organizationId: UUID): Promise<OrganizationBranding | null> {
    return this.brandingRepository.getBrandingByOrganizationId(organizationId);
  }

  async upsertBranding(
    organizationId: UUID,
    branding: UpsertBrandingRequest,
    userId: UUID
  ): Promise<OrganizationBranding> {
    // Validate hex colors if provided
    if (branding.primaryColor) {
      this.validateHexColor(branding.primaryColor, 'primaryColor');
    }
    if (branding.secondaryColor) {
      this.validateHexColor(branding.secondaryColor, 'secondaryColor');
    }
    if (branding.accentColor) {
      this.validateHexColor(branding.accentColor, 'accentColor');
    }

    return this.brandingRepository.upsertBranding(organizationId, branding, userId);
  }

  async getCompiledTheme(organizationId: UUID): Promise<CompiledTheme> {
    const branding = await this.getBranding(organizationId);

    if (!branding) {
      // Return default theme
      return {
        colors: {
          primary: '#0ea5e9',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
        fontFamily: 'Inter, system-ui, sans-serif',
      };
    }

    return {
      colors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor ?? undefined,
        accent: branding.accentColor ?? undefined,
        success: branding.successColor,
        warning: branding.warningColor,
        error: branding.errorColor,
        info: branding.infoColor,
      },
      fontFamily: branding.fontFamily,
      headingFontFamily: branding.headingFontFamily ?? undefined,
      customCss: branding.customCss ?? undefined,
      logoUrl: branding.logoUrl ?? undefined,
      logoDarkUrl: branding.logoDarkUrl ?? undefined,
      faviconUrl: branding.faviconUrl ?? undefined,
      brandName: branding.brandName ?? undefined,
      tagline: branding.tagline ?? undefined,
    };
  }

  async getFeatureFlags(organizationId: UUID): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.getFeatureFlagsByOrganizationId(organizationId);
  }

  async isFeatureEnabled(
    organizationId: UUID,
    featureKey: string,
    userId?: UUID
  ): Promise<boolean> {
    return this.featureFlagRepository.isFeatureEnabled(organizationId, featureKey, userId);
  }

  async evaluateFeature(
    organizationId: UUID,
    featureKey: string,
    userId?: UUID
  ): Promise<FeatureFlagEvaluation> {
    const flag = await this.featureFlagRepository.getFeatureFlagByKey(
      organizationId,
      featureKey
    );

    if (!flag) {
      return {
        featureKey,
        isEnabled: false,
        reason: 'Feature flag not found',
      };
    }

    if (!flag.isEnabled) {
      return {
        featureKey,
        isEnabled: false,
        reason: 'Feature is disabled',
      };
    }

    // Check rollout
    if (flag.rolloutPercentage < 100 && userId) {
      const isInRollout = await this.featureFlagRepository.isFeatureEnabled(
        organizationId,
        featureKey,
        userId
      );
      if (!isInRollout) {
        return {
          featureKey,
          isEnabled: false,
          reason: 'User not in rollout group',
        };
      }
    }

    // Check dependencies
    if (flag.dependsOn.length > 0) {
      for (const dependencyKey of flag.dependsOn) {
        const isDependencyEnabled = await this.isFeatureEnabled(
          organizationId,
          dependencyKey,
          userId
        );
        if (!isDependencyEnabled) {
          return {
            featureKey,
            isEnabled: false,
            reason: `Depends on feature '${dependencyKey}' which is not enabled`,
          };
        }
      }
    }

    return {
      featureKey,
      isEnabled: true,
      reason: 'Feature is enabled',
      configuration: flag.configuration ?? undefined,
      limits: flag.limits ?? undefined,
    };
  }

  async requireFeature(organizationId: UUID, featureKey: string, userId?: UUID): Promise<void> {
    const evaluation = await this.evaluateFeature(organizationId, featureKey, userId);

    if (!evaluation.isEnabled) {
      throw new UnauthorizedError(
        `Feature '${featureKey}' is not available: ${evaluation.reason}`
      );
    }
  }

  private validateHexColor(color: string, fieldName: string): void {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexColorRegex.test(color)) {
      throw new Error(
        `Invalid hex color for ${fieldName}: ${color}. Expected format: #RRGGBB`
      );
    }
  }
}
