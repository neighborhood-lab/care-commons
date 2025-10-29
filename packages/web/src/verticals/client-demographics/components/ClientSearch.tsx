import React from 'react';
import { Search, Filter } from 'lucide-react';
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
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          leftIcon={<Filter className="h-4 w-4" />}
        >
          Filters
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
          <Select
            label="Status"
            options={statusOptions}
            value={filters.status?.[0] || ''}
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
    </div>
  );
};
