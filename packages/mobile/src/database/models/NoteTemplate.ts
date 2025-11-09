/**
 * Note Template Model
 *
 * Represents predefined templates for common visit notes
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export class NoteTemplate extends Model {
  static table = 'note_templates';

  @field('organization_id') organizationId!: string;
  @field('template_name') templateName!: string;
  @field('template_category') templateCategory!: 'GENERAL' | 'CLINICAL' | 'ADL' | 'VITAL_SIGNS';
  @field('template_text') templateText!: string;
  @field('template_fields_json') templateFieldsJson?: string;
  @field('is_active') isActive!: boolean;
  @field('sort_order') sortOrder!: number;

  // Sync
  @field('is_synced') isSynced!: boolean;
  @field('last_synced_at') lastSyncedAt?: number;

  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  /**
   * Get parsed template fields
   */
  get templateFields(): Record<string, unknown> | null {
    if (!this.templateFieldsJson) return null;
    try {
      return JSON.parse(this.templateFieldsJson) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
