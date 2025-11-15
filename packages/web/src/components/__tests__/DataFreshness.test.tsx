/**
 * Tests for DataFreshness component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataFreshness, StaleDataWarning } from '../DataFreshness';

describe('DataFreshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display "just now" for very recent updates', () => {
    const now = new Date();
    render(<DataFreshness lastUpdated={now} />);

    expect(screen.getByText(/just now/i)).toBeInTheDocument();
  });

  it('should display relative time for older updates', () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    render(<DataFreshness lastUpdated={twoMinutesAgo} />);

    expect(screen.getByText(/2 minutes ago/i)).toBeInTheDocument();
  });

  it('should display "never" when lastUpdated is null', () => {
    render(<DataFreshness lastUpdated={null} />);

    expect(screen.getByText(/never/i)).toBeInTheDocument();
  });

  it('should disable refresh button while refreshing', () => {
    const onRefresh = vi.fn();
    const now = new Date();
    
    render(<DataFreshness lastUpdated={now} onRefresh={onRefresh} isRefreshing={true} />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('should show spinning icon while refreshing', () => {
    const now = new Date();
    
    render(<DataFreshness lastUpdated={now} onRefresh={vi.fn()} isRefreshing={true} />);

    const refreshIcon = screen.getByRole('button', { name: /refresh/i }).querySelector('svg');
    expect(refreshIcon).toHaveClass('animate-spin');
  });

  it('should use custom label when provided', () => {
    const now = new Date();
    
    render(<DataFreshness lastUpdated={now} label="Data synced" />);

    expect(screen.getByText(/data synced/i)).toBeInTheDocument();
  });
});

describe('StaleDataWarning', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when data is fresh', () => {
    const now = new Date();
    const { container } = render(
      <StaleDataWarning lastUpdated={now} threshold={5 * 60 * 1000} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render when data is stale', () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    render(<StaleDataWarning lastUpdated={sixMinutesAgo} threshold={5 * 60 * 1000} />);

    expect(screen.getByText(/data may be out of date/i)).toBeInTheDocument();
  });

  it('should render when lastUpdated is null', () => {
    render(<StaleDataWarning lastUpdated={null} />);

    expect(screen.getByText(/data may be out of date/i)).toBeInTheDocument();
  });

  it('should not render refresh button when onRefresh is not provided', () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    render(<StaleDataWarning lastUpdated={sixMinutesAgo} />);

    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
  });
});
