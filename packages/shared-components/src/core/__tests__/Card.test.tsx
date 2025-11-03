import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '../Card.js';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply default padding', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass('p-6');
  });

  it('should apply custom padding', () => {
    const { container } = render(<Card padding="lg">Content</Card>);
    expect(container.firstChild).toHaveClass('p-8');
  });

  it('should apply no padding', () => {
    const { container } = render(<Card padding="none">Content</Card>);
    expect(container.firstChild).not.toHaveClass('p-4', 'p-6', 'p-8');
  });

  it('should apply hover effect when enabled', () => {
    const { container } = render(<Card hover>Content</Card>);
    expect(container.firstChild).toHaveClass('hover:shadow-md');
  });

  it('should have sub-components', () => {
    expect(Card.Header).toBeDefined();
    expect(Card.Content).toBeDefined();
    expect(Card.Footer).toBeDefined();
  });
});

describe('CardHeader', () => {
  it('should render title', () => {
    render(<CardHeader title="Card Title" />);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
  });

  it('should render subtitle', () => {
    render(<CardHeader title="Title" subtitle="Subtitle text" />);
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('should render action element', () => {
    render(<CardHeader title="Title" action={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    render(<CardContent>Content text</CardContent>);
    expect(screen.getByText('Content text')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});
