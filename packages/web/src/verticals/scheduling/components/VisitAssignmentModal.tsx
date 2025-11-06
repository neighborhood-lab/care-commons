/**
 * VisitAssignmentModal - modal for assigning a caregiver to a visit
 */

import React, { useState } from 'react';
import { X, User, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '@/core/components';
import { useVisit, useAssignVisit } from '../hooks';
import { CaregiverAvailabilityBrowser } from './CaregiverAvailabilityBrowser';

interface VisitAssignmentModalProps {
  visitId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VisitAssignmentModal: React.FC<VisitAssignmentModalProps> = ({
  visitId,
  isOpen,
  onClose,
}) => {
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string | null>(
    null
  );
  const [selectedCaregiverName, setSelectedCaregiverName] = useState<
    string | null
  >(null);
  const { data: visit, isLoading } = useVisit(visitId);
  const assignVisit = useAssignVisit();

  const handleSelectCaregiver = (caregiverId: string, caregiverName: string) => {
    setSelectedCaregiverId(caregiverId);
    setSelectedCaregiverName(caregiverName);
  };

  const handleAssign = async () => {
    if (!selectedCaregiverId) {
      toast.error('Please select a caregiver');
      return;
    }

    try {
      await assignVisit.mutateAsync({
        visitId,
        caregiverId: selectedCaregiverId,
        assignmentMethod: 'MANUAL',
      });
      toast.success(`Visit assigned to ${selectedCaregiverName}`);
      onClose();
    } catch (error) {
      toast.error(
        (error as Error).message || 'Failed to assign visit'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Assign Caregiver to Visit
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : visit ? (
              <div className="space-y-6">
                {/* Visit Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Visit Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Client</p>
                        <p className="text-sm font-medium text-gray-900">
                          {visit.clientName || 'Unknown Client'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(visit.scheduledDate).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {visit.scheduledStartTime} - {visit.scheduledEndTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600">Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {visit.address.city}, {visit.address.state}
                        </p>
                      </div>
                    </div>
                  </div>
                  {visit.isUrgent && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Urgent visit</span>
                    </div>
                  )}
                </div>

                {/* Selected Caregiver */}
                {selectedCaregiverName && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-700">Selected Caregiver</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {selectedCaregiverName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Caregiver Browser */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Available Caregivers
                  </h3>
                  <CaregiverAvailabilityBrowser
                    visit={visit}
                    onSelectCaregiver={handleSelectCaregiver}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Visit not found
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={assignVisit.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedCaregiverId || assignVisit.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {assignVisit.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  Assigning...
                </>
              ) : (
                'Assign Visit'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
