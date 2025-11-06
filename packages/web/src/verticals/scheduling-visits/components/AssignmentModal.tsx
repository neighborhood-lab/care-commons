import React, { useState } from 'react';
import { X, User, MapPin, Award, Star, AlertCircle } from 'lucide-react';
import { Button, LoadingSpinner, Input } from '@/core/components';
import { useAvailableCaregivers, useAssignCaregiver } from '../hooks';
import toast from 'react-hot-toast';
import type { CaregiverAvailability } from '../types';

interface AssignmentModalProps {
  visitId: string;
  visitDetails?: {
    clientName: string;
    scheduledDate: Date;
    scheduledTime: string;
    serviceType: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  visitId,
  visitDetails,
  onClose,
  onSuccess,
}) => {
  const [selectedCaregiverId, setSelectedCaregiverId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: caregivers, isLoading } = useAvailableCaregivers(visitId);
  const assignMutation = useAssignCaregiver();

  const filteredCaregivers = caregivers?.filter(
    (cg) =>
      searchQuery === '' ||
      cg.caregiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedCaregiverId) {
      toast.error('Please select a caregiver');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        visitId,
        caregiverId: selectedCaregiverId,
        notes,
      });

      toast.success('Caregiver assigned successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Failed to assign caregiver');
      console.error('Assignment error:', error);
    }
  };

  const getAvailabilityColor = (caregiver: CaregiverAvailability) => {
    if (!caregiver.isAvailable) return 'text-red-600 bg-red-50';
    if (caregiver.matchScore && caregiver.matchScore >= 80) return 'text-green-600 bg-green-50';
    if (caregiver.matchScore && caregiver.matchScore >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Caregiver</h2>
              {visitDetails && (
                <p className="text-sm text-gray-600 mt-1">
                  {visitDetails.clientName} • {visitDetails.scheduledTime} •{' '}
                  {visitDetails.serviceType}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200">
            <Input
              placeholder="Search caregivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Caregiver List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredCaregivers && filteredCaregivers.length > 0 ? (
              <div className="space-y-3">
                {filteredCaregivers.map((caregiver) => (
                  <button
                    key={caregiver.caregiverId}
                    onClick={() => setSelectedCaregiverId(caregiver.caregiverId)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedCaregiverId === caregiver.caregiverId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    disabled={!caregiver.isAvailable}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {caregiver.caregiverName}
                          </span>
                          {caregiver.preferredCaregiver && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>

                        {/* Skills and Certifications */}
                        {(caregiver.skills || caregiver.certifications) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {caregiver.skills?.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                <Award className="h-3 w-3" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Distance */}
                        {caregiver.distanceFromClient && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{caregiver.distanceFromClient.toFixed(1)} miles away</span>
                          </div>
                        )}

                        {/* Conflicts */}
                        {!caregiver.isAvailable && caregiver.conflicts && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3 mt-0.5" />
                            <div>
                              {caregiver.conflicts.map((conflict, idx) => (
                                <div key={idx}>{conflict}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match Score */}
                      {caregiver.matchScore !== undefined && (
                        <div
                          className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(
                            caregiver
                          )}`}
                        >
                          {caregiver.matchScore}% match
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p>No caregivers available for this visit</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="p-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={!selectedCaregiverId || assignMutation.isPending}
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign Caregiver'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
