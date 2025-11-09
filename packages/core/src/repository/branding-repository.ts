/**
 * @care-commons/core - Branding Repository
 *
 * Data access layer for organization white-label branding
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import { OrganizationBranding, UpsertBrandingRequest } from '../types/branding';

export interface IBrandingRepository {
  getBrandingByOrganizationId(organizationId: UUID): Promise<OrganizationBranding | null>;
  upsertBranding(
    organizationId: UUID,
    branding: UpsertBrandingRequest,
    userId: UUID
  ): Promise<OrganizationBranding>;
  deleteBranding(organizationId: UUID): Promise<void>;
}

export class BrandingRepository implements IBrandingRepository {
  constructor(private db: Database) {}

  async getBrandingByOrganizationId(organizationId: UUID): Promise<OrganizationBranding | null> {
    const query = `
      SELECT
        id, organization_id, logo_url, logo_dark_url, favicon_url, logo_square_url,
        primary_color, secondary_color, accent_color, success_color, warning_color,
        error_color, info_color, font_family, heading_font_family, brand_name,
        tagline, custom_css, theme_overrides, component_overrides,
        terms_of_service_url, privacy_policy_url, support_email, support_phone,
        support_url, email_header_html, email_footer_html, email_from_name,
        is_active, created_at, created_by, updated_at, updated_by, version
      FROM organization_branding
      WHERE organization_id = $1 AND is_active = true
    `;

    const result = await this.db.query<{
      id: string;
      organization_id: string;
      logo_url: string | null;
      logo_dark_url: string | null;
      favicon_url: string | null;
      logo_square_url: string | null;
      primary_color: string;
      secondary_color: string | null;
      accent_color: string | null;
      success_color: string;
      warning_color: string;
      error_color: string;
      info_color: string;
      font_family: string;
      heading_font_family: string | null;
      brand_name: string | null;
      tagline: string | null;
      custom_css: string | null;
      theme_overrides: Record<string, unknown> | null;
      component_overrides: Record<string, unknown> | null;
      terms_of_service_url: string | null;
      privacy_policy_url: string | null;
      support_email: string | null;
      support_phone: string | null;
      support_url: string | null;
      email_header_html: string | null;
      email_footer_html: string | null;
      email_from_name: string | null;
      is_active: boolean;
      created_at: Date;
      created_by: string;
      updated_at: Date;
      updated_by: string;
      version: number;
    }>(query, [organizationId]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return this.mapRowToBranding(row);
  }

  async upsertBranding(
    organizationId: UUID,
    branding: UpsertBrandingRequest,
    userId: UUID
  ): Promise<OrganizationBranding> {
    // Check if branding exists
    const existing = await this.getBrandingByOrganizationId(organizationId);

    if (existing !== null) {
      // Update existing branding
      const updateFields: string[] = [];
      const values: unknown[] = [organizationId];
      let paramIndex = 2;

      // Build dynamic update query
      for (const [key, value] of Object.entries(branding)) {
        const snakeKey = this.camelToSnake(key);
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }

      updateFields.push(`updated_by = $${paramIndex}`);
      values.push(userId);
      paramIndex++;

      updateFields.push(`version = version + 1`);

      const query = `
        UPDATE organization_branding
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE organization_id = $1
        RETURNING
          id, organization_id, logo_url, logo_dark_url, favicon_url, logo_square_url,
          primary_color, secondary_color, accent_color, success_color, warning_color,
          error_color, info_color, font_family, heading_font_family, brand_name,
          tagline, custom_css, theme_overrides, component_overrides,
          terms_of_service_url, privacy_policy_url, support_email, support_phone,
          support_url, email_header_html, email_footer_html, email_from_name,
          is_active, created_at, created_by, updated_at, updated_by, version
      `;

      const result = await this.db.query<{
        id: string;
        organization_id: string;
        logo_url: string | null;
        logo_dark_url: string | null;
        favicon_url: string | null;
        logo_square_url: string | null;
        primary_color: string;
        secondary_color: string | null;
        accent_color: string | null;
        success_color: string;
        warning_color: string;
        error_color: string;
        info_color: string;
        font_family: string;
        heading_font_family: string | null;
        brand_name: string | null;
        tagline: string | null;
        custom_css: string | null;
        theme_overrides: Record<string, unknown> | null;
        component_overrides: Record<string, unknown> | null;
        terms_of_service_url: string | null;
        privacy_policy_url: string | null;
        support_email: string | null;
        support_phone: string | null;
        support_url: string | null;
        email_header_html: string | null;
        email_footer_html: string | null;
        email_from_name: string | null;
        is_active: boolean;
        created_at: Date;
        created_by: string;
        updated_at: Date;
        updated_by: string;
        version: number;
      }>(query, values);

      return this.mapRowToBranding(result.rows[0]!);
    } else {
      // Insert new branding
      const query = `
        INSERT INTO organization_branding (
          organization_id, logo_url, logo_dark_url, favicon_url, logo_square_url,
          primary_color, secondary_color, accent_color, success_color, warning_color,
          error_color, info_color, font_family, heading_font_family, brand_name,
          tagline, custom_css, theme_overrides, component_overrides,
          terms_of_service_url, privacy_policy_url, support_email, support_phone,
          support_url, email_header_html, email_footer_html, email_from_name,
          is_active, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $29
        )
        RETURNING
          id, organization_id, logo_url, logo_dark_url, favicon_url, logo_square_url,
          primary_color, secondary_color, accent_color, success_color, warning_color,
          error_color, info_color, font_family, heading_font_family, brand_name,
          tagline, custom_css, theme_overrides, component_overrides,
          terms_of_service_url, privacy_policy_url, support_email, support_phone,
          support_url, email_header_html, email_footer_html, email_from_name,
          is_active, created_at, created_by, updated_at, updated_by, version
      `;

      const result = await this.db.query<{
        id: string;
        organization_id: string;
        logo_url: string | null;
        logo_dark_url: string | null;
        favicon_url: string | null;
        logo_square_url: string | null;
        primary_color: string;
        secondary_color: string | null;
        accent_color: string | null;
        success_color: string;
        warning_color: string;
        error_color: string;
        info_color: string;
        font_family: string;
        heading_font_family: string | null;
        brand_name: string | null;
        tagline: string | null;
        custom_css: string | null;
        theme_overrides: Record<string, unknown> | null;
        component_overrides: Record<string, unknown> | null;
        terms_of_service_url: string | null;
        privacy_policy_url: string | null;
        support_email: string | null;
        support_phone: string | null;
        support_url: string | null;
        email_header_html: string | null;
        email_footer_html: string | null;
        email_from_name: string | null;
        is_active: boolean;
        created_at: Date;
        created_by: string;
        updated_at: Date;
        updated_by: string;
        version: number;
      }>(query, [
        organizationId,
        branding.logoUrl ?? null,
        branding.logoDarkUrl ?? null,
        branding.faviconUrl ?? null,
        branding.logoSquareUrl ?? null,
        branding.primaryColor ?? '#0ea5e9',
        branding.secondaryColor ?? null,
        branding.accentColor ?? null,
        branding.successColor ?? '#10b981',
        branding.warningColor ?? '#f59e0b',
        branding.errorColor ?? '#ef4444',
        branding.infoColor ?? '#3b82f6',
        branding.fontFamily ?? 'Inter, system-ui, sans-serif',
        branding.headingFontFamily ?? null,
        branding.brandName ?? null,
        branding.tagline ?? null,
        branding.customCss ?? null,
        branding.themeOverrides !== undefined ? JSON.stringify(branding.themeOverrides) : null,
        branding.componentOverrides !== undefined ? JSON.stringify(branding.componentOverrides) : null,
        branding.termsOfServiceUrl ?? null,
        branding.privacyPolicyUrl ?? null,
        branding.supportEmail ?? null,
        branding.supportPhone ?? null,
        branding.supportUrl ?? null,
        branding.emailHeaderHtml ?? null,
        branding.emailFooterHtml ?? null,
        branding.emailFromName ?? null,
        branding.isActive ?? true,
        userId,
      ]);

      return this.mapRowToBranding(result.rows[0]!);
    }
  }

  async deleteBranding(organizationId: UUID): Promise<void> {
    const query = `
      DELETE FROM organization_branding
      WHERE organization_id = $1
    `;

    await this.db.query(query, [organizationId]);
  }

  private mapRowToBranding(row: {
    id: string;
    organization_id: string;
    logo_url: string | null;
    logo_dark_url: string | null;
    favicon_url: string | null;
    logo_square_url: string | null;
    primary_color: string;
    secondary_color: string | null;
    accent_color: string | null;
    success_color: string;
    warning_color: string;
    error_color: string;
    info_color: string;
    font_family: string;
    heading_font_family: string | null;
    brand_name: string | null;
    tagline: string | null;
    custom_css: string | null;
    theme_overrides: Record<string, unknown> | null;
    component_overrides: Record<string, unknown> | null;
    terms_of_service_url: string | null;
    privacy_policy_url: string | null;
    support_email: string | null;
    support_phone: string | null;
    support_url: string | null;
    email_header_html: string | null;
    email_footer_html: string | null;
    email_from_name: string | null;
    is_active: boolean;
    created_at: Date;
    created_by: string;
    updated_at: Date;
    updated_by: string;
    version: number;
  }): OrganizationBranding {
    return {
      id: row.id,
      organizationId: row.organization_id,
      logoUrl: row.logo_url,
      logoDarkUrl: row.logo_dark_url,
      faviconUrl: row.favicon_url,
      logoSquareUrl: row.logo_square_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      successColor: row.success_color,
      warningColor: row.warning_color,
      errorColor: row.error_color,
      infoColor: row.info_color,
      fontFamily: row.font_family,
      headingFontFamily: row.heading_font_family,
      brandName: row.brand_name,
      tagline: row.tagline,
      customCss: row.custom_css,
      themeOverrides: row.theme_overrides,
      componentOverrides: row.component_overrides,
      termsOfServiceUrl: row.terms_of_service_url,
      privacyPolicyUrl: row.privacy_policy_url,
      supportEmail: row.support_email,
      supportPhone: row.support_phone,
      supportUrl: row.support_url,
      emailHeaderHtml: row.email_header_html,
      emailFooterHtml: row.email_footer_html,
      emailFromName: row.email_from_name,
      isActive: row.is_active,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      version: row.version,
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
