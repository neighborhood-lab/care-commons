/**
 * DataFreshness Component
 * 
 * Displays when data was last updated and provides visual indicators
 * for stale data. Critical for building trust in offline-first systems.
 * 
 * Features:
 * - "Last updated" timestamp with relative time display
 * - Warning indicators for stale data (>5 minutes old)
 * - Manual refresh button
 * - Loading states during refresh
 * 
 * Regulatory Context:
 * - Supports audit trail requirements by showing data freshness
 * - Helps caregivers know if they're working with current information
 * - Critical for EVV compliance when connectivity is intermittent
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/core/components';

export interface DataFreshnessProps {
  /** When the data was last updated */
  lastUpdated: Date | null;
  /** Callback to refresh the data */
  onRefresh?: () => Promise<void>;
  /** Whether data is currently being refreshed */
  isRefreshing?: boolean;
  /** Threshold in milliseconds for showing stale warning (default: 5 minutes) */
  staleThreshold?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Custom label text */
  label?: string;
}

/**
 * Format a date to relative time string (e.g., "2 minutes ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffMinutes === 1) {
    return '1 minute ago';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours === 1) {
    return '1 hour ago';
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return '1 day ago';
  } else {
    return `${diffDays} days ago`;
  }
}

/**
 * DataFreshness component - displays when data was last updated
 */
export const DataFreshness: React.FC<DataFreshnessProps> = ({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  staleThreshold = 5 * 60 * 1000, // 5 minutes
  compact = false,
  label = 'Last updated',
}) => {
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (!lastUpdated) {
      setRelativeTime('never');
      setIsStale(true);
      return;
    }

    const updateRelativeTime = () => {
      const formatted = formatRelativeTime(lastUpdated);
      setRelativeTime(formatted);

      const now = new Date();
      const age = now.getTime() - lastUpdated.getTime();
      setIsStale(age > staleThreshold);
    };

    // Update immediately
    updateRelativeTime();

    // Update every 10 seconds
    const interval = setInterval(updateRelativeTime, 10000);

    return () => clearInterval(interval);
  }, [lastUpdated, staleThreshold]);

  const handleRefresh = () => {
    if (!onRefresh || isRefreshing) {
      return;
    }
    void onRefresh();
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {isStale && (
          <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
        )}
        <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
        <span className={isStale ? 'text-amber-700' : 'text-gray-600'}>
          {relativeTime}
        </span>
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
      isStale 
        ? 'bg-amber-50 border-amber-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isStale ? (
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        ) : (
          <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className={`text-sm font-medium ${
            isStale ? 'text-amber-900' : 'text-gray-700'
          }`}>
            {label}
          </p>
          <p className={`text-xs ${
            isStale ? 'text-amber-700' : 'text-gray-600'
          }`}>
            {relativeTime}
          </p>
        </div>
      </div>
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex-shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="ml-1">Refresh</span>
        </Button>
      )}
    </div>
  );
};

/**
 * Stale Data Warning Banner
 * 
 * Displays a prominent warning when data is significantly out of date.
 * Used at the top of dashboards to alert users to potential data issues.
 */
export interface StaleDataWarningProps {
  /** When the data was last updated */
  lastUpdated: Date | null;
  /** Callback to refresh the data */
  onRefresh?: () => Promise<void>;
  /** Whether data is currently being refreshed */
  isRefreshing?: boolean;
  /** Threshold in milliseconds (default: 5 minutes) */
  threshold?: number;
}

export const StaleDataWarning: React.FC<StaleDataWarningProps> = ({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  threshold = 5 * 60 * 1000,
}) => {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const checkStale = () => {
      if (!lastUpdated) {
        setIsStale(true);
        return;
      }

      const now = new Date();
      const age = now.getTime() - lastUpdated.getTime();
      setIsStale(age > threshold);
    };

    checkStale();
    const interval = setInterval(checkStale, 10000);

    return () => clearInterval(interval);
  }, [lastUpdated, threshold]);

  if (!isStale) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-900">
            Data may be out of date
          </h3>
          <p className="text-sm text-amber-800 mt-1">
            This information was last updated {lastUpdated ? formatRelativeTime(lastUpdated) : 'a while ago'}. 
            {onRefresh && ' Click refresh to get the latest data.'}
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onRefresh()}
            disabled={isRefreshing}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="ml-2">Refresh</span>
          </Button>
        )}
      </div>
    </div>
  );
};
