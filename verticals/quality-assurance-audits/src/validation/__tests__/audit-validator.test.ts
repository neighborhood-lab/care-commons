/**
 * Audit Validator Tests
 *
 * Tests Zod schemas for quality assurance and audit validation:
 * - Enum schemas (audit type, status, priority, severity, etc.)
 * - Create audit schema with date validation
 * - Update audit schema with complex date refinements
 * - Create finding schema
 * - Create corrective action schema with business rules
 * - Update progress schema
 */

import { describe, it, expect } from 'vitest';
import {
  auditTypeSchema,
  auditStatusSchema,
  auditPrioritySchema,
  findingSeveritySchema,
  findingCategorySchema,
  createAuditSchema,
  updateAuditSchema,
  createAuditFindingSchema,
  createCorrectiveActionSchema,
  updateCorrectiveActionProgressSchema,
} from '../audit-validator.js';

// Fixed timestamps for deterministic tests
const FIXED_DATE = '2024-01-15T10:00:00.000Z';
const PAST_DATE = '2024-01-10T10:00:00.000Z';
const FUTURE_DATE = '2026-01-15T10:00:00.000Z';
const NEAR_FUTURE_DATE = '2025-12-15T10:00:00.000Z';

describe('Audit Validator', () => {
  describe('Enum Schemas', () => {
    describe('auditTypeSchema', () => {
      it('should accept valid audit types', () => {
        const validTypes = [
          'COMPLIANCE',
          'QUALITY',
          'SAFETY',
          'DOCUMENTATION',
          'FINANCIAL',
          'MEDICATION',
          'INFECTION_CONTROL',
          'TRAINING',
          'INTERNAL',
          'EXTERNAL',
        ];

        validTypes.forEach((type) => {
          expect(auditTypeSchema.parse(type)).toBe(type);
        });
      });

      it('should reject invalid audit types', () => {
        expect(() => auditTypeSchema.parse('INVALID')).toThrow();
        expect(() => auditTypeSchema.parse('')).toThrow();
      });
    });

    describe('auditStatusSchema', () => {
      it('should accept valid audit statuses', () => {
        const validStatuses = [
          'DRAFT',
          'SCHEDULED',
          'IN_PROGRESS',
          'FINDINGS_REVIEW',
          'CORRECTIVE_ACTIONS',
          'COMPLETED',
          'APPROVED',
          'ARCHIVED',
        ];

        validStatuses.forEach((status) => {
          expect(auditStatusSchema.parse(status)).toBe(status);
        });
      });

      it('should reject invalid audit statuses', () => {
        expect(() => auditStatusSchema.parse('PENDING')).toThrow();
      });
    });

    describe('auditPrioritySchema', () => {
      it('should accept valid priorities', () => {
        ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].forEach((priority) => {
          expect(auditPrioritySchema.parse(priority)).toBe(priority);
        });
      });
    });

    describe('findingSeveritySchema', () => {
      it('should accept valid severities', () => {
        ['CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION'].forEach((severity) => {
          expect(findingSeveritySchema.parse(severity)).toBe(severity);
        });
      });
    });

    describe('findingCategorySchema', () => {
      it('should accept all finding categories', () => {
        const validCategories = [
          'DOCUMENTATION',
          'TRAINING',
          'POLICY_PROCEDURE',
          'SAFETY',
          'QUALITY_OF_CARE',
          'INFECTION_CONTROL',
          'MEDICATION',
          'EQUIPMENT',
          'STAFFING',
          'COMMUNICATION',
          'FINANCIAL',
          'REGULATORY',
          'OTHER',
        ];

        validCategories.forEach((category) => {
          expect(findingCategorySchema.parse(category)).toBe(category);
        });
      });
    });
  });

  describe('createAuditSchema', () => {
    const validAuditInput = {
      title: 'Annual HIPAA Compliance Audit',
      description: 'Comprehensive audit of HIPAA privacy and security compliance',
      auditType: 'COMPLIANCE' as const,
      priority: 'HIGH' as const,
      scope: 'ORGANIZATION' as const,
      scopeEntityId: '123e4567-e89b-12d3-a456-426614174000',
      scopeEntityName: 'Main Organization',
      scheduledStartDate: FIXED_DATE,
      scheduledEndDate: FUTURE_DATE,
      leadAuditorId: '223e4567-e89b-12d3-a456-426614174000',
      auditorIds: ['323e4567-e89b-12d3-a456-426614174000'],
      standardsReference: 'HIPAA 45 CFR Part 160, 164',
      auditCriteria: ['Privacy Rule Compliance', 'Security Rule Compliance'],
      templateId: '423e4567-e89b-12d3-a456-426614174000',
    };

    it('should accept valid audit creation input', () => {
      const result = createAuditSchema.parse(validAuditInput);
      expect(result).toEqual(validAuditInput);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        title: 'Quick Audit',
        description: 'Quick check',
        auditType: 'INTERNAL' as const,
        priority: 'MEDIUM' as const,
        scope: 'BRANCH' as const,
        scheduledStartDate: FIXED_DATE,
        scheduledEndDate: FUTURE_DATE,
        leadAuditorId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = createAuditSchema.parse(minimalInput);
      expect(result.title).toBe('Quick Audit');
    });

    it('should reject empty title', () => {
      const invalidInput = { ...validAuditInput, title: '' };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject title exceeding max length', () => {
      const invalidInput = { ...validAuditInput, title: 'A'.repeat(201) };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty description', () => {
      const invalidInput = { ...validAuditInput, description: '' };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject description exceeding max length', () => {
      const invalidInput = { ...validAuditInput, description: 'A'.repeat(2001) };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid auditType', () => {
      const invalidInput = { ...validAuditInput, auditType: 'INVALID' as any };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid priority', () => {
      const invalidInput = { ...validAuditInput, priority: 'URGENT' as any };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid scope', () => {
      const invalidInput = { ...validAuditInput, scope: 'REGION' as any };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid scopeEntityId UUID', () => {
      const invalidInput = { ...validAuditInput, scopeEntityId: 'not-a-uuid' };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid leadAuditorId UUID', () => {
      const invalidInput = { ...validAuditInput, leadAuditorId: 'invalid-uuid' };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidInput = { ...validAuditInput, scheduledStartDate: '2024-01-15' };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject scheduledEndDate before scheduledStartDate', () => {
      const invalidInput = {
        ...validAuditInput,
        scheduledStartDate: FUTURE_DATE,
        scheduledEndDate: PAST_DATE,
      };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow(/after scheduled start date/);
    });

    it('should reject scheduledEndDate equal to scheduledStartDate', () => {
      const invalidInput = {
        ...validAuditInput,
        scheduledStartDate: FIXED_DATE,
        scheduledEndDate: FIXED_DATE,
      };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow(/after scheduled start date/);
    });

    it('should accept auditorIds array', () => {
      const input = {
        ...validAuditInput,
        auditorIds: [
          '323e4567-e89b-12d3-a456-426614174000',
          '423e4567-e89b-12d3-a456-426614174000',
        ],
      };
      const result = createAuditSchema.parse(input);
      expect(result.auditorIds).toHaveLength(2);
    });

    it('should reject invalid UUID in auditorIds array', () => {
      const invalidInput = { ...validAuditInput, auditorIds: ['not-a-uuid'] };
      expect(() => createAuditSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('updateAuditSchema', () => {
    const validUpdateInput = {
      title: 'Updated Audit Title',
      description: 'Updated description',
      status: 'IN_PROGRESS' as const,
      priority: 'CRITICAL' as const,
      scheduledStartDate: FIXED_DATE,
      scheduledEndDate: FUTURE_DATE,
      actualStartDate: NEAR_FUTURE_DATE,
      actualEndDate: FUTURE_DATE,
      executiveSummary: 'Comprehensive summary of audit findings',
      recommendations: 'Implement corrective actions immediately',
      complianceScore: 85.5,
      overallRating: 'GOOD' as const,
    };

    it('should accept valid update input', () => {
      const result = updateAuditSchema.parse(validUpdateInput);
      expect(result).toEqual(validUpdateInput);
    });

    it('should accept partial updates', () => {
      const partialInput = { status: 'COMPLETED' as const };
      const result = updateAuditSchema.parse(partialInput);
      expect(result.status).toBe('COMPLETED');
    });

    it('should accept empty update object', () => {
      const result = updateAuditSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject invalid complianceScore below minimum', () => {
      const invalidInput = { complianceScore: -1 };
      expect(() => updateAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid complianceScore above maximum', () => {
      const invalidInput = { complianceScore: 101 };
      expect(() => updateAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should accept complianceScore at boundaries', () => {
      expect(updateAuditSchema.parse({ complianceScore: 0 }).complianceScore).toBe(0);
      expect(updateAuditSchema.parse({ complianceScore: 100 }).complianceScore).toBe(100);
    });

    it('should reject scheduledEndDate before scheduledStartDate', () => {
      const invalidInput = {
        scheduledStartDate: FUTURE_DATE,
        scheduledEndDate: PAST_DATE,
      };
      expect(() => updateAuditSchema.parse(invalidInput)).toThrow(/after scheduled start date/);
    });

    it('should reject actualEndDate before actualStartDate', () => {
      const invalidInput = {
        actualStartDate: FUTURE_DATE,
        actualEndDate: NEAR_FUTURE_DATE,
      };
      expect(() => updateAuditSchema.parse(invalidInput)).toThrow(/after actual start date/);
    });

    it('should accept valid date pairs', () => {
      const validInput = {
        scheduledStartDate: FIXED_DATE,
        scheduledEndDate: FUTURE_DATE,
        actualStartDate: NEAR_FUTURE_DATE,
        actualEndDate: FUTURE_DATE,
      };
      const result = updateAuditSchema.parse(validInput);
      expect(result.scheduledStartDate).toBe(FIXED_DATE);
      expect(result.actualEndDate).toBe(FUTURE_DATE);
    });

    it('should reject executiveSummary exceeding max length', () => {
      const invalidInput = { executiveSummary: 'A'.repeat(5001) };
      expect(() => updateAuditSchema.parse(invalidInput)).toThrow();
    });

    it('should reject recommendations exceeding max length', () => {
      const invalidInput = { recommendations: 'A'.repeat(5001) };
      expect(() => updateAuditSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('createAuditFindingSchema', () => {
    const validFindingInput = {
      auditId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Missing documentation for medication administration',
      description: 'Several MAR sheets were incomplete or missing signatures',
      category: 'DOCUMENTATION' as const,
      severity: 'MAJOR' as const,
      standardReference: 'HIPAA 164.316(b)(1)',
      regulatoryRequirement: 'Covered entities must maintain complete medical records',
      evidenceDescription: 'Photos of incomplete MAR sheets from 3 clients',
      evidenceUrls: ['https://example.com/evidence1.jpg', 'https://example.com/evidence2.jpg'],
      locationDescription: 'Branch Office - Medication Storage Room',
      affectedEntity: 'DOCUMENTATION' as const,
      affectedEntityId: '223e4567-e89b-12d3-a456-426614174000',
      affectedEntityName: 'Medication Administration Records',
      potentialImpact: 'Non-compliance with state regulations, potential medication errors',
      requiredCorrectiveAction: 'Implement daily MAR review process and train all staff',
      recommendedTimeframe: 'Within 48 hours',
      targetResolutionDate: FUTURE_DATE,
    };

    it('should accept valid finding input', () => {
      const result = createAuditFindingSchema.parse(validFindingInput);
      expect(result).toEqual(validFindingInput);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        auditId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Minor issue',
        description: 'Small problem found',
        category: 'OTHER' as const,
        severity: 'MINOR' as const,
        requiredCorrectiveAction: 'Fix the issue',
      };

      const result = createAuditFindingSchema.parse(minimalInput);
      expect(result.title).toBe('Minor issue');
    });

    it('should reject invalid auditId UUID', () => {
      const invalidInput = { ...validFindingInput, auditId: 'not-a-uuid' };
      expect(() => createAuditFindingSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty title', () => {
      const invalidInput = { ...validFindingInput, title: '' };
      expect(() => createAuditFindingSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid category', () => {
      const invalidInput = { ...validFindingInput, category: 'INVALID' as any };
      expect(() => createAuditFindingSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid severity', () => {
      const invalidInput = { ...validFindingInput, severity: 'SEVERE' as any };
      expect(() => createAuditFindingSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid URL in evidenceUrls', () => {
      const invalidInput = { ...validFindingInput, evidenceUrls: ['not-a-url'] };
      expect(() => createAuditFindingSchema.parse(invalidInput)).toThrow();
    });

    it('should accept valid evidenceUrls array', () => {
      const input = {
        ...validFindingInput,
        evidenceUrls: ['https://example.com/doc1.pdf', 'https://example.com/doc2.pdf'],
      };
      const result = createAuditFindingSchema.parse(input);
      expect(result.evidenceUrls).toHaveLength(2);
    });

    it('should reject empty requiredCorrectiveAction', () => {
      const invalidInput = { ...validFindingInput, requiredCorrectiveAction: '' };
      expect(() => createAuditFindingSchema.parse(invalidInput)).toThrow();
    });

    it('should reject requiredCorrectiveAction exceeding max length', () => {
      const invalidInput = { ...validFindingInput, requiredCorrectiveAction: 'A'.repeat(2001) };
      expect(() => createAuditFindingSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('createCorrectiveActionSchema', () => {
    const validActionInput = {
      findingId: '123e4567-e89b-12d3-a456-426614174000',
      auditId: '223e4567-e89b-12d3-a456-426614174000',
      title: 'Implement MAR Review Process',
      description: 'Establish daily medication administration record review',
      actionType: 'SHORT_TERM' as const,
      rootCause: 'Lack of systematic review process for MAR sheets',
      contributingFactors: ['Staff workload', 'Inadequate training'],
      specificActions: [
        'Create MAR review checklist',
        'Train all nursing staff',
        'Assign daily review responsibilities',
      ],
      responsiblePersonId: '323e4567-e89b-12d3-a456-426614174000',
      targetCompletionDate: FUTURE_DATE,
      resourcesRequired: '8 hours staff training time, printed checklists',
      estimatedCost: 500,
      monitoringPlan: 'Weekly supervisor spot checks for first month',
      successCriteria: ['100% MAR completion', 'Zero signature omissions'],
      verificationMethod: 'Monthly audit of MAR sheets',
    };

    it('should accept valid corrective action input', () => {
      const result = createCorrectiveActionSchema.parse(validActionInput);
      expect(result).toEqual(validActionInput);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        findingId: '123e4567-e89b-12d3-a456-426614174000',
        auditId: '223e4567-e89b-12d3-a456-426614174000',
        title: 'Fix Issue',
        description: 'Resolve the problem',
        actionType: 'IMMEDIATE' as const,
        specificActions: ['Take action'],
        responsiblePersonId: '323e4567-e89b-12d3-a456-426614174000',
        targetCompletionDate: FUTURE_DATE,
      };

      const result = createCorrectiveActionSchema.parse(minimalInput);
      expect(result.title).toBe('Fix Issue');
    });

    it('should reject invalid findingId UUID', () => {
      const invalidInput = { ...validActionInput, findingId: 'not-a-uuid' };
      expect(() => createCorrectiveActionSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty specificActions array', () => {
      const invalidInput = { ...validActionInput, specificActions: [] };
      expect(() => createCorrectiveActionSchema.parse(invalidInput)).toThrow();
    });

    it('should reject targetCompletionDate in the past', () => {
      const invalidInput = { ...validActionInput, targetCompletionDate: PAST_DATE };
      expect(() => createCorrectiveActionSchema.parse(invalidInput)).toThrow(/cannot be in the past/);
    });

    it('should reject negative estimatedCost', () => {
      const invalidInput = { ...validActionInput, estimatedCost: -100 };
      expect(() => createCorrectiveActionSchema.parse(invalidInput)).toThrow();
    });

    it('should accept estimatedCost of zero', () => {
      const input = { ...validActionInput, estimatedCost: 0 };
      const result = createCorrectiveActionSchema.parse(input);
      expect(result.estimatedCost).toBe(0);
    });

    it('should reject empty title', () => {
      const invalidInput = { ...validActionInput, title: '' };
      expect(() => createCorrectiveActionSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid actionType', () => {
      const invalidInput = { ...validActionInput, actionType: 'URGENT' as any };
      expect(() => createCorrectiveActionSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('updateCorrectiveActionProgressSchema', () => {
    const validProgressInput = {
      progressNote: 'Completed training for 15 of 20 staff members',
      completionPercentage: 75,
      issuesEncountered: 'Two staff members on medical leave',
      nextSteps: 'Schedule training for remaining staff next week',
    };

    it('should accept valid progress update', () => {
      const result = updateCorrectiveActionProgressSchema.parse(validProgressInput);
      expect(result).toEqual(validProgressInput);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        progressNote: 'Making progress',
        completionPercentage: 50,
      };

      const result = updateCorrectiveActionProgressSchema.parse(minimalInput);
      expect(result.completionPercentage).toBe(50);
    });

    it('should reject empty progressNote', () => {
      const invalidInput = { ...validProgressInput, progressNote: '' };
      expect(() => updateCorrectiveActionProgressSchema.parse(invalidInput)).toThrow();
    });

    it('should reject completionPercentage below minimum', () => {
      const invalidInput = { ...validProgressInput, completionPercentage: -1 };
      expect(() => updateCorrectiveActionProgressSchema.parse(invalidInput)).toThrow();
    });

    it('should reject completionPercentage above maximum', () => {
      const invalidInput = { ...validProgressInput, completionPercentage: 101 };
      expect(() => updateCorrectiveActionProgressSchema.parse(invalidInput)).toThrow();
    });

    it('should accept completionPercentage at boundaries', () => {
      expect(
        updateCorrectiveActionProgressSchema.parse({ ...validProgressInput, completionPercentage: 0 })
          .completionPercentage
      ).toBe(0);
      expect(
        updateCorrectiveActionProgressSchema.parse({ ...validProgressInput, completionPercentage: 100 })
          .completionPercentage
      ).toBe(100);
    });

    it('should reject progressNote exceeding max length', () => {
      const invalidInput = { ...validProgressInput, progressNote: 'A'.repeat(2001) };
      expect(() => updateCorrectiveActionProgressSchema.parse(invalidInput)).toThrow();
    });

    it('should reject issuesEncountered exceeding max length', () => {
      const invalidInput = { ...validProgressInput, issuesEncountered: 'A'.repeat(1001) };
      expect(() => updateCorrectiveActionProgressSchema.parse(invalidInput)).toThrow();
    });

    it('should reject nextSteps exceeding max length', () => {
      const invalidInput = { ...validProgressInput, nextSteps: 'A'.repeat(1001) };
      expect(() => updateCorrectiveActionProgressSchema.parse(invalidInput)).toThrow();
    });
  });
});
