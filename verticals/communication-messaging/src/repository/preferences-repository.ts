/**
 * Communication preferences repository - data access layer
 */

import { Repository, Database } from '@care-commons/core';
import type {
  CommunicationPreferences,
  ChannelType,
  CategoryPreference,
} from '../types/communication.js';

export class CommunicationPreferencesRepository extends Repository<CommunicationPreferences> {
  constructor(database: Database) {
    super({
      tableName: 'communication_preferences',
      database,
      enableAudit: true,
      enableSoftDelete: false,
    });
  }

  protected mapRowToEntity(row: Record<string, unknown>): CommunicationPreferences {
    return {
      id: row['id'] as string,
      userId: row['user_id'] as string,
      organizationId: row['organization_id'] as string,
      preferredChannel: row['preferred_channel'] as ChannelType,
      enabledChannels: JSON.parse(row['enabled_channels'] as string),
      emailAddress: row['email_address'] as string | undefined,
      phoneNumber: row['phone_number'] as string | undefined,
      pushDeviceTokens: JSON.parse((row['push_device_tokens'] as string) || '[]'),
      categoryPreferences: JSON.parse(row['category_preferences'] as string),
      quietHoursEnabled: row['quiet_hours_enabled'] as boolean,
      quietHoursStart: row['quiet_hours_start'] as string | undefined,
      quietHoursEnd: row['quiet_hours_end'] as string | undefined,
      quietHoursTimezone: row['quiet_hours_timezone'] as string,
      enableDigest: row['enable_digest'] as boolean,
      digestFrequency: row['digest_frequency'] as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      digestTime: row['digest_time'] as string | undefined,
      digestDays: JSON.parse((row['digest_days'] as string) || '[]'),
      notificationSound: row['notification_sound'] as boolean,
      notificationVibrate: row['notification_vibrate'] as boolean,
      showMessagePreview: row['show_message_preview'] as boolean,
      doNotDisturbEnabled: row['do_not_disturb_enabled'] as boolean,
      doNotDisturbUntil: row['do_not_disturb_until'] as Date | null | undefined,
      preferredLanguage: row['preferred_language'] as string,
      marketingOptIn: row['marketing_opt_in'] as boolean,
      smsOptIn: row['sms_opt_in'] as boolean,
      emailOptIn: row['email_opt_in'] as boolean,
      pushOptIn: row['push_opt_in'] as boolean,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as string,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as string,
      version: row['version'] as number,
    };
  }

  protected mapEntityToRow(entity: Partial<CommunicationPreferences>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.userId !== undefined) row['user_id'] = entity.userId;
    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.preferredChannel !== undefined) row['preferred_channel'] = entity.preferredChannel;
    if (entity.enabledChannels !== undefined) row['enabled_channels'] = JSON.stringify(entity.enabledChannels);
    if (entity.emailAddress !== undefined) row['email_address'] = entity.emailAddress;
    if (entity.phoneNumber !== undefined) row['phone_number'] = entity.phoneNumber;
    if (entity.pushDeviceTokens !== undefined) row['push_device_tokens'] = JSON.stringify(entity.pushDeviceTokens);
    if (entity.categoryPreferences !== undefined) row['category_preferences'] = JSON.stringify(entity.categoryPreferences);
    if (entity.quietHoursEnabled !== undefined) row['quiet_hours_enabled'] = entity.quietHoursEnabled;
    if (entity.quietHoursStart !== undefined) row['quiet_hours_start'] = entity.quietHoursStart;
    if (entity.quietHoursEnd !== undefined) row['quiet_hours_end'] = entity.quietHoursEnd;
    if (entity.quietHoursTimezone !== undefined) row['quiet_hours_timezone'] = entity.quietHoursTimezone;
    if (entity.enableDigest !== undefined) row['enable_digest'] = entity.enableDigest;
    if (entity.digestFrequency !== undefined) row['digest_frequency'] = entity.digestFrequency;
    if (entity.digestTime !== undefined) row['digest_time'] = entity.digestTime;
    if (entity.digestDays !== undefined) row['digest_days'] = JSON.stringify(entity.digestDays);
    if (entity.notificationSound !== undefined) row['notification_sound'] = entity.notificationSound;
    if (entity.notificationVibrate !== undefined) row['notification_vibrate'] = entity.notificationVibrate;
    if (entity.showMessagePreview !== undefined) row['show_message_preview'] = entity.showMessagePreview;
    if (entity.doNotDisturbEnabled !== undefined) row['do_not_disturb_enabled'] = entity.doNotDisturbEnabled;
    if (entity.doNotDisturbUntil !== undefined) row['do_not_disturb_until'] = entity.doNotDisturbUntil;
    if (entity.preferredLanguage !== undefined) row['preferred_language'] = entity.preferredLanguage;
    if (entity.marketingOptIn !== undefined) row['marketing_opt_in'] = entity.marketingOptIn;
    if (entity.smsOptIn !== undefined) row['sms_opt_in'] = entity.smsOptIn;
    if (entity.emailOptIn !== undefined) row['email_opt_in'] = entity.emailOptIn;
    if (entity.pushOptIn !== undefined) row['push_opt_in'] = entity.pushOptIn;

    return row;
  }

  /**
   * Find preferences by user ID
   */
  async findByUserId(userId: string): Promise<CommunicationPreferences | null> {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1
    `;

    const result = await this.database.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0] as Record<string, unknown>);
  }

  /**
   * Find or create preferences for user
   */
  async findOrCreate(userId: string, organizationId: string): Promise<CommunicationPreferences> {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }

    // Create default preferences
    const defaultPreferences: Partial<CommunicationPreferences> = {
      userId,
      organizationId,
      preferredChannel: 'EMAIL',
      enabledChannels: ['EMAIL', 'IN_APP'],
      pushDeviceTokens: [],
      categoryPreferences: [],
      quietHoursEnabled: false,
      quietHoursTimezone: 'America/New_York',
      enableDigest: false,
      digestFrequency: 'DAILY',
      digestDays: [],
      notificationSound: true,
      notificationVibrate: true,
      showMessagePreview: true,
      doNotDisturbEnabled: false,
      preferredLanguage: 'en',
      marketingOptIn: false,
      smsOptIn: true,
      emailOptIn: true,
      pushOptIn: true,
    };

    return await this.create(defaultPreferences, userId);
  }

  /**
   * Check if user has opted into a channel
   */
  async hasOptedIntoChannel(userId: string, channel: ChannelType): Promise<boolean> {
    const preferences = await this.findByUserId(userId);
    if (!preferences) {
      return false;
    }

    switch (channel) {
      case 'SMS':
        return preferences.smsOptIn;
      case 'EMAIL':
        return preferences.emailOptIn;
      case 'PUSH':
        return preferences.pushOptIn;
      default:
        return true; // IN_APP and other channels don't require opt-in
    }
  }

  /**
   * Add push device token
   */
  async addPushDeviceToken(userId: string, token: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET push_device_tokens = array_append(push_device_tokens, $2),
          updated_at = NOW()
      WHERE user_id = $1
        AND NOT ($2 = ANY(push_device_tokens))
    `;

    await this.database.query(query, [userId, token]);
  }

  /**
   * Remove push device token
   */
  async removePushDeviceToken(userId: string, token: string): Promise<void> {
    const query = `
      UPDATE ${this.tableName}
      SET push_device_tokens = array_remove(push_device_tokens, $2),
          updated_at = NOW()
      WHERE user_id = $1
    `;

    await this.database.query(query, [userId, token]);
  }
}
