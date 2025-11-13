/**
 * Family Engagement Service Tests
 *
 * Tests business logic for family portal management:
 * - Permission validation
 * - Family member invitation
 * - Notification creation
 * - Access control
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FamilyEngagementService } from '../services/family-engagement-service.js';
import type { UserContext } from '@care-commons/core';
import type {
  InviteFamilyMemberInput,
} from '../types/family-engagement.js';

describe('FamilyEngagementService', () => {
  let service: FamilyEngagementService;
  let mockFamilyMemberRepo: any;
  let mockNotificationRepo: any;
  let mockActivityFeedRepo: any;
  let mockMessageRepo: any;
  let mockPermissions: any;
  let mockUserRepository: any;
  let mockClientService: any;
  let mockCarePlanService: any;
  let userContext: UserContext;

  beforeEach(() => {
    // Mock repositories
    mockFamilyMemberRepo = {
      findByEmail: vi.fn(),
      createFamilyMember: vi.fn(),
      findById: vi.fn(),
      findByClientId: vi.fn(),
      update: vi.fn(),
      getFamilyMemberProfile: vi.fn(),
    };

    mockNotificationRepo = {
      createNotification: vi.fn(),
    };

    mockActivityFeedRepo = {};
    mockMessageRepo = {};

    // Mock permissions service
    mockPermissions = {
      hasPermission: vi.fn(),
    };

    // Mock user repository
    mockUserRepository = {
      getUserById: vi.fn(),
    };

    // Mock client service
    mockClientService = {
      getClientById: vi.fn(),
    };

    // Mock care plan service
    mockCarePlanService = {
      getActiveCarePlanForClient: vi.fn(),
    };

    service = new FamilyEngagementService(
      mockFamilyMemberRepo,
      mockNotificationRepo,
      mockActivityFeedRepo,
      mockMessageRepo,
      mockPermissions,
      mockUserRepository,
      mockClientService,
      mockCarePlanService
    );

    // Default user context
    userContext = {
      userId: 'user-123',
      organizationId: 'org-123',
      role: 'COORDINATOR',
      roles: ['COORDINATOR'],
      branchIds: ['branch-123'],
      permissions: [],
    } as UserContext;
  });

  describe('inviteFamilyMember', () => {
    const inviteInput: InviteFamilyMemberInput = {
      clientId: 'client-123',
      relationship: 'CHILD',
      isPrimaryContact: true,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '555-0123',
      portalAccessLevel: 'VIEW_DETAILED',
    };

    it('should successfully invite a family member', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      mockFamilyMemberRepo.findByEmail.mockResolvedValue(null);
      
      const createdMember = {
        id: 'family-member-123',
        ...inviteInput,
        organizationId: 'org-123',
        branchId: 'branch-123',
        status: 'ACTIVE' as const,
        invitationStatus: 'PENDING' as const,
        receiveNotifications: true,
        passwordResetRequired: true,
        accessGrantedBy: 'user-123',
        accessGrantedAt: new Date(),
        preferredContactMethod: 'EMAIL' as const,
        notificationPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: false,
          visitReminders: true,
          visitCompletedUpdates: true,
          careplanUpdates: true,
          incidentAlerts: true,
          appointmentReminders: true,
          messageNotifications: true,
          digestFrequency: 'DAILY' as const,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        updatedBy: 'user-123',
      };

      mockFamilyMemberRepo.createFamilyMember.mockResolvedValue(createdMember);
      mockNotificationRepo.createNotification.mockResolvedValue({});

      // Act
      const result = await service.inviteFamilyMember(inviteInput, userContext);

      // Assert
      expect(result).toEqual(createdMember);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        userContext,
        'family-portal:invite'
      );
      expect(mockFamilyMemberRepo.createFamilyMember).toHaveBeenCalled();
      expect(mockNotificationRepo.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'SYSTEM',
          priority: 'NORMAL',
          title: 'Portal Access Invitation',
        })
      );
    });

    it('should reject invitation without permissions', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(false);

      // Act & Assert
      await expect(
        service.inviteFamilyMember(inviteInput, userContext)
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should reject duplicate email for same client', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      mockFamilyMemberRepo.findByEmail.mockResolvedValue({
        id: 'existing-member',
        clientId: 'client-123',
        email: 'john.doe@example.com',
      });

      // Act & Assert
      await expect(
        service.inviteFamilyMember(inviteInput, userContext)
      ).rejects.toThrow('already has portal access');
    });

    it('should allow same email for different client', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      mockFamilyMemberRepo.findByEmail.mockResolvedValue({
        id: 'existing-member',
        clientId: 'different-client-456', // Different client
        email: 'john.doe@example.com',
      });

      const createdMember = {
        id: 'family-member-123',
        ...inviteInput,
        organizationId: 'org-123',
        branchId: 'branch-123',
        status: 'ACTIVE' as const,
        invitationStatus: 'PENDING' as const,
        receiveNotifications: true,
        passwordResetRequired: true,
        accessGrantedBy: 'user-123',
        accessGrantedAt: new Date(),
        preferredContactMethod: 'EMAIL' as const,
        notificationPreferences: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: false,
          visitReminders: true,
          visitCompletedUpdates: true,
          careplanUpdates: true,
          incidentAlerts: true,
          appointmentReminders: true,
          messageNotifications: true,
          digestFrequency: 'DAILY' as const,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user-123',
        updatedBy: 'user-123',
      };

      mockFamilyMemberRepo.createFamilyMember.mockResolvedValue(createdMember);
      mockNotificationRepo.createNotification.mockResolvedValue({});

      // Act
      const result = await service.inviteFamilyMember(inviteInput, userContext);

      // Assert
      expect(result).toBeDefined();
      expect(mockFamilyMemberRepo.createFamilyMember).toHaveBeenCalled();
    });
  });

  describe('getFamilyMemberProfile', () => {
    it('should return family member profile with permissions', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const profile = {
        id: 'family-member-123',
        firstName: 'John',
        statistics: {
          totalNotifications: 10,
          unreadNotifications: 2,
          totalMessages: 5,
          unreadMessages: 1,
        },
      };
      mockFamilyMemberRepo.getFamilyMemberProfile.mockResolvedValue(profile);

      // Act
      const result = await service.getFamilyMemberProfile(
        'family-member-123',
        userContext
      );

      // Assert
      expect(result).toEqual(profile);
      expect(mockPermissions.hasPermission).toHaveBeenCalledWith(
        userContext,
        'family-portal:view'
      );
    });

    it('should reject without view permissions', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(false);

      // Act & Assert
      await expect(
        service.getFamilyMemberProfile('family-member-123', userContext)
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('getFamilyMembersForClient', () => {
    it('should return all family members for a client', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const familyMembers = [
        { id: 'member-1', relationship: 'CHILD' },
        { id: 'member-2', relationship: 'SPOUSE' },
      ];
      mockFamilyMemberRepo.findByClientId.mockResolvedValue(familyMembers);

      // Act
      const result = await service.getFamilyMembersForClient(
        'client-123',
        userContext
      );

      // Assert
      expect(result).toEqual(familyMembers);
      expect(mockFamilyMemberRepo.findByClientId).toHaveBeenCalledWith(
        'client-123'
      );
    });

    it('should reject without client view permissions', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(false);

      // Act & Assert
      await expect(
        service.getFamilyMembersForClient('client-123', userContext)
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('updatePortalAccess', () => {
    it('should update portal access level', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const existingMember = {
        id: 'member-123',
        portalAccessLevel: 'VIEW_BASIC',
      };
      mockFamilyMemberRepo.findById.mockResolvedValue(existingMember);

      const updatedMember = {
        ...existingMember,
        portalAccessLevel: 'VIEW_DETAILED',
      };
      mockFamilyMemberRepo.update.mockResolvedValue(updatedMember);

      // Act
      const result = await service.updatePortalAccess(
        'member-123',
        { portalAccessLevel: 'VIEW_DETAILED' },
        userContext
      );

      // Assert
      expect(result.portalAccessLevel).toBe('VIEW_DETAILED');
      expect(mockFamilyMemberRepo.update).toHaveBeenCalledWith(
        'member-123',
        expect.objectContaining({
          portalAccessLevel: 'VIEW_DETAILED',
          updatedBy: 'user-123',
        }),
        userContext
      );
    });

    it('should reject without manage permissions', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(false);

      // Act & Assert
      await expect(
        service.updatePortalAccess(
          'member-123',
          { status: 'SUSPENDED' },
          userContext
        )
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should throw error for non-existent family member', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      mockFamilyMemberRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updatePortalAccess(
          'nonexistent-member',
          { status: 'ACTIVE' },
          userContext
        )
      ).rejects.toThrow('Family member not found');
    });

    it('should update status to suspended', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const existingMember = {
        id: 'member-123',
        status: 'ACTIVE',
      };
      mockFamilyMemberRepo.findById.mockResolvedValue(existingMember);

      const updatedMember = {
        ...existingMember,
        status: 'SUSPENDED',
      };
      mockFamilyMemberRepo.update.mockResolvedValue(updatedMember);

      // Act
      const result = await service.updatePortalAccess(
        'member-123',
        { status: 'SUSPENDED' },
        userContext
      );

      // Assert
      expect(result.status).toBe('SUSPENDED');
    });

    it('should update access expiration date', async () => {
      // Arrange
      mockPermissions.hasPermission.mockReturnValue(true);
      const existingMember = {
        id: 'member-123',
        accessExpiresAt: null,
      };
      mockFamilyMemberRepo.findById.mockResolvedValue(existingMember);

      const expirationDate = new Date('2026-12-31T23:59:59Z');
      const updatedMember = {
        ...existingMember,
        accessExpiresAt: expirationDate,
      };
      mockFamilyMemberRepo.update.mockResolvedValue(updatedMember);

      // Act
      const result = await service.updatePortalAccess(
        'member-123',
        { accessExpiresAt: expirationDate },
        userContext
      );

      // Assert
      expect(result.accessExpiresAt).toBe(expirationDate);
    });
  });
});
