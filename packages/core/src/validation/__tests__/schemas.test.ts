/**
 * Tests for validation schemas
 */

/* eslint-disable sonarjs/no-hardcoded-passwords */
// Test file contains password test fixtures

import { describe, it, expect } from 'vitest';
import {
  validators,
  validationHelpers,
  clientSchema,
  caregiverSchema,
  visitSchema,
  carePlanSchema,
  loginSchema,
  registerSchema
} from '../schemas';

describe('Validators', () => {
  describe('email', () => {
    it('should validate correct email addresses', () => {
      expect(() => validators.email.parse('test@example.com')).not.toThrow();
      expect(() => validators.email.parse('user+tag@domain.co.uk')).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() => validators.email.parse('invalid')).toThrow();
      expect(() => validators.email.parse('test@')).toThrow();
      expect(() => validators.email.parse('@example.com')).toThrow();
    });
  });

  describe('phone', () => {
    it('should validate correct phone numbers', () => {
      expect(() => validators.phone.parse('555-123-4567')).not.toThrow();
      expect(() => validators.phone.parse('(555) 123-4567')).not.toThrow();
      expect(() => validators.phone.parse('555.123.4567')).not.toThrow();
      expect(() => validators.phone.parse('5551234567')).not.toThrow();
    });

    it('should reject invalid phone numbers', () => {
      expect(() => validators.phone.parse('123')).toThrow();
      expect(() => validators.phone.parse('invalid')).toThrow();
    });
  });

  describe('zipCode', () => {
    it('should validate correct ZIP codes', () => {
      expect(() => validators.zipCode.parse('12345')).not.toThrow();
      expect(() => validators.zipCode.parse('12345-6789')).not.toThrow();
    });

    it('should reject invalid ZIP codes', () => {
      expect(() => validators.zipCode.parse('1234')).toThrow();
      expect(() => validators.zipCode.parse('123456')).toThrow();
      expect(() => validators.zipCode.parse('invalid')).toThrow();
    });
  });

  describe('ssn', () => {
    it('should validate correct SSN format', () => {
      expect(() => validators.ssn.parse('123-45-6789')).not.toThrow();
    });

    it('should reject invalid SSN format', () => {
      expect(() => validators.ssn.parse('123456789')).toThrow();
      expect(() => validators.ssn.parse('12-345-6789')).toThrow();
      expect(() => validators.ssn.parse('invalid')).toThrow();
    });
  });

  describe('password', () => {
    it('should validate passwords meeting all requirements', () => {
      expect(() => validators.password.parse('Password123')).not.toThrow();
      expect(() => validators.password.parse('SecureP@ss1')).not.toThrow();
    });

    it('should reject passwords missing uppercase', () => {
      expect(() => validators.password.parse('password123')).toThrow();
    });

    it('should reject passwords missing lowercase', () => {
      expect(() => validators.password.parse('PASSWORD123')).toThrow();
    });

    it('should reject passwords missing number', () => {
      expect(() => validators.password.parse('PasswordABC')).toThrow();
    });

    it('should reject passwords too short', () => {
      expect(() => validators.password.parse('Pass1')).toThrow();
    });
  });

  describe('requiredString', () => {
    it('should validate non-empty strings', () => {
      const validator = validators.requiredString('Name');
      expect(() => validator.parse('John')).not.toThrow();
    });

    it('should reject empty strings', () => {
      const validator = validators.requiredString('Name');
      expect(() => validator.parse('')).toThrow();
    });

    it('should respect minimum length', () => {
      const validator = validators.requiredString('Name', 3);
      expect(() => validator.parse('ab')).toThrow();
      expect(() => validator.parse('abc')).not.toThrow();
    });
  });
});

