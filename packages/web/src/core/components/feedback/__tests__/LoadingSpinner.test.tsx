import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSpinner, LoadingOverlay } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />);
    
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin', 'h-8', 'w-8');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-4', 'w-4');

    rerender(<LoadingSpinner size="lg" />);
    spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('custom-spinner');
  });

  it('has correct SVG attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(spinner).toHaveAttribute('fill', 'none');
    expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
  });

  it('has correct circle element', () => {
    render(<LoadingSpinner />);
    
    const circle = document.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '12');
    expect(circle).toHaveAttribute('cy', '12');
    expect(circle).toHaveAttribute('r', '10');
    expect(circle).toHaveAttribute('stroke', 'currentColor');
    expect(circle).toHaveAttribute('strokeWidth', '4');
    expect(circle).toHaveClass('opacity-25');
  });

  it('has correct path element', () => {
    render(<LoadingSpinner />);
    
    const path = document.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('fill', 'currentColor');
    expect(path).toHaveClass('opacity-75');
    expect(path).toHaveAttribute('d', 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z');
  });

  it('combines classes correctly', () => {
    render(<LoadingSpinner size="sm" className="extra-class" />);
    
    const spinner = document.querySelector('svg');
    expect(spinner).toHaveClass('animate-spin', 'h-4', 'w-4', 'extra-class');
  });
});

describe('LoadingOverlay', () => {
  it('renders with spinner only', () => {
    render(<LoadingOverlay />);
    
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('bg-gray-900', 'bg-opacity-50', 'flex', 'items-center', 'justify-center', 'z-50');
    
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders with message', () => {
    render(<LoadingOverlay message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    
    const message = screen.getByText('Loading data...');
    expect(message).toHaveClass('text-gray-700');
  });

  it('does not render message when not provided', () => {
    render(<LoadingOverlay />);
    
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('has correct overlay structure', () => {
    render(<LoadingOverlay message="Test" />);
    
    const overlay = document.querySelector('.fixed.inset-0');
    const content = overlay?.firstElementChild;
    const spinner = content?.firstElementChild;
    const message = content?.children[1];
    
    expect(overlay).toBeInTheDocument();
    expect(content).toHaveClass('bg-white', 'rounded-lg', 'p-6', 'flex', 'flex-col', 'items-center', 'gap-4');
    expect(spinner).toBeInstanceOf(SVGSVGElement);
    expect(message).toBeInstanceOf(HTMLParagraphElement);
  });

  it('handles empty message gracefully', () => {
    render(<LoadingOverlay message="" />);
    
    const message = screen.queryByText('');
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-gray-700');
  });

  it('handles long messages', () => {
    const longMessage = 'This is a very long loading message that should still render correctly and maintain proper styling';
    
    render(<LoadingOverlay message={longMessage} />);
    
    const message = screen.getByText(longMessage);
    expect(message).toBeInTheDocument();
    expect(message).toHaveClass('text-gray-700');
  });

  it('overlay covers full screen', () => {
    render(<LoadingOverlay />);
    
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  it('content is centered', () => {
    render(<LoadingOverlay />);
    
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('has correct z-index', () => {
    render(<LoadingOverlay />);
    
    const overlay = document.querySelector('.fixed.inset-0');
    expect(overlay).toHaveClass('z-50');
  });

  it('content has proper styling', () => {
    render(<LoadingOverlay />);
    
    const overlay = document.querySelector('.fixed.inset-0');
    const content = overlay?.firstElementChild;
    
    expect(content).toHaveClass('bg-white', 'rounded-lg', 'p-6', 'flex', 'flex-col', 'items-center', 'gap-4');
  });
});