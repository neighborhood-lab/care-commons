/**
 * @care-commons/core - Email Templates Types
 *
 * Customizable email template types for white-labeling
 */

import { UUID, Entity } from './base';

/**
 * Email template status
 */
export type EmailTemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

/**
 * Email template entity
 */
export interface EmailTemplate extends Entity {
  organizationId: UUID | null; // null = global/default template

  // Template identification
  templateKey: string; // e.g., 'welcome', 'password_reset'
  templateName: string;
  description: string | null;

  // Email content
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  previewText: string | null;

  // Template variables
  availableVariables: string[] | null;
  defaultValues: Record<string, string> | null;

  // Sender configuration
  fromName: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;

  // Attachments
  attachments: EmailAttachment[] | null;

  // Layout and styling
  customCss: string | null;
  useOrgBranding: boolean;

  // Localization
  language: string;
  locale: string;

  // Status and versioning
  status: EmailTemplateStatus;
  templateVersion: number;
  isDefault: boolean;

  // Testing
  lastTestedAt: Date | null;
  lastTestedBy: UUID | null;
  testNotes: string | null;

  // Usage tracking
  sentCount: number;
  lastSentAt: Date | null;
}

/**
 * Email attachment configuration
 */
export interface EmailAttachment {
  filename: string;
  contentType: string;
  url?: string; // URL to download attachment
  content?: string; // Base64-encoded content
  inline?: boolean; // Inline attachment (e.g., for images in HTML)
  cid?: string; // Content-ID for inline images
}

/**
 * Create email template request
 */
export interface CreateEmailTemplateRequest {
  organizationId?: UUID; // Omit for global template
  templateKey: string;
  templateName: string;
  description?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  previewText?: string;
  availableVariables?: string[];
  defaultValues?: Record<string, string>;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  attachments?: EmailAttachment[];
  customCss?: string;
  useOrgBranding?: boolean;
  language?: string;
  locale?: string;
  status?: EmailTemplateStatus;
}

/**
 * Update email template request
 */
export interface UpdateEmailTemplateRequest {
  templateName?: string;
  description?: string;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  previewText?: string;
  availableVariables?: string[];
  defaultValues?: Record<string, string>;
  fromName?: string;
  fromEmail?: string;
  replyToEmail?: string;
  attachments?: EmailAttachment[];
  customCss?: string;
  useOrgBranding?: boolean;
  language?: string;
  locale?: string;
  status?: EmailTemplateStatus;
}

/**
 * Email template variables for rendering
 */
export interface EmailTemplateVariables {
  [key: string]: string | number | boolean | Date | null | undefined;
}

/**
 * Rendered email ready to send
 */
export interface RenderedEmail {
  to: string | string[];
  from: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  previewText?: string;
  attachments?: EmailAttachment[];
}

/**
 * Email send request
 */
export interface SendEmailRequest {
  templateKey: string;
  to: string | string[];
  variables: EmailTemplateVariables;
  attachments?: EmailAttachment[];
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

/**
 * Email test request
 */
export interface TestEmailRequest {
  templateId: UUID;
  testRecipient: string;
  testVariables?: EmailTemplateVariables;
  notes?: string;
}

/**
 * Well-known email template keys
 */
export enum EmailTemplateKey {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  TEAM_INVITATION = 'team_invitation',
  VISIT_REMINDER = 'visit_reminder',
  VISIT_CONFIRMATION = 'visit_confirmation',
  VISIT_CANCELLATION = 'visit_cancellation',
  TIMESHEET_APPROVAL = 'timesheet_approval',
  INVOICE_READY = 'invoice_ready',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  CARE_PLAN_UPDATED = 'care_plan_updated',
  INCIDENT_REPORT = 'incident_report',
  ACCOUNT_LOCKED = 'account_locked',
  TWO_FACTOR_CODE = 'two_factor_code',
  NOTIFICATION_DIGEST = 'notification_digest',
}
