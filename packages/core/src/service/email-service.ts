/**
 * @care-commons/core - Email Service
 * 
 * Email delivery service using Resend for transactional emails
 * 
 * Features:
 * - Team invitation emails
 * - Welcome emails for new users
 * - Password reset emails
 * - Email verification
 * - Subscription notifications
 * 
 * Configuration:
 * - Requires RESEND_API_KEY environment variable
 * - From address: noreply@care-commons.com
 * - Reply-to: support@care-commons.com
 */

import { Resend } from 'resend';

export interface SendInvitationEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  inviterName: string;
  organizationName: string;
  invitationToken: string;
  expiresAt: Date;
}

export interface SendWelcomeEmailRequest {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
}

export interface SendPasswordResetEmailRequest {
  recipientEmail: string;
  recipientName: string;
  resetToken: string;
  expiresAt: Date;
}

export interface SendEmailVerificationRequest {
  recipientEmail: string;
  recipientName: string;
  verificationToken: string;
  expiresAt: Date;
}

export interface SendSubscriptionNotificationRequest {
  recipientEmail: string;
  recipientName: string;
  organizationName: string;
  notificationType: 'trial_ending' | 'subscription_renewed' | 'subscription_cancelled' | 'payment_failed' | 'usage_limit_warning';
  details: Record<string, unknown>;
}

export interface EmailServiceConfig {
  apiKey: string;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
  baseUrl?: string;
}

export interface IEmailService {
  sendInvitation(request: SendInvitationEmailRequest): Promise<void>;
  sendWelcome(request: SendWelcomeEmailRequest): Promise<void>;
  sendPasswordReset(request: SendPasswordResetEmailRequest): Promise<void>;
  sendEmailVerification(request: SendEmailVerificationRequest): Promise<void>;
  sendSubscriptionNotification(request: SendSubscriptionNotificationRequest): Promise<void>;
}

export class EmailService implements IEmailService {
  private resend: Resend | null;
  private fromAddress: string;
  private fromName: string;
  private replyTo: string;
  private baseUrl: string;

  constructor(config: EmailServiceConfig) {
    // Initialize Resend client if API key is provided
    this.resend = (config.apiKey != null && config.apiKey !== '') ? new Resend(config.apiKey) : null;
    this.fromAddress = config.fromAddress ?? 'noreply@care-commons.com';
    this.fromName = config.fromName ?? 'Care Commons';
    this.replyTo = config.replyTo ?? 'support@care-commons.com';
    this.baseUrl = config.baseUrl ?? 'https://care-commons.com';

    if (this.resend === null) {
      console.warn('[EmailService] No RESEND_API_KEY provided. Emails will be logged but not sent.');
    }
  }

  async sendInvitation(request: SendInvitationEmailRequest): Promise<void> {
    const invitationUrl = `${this.baseUrl}/accept-invitation?token=${request.invitationToken}`;
    const expiresInHours = Math.ceil((request.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));

    const html = this.generateInvitationEmail({
      recipientName: request.recipientName ?? request.recipientEmail,
      inviterName: request.inviterName,
      organizationName: request.organizationName,
      invitationUrl,
      expiresInHours,
    });

    await this.sendEmail({
      to: request.recipientEmail,
      subject: `You've been invited to join ${request.organizationName} on Care Commons`,
      html,
    });
  }

  async sendWelcome(request: SendWelcomeEmailRequest): Promise<void> {
    const html = this.generateWelcomeEmail({
      recipientName: request.recipientName,
      organizationName: request.organizationName,
      loginUrl: `${this.baseUrl}/login`,
    });

    await this.sendEmail({
      to: request.recipientEmail,
      subject: `Welcome to ${request.organizationName} on Care Commons!`,
      html,
    });
  }

  async sendPasswordReset(request: SendPasswordResetEmailRequest): Promise<void> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${request.resetToken}`;
    const expiresInMinutes = Math.ceil((request.expiresAt.getTime() - Date.now()) / (1000 * 60));

    const html = this.generatePasswordResetEmail({
      recipientName: request.recipientName,
      resetUrl,
      expiresInMinutes,
    });

    await this.sendEmail({
      to: request.recipientEmail,
      subject: 'Reset your Care Commons password',
      html,
    });
  }

  async sendEmailVerification(request: SendEmailVerificationRequest): Promise<void> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${request.verificationToken}`;
    const expiresInHours = Math.ceil((request.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));

    const html = this.generateEmailVerificationEmail({
      recipientName: request.recipientName,
      verificationUrl,
      expiresInHours,
    });

