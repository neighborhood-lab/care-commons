/**
 * Demo Data Banner
 *
 * Shows when viewing sample/demo data.
 *
 * Two modes:
 * - Read-only (isDemo=true): For public demo accounts - no action buttons
 * - Editable (isDemo=false): For real organizations with demo data loaded
 */

import React from 'react';
import { AlertTriangle, Trash2, Plus, X, Eye } from 'lucide-react';
import { Button } from '../Button';

export interface DemoDataBannerProps {
  /** Whether this is a demo account (read-only mode) */
  isDemo?: boolean;
  onClearDemo?: () => void;
  onAddRealData?: () => void;
  onDismiss?: () => void;
  isClearing?: boolean;
  stats?: {
    clients: number;
    caregivers: number;
    visits: number;
  };
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({
  isDemo = false,
  onClearDemo,
  onAddRealData,
  onDismiss,
  isClearing = false,
  stats,
}) => {
  // Read-only demo banner (for public demo accounts)
  if (isDemo) {
    return (
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-sm font-medium text-blue-800">
                  DEMO MODE
                </span>
                <span className="text-xs text-blue-600">
                  Try the platform with sample data • No real PHI
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats && (
                <span className="text-xs text-blue-600 hidden sm:inline">
                  {stats.clients} clients, {stats.caregivers} caregivers, {stats.visits} visits
                </span>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  aria-label="Dismiss banner"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editable demo data banner (for real organizations)
  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-sm font-medium text-amber-800">
                Viewing sample data
              </span>
              {stats && (
                <span className="text-xs text-amber-600">
                  {stats.clients} clients, {stats.caregivers} caregivers, {stats.visits} visits
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onClearDemo && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearDemo}
                disabled={isClearing}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isClearing ? 'Clearing...' : 'Remove Sample Data'}
              </Button>
            )}
            {onAddRealData && (
              <Button
                variant="primary"
                size="sm"
                onClick={onAddRealData}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Real Data
              </Button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 text-amber-600 hover:text-amber-800"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
