/**
 * SendGrid Email Provider
 *
 * Handles email delivery using SendGrid
 */

import sgMail from '@sendgrid/mail';
import Handlebars from 'handlebars';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error - html-to-text doesn't have proper type definitions
import { convert } from 'html-to-text';
import type {
  IEmailProvider,
  EmailNotificationParams,
  NotificationResult,
} from '../types.js';
import { NotificationTemplate } from '../types.js';
import { logger } from '../../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * SendGrid email provider implementation
 */
export class SendGridProvider implements IEmailProvider {
  private fromEmail: string;
  private fromName: string;
  private templates: Map<NotificationTemplate, Handlebars.TemplateDelegate> = new Map();

  constructor(apiKey: string, fromEmail: string, fromName = 'Care Commons') {
    sgMail.setApiKey(apiKey);
    this.fromEmail = fromEmail;
    this.fromName = fromName;
    this.loadTemplates();
  }

  /**
   * Load and compile Handlebars templates
   */
  private loadTemplates(): void {
    const templateDir = join(__dirname, '../templates');
    const templates = [
      NotificationTemplate.VISIT_SCHEDULED,
      NotificationTemplate.VISIT_STARTED,
      NotificationTemplate.VISIT_COMPLETED,
      NotificationTemplate.VISIT_MISSED,
      NotificationTemplate.MESSAGE_RECEIVED,
      NotificationTemplate.CARE_PLAN_UPDATED,
      NotificationTemplate.WEEKLY_DIGEST,
      NotificationTemplate.EMERGENCY_ALERT,
    ];

    for (const template of templates) {
      try {
        const templatePath = join(templateDir, `${template}.hbs`);
        const templateSource = readFileSync(templatePath, 'utf-8');
        const compiled = Handlebars.compile(templateSource);
        this.templates.set(template, compiled);
      } catch (error) {
        logger.error({ error, template }, 'Failed to load email template');
      }
    }
  }

  /**
   * Render an email template with data
   */
  private renderTemplate(template: NotificationTemplate, data: Record<string, unknown>): string {
    const compiled = this.templates.get(template);
    if (!compiled) {
      throw new Error(`Template not found: ${template}`);
    }
    return compiled(data);
  }

  /**
   * Send an email notification
   */
  async send(params: EmailNotificationParams): Promise<NotificationResult> {
    try {
      const html = this.renderTemplate(params.template, params.data);
      const text = convert(html, {
        wordwrap: 80,
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
          { selector: 'img', format: 'skip' },
        ],
      });

      const msg = {
        to: params.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: params.subject,
        html,
        text,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
        // Set category for analytics
        categories: [params.template, params.priority],
      };

      const [response] = await sgMail.send(msg);

      logger.info(
        {
          to: params.to,
          template: params.template,
          messageId: response.headers['x-message-id'],
        },
        'Email sent successfully'
      );

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        provider: 'email',
      };
    } catch (error) {
      logger.error(
        {
          error,
          to: params.to,
          template: params.template,
        },
        'Failed to send email'
      );

      return {
        success: false,
        error: error as Error,
        provider: 'email',
      };
    }
  }
}
