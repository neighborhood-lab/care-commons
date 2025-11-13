/**
 * Medication List Page
 *
 * Display all medications for a client with:
 * - Active medications
 * - Medication schedule/frequency
 * - Last administration time
 * - Compliance warnings
 * - Quick actions (mark as taken, refill needed)
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

interface Medication {
  id: string;
  clientId: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  route: 'ORAL' | 'TOPICAL' | 'INJECTION' | 'INHALATION' | 'OTHER';
  frequency: string;
  instructions?: string;
  prescribedBy: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'DISCONTINUED' | 'ON_HOLD';
  refillsRemaining?: number;
  lastAdministered?: string;
  nextScheduledTime?: string;
  sideEffects?: string[];
  warnings?: string[];
}

interface MedicationAdministration {
  id: string;
  medicationId: string;
  clientId: string;
  administeredBy: string;
  administeredAt: string;
  dosageGiven: string;
  notes?: string;
  refusalReason?: string;
  status: 'GIVEN' | 'REFUSED' | 'HELD' | 'MISSED';
}

async function fetchMedications(clientId: string): Promise<Medication[]> {
  const response = await fetch(`/api/clients/${clientId}/medications`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch medications');
  return response.json();
}

async function markAsTaken(
  medicationId: string,
  clientId: string
): Promise<MedicationAdministration> {
  const response = await fetch(`/api/medications/${medicationId}/administer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      clientId,
      status: 'GIVEN',
      administeredAt: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error('Failed to mark medication as taken');
  return response.json();
}

export function MedicationListPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'DISCONTINUED'>('ACTIVE');

  const { data: medications = [], isLoading, error } = useQuery({
    queryKey: ['medications', clientId],
    queryFn: () => fetchMedications(clientId!),
    enabled: !!clientId,
    refetchInterval: 60000, // Refresh every minute
  });

  const markAsTakenMutation = useMutation({
    mutationFn: ({ medicationId }: { medicationId: string }) =>
      markAsTaken(medicationId, clientId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', clientId] });
    },
  });

  const filteredMedications =
    filterStatus === 'ALL'
      ? medications
      : medications.filter((med) => med.status === filterStatus);

  const getRouteIcon = (route: string) => {
    switch (route) {
      case 'ORAL':
        return '💊';
      case 'TOPICAL':
        return '🧴';
      case 'INJECTION':
        return '💉';
      case 'INHALATION':
        return '🌬️';
      default:
        return '💊';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DISCONTINUED':
        return 'bg-gray-100 text-gray-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (medication: Medication) => {
    if (!medication.nextScheduledTime) return false;
    return new Date(medication.nextScheduledTime) < new Date();
  };

  const needsRefill = (medication: Medication) => {
    return medication.refillsRemaining !== undefined && medication.refillsRemaining <= 1;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load medications. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600 mt-1">Manage client medications and administration</p>
        </div>
        <Link
          to={`/clients/${clientId}/medications/add`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Medication
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['ACTIVE', 'ALL', 'DISCONTINUED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                filterStatus === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status.replace('_', ' ')}
              {status === 'ACTIVE' && (
                <span className="ml-2 py-0.5 px-2 rounded-full bg-blue-100 text-blue-600 text-xs">
                  {medications.filter((m) => m.status === 'ACTIVE').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Medications List */}
      {filteredMedications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No medications found</p>
          <p className="text-gray-400 text-sm mt-2">Add medications to start tracking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMedications.map((medication) => {
            const overdue = isOverdue(medication);
            const refillNeeded = needsRefill(medication);

            return (
              <div
                key={medication.id}
                className={`bg-white rounded-lg shadow overflow-hidden ${
                  overdue ? 'border-l-4 border-red-500' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Route Icon */}
                      <div className="text-3xl">{getRouteIcon(medication.route)}</div>

                      {/* Medication Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {medication.medicationName}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              medication.status
                            )}`}
                          >
                            {medication.status}
                          </span>
                          {refillNeeded && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Refill Needed
                            </span>
                          )}
                        </div>

                        {medication.genericName && (
                          <p className="text-sm text-gray-600 mb-2">Generic: {medication.genericName}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Dosage</p>
                            <p className="font-medium text-gray-900">{medication.dosage}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Frequency</p>
                            <p className="font-medium text-gray-900">{medication.frequency}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Route</p>
                            <p className="font-medium text-gray-900">{medication.route}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Prescribed By</p>
                            <p className="font-medium text-gray-900">{medication.prescribedBy}</p>
                          </div>
                        </div>

                        {medication.instructions && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Instructions:</span> {medication.instructions}
                            </p>
                          </div>
                        )}

                        {medication.warnings && medication.warnings.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Warnings:</p>
                            <ul className="text-sm text-yellow-700 list-disc list-inside">
                              {medication.warnings.map((warning, idx) => (
                                <li key={idx}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {medication.lastAdministered && (
                          <div className="mt-3 text-sm text-gray-600">
                            Last given:{' '}
                            {new Date(medication.lastAdministered).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        )}

                        {medication.nextScheduledTime && (
                          <div className="mt-1 text-sm">
                            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              Next due:{' '}
                              {new Date(medication.nextScheduledTime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                              {overdue && ' (OVERDUE)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {medication.status === 'ACTIVE' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => markAsTakenMutation.mutate({ medicationId: medication.id })}
                          disabled={markAsTakenMutation.isPending}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {markAsTakenMutation.isPending ? 'Marking...' : '✓ Mark as Taken'}
                        </button>
                        <Link
                          to={`/clients/${clientId}/medications/${medication.id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 text-center transition-colors"
                        >
                          View Details
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
