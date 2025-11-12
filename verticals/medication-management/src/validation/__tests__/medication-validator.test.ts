/**
 * Medication Validator Tests
 *
 * Tests all Zod schemas for medication management validation:
 * - Enum schemas (route, status, administration status)
 * - Create medication schema
 * - Update medication schema
 * - Record administration schema with business rules
 */

import { describe, it, expect } from 'vitest';
import {
  medicationRouteSchema,
  medicationStatusSchema,
  administrationStatusSchema,
  createMedicationSchema,
  updateMedicationSchema,
  recordAdministrationSchema,
} from '../medication-validator.js';

// Fixed timestamp for deterministic tests
const FIXED_DATE = '2024-01-15T10:00:00.000Z';
const PAST_DATE = '2024-01-10T10:00:00.000Z';
const FUTURE_DATE = '2026-01-15T10:00:00.000Z';

describe('Medication Validator', () => {
  describe('medicationRouteSchema', () => {
    it('should accept valid medication routes', () => {
      expect(medicationRouteSchema.parse('ORAL')).toBe('ORAL');
      expect(medicationRouteSchema.parse('TOPICAL')).toBe('TOPICAL');
      expect(medicationRouteSchema.parse('INJECTION')).toBe('INJECTION');
      expect(medicationRouteSchema.parse('INHALATION')).toBe('INHALATION');
      expect(medicationRouteSchema.parse('OTHER')).toBe('OTHER');
    });

    it('should reject invalid medication routes', () => {
      expect(() => medicationRouteSchema.parse('INVALID')).toThrow();
      expect(() => medicationRouteSchema.parse('')).toThrow();
      expect(() => medicationRouteSchema.parse(null)).toThrow();
      expect(() => medicationRouteSchema.parse(undefined)).toThrow();
    });
  });

  describe('medicationStatusSchema', () => {
    it('should accept valid medication statuses', () => {
      expect(medicationStatusSchema.parse('ACTIVE')).toBe('ACTIVE');
      expect(medicationStatusSchema.parse('DISCONTINUED')).toBe('DISCONTINUED');
      expect(medicationStatusSchema.parse('ON_HOLD')).toBe('ON_HOLD');
    });

    it('should reject invalid medication statuses', () => {
      expect(() => medicationStatusSchema.parse('INVALID')).toThrow();
      expect(() => medicationStatusSchema.parse('PENDING')).toThrow();
      expect(() => medicationStatusSchema.parse('')).toThrow();
    });
  });

  describe('administrationStatusSchema', () => {
    it('should accept valid administration statuses', () => {
      expect(administrationStatusSchema.parse('GIVEN')).toBe('GIVEN');
      expect(administrationStatusSchema.parse('REFUSED')).toBe('REFUSED');
      expect(administrationStatusSchema.parse('HELD')).toBe('HELD');
      expect(administrationStatusSchema.parse('MISSED')).toBe('MISSED');
    });

    it('should reject invalid administration statuses', () => {
      expect(() => administrationStatusSchema.parse('INVALID')).toThrow();
      expect(() => administrationStatusSchema.parse('SKIPPED')).toThrow();
      expect(() => administrationStatusSchema.parse('')).toThrow();
    });
  });

  describe('createMedicationSchema', () => {
    const validCreateInput = {
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      medicationName: 'Lisinopril',
      genericName: 'Lisinopril',
      dosage: '10mg',
      route: 'ORAL' as const,
      frequency: 'Once daily',
      instructions: 'Take with food',
      prescribedBy: 'Dr. Jane Smith',
      prescribedDate: FIXED_DATE,
      startDate: FIXED_DATE,
      endDate: FUTURE_DATE,
      status: 'ACTIVE' as const,
      refillsRemaining: 3,
      sideEffects: ['Dizziness', 'Dry cough'],
      warnings: ['Monitor blood pressure'],
    };

    it('should accept valid medication creation input', () => {
      const result = createMedicationSchema.parse(validCreateInput);
      expect(result).toEqual(validCreateInput);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        medicationName: 'Aspirin',
        dosage: '81mg',
        route: 'ORAL' as const,
        frequency: 'Once daily',
        prescribedBy: 'Dr. Smith',
        prescribedDate: FIXED_DATE,
        startDate: FIXED_DATE,
      };

      const result = createMedicationSchema.parse(minimalInput);
      expect(result.clientId).toBe(minimalInput.clientId);
      expect(result.medicationName).toBe(minimalInput.medicationName);
    });

    it('should reject invalid clientId UUID', () => {
      const invalidInput = { ...validCreateInput, clientId: 'not-a-uuid' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty medicationName', () => {
      const invalidInput = { ...validCreateInput, medicationName: '' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject medicationName exceeding max length', () => {
      const invalidInput = { ...validCreateInput, medicationName: 'A'.repeat(201) };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty dosage', () => {
      const invalidInput = { ...validCreateInput, dosage: '' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject dosage exceeding max length', () => {
      const invalidInput = { ...validCreateInput, dosage: 'A'.repeat(101) };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid medication route', () => {
      const invalidInput = { ...validCreateInput, route: 'INVALID' as any };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty frequency', () => {
      const invalidInput = { ...validCreateInput, frequency: '' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject instructions exceeding max length', () => {
      const invalidInput = { ...validCreateInput, instructions: 'A'.repeat(1001) };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty prescribedBy', () => {
      const invalidInput = { ...validCreateInput, prescribedBy: '' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid prescribedDate format', () => {
      const invalidInput = { ...validCreateInput, prescribedDate: '2024-01-15' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid startDate format', () => {
      const invalidInput = { ...validCreateInput, startDate: 'not-a-date' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid endDate format', () => {
      const invalidInput = { ...validCreateInput, endDate: '15-01-2025' };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid medication status', () => {
      const invalidInput = { ...validCreateInput, status: 'EXPIRED' as any };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject negative refillsRemaining', () => {
      const invalidInput = { ...validCreateInput, refillsRemaining: -1 };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject refillsRemaining exceeding max', () => {
      const invalidInput = { ...validCreateInput, refillsRemaining: 100 };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject non-integer refillsRemaining', () => {
      const invalidInput = { ...validCreateInput, refillsRemaining: 3.5 };
      expect(() => createMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should accept valid sideEffects array', () => {
      const input = { ...validCreateInput, sideEffects: ['Nausea', 'Headache'] };
      const result = createMedicationSchema.parse(input);
      expect(result.sideEffects).toEqual(['Nausea', 'Headache']);
    });

    it('should accept valid warnings array', () => {
      const input = { ...validCreateInput, warnings: ['Do not take with alcohol'] };
      const result = createMedicationSchema.parse(input);
      expect(result.warnings).toEqual(['Do not take with alcohol']);
    });
  });

  describe('updateMedicationSchema', () => {
    const validUpdateInput = {
      medicationName: 'Lisinopril Updated',
      genericName: 'Generic Updated',
      dosage: '20mg',
      route: 'ORAL' as const,
      frequency: 'Twice daily',
      instructions: 'Take in the morning',
      prescribedBy: 'Dr. John Doe',
      prescribedDate: FIXED_DATE,
      startDate: FIXED_DATE,
      endDate: FUTURE_DATE,
      status: 'ON_HOLD' as const,
      refillsRemaining: 5,
      sideEffects: ['Updated side effect'],
      warnings: ['Updated warning'],
    };

    it('should accept valid medication update input', () => {
      const result = updateMedicationSchema.parse(validUpdateInput);
      expect(result).toEqual(validUpdateInput);
    });

    it('should accept partial update with single field', () => {
      const partialInput = { dosage: '15mg' };
      const result = updateMedicationSchema.parse(partialInput);
      expect(result.dosage).toBe('15mg');
    });

    it('should accept empty update object', () => {
      const result = updateMedicationSchema.parse({});
      expect(result).toEqual({});
    });

    it('should reject empty medicationName if provided', () => {
      const invalidInput = { medicationName: '' };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject medicationName exceeding max length', () => {
      const invalidInput = { medicationName: 'A'.repeat(201) };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject empty dosage if provided', () => {
      const invalidInput = { dosage: '' };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid route if provided', () => {
      const invalidInput = { route: 'SUBCUTANEOUS' as any };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject instructions exceeding max length', () => {
      const invalidInput = { instructions: 'A'.repeat(1001) };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid datetime format', () => {
      const invalidInput = { startDate: '2024-01-15' };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject negative refillsRemaining', () => {
      const invalidInput = { refillsRemaining: -5 };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject refillsRemaining exceeding max', () => {
      const invalidInput = { refillsRemaining: 100 };
      expect(() => updateMedicationSchema.parse(invalidInput)).toThrow();
    });
  });

  describe('recordAdministrationSchema', () => {
    const validAdministrationInput = {
      medicationId: '123e4567-e89b-12d3-a456-426614174001',
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      administeredAt: PAST_DATE,
      scheduledFor: FIXED_DATE,
      dosageGiven: '10mg',
      route: 'ORAL' as const,
      status: 'GIVEN' as const,
      notes: 'Patient took medication with breakfast',
      witnessedBy: '123e4567-e89b-12d3-a456-426614174002',
    };

    it('should accept valid administration record', () => {
      const result = recordAdministrationSchema.parse(validAdministrationInput);
      expect(result).toEqual(validAdministrationInput);
    });

    it('should accept minimal valid input', () => {
      const minimalInput = {
        medicationId: '123e4567-e89b-12d3-a456-426614174001',
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        dosageGiven: '10mg',
        route: 'ORAL' as const,
        status: 'GIVEN' as const,
      };

      const result = recordAdministrationSchema.parse(minimalInput);
      expect(result.medicationId).toBe(minimalInput.medicationId);
      expect(result.status).toBe('GIVEN');
    });

    it('should reject invalid medicationId UUID', () => {
      const invalidInput = { ...validAdministrationInput, medicationId: 'not-a-uuid' };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid clientId UUID', () => {
      const invalidInput = { ...validAdministrationInput, clientId: 'invalid-uuid' };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid administeredAt format', () => {
      const invalidInput = { ...validAdministrationInput, administeredAt: '2024-01-15' };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject administeredAt in the future', () => {
      const invalidInput = { ...validAdministrationInput, administeredAt: FUTURE_DATE };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow(/cannot be in the future/);
    });

    it('should reject empty dosageGiven', () => {
      const invalidInput = { ...validAdministrationInput, dosageGiven: '' };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject dosageGiven exceeding max length', () => {
      const invalidInput = { ...validAdministrationInput, dosageGiven: 'A'.repeat(101) };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid route', () => {
      const invalidInput = { ...validAdministrationInput, route: 'IV_PUSH' as any };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject invalid administration status', () => {
      const invalidInput = { ...validAdministrationInput, status: 'DELAYED' as any };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should reject notes exceeding max length', () => {
      const invalidInput = { ...validAdministrationInput, notes: 'A'.repeat(1001) };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should require refusalReason when status is REFUSED', () => {
      const invalidInput = {
        ...validAdministrationInput,
        status: 'REFUSED' as const,
        refusalReason: undefined,
      };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow(/Refusal reason is required/);
    });

    it('should accept refusalReason when status is REFUSED', () => {
      const validInput = {
        ...validAdministrationInput,
        status: 'REFUSED' as const,
        refusalReason: 'Patient reported nausea',
      };
      const result = recordAdministrationSchema.parse(validInput);
      expect(result.status).toBe('REFUSED');
      expect(result.refusalReason).toBe('Patient reported nausea');
    });

    it('should reject refusalReason exceeding max length', () => {
      const invalidInput = {
        ...validAdministrationInput,
        status: 'REFUSED' as const,
        refusalReason: 'A'.repeat(501),
      };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should require holdReason when status is HELD', () => {
      const invalidInput = {
        ...validAdministrationInput,
        status: 'HELD' as const,
        holdReason: undefined,
      };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow(/Hold reason is required/);
    });

    it('should accept holdReason when status is HELD', () => {
      const validInput = {
        ...validAdministrationInput,
        status: 'HELD' as const,
        holdReason: 'Doctor instruction - patient NPO for surgery',
      };
      const result = recordAdministrationSchema.parse(validInput);
      expect(result.status).toBe('HELD');
      expect(result.holdReason).toBe('Doctor instruction - patient NPO for surgery');
    });

    it('should reject holdReason exceeding max length', () => {
      const invalidInput = {
        ...validAdministrationInput,
        status: 'HELD' as const,
        holdReason: 'A'.repeat(501),
      };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should accept status MISSED without additional requirements', () => {
      const validInput = {
        ...validAdministrationInput,
        status: 'MISSED' as const,
      };
      const result = recordAdministrationSchema.parse(validInput);
      expect(result.status).toBe('MISSED');
    });

    it('should accept valid witnessedBy UUID', () => {
      const validInput = {
        ...validAdministrationInput,
        witnessedBy: '223e4567-e89b-12d3-a456-426614174099',
      };
      const result = recordAdministrationSchema.parse(validInput);
      expect(result.witnessedBy).toBe('223e4567-e89b-12d3-a456-426614174099');
    });

    it('should reject invalid witnessedBy UUID', () => {
      const invalidInput = { ...validAdministrationInput, witnessedBy: 'not-a-uuid' };
      expect(() => recordAdministrationSchema.parse(invalidInput)).toThrow();
    });

    it('should accept all valid routes', () => {
      const routes = ['ORAL', 'TOPICAL', 'INJECTION', 'INHALATION', 'OTHER'] as const;

      routes.forEach((route) => {
        const input = { ...validAdministrationInput, route };
        const result = recordAdministrationSchema.parse(input);
        expect(result.route).toBe(route);
      });
    });

    it('should accept all valid administration statuses with proper reasons', () => {
      // GIVEN
      const givenInput = { ...validAdministrationInput, status: 'GIVEN' as const };
      expect(() => recordAdministrationSchema.parse(givenInput)).not.toThrow();

      // REFUSED with reason
      const refusedInput = {
        ...validAdministrationInput,
        status: 'REFUSED' as const,
        refusalReason: 'Reason',
      };
      expect(() => recordAdministrationSchema.parse(refusedInput)).not.toThrow();

      // HELD with reason
      const heldInput = {
        ...validAdministrationInput,
        status: 'HELD' as const,
        holdReason: 'Reason',
      };
      expect(() => recordAdministrationSchema.parse(heldInput)).not.toThrow();

      // MISSED
      const missedInput = { ...validAdministrationInput, status: 'MISSED' as const };
      expect(() => recordAdministrationSchema.parse(missedInput)).not.toThrow();
    });
  });
});
