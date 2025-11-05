import type { UUID, Timestamp } from '@care-commons/core';

/**
 * Family Dashboard Data
 * Aggregated data for the family portal dashboard
 */
export interface FamilyDashboard {
  client: ClientSummary;
  carePlan: CarePlanSummary;
  recentVisits: VisitSummary[];
  upcomingVisits: VisitSummary[];
  notifications: NotificationsSummary;
  quickActions: QuickAction[];
  timeline: TimelineEvent[];
}

/**
 * Client Summary
 */
export interface ClientSummary {
  id: UUID;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  age: number;
  primaryAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  primaryPhone?: {
    number: string;
    type: string;
  };
  status: string;
  programs: Array<{
    name: string;
    status: string;
  }>;
}

/**
 * Care Plan Summary
 */
export interface CarePlanSummary {
  id: UUID;
  name: string;
  status: string;
  effectiveDate: Date;
  reviewDate?: Date;

  // Goals summary
  goalsTotal: number;
  goalsAchieved: number;
  goalsInProgress: number;
  goalsProgress: number; // percentage

  // Recent updates
  lastUpdated: Timestamp;
  recentChanges?: Array<{
    date: Timestamp;
    type: 'goal_added' | 'goal_updated' | 'goal_achieved' | 'intervention_added';
    description: string;
  }>;
}

/**
 * Visit Summary
 */
export interface VisitSummary {
  id: UUID;
  scheduledStartTime: Timestamp;
  scheduledEndTime: Timestamp;
  actualStartTime?: Timestamp;
  actualEndTime?: Timestamp;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

  // Caregiver info
  caregiver: {
    id: UUID;
    firstName: string;
    lastName: string;
    phone?: string;
  };

  // Visit details
  visitType: string;
  services: string[];

  // Notes (for completed visits)
  summary?: string;
  tasksCompleted?: number;
  tasksTotal?: number;
}

/**
 * Notifications Summary
 */
export interface NotificationsSummary {
  unreadCount: number;
  urgentCount: number;
  recentNotifications: Array<{
    id: UUID;
    type: string;
    title: string;
    message: string;
    priority: string;
    createdAt: Timestamp;
    isRead: boolean;
  }>;
}

/**
 * Quick Action
 */
export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  url: string;
  enabled: boolean;
  requiresPermission?: string;
}

/**
 * Timeline Event
 */
export interface TimelineEvent {
  id: UUID;
  timestamp: Timestamp;
  type: TimelineEventType;
  title: string;
  description: string;
  icon: string;
  color: string;
  relatedEntity?: {
    type: string;
    id: UUID;
  };
}

export type TimelineEventType =
  | 'VISIT_COMPLETED'
  | 'VISIT_SCHEDULED'
  | 'VISIT_CANCELLED'
  | 'CARE_PLAN_UPDATED'
  | 'GOAL_ACHIEVED'
  | 'MEDICATION_CHANGED'
  | 'DOCUMENT_ADDED'
  | 'NOTE_ADDED'
  | 'STATUS_CHANGED';

/**
 * Dashboard Preferences
 */
export interface DashboardPreferences {
  layout: 'default' | 'compact' | 'detailed';
  widgets: DashboardWidget[];
  defaultView: 'overview' | 'care_plan' | 'visits' | 'timeline';
  visitsToShow: number;
  timelineEventsToShow: number;
}

export interface DashboardWidget {
  id: string;
  type: 'client_info' | 'care_plan' | 'visits' | 'notifications' | 'timeline' | 'quick_actions' | 'chatbot';
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
  config?: Record<string, unknown>;
}

/**
 * Family Portal Statistics
 */
export interface PortalStatistics {
  // Overall stats
  totalVisits: number;
  completedVisits: number;
  upcomingVisits: number;

  // Care plan progress
  careGoalsTotal: number;
  careGoalsAchieved: number;
  careGoalsProgress: number;

  // Engagement
  lastLogin: Timestamp;
  loginCount: number;
  notificationsReceived: number;
  chatConversations: number;

  // Time periods
  period: {
    start: Date;
    end: Date;
  };
}
