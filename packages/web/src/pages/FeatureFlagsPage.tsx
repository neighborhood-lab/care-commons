/**
 * Feature Flags Admin Page
 *
 * Provides UI for viewing and managing feature flags.
 * Admin/Developer only.
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, X, RefreshCw, Tag, Calendar } from 'lucide-react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  type: string;
  defaultValue: boolean | string | number | Record<string, unknown>;
  enabled: boolean;
  tags?: string[];
  owner?: string;
  createdAt: string;
  updatedAt: string;
  temporary?: boolean;
  removalDate?: string;
  rollout?: {
    enabled: boolean;
    percentage: number;
  };
}

interface FlagMetadata {
  version: string;
  environment: string;
  lastUpdated: string;
  flagCount: number;
}

export function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [metadata, setMetadata] = useState<FlagMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetch flags from API
   */
  const fetchFlags = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/feature-flags');
      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.statusText}`);
      }

      const data = await response.json();
      setFlags(data.flags || []);
      setMetadata(data.metadata || null);
    } catch (err) {
      console.error('Error fetching flags:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle flag enabled state
   */
  const toggleFlag = async (key: string) => {
    try {
      const response = await fetch(`/api/feature-flags/${key}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle flag: ${response.statusText}`);
      }

      // Refresh flags
      await fetchFlags();
    } catch (err) {
      console.error('Error toggling flag:', err);
      alert(`Failed to toggle flag: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  /**
   * Reload configuration from disk
   */
  const reloadConfig = async () => {
    try {
      const response = await fetch('/api/feature-flags/reload', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to reload config: ${response.statusText}`);
      }

      // Refresh flags
      await fetchFlags();
      alert('Configuration reloaded successfully');
    } catch (err) {
      console.error('Error reloading config:', err);
      alert(`Failed to reload config: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  // Get all unique tags
  const allTags = Array.from(
    new Set(flags.flatMap((f) => f.tags || []))
  ).sort();

  // Filter flags
  const filteredFlags = flags.filter((flag) => {
    const matchesTag = filterTag === 'all' || flag.tags?.includes(filterTag);
    const matchesSearch =
      searchQuery === '' ||
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="mt-2 text-gray-600">Loading feature flags...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Feature Flags</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="mt-2 text-gray-600">
            Manage feature flags and rollouts across the platform
          </p>

          {metadata && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Environment: <strong>{metadata.environment}</strong></span>
              <span>Version: <strong>{metadata.version}</strong></span>
              <span>Total Flags: <strong>{metadata.flagCount}</strong></span>
              <span>Last Updated: <strong>{new Date(metadata.lastUpdated).toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>

          <button
            onClick={reloadConfig}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Config
          </button>
        </div>

        {/* Flags List */}
        <div className="space-y-4">
          {filteredFlags.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No feature flags found matching your criteria
            </div>
          ) : (
            filteredFlags.map((flag) => (
              <div
                key={flag.key}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Title and status */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {flag.name}
                      </h3>
                      <button
                        onClick={() => toggleFlag(flag.key)}
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          flag.enabled
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {flag.enabled ? (
                          <>
                            <Check className="w-3 h-3" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Disabled
                          </>
                        )}
                      </button>
                      {flag.temporary && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                          Temporary
                        </span>
                      )}
                    </div>

                    {/* Key */}
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {flag.key}
                    </code>

                    {/* Description */}
                    <p className="mt-3 text-gray-700">{flag.description}</p>

                    {/* Tags */}
                    {flag.tags && flag.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {flag.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium text-gray-900">{flag.type}</span>
                      </div>
                      {flag.owner && (
                        <div>
                          <span className="text-gray-500">Owner:</span>
                          <span className="ml-2 font-medium text-gray-900">{flag.owner}</span>
                        </div>
                      )}
                      {flag.rollout?.enabled && (
                        <div>
                          <span className="text-gray-500">Rollout:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {flag.rollout.percentage}%
                          </span>
                        </div>
                      )}
                      {flag.removalDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-500">Remove by:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {new Date(flag.removalDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
