/**
 * Note Templates Service
 *
 * Manages common observation templates for visit notes
 * Supports categories, search, and usage tracking
 */

import type { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import type { UUID } from '@care-commons/core';

export type NoteCategory = 'ADL' | 'MEDICATION' | 'VITAL_SIGNS' | 'OBSERVATION' | 'SAFETY' | 'BEHAVIORAL' | 'NUTRITION';

export interface NoteTemplate {
  id: UUID;
  organizationId: UUID;
  category: NoteCategory;
  title: string;
  templateText: string;
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  useCount: number;
  isSynced: boolean;
  lastSyncedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateTemplateInput {
  organizationId: UUID;
  category: NoteCategory;
  title: string;
  templateText: string;
  tags?: string[];
}

export const DEFAULT_TEMPLATES: Omit<NoteTemplate, 'id' | 'organizationId' | 'createdAt' | 'updatedAt' | 'isSynced' | 'lastSyncedAt'>[] = [
  // ADL Templates
  {
    category: 'ADL',
    title: 'Bathing Assistance',
    templateText: 'Assisted client with bathing. Client tolerated activity well. No concerns noted.',
    tags: ['bathing', 'hygiene', 'adl'],
    isActive: true,
    sortOrder: 1,
    useCount: 0,
  },
  {
    category: 'ADL',
    title: 'Grooming Assistance',
    templateText: 'Assisted client with grooming activities including hair care and oral hygiene. Client cooperative.',
    tags: ['grooming', 'hygiene', 'adl'],
    isActive: true,
    sortOrder: 2,
    useCount: 0,
  },
  {
    category: 'ADL',
    title: 'Dressing Assistance',
    templateText: 'Assisted client with dressing. Client able to make choices about clothing. No issues noted.',
    tags: ['dressing', 'adl'],
    isActive: true,
    sortOrder: 3,
    useCount: 0,
  },
  {
    category: 'ADL',
    title: 'Toileting Assistance',
    templateText: 'Assisted client with toileting needs. Client maintained dignity throughout process.',
    tags: ['toileting', 'adl'],
    isActive: true,
    sortOrder: 4,
    useCount: 0,
  },
  {
    category: 'ADL',
    title: 'Mobility Assistance',
    templateText: 'Assisted client with ambulation and transfers. Used proper body mechanics. Client steady on feet.',
    tags: ['mobility', 'transfers', 'adl'],
    isActive: true,
    sortOrder: 5,
    useCount: 0,
  },

  // Medication Templates
  {
    category: 'MEDICATION',
    title: 'Medication Reminder',
    templateText: 'Reminded client to take prescribed medications. Client compliant with medication schedule.',
    tags: ['medication', 'reminder'],
    isActive: true,
    sortOrder: 10,
    useCount: 0,
  },
  {
    category: 'MEDICATION',
    title: 'Medication Administration',
    templateText: 'Administered medications as prescribed. Client took all medications without difficulty.',
    tags: ['medication', 'administration'],
    isActive: true,
    sortOrder: 11,
    useCount: 0,
  },

  // Vital Signs Templates
  {
    category: 'VITAL_SIGNS',
    title: 'Vitals Within Normal Range',
    templateText: 'Vital signs checked and documented. All readings within normal range for client.',
    tags: ['vitals', 'normal'],
    isActive: true,
    sortOrder: 20,
    useCount: 0,
  },
  {
    category: 'VITAL_SIGNS',
    title: 'Blood Pressure Check',
    templateText: 'Blood pressure monitored and recorded. Client resting comfortably before reading taken.',
    tags: ['vitals', 'bp', 'blood pressure'],
    isActive: true,
    sortOrder: 21,
    useCount: 0,
  },

  // Observation Templates
  {
    category: 'OBSERVATION',
    title: 'General Good Condition',
    templateText: 'Client in good spirits. Alert and oriented. No new concerns or complaints.',
    tags: ['observation', 'general', 'good'],
    isActive: true,
    sortOrder: 30,
    useCount: 0,
  },
  {
    category: 'OBSERVATION',
    title: 'Client Resting',
    templateText: 'Client resting comfortably. Breathing regular. No signs of distress.',
    tags: ['observation', 'resting'],
    isActive: true,
    sortOrder: 31,
    useCount: 0,
  },
  {
    category: 'OBSERVATION',
    title: 'Social Engagement',
    templateText: 'Client engaged in conversation. Mood positive. Enjoyed social interaction.',
    tags: ['observation', 'social', 'mood'],
    isActive: true,
    sortOrder: 32,
    useCount: 0,
  },

  // Safety Templates
  {
    category: 'SAFETY',
    title: 'Home Safety Check',
    templateText: 'Performed home safety assessment. No hazards identified. Environment safe and clean.',
    tags: ['safety', 'home', 'environment'],
    isActive: true,
    sortOrder: 40,
    useCount: 0,
  },
  {
    category: 'SAFETY',
    title: 'Fall Risk Assessment',
    templateText: 'Assessed fall risk. Reminded client to use assistive devices. Clear pathways maintained.',
    tags: ['safety', 'fall risk'],
    isActive: true,
    sortOrder: 41,
    useCount: 0,
  },

  // Behavioral Templates
  {
    category: 'BEHAVIORAL',
    title: 'Calm and Cooperative',
    templateText: 'Client calm and cooperative throughout visit. No behavioral concerns observed.',
    tags: ['behavior', 'calm', 'cooperative'],
    isActive: true,
    sortOrder: 50,
    useCount: 0,
  },
  {
    category: 'BEHAVIORAL',
    title: 'Anxiety Management',
    templateText: 'Client experiencing mild anxiety. Provided reassurance and calming techniques. Client responded well.',
    tags: ['behavior', 'anxiety'],
    isActive: true,
    sortOrder: 51,
    useCount: 0,
  },

  // Nutrition Templates
  {
    category: 'NUTRITION',
    title: 'Meal Preparation',
    templateText: 'Prepared nutritious meal per care plan. Client ate well and enjoyed meal.',
    tags: ['nutrition', 'meal', 'preparation'],
    isActive: true,
    sortOrder: 60,
    useCount: 0,
  },
  {
    category: 'NUTRITION',
    title: 'Hydration Reminder',
    templateText: 'Encouraged client to maintain hydration throughout day. Ensured water readily available.',
    tags: ['nutrition', 'hydration', 'fluids'],
    isActive: true,
    sortOrder: 61,
    useCount: 0,
  },
];

class NoteTemplatesService {
  private database: Database | null = null;

  /**
   * Initialize service with database
   */
  initialize(database: Database): void {
    this.database = database;
  }

  /**
   * Seed default templates for an organization
   */
  async seedDefaultTemplates(organizationId: UUID): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const timestamp = Date.now();

    await this.database.write(async () => {
      const templatesCollection = this.database!.collections.get('note_templates');

      for (const template of DEFAULT_TEMPLATES) {
        await templatesCollection.create((record: any) => {
          record.organizationId = organizationId;
          record.category = template.category;
          record.title = template.title;
          record.templateText = template.templateText;
          record.tagsJson = JSON.stringify(template.tags);
          record.isActive = template.isActive;
          record.sortOrder = template.sortOrder;
          record.useCount = template.useCount;
          record.isSynced = false;
          record.createdAt = timestamp;
          record.updatedAt = timestamp;
        });
      }
    });

    console.log(`[NoteTemplates] Seeded ${DEFAULT_TEMPLATES.length} default templates`);
  }

  /**
   * Get all templates for an organization
   */
  async getTemplates(organizationId: UUID): Promise<NoteTemplate[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const records = await this.database
      .get('note_templates')
      .query(
        Q.where('organization_id', organizationId),
        Q.where('is_active', true),
        Q.sortBy('sort_order', Q.asc)
      )
      .fetch();

    return records.map(this.mapRecordToTemplate);
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(organizationId: UUID, category: NoteCategory): Promise<NoteTemplate[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const records = await this.database
      .get('note_templates')
      .query(
        Q.where('organization_id', organizationId),
        Q.where('category', category),
        Q.where('is_active', true),
        Q.sortBy('sort_order', Q.asc)
      )
      .fetch();

    return records.map(this.mapRecordToTemplate);
  }

  /**
   * Search templates by text
   */
  async searchTemplates(organizationId: UUID, searchText: string): Promise<NoteTemplate[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const allTemplates = await this.getTemplates(organizationId);

    const searchLower = searchText.toLowerCase();
    return allTemplates.filter(
      (template) =>
        template.title.toLowerCase().includes(searchLower) ||
        template.templateText.toLowerCase().includes(searchLower) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Get most used templates
   */
  async getMostUsedTemplates(organizationId: UUID, limit: number = 5): Promise<NoteTemplate[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const records = await this.database
      .get('note_templates')
      .query(
        Q.where('organization_id', organizationId),
        Q.where('is_active', true),
        Q.sortBy('use_count', Q.desc),
        Q.take(limit)
      )
      .fetch();

    return records.map(this.mapRecordToTemplate);
  }

  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<NoteTemplate> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const timestamp = Date.now();

    const record = await this.database.write(async () => {
      const templatesCollection = this.database!.collections.get('note_templates');

      return await templatesCollection.create((record: any) => {
        record.organizationId = input.organizationId;
        record.category = input.category;
        record.title = input.title;
        record.templateText = input.templateText;
        record.tagsJson = JSON.stringify(input.tags || []);
        record.isActive = true;
        record.sortOrder = 999; // New templates go to the end
        record.useCount = 0;
        record.isSynced = false;
        record.createdAt = timestamp;
        record.updatedAt = timestamp;
      });
    });

    return this.mapRecordToTemplate(record);
  }

  /**
   * Increment template use count
   */
  async incrementUseCount(templateId: UUID): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    await this.database.write(async () => {
      const templatesCollection = this.database!.collections.get('note_templates');
      const record = await templatesCollection.find(templateId);

      await record.update((template: any) => {
        template.useCount = (template.useCount || 0) + 1;
        template.updatedAt = Date.now();
      });
    });
  }

  /**
   * Map database record to template object
   */
  private mapRecordToTemplate(record: any): NoteTemplate {
    return {
      id: record.id,
      organizationId: record.organizationId,
      category: record.category,
      title: record.title,
      templateText: record.templateText,
      tags: JSON.parse(record.tagsJson || '[]'),
      isActive: record.isActive,
      sortOrder: record.sortOrder,
      useCount: record.useCount || 0,
      isSynced: record.isSynced,
      lastSyncedAt: record.lastSyncedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const noteTemplatesService = new NoteTemplatesService();
