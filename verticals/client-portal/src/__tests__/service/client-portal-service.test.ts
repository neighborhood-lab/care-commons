/**
 * Client Portal Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientPortalService } from '../../service/client-portal-service';
import type {
  ClientPortalAccessRepository,
  VisitRatingRepository,
  ScheduleChangeRequestRepository,
  VideoCallSessionRepository,
  CarePlanAccessLogRepository,
} from '../../repository/client-portal-repository';
import type { UserContext } from '@care-commons/core';
import { PermissionError, NotFoundError, ConflictError, ValidationError } from '@care-commons/core';
import type {
  ClientPortalAccess,
  ClientVisitRating,
  ScheduleChangeRequest,
  VideoCallSession,
} from '../../types/index';

describe('ClientPortalService', () => {
  let service: ClientPortalService;
  let mockPortalAccessRepo: ClientPortalAccessRepository;
  let mockVisitRatingRepo: VisitRatingRepository;
  let mockScheduleRequestRepo: ScheduleChangeRequestRepository;
  let mockVideoCallRepo: VideoCallSessionRepository;
  let mockCarePlanAccessLogRepo: CarePlanAccessLogRepository;
  let userContext: UserContext;

  beforeEach(() => {
    // Mock repositories
    mockPortalAccessRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByClientId: vi.fn(),
      findByInvitationCode: vi.fn(),
      incrementLoginCount: vi.fn(),
      incrementFailedLoginAttempts: vi.fn(),
      lockAccount: vi.fn(),
    } as any;

    mockVisitRatingRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findByVisitId: vi.fn(),
      findByClientId: vi.fn(),
      searchRatings: vi.fn(),
      getCaregiverAverageRating: vi.fn(),
    } as any;

    mockScheduleRequestRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findPendingByClientId: vi.fn(),
      searchRequests: vi.fn(),
    } as any;

    mockVideoCallRepo = {
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn(),
      findUpcomingByClientId: vi.fn(),
      searchSessions: vi.fn(),
    } as any;

    mockCarePlanAccessLogRepo = {
      create: vi.fn(),
      findByCarePlanId: vi.fn(),
      findByClientId: vi.fn(),
    } as any;

    service = new ClientPortalService(
      mockPortalAccessRepo,
      mockVisitRatingRepo,
      mockScheduleRequestRepo,
      mockVideoCallRepo,
      mockCarePlanAccessLogRepo
    );

    userContext = {
      userId: 'user-123',
      roles: ['COORDINATOR'],
      permissions: [
        'clients:portal:invite',
        'clients:portal:read',
        'clients:ratings:read',
        'clients:schedule:read',
        'clients:schedule:approve',
        'clients:video:schedule',
        'clients:video:read',
      ],
      organizationId: 'org-123',
      branchIds: ['branch-123'],
    };
  });

  describe('inviteClientToPortal', () => {
    it('should create portal access invitation', async () => {
      const input = {
        clientId: 'client-123',
        expiresInDays: 7,
      };

      const mockPortalAccess: Partial<ClientPortalAccess> = {
        id: 'portal-123',
        clientId: 'client-123',
        status: 'PENDING_ACTIVATION',
        invitationCode: 'invite-code-123',
      } as any;

      vi.mocked(mockPortalAccessRepo.findByClientId).mockResolvedValue(null);
      vi.mocked(mockPortalAccessRepo.create).mockResolvedValue(mockPortalAccess as any);

      const result = await service.inviteClientToPortal(input, userContext);

      expect(result).toBeDefined();
      expect(mockPortalAccessRepo.create).toHaveBeenCalled();
    });

    it('should throw PermissionError without permission', async () => {
      const input = {
        clientId: 'client-123',
        expiresInDays: 7,
      };

      const contextWithoutPermission = {
        ...userContext,
        permissions: [],
      };

      await expect(
        service.inviteClientToPortal(input, contextWithoutPermission)
      ).rejects.toThrow(PermissionError);
    });

    it('should throw ConflictError if client already has active portal access', async () => {
      const input = {
        clientId: 'client-123',
        expiresInDays: 7,
      };

      const existingAccess: Partial<ClientPortalAccess> = {
        id: 'portal-123',
        status: 'ACTIVE',
      } as any;

      vi.mocked(mockPortalAccessRepo.findByClientId).mockResolvedValue(existingAccess as any);

      await expect(
        service.inviteClientToPortal(input, userContext)
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('activatePortalAccess', () => {
    it('should activate portal access with valid invitation code', async () => {
      const input = {
        invitationCode: 'invite-code-123',
        password: 'ValidPass123!',
        acceptTerms: true,
      };

      const mockPortalAccess: ClientPortalAccess = {
        id: 'portal-123',
        clientId: 'client-123',
        status: 'PENDING_ACTIVATION',
        invitationCode: 'invite-code-123',
        invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any;

      const updatedAccess = {
        ...mockPortalAccess,
        status: 'ACTIVE',
        activatedAt: new Date(),
      };

      vi.mocked(mockPortalAccessRepo.findByInvitationCode).mockResolvedValue(mockPortalAccess);
      vi.mocked(mockPortalAccessRepo.update).mockResolvedValue(updatedAccess as any);

      const result = await service.activatePortalAccess(input);

      expect(result.portalAccess.status).toBe('ACTIVE');
      expect(result.sessionToken).toBeDefined();
    });

    it('should throw NotFoundError for invalid invitation code', async () => {
      const input = {
        invitationCode: 'invalid-code',
        password: 'ValidPass123!',
        acceptTerms: true,
      };

      vi.mocked(mockPortalAccessRepo.findByInvitationCode).mockResolvedValue(null);

      await expect(service.activatePortalAccess(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for expired invitation', async () => {
      const input = {
        invitationCode: 'expired-code',
        password: 'ValidPass123!',
        acceptTerms: true,
      };

      const expiredAccess: ClientPortalAccess = {
        id: 'portal-123',
        status: 'PENDING_ACTIVATION',
        invitationExpiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      } as any;

      vi.mocked(mockPortalAccessRepo.findByInvitationCode).mockResolvedValue(expiredAccess);

      await expect(service.activatePortalAccess(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if already activated', async () => {
      const input = {
        invitationCode: 'invite-code-123',
        password: 'ValidPass123!',
        acceptTerms: true,
      };

      const activeAccess: ClientPortalAccess = {
        id: 'portal-123',
        status: 'ACTIVE',
        invitationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      } as any;

      vi.mocked(mockPortalAccessRepo.findByInvitationCode).mockResolvedValue(activeAccess);

      await expect(service.activatePortalAccess(input)).rejects.toThrow(ConflictError);
    });
  });

  describe('getPortalAccess', () => {
    it('should get portal access for client', async () => {
      const mockAccess: ClientPortalAccess = {
        id: 'portal-123',
        clientId: 'client-123',
        status: 'ACTIVE',
      } as any;

      vi.mocked(mockPortalAccessRepo.findByClientId).mockResolvedValue(mockAccess);

      const result = await service.getPortalAccess('client-123', userContext);

      expect(result).toBe(mockAccess);
    });

    it('should allow client to view their own portal access', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const mockAccess: ClientPortalAccess = {
        id: 'portal-123',
        clientId: 'client-123',
        status: 'ACTIVE',
      } as any;

      vi.mocked(mockPortalAccessRepo.findByClientId).mockResolvedValue(mockAccess);

      const result = await service.getPortalAccess('client-123', clientContext);

      expect(result).toBe(mockAccess);
    });

    it('should throw PermissionError without permission', async () => {
      const contextWithoutPermission = {
        ...userContext,
        permissions: [],
        roles: [],
      };

      await expect(
        service.getPortalAccess('client-123', contextWithoutPermission)
      ).rejects.toThrow(PermissionError);
    });

    it('should throw NotFoundError if portal access not found', async () => {
      vi.mocked(mockPortalAccessRepo.findByClientId).mockResolvedValue(null);

      await expect(
        service.getPortalAccess('client-123', userContext)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateAccessibilityPreferences', () => {
    it('should update accessibility preferences', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const mockAccess: ClientPortalAccess = {
        id: 'portal-123',
        clientId: 'client-123',
        accessibilityPreferences: {
          fontSize: 'MEDIUM',
          theme: 'LIGHT',
        },
      } as any;

      const updatedAccess = {
        ...mockAccess,
        accessibilityPreferences: {
          fontSize: 'LARGE',
          theme: 'HIGH_CONTRAST',
        },
      };

      vi.mocked(mockPortalAccessRepo.findByClientId).mockResolvedValue(mockAccess);
      vi.mocked(mockPortalAccessRepo.update).mockResolvedValue(updatedAccess as any);

      const result = await service.updateAccessibilityPreferences(
        'client-123',
        { fontSize: 'LARGE', theme: 'HIGH_CONTRAST' },
        clientContext
      );

      expect(result.accessibilityPreferences.fontSize).toBe('LARGE');
    });

    it('should throw PermissionError if not client themselves', async () => {
      await expect(
        service.updateAccessibilityPreferences(
          'client-123',
          { fontSize: 'LARGE' },
          userContext
        )
      ).rejects.toThrow(PermissionError);
    });
  });

  describe('createVisitRating', () => {
    it('should create visit rating', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const input = {
        visitId: 'visit-123',
        overallRating: 5,
        positiveFeedback: 'Excellent care!',
      };

      const mockRating: ClientVisitRating = {
        id: 'rating-123',
        clientId: 'client-123',
        visitId: 'visit-123',
        overallRating: 5,
      } as any;

      vi.mocked(mockVisitRatingRepo.findByVisitId).mockResolvedValue(null);
      vi.mocked(mockVisitRatingRepo.create).mockResolvedValue(mockRating);

      const result = await service.createVisitRating('client-123', input, clientContext);

      expect(result.overallRating).toBe(5);
    });

    it('should throw ConflictError if visit already rated', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const input = {
        visitId: 'visit-123',
        overallRating: 5,
      };

      const existingRating: ClientVisitRating = {
        id: 'rating-123',
        visitId: 'visit-123',
      } as any;

      vi.mocked(mockVisitRatingRepo.findByVisitId).mockResolvedValue(existingRating);

      await expect(
        service.createVisitRating('client-123', input, clientContext)
      ).rejects.toThrow(ConflictError);
    });

    it('should auto-flag low ratings for review', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const input = {
        visitId: 'visit-123',
        overallRating: 2,
        improvementFeedback: 'Late arrival',
      };

      vi.mocked(mockVisitRatingRepo.findByVisitId).mockResolvedValue(null);
      vi.mocked(mockVisitRatingRepo.create).mockImplementation(async (data) => ({
        ...data,
        id: 'rating-123',
      } as any));

      await service.createVisitRating('client-123', input, clientContext);

      expect(mockVisitRatingRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          flaggedForReview: true,
        }),
        expect.any(String)
      );
    });
  });

  describe('getClientVisitRatings', () => {
    it('should get visit ratings for client', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const mockResult = {
        items: [{ id: 'rating-123' }] as any[],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      vi.mocked(mockVisitRatingRepo.findByClientId).mockResolvedValue(mockResult);

      const result = await service.getClientVisitRatings(
        'client-123',
        { page: 1, limit: 20 },
        clientContext
      );

      expect(result.items).toHaveLength(1);
    });
  });

  describe('createScheduleChangeRequest', () => {
    it('should create schedule change request', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: ['branch-123'],
      };

      const input = {
        requestType: 'RESCHEDULE' as const,
        visitId: 'visit-123',
        requestedStartTime: new Date('2025-12-01T10:00:00Z'),
        requestedEndTime: new Date('2025-12-01T12:00:00Z'),
        requestedReason: 'Doctor appointment conflict',
      };

      const mockRequest: ScheduleChangeRequest = {
        id: 'request-123',
        clientId: 'client-123',
        requestType: 'RESCHEDULE',
        status: 'PENDING',
      } as any;

      vi.mocked(mockScheduleRequestRepo.create).mockResolvedValue(mockRequest);

      const result = await service.createScheduleChangeRequest('client-123', input, clientContext);

      expect(result.status).toBe('PENDING');
    });

    it('should throw PermissionError if not client themselves', async () => {
      const input = {
        requestType: 'CANCEL' as const,
        visitId: 'visit-123',
        requestedReason: 'Traveling out of town',
      };

      await expect(
        service.createScheduleChangeRequest('client-123', input, userContext)
      ).rejects.toThrow(PermissionError);
    });
  });

  describe('reviewScheduleChangeRequest', () => {
    it('should approve schedule change request', async () => {
      const mockRequest: ScheduleChangeRequest = {
        id: 'request-123',
        status: 'PENDING',
      } as any;

      const approvedRequest: ScheduleChangeRequest = {
        ...mockRequest,
        status: 'APPROVED',
        reviewedBy: 'user-123',
      } as any;

      vi.mocked(mockScheduleRequestRepo.findById).mockResolvedValue(mockRequest);
      vi.mocked(mockScheduleRequestRepo.update).mockResolvedValue(approvedRequest);

      const result = await service.reviewScheduleChangeRequest(
        'request-123',
        {
          status: 'APPROVED',
          newVisitId: 'visit-456',
          reviewNotes: 'Approved and rescheduled',
        },
        userContext
      );

      expect(result.status).toBe('APPROVED');
    });

    it('should deny schedule change request', async () => {
      const mockRequest: ScheduleChangeRequest = {
        id: 'request-123',
        status: 'PENDING',
      } as any;

      const deniedRequest: ScheduleChangeRequest = {
        ...mockRequest,
        status: 'DENIED',
        denialReason: 'No availability',
      } as any;

      vi.mocked(mockScheduleRequestRepo.findById).mockResolvedValue(mockRequest);
      vi.mocked(mockScheduleRequestRepo.update).mockResolvedValue(deniedRequest);

      const result = await service.reviewScheduleChangeRequest(
        'request-123',
        {
          status: 'DENIED',
          denialReason: 'No availability',
        },
        userContext
      );

      expect(result.status).toBe('DENIED');
    });

    it('should throw PermissionError without permission', async () => {
      const contextWithoutPermission = {
        ...userContext,
        permissions: [],
      };

      await expect(
        service.reviewScheduleChangeRequest(
          'request-123',
          { status: 'APPROVED' },
          contextWithoutPermission
        )
      ).rejects.toThrow(PermissionError);
    });

    it('should throw NotFoundError if request not found', async () => {
      vi.mocked(mockScheduleRequestRepo.findById).mockResolvedValue(null);

      await expect(
        service.reviewScheduleChangeRequest(
          'request-123',
          { status: 'APPROVED' },
          userContext
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if already reviewed', async () => {
      const reviewedRequest: ScheduleChangeRequest = {
        id: 'request-123',
        status: 'APPROVED',
      } as any;

      vi.mocked(mockScheduleRequestRepo.findById).mockResolvedValue(reviewedRequest);

      await expect(
        service.reviewScheduleChangeRequest(
          'request-123',
          { status: 'APPROVED' },
          userContext
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('scheduleVideoCall', () => {
    it('should schedule video call', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: ['branch-123'],
      };

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const input = {
        coordinatorId: 'coordinator-123',
        callType: 'SCHEDULED' as const,
        scheduledStart: futureDate,
        scheduledEnd: new Date(futureDate.getTime() + 30 * 60 * 1000),
        callPurpose: 'Monthly check-in',
      };

      const mockSession: VideoCallSession = {
        id: 'session-123',
        clientId: 'client-123',
        status: 'SCHEDULED',
      } as any;

      vi.mocked(mockVideoCallRepo.create).mockResolvedValue(mockSession);

      const result = await service.scheduleVideoCall('client-123', input, clientContext);

      expect(result.status).toBe('SCHEDULED');
    });
  });

  describe('rateVideoCall', () => {
    it('should rate completed video call', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const mockSession: VideoCallSession = {
        id: 'session-123',
        clientId: 'client-123',
        status: 'COMPLETED',
      } as any;

      const ratedSession: VideoCallSession = {
        ...mockSession,
        clientRating: 5,
        clientFeedback: 'Great call',
      };

      vi.mocked(mockVideoCallRepo.findById).mockResolvedValue(mockSession);
      vi.mocked(mockVideoCallRepo.update).mockResolvedValue(ratedSession as any);

      const result = await service.rateVideoCall(
        'session-123',
        {
          clientRating: 5,
          clientFeedback: 'Great call',
        },
        clientContext
      );

      expect(result.clientRating).toBe(5);
    });

    it('should throw ValidationError if call not completed', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const mockSession: VideoCallSession = {
        id: 'session-123',
        clientId: 'client-123',
        status: 'SCHEDULED',
      } as any;

      vi.mocked(mockVideoCallRepo.findById).mockResolvedValue(mockSession);

      await expect(
        service.rateVideoCall('session-123', { clientRating: 5 }, clientContext)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('logCarePlanAccess', () => {
    it('should log care plan access', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      const mockLog = {
        id: 'log-123',
        clientId: 'client-123',
        carePlanId: 'plan-123',
        accessType: 'VIEW',
      } as any;

      vi.mocked(mockCarePlanAccessLogRepo.create).mockResolvedValue(mockLog);

      const result = await service.logCarePlanAccess(
        'client-123',
        'plan-123',
        'VIEW',
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          deviceType: 'DESKTOP',
          portalSessionId: 'session-123',
          accessibilityFeatures: { screenReader: true },
        },
        clientContext
      );

      expect(result.accessType).toBe('VIEW');
    });
  });

  describe('getClientDashboard', () => {
    it('should get client dashboard', async () => {
      const clientContext: UserContext = {
        userId: 'client-123',
        roles: ['CLIENT'],
        permissions: [],
        organizationId: 'org-123',
        branchIds: [],
      };

      vi.mocked(mockScheduleRequestRepo.findPendingByClientId).mockResolvedValue([]);
      vi.mocked(mockVideoCallRepo.findUpcomingByClientId).mockResolvedValue([]);

      const result = await service.getClientDashboard('client-123', clientContext);

      expect(result).toBeDefined();
      expect(result.client).toBeDefined();
    });

    it('should throw PermissionError if not client themselves', async () => {
      await expect(
        service.getClientDashboard('client-123', userContext)
      ).rejects.toThrow(PermissionError);
    });
  });
});
