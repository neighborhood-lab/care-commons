import { describe, it, expect } from 'vitest';
import { cn } from '../classnames';

describe('classnames utility', () => {
  it('should combine class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const condition = false;
    const result = cn('foo', condition && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('should handle objects with truthy values', () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe('foo baz');
  });

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toBe('foo bar');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});
