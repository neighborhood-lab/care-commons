import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input, Select, Button } from '@/core/components';
import type {
  CarePlanSearchFilters,
  CarePlanStatus,
  CarePlanType,
  ComplianceStatus,
} from '../types';

export interface CarePlanSearchProps {
  filters: CarePlanSearchFilters;
  onFiltersChange: (filters: CarePlanSearchFilters) => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'COMPLETED', label: 'Completed' },
];

const planTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'PERSONAL_CARE', label: 'Personal Care' },
  { value: 'COMPANION', label: 'Companion' },
  { value: 'SKILLED_NURSING', label: 'Skilled Nursing' },
  { value: 'THERAPY', label: 'Therapy' },
  { value: 'HOSPICE', label: 'Hospice' },
  { value: 'RESPITE', label: 'Respite' },
  { value: 'LIVE_IN', label: 'Live In' },
  { value: 'CUSTOM', label: 'Custom' },
];

const complianceOptions = [
  { value: '', label: 'All Compliance Statuses' },
  { value: 'COMPLIANT', label: 'Compliant' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'NON_COMPLIANT', label: 'Non-Compliant' },
];

export const CarePlanSearch: React.FC<CarePlanSearchProps> = ({ filters, onFiltersChange }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search by name, plan number, or client ID..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
          <Select
            label="Status"
            options={statusOptions}
            value={filters.status?.[0] || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value ? [e.target.value as CarePlanStatus] : undefined,
              })
            }
          />

          <Select
            label="Plan Type"
            options={planTypeOptions}
            value={filters.planType?.[0] || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                planType: e.target.value ? [e.target.value as CarePlanType] : undefined,
              })
            }
          />

          <Select
            label="Compliance Status"
            options={complianceOptions}
            value={filters.complianceStatus?.[0] || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                complianceStatus: e.target.value ? [e.target.value as ComplianceStatus] : undefined,
              })
            }
          />

          <Input
            label="Coordinator ID"
            value={filters.coordinatorId || ''}
            onChange={(e) => onFiltersChange({ ...filters, coordinatorId: e.target.value })}
          />

          <Input
            label="Client ID"
            value={filters.clientId || ''}
            onChange={(e) => onFiltersChange({ ...filters, clientId: e.target.value })}
          />

          <Input
            label="Organization ID"
            value={filters.organizationId || ''}
            onChange={(e) => onFiltersChange({ ...filters, organizationId: e.target.value })}
          />

          <Input
            label="Branch ID"
            value={filters.branchId || ''}
            onChange={(e) => onFiltersChange({ ...filters, branchId: e.target.value })}
          />

          <Input
            label="Expiring Within (days)"
            type="number"
            value={filters.expiringWithinDays?.toString() || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                expiringWithinDays: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
        </div>
      )}
    </div>
  );
};
