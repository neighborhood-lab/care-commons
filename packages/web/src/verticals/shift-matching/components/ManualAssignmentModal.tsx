import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button, LoadingSpinner } from '@/core/components';
import { Modal } from '@/core/components/Modal';
import { useShiftMatchingApi } from '../hooks';
import type { MatchCandidate } from '../types';
import { ScoreBadge } from './ScoreBadge';

interface ManualAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
  onSuccess?: () => void;
}

export const ManualAssignmentModal: React.FC<ManualAssignmentModalProps> = ({
  isOpen,
  onClose,
  shiftId,
  onSuccess,
}) => {
  const [selectedCaregiver, setSelectedCaregiver] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const api = useShiftMatchingApi();
  const queryClient = useQueryClient();

  // Get all match candidates for this shift
  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['shift-matches-all', shiftId],
    queryFn: () => api.matchShift({ openShiftId: shiftId, autoPropose: false }),
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCaregiver) throw new Error('No caregiver selected');

      // Create proposal with manual override
      return api.createProposal({
        openShiftId: shiftId,
        caregiverId: selectedCaregiver,
        sendNotification: true,
        notes: `Manual override: ${overrideReason}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-matches', shiftId] });
      queryClient.invalidateQueries({ queryKey: ['open-shift', shiftId] });
      onSuccess?.();
      handleClose();
    },
  });

  const handleClose = () => {
    setSelectedCaregiver(null);
    setOverrideReason('');
    setSearchQuery('');
    onClose();
  };

  const handleAssign = () => {
    if (!selectedCaregiver || !overrideReason.trim()) return;
    assignMutation.mutate();
  };

  const candidates = candidatesData?.items || [];
  const filteredCandidates = candidates.filter((c) =>
    c.caregiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCandidate = candidates.find((c) => c.caregiverId === selectedCaregiver);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Manual Assignment" size="lg">
      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Caregivers
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Caregiver List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCandidates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {searchQuery ? 'No caregivers found matching your search' : 'No caregivers available'}
              </p>
            ) : (
              filteredCandidates.map((candidate) => (
                <CaregiverOption
                  key={candidate.caregiverId}
                  candidate={candidate}
                  isSelected={selectedCaregiver === candidate.caregiverId}
                  onSelect={() => setSelectedCaregiver(candidate.caregiverId)}
                />
              ))
            )}
          </div>
        )}

        {/* Selected Caregiver Warnings */}
        {selectedCandidate && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Match Analysis</h3>

            {/* Match Quality */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">Match Quality:</span>
              <ScoreBadge
                score={selectedCandidate.overallScore}
                quality={selectedCandidate.matchQuality}
              />
            </div>

            {/* Warnings */}
            {selectedCandidate.eligibilityIssues.length > 0 && (
              <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-yellow-800">
                      Eligibility Issues ({selectedCandidate.eligibilityIssues.length})
                    </h4>
                  </div>
                </div>
                <ul className="space-y-1 ml-7">
                  {selectedCandidate.eligibilityIssues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-yellow-800">
                      <span className="font-medium">{issue.severity}:</span> {issue.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Schedule Conflict */}
            {selectedCandidate.hasConflict && (
              <div className="border border-red-300 bg-red-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">Schedule Conflict</h4>
                    <p className="text-sm text-red-700 mt-1">
                      This caregiver has a conflicting appointment during this shift.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Good Signs */}
            {selectedCandidate.isEligible && !selectedCandidate.hasConflict && (
              <div className="border border-green-300 bg-green-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-800">Eligible for Assignment</h4>
                    <p className="text-sm text-green-700 mt-1">
                      No blocking issues found. This caregiver can be assigned to this shift.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Override Reason */}
        {selectedCaregiver && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Manual Assignment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              placeholder="Explain why you're manually assigning this caregiver (e.g., client request, special circumstance, etc.)"
              required
            />
            {overrideReason.trim() && overrideReason.length < 10 && (
              <p className="mt-1 text-sm text-red-600">
                Please provide a more detailed reason (at least 10 characters)
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            variant="primary"
            disabled={
              !selectedCaregiver ||
              !overrideReason.trim() ||
              overrideReason.length < 10 ||
              assignMutation.isPending
            }
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign Caregiver'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface CaregiverOptionProps {
  candidate: MatchCandidate;
  isSelected: boolean;
  onSelect: () => void;
}

const CaregiverOption: React.FC<CaregiverOptionProps> = ({
  candidate,
  isSelected,
  onSelect,
}) => {
  const hasIssues = candidate.eligibilityIssues.length > 0 || candidate.hasConflict;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-lg border-2 transition ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{candidate.caregiverName}</h4>
            <ScoreBadge score={candidate.overallScore} size="sm" />
          </div>
          <div className="text-sm text-gray-600">
            {candidate.distanceFromShift !== undefined &&
              `${candidate.distanceFromShift.toFixed(1)} miles away`}
            {candidate.previousVisitsWithClient !== undefined &&
              candidate.previousVisitsWithClient > 0 && (
                <span className="ml-2">
                  • {candidate.previousVisitsWithClient} previous visit
                  {candidate.previousVisitsWithClient !== 1 ? 's' : ''}
                </span>
              )}
          </div>
          {hasIssues && (
            <div className="mt-2 flex items-center gap-1 text-xs text-yellow-700">
              <AlertTriangle className="h-3 w-3" />
              {candidate.eligibilityIssues.length} issue
              {candidate.eligibilityIssues.length !== 1 ? 's' : ''}
              {candidate.hasConflict && ' • Schedule conflict'}
            </div>
          )}
        </div>
        {isSelected && (
          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
        )}
      </div>
    </button>
  );
};
