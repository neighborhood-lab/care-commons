import React from 'react';
import type { EVVSearchFilters } from '../types';

interface EVVRecordSearchProps {
  filters: EVVSearchFilters;
  onFiltersChange: (filters: EVVSearchFilters) => void;
}

export const EVVRecordSearch: React.FC<EVVRecordSearchProps> = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key: keyof EVVSearchFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DISPUTED">Disputed</option>
            <option value="VERIFIED">Verified</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Method
          </label>
          <select
            value={filters.verificationMethod || ''}
            onChange={(e) => handleFilterChange('verificationMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Methods</option>
            <option value="GPS">GPS</option>
            <option value="PHONE">Phone</option>
            <option value="BIOMETRIC">Biometric</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
