/**
 * Visit Notes Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createVisitNoteSchema,
  updateVisitNoteSchema,
  addSignatureSchema,
  createNoteTemplateSchema,
  updateNoteTemplateSchema,
  visitNoteSearchFiltersSchema,
  templateSearchFiltersSchema,
  type CreateVisitNoteInput,
  type UpdateVisitNoteInput,
  type AddSignatureInput,
  type CreateNoteTemplateInput,
  type UpdateNoteTemplateInput,
} from '../validation';

describe('Visit Notes Validation', () => {
  describe('createVisitNoteSchema', () => {
    it('should validate a valid general note', () => {
      const validNote: CreateVisitNoteInput = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Client was in good spirits today.',
        noteType: 'GENERAL',
      };

      const result = createVisitNoteSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });

    it('should validate a clinical note with all optional fields', () => {
      const validNote: CreateVisitNoteInput = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        evvRecordId: '123e4567-e89b-12d3-a456-426614174010',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteType: 'CLINICAL',
        noteText: 'Administered medication as prescribed.',
        noteHtml: '<p>Administered medication as prescribed.</p>',
        templateId: '123e4567-e89b-12d3-a456-426614174003',
        activitiesPerformed: ['Medication Administration', 'Vital Signs Check'],
        clientMood: 'GOOD',
        clientConditionNotes: 'Stable condition, no concerns.',
        requiresSignature: true,
      };

      const result = createVisitNoteSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });

    it('should validate an incident note with severity and description', () => {
      const validNote: CreateVisitNoteInput = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteType: 'INCIDENT',
        noteText: 'Client fell but was uninjured.',
        isIncident: true,
        incidentSeverity: 'MEDIUM',
        incidentDescription: 'Client tripped over rug but caught themselves. No injuries observed.',
      };

      const result = createVisitNoteSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });

    it('should reject incident note without severity', () => {
      const invalidNote = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Client fell.',
        isIncident: true,
        incidentDescription: 'Client fell.',
      };

      const result = createVisitNoteSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Incident notes require severity and description');
      }
    });

    it('should reject incident note without description', () => {
      const invalidNote = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Client fell.',
        isIncident: true,
        incidentSeverity: 'MEDIUM',
      };

      const result = createVisitNoteSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Incident notes require severity and description');
      }
    });

    it('should validate a voice note with audio URI', () => {
      const validNote: CreateVisitNoteInput = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Transcribed voice note content.',
        isVoiceNote: true,
        audioFileUri: 'https://example.com/audio/note123.mp3',
        transcriptionConfidence: 0.95,
      };

      const result = createVisitNoteSchema.safeParse(validNote);
      expect(result.success).toBe(true);
    });

    it('should reject voice note without audio URI', () => {
      const invalidNote = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Transcribed voice note content.',
        isVoiceNote: true,
      };

      const result = createVisitNoteSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Voice notes require audio file URI');
      }
    });

    it('should reject invalid UUIDs', () => {
      const invalidNote = {
        visitId: 'invalid-uuid',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Note text',
      };

      const result = createVisitNoteSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
    });

    it('should reject empty note text', () => {
      const invalidNote = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: '',
      };

      const result = createVisitNoteSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
    });

    it('should reject note text exceeding max length', () => {
      const invalidNote = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'a'.repeat(50001),
      };

      const result = createVisitNoteSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
    });

    it('should validate all valid client moods', () => {
      const moods = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DISTRESSED', 'UNRESPONSIVE'];

      moods.forEach(mood => {
        const validNote = {
          visitId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '123e4567-e89b-12d3-a456-426614174001',
          caregiverId: '123e4567-e89b-12d3-a456-426614174002',
          noteText: 'Note text',
          clientMood: mood,
        };

        const result = createVisitNoteSchema.safeParse(validNote);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid client mood', () => {
      const invalidNote = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Note text',
        clientMood: 'INVALID',
      };

      const result = createVisitNoteSchema.safeParse(invalidNote);
      expect(result.success).toBe(false);
    });

    it('should validate all valid incident severities', () => {
      const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

      severities.forEach(severity => {
        const validNote = {
          visitId: '123e4567-e89b-12d3-a456-426614174000',
          organizationId: '123e4567-e89b-12d3-a456-426614174001',
          caregiverId: '123e4567-e89b-12d3-a456-426614174002',
          noteText: 'Incident occurred',
          isIncident: true,
          incidentSeverity: severity,
          incidentDescription: 'Description of incident',
        };

        const result = createVisitNoteSchema.safeParse(validNote);
        expect(result.success).toBe(true);
      });
    });

    it('should validate transcription confidence bounds', () => {
      // Valid: 0.0
      let validNote = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        noteText: 'Note text',
        transcriptionConfidence: 0.0,
      };
      expect(createVisitNoteSchema.safeParse(validNote).success).toBe(true);

      // Valid: 1.0
      validNote = { ...validNote, transcriptionConfidence: 1.0 };
      expect(createVisitNoteSchema.safeParse(validNote).success).toBe(true);

      // Invalid: > 1.0
      const invalidNote = { ...validNote, transcriptionConfidence: 1.1 };
      expect(createVisitNoteSchema.safeParse(invalidNote).success).toBe(false);

      // Invalid: < 0.0
      const invalidNote2 = { ...validNote, transcriptionConfidence: -0.1 };
      expect(createVisitNoteSchema.safeParse(invalidNote2).success).toBe(false);
    });
  });

  describe('updateVisitNoteSchema', () => {
    it('should validate a valid update with all fields', () => {
      const validUpdate: UpdateVisitNoteInput = {
        noteText: 'Updated note text',
        noteHtml: '<p>Updated note text</p>',
        activitiesPerformed: ['Activity 1', 'Activity 2'],
        clientMood: 'GOOD',
        clientConditionNotes: 'Condition improved',
        incidentSeverity: 'LOW',
        incidentDescription: 'Minor incident resolved',
      };

      const result = updateVisitNoteSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate a partial update', () => {
      const validUpdate: UpdateVisitNoteInput = {
        noteText: 'Updated note text only',
      };

      const result = updateVisitNoteSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate an empty update', () => {
      const emptyUpdate = {};
      const result = updateVisitNoteSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject empty note text', () => {
      const invalidUpdate = {
        noteText: '',
      };

      const result = updateVisitNoteSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should reject note text exceeding max length', () => {
      const invalidUpdate = {
        noteText: 'a'.repeat(50001),
      };

      const result = updateVisitNoteSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('addSignatureSchema', () => {
    it('should validate a caregiver signature', () => {
      const validSignature: AddSignatureInput = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'caregiver',
        signatureData: 'base64encodedimagedata',
        device: 'iPhone 15',
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        ipAddress: '192.168.1.1',
      };

      const result = addSignatureSchema.safeParse(validSignature);
      expect(result.success).toBe(true);
    });

    it('should validate a client signature with required fields', () => {
      const validSignature: AddSignatureInput = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'client',
        signatureData: 'base64encodedimagedata',
        signerName: 'John Doe',
        signerRelationship: 'SELF',
      };

      const result = addSignatureSchema.safeParse(validSignature);
      expect(result.success).toBe(true);
    });

    it('should reject client signature without signer name', () => {
      const invalidSignature = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'client',
        signatureData: 'base64encodedimagedata',
        signerRelationship: 'SELF',
      };

      const result = addSignatureSchema.safeParse(invalidSignature);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Client signatures require signer name and relationship');
      }
    });

    it('should reject client signature without relationship', () => {
      const invalidSignature = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'client',
        signatureData: 'base64encodedimagedata',
        signerName: 'John Doe',
      };

      const result = addSignatureSchema.safeParse(invalidSignature);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Client signatures require signer name and relationship');
      }
    });

    it('should validate a supervisor signature with comments', () => {
      const validSignature: AddSignatureInput = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'supervisor',
        signatureData: 'base64encodedimagedata',
        supervisorComments: 'Reviewed and approved',
      };

      const result = addSignatureSchema.safeParse(validSignature);
      expect(result.success).toBe(true);
    });

    it('should validate all signer relationships', () => {
      const relationships = [
        'SELF',
        'SPOUSE',
        'CHILD',
        'PARENT',
        'SIBLING',
        'LEGAL_GUARDIAN',
        'POWER_OF_ATTORNEY',
        'OTHER',
      ];

      relationships.forEach(relationship => {
        const validSignature = {
          noteId: '123e4567-e89b-12d3-a456-426614174000',
          signatureType: 'client',
          signatureData: 'base64encodedimagedata',
          signerName: 'John Doe',
          signerRelationship: relationship,
        };

        const result = addSignatureSchema.safeParse(validSignature);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty signature data', () => {
      const invalidSignature = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'caregiver',
        signatureData: '',
      };

      const result = addSignatureSchema.safeParse(invalidSignature);
      expect(result.success).toBe(false);
    });

    it('should validate IPv4 address', () => {
      const validSignature = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'caregiver',
        signatureData: 'base64encodedimagedata',
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        ipAddress: '192.168.1.1',
      };

      const result = addSignatureSchema.safeParse(validSignature);
      expect(result.success).toBe(true);
    });

    it('should validate IPv6 address', () => {
      const validSignature = {
        noteId: '123e4567-e89b-12d3-a456-426614174000',
        signatureType: 'caregiver',
        signatureData: 'base64encodedimagedata',
        // eslint-disable-next-line sonarjs/no-hardcoded-ip
        ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      };

      const result = addSignatureSchema.safeParse(validSignature);
      expect(result.success).toBe(true);
    });
  });

  describe('createNoteTemplateSchema', () => {
    it('should validate a valid template with all fields', () => {
      const validTemplate: CreateNoteTemplateInput = {
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        branchId: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Daily Care Note',
        description: 'Template for daily care notes',
        category: 'GENERAL',
        templateText: 'Client was in {{mood}} mood today. Activities: {{activities}}',
        templateHtml: '<p>Client was in {{mood}} mood today. Activities: {{activities}}</p>',
        prompts: [
          {
            id: 'mood',
            label: 'Client Mood',
            type: 'select',
            required: true,
            options: ['Good', 'Fair', 'Poor'],
          },
          {
            id: 'activities',
            label: 'Activities Performed',
            type: 'textarea',
            required: true,
          },
        ],
        defaultActivities: ['Personal Care', 'Meal Preparation'],
        requiresSignature: true,
        requiresIncidentFlag: false,
        requiresSupervisorReview: false,
        sortOrder: 10,
      };

      const result = createNoteTemplateSchema.safeParse(validTemplate);
      expect(result.success).toBe(true);
    });

    it('should validate a minimal template', () => {
      const validTemplate: CreateNoteTemplateInput = {
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Simple Template',
        category: 'GENERAL',
        templateText: 'Template text',
      };

      const result = createNoteTemplateSchema.safeParse(validTemplate);
      expect(result.success).toBe(true);
    });

    it('should validate all template categories', () => {
      const categories = [
        'GENERAL',
        'INCIDENT',
        'MEDICATION',
        'BEHAVIORAL',
        'SAFETY',
        'REFUSAL',
        'EMERGENCY',
        'ASSESSMENT',
        'ADL',
        'COMMUNICATION',
        'OTHER',
      ];

      categories.forEach(category => {
        const validTemplate = {
          organizationId: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Template',
          category,
          templateText: 'Text',
        };

        const result = createNoteTemplateSchema.safeParse(validTemplate);
        expect(result.success).toBe(true);
      });
    });

    it('should validate all prompt types', () => {
      const types = ['text', 'textarea', 'select', 'checkbox', 'radio'];

      types.forEach(type => {
        const validTemplate = {
          organizationId: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Template',
          category: 'GENERAL',
          templateText: 'Text',
          prompts: [
            {
              id: 'field1',
              label: 'Field',
              type,
              required: false,
            },
          ],
        };

        const result = createNoteTemplateSchema.safeParse(validTemplate);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty template name', () => {
      const invalidTemplate = {
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        name: '',
        category: 'GENERAL',
        templateText: 'Text',
      };

      const result = createNoteTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });

    it('should reject template name exceeding max length', () => {
      const invalidTemplate = {
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'a'.repeat(201),
        category: 'GENERAL',
        templateText: 'Text',
      };

      const result = createNoteTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });

    it('should reject negative sort order', () => {
      const invalidTemplate = {
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Template',
        category: 'GENERAL',
        templateText: 'Text',
        sortOrder: -1,
      };

      const result = createNoteTemplateSchema.safeParse(invalidTemplate);
      expect(result.success).toBe(false);
    });
  });

  describe('updateNoteTemplateSchema', () => {
    it('should validate a full update', () => {
      const validUpdate: UpdateNoteTemplateInput = {
        name: 'Updated Template',
        description: 'Updated description',
        category: 'MEDICATION',
        templateText: 'Updated text',
        templateHtml: '<p>Updated text</p>',
        prompts: [],
        defaultActivities: ['Activity 1'],
        requiresSignature: false,
        requiresIncidentFlag: true,
        requiresSupervisorReview: true,
        isActive: true,
        sortOrder: 20,
      };

      const result = updateNoteTemplateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate a partial update', () => {
      const validUpdate: UpdateNoteTemplateInput = {
        name: 'Updated Name',
      };

      const result = updateNoteTemplateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate an empty update', () => {
      const emptyUpdate = {};
      const result = updateNoteTemplateSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('visitNoteSearchFiltersSchema', () => {
    it('should validate filters with all fields', () => {
      const validFilters = {
        visitId: '123e4567-e89b-12d3-a456-426614174000',
        visitIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
        caregiverId: '123e4567-e89b-12d3-a456-426614174002',
        organizationId: '123e4567-e89b-12d3-a456-426614174003',
        branchId: '123e4567-e89b-12d3-a456-426614174004',
        noteType: ['GENERAL', 'CLINICAL'],
        isIncident: true,
        incidentSeverity: ['MEDIUM', 'HIGH'],
        isLocked: false,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
        requiresSignature: true,
        caregiverSigned: true,
        clientSigned: false,
        syncPending: true,
      };

      const result = visitNoteSearchFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should validate empty filters', () => {
      const emptyFilters = {};
      const result = visitNoteSearchFiltersSchema.safeParse(emptyFilters);
      expect(result.success).toBe(true);
    });

    it('should coerce date strings to dates', () => {
      const filters = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      };

      const result = visitNoteSearchFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateFrom).toBeInstanceOf(Date);
        expect(result.data.dateTo).toBeInstanceOf(Date);
      }
    });
  });

  describe('templateSearchFiltersSchema', () => {
    it('should validate filters with all fields', () => {
      const validFilters = {
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        branchId: '123e4567-e89b-12d3-a456-426614174002',
        category: ['GENERAL', 'MEDICATION'],
        isActive: true,
        isSystemTemplate: false,
      };

      const result = templateSearchFiltersSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should validate empty filters', () => {
      const emptyFilters = {};
      const result = templateSearchFiltersSchema.safeParse(emptyFilters);
      expect(result.success).toBe(true);
    });
  });
});
