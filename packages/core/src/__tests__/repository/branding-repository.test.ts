/**
 * Unit tests for BrandingRepository
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrandingRepository } from '../../repository/branding-repository.js';
import type { Database } from '../../db/connection.js';
import type { UpsertBrandingRequest } from '../../types/branding.js';

describe('BrandingRepository', () => {
  let repository: BrandingRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    } as unknown as Database;
    repository = new BrandingRepository(mockDb);
  });

  describe('getBrandingByOrganizationId', () => {
    it('should return branding when it exists', async () => {
      const mockRow = {
        id: 'branding-id',
        organization_id: 'org-id',
        logo_url: 'https://example.com/logo.png',
        logo_dark_url: null,
        favicon_url: null,
        logo_square_url: null,
        primary_color: '#0ea5e9',
        secondary_color: '#10b981',
        accent_color: '#f59e0b',
        success_color: '#10b981',
        warning_color: '#f59e0b',
        error_color: '#ef4444',
        info_color: '#3b82f6',
        font_family: 'Inter',
        heading_font_family: null,
        brand_name: 'Test Agency',
        tagline: 'Quality Care',
        custom_css: null,
        theme_overrides: null,
        component_overrides: null,
        terms_of_service_url: null,
        privacy_policy_url: null,
        support_email: 'support@example.com',
        support_phone: null,
        support_url: null,
        email_header_html: null,
        email_footer_html: null,
        email_from_name: null,
        is_active: true,
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

      const result = await repository.getBrandingByOrganizationId('org-id');

      expect(result).toBeDefined();
      expect(result?.id).toBe('branding-id');
      expect(result?.organizationId).toBe('org-id');
      expect(result?.logoUrl).toBe('https://example.com/logo.png');
      expect(result?.primaryColor).toBe('#0ea5e9');
      expect(result?.brandName).toBe('Test Agency');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['org-id']
      );
    });

    it('should return null when branding does not exist', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await repository.getBrandingByOrganizationId('org-id');

      expect(result).toBeNull();
    });

    it('should map snake_case to camelCase correctly', async () => {
      const mockRow = {
        id: 'branding-id',
        organization_id: 'org-id',
        logo_url: 'https://example.com/logo.png',
        logo_dark_url: 'https://example.com/logo-dark.png',
        favicon_url: 'https://example.com/favicon.ico',
        logo_square_url: 'https://example.com/logo-square.png',
        primary_color: '#0ea5e9',
        secondary_color: null,
        accent_color: null,
        success_color: '#10b981',
        warning_color: '#f59e0b',
        error_color: '#ef4444',
        info_color: '#3b82f6',
        font_family: 'Inter',
        heading_font_family: 'Montserrat',
        brand_name: null,
        tagline: null,
        custom_css: '.custom { color: red; }',
        theme_overrides: { primary: '#000000' },
        component_overrides: { button: { bg: 'blue' } },
        terms_of_service_url: 'https://example.com/terms',
        privacy_policy_url: 'https://example.com/privacy',
        support_email: 'support@example.com',
        support_phone: '+1234567890',
        support_url: 'https://example.com/support',
        email_header_html: '<header>Test</header>',
        email_footer_html: '<footer>Test</footer>',
        email_from_name: 'Test Agency',
        is_active: true,
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 2,
      };

      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [mockRow],
        rowCount: 1,
      } as any);

      const result = await repository.getBrandingByOrganizationId('org-id');

      expect(result?.logoDarkUrl).toBe('https://example.com/logo-dark.png');
      expect(result?.faviconUrl).toBe('https://example.com/favicon.ico');
      expect(result?.logoSquareUrl).toBe('https://example.com/logo-square.png');
      expect(result?.headingFontFamily).toBe('Montserrat');
      expect(result?.customCss).toBe('.custom { color: red; }');
      expect(result?.themeOverrides).toEqual({ primary: '#000000' });
      expect(result?.componentOverrides).toEqual({ button: { bg: 'blue' } });
      expect(result?.termsOfServiceUrl).toBe('https://example.com/terms');
      expect(result?.privacyPolicyUrl).toBe('https://example.com/privacy');
      expect(result?.supportPhone).toBe('+1234567890');
      expect(result?.supportUrl).toBe('https://example.com/support');
      expect(result?.emailHeaderHtml).toBe('<header>Test</header>');
      expect(result?.emailFooterHtml).toBe('<footer>Test</footer>');
      expect(result?.emailFromName).toBe('Test Agency');
      expect(result?.version).toBe(2);
    });
  });

  describe('upsertBranding', () => {
    it('should update existing branding', async () => {
      const existingBranding = {
        id: 'branding-id',
        organization_id: 'org-id',
        logo_url: 'https://example.com/old-logo.png',
        primary_color: '#0ea5e9',
        secondary_color: null,
        accent_color: null,
        success_color: '#10b981',
        warning_color: '#f59e0b',
        error_color: '#ef4444',
        info_color: '#3b82f6',
        font_family: 'Inter',
        heading_font_family: null,
        brand_name: null,
        tagline: null,
        custom_css: null,
        theme_overrides: null,
        component_overrides: null,
        logo_dark_url: null,
        favicon_url: null,
        logo_square_url: null,
        terms_of_service_url: null,
        privacy_policy_url: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        email_header_html: null,
        email_footer_html: null,
        email_from_name: null,
        is_active: true,
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      const updateData: UpsertBrandingRequest = {
        logoUrl: 'https://example.com/new-logo.png',
        brandName: 'Updated Agency',
      };

      const updatedRow = {
        ...existingBranding,
        logo_url: 'https://example.com/new-logo.png',
        brand_name: 'Updated Agency',
        version: 2,
      };

      // First call: check if exists
      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({
          rows: [existingBranding],
          rowCount: 1,
        } as any)
        // Second call: update
        .mockResolvedValueOnce({
          rows: [updatedRow],
          rowCount: 1,
        } as any);

      const result = await repository.upsertBranding('org-id', updateData, 'user-id');

      expect(result.logoUrl).toBe('https://example.com/new-logo.png');
      expect(result.brandName).toBe('Updated Agency');
      expect(result.version).toBe(2);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should create new branding when none exists', async () => {
      const createData: UpsertBrandingRequest = {
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#0ea5e9',
        brandName: 'New Agency',
      };

      const createdRow = {
        id: 'new-branding-id',
        organization_id: 'org-id',
        logo_url: 'https://example.com/logo.png',
        logo_dark_url: null,
        favicon_url: null,
        logo_square_url: null,
        primary_color: '#0ea5e9',
        secondary_color: null,
        accent_color: null,
        success_color: '#10b981',
        warning_color: '#f59e0b',
        error_color: '#ef4444',
        info_color: '#3b82f6',
        font_family: 'Inter, system-ui, sans-serif',
        heading_font_family: null,
        brand_name: 'New Agency',
        tagline: null,
        custom_css: null,
        theme_overrides: null,
        component_overrides: null,
        terms_of_service_url: null,
        privacy_policy_url: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        email_header_html: null,
        email_footer_html: null,
        email_from_name: null,
        is_active: true,
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      // First call: check if exists (returns null)
      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as any)
        // Second call: insert
        .mockResolvedValueOnce({
          rows: [createdRow],
          rowCount: 1,
        } as any);

      const result = await repository.upsertBranding('org-id', createData, 'user-id');

      expect(result.id).toBe('new-branding-id');
      expect(result.logoUrl).toBe('https://example.com/logo.png');
      expect(result.primaryColor).toBe('#0ea5e9');
      expect(result.brandName).toBe('New Agency');
      expect(result.version).toBe(1);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
    });

    it('should handle partial updates', async () => {
      const existingBranding = {
        id: 'branding-id',
        organization_id: 'org-id',
        logo_url: 'https://example.com/logo.png',
        primary_color: '#0ea5e9',
        secondary_color: null,
        accent_color: null,
        success_color: '#10b981',
        warning_color: '#f59e0b',
        error_color: '#ef4444',
        info_color: '#3b82f6',
        font_family: 'Inter',
        heading_font_family: null,
        brand_name: 'Test Agency',
        tagline: null,
        custom_css: null,
        theme_overrides: null,
        component_overrides: null,
        logo_dark_url: null,
        favicon_url: null,
        logo_square_url: null,
        terms_of_service_url: null,
        privacy_policy_url: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        email_header_html: null,
        email_footer_html: null,
        email_from_name: null,
        is_active: true,
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      const partialUpdate: UpsertBrandingRequest = {
        tagline: 'Quality Care',
      };

      const updatedRow = {
        ...existingBranding,
        tagline: 'Quality Care',
        version: 2,
      };

      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({ rows: [existingBranding], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [updatedRow], rowCount: 1 } as any);

      const result = await repository.upsertBranding('org-id', partialUpdate, 'user-id');

      expect(result.tagline).toBe('Quality Care');
      expect(result.brandName).toBe('Test Agency'); // Unchanged
      expect(result.version).toBe(2);
    });

    it('should handle theme and component overrides', async () => {
      const createData: UpsertBrandingRequest = {
        themeOverrides: { primary: '#000000', secondary: '#FFFFFF' },
        componentOverrides: { button: { bg: 'blue', color: 'white' } },
      };

      const createdRow = {
        id: 'branding-id',
        organization_id: 'org-id',
        logo_url: null,
        logo_dark_url: null,
        favicon_url: null,
        logo_square_url: null,
        primary_color: '#0ea5e9',
        secondary_color: null,
        accent_color: null,
        success_color: '#10b981',
        warning_color: '#f59e0b',
        error_color: '#ef4444',
        info_color: '#3b82f6',
        font_family: 'Inter, system-ui, sans-serif',
        heading_font_family: null,
        brand_name: null,
        tagline: null,
        custom_css: null,
        theme_overrides: { primary: '#000000', secondary: '#FFFFFF' },
        component_overrides: { button: { bg: 'blue', color: 'white' } },
        terms_of_service_url: null,
        privacy_policy_url: null,
        support_email: null,
        support_phone: null,
        support_url: null,
        email_header_html: null,
        email_footer_html: null,
        email_from_name: null,
        is_active: true,
        created_at: new Date(),
        created_by: 'user-id',
        updated_at: new Date(),
        updated_by: 'user-id',
        version: 1,
      };

      vi.mocked(mockDb.query)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
        .mockResolvedValueOnce({ rows: [createdRow], rowCount: 1 } as any);

      const result = await repository.upsertBranding('org-id', createData, 'user-id');

      expect(result.themeOverrides).toEqual({ primary: '#000000', secondary: '#FFFFFF' });
      expect(result.componentOverrides).toEqual({ button: { bg: 'blue', color: 'white' } });
    });
  });

  describe('deleteBranding', () => {
    it('should delete branding successfully', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      await repository.deleteBranding('org-id');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['org-id']
      );
    });

    it('should handle deletion of non-existent branding', async () => {
      vi.mocked(mockDb.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      await expect(repository.deleteBranding('org-id')).resolves.not.toThrow();
    });
  });
});
