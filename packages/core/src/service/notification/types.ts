/**
 * Notification Service Types
 *
 * Defines types and interfaces for the notification delivery system
 */

export type NotificationChannel = 'email' | 'sms' | 'push';
export type NotificationPriority = 'low' | 'normal' | 'high';
export type DigestFrequency = 'immediate' | 'daily' | 'weekly' | 'never';

/**
 * Notification template identifiers
 */
export enum NotificationTemplate {
  VISIT_SCHEDULED = 'visit-scheduled',
  VISIT_STARTED = 'visit-started',
  VISIT_COMPLETED = 'visit-completed',
  VISIT_MISSED = 'visit-missed',
  MESSAGE_RECEIVED = 'message-received',
  CARE_PLAN_UPDATED = 'care-plan-updated',
  WEEKLY_DIGEST = 'weekly-digest',
  EMERGENCY_ALERT = 'emergency-alert',
}

/**
 * Email notification parameters
 */
export interface EmailNotificationParams {
  to: string;
  subject: string;
  template: NotificationTemplate;
  data: Record<string, any>;
  priority: NotificationPriority;
}

/**
 * SMS notification parameters
 */
export interface SMSNotificationParams {
  to: string;
  message: string;
  priority: NotificationPriority;
}

/**
 * Push notification parameters
 */
export interface PushNotificationParams {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
}

/**
 * Notification delivery result
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  provider: NotificationChannel;
}

/**
 * Generic notification request
 */
export interface NotificationRequest {
  userId: number;
  type: string;
  priority: NotificationPriority;
  template: NotificationTemplate;
  data: Record<string, any>;
  subject?: string;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  // Channel preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;

  // Contact information
  email?: string;
  phoneNumber?: string;
  pushTokens: string[];

  // Type-specific preferences
  visitUpdatesEmail: boolean;
  visitUpdatesSms: boolean;
  visitUpdatesPush: boolean;

  messagesEmail: boolean;
  messagesSms: boolean;
  messagesPush: boolean;

  carePlanUpdatesEmail: boolean;
  carePlanUpdatesSms: boolean;
  carePlanUpdatesPush: boolean;

  emergencyAlertsEmail: boolean;
  emergencyAlertsSms: boolean;
  emergencyAlertsPush: boolean;

  // Digest settings
  digestFrequency: DigestFrequency;
  digestTime: string; // HH:mm format
  digestDayOfWeek: number; // 0-6 (Sunday-Saturday)

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
}

/**
 * Email provider interface
 */
export interface IEmailProvider {
  send(params: EmailNotificationParams): Promise<NotificationResult>;
}

/**
 * SMS provider interface
 */
export interface ISMSProvider {
  send(params: SMSNotificationParams): Promise<NotificationResult>;
}

/**
 * Push notification provider interface
 */
export interface IPushProvider {
  send(params: PushNotificationParams): Promise<NotificationResult>;
}

/**
 * Main notification service interface
 */
export interface INotificationService {
  sendEmail(params: EmailNotificationParams): Promise<NotificationResult>;
  sendSMS(params: SMSNotificationParams): Promise<NotificationResult>;
  sendPush(params: PushNotificationParams): Promise<NotificationResult>;
  sendBatch(notifications: NotificationRequest[]): Promise<NotificationResult[]>;
  scheduleDigest(userId: string, frequency: DigestFrequency): Promise<void>;
}

/**
 * Template data interfaces for type safety
 */
export interface VisitScheduledData {
  familyMemberName: string;
  clientName: string;
  visitDate: string;
  visitTime: string;
  caregiverName: string;
  duration: string;
  portalUrl: string;
  visitId: string;
  agencyName: string;
}

export interface VisitStartedData {
  familyMemberName: string;
  clientName: string;
  caregiverName: string;
  startTime: string;
  portalUrl: string;
  visitId: string;
  agencyName: string;
}

export interface VisitCompletedData {
  familyMemberName: string;
  clientName: string;
  caregiverName: string;
  completedTime: string;
  duration: string;
  portalUrl: string;
  visitId: string;
  agencyName: string;
}

export interface VisitMissedData {
  familyMemberName: string;
  clientName: string;
  scheduledDate: string;
  scheduledTime: string;
  caregiverName: string;
  portalUrl: string;
  visitId: string;
  agencyName: string;
}

export interface MessageReceivedData {
  familyMemberName: string;
  senderName: string;
  messagePreview: string;
  portalUrl: string;
  threadId: string;
  agencyName: string;
}

export interface CarePlanUpdatedData {
  familyMemberName: string;
  clientName: string;
  updateSummary: string;
  updatedBy: string;
  portalUrl: string;
  carePlanId: string;
  agencyName: string;
}

export interface EmergencyAlertData {
  familyMemberName: string;
  clientName: string;
  alertType: string;
  alertMessage: string;
  contactNumber: string;
  agencyName: string;
}
