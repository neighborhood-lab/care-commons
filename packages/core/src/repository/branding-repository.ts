/**
 * @care-commons/core - Branding Repository
 *
 * Data access layer for organization branding and white-labeling
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import {
  OrganizationBranding,
  UpdateBrandingRequest,
  ThemeOverrides,
} from '../types/white-label';

export interface IBrandingRepository {
  getBrandingByOrganizationId(organizationId: UUID): Promise<OrganizationBranding | null>;
  getBrandingByCustomDomain(domain: string): Promise<OrganizationBranding | null>;
  createBranding(organizationId: UUID, createdBy: UUID): Promise<OrganizationBranding>;
  updateBranding(
    organizationId: UUID,
    updates: UpdateBrandingRequest,
    updatedBy: UUID
  ): Promise<OrganizationBranding>;
  verifyCustomDomain(organizationId: UUID, updatedBy: UUID): Promise<void>;
  deleteBranding(organizationId: UUID, deletedBy: UUID): Promise<void>;
}

export class BrandingRepository implements IBrandingRepository {
  constructor(private db: Database) {}

  async getBrandingByOrganizationId(organizationId: UUID): Promise<OrganizationBranding | null> {
    const query = `
      SELECT
        id, organization_id, logo_url, favicon_url,
        primary_color, secondary_color, accent_color,
        brand_name, tagline, custom_domain, domain_verified, domain_verified_at,
        email_from_name, email_from_address, email_reply_to,
        email_header_color, email_footer_text,
        terms_of_service_url, privacy_policy_url, custom_terms_content,
        feature_flags, theme_overrides, settings,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
      FROM organization_branding
      WHERE organization_id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<BrandingRow>(query, [organizationId]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToBranding(row);
  }

  async getBrandingByCustomDomain(domain: string): Promise<OrganizationBranding | null> {
    const query = `
      SELECT
        id, organization_id, logo_url, favicon_url,
        primary_color, secondary_color, accent_color,
        brand_name, tagline, custom_domain, domain_verified, domain_verified_at,
        email_from_name, email_from_address, email_reply_to,
        email_header_color, email_footer_text,
        terms_of_service_url, privacy_policy_url, custom_terms_content,
        feature_flags, theme_overrides, settings,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
      FROM organization_branding
      WHERE custom_domain = $1 AND domain_verified = true AND deleted_at IS NULL
    `;

    const result = await this.db.query<BrandingRow>(query, [domain]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToBranding(row);
  }

  async createBranding(organizationId: UUID, createdBy: UUID): Promise<OrganizationBranding> {
    const query = `
      INSERT INTO organization_branding (
        organization_id, created_by, updated_by
      )
      VALUES ($1, $2, $2)
      RETURNING
        id, organization_id, logo_url, favicon_url,
        primary_color, secondary_color, accent_color,
        brand_name, tagline, custom_domain, domain_verified, domain_verified_at,
        email_from_name, email_from_address, email_reply_to,
        email_header_color, email_footer_text,
        terms_of_service_url, privacy_policy_url, custom_terms_content,
        feature_flags, theme_overrides, settings,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
    `;

    const result = await this.db.query<BrandingRow>(query, [organizationId, createdBy]);

    return this.mapRowToBranding(result.rows[0]!);
  }

  async updateBranding(
    organizationId: UUID,
    updates: UpdateBrandingRequest,
    updatedBy: UUID
  ): Promise<OrganizationBranding> {
    const updateFields: string[] = [];
    const values: unknown[] = [organizationId, updatedBy];
    let paramIndex = 3;

    if (updates.logoUrl !== undefined) {
      updateFields.push(`logo_url = $${paramIndex++}`);
      values.push(updates.logoUrl);
    }
    if (updates.faviconUrl !== undefined) {
      updateFields.push(`favicon_url = $${paramIndex++}`);
      values.push(updates.faviconUrl);
    }
    if (updates.primaryColor !== undefined) {
      updateFields.push(`primary_color = $${paramIndex++}`);
      values.push(updates.primaryColor);
    }
    if (updates.secondaryColor !== undefined) {
      updateFields.push(`secondary_color = $${paramIndex++}`);
      values.push(updates.secondaryColor);
    }
    if (updates.accentColor !== undefined) {
      updateFields.push(`accent_color = $${paramIndex++}`);
      values.push(updates.accentColor);
    }
    if (updates.brandName !== undefined) {
      updateFields.push(`brand_name = $${paramIndex++}`);
      values.push(updates.brandName);
    }
    if (updates.tagline !== undefined) {
      updateFields.push(`tagline = $${paramIndex++}`);
      values.push(updates.tagline);
    }
    if (updates.customDomain !== undefined) {
      updateFields.push(`custom_domain = $${paramIndex++}`);
      values.push(updates.customDomain);
      // Reset verification when domain changes
      updateFields.push(`domain_verified = false`);
      updateFields.push(`domain_verified_at = NULL`);
    }
    if (updates.emailFromName !== undefined) {
      updateFields.push(`email_from_name = $${paramIndex++}`);
      values.push(updates.emailFromName);
    }
    if (updates.emailFromAddress !== undefined) {
      updateFields.push(`email_from_address = $${paramIndex++}`);
      values.push(updates.emailFromAddress);
    }
    if (updates.emailReplyTo !== undefined) {
      updateFields.push(`email_reply_to = $${paramIndex++}`);
      values.push(updates.emailReplyTo);
    }
    if (updates.emailHeaderColor !== undefined) {
      updateFields.push(`email_header_color = $${paramIndex++}`);
      values.push(updates.emailHeaderColor);
    }
    if (updates.emailFooterText !== undefined) {
      updateFields.push(`email_footer_text = $${paramIndex++}`);
      values.push(updates.emailFooterText);
    }
    if (updates.termsOfServiceUrl !== undefined) {
      updateFields.push(`terms_of_service_url = $${paramIndex++}`);
      values.push(updates.termsOfServiceUrl);
    }
    if (updates.privacyPolicyUrl !== undefined) {
      updateFields.push(`privacy_policy_url = $${paramIndex++}`);
      values.push(updates.privacyPolicyUrl);
    }
    if (updates.customTermsContent !== undefined) {
      updateFields.push(`custom_terms_content = $${paramIndex++}`);
      values.push(updates.customTermsContent);
    }
    if (updates.featureFlags !== undefined) {
      updateFields.push(`feature_flags = $${paramIndex++}`);
      values.push(JSON.stringify(updates.featureFlags));
    }
    if (updates.themeOverrides !== undefined) {
      updateFields.push(`theme_overrides = $${paramIndex++}`);
      values.push(JSON.stringify(updates.themeOverrides));
    }
    if (updates.settings !== undefined) {
      updateFields.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(updates.settings));
    }

    if (updateFields.length === 0) {
      // No updates, just return current
      const current = await this.getBrandingByOrganizationId(organizationId);
      if (!current) {
        throw new Error('Branding not found');
      }
      return current;
    }

    const query = `
      UPDATE organization_branding
      SET ${updateFields.join(', ')}, updated_by = $2, updated_at = NOW()
      WHERE organization_id = $1 AND deleted_at IS NULL
      RETURNING
        id, organization_id, logo_url, favicon_url,
        primary_color, secondary_color, accent_color,
        brand_name, tagline, custom_domain, domain_verified, domain_verified_at,
        email_from_name, email_from_address, email_reply_to,
        email_header_color, email_footer_text,
        terms_of_service_url, privacy_policy_url, custom_terms_content,
        feature_flags, theme_overrides, settings,
        created_at, created_by, updated_at, updated_by,
        deleted_at, deleted_by
    `;

    const result = await this.db.query<BrandingRow>(query, values);

    const row = result.rows[0];
    if (!row) {
      throw new Error('Branding not found');
    }

    return this.mapRowToBranding(row);
  }

  async verifyCustomDomain(organizationId: UUID, updatedBy: UUID): Promise<void> {
    const query = `
      UPDATE organization_branding
      SET domain_verified = true,
          domain_verified_at = NOW(),
          updated_by = $2,
          updated_at = NOW()
      WHERE organization_id = $1 AND deleted_at IS NULL
    `;

    await this.db.query(query, [organizationId, updatedBy]);
  }

  async deleteBranding(organizationId: UUID, deletedBy: UUID): Promise<void> {
    const query = `
      UPDATE organization_branding
      SET deleted_at = NOW(),
          deleted_by = $2,
          updated_at = NOW(),
          updated_by = $2
      WHERE organization_id = $1 AND deleted_at IS NULL
    `;

    await this.db.query(query, [organizationId, deletedBy]);
  }

  private mapRowToBranding(row: BrandingRow): OrganizationBranding {
    return {
      id: row.id,
      organizationId: row.organization_id,
      logoUrl: row.logo_url,
      faviconUrl: row.favicon_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      brandName: row.brand_name,
      tagline: row.tagline,
      customDomain: row.custom_domain,
      domainVerified: row.domain_verified,
      domainVerifiedAt: row.domain_verified_at,
      emailFromName: row.email_from_name,
      emailFromAddress: row.email_from_address,
      emailReplyTo: row.email_reply_to,
      emailHeaderColor: row.email_header_color,
      emailFooterText: row.email_footer_text,
      termsOfServiceUrl: row.terms_of_service_url,
      privacyPolicyUrl: row.privacy_policy_url,
      customTermsContent: row.custom_terms_content,
      featureFlags: row.feature_flags as Record<string, boolean>,
      themeOverrides: row.theme_overrides as ThemeOverrides,
      settings: row.settings as Record<string, unknown>,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: 1, // Not tracking version for branding
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
    };
  }
}

interface BrandingRow extends Record<string, unknown> {
  id: string;
  organization_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  brand_name: string | null;
  tagline: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  domain_verified_at: Date | null;
  email_from_name: string | null;
  email_from_address: string | null;
  email_reply_to: string | null;
  email_header_color: string;
  email_footer_text: string | null;
  terms_of_service_url: string | null;
  privacy_policy_url: string | null;
  custom_terms_content: string | null;
  feature_flags: unknown;
  theme_overrides: unknown;
  settings: unknown;
  created_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
  deleted_at: Date | null;
  deleted_by: string | null;
}
