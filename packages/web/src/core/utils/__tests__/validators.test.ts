import { describe, it, expect } from 'vitest';
import {
  isEmail,
  isPhone,
  isZipCode,
  isSSN,
  isEmpty,
  isValidDate,
  minLength,
  maxLength,
} from '../validators';

describe('isEmail', () => {
  it('validates correct email addresses', () => {
    expect(isEmail('test@example.com')).toBe(true);
    expect(isEmail('user.name@domain.co.uk')).toBe(true);
    expect(isEmail('user+tag@example.org')).toBe(true);
    expect(isEmail('user123@test-domain.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isEmail('invalid')).toBe(false);
    expect(isEmail('test@')).toBe(false);
    expect(isEmail('@example.com')).toBe(false);
    expect(isEmail('test@.com')).toBe(false);
    expect(isEmail('test@example')).toBe(false);
    expect(isEmail('test example@domain.com')).toBe(false);
    expect(isEmail('test@domain..com')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isEmail('')).toBe(false);
    expect(isEmail(' ')).toBe(false);
    expect(isEmail('a@b.c')).toBe(true); // Minimal valid email
  });
});

describe('isPhone', () => {
  it('validates correct phone numbers', () => {
    expect(isPhone('123-456-7890')).toBe(true);
    expect(isPhone('(123) 456-7890')).toBe(true);
    expect(isPhone('123.456.7890')).toBe(true);
    expect(isPhone('123 456 7890')).toBe(true);
    expect(isPhone('1234567890')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(isPhone('123-456-789')).toBe(false); // Too short
    expect(isPhone('123-456-78901')).toBe(false); // Too long
    expect(isPhone('12-3456-7890')).toBe(false); // Wrong format
    expect(isPhone('abc-def-ghij')).toBe(false); // Non-numeric
    expect(isPhone('')).toBe(false);
    expect(isPhone(' ')).toBe(false);
  });

  it('handles various formats', () => {
    expect(isPhone('(123)456-7890')).toBe(true);
    expect(isPhone('123)456-7890')).toBe(true);
    expect(isPhone('(123456-7890')).toBe(true);
  });
});

describe('isZipCode', () => {
  it('validates correct zip codes', () => {
    expect(isZipCode('12345')).toBe(true);
    expect(isZipCode('12345-6789')).toBe(true);
    expect(isZipCode('00000')).toBe(true);
    expect(isZipCode('99999')).toBe(true);
    expect(isZipCode('12345-0000')).toBe(true);
  });

  it('rejects invalid zip codes', () => {
    expect(isZipCode('1234')).toBe(false); // Too short
    expect(isZipCode('123456')).toBe(false); // Too long
    expect(isZipCode('12345-678')).toBe(false); // ZIP+4 too short
    expect(isZipCode('12345-67890')).toBe(false); // ZIP+4 too long
    expect(isZipCode('12a45')).toBe(false); // Contains letter
    expect(isZipCode('12345-67a9')).toBe(false); // Contains letter
    expect(isZipCode('')).toBe(false);
    expect(isZipCode(' ')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isZipCode('12345-')).toBe(false);
    expect(isZipCode('-6789')).toBe(false);
    expect(isZipCode('123456789')).toBe(false);
  });
});

describe('isSSN', () => {
  it('validates correct SSN formats', () => {
    expect(isSSN('123-45-6789')).toBe(true);
    expect(isSSN('123456789')).toBe(true);
    expect(isSSN('123-456789')).toBe(true);
    expect(isSSN('123456-789')).toBe(true);
  });

  it('rejects invalid SSN formats', () => {
    expect(isSSN('12-345-6789')).toBe(false); // Wrong format
    expect(isSSN('123-4-6789')).toBe(false); // Wrong format
    expect(isSSN('123-45-678')).toBe(false); // Too short
    expect(isSSN('123-45-67890')).toBe(false); // Too long
    expect(isSSN('abc-de-fghi')).toBe(false); // Non-numeric
    expect(isSSN('')).toBe(false);
    expect(isSSN(' ')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isSSN('123--6789')).toBe(false);
    expect(isSSN('123-45-')).toBe(false);
    expect(isSSN('-45-6789')).toBe(false);
  });
});

describe('isEmpty', () => {
  it('identifies empty values', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('   ')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it('identifies non-empty values', () => {
    expect(isEmpty('text')).toBe(false);
    expect(isEmpty('   text   ')).toBe(false);
    expect(isEmpty([1, 2, 3])).toBe(false);
    expect(isEmpty({ key: 'value' })).toBe(false);
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty(true)).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty('0')).toBe(false);
    expect(isEmpty([null])).toBe(false); // Array with null is not empty
    expect(isEmpty({ a: undefined })).toBe(false); // Object with undefined key is not empty
  });
});

describe('isValidDate', () => {
  it('validates correct dates', () => {
    expect(isValidDate('2023-12-25')).toBe(true);
    expect(isValidDate('2023-12-25T14:30:00')).toBe(true);
    expect(isValidDate(new Date('2023-12-25'))).toBe(true);
    expect(isValidDate(new Date())).toBe(true);
  });

  it('rejects invalid dates', () => {
    expect(isValidDate('invalid-date')).toBe(false);
    expect(isValidDate('2023-13-45')).toBe(false); // Invalid month/day
    expect(isValidDate(new Date('invalid-date'))).toBe(false);
    expect(isValidDate('')).toBe(false);
  });

  it('handles edge cases', () => {
    expect(isValidDate('2023-02-29')).toBe(false); // 2023 is not a leap year
    expect(isValidDate('2024-02-29')).toBe(true); // 2024 is a leap year
    expect(isValidDate(new Date(NaN))).toBe(false);
  });
});

describe('minLength', () => {
  it('validates minimum length', () => {
    expect(minLength('hello', 3)).toBe(true);
    expect(minLength('hello', 5)).toBe(true);
    expect(minLength('hello', 6)).toBe(false);
    expect(minLength('', 0)).toBe(true);
    expect(minLength('', 1)).toBe(false);
  });

  it('handles edge cases', () => {
    expect(minLength('a', 1)).toBe(true);
    expect(minLength('a', 0)).toBe(true);
    expect(minLength(' ', 1)).toBe(true);
    expect(minLength('   ', 2)).toBe(true);
  });
});

describe('maxLength', () => {
  it('validates maximum length', () => {
    expect(maxLength('hello', 10)).toBe(true);
    expect(maxLength('hello', 5)).toBe(true);
    expect(maxLength('hello', 4)).toBe(false);
    expect(maxLength('', 0)).toBe(true);
    expect(maxLength('', 1)).toBe(true);
  });

  it('handles edge cases', () => {
    expect(maxLength('a', 1)).toBe(true);
    expect(maxLength('a', 0)).toBe(false);
    expect(maxLength(' ', 1)).toBe(true);
    expect(maxLength('   ', 2)).toBe(false);
  });
});

describe('combined validation scenarios', () => {
  it('can validate complex form data', () => {
    const formData = {
      email: 'test@example.com',
      phone: '(123) 456-7890',
      zip: '12345-6789',
      ssn: '123-45-6789',
      name: 'John Doe',
      bio: 'This is a short bio'
    };

    expect(isEmail(formData.email)).toBe(true);
    expect(isPhone(formData.phone)).toBe(true);
    expect(isZipCode(formData.zip)).toBe(true);
    expect(isSSN(formData.ssn)).toBe(true);
    expect(minLength(formData.name, 2)).toBe(true);
    expect(maxLength(formData.bio, 50)).toBe(true);
  });

  it('handles validation failures', () => {
    const invalidData = {
      email: 'invalid-email',
      phone: '123',
      zip: 'abc',
      ssn: 'invalid',
      emptyField: '',
      whitespaceField: '   '
    };

    expect(isEmail(invalidData.email)).toBe(false);
    expect(isPhone(invalidData.phone)).toBe(false);
    expect(isZipCode(invalidData.zip)).toBe(false);
    expect(isSSN(invalidData.ssn)).toBe(false);
    expect(isEmpty(invalidData.emptyField)).toBe(true);
    expect(isEmpty(invalidData.whitespaceField)).toBe(true);
  });
});