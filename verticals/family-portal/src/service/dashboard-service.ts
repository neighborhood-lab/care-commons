/**
 * Dashboard Service
 *
 * Aggregates data for the family portal dashboard
 */

import { UUID } from '@care-commons/core';
import type {
  FamilyDashboard,
  ClientSummary,
  CarePlanSummary,
  VisitSummary,
  TimelineEvent,
  FamilyMember,
} from '../types/index.js';
import { NotificationService } from './notification-service.js';

export class DashboardService {
  constructor(
    private notificationService: NotificationService
    // TODO: Add repositories for clients, care plans, visits when integrating
  ) {}

  /**
   * Get complete dashboard data for a family member
   */
  async getDashboard(familyMember: FamilyMember): Promise<FamilyDashboard> {
    // Fetch data in parallel
    const [client, carePlan, recentVisits, upcomingVisits, notifications, timeline] =
      await Promise.all([
        this.getClientSummary(familyMember.clientId),
        this.getCarePlanSummary(familyMember.clientId),
        this.getRecentVisits(familyMember.clientId, 5),
        this.getUpcomingVisits(familyMember.clientId, 5),
        this.notificationService.getNotificationSummary(familyMember.id),
        this.getTimeline(familyMember.clientId, 10),
      ]);

    return {
      client,
      carePlan,
      recentVisits,
      upcomingVisits,
      notifications: {
        unreadCount: notifications.unread,
        urgentCount: notifications.urgent.length,
        recentNotifications: notifications.urgent.slice(0, 5).map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          priority: n.priority,
          createdAt: n.createdAt,
          isRead: n.readAt !== null && n.readAt !== undefined,
        })),
      },
      quickActions: this.getQuickActions(familyMember),
      timeline,
    };
  }

  /**
   * Get client summary
   */
  private async getClientSummary(clientId: UUID): Promise<ClientSummary> {
    // TODO: Fetch from client repository when available
    // This is a placeholder implementation
    return {
      id: clientId,
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: new Date('1945-03-15'),
      age: 79,
      primaryAddress: {
        line1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
      },
      primaryPhone: {
        number: '555-0100',
        type: 'HOME',
      },
      status: 'ACTIVE',
      programs: [
        {
          name: 'Home Care Services',
          status: 'ACTIVE',
        },
      ],
    };
  }

  /**
   * Get care plan summary
   */
  private async getCarePlanSummary(clientId: UUID): Promise<CarePlanSummary> {
    // TODO: Fetch from care plan repository when available
    return {
      id: 'care-plan-1',
      name: 'Primary Care Plan',
      status: 'ACTIVE',
      effectiveDate: new Date('2024-01-01'),
      reviewDate: new Date('2024-12-31'),
      goalsTotal: 5,
      goalsAchieved: 2,
      goalsInProgress: 3,
      goalsProgress: 40,
      lastUpdated: new Date(),
      recentChanges: [
        {
          date: new Date(),
          type: 'goal_updated',
          description: 'Updated mobility goal progress',
        },
      ],
    };
  }

  /**
   * Get recent visits
   */
  private async getRecentVisits(clientId: UUID, limit: number): Promise<VisitSummary[]> {
    // TODO: Fetch from visits repository when available
    return [
      {
        id: 'visit-1',
        scheduledStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
        actualStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        actualEndTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
        status: 'COMPLETED',
        caregiver: {
          id: 'caregiver-1',
          firstName: 'Maria',
          lastName: 'Garcia',
          phone: '555-0200',
        },
        visitType: 'Personal Care',
        services: ['Bathing', 'Medication Reminder', 'Meal Preparation'],
        summary: 'Visit completed successfully. Client in good spirits.',
        tasksCompleted: 8,
        tasksTotal: 8,
      },
    ];
  }

  /**
   * Get upcoming visits
   */
  private async getUpcomingVisits(clientId: UUID, limit: number): Promise<VisitSummary[]> {
    // TODO: Fetch from visits repository when available
    return [
      {
        id: 'visit-2',
        scheduledStartTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        scheduledEndTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        caregiver: {
          id: 'caregiver-1',
          firstName: 'Maria',
          lastName: 'Garcia',
          phone: '555-0200',
        },
        visitType: 'Personal Care',
        services: ['Bathing', 'Medication Reminder', 'Meal Preparation'],
      },
    ];
  }

  /**
   * Get timeline events
   */
  private async getTimeline(clientId: UUID, limit: number): Promise<TimelineEvent[]> {
    // TODO: Aggregate from multiple sources when repositories available
    return [
      {
        id: 'event-1',
        timestamp: new Date(),
        type: 'VISIT_COMPLETED',
        title: 'Visit Completed',
        description: 'Maria Garcia completed the scheduled visit',
        icon: 'check-circle',
        color: 'green',
        relatedEntity: {
          type: 'visit',
          id: 'visit-1',
        },
      },
      {
        id: 'event-2',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        type: 'CARE_PLAN_UPDATED',
        title: 'Care Plan Updated',
        description: 'Care plan was reviewed and updated',
        icon: 'file-text',
        color: 'blue',
        relatedEntity: {
          type: 'care_plan',
          id: 'care-plan-1',
        },
      },
    ];
  }

  /**
   * Get quick actions based on permissions
   */
  private getQuickActions(familyMember: FamilyMember) {
    const actions = [
      {
        id: 'view-care-plan',
        label: 'View Care Plan',
        description: 'Review current care plan and goals',
        icon: 'file-text',
        url: '/care-plan',
        enabled: familyMember.permissions.includes('VIEW_CARE_PLAN'),
        requiresPermission: 'VIEW_CARE_PLAN',
      },
      {
        id: 'view-visits',
        label: 'View Visits',
        description: 'See recent and upcoming visits',
        icon: 'calendar',
        url: '/visits',
        enabled: familyMember.permissions.includes('VIEW_VISITS'),
        requiresPermission: 'VIEW_VISITS',
      },
      {
        id: 'chat-support',
        label: 'Chat with AI Assistant',
        description: 'Get answers to your questions',
        icon: 'message-circle',
        url: '/chat',
        enabled: familyMember.permissions.includes('USE_CHATBOT'),
        requiresPermission: 'USE_CHATBOT',
      },
      {
        id: 'message-staff',
        label: 'Message Staff',
        description: 'Send a message to care team',
        icon: 'mail',
        url: '/messages',
        enabled: familyMember.permissions.includes('MESSAGE_STAFF'),
        requiresPermission: 'MESSAGE_STAFF',
      },
    ];

    return actions.filter((action) => action.enabled);
  }
}
