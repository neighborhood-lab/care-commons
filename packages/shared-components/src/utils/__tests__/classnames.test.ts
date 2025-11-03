import { describe, it, expect } from 'vitest';
import { cn } from '../classnames.js';

describe('cn utility', () => {
  it('should combine class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });

  it('should handle undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should combine duplicate classes', () => {
    // clsx doesn't deduplicate by default - it joins all truthy values
    expect(cn('foo', 'foo', 'bar')).toBe('foo foo bar');
  });

  it('should handle mixed types', () => {
    expect(cn('foo', ['bar', 'baz'], { qux: true, quux: false })).toBe('foo bar baz qux');
  });
});
