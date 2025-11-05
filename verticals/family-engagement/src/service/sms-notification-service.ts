import twilio from 'twilio';
import type { Twilio } from 'twilio';
import type { UserContext } from '@care-commons/core';
import { FamilyMemberRepository } from '../repository/family-member-repository.js';
import { NotificationRepository } from '../repository/notification-repository.js';
import { MessageRepository } from '../repository/message-repository.js';
import type {
  FamilyMember,
  NotificationType,
  VisitContext,
} from '../types/family.js';

export interface SMSServiceConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class SMSNotificationService {
  private twilioClient: Twilio;
  private fromNumber: string;

  constructor(
    private config: SMSServiceConfig,
    private familyMemberRepository: FamilyMemberRepository,
    private notificationRepository: NotificationRepository,
    private messageRepository: MessageRepository
  ) {
    this.twilioClient = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
  }

  /**
   * Send visit start notification
   */
  async notifyVisitStart(
    familyMember: FamilyMember,
    visit: VisitContext,
    context: UserContext
  ): Promise<void> {
    if (!familyMember.notificationPreferences.visitStart) {
      return;
    }

    if (familyMember.preferredContactMethod !== 'SMS') {
      return;
    }

    if (!familyMember.phone) {
      return;
    }

    const message = this.formatVisitStartMessage(visit);

    await this.sendSMS({
      to: familyMember.phone,
      message,
      familyMemberId: familyMember.id,
      clientId: familyMember.clientId,
      organizationId: familyMember.organizationId,
      notificationType: 'VISIT_START',
      metadata: {
        visitId: visit.visitId,
        caregiverName: visit.caregiverName,
      },
      context,
    });
  }

  /**
   * Send visit end notification with summary
   */
  async notifyVisitEnd(
    familyMember: FamilyMember,
    visit: VisitContext,
    context: UserContext
  ): Promise<void> {
    if (!familyMember.notificationPreferences.visitEnd) {
      return;
    }

    if (familyMember.preferredContactMethod !== 'SMS') {
      return;
    }

    if (!familyMember.phone) {
      return;
    }

    const message = this.formatVisitEndMessage(visit);

    await this.sendSMS({
      to: familyMember.phone,
      message,
      familyMemberId: familyMember.id,
      clientId: familyMember.clientId,
      organizationId: familyMember.organizationId,
      notificationType: 'VISIT_END',
      metadata: {
        visitId: visit.visitId,
        duration: visit.duration,
        tasksCompleted: visit.tasksCompleted?.length || 0,
      },
      context,
    });
  }

  /**
   * Send interactive message (with reply options)
   */
  async sendInteractiveMessage(
    familyMember: FamilyMember,
    prompt: string,
    options: Array<{ label: string; value: string }>,
    context: UserContext
  ): Promise<void> {
    if (!familyMember.phone) {
      return;
    }

    const optionsText = options
      .map((opt, idx) => `${idx + 1}. ${opt.label}`)
      .join('\n');

    const message = `${prompt}\n\n${optionsText}\n\nReply with a number.`;

    await this.sendSMS({
      to: familyMember.phone,
      message,
      familyMemberId: familyMember.id,
      clientId: familyMember.clientId,
      organizationId: familyMember.organizationId,
      notificationType: 'SCHEDULE_CHANGE',
      metadata: {
        requiresResponse: true,
        options,
      },
      context,
    });
  }

  /**
   * Handle incoming SMS (webhook from Twilio)
   */
  async handleIncomingSMS(
    from: string,
    body: string,
    twilioMessageSid: string,
    context: UserContext
  ): Promise<string> {
    // 1. Identify family member by phone number
    const familyMember = await this.familyMemberRepository.findByPhone(from);

    if (!familyMember) {
      await this.sendSMS({
        to: from,
        message: "Sorry, we don't recognize this number. Please contact your care coordinator.",
        familyMemberId: '',
        clientId: '',
        organizationId: context.organizationId,
        notificationType: 'VISIT_START', // Placeholder
        metadata: {},
        context,
      });
      return "Phone number not recognized";
    }

    // 2. Save incoming message
    await this.messageRepository.create(
      {
        organizationId: familyMember.organizationId,
        clientId: familyMember.clientId,
        senderType: 'FAMILY',
        senderId: familyMember.id,
        messageText: body,
        messageType: 'TEXT',
        requiresResponse: true,
        priority: 'NORMAL',
      },
      context
    );

    return "Message received and logged";
  }