describe('Client Schema', () => {
  const validClient = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    date_of_birth: '1990-01-01T00:00:00.000Z',
    ssn: '123-45-6789',
    address: {
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701'
    },
    emergency_contact: {
      name: 'Jane Doe',
      phone: '555-987-6543',
      relationship: 'Spouse'
    },
    notes: 'Test notes'
  };

  it('should validate a complete valid client', () => {
    expect(() => clientSchema.parse(validClient)).not.toThrow();
  });

  it('should allow optional email', () => {
    const client = { ...validClient, email: undefined };
    expect(() => clientSchema.parse(client)).not.toThrow();
  });

  it('should allow optional SSN', () => {
    const client = { ...validClient, ssn: undefined };
    expect(() => clientSchema.parse(client)).not.toThrow();
  });

  it('should require first name with minimum 2 characters', () => {
    const client = { ...validClient, first_name: 'J' };
    expect(() => clientSchema.parse(client)).toThrow();
  });

  it('should require valid phone number', () => {
    const client = { ...validClient, phone: 'invalid' };
    expect(() => clientSchema.parse(client)).toThrow();
  });

  it('should require valid state', () => {
    const client = {
      ...validClient,
      address: { ...validClient.address, state: 'XX' }
    };
    expect(() => clientSchema.parse(client)).toThrow();
  });
});

describe('Caregiver Schema', () => {
  const validCaregiver = {
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    phone: '555-123-4567',
    date_of_birth: '1985-01-01T00:00:00.000Z',
    ssn: '987-65-4321',
    certifications: ['CNA', 'CPR'],
    hourly_rate: 25.50,
    address: {
      street: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      zip: '75201'
    }
  };

  it('should validate a complete valid caregiver', () => {
    expect(() => caregiverSchema.parse(validCaregiver)).not.toThrow();
  });

  it('should require email', () => {
    const caregiver = { ...validCaregiver, email: undefined };
    expect(() => caregiverSchema.parse(caregiver)).toThrow();
  });

  it('should require at least one certification', () => {
    const caregiver = { ...validCaregiver, certifications: [] };
    expect(() => caregiverSchema.parse(caregiver)).toThrow();
  });

  it('should require positive hourly rate', () => {
    const caregiver = { ...validCaregiver, hourly_rate: -10 };
    expect(() => caregiverSchema.parse(caregiver)).toThrow();
  });
});

describe('Visit Schema', () => {
  const validVisit = {
    client_id: '123e4567-e89b-12d3-a456-426614174000',
    caregiver_id: '987e6543-e21b-34d5-b678-526614174001',
    scheduled_start: '2024-01-01T09:00:00.000Z',
    scheduled_end: '2024-01-01T17:00:00.000Z',
    service_type: 'personal_care',
    notes: 'Regular visit'
  };

  it('should validate a complete valid visit', () => {
    expect(() => visitSchema.parse(validVisit)).not.toThrow();
  });

  it('should require valid UUIDs', () => {
    const visit = { ...validVisit, client_id: 'invalid-uuid' };
    expect(() => visitSchema.parse(visit)).toThrow();
  });

  it('should require end time after start time', () => {
    const visit = {
      ...validVisit,
      scheduled_start: '2024-01-01T17:00:00.000Z',
      scheduled_end: '2024-01-01T09:00:00.000Z'
    };
    expect(() => visitSchema.parse(visit)).toThrow();
  });

  it('should validate service types', () => {
    expect(() => visitSchema.parse({ ...validVisit, service_type: 'personal_care' })).not.toThrow();
    expect(() => visitSchema.parse({ ...validVisit, service_type: 'companionship' })).not.toThrow();
    expect(() => visitSchema.parse({ ...validVisit, service_type: 'skilled_nursing' })).not.toThrow();
    expect(() => visitSchema.parse({ ...validVisit, service_type: 'respite' })).not.toThrow();
    expect(() => visitSchema.parse({ ...validVisit, service_type: 'invalid' })).toThrow();
  });
});

