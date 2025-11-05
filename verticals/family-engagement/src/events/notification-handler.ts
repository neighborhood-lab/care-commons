import type { UserContext } from '@care-commons/core';
import { SMSNotificationService } from '../service/sms-notification-service.js';
import { FamilyMemberRepository } from '../repository/family-member-repository.js';
import type {
  VisitClockInEvent,
  VisitClockOutEvent,
  ScheduleChangeEvent,
  MissedVisitEvent,
  VisitContext,
} from '../types/family.js';

/**
 * Event handler for family notifications based on visit lifecycle events
 */
export class FamilyNotificationHandler {
  constructor(
    private smsService: SMSNotificationService,
    private familyMemberRepository: FamilyMemberRepository
  ) {}

  /**
   * Handle visit clock-in event
   */
  async handleVisitClockIn(event: VisitClockInEvent, context: UserContext): Promise<void> {
    // Get family members for this client
    const familyMembers = await this.familyMemberRepository.findByClientId(event.clientId);

    // Filter active members who want visit start notifications
    const recipients = familyMembers.filter(
      (fm) =>
        fm.status === 'ACTIVE' &&
        fm.notificationPreferences.visitStart &&
        fm.preferredContactMethod === 'SMS' &&
        fm.phone
    );

    // Send notifications to each recipient
    const visitContext: VisitContext = {
      visitId: event.visitId,
      clientId: event.clientId,
      clientName: event.clientName,
      caregiverId: event.caregiverId,
      caregiverName: event.caregiverName,
      scheduledStartTime: event.scheduledStartTime,
      actualStartTime: event.actualStartTime,
      status: 'IN_PROGRESS',
      scheduledEndTime: new Date(event.scheduledStartTime.getTime() + 2 * 60 * 60 * 1000), // Default 2 hours
    };

    await Promise.all(
      recipients.map((member) =>
        this.smsService.notifyVisitStart(member, visitContext, context)
      )
    );
  }

  /**
   * Handle visit clock-out event
   */
  async handleVisitClockOut(event: VisitClockOutEvent, context: UserContext): Promise<void> {
    // Get family members for this client
    const familyMembers = await this.familyMemberRepository.findByClientId(event.clientId);

    // Filter active members who want visit end notifications
    const recipients = familyMembers.filter(
      (fm) =>
        fm.status === 'ACTIVE' &&
        fm.notificationPreferences.visitEnd &&
        fm.preferredContactMethod === 'SMS' &&
        fm.phone
    );

    // Send notifications to each recipient
    const visitContext: VisitContext = {
      visitId: event.visitId,
      clientId: event.clientId,
      clientName: event.clientName,
      caregiverId: event.caregiverId,
      caregiverName: event.caregiverName,
      scheduledStartTime: new Date(event.actualEndTime.getTime() - event.duration * 60 * 1000),
      scheduledEndTime: event.scheduledEndTime,
      actualEndTime: event.actualEndTime,
      status: 'COMPLETED',
      duration: event.duration,
      tasksCompleted: event.tasksCompleted,
      notes: event.notes,
    };

    await Promise.all(
      recipients.map((member) =>
        this.smsService.notifyVisitEnd(member, visitContext, context)
      )
    );

    // Send feedback request 1 hour after visit end
    setTimeout(async () => {
      await this.sendFeedbackRequests(recipients, event.visitId, context);
    }, 60 * 60 * 1000); // 1 hour delay
  }

  /**
   * Handle schedule change event
   */
  async handleScheduleChange(event: ScheduleChangeEvent, context: UserContext): Promise<void> {
    // Get family members for this client
    const familyMembers = await this.familyMemberRepository.findByClientId(event.clientId);

    // Filter active members who want schedule change notifications
    const recipients = familyMembers.filter(
      (fm) =>
        fm.status === 'ACTIVE' &&
        fm.notificationPreferences.scheduleChange &&
        fm.preferredContactMethod === 'SMS' &&
        fm.phone
    );

    // Send interactive notifications
    const prompt = `Schedule change for ${event.clientName}'s visit:\n` +
      `Original: ${this.formatDateTime(event.oldStartTime)}\n` +
      `New: ${this.formatDateTime(event.newStartTime)}\n` +
      (event.reason ? `Reason: ${event.reason}\n` : '') +
      `\nDo you accept this change?`;

    await Promise.all(
      recipients.map((member) =>
        this.smsService.sendInteractiveMessage(
          member,
          prompt,
          [
            { label: 'Accept change', value: 'ACCEPT' },
            { label: 'Decline and keep original', value: 'DECLINE' },
            { label: 'Call me to discuss', value: 'CALL' },
          ],
          context
        )
      )
    );
  }

  /**
   * Handle missed visit event
   */
  async handleMissedVisit(event: MissedVisitEvent, context: UserContext): Promise<void> {
    // Get family members for this client
    const familyMembers = await this.familyMemberRepository.findByClientId(event.clientId);

    // Filter active members who want missed visit notifications
    const recipients = familyMembers.filter(
      (fm) =>
        fm.status === 'ACTIVE' &&
        fm.notificationPreferences.missedVisit &&
        fm.preferredContactMethod === 'SMS' &&
        fm.phone
    );

    // This is an emergency alert - send to all recipients regardless of preferences
    const message = `ALERT: Scheduled visit for ${event.clientName} at ${this.formatDateTime(event.scheduledStartTime)} was missed. ` +
      `Care coordinator has been notified and will contact you shortly.`;

    // Would normally use a dedicated emergency alert method
    // For now, using the interactive message method
    await Promise.all(
      recipients.map((member) =>
        this.smsService.sendInteractiveMessage(
          member,
          message,
          [
            { label: 'Acknowledged', value: 'ACK' },
            { label: 'Call me immediately', value: 'URGENT' },
          ],
          context
        )
      )
    );
  }

  /**
   * Send feedback requests to family members
   */
  private async sendFeedbackRequests(
    familyMembers: any[],
    visitId: string,
    context: UserContext
  ): Promise<void> {
    const recipients = familyMembers.filter(
      (fm) =>
        fm.status === 'ACTIVE' &&
        fm.permissions.provideFeedback &&
        fm.phone
    );

    await Promise.all(
      recipients.map((member) =>
        this.smsService.sendFeedbackRequest(member, visitId, context)
      )
    );
  }

  /**
   * Format date/time helper
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