  /**
   * Send SMS via Twilio
   */
  private async sendSMS(params: {
    to: string;
    message: string;
    familyMemberId: string;
    clientId: string;
    organizationId: string;
    notificationType: NotificationType;
    metadata?: Record<string, any>;
    context: UserContext;
  }): Promise<void> {
    try {
      // Send via Twilio
      const result = await this.twilioClient.messages.create({
        from: this.fromNumber,
        to: params.to,
        body: params.message,
      });

      // Log notification as SENT
      if (params.familyMemberId) {
        await this.notificationRepository.create(
          {
            organizationId: params.organizationId,
            familyMemberId: params.familyMemberId,
            clientId: params.clientId,
            notificationType: params.notificationType,
            channel: 'SMS',
            message: params.message,
            metadata: params.metadata,
            status: 'SENT',
            externalId: result.sid,
          },
          params.context
        );
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);

      // Log notification as FAILED
      if (params.familyMemberId) {
        await this.notificationRepository.create(
          {
            organizationId: params.organizationId,
            familyMemberId: params.familyMemberId,
            clientId: params.clientId,
            notificationType: params.notificationType,
            channel: 'SMS',
            message: params.message,
            metadata: params.metadata,
            status: 'FAILED',
            failedReason: error instanceof Error ? error.message : 'Unknown error',
          },
          params.context
        );
      }

      throw error;
    }
  }

  /**
   * Format visit start message
   */
  private formatVisitStartMessage(visit: VisitContext): string {
    if (!visit.actualStartTime || !visit.scheduledStartTime) {
      return `${visit.caregiverName} has started the care visit for ${visit.clientName}.`;
    }

    const timeDiff = Math.abs(
      visit.actualStartTime.getTime() - visit.scheduledStartTime.getTime()
    );
    const minutesDiff = Math.floor(timeDiff / 1000 / 60);

    const onTime = minutesDiff < 10; // Within 10 minutes

    const status = onTime ? 'on time' : `${minutesDiff} minutes late`;

    const expectedDuration = visit.scheduledEndTime
      ? Math.floor(
          (visit.scheduledEndTime.getTime() - visit.scheduledStartTime.getTime()) /
            1000 /
            60
        )
      : 120; // Default 2 hours

    return `${visit.caregiverName} has arrived ${status} for ${visit.clientName}'s care visit. Expected duration: ${Math.floor(expectedDuration / 60)}h ${expectedDuration % 60}m.`;
  }

  /**
   * Format visit end message
   */
  private formatVisitEndMessage(visit: VisitContext): string {
    const duration = visit.duration || 0;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;

    let message = `Visit completed (${durationText}).\n\n`;

    if (visit.tasksCompleted && visit.tasksCompleted.length > 0) {
      message += `Tasks: ${visit.tasksCompleted.join(', ')}`;
    }

    if (visit.notes) {
      message += `\n\nNotes: ${visit.notes}`;
    }

    // Add feedback prompt
    message += `\n\nReply FEEDBACK to rate this visit.`;

    return message;
  }

  /**
   * Send feedback request
   */
  async sendFeedbackRequest(
    familyMember: FamilyMember,
    visitId: string,
    context: UserContext
  ): Promise<void> {
    if (!familyMember.phone) {
      return;
    }

    const message = `How was today's care visit? Please rate from 1-5 (5 being excellent). Reply with just the number, or reply SKIP to skip.`;

    await this.sendSMS({
      to: familyMember.phone,
      message,
      familyMemberId: familyMember.id,
      clientId: familyMember.clientId,
      organizationId: familyMember.organizationId,
      notificationType: 'FEEDBACK_REQUEST',
      metadata: {
        visitId,
        requiresResponse: true,
      },
      context,
    });
  }
}
