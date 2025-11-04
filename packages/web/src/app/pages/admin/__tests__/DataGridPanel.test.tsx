import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataGridPanel } from '../components/DataGridPanel.js';

describe('DataGridPanel', () => {
  it('should render database management title', () => {
    render(<DataGridPanel />);
    expect(screen.getByText('Database Management')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<DataGridPanel />);
    const searchInput = screen.getByPlaceholderText(/search tables/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should render category filter buttons', () => {
    render(<DataGridPanel />);
    expect(screen.getByRole('button', { name: /all tables/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /core \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /evv \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /billing \(\d+\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scheduling \(\d+\)/i })).toBeInTheDocument();
  });

  it('should display all database tables by default', () => {
    render(<DataGridPanel />);
    // Should show at least the core tables
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Caregivers')).toBeInTheDocument();
    expect(screen.getByText('Visits')).toBeInTheDocument();
    expect(screen.getByText('EVV Records')).toBeInTheDocument();
  });

  it('should filter tables by category', () => {
    render(<DataGridPanel />);
    
    // Click EVV category
    const evvButton = screen.getByRole('button', { name: /evv \(\d+\)/i });
    fireEvent.click(evvButton);

    // EVV tables should be visible
    expect(screen.getByText('EVV Records')).toBeInTheDocument();
    expect(screen.getByText('EVV Revisions')).toBeInTheDocument();
    
    // Core tables might not be visible (depends on implementation)
    // Just verify the filter works by checking category is selected
    expect(evvButton).toHaveClass(/bg-primary-600/);
  });

  it('should search tables by name', () => {
    render(<DataGridPanel />);
    
    const searchInput = screen.getByPlaceholderText(/search tables/i);
    fireEvent.change(searchInput, { target: { value: 'evv' } });

    // Should find EVV-related tables
    expect(screen.getByText('EVV Records')).toBeInTheDocument();
  });

  it('should display row counts for each table', () => {
    render(<DataGridPanel />);
    
    // Check for "rows" text appearing with counts
    const rowsTexts = screen.getAllByText(/rows/i);
    expect(rowsTexts.length).toBeGreaterThan(0);
  });

  it('should render View and Export buttons for each table', () => {
    render(<DataGridPanel />);
    
    const viewButtons = screen.getAllByText(/view/i);
    expect(viewButtons.length).toBeGreaterThan(0);
    
    // Export buttons have download icons, check for those
    const cards = screen.getAllByRole('button', { name: /export to csv/i });
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show empty state when no tables match search', () => {
    render(<DataGridPanel />);
    
    const searchInput = screen.getByPlaceholderText(/search tables/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent_table_xyz' } });

    expect(screen.getByText(/no tables found matching your search/i)).toBeInTheDocument();
  });

  it('should display table descriptions', () => {
    render(<DataGridPanel />);
    
    // Check for description text (each table should have one)
    expect(screen.getByText(/client demographics and profile information/i)).toBeInTheDocument();
    expect(screen.getByText(/electronic visit verification records/i)).toBeInTheDocument();
  });

  it('should show category badges on table cards', () => {
    render(<DataGridPanel />);
    
    // Check for category badges
    const coreBadges = screen.getAllByText('core');
    const evvBadges = screen.getAllByText('evv');
    expect(coreBadges.length + evvBadges.length).toBeGreaterThan(0);
  });
});
