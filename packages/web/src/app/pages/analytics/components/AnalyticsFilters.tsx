/**
 * Analytics Filters Component
 * Provides filtering controls for analytics data
 */

import { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/core/components';
import type { DateRange } from '@/types/analytics-types';

interface AnalyticsFiltersProps {
  onFiltersChange: (filters: FilterValues) => void;
  showClientFilter?: boolean;
  showCaregiverFilter?: boolean;
  showServiceTypeFilter?: boolean;
  showStatusFilter?: boolean;
  showBranchFilter?: boolean;
}

export interface FilterValues {
  dateRange: DateRange;
  clientIds?: string[];
  caregiverIds?: string[];
  serviceTypes?: string[];
  status?: string[];
  branchId?: string;
}

type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'custom';

export function AnalyticsFilters({
  onFiltersChange,
  showClientFilter = false,
  showCaregiverFilter = false,
  showServiceTypeFilter = false,
  showStatusFilter = false,
  showBranchFilter = false,
}: AnalyticsFiltersProps) {
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const getDateRange = (preset: DatePreset): DateRange => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (preset) {
      case 'today':
        return {
          startDate: today,
          endDate: today,
        };
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return {
          startDate: weekAgo,
          endDate: today,
        };
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return {
          startDate: monthAgo,
          endDate: today,
        };
      }
      case 'quarter': {
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        return {
          startDate: quarterAgo,
          endDate: today,
        };
      }
      case 'custom':
        return {
          startDate: startDate ? new Date(startDate) : today,
          endDate: endDate ? new Date(endDate) : today,
        };
      default:
        return { startDate: today, endDate: today };
    }
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const dateRange = getDateRange(preset);
      onFiltersChange({ dateRange });
    }
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      const dateRange = getDateRange('custom');
      onFiltersChange({ dateRange });
    }
  };

  const handleClearFilters = () => {
    setDatePreset('month');
    setStartDate('');
    setEndDate('');
    onFiltersChange({ dateRange: getDateRange('month') });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'}
        </Button>
      </div>

      {showFilters && (
        <div className="space-y-4">
          {/* Date Range Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date Range
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(['today', 'week', 'month', 'quarter', 'custom'] as DatePreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetChange(preset)}
                    className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                      datePreset === preset
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                )
              )}
            </div>

            {/* Custom Date Range */}
            {datePreset === 'custom' && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCustomDateChange} size="sm">
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Filters (placeholder structure) */}
          {showClientFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clients
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Clients</option>
                {/* Client options would be populated dynamically */}
              </select>
            </div>
          )}

          {showCaregiverFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caregivers
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Caregivers</option>
                {/* Caregiver options would be populated dynamically */}
              </select>
            </div>
          )}

          {showServiceTypeFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Services</option>
                <option value="personal-care">Personal Care</option>
                <option value="companion">Companion</option>
                <option value="skilled-nursing">Skilled Nursing</option>
              </select>
            </div>
          )}

          {showStatusFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          )}

          {showBranchFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">All Branches</option>
                {/* Branch options would be populated dynamically */}
              </select>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<X className="h-4 w-4" />}
            >
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
