/**
 * Incident Validator Tests
 *
 * Tests Zod schema validation for incident reporting:
 * - Incident type and severity enums
 * - Required fields validation
 * - Optional field handling
 * - DateTime format validation
 * - UUID format validation
 * - String length constraints
 */

import { describe, it, expect } from 'vitest';
import {
  incidentTypeSchema,
  incidentSeveritySchema,
  incidentStatusSchema,
  injurySeveritySchema,
  createIncidentSchema,
  updateIncidentSchema,
} from '../incident-validator.js';

describe('Incident Validator', () => {
  describe('Enum Schemas', () => {
    describe('incidentTypeSchema', () => {
      it('should accept valid incident types', () => {
        const validTypes = [
          'FALL',
          'MEDICATION_ERROR',
          'INJURY',
          'ABUSE_ALLEGATION',
          'NEGLECT_ALLEGATION',
          'EXPLOITATION_ALLEGATION',
          'EQUIPMENT_FAILURE',
          'EMERGENCY_HOSPITALIZATION',
          'DEATH',
          'ELOPEMENT',
          'BEHAVIORAL_INCIDENT',
          'INFECTION',
          'PRESSURE_INJURY',
          'CLIENT_REFUSAL',
          'OTHER',
        ];

        validTypes.forEach((type) => {
          const result = incidentTypeSchema.safeParse(type);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid incident types', () => {
        const result = incidentTypeSchema.safeParse('INVALID_TYPE');
        expect(result.success).toBe(false);
      });
    });

    describe('incidentSeveritySchema', () => {
      it('should accept valid severities', () => {
        const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        validSeverities.forEach((severity) => {
          const result = incidentSeveritySchema.safeParse(severity);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid severities', () => {
        const result = incidentSeveritySchema.safeParse('SUPER_CRITICAL');
        expect(result.success).toBe(false);
      });
    });

    describe('incidentStatusSchema', () => {
      it('should accept valid statuses', () => {
        const validStatuses = [
          'REPORTED',
          'UNDER_REVIEW',
          'INVESTIGATION_REQUIRED',
          'RESOLVED',
          'CLOSED',
        ];
        validStatuses.forEach((status) => {
          const result = incidentStatusSchema.safeParse(status);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid statuses', () => {
        const result = incidentStatusSchema.safeParse('PENDING');
        expect(result.success).toBe(false);
      });
    });

    describe('injurySeveritySchema', () => {
      it('should accept valid injury severities', () => {
        const validSeverities = ['NONE', 'MINOR', 'MODERATE', 'SEVERE', 'FATAL'];
        validSeverities.forEach((severity) => {
          const result = injurySeveritySchema.safeParse(severity);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid injury severities', () => {
        const result = injurySeveritySchema.safeParse('MEDIUM');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('createIncidentSchema', () => {
    const validIncident = {
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      incidentType: 'FALL',
      severity: 'HIGH',
      occurredAt: '2025-01-15T14:30:00Z',
      location: '123 Main St, Room 5',
      description: 'Client fell while walking to bathroom. No visible injuries observed.',
      immediateAction: 'Assisted client back to bed, vital signs checked, physician notified.',
    };

    it('should accept valid incident with required fields only', () => {
      const result = createIncidentSchema.safeParse(validIncident);
      expect(result.success).toBe(true);
    });

    it('should accept incident with all optional fields', () => {
      const fullIncident = {
        ...validIncident,
        discoveredAt: '2025-01-15T14:32:00Z',
        witnessIds: ['223e4567-e89b-12d3-a456-426614174001'],
        involvedStaffIds: ['323e4567-e89b-12d3-a456-426614174002'],
        injurySeverity: 'MINOR',
        injuryDescription: 'Small bruise on left arm',
        medicalAttentionRequired: true,
        medicalAttentionProvided: 'Ice pack applied, bruise monitored',
        emergencyServicesContacted: false,
        familyNotified: true,
        familyNotifiedAt: '2025-01-15T14:45:00Z',
        familyNotificationNotes: 'Spoke with son, reassured no serious injury',
        physicianNotified: true,
        physicianNotifiedAt: '2025-01-15T14:35:00Z',
        physicianOrders: 'Monitor for 24 hours, no treatment needed',
      };

      const result = createIncidentSchema.safeParse(fullIncident);
      expect(result.success).toBe(true);
    });

    it('should reject incident without required clientId', () => {
      const incidentWithoutClientId = {
        incidentType: validIncident.incidentType,
        severity: validIncident.severity,
        occurredAt: validIncident.occurredAt,
        location: validIncident.location,
        description: validIncident.description,
        immediateAction: validIncident.immediateAction,
      };
      const result = createIncidentSchema.safeParse(incidentWithoutClientId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain('clientId');
      }
    });

    it('should reject incident with invalid UUID', () => {
      const incident = { ...validIncident, clientId: 'not-a-uuid' };
      const result = createIncidentSchema.safeParse(incident);
      expect(result.success).toBe(false);
    });

    it('should reject incident with invalid datetime', () => {
      const incident = { ...validIncident, occurredAt: '2025-01-15' };
      const result = createIncidentSchema.safeParse(incident);
      expect(result.success).toBe(false);
    });

    it('should reject incident with description too short', () => {
      const incident = { ...validIncident, description: 'Too short' };
      const result = createIncidentSchema.safeParse(incident);
      expect(result.success).toBe(false);
    });

    it('should reject incident with empty location', () => {
      const incident = { ...validIncident, location: '' };
      const result = createIncidentSchema.safeParse(incident);
      expect(result.success).toBe(false);
    });

    it('should reject incident with location too long', () => {
      const incident = { ...validIncident, location: 'x'.repeat(201) };
      const result = createIncidentSchema.safeParse(incident);
      expect(result.success).toBe(false);
    });

    it('should reject incident without immediateAction', () => {
      const incidentWithoutAction = {
        clientId: validIncident.clientId,
        incidentType: validIncident.incidentType,
        severity: validIncident.severity,
        occurredAt: validIncident.occurredAt,
        location: validIncident.location,
        description: validIncident.description,
      };
      const result = createIncidentSchema.safeParse(incidentWithoutAction);
      expect(result.success).toBe(false);
    });

    it('should accept incident with empty optional arrays', () => {
      const incident = {
        ...validIncident,
        witnessIds: [],
        involvedStaffIds: [],
      };
      const result = createIncidentSchema.safeParse(incident);
      expect(result.success).toBe(true);
    });

    it('should reject incident with invalid UUID in array', () => {
      const incident = {
        ...validIncident,
        witnessIds: ['not-a-uuid'],
      };
      const result = createIncidentSchema.safeParse(incident);
      expect(result.success).toBe(false);
    });
  });

  describe('updateIncidentSchema', () => {
    it('should accept empty update object', () => {
      const result = updateIncidentSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept status update', () => {
      const result = updateIncidentSchema.safeParse({ status: 'UNDER_REVIEW' });
      expect(result.success).toBe(true);
    });

    it('should accept severity update', () => {
      const result = updateIncidentSchema.safeParse({ severity: 'CRITICAL' });
      expect(result.success).toBe(true);
    });

    it('should accept investigation fields', () => {
      const update = {
        investigationRequired: true,
        investigationStartedAt: '2025-01-16T09:00:00Z',
        investigationCompletedAt: '2025-01-18T17:00:00Z',
        investigationFindings: 'Incident was accidental, no negligence found',
        preventativeMeasures: 'Install additional handrails in bathroom',
        policyChangesRecommended: 'Update fall prevention protocol',
      };
      const result = updateIncidentSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should accept state reporting fields', () => {
      const update = {
        stateReportingRequired: true,
        stateReportedAt: '2025-01-15T16:00:00Z',
        stateReportNumber: 'TX-2025-001234',
        stateAgency: 'Texas Department of Aging and Disability Services',
      };
      const result = updateIncidentSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should accept follow-up fields', () => {
      const update = {
        followUpRequired: true,
        followUpCompletedAt: '2025-01-20T10:00:00Z',
        followUpNotes: 'Client recovering well, no further issues',
      };
      const result = updateIncidentSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should accept resolution fields', () => {
      const update = {
        status: 'RESOLVED',
        resolutionNotes: 'All preventative measures implemented, case closed',
        resolvedAt: '2025-01-20T15:00:00Z',
        closedAt: '2025-01-20T15:30:00Z',
      };
      const result = updateIncidentSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should reject update with description too short', () => {
      const result = updateIncidentSchema.safeParse({ description: 'Short' });
      expect(result.success).toBe(false);
    });

    it('should reject update with invalid datetime', () => {
      const result = updateIncidentSchema.safeParse({
        investigationStartedAt: 'not-a-datetime',
      });
      expect(result.success).toBe(false);
    });

    it('should reject update with stateReportNumber too long', () => {
      const result = updateIncidentSchema.safeParse({
        stateReportNumber: 'x'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should reject update with stateAgency too long', () => {
      const result = updateIncidentSchema.safeParse({
        stateAgency: 'x'.repeat(201),
      });
      expect(result.success).toBe(false);
    });

    it('should accept all updatable fields at once', () => {
      const comprehensiveUpdate = {
        status: 'CLOSED',
        severity: 'MEDIUM',
        description: 'Updated description with more details about the incident.',
        immediateAction: 'Updated immediate action taken',
        injurySeverity: 'MINOR',
        injuryDescription: 'Updated injury description',
        medicalAttentionRequired: true,
        medicalAttentionProvided: 'Updated medical attention details',
        emergencyServicesContacted: true,
        emergencyServicesDetails: 'Ambulance called, transported to ER',
        familyNotified: true,
        familyNotifiedAt: '2025-01-15T14:45:00Z',
        familyNotificationNotes: 'Family informed and visiting',
        physicianNotified: true,
        physicianNotifiedAt: '2025-01-15T14:50:00Z',
        physicianOrders: 'X-ray ordered, results pending',
        stateReportingRequired: true,
        stateReportedAt: '2025-01-16T08:00:00Z',
        stateReportNumber: 'STATE-12345',
        stateAgency: 'Department of Health Services',
        investigationRequired: true,
        investigationStartedAt: '2025-01-16T09:00:00Z',
        investigationCompletedAt: '2025-01-18T17:00:00Z',
        investigationFindings: 'Comprehensive investigation findings',
        preventativeMeasures: 'Implemented safety measures',
        policyChangesRecommended: 'Policy updates recommended',
        followUpRequired: true,
        followUpCompletedAt: '2025-01-20T10:00:00Z',
        followUpNotes: 'Follow-up completed successfully',
        resolutionNotes: 'Incident fully resolved',
        resolvedAt: '2025-01-20T15:00:00Z',
        closedAt: '2025-01-20T16:00:00Z',
      };

      const result = updateIncidentSchema.safeParse(comprehensiveUpdate);
      expect(result.success).toBe(true);
    });
  });
});
