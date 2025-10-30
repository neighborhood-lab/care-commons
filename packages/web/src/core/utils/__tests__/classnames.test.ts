import { describe, it, expect } from 'vitest';
import { cn } from '../classnames';

describe('cn (classnames utility)', () => {
  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns empty string for empty arguments', () => {
    expect(cn('', null, undefined, false, 0)).toBe('');
  });

  it('handles single string argument', () => {
    expect(cn('class1')).toBe('class1');
  });

  it('handles multiple string arguments', () => {
    expect(cn('class1', 'class2', 'class3')).toBe('class1 class2 class3');
  });

  it('handles object arguments', () => {
    expect(cn({
      'class1': true,
      'class2': false,
      'class3': true,
    })).toBe('class1 class3');
  });

  it('handles array arguments', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('handles mixed arguments', () => {
    expect(cn(
      'base-class',
      { 'conditional': true, 'disabled': false },
      ['array-class1', 'array-class2'],
      null,
      undefined
    )).toBe('base-class conditional array-class1 array-class2');
  });

  it('handles nested arrays', () => {
    expect(cn([
      'class1',
      ['class2', 'class3'],
      { 'class4': true }
    ])).toBe('class1 class2 class3 class4');
  });

  it('handles complex conditional logic', () => {
    const isActive = true;
    const isDisabled = false;
    const size = 'large';
    
    expect(cn(
      'base-component',
      {
        'active': isActive,
        'disabled': isDisabled,
        [`size-${size}`]: size,
      },
      isActive && 'is-active',
      isDisabled && 'is-disabled'
    )).toBe('base-component active size-large is-active');
  });

  it('handles numbers and other falsy values', () => {
    expect(cn(
      'class1',
      0,
      false,
      null,
      undefined,
      'class2'
    )).toBe('class1 class2');
  });

  it('handles empty strings in objects', () => {
    expect(cn({
      'class1': 'class1',
      '': true,
      'class2': '',
    })).toBe('class1');
  });

  it('handles dynamic class names', () => {
    const prefix = 'btn';
    const variant = 'primary';
    const size = 'lg';
    
    expect(cn(
      `${prefix}`,
      `${prefix}-${variant}`,
      `${prefix}-${size}`
    )).toBe('btn btn-primary btn-lg');
  });

  it('handles Tailwind CSS class patterns', () => {
    expect(cn(
      'flex',
      'items-center',
      'justify-center',
      {
        'bg-red-500': true,
        'bg-blue-500': false,
        'text-white': true,
      },
      'rounded-md',
      'p-4'
    )).toBe('flex items-center justify-center bg-red-500 text-white rounded-md p-4');
  });

  it('handles conditional variants', () => {
    const variant = 'success';
    const size = 'small';
    
    const variants = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
    };
    
    const sizes = {
      small: 'px-2 py-1 text-xs',
      medium: 'px-4 py-2 text-sm',
      large: 'px-6 py-3 text-base',
    };
    
    expect(cn(
      'badge',
      variants[variant as keyof typeof variants],
      sizes[size as keyof typeof sizes]
    )).toBe('badge bg-green-100 text-green-800 px-2 py-1 text-xs');
  });

  it('handles deeply nested structures', () => {
    expect(cn([
      'outer',
      [
        'inner1',
        {
          'inner2': true,
          'inner3': false,
        },
        ['inner4', 'inner5'],
      ],
      {
        'outer-conditional': true,
      },
    ])).toBe('outer inner1 inner2 inner4 inner5 outer-conditional');
  });

  it('handles duplicate classes (clsx behavior)', () => {
    expect(cn('class1', 'class2', 'class1')).toBe('class1 class2');
  });

  it('handles whitespace in strings', () => {
    expect(cn('  class1  ', 'class2')).toBe('class1 class2');
  });
});