import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input, Select, Button } from '@/core/components';
import type { ClientSearchFilters, ClientStatus } from '../types';

export interface ClientSearchProps {
  filters: ClientSearchFilters;
  onFiltersChange: (filters: ClientSearchFilters) => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING_INTAKE', label: 'Pending Intake' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DISCHARGED', label: 'Discharged' },
];

export const ClientSearch: React.FC<ClientSearchProps> = ({ filters, onFiltersChange }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Count active filters
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.query?.trim()) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.city?.trim()) count++;
    if (filters.state?.trim()) count++;
    return count;
  }, [filters]);

  // Clear all filters
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  // Get current status value, ensuring it defaults to empty string
  const currentStatusValue = React.useMemo(() => {
    return filters.status && filters.status.length > 0 ? filters.status[0] : '';
  }, [filters.status]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search by name or client number..."
            value={filters.query || ''}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            leftIcon={<Filter className="h-4 w-4" />}
            className="relative"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              leftIcon={<X className="h-4 w-4" />}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
          <Select
            label="Status"
            options={statusOptions}
            value={currentStatusValue}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value ? [e.target.value as ClientStatus] : undefined,
              })
            }
          />
          <Input
            label="City"
            value={filters.city || ''}
            onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
          />
          <Input
            label="State"
            value={filters.state || ''}
            onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
          />
        </div>
      )}

      {/* Active filters indicator */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.query?.trim() && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Search: {filters.query}
              <button
                onClick={() => onFiltersChange({ ...filters, query: '' })}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.status && filters.status.length > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              Status: {statusOptions.find(opt => opt.value === filters.status![0])?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.city?.trim() && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              City: {filters.city}
              <button
                onClick={() => onFiltersChange({ ...filters, city: '' })}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.state?.trim() && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              State: {filters.state}
              <button
                onClick={() => onFiltersChange({ ...filters, state: '' })}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
