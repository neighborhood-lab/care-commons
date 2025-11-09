/**
 * Note Templates Service
 *
 * Manages note templates for common observations and documentation
 */

import { database } from '../database/index.js';
import { NoteTemplate, type TemplateCategory } from '../database/models/NoteTemplate.js';
import { VisitNote, type NoteType } from '../database/models/VisitNote.js';
import { Q } from '@nozbe/watermelondb';

export interface CreateTemplateOptions {
  organizationId: string;
  templateName: string;
  templateCategory: TemplateCategory;
  templateText: string;
  templateHtml?: string;
  variables?: string[];
  sortOrder?: number;
  isDefault?: boolean;
}

export interface CreateNoteOptions {
  visitId: string;
  evvRecordId?: string;
  organizationId: string;
  caregiverId: string;
  clientId: string;
  noteText: string;
  noteHtml?: string;
  noteType: NoteType;
  templateId?: string;
  isVoiceTranscribed?: boolean;
  audioUri?: string;
  transcriptionConfidence?: number;
  durationSeconds?: number;
}

class NoteTemplatesService {
  /**
   * Initialize default templates for an organization
   */
  async initializeDefaultTemplates(organizationId: string): Promise<void> {
    const defaultTemplates = [
      {
        name: 'Client Alert and Oriented',
        category: 'care_notes' as TemplateCategory,
        text: 'Client was alert and oriented x4 (person, place, time, situation). No changes in mental status observed.',
        sortOrder: 1,
      },
      {
        name: 'Vital Signs Normal',
        category: 'vital_signs' as TemplateCategory,
        text: 'Vital signs within normal limits. BP: [BP], HR: [HR], Temp: [TEMP], RR: [RR].',
        variables: ['BP', 'HR', 'TEMP', 'RR'],
        sortOrder: 1,
      },
      {
        name: 'Medication Administered',
        category: 'medication' as TemplateCategory,
        text: 'Medication [MED_NAME] administered as prescribed at [TIME]. Client tolerated well with no adverse reactions.',
        variables: ['MED_NAME', 'TIME'],
        sortOrder: 1,
      },
      {
        name: 'ADL Assistance - Bathing',
        category: 'care_notes' as TemplateCategory,
        text: 'Provided assistance with bathing. Client maintained safety throughout. Skin integrity good, no areas of concern noted.',
        sortOrder: 2,
      },
      {
        name: 'ADL Assistance - Dressing',
        category: 'care_notes' as TemplateCategory,
        text: 'Assisted client with dressing. Client able to participate with verbal cues. Clothing appropriate for weather.',
        sortOrder: 3,
      },
      {
        name: 'Meal Preparation',
        category: 'care_notes' as TemplateCategory,
        text: 'Prepared nutritious meal per dietary guidelines. Client ate approximately [PERCENTAGE]% of meal. Adequate hydration maintained.',
        variables: ['PERCENTAGE'],
        sortOrder: 4,
      },
      {
        name: 'Fall Incident',
        category: 'incident' as TemplateCategory,
        text: 'Client experienced a fall at [TIME]. Client assessed for injury. [INJURY_ASSESSMENT]. Emergency services [CONTACTED/NOT_CONTACTED]. Family notified.',
        variables: ['TIME', 'INJURY_ASSESSMENT', 'CONTACTED'],
        sortOrder: 1,
      },
      {
        name: 'Behavior Change',
        category: 'incident' as TemplateCategory,
        text: 'Observed change in client behavior: [DESCRIPTION]. Duration: [DURATION]. Interventions: [INTERVENTIONS]. Supervisor notified.',
        variables: ['DESCRIPTION', 'DURATION', 'INTERVENTIONS'],
        sortOrder: 2,
      },
      {
        name: 'Client Refused Care',
        category: 'incident' as TemplateCategory,
        text: 'Client declined [SERVICE] at [TIME]. Client rights respected. Will reattempt later. Supervisor notified per protocol.',
        variables: ['SERVICE', 'TIME'],
        sortOrder: 3,
      },
      {
        name: 'Pain Assessment',
        category: 'care_notes' as TemplateCategory,
        text: 'Client reports pain level [PAIN_LEVEL]/10 in [LOCATION]. Character: [CHARACTER]. Interventions: [INTERVENTIONS]. Response: [RESPONSE].',
        variables: ['PAIN_LEVEL', 'LOCATION', 'CHARACTER', 'INTERVENTIONS', 'RESPONSE'],
        sortOrder: 5,
      },
    ];

    await database.write(async () => {
      for (const template of defaultTemplates) {
        await database.get<NoteTemplate>('note_templates').create((record) => {
          record.organizationId = organizationId;
          record.templateName = template.name;
          record.templateCategory = template.category;
          record.templateText = template.text;
          record.templateHtml = null;
          record.variables = template.variables || null;
          record.usageCount = 0;
          record.lastUsedAt = null;
          record.sortOrder = template.sortOrder;
          record.isActive = true;
          record.isDefault = true;
          record.isSynced = false;
          record.lastSyncedAt = null;
        });
      }
    });
  }

