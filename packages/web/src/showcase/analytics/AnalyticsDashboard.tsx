/**
 * Analytics Dashboard
 *
 * Shows user their own analytics data - privacy-first, fully transparent
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Eye,
  Play,
  MapPin,
  Users,
  TrendingUp,
  Download,
  Trash2,
} from 'lucide-react';
import { useAnalytics } from './AnalyticsContext';

export const AnalyticsDashboard: React.FC = () => {
  const { getAnalyticsSummary, clearAnalytics, isEnabled, setEnabled } = useAnalytics();
  const summary = getAnalyticsSummary();

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleExport = () => {
    const data = JSON.stringify(getAnalyticsSummary(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `care-commons-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      clearAnalytics();
    }
  };

  const stats = [
    {
      label: 'Total Events',
      value: summary.totalEvents,
      icon: BarChart3,
      color: 'blue',
    },
    {
      label: 'Session Duration',
      value: formatDuration(summary.sessionDuration),
      icon: Clock,
      color: 'purple',
    },
    {
      label: 'Tours Started',
      value: summary.toursStarted,
      icon: MapPin,
      color: 'green',
    },
    {
      label: 'Tours Completed',
      value: summary.toursCompleted,
      icon: MapPin,
      color: 'emerald',
    },
    {
      label: 'Scenarios Started',
      value: summary.scenariosStarted,
      icon: Play,
      color: 'orange',
    },
    {
      label: 'Scenarios Completed',
      value: summary.scenariosCompleted,
      icon: Play,
      color: 'amber',
    },
    {
      label: 'Role Switches',
      value: summary.roleSwitches,
      icon: Users,
      color: 'pink',
    },
    {
      label: 'Videos Played',
      value: summary.videosPlayed,
      icon: Eye,
      color: 'indigo',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
    amber: 'bg-amber-100 text-amber-600',
    pink: 'bg-pink-100 text-pink-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg p-8 text-center"
          >
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Disabled</h2>
            <p className="text-gray-600 mb-6">
              Analytics tracking is currently disabled. Enable analytics to see your usage
              statistics.
            </p>
            <button
              onClick={() => setEnabled(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Enable Analytics
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Analytics
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how you&apos;ve explored the Care Commons showcase. All data is stored locally and
            never shared.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-end gap-3 mb-6"
        >
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Trash2 className="w-4 h-4" />
            Clear Data
          </button>
          <button
            onClick={() => setEnabled(false)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            Disable Analytics
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Page Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Page Views</h2>
          </div>

          {Object.keys(summary.pageViews).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(summary.pageViews)
                .sort(([, a], [, b]) => b - a)
                .map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{page}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(summary.pageViews))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-900 font-semibold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No page views recorded yet.</p>
          )}
        </motion.div>

        {/* Completion Rates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Tours */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tour Completion</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10b981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(summary.toursCompleted / Math.max(summary.toursStarted, 1)) * 351.68} 351.68`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-3xl font-bold text-gray-900">
                    {summary.toursStarted > 0
                      ? Math.round((summary.toursCompleted / summary.toursStarted) * 100)
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-gray-600">
                    {summary.toursCompleted}/{summary.toursStarted}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scenarios */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Scenario Completion</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#f59e0b"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(summary.scenariosCompleted / Math.max(summary.scenariosStarted, 1)) * 351.68} 351.68`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-3xl font-bold text-gray-900">
                    {summary.scenariosStarted > 0
                      ? Math.round((summary.scenariosCompleted / summary.scenariosStarted) * 100)
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-gray-600">
                    {summary.scenariosCompleted}/{summary.scenariosStarted}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Privacy First</h3>
          <p className="text-blue-800">
            All analytics data is stored locally in your browser and never sent to any server. You
            can export or delete your data at any time. We respect your privacy and believe in
            complete transparency.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
