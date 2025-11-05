/**
 * HTTP/API handlers for Family Member Management
 *
 * RESTful endpoints for family member CRUD operations
 */

import { Request, Response, NextFunction } from 'express';
import { UserContext } from '@care-commons/core';
import { FamilyMemberService } from '../service/family-member-service.js';
import {
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput,
  FamilyMemberSearchFilters,
} from '../types/family-member.js';

/**
 * Extract user context from authenticated request
 */
function getUserContext(req: Request): UserContext {
  // In production, this would be populated by auth middleware
  return (req as Request & { userContext: UserContext }).userContext;
}

/**
 * Handle async route errors
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line promise/no-callback-in-promise
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Family Member API handlers
 */
export class FamilyMemberHandlers {
  constructor(private familyMemberService: FamilyMemberService) {}

  /**
   * GET /api/family-members
   * Search/list family members with filters
   */
  listFamilyMembers = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = this.buildSearchFilters(req);

    const result = await this.familyMemberService.searchFamilyMembers(
      filters,
      context
    );

    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/family-members/:id
   * Get single family member by ID
   */
  getFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    const familyMember = await this.familyMemberService.getFamilyMemberById(
      id,
      context
    );

    res.json({
      success: true,
      data: familyMember,
    });
  });

  /**
   * GET /api/family-members/:id/relationships
   * Get family member with relationships
   */
  getFamilyMemberWithRelationships = asyncHandler(
    async (req: Request, res: Response) => {
      const context = getUserContext(req);
      const { id } = req.params;

      const result =
        await this.familyMemberService.getFamilyMemberWithRelationships(
          id,
          context
        );

      res.json({
        success: true,
        data: result,
      });
    }
  );

  /**
   * POST /api/family-members
   * Create new family member
   */
  createFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreateFamilyMemberInput = req.body;

    const familyMember = await this.familyMemberService.createFamilyMember(
      input,
      context
    );

    res.status(201).json({
      success: true,
      data: familyMember,
    });
  });

  /**
   * PATCH /api/family-members/:id
   * Update family member
   */
  updateFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const updates: UpdateFamilyMemberInput = req.body;

    const familyMember = await this.familyMemberService.updateFamilyMember(
      id,
      updates,
      context
    );

    res.json({
      success: true,
      data: familyMember,
    });
  });

  /**
   * POST /api/family-members/:id/activate
   * Activate family member account
   */
  activateFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const { authUserId } = req.body;

    const familyMember = await this.familyMemberService.activateFamilyMember(
      id,
      authUserId,
      context
    );

    res.json({
      success: true,
      data: familyMember,
    });
  });

  /**
   * POST /api/family-members/:id/deactivate
   * Deactivate family member account
   */
  deactivateFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const { reason } = req.body;

    const familyMember = await this.familyMemberService.deactivateFamilyMember(
      id,
      reason,
      context
    );

    res.json({
      success: true,
      data: familyMember,
    });
  });

  /**
   * POST /api/family-members/:id/suspend
   * Suspend family member account
   */
  suspendFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const { reason } = req.body;

    const familyMember = await this.familyMemberService.suspendFamilyMember(
      id,
      reason,
      context
    );

    res.json({
      success: true,
      data: familyMember,
    });
  });

  /**
   * POST /api/family-members/:id/reactivate
   * Reactivate suspended account
   */
  reactivateFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    const familyMember = await this.familyMemberService.reactivateFamilyMember(
      id,
      context
    );

    res.json({
      success: true,
      data: familyMember,
    });
  });

  /**
   * PATCH /api/family-members/:id/portal-preferences
   * Update portal preferences
   */
  updatePortalPreferences = asyncHandler(
    async (req: Request, res: Response) => {
      const context = getUserContext(req);
      const { id } = req.params;
      const preferences = req.body;

      const familyMember =
        await this.familyMemberService.updatePortalPreferences(
          id,
          preferences,
          context
        );

      res.json({
        success: true,
        data: familyMember,
      });
    }
  );

  /**
   * PATCH /api/family-members/:id/communication-preferences
   * Update communication preferences
   */
  updateCommunicationPreferences = asyncHandler(
    async (req: Request, res: Response) => {
      const context = getUserContext(req);
      const { id } = req.params;
      const preferences = req.body;

      const familyMember =
        await this.familyMemberService.updateCommunicationPreferences(
          id,
          preferences,
          context
        );

      res.json({
        success: true,
        data: familyMember,
      });
    }
  );

  /**
   * DELETE /api/family-members/:id
   * Delete family member (soft delete)
   */
  deleteFamilyMember = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    await this.familyMemberService.deleteFamilyMember(id, context);

    res.status(204).send();
  });

  /**
   * Build search filters from request query parameters
   */
  private buildSearchFilters(req: Request): FamilyMemberSearchFilters {
    const { organizationId, email, lastName, accountStatus, accountActive, searchTerm } =
      req.query;

    const filters: FamilyMemberSearchFilters = {
      organizationId: organizationId as string,
    };

    if (typeof email === 'string') {
      filters.email = email.trim();
    }

    if (typeof lastName === 'string') {
      filters.lastName = lastName.trim();
    }

    if (typeof accountStatus === 'string') {
      filters.accountStatus = accountStatus as any;
    }

    if (accountActive === 'true' || accountActive === 'false') {
      filters.accountActive = accountActive === 'true';
    }

    if (typeof searchTerm === 'string') {
      filters.searchTerm = searchTerm.trim();
    }

    return filters;
  }
}
