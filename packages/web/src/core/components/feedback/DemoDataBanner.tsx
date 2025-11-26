/**
 * Demo Data Banner
 *
 * Shows when the organization has demo data loaded.
 * Provides actions to clear demo data or add real data.
 */

import React from 'react';
import { AlertTriangle, Trash2, Plus, X } from 'lucide-react';
import { Button } from '../Button';

export interface DemoDataBannerProps {
  onClearDemo: () => void;
  onAddRealData: () => void;
  onDismiss?: () => void;
  isClearing?: boolean;
  stats?: {
    clients: number;
    caregivers: number;
    visits: number;
  };
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({
  onClearDemo,
  onAddRealData,
  onDismiss,
  isClearing = false,
  stats,
}) => {
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
            <Button
              variant="primary"
              size="sm"
              onClick={onAddRealData}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Real Data
            </Button>
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
