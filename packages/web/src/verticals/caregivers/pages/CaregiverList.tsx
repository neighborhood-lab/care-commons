/**
 * Caregiver List Page
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button, LoadingSpinner, EmptyState, ErrorMessage, Card, Badge } from '@/core/components/index.js';
import { usePermissions } from '@/core/hooks/index.js';
import { useCaregivers } from '../hooks/index.js';
import type { CaregiverSearchFilters } from '../types/index.js';

export const CaregiverList: React.FC = () => {
  const { can } = usePermissions();
  const [filters, setFilters] = useState<CaregiverSearchFilters>({});
  const [page] = useState(1);
  const { data, isLoading, error, refetch } = useCaregivers(filters, page);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load caregivers'}
        retry={refetch}
      />
    );
  }

  const caregivers = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caregivers</h1>
          <p className="text-gray-600 mt-1">
            {data?.total ?? 0} total caregivers
          </p>
        </div>
        {can('caregivers:write') && (
          <Link to="/caregivers/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              New Caregiver
            </Button>
          </Link>
        )}
      </div>

      {/* Search/Filter section would go here */}
      <Card>
        <div className="px-6 py-4">
          <input
            type="text"
            placeholder="Search caregivers..."
            className="w-full px-3 py-2 border rounded-lg"
            value={filters.query ?? ''}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </div>
      </Card>

      {caregivers.length === 0 ? (
        <EmptyState
          title="No caregivers found"
          description="Get started by adding your first caregiver."
          action={
            can('caregivers:write') ? (
              <Link to="/caregivers/new">
                <Button leftIcon={<Plus className="h-4 w-4" />}>
                  Add Caregiver
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {caregivers.map((caregiver: { id: string; firstName: string; lastName: string; employeeNumber: string; role: string; status: string; complianceStatus: string }) => (
            <Link key={caregiver.id} to={`/caregivers/${caregiver.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="px-6 py-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {caregiver.firstName} {caregiver.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {caregiver.employeeNumber} • {caregiver.role}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={caregiver.status === 'ACTIVE' ? 'success' : 'default'}>
                        {caregiver.status}
                      </Badge>
                      <Badge variant={caregiver.complianceStatus === 'COMPLIANT' ? 'success' : 'warning'}>
                        {caregiver.complianceStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
