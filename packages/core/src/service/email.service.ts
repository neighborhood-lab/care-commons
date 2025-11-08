/**
 * @care-commons/core - Email Service
 *
 * Service for sending emails with customizable templates
 * Supports white-label branding per organization
 */

import { Database } from '../db/connection';
import { UUID } from '../types/base';
import { EmailTemplateKey } from '../types/white-label';
import { EmailTemplateRepository } from '../repository/email-template-repository';
import { BrandingRepository } from '../repository/branding-repository';

export interface SendEmailOptions {
  to: string | string[];
  organizationId: UUID | null;
  templateKey: EmailTemplateKey;
  variables: Record<string, string>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailProvider {
  sendEmail(options: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<void>;
}

/**
 * Console-only email provider for testing/development
 */
export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(options: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    console.log('=== EMAIL ===');
    console.log('From:', options.from);
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html.substring(0, 200) + '...');
    if (options.text) {
      console.log('Text:', options.text.substring(0, 200) + '...');
    }
    console.log('=============');
  }
}

/**
 * Email service with template support
 */
export class EmailService {
  private templateRepo: EmailTemplateRepository;
  private brandingRepo: BrandingRepository;

  constructor(
    db: Database,
    private provider: EmailProvider = new ConsoleEmailProvider()
  ) {
    this.templateRepo = new EmailTemplateRepository(db);
    this.brandingRepo = new BrandingRepository(db);
  }

  /**
   * Send email using a template
   */
  async sendTemplatedEmail(options: SendEmailOptions): Promise<void> {
    // Get the template (org-specific or system default)
    const template = await this.templateRepo.getTemplateByKey(
      options.templateKey,
      options.organizationId
    );

    if (!template) {
      throw new Error(`Email template not found: ${options.templateKey}`);
    }

    // Get organization branding if applicable
    let branding = null;
    if (options.organizationId) {
      branding = await this.brandingRepo.getBrandingByOrganizationId(
        options.organizationId
      );
    }

    // Replace variables in subject and body
    const subject = this.replaceVariables(template.subject, options.variables);
    const htmlBody = this.replaceVariables(template.htmlBody, options.variables);
    const textBody = template.textBody
      ? this.replaceVariables(template.textBody, options.variables)
      : undefined;

    // Apply branding to HTML
    const brandedHtml = this.applyBranding(htmlBody, branding);

    // Determine from address
    const fromAddress =
      branding?.emailFromAddress ?? process.env.EMAIL_FROM_ADDRESS ?? 'noreply@example.com';

    const fromName =
      branding?.emailFromName ?? branding?.brandName ?? 'Care Commons';

    const from = `${fromName} <${fromAddress}>`;

    // Send the email
    await this.provider.sendEmail({
      from,
      to: options.to,
      subject,
      html: brandedHtml,
      text: textBody,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    });
  }

  /**
   * Replace template variables {{variable}} with actual values
   */
  private replaceVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Apply organization branding to email HTML
   */
  private applyBranding(
    html: string,
    branding: {
      logoUrl: string | null;
      primaryColor: string;
      emailHeaderColor: string;
      emailFooterText: string | null;
      brandName: string | null;
    } | null
  ): string {
    if (!branding) {
      return html;
    }

    // Wrap content with branded header and footer
    const headerColor = branding.emailHeaderColor;
    const logo = branding.logoUrl
      ? `<img src="${branding.logoUrl}" alt="${branding.brandName ?? 'Logo'}" style="max-height: 60px; margin: 20px 0;" />`
      : '';

    const brandedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 0;
    }
    .header {
      background-color: ${headerColor};
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 30px 20px;
    }
    .footer {
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    a {
      color: ${branding.primaryColor};
    }
  </style>
</head>
<body>
  <div class="header">
    ${logo}
  </div>
  <div class="content">
    ${html}
  </div>
  <div class="footer">
    ${branding.emailFooterText ?? ''}
  </div>
</body>
</html>
    `;

    return brandedHtml;
  }

  /**
   * Send a simple email without a template (direct send)
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
  }): Promise<void> {
    const from =
      options.from ??
      process.env.EMAIL_FROM_ADDRESS ??
      'noreply@example.com';

    await this.provider.sendEmail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc,
      bcc: options.bcc,
    });
  }
}

/**
 * SMTP Email Provider (for production use with services like SendGrid, AWS SES, etc.)
 * This is a placeholder - you would integrate with your actual email service
 */
export class SMTPEmailProvider implements EmailProvider {
  constructor(private config: {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }) {}

  async sendEmail(options: {
    from: string;
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<void> {
    // TODO: Implement actual SMTP sending using nodemailer or similar
    // For now, log to console
    console.log('SMTP Email would be sent:', {
      config: this.config,
      from: options.from,
      to: options.to,
      subject: options.subject,
    });

    // In production, you would use nodemailer or similar:
    // const transporter = nodemailer.createTransport(this.config);
    // await transporter.sendMail(options);
  }
}