  /**
   * Get all active templates for an organization
   */
  async getActiveTemplates(
    organizationId: string,
    category?: TemplateCategory
  ): Promise<NoteTemplate[]> {
    const query = category
      ? database
          .get<NoteTemplate>('note_templates')
          .query(
            Q.where('organization_id', organizationId),
            Q.where('is_active', true),
            Q.where('template_category', category),
            Q.sortBy('sort_order', Q.asc)
          )
      : database
          .get<NoteTemplate>('note_templates')
          .query(
            Q.where('organization_id', organizationId),
            Q.where('is_active', true),
            Q.sortBy('sort_order', Q.asc)
          );

    return await query.fetch();
  }

  /**
   * Create a custom template
   */
  async createTemplate(options: CreateTemplateOptions): Promise<NoteTemplate> {
    return await database.write(async () => {
      return await database.get<NoteTemplate>('note_templates').create((record) => {
        record.organizationId = options.organizationId;
        record.templateName = options.templateName;
        record.templateCategory = options.templateCategory;
        record.templateText = options.templateText;
        record.templateHtml = options.templateHtml || null;
        record.variables = options.variables || null;
        record.usageCount = 0;
        record.lastUsedAt = null;
        record.sortOrder = options.sortOrder || 99;
        record.isActive = true;
        record.isDefault = options.isDefault || false;
        record.isSynced = false;
        record.lastSyncedAt = null;
      });
    });
  }

  /**
   * Apply template with variable substitution
   */
  applyTemplate(
    template: NoteTemplate,
    variables?: Record<string, string>
  ): string {
    let text = template.templateText;

    if (variables && template.variables) {
      for (const variable of template.variables) {
        const value = variables[variable] || `[${variable}]`;
        text = text.replace(new RegExp(`\\[${variable}\\]`, 'g'), value);
      }
    }

    return text;
  }

  /**
   * Create a visit note
   */
  async createNote(options: CreateNoteOptions): Promise<VisitNote> {
    const note = await database.write(async () => {
      return await database.get<VisitNote>('visit_notes').create((record) => {
        record.visitId = options.visitId;
        record.evvRecordId = options.evvRecordId || null;
        record.organizationId = options.organizationId;
        record.caregiverId = options.caregiverId;
        record.clientId = options.clientId;

        // Note content
        record.noteText = options.noteText;
        record.noteHtml = options.noteHtml || null;
        record.noteType = options.noteType;
        record.templateId = options.templateId || null;

        // Voice-to-text metadata
        record.isVoiceTranscribed = options.isVoiceTranscribed || false;
        record.audioUri = options.audioUri || null;
        record.transcriptionConfidence = options.transcriptionConfidence || null;

        // Metadata
        record.recordedAt = new Date();
        record.durationSeconds = options.durationSeconds || null;

        // Auto-save tracking
        record.isAutoSaved = false;
        record.lastEditedAt = new Date();

        // Sync
        record.isSynced = false;
        record.syncPending = true;
      });
    });

    // Update template usage count if template was used
    if (options.templateId) {
      const template = await database.get<NoteTemplate>('note_templates').find(options.templateId);
      await database.write(async () => {
        await template.update((record) => {
          record.usageCount += 1;
          record.lastUsedAt = new Date();
        });
      });
    }

    return note;
  }

  /**
   * Update a visit note
   */
  async updateNote(noteId: string, noteText: string, noteHtml?: string): Promise<VisitNote> {
    const note = await database.get<VisitNote>('visit_notes').find(noteId);

    return await database.write(async () => {
      await note.update((record) => {
        record.noteText = noteText;
        record.noteHtml = noteHtml || record.noteHtml;
        record.lastEditedAt = new Date();
        record.syncPending = true;
      });
      return note;
    });
  }

  /**
   * Auto-save note (mark as auto-saved)
   */
  async autoSaveNote(noteId: string): Promise<void> {
    const note = await database.get<VisitNote>('visit_notes').find(noteId);

    await database.write(async () => {
      await note.update((record) => {
        record.isAutoSaved = true;
      });
    });
  }

  /**
   * Get notes for a visit
   */
  async getVisitNotes(visitId: string, noteType?: NoteType): Promise<VisitNote[]> {
    const query = noteType
      ? database
          .get<VisitNote>('visit_notes')
          .query(
            Q.where('visit_id', visitId),
            Q.where('note_type', noteType),
            Q.sortBy('recorded_at', Q.desc)
          )
      : database
          .get<VisitNote>('visit_notes')
          .query(
            Q.where('visit_id', visitId),
            Q.sortBy('recorded_at', Q.desc)
          );

    return await query.fetch();
  }

  /**
   * Delete note
   */
  async deleteNote(noteId: string): Promise<void> {
    const note = await database.get<VisitNote>('visit_notes').find(noteId);

    await database.write(async () => {
      await note.destroyPermanently();
    });
  }
}

export const noteTemplatesService = new NoteTemplatesService();
