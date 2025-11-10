/**
 * AuthenticationError Tests
 */

import { describe, it, expect } from 'vitest';
import { AuthenticationError } from '../../types/base';

describe('AuthenticationError', () => {
  it('should create error with message', () => {
    const error = new AuthenticationError('Invalid credentials');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('AuthenticationError');
    expect(error.message).toBe('Invalid credentials');
    expect(error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('should create error with context', () => {
    const context = { userId: '123', attempt: 3 };
    const error = new AuthenticationError('Too many attempts', context);

    expect(error.message).toBe('Too many attempts');
    expect(error.context).toEqual(context);
  });

  it('should have correct error code', () => {
    const error = new AuthenticationError('Test error');
    expect(error.code).toBe('AUTHENTICATION_FAILED');
  });
});