describe('Care Plan Schema', () => {
  const validCarePlan = {
    client_id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Care Plan 2024',
    start_date: '2024-01-01T00:00:00.000Z',
    end_date: '2024-12-31T00:00:00.000Z',
    goals: 'Improve mobility and independence',
    status: 'active'
  };

  it('should validate a complete valid care plan', () => {
    expect(() => carePlanSchema.parse(validCarePlan)).not.toThrow();
  });

  it('should require plan name with minimum 3 characters', () => {
    const plan = { ...validCarePlan, name: 'ab' };
    expect(() => carePlanSchema.parse(plan)).toThrow();
  });

  it('should require goals with minimum 10 characters', () => {
    const plan = { ...validCarePlan, goals: 'short' };
    expect(() => carePlanSchema.parse(plan)).toThrow();
  });

  it('should allow optional end date', () => {
    const plan = { ...validCarePlan, end_date: undefined };
    expect(() => carePlanSchema.parse(plan)).not.toThrow();
  });

  it('should validate status values', () => {
    expect(() => carePlanSchema.parse({ ...validCarePlan, status: 'draft' })).not.toThrow();
    expect(() => carePlanSchema.parse({ ...validCarePlan, status: 'active' })).not.toThrow();
    expect(() => carePlanSchema.parse({ ...validCarePlan, status: 'completed' })).not.toThrow();
    expect(() => carePlanSchema.parse({ ...validCarePlan, status: 'cancelled' })).not.toThrow();
    expect(() => carePlanSchema.parse({ ...validCarePlan, status: 'invalid' })).toThrow();
  });
});

describe('Login Schema', () => {
  it('should validate valid login credentials', () => {
    const login = {
      email: 'test@example.com',
      password: 'password123'
    };
    expect(() => loginSchema.parse(login)).not.toThrow();
  });

  it('should require valid email', () => {
    const login = {
      email: 'invalid-email',
      password: 'password123'
    };
    expect(() => loginSchema.parse(login)).toThrow();
  });

  it('should require password', () => {
    const login = {
      email: 'test@example.com',
      password: ''
    };
    expect(() => loginSchema.parse(login)).toThrow();
  });
});

describe('Register Schema', () => {
  const validRegistration = {
    email: 'newuser@example.com',
    password: 'SecureP@ss123',
    confirm_password: 'SecureP@ss123',
    first_name: 'John',
    last_name: 'Doe',
    phone: '555-123-4567'
  };

  it('should validate valid registration', () => {
    expect(() => registerSchema.parse(validRegistration)).not.toThrow();
  });

  it('should require password to meet requirements', () => {
    const registration = { ...validRegistration, password: 'weak', confirm_password: 'weak' };
    expect(() => registerSchema.parse(registration)).toThrow();
  });

  it('should require passwords to match', () => {
    const registration = {
      ...validRegistration,
      password: 'SecureP@ss123',
      confirm_password: 'DifferentP@ss123'
    };
    expect(() => registerSchema.parse(registration)).toThrow();
  });

  it('should require all fields', () => {
    const registration = { ...validRegistration, first_name: '' };
    expect(() => registerSchema.parse(registration)).toThrow();
  });
});

