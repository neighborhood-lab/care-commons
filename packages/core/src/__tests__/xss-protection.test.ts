import { describe, it, expect } from 'vitest';
import DOMPurify from 'isomorphic-dompurify';
import { sanitizeInput } from '../middleware/sanitize-input.js';

describe('XSS Protection', () => {
  it('should sanitize script tags from user input', () => {
    const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>';
    const sanitized = DOMPurify.sanitize(maliciousContent, { ALLOWED_TAGS: [] });

    // Script should be removed
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');

    // Safe content should remain (but tags removed with ALLOWED_TAGS: [])
    expect(sanitized).toContain('Safe content');
  });

  it('should prevent JavaScript execution in event handlers', () => {
    const maliciousContent = '<img src="x" onerror="alert(\'XSS\')">';
    const sanitized = DOMPurify.sanitize(maliciousContent, { ALLOWED_TAGS: [] });

    // Should not contain the onerror handler
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).not.toContain('alert');
  });

  it('should prevent JavaScript in href attributes', () => {
    const maliciousContent = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const sanitized = DOMPurify.sanitize(maliciousContent, { ALLOWED_TAGS: [] });

    // Should not contain javascript: protocol
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('alert');
  });

  it('should prevent data URI XSS attacks', () => {
    const maliciousContent = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
    const sanitized = DOMPurify.sanitize(maliciousContent, { ALLOWED_TAGS: [] });

    // Should not contain script
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('should sanitize nested script tags', () => {
    const maliciousContent = '<div><span><script>alert("XSS")</script></span></div>';
    const sanitized = DOMPurify.sanitize(maliciousContent, { ALLOWED_TAGS: [] });

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('should prevent SVG-based XSS', () => {
    const maliciousContent = '<svg onload="alert(\'XSS\')"></svg>';
    const sanitized = DOMPurify.sanitize(maliciousContent, { ALLOWED_TAGS: [] });

    expect(sanitized).not.toContain('onload');
    expect(sanitized).not.toContain('alert');
  });

  it('should sanitize input in request middleware', () => {
    const req = {
      body: {
        name: '<script>alert("XSS")</script>John Doe',
        email: 'test@example.com',
        nested: {
          value: '<img src=x onerror="alert(1)">',
        },
      },
      query: {
        search: '<script>alert("XSS")</script>',
      },
    } as any;

    const res = {} as any;
    const next = () => {};

    sanitizeInput(req, res, next);

    // Body should be sanitized
    expect(req.body.name).not.toContain('<script>');
    expect(req.body.name).toContain('John Doe');
    expect(req.body.nested.value).not.toContain('onerror');

    // Query should be sanitized
    expect(req.query.search).not.toContain('<script>');
  });

  it('should handle arrays in sanitization', () => {
    const req = {
      body: {
        items: [
          '<script>alert("XSS")</script>Item 1',
          '<img src=x onerror="alert(1)">Item 2',
        ],
      },
      query: {},
    } as any;

    const res = {} as any;
    const next = () => {};

    sanitizeInput(req, res, next);

    expect(req.body.items[0]).not.toContain('<script>');
    expect(req.body.items[0]).toContain('Item 1');
    expect(req.body.items[1]).not.toContain('onerror');
    expect(req.body.items[1]).toContain('Item 2');
  });

  it('should preserve safe HTML entities when needed', () => {
    const content = 'Price: &lt;$100&gt;';
    const sanitized = DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });

    // Should preserve the text content
    expect(sanitized).toContain('Price:');
  });
});
