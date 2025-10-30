import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';

describe('Card', () => {
  it('renders with default props', () => {
    render(<Card>Card content</Card>);
    const card = screen.getByText('Card content');
    
    expect(card).toBeInTheDocument();
    expect(card.parentElement).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'border', 'border-gray-200', 'p-6');
  });

  it('renders with different padding sizes', () => {
    const { rerender } = render(<Card padding="none">No padding</Card>);
    let card = screen.getByText('No padding');
    expect(card.parentElement).not.toHaveClass('p-4', 'p-6', 'p-8');

    rerender(<Card padding="sm">Small padding</Card>);
    card = screen.getByText('Small padding');
    expect(card.parentElement).toHaveClass('p-4');

    rerender(<Card padding="lg">Large padding</Card>);
    card = screen.getByText('Large padding');
    expect(card.parentElement).toHaveClass('p-8');
  });

  it('applies hover effect when hover prop is true', () => {
    render(<Card hover>Hover card</Card>);
    const card = screen.getByText('Hover card');
    
    expect(card.parentElement).toHaveClass('transition-shadow', 'hover:shadow-md');
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Custom card</Card>);
    const card = screen.getByText('Custom card');
    
    expect(card.parentElement).toHaveClass('custom-class');
  });

  it('renders children correctly', () => {
    render(
      <Card>
        <div>Child 1</div>
        <div>Child 2</div>
      </Card>
    );
    
    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders with title only', () => {
    render(<CardHeader title="Card Title" />);
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
  });

  it('renders with title and subtitle', () => {
    render(<CardHeader title="Card Title" subtitle="Card subtitle" />);
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toHaveClass('mt-1', 'text-sm', 'text-gray-600');
  });

  it('renders with action element', () => {
    render(
      <CardHeader title="Card Title" action={<button>Action</button>} />
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardHeader title="Card Title" className="custom-header" />);
    const header = screen.getByText('Card Title').parentElement;
    
    expect(header).toHaveClass('custom-header');
  });
});

describe('CardContent', () => {
  it('renders children with default margin', () => {
    render(<CardContent>Content</CardContent>);
    const content = screen.getByText('Content');
    
    expect(content).toBeInTheDocument();
    expect(content.parentElement).toHaveClass('mt-4');
  });

  it('applies custom className', () => {
    render(<CardContent className="custom-content">Content</CardContent>);
    const content = screen.getByText('Content');
    
    expect(content.parentElement).toHaveClass('custom-content');
  });
});

describe('CardFooter', () => {
  it('renders children with default styling', () => {
    render(<CardFooter>Footer content</CardFooter>);
    const footer = screen.getByText('Footer content');
    
    expect(footer).toBeInTheDocument();
    expect(footer.parentElement).toHaveClass('mt-6', 'pt-4', 'border-t', 'border-gray-200');
  });

  it('applies custom className', () => {
    render(<CardFooter className="custom-footer">Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    
    expect(footer.parentElement).toHaveClass('custom-footer');
  });
});

describe('Card composition', () => {
  it('renders complete card with all components', () => {
    render(
      <Card>
        <CardHeader title="Complete Card" subtitle="With all components" />
        <CardContent>
          <p>Main content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Footer Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('With all components')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Footer Action' })).toBeInTheDocument();
  });
});