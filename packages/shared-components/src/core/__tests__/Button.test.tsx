import { describe, it, expect } from 'vitest';
import { Button } from '../Button.js';

describe('Button', () => {
  it('should be defined', () => {
    expect(Button).toBeDefined();
  });

  it('should have displayName set', () => {
    expect(Button.displayName).toBe('Button');
  });
});
