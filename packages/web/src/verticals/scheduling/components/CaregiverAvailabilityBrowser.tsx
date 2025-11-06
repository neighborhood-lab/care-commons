/**
 * CaregiverAvailabilityBrowser - browse and select available caregivers
 */

import React, { useState } from 'react';
import { User, CheckCircle2, XCircle, AlertTriangle, Search } from 'lucide-react';
import { LoadingSpinner, ErrorMessage, Badge } from '@/core/components';
import { useCaregivers } from '@/verticals/caregivers/hooks';
import type { Visit } from '../types';

interface CaregiverAvailabilityBrowserProps {
  visit: Visit;
  onSelectCaregiver: (caregiverId: string, caregiverName: string) => void;
}

export const CaregiverAvailabilityBrowser: React.FC<
  CaregiverAvailabilityBrowserProps
> = ({ visit, onSelectCaregiver }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, error } = useCaregivers(
    {
      status: ['ACTIVE'],
      query: searchQuery,
    },
    1,
    50
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={(error as Error).message || 'Failed to load caregivers'}
      />
    );
  }

  const caregivers = data?.items || [];

  // Mock availability check - in real app would call API
  const getCaregiverAvailability = (caregiverId: string) => {
    // Simple mock: alternating availability
    const hash = caregiverId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      isAvailable: hash % 3 !== 0,
      matchScore: hash % 100,
      reason: hash % 3 === 0 ? 'Already has a conflicting visit' : undefined,
    };
  };

  const availableCaregivers = caregivers
    .map((c) => ({
      ...c,
      availability: getCaregiverAvailability(c.id),
    }))
    .sort((a, b) => {
      // Sort: available first, then by match score
      if (a.availability.isAvailable !== b.availability.isAvailable) {
        return a.availability.isAvailable ? -1 : 1;
      }
      return (b.availability.matchScore || 0) - (a.availability.matchScore || 0);
    });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search caregivers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="text-sm text-gray-600">
        <p>
          Showing {availableCaregivers.length} caregiver
          {availableCaregivers.length !== 1 ? 's' : ''} for{' '}
          <span className="font-medium">
            {new Date(visit.scheduledDate).toLocaleDateString()} at{' '}
            {visit.scheduledStartTime}
          </span>
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {availableCaregivers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No caregivers found</p>
          </div>
        ) : (
          availableCaregivers.map((caregiver) => (
            <div
              key={caregiver.id}
              className={`p-4 border rounded-lg transition-all ${
                caregiver.availability.isAvailable
                  ? 'border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer bg-white'
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
              onClick={() => {
                if (caregiver.availability.isAvailable) {
                  onSelectCaregiver(
                    caregiver.id,
                    `${caregiver.firstName} ${caregiver.lastName}`
                  );
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {caregiver.firstName} {caregiver.lastName}
                      </h4>
                      {caregiver.availability.isAvailable ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600">{caregiver.role}</p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-600">
                        {caregiver.employeeNumber}
                      </p>
                    </div>
                    {!caregiver.availability.isAvailable &&
                      caregiver.availability.reason && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{caregiver.availability.reason}</span>
                        </div>
                      )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {caregiver.availability.isAvailable && (
                    <Badge variant="success" size="sm">
                      Match: {caregiver.availability.matchScore}%
                    </Badge>
                  )}
                  {caregiver.complianceStatus === 'COMPLIANT' ? (
                    <Badge variant="success" size="sm">
                      Compliant
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      {caregiver.complianceStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
