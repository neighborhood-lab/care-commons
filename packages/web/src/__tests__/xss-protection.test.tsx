import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DOMPurify from 'isomorphic-dompurify';

// Test component that renders user content
const UserContent = ({ content }: { content: string }) => {
  const sanitized = DOMPurify.sanitize(content, { ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'strong', 'em'] });
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
};

// Test component that renders text safely
const SafeText = ({ text }: { text: string }) => {
  return <div>{text}</div>;
};

describe('XSS Protection', () => {
  it('should sanitize HTML in user-generated content', () => {
    const maliciousContent = '<script>alert("XSS")</script><p>Safe content</p>';

    render(<UserContent content={maliciousContent} />);

    // Script should not be present
    const container = screen.getByText(/Safe content/i).parentElement;
    expect(container?.innerHTML).not.toContain('<script>');
    expect(container?.innerHTML).not.toContain('alert');

    // Safe content should be present
    expect(screen.getByText('Safe content')).toBeTruthy();
  });

  it('should prevent JavaScript execution in attributes', () => {
    const maliciousTitle = 'Normal Title" onload="alert(\'XSS\')" data-x="';

    render(<SafeText text={maliciousTitle} />);

    const element = screen.getByText(/Normal Title/);
    expect(element.getAttribute('onload')).toBeNull();
  });

  it('should sanitize img tags with onerror', () => {
    const maliciousContent = '<img src="invalid" onerror="alert(\'XSS\')" /><p>Text</p>';

    render(<UserContent content={maliciousContent} />);

    const container = screen.getByText(/Text/i).parentElement;
    expect(container?.innerHTML).not.toContain('onerror');
    expect(container?.innerHTML).not.toContain('alert');
  });

  it('should sanitize javascript: protocol in links', () => {
    const maliciousContent = '<a href="javascript:alert(\'XSS\')">Click me</a>';

    render(<UserContent content={maliciousContent} />);

    const container = document.body;
    expect(container.innerHTML).not.toContain('javascript:');
  });

  it('should allow safe HTML tags', () => {
    const safeContent = '<p>This is <strong>safe</strong> content with <em>emphasis</em></p>';

    render(<UserContent content={safeContent} />);

    expect(screen.getByText(/safe/)).toBeTruthy();
    expect(screen.getByText(/emphasis/)).toBeTruthy();
  });

  it('should sanitize event handlers', () => {
    const maliciousContent = '<div onclick="alert(\'XSS\')">Click me</div>';

    render(<UserContent content={maliciousContent} />);

    const container = screen.getByText(/Click me/i).parentElement;
    expect(container?.innerHTML).not.toContain('onclick');
  });

  it('should handle text content safely without dangerouslySetInnerHTML', () => {
    const maliciousText = '<script>alert("XSS")</script>';

    render(<SafeText text={maliciousText} />);

    // The text should be rendered as-is, not executed
    const element = screen.getByText(/script/i);
    expect(element.textContent).toContain('<script>');
  });
});
