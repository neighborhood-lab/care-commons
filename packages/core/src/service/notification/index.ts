/**
 * Notification Service Module
 *
 * Exports notification service and types
 */

export { NotificationService, createNotificationService } from './notification-service.js';
export { NotificationDeliveryManager } from './delivery-manager.js';
export { SendGridProvider } from './providers/sendgrid-provider.js';
export { TwilioProvider } from './providers/twilio-provider.js';
export { ExpoPushProvider } from './providers/expo-provider.js';
export { NotificationTemplate } from './types.js';
export type {
  NotificationChannel,
  NotificationPriority,
  DigestFrequency,
  EmailNotificationParams,
  SMSNotificationParams,
  PushNotificationParams,
  NotificationResult,
  NotificationRequest,
  NotificationPreferences,
  IEmailProvider,
  ISMSProvider,
  IPushProvider,
  INotificationService,
  VisitScheduledData,
  VisitStartedData,
  VisitCompletedData,
  VisitMissedData,
  MessageReceivedData,
  CarePlanUpdatedData,
  EmergencyAlertData,
} from './types.js';
