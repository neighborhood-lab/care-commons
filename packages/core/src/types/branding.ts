/**
 * @care-commons/core - Organization Branding Types
 *
 * White-label branding and customization types
 */

import { UUID, Entity } from './base';

/**
 * Organization branding configuration
 */
export interface OrganizationBranding extends Entity {
  organizationId: UUID;

  // Logo assets
  logoUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  logoSquareUrl: string | null;

  // Brand colors (hex format)
  primaryColor: string;
  secondaryColor: string | null;
  accentColor: string | null;
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;

  // Typography
  fontFamily: string;
  headingFontFamily: string | null;

  // Custom branding
  brandName: string | null;
  tagline: string | null;
  customCss: string | null;

  // Application customization
  themeOverrides: Record<string, unknown> | null;
  componentOverrides: Record<string, unknown> | null;

  // Legal and support
  termsOfServiceUrl: string | null;
  privacyPolicyUrl: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  supportUrl: string | null;

  // Email branding
  emailHeaderHtml: string | null;
  emailFooterHtml: string | null;
  emailFromName: string | null;

  // Status
  isActive: boolean;
}

/**
 * Create or update branding request
 */
export interface UpsertBrandingRequest {
  // Logo assets
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  logoSquareUrl?: string | null;

  // Brand colors (hex format with validation)
  primaryColor?: string;
  secondaryColor?: string | null;
  accentColor?: string | null;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  infoColor?: string;

  // Typography
  fontFamily?: string;
  headingFontFamily?: string | null;

  // Custom branding
  brandName?: string | null;
  tagline?: string | null;
  customCss?: string | null;

  // Application customization
  themeOverrides?: Record<string, unknown> | null;
  componentOverrides?: Record<string, unknown> | null;

  // Legal and support
  termsOfServiceUrl?: string | null;
  privacyPolicyUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  supportUrl?: string | null;

  // Email branding
  emailHeaderHtml?: string | null;
  emailFooterHtml?: string | null;
  emailFromName?: string | null;

  // Status
  isActive?: boolean;
}

/**
 * Brand colors for theme generation
 */
export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

/**
 * Compiled theme for frontend
 */
export interface CompiledTheme {
  colors: BrandColors;
  fontFamily: string;
  headingFontFamily?: string;
  customCss?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  brandName?: string;
  tagline?: string;
}
