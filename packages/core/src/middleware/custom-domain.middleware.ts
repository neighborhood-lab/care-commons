/**
 * Custom Domain Middleware
 *
 * Resolves organization by custom domain and attaches to request
 */

import { Request, Response, NextFunction } from 'express';
import { Database } from '../db/connection.js';
import { BrandingRepository } from '../repository/branding-repository';

/**
 * Extend Express Request type to include organization info from domain
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      organizationFromDomain?: {
        organizationId: string;
        brandName: string | null;
        logoUrl: string | null;
      };
    }
  }
}

export class CustomDomainMiddleware {
  private brandingRepo: BrandingRepository;

  constructor(db: Database) {
    this.brandingRepo = new BrandingRepository(db);
  }

  /**
   * Resolve organization by custom domain
   * Checks the Host header to determine if a custom domain is being used
   *
   * Usage:
   *   app.use(customDomainMiddleware.resolveDomain)
   */
  resolveDomain = async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const host = req.headers.host;

      if (!host) {
        // No host header, continue without domain resolution
        next();
        return;
      }

      // Remove port if present
      const domain = host.split(':')[0];

      // Skip if it's the default domain (you'd configure this based on your setup)
      const defaultDomains = [
        'localhost',
        'care-commons.com',
        'app.care-commons.com',
      ];

      if (defaultDomains.some((d) => domain?.includes(d))) {
        // Default domain, no custom domain resolution needed
        next();
        return;
      }

      // Try to find branding for this custom domain
      const branding = await this.brandingRepo.getBrandingByCustomDomain(domain ?? '');

      if (branding) {
        // Attach organization info to request
        req.organizationFromDomain = {
          organizationId: branding.organizationId,
          brandName: branding.brandName,
          logoUrl: branding.logoUrl,
        };
      }

      next();
    } catch (error) {
      console.error('Custom domain resolution error:', error);
      // Don't fail the request, just continue without domain info
      next();
    }
  };
}
