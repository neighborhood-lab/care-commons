/**
 * Client Portal Repository Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ClientPortalAccessRepository,
  VisitRatingRepository,
  ScheduleChangeRequestRepository,
  VideoCallSessionRepository,
} from '../../repository/client-portal-repository';
import type { Database } from '@care-commons/core';

describe('ClientPortalAccessRepository', () => {
  let repo: ClientPortalAccessRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      fn: { now: vi.fn(() => new Date()) },
    } as any;

    repo = new ClientPortalAccessRepository(mockDb);
  });

  describe('mapRowToEntity', () => {
    it('should map database row to entity', () => {
      const row = {
        id: 'portal-123',
        client_id: 'client-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        status: 'ACTIVE',
        portal_enabled: true,
        last_login_at: new Date(),
        last_login_ip: '127.0.0.1',
        login_count: 5,
        invitation_code: null,
        invitation_sent_at: null,
        invitation_expires_at: null,
        activated_at: new Date(),
        accessibility_preferences: JSON.stringify({ fontSize: 'MEDIUM' }),
        notification_preferences: JSON.stringify({ emailEnabled: true }),
        password_reset_required: false,
        password_changed_at: new Date(),
        failed_login_attempts: 0,
        locked_until: null,
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        deleted_at: null,
        deleted_by: null,
        version: 1,
      };

      const entity = (repo as any).mapRowToEntity(row);

      expect(entity.id).toBe('portal-123');
      expect(entity.clientId).toBe('client-123');
      expect(entity.status).toBe('ACTIVE');
      expect(entity.accessibilityPreferences).toBeDefined();
    });

    it('should handle JSONB fields that are already objects', () => {
      const row = {
        id: 'portal-123',
        client_id: 'client-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        status: 'ACTIVE',
        portal_enabled: true,
        accessibility_preferences: { fontSize: 'LARGE' }, // Already object
        notification_preferences: { emailEnabled: false }, // Already object
        login_count: 0,
        failed_login_attempts: 0,
        last_login_at: null,
        last_login_ip: null,
        invitation_code: null,
        invitation_sent_at: null,
        invitation_expires_at: null,
        activated_at: null,
        password_reset_required: false,
        password_changed_at: null,
        locked_until: null,
        created_at: new Date(),
        created_by: 'user-123',
        updated_at: new Date(),
        updated_by: 'user-123',
        deleted_at: null,
        deleted_by: null,
        version: 1,
      };

      const entity = (repo as any).mapRowToEntity(row);

      expect(entity.accessibilityPreferences.fontSize).toBe('LARGE');
      expect(entity.notificationPreferences.emailEnabled).toBe(false);
    });
  });

  describe('mapEntityToRow', () => {
    it('should map entity to database row', () => {
      const entity = {
        clientId: 'client-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        status: 'ACTIVE' as const,
        portalEnabled: true,
        loginCount: 5,
        accessibilityPreferences: { fontSize: 'MEDIUM' as const },
        notificationPreferences: { emailEnabled: true },
        failedLoginAttempts: 0,
      };

      const row = (repo as any).mapEntityToRow(entity);

      expect(row.client_id).toBe('client-123');
      expect(row.status).toBe('ACTIVE');
      expect(row.accessibility_preferences).toBeDefined();
    });
  });
});

describe('VisitRatingRepository', () => {
  let repo: VisitRatingRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      fn: { now: vi.fn(() => new Date()) },
    } as any;

    repo = new VisitRatingRepository(mockDb);
  });

  describe('mapRowToEntity', () => {
    it('should map database row to entity', () => {
      const row = {
        id: 'rating-123',
        client_id: 'client-123',
        visit_id: 'visit-123',
        caregiver_id: 'caregiver-123',
        organization_id: 'org-123',
        overall_rating: 5,
        professionalism_rating: 5,
        punctuality_rating: 5,
        quality_of_care_rating: 5,
        communication_rating: 5,
        positive_feedback: 'Excellent!',
        improvement_feedback: null,
        additional_comments: null,
        would_request_again: true,
        flagged_for_review: false,
        flag_reason: null,
        rated_at: new Date(),
        is_anonymous: false,
        visible_to_caregiver: true,
        coordinator_response: null,
        coordinator_responded_at: null,
        coordinator_id: null,
        created_at: new Date(),
        created_by: 'client-123',
        updated_at: new Date(),
        updated_by: 'client-123',
        deleted_at: null,
        deleted_by: null,
      };

      const entity = (repo as any).mapRowToEntity(row);

      expect(entity.id).toBe('rating-123');
      expect(entity.overallRating).toBe(5);
      expect(entity.positiveFeedback).toBe('Excellent!');
    });
  });

  describe('mapEntityToRow', () => {
    it('should map entity to database row', () => {
      const entity = {
        clientId: 'client-123',
        visitId: 'visit-123',
        caregiverId: 'caregiver-123',
        organizationId: 'org-123',
        overallRating: 4,
        flaggedForReview: false,
        isAnonymous: false,
        visibleToCaregiver: true,
      };

      const row = (repo as any).mapEntityToRow(entity);

      expect(row.client_id).toBe('client-123');
      expect(row.overall_rating).toBe(4);
    });
  });
});

describe('ScheduleChangeRequestRepository', () => {
  let repo: ScheduleChangeRequestRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      fn: { now: vi.fn(() => new Date()) },
    } as any;

    repo = new ScheduleChangeRequestRepository(mockDb);
  });

  describe('mapRowToEntity', () => {
    it('should map database row to entity', () => {
      const row = {
        id: 'request-123',
        client_id: 'client-123',
        visit_id: 'visit-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        request_type: 'RESCHEDULE',
        priority: 3,
        current_start_time: new Date(),
        current_end_time: new Date(),
        requested_start_time: new Date(),
        requested_end_time: new Date(),
        requested_reason: 'Doctor appointment',
        status: 'PENDING',
        reviewed_by: null,
        reviewed_at: null,
        review_notes: null,
        denial_reason: null,
        new_visit_id: null,
        change_applied: false,
        applied_at: null,
        client_notified: false,
        client_notified_at: null,
        created_at: new Date(),
        created_by: 'client-123',
        updated_at: new Date(),
        updated_by: 'client-123',
        deleted_at: null,
        deleted_by: null,
      };

      const entity = (repo as any).mapRowToEntity(row);

      expect(entity.id).toBe('request-123');
      expect(entity.requestType).toBe('RESCHEDULE');
      expect(entity.status).toBe('PENDING');
    });
  });

  describe('mapEntityToRow', () => {
    it('should map entity to database row', () => {
      const entity = {
        clientId: 'client-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        requestType: 'CANCEL' as const,
        priority: 1,
        requestedReason: 'Traveling',
        status: 'PENDING' as const,
        changeApplied: false,
        clientNotified: false,
      };

      const row = (repo as any).mapEntityToRow(entity);

      expect(row.client_id).toBe('client-123');
      expect(row.request_type).toBe('CANCEL');
    });
  });
});

describe('VideoCallSessionRepository', () => {
  let repo: VideoCallSessionRepository;
  let mockDb: Database;

  beforeEach(() => {
    mockDb = {
      fn: { now: vi.fn(() => new Date()) },
    } as any;

    repo = new VideoCallSessionRepository(mockDb);
  });

  describe('mapRowToEntity', () => {
    it('should map database row to entity', () => {
      const row = {
        id: 'session-123',
        client_id: 'client-123',
        coordinator_id: 'coordinator-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        call_type: 'SCHEDULED',
        status: 'COMPLETED',
        scheduled_start: new Date(),
        scheduled_end: new Date(),
        actual_start: new Date(),
        actual_end: new Date(),
        duration_minutes: 30,
        platform: 'ZOOM',
        external_session_id: 'zoom-123',
        client_join_url: 'https://zoom.us/j/123',
        coordinator_join_url: 'https://zoom.us/j/456',
        platform_metadata: null,
        call_purpose: 'Monthly check-in',
        coordinator_notes: null,
        client_notes: null,
        client_rating: 5,
        client_feedback: 'Great call',
        quality_metrics: null,
        captions_enabled: true,
        sign_language_interpreter: false,
        language_preference: 'en',
        created_at: new Date(),
        created_by: 'client-123',
        updated_at: new Date(),
        updated_by: 'client-123',
        deleted_at: null,
        deleted_by: null,
      };

      const entity = (repo as any).mapRowToEntity(row);

      expect(entity.id).toBe('session-123');
      expect(entity.callType).toBe('SCHEDULED');
      expect(entity.status).toBe('COMPLETED');
      expect(entity.clientRating).toBe(5);
    });

    it('should handle JSON fields', () => {
      const row = {
        id: 'session-123',
        client_id: 'client-123',
        coordinator_id: 'coordinator-123',
        organization_id: 'org-123',
        branch_id: 'branch-123',
        call_type: 'SCHEDULED',
        status: 'COMPLETED',
        scheduled_start: new Date(),
        scheduled_end: new Date(),
        actual_start: null,
        actual_end: null,
        duration_minutes: null,
        platform: 'ZOOM',
        external_session_id: null,
        client_join_url: null,
        coordinator_join_url: null,
        platform_metadata: JSON.stringify({ room: 'room-123' }),
        quality_metrics: JSON.stringify({ audioQuality: 5 }),
        call_purpose: null,
        coordinator_notes: null,
        client_notes: null,
        client_rating: null,
        client_feedback: null,
        captions_enabled: false,
        sign_language_interpreter: false,
        language_preference: null,
        created_at: new Date(),
        created_by: 'client-123',
        updated_at: new Date(),
        updated_by: 'client-123',
        deleted_at: null,
        deleted_by: null,
      };

      const entity = (repo as any).mapRowToEntity(row);

      expect(entity.platformMetadata).toBeDefined();
      expect(entity.qualityMetrics).toBeDefined();
    });
  });

  describe('mapEntityToRow', () => {
    it('should map entity to database row', () => {
      const entity = {
        clientId: 'client-123',
        coordinatorId: 'coordinator-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        callType: 'SCHEDULED' as const,
        status: 'SCHEDULED' as const,
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        captionsEnabled: true,
        signLanguageInterpreter: false,
        platformMetadata: { room: 'room-123' },
      };

      const row = (repo as any).mapEntityToRow(entity);

      expect(row.client_id).toBe('client-123');
      expect(row.call_type).toBe('SCHEDULED');
      expect(row.platform_metadata).toBeDefined();
    });

    it('should handle null JSON fields', () => {
      const entity = {
        clientId: 'client-123',
        coordinatorId: 'coordinator-123',
        organizationId: 'org-123',
        branchId: 'branch-123',
        callType: 'ON_DEMAND' as const,
        status: 'ACTIVE' as const,
        captionsEnabled: false,
        signLanguageInterpreter: false,
        platformMetadata: null,
        qualityMetrics: null,
      };

      const row = (repo as any).mapEntityToRow(entity);

      expect(row.platform_metadata).toBeNull();
      expect(row.quality_metrics).toBeNull();
    });
  });
});