    await this.sendEmail({
      to: request.recipientEmail,
      subject: 'Verify your email address for Care Commons',
      html,
    });
  }

  async sendSubscriptionNotification(request: SendSubscriptionNotificationRequest): Promise<void> {
    let html: string;
    let subject: string;

    switch (request.notificationType) {
      case 'trial_ending':
        subject = `Your Care Commons trial is ending soon`;
        html = this.generateTrialEndingEmail({
          recipientName: request.recipientName,
          organizationName: request.organizationName,
          daysRemaining: request.details.daysRemaining as number,
          billingUrl: `${this.baseUrl}/settings/billing`,
        });
        break;
      
      case 'subscription_renewed':
        subject = `Your Care Commons subscription has been renewed`;
        html = this.generateSubscriptionRenewedEmail({
          recipientName: request.recipientName,
          organizationName: request.organizationName,
          planName: request.details.planName as string,
          amount: request.details.amount as number,
          nextBillingDate: new Date(request.details.nextBillingDate as string),
        });
        break;
      
      case 'subscription_cancelled':
        subject = `Your Care Commons subscription has been cancelled`;
        html = this.generateSubscriptionCancelledEmail({
          recipientName: request.recipientName,
          organizationName: request.organizationName,
          endDate: new Date(request.details.endDate as string),
        });
        break;
      
      case 'payment_failed':
        subject = `Payment failed for your Care Commons subscription`;
        html = this.generatePaymentFailedEmail({
          recipientName: request.recipientName,
          organizationName: request.organizationName,
          amount: request.details.amount as number,
          reason: request.details.reason as string,
          retryDate: new Date(request.details.retryDate as string),
          billingUrl: `${this.baseUrl}/settings/billing`,
        });
        break;
      
      case 'usage_limit_warning':
        subject = `You're approaching your usage limits on Care Commons`;
        html = this.generateUsageLimitWarningEmail({
          recipientName: request.recipientName,
          organizationName: request.organizationName,
          limitType: request.details.limitType as string,
          currentUsage: request.details.currentUsage as number,
          limit: request.details.limit as number,
          percentage: request.details.percentage as number,
          upgradeUrl: `${this.baseUrl}/settings/billing`,
        });
        break;
      
      default:
        throw new Error(`Unknown notification type: ${request.notificationType}`);
    }

    await this.sendEmail({
      to: request.recipientEmail,
      subject,
      html,
    });
  }

  private async sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
    if (this.resend === null) {
      console.log('[EmailService] Email would be sent:', {
        to: params.to,
        subject: params.subject,
        from: `${this.fromName} <${this.fromAddress}>`,
      });
      return;
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromAddress}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        replyTo: this.replyTo,
      });

      console.log('[EmailService] Email sent successfully:', {
        to: params.to,
        subject: params.subject,
        messageId: result.data?.id,
      });
    } catch (error) {
      console.error('[EmailService] Failed to send email:', {
        to: params.to,
        subject: params.subject,
        error,
      });
      throw error;
    }
  }

  // Email template generators

  private generateInvitationEmail(params: {
    recipientName: string;
    inviterName: string;
    organizationName: string;
    invitationUrl: string;
    expiresInHours: number;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #1f2937;">You've been invited!</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.organizationName}</strong> on Care Commons.</p>
    
    <p>Care Commons is a home healthcare management platform that helps organizations deliver better care while staying compliant with state and federal regulations.</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.invitationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Accept Invitation</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      This invitation will expire in ${params.expiresInHours} hours. If you didn't expect this invitation, you can safely ignore this email.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${params.invitationUrl}" style="color: #2563eb; word-break: break-all;">${params.invitationUrl}</a>
    </p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
    <p>
      <a href="${this.baseUrl}" style="color: #2563eb; text-decoration: none;">Visit our website</a> |
      <a href="${this.baseUrl}/support" style="color: #2563eb; text-decoration: none;">Get support</a>
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateWelcomeEmail(params: {
    recipientName: string;
    organizationName: string;
    loginUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Care Commons</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #1f2937;">Welcome to Care Commons!</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p>Welcome to <strong>${params.organizationName}</strong> on Care Commons! We're excited to have you on board.</p>
    
    <p>Care Commons helps home healthcare organizations:</p>
    <ul>
      <li>Manage clients, caregivers, and visits</li>
      <li>Track Electronic Visit Verification (EVV)</li>
      <li>Stay compliant with state regulations</li>
      <li>Streamline billing and payroll</li>
      <li>Engage families in care delivery</li>
    </ul>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.loginUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Log In to Get Started</a>
    </div>
    
    <p>If you have any questions or need help getting started, our support team is here to help at <a href="mailto:${this.replyTo}" style="color: #2563eb;">${this.replyTo}</a>.</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generatePasswordResetEmail(params: {
    recipientName: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #1f2937;">Reset your password</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p>We received a request to reset your password for your Care Commons account.</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      This link will expire in ${params.expiresInMinutes} minutes. If you didn't request a password reset, you can safely ignore this email.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${params.resetUrl}" style="color: #2563eb; word-break: break-all;">${params.resetUrl}</a>
    </p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateEmailVerificationEmail(params: {
    recipientName: string;
    verificationUrl: string;
    expiresInHours: number;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #1f2937;">Verify your email address</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p>Thank you for signing up for Care Commons! Please verify your email address to complete your registration.</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.verificationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email Address</a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      This link will expire in ${params.expiresInHours} hours.
    </p>
    
    <p style="font-size: 14px; color: #6b7280;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${params.verificationUrl}" style="color: #2563eb; word-break: break-all;">${params.verificationUrl}</a>
    </p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateTrialEndingEmail(params: {
    recipientName: string;
    organizationName: string;
    daysRemaining: number;
    billingUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your trial is ending soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #1f2937;">Your trial is ending in ${params.daysRemaining} days</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p>Your trial for <strong>${params.organizationName}</strong> on Care Commons will end in ${params.daysRemaining} days.</p>
    
    <p>To continue using Care Commons without interruption, please update your billing information.</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.billingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Update Billing</a>
    </div>
    
    <p>If you have any questions about pricing or need help choosing the right plan, contact us at <a href="mailto:${this.replyTo}" style="color: #2563eb;">${this.replyTo}</a>.</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateSubscriptionRenewedEmail(params: {
    recipientName: string;
    organizationName: string;
    planName: string;
    amount: number;
    nextBillingDate: Date;
  }): string {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(params.amount / 100);

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(params.nextBillingDate);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Renewed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #1f2937;">Your subscription has been renewed</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p>Your <strong>${params.planName}</strong> subscription for <strong>${params.organizationName}</strong> has been successfully renewed.</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Amount charged:</strong> ${formattedAmount}</p>
      <p style="margin: 0;"><strong>Next billing date:</strong> ${formattedDate}</p>
    </div>
    
    <p>Thank you for being a valued Care Commons customer!</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateSubscriptionCancelledEmail(params: {
    recipientName: string;
    organizationName: string;
    endDate: Date;
  }): string {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(params.endDate);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #1f2937;">Your subscription has been cancelled</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p>Your subscription for <strong>${params.organizationName}</strong> has been cancelled.</p>
    
    <p>You will continue to have access to Care Commons until <strong>${formattedDate}</strong>.</p>
    
    <p>We're sorry to see you go! If you have feedback on how we can improve, please let us know at <a href="mailto:${this.replyTo}" style="color: #2563eb;">${this.replyTo}</a>.</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generatePaymentFailedEmail(params: {
    recipientName: string;
    organizationName: string;
    amount: number;
    reason: string;
    retryDate: Date;
    billingUrl: string;
  }): string {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(params.amount / 100);

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(params.retryDate);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #dc2626;">Payment failed</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p>We were unable to process your payment for <strong>${params.organizationName}</strong>.</p>
    
    <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
      <p style="margin: 0 0 10px 0;"><strong>Reason:</strong> ${params.reason}</p>
      <p style="margin: 0;"><strong>Retry date:</strong> ${formattedDate}</p>
    </div>
    
    <p>To avoid interruption of service, please update your payment method.</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.billingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Update Payment Method</a>
    </div>
    
    <p>If you have questions, contact us at <a href="mailto:${this.replyTo}" style="color: #2563eb;">${this.replyTo}</a>.</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }

  private generateUsageLimitWarningEmail(params: {
    recipientName: string;
    organizationName: string;
    limitType: string;
    currentUsage: number;
    limit: number;
    percentage: number;
    upgradeUrl: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approaching Usage Limits</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px; color: #2563eb;">Care Commons</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="margin-top: 0; color: #d97706;">You're approaching your usage limits</h2>
    
    <p>Hi ${params.recipientName},</p>
    
    <p><strong>${params.organizationName}</strong> has reached <strong>${params.percentage}%</strong> of your ${params.limitType} limit.</p>
    
    <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Current usage:</strong> ${params.currentUsage} of ${params.limit} ${params.limitType}</p>
    </div>
    
    <p>Consider upgrading your plan to avoid hitting your limits.</p>
    
    <div style="margin: 30px 0; text-align: center;">
      <a href="${params.upgradeUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Upgrade Plan</a>
    </div>
    
    <p>Questions? Contact us at <a href="mailto:${this.replyTo}" style="color: #2563eb;">${this.replyTo}</a>.</p>
  </div>
  
  <div style="margin-top: 20px; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>Care Commons - Shared care software, community owned</p>
  </div>
</body>
</html>
    `.trim();
  }
}

/**
 * Create email service instance
 */
export function createEmailService(config?: Partial<EmailServiceConfig>): EmailService {
  const apiKey = config?.apiKey ?? process.env.RESEND_API_KEY ?? '';
  const baseUrl = config?.baseUrl ?? process.env.BASE_URL ?? 'https://care-commons.com';

  return new EmailService({
    apiKey,
    fromAddress: config?.fromAddress,
    fromName: config?.fromName,
    replyTo: config?.replyTo,
    baseUrl,
  });
}