describe('Validation Helpers', () => {
  describe('isEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validationHelpers.isEmail('test@example.com')).toBe(true);
      expect(validationHelpers.isEmail('user.name@domain.co')).toBe(true);
      expect(validationHelpers.isEmail('user+tag@example.com')).toBe(true);
      expect(validationHelpers.isEmail('user_name@example.com')).toBe(true);
      expect(validationHelpers.isEmail('user123@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validationHelpers.isEmail('invalid')).toBe(false);
      expect(validationHelpers.isEmail('test@')).toBe(false);
      expect(validationHelpers.isEmail('@example.com')).toBe(false);
      expect(validationHelpers.isEmail('test@.com')).toBe(false);
      expect(validationHelpers.isEmail('test @example.com')).toBe(false);
      expect(validationHelpers.isEmail('test@domain')).toBe(false);
    });
  });

  describe('isPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validationHelpers.isPhone('555-123-4567')).toBe(true);
      expect(validationHelpers.isPhone('(555) 123-4567')).toBe(true);
      expect(validationHelpers.isPhone('555.123.4567')).toBe(true);
      expect(validationHelpers.isPhone('5551234567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validationHelpers.isPhone('123')).toBe(false);
      expect(validationHelpers.isPhone('invalid')).toBe(false);
      expect(validationHelpers.isPhone('123-456')).toBe(false);
      expect(validationHelpers.isPhone('(555) 123')).toBe(false);
    });
  });

  describe('isZipCode', () => {
    it('should validate correct ZIP codes', () => {
      expect(validationHelpers.isZipCode('12345')).toBe(true);
      expect(validationHelpers.isZipCode('12345-6789')).toBe(true);
    });

    it('should reject invalid ZIP codes', () => {
      expect(validationHelpers.isZipCode('1234')).toBe(false);
      expect(validationHelpers.isZipCode('123456')).toBe(false);
      expect(validationHelpers.isZipCode('invalid')).toBe(false);
      expect(validationHelpers.isZipCode('12345-123')).toBe(false);
    });
  });

  describe('isSSN', () => {
    it('should validate correct SSN format', () => {
      expect(validationHelpers.isSSN('123-45-6789')).toBe(true);
      expect(validationHelpers.isSSN('123456789')).toBe(true);
    });

    it('should reject invalid SSN format', () => {
      expect(validationHelpers.isSSN('12-345-6789')).toBe(false);
      expect(validationHelpers.isSSN('123-456-789')).toBe(false);
      expect(validationHelpers.isSSN('invalid')).toBe(false);
      expect(validationHelpers.isSSN('12345678')).toBe(false);
    });
  });

  describe('isEmpty', () => {
    it('should return true for null and undefined', () => {
      expect(validationHelpers.isEmpty(null)).toBe(true);
      expect(validationHelpers.isEmpty(undefined)).toBe(true);
    });

    it('should return true for empty strings', () => {
      expect(validationHelpers.isEmpty('')).toBe(true);
      expect(validationHelpers.isEmpty('   ')).toBe(true);
    });

    it('should return true for empty arrays', () => {
      expect(validationHelpers.isEmpty([])).toBe(true);
    });

    it('should return true for empty objects', () => {
      expect(validationHelpers.isEmpty({})).toBe(true);
    });

    it('should return false for non-empty values', () => {
      expect(validationHelpers.isEmpty('text')).toBe(false);
      expect(validationHelpers.isEmpty([1, 2, 3])).toBe(false);
      expect(validationHelpers.isEmpty({ key: 'value' })).toBe(false);
      expect(validationHelpers.isEmpty(0)).toBe(false);
      expect(validationHelpers.isEmpty(false)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate Date objects', () => {
      expect(validationHelpers.isValidDate(new Date())).toBe(true);
      expect(validationHelpers.isValidDate(new Date('2024-01-01'))).toBe(true);
    });

    it('should validate parseable date strings', () => {
      expect(validationHelpers.isValidDate('2024-01-01')).toBe(true);
      expect(validationHelpers.isValidDate('2024-01-01T00:00:00.000Z')).toBe(true);
      expect(validationHelpers.isValidDate('January 1, 2024')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validationHelpers.isValidDate('invalid')).toBe(false);
      expect(validationHelpers.isValidDate('not-a-date')).toBe(false);
      expect(validationHelpers.isValidDate(new Date('invalid'))).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should return true when string meets minimum length', () => {
      expect(validationHelpers.minLength('hello', 5)).toBe(true);
      expect(validationHelpers.minLength('hello', 3)).toBe(true);
      expect(validationHelpers.minLength('', 0)).toBe(true);
    });

    it('should return false when string is too short', () => {
      expect(validationHelpers.minLength('hi', 3)).toBe(false);
      expect(validationHelpers.minLength('', 1)).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('should return true when string is within maximum length', () => {
      expect(validationHelpers.maxLength('hello', 10)).toBe(true);
      expect(validationHelpers.maxLength('hello', 5)).toBe(true);
      expect(validationHelpers.maxLength('', 5)).toBe(true);
    });

    it('should return false when string is too long', () => {
      expect(validationHelpers.maxLength('hello', 3)).toBe(false);
      expect(validationHelpers.maxLength('toolong', 5)).toBe(false);
    });
  });
});
