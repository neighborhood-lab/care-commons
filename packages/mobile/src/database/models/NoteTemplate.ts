/**
 * NoteTemplate Model - WatermelonDB model for note templates
 */

import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

export type TemplateCategory = 'care_notes' | 'vital_signs' | 'medication' | 'incident';

export class NoteTemplate extends Model {
  static table = 'note_templates';
  static associations = {
    visit_notes: { type: 'has_many' as const, foreignKey: 'template_id' },
  };

  @field('organization_id') organizationId!: string;
  @field('template_name') templateName!: string;
  @field('template_category') templateCategory!: TemplateCategory;
  @field('template_text') templateText!: string;
  @field('template_html') templateHtml!: string | null;

  // Variables/placeholders
  @json('variables_json', (json: unknown) => json) variables!: string[] | null;

  // Usage tracking
  @field('usage_count') usageCount!: number;
  @date('last_used_at') lastUsedAt!: Date | null;

  // Ordering
  @field('sort_order') sortOrder!: number;
  @field('is_active') isActive!: boolean;
  @field('is_default') isDefault!: boolean;

  // Sync
  @field('is_synced') isSynced!: boolean;
  @date('last_synced_at') lastSyncedAt!: Date | null;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
