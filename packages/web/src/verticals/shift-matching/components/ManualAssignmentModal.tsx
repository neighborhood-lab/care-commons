/**
 * Manual Assignment Modal
 * 
 * Allows coordinators to manually assign a caregiver outside of algorithmic suggestions:
 * - Search for any caregiver
 * - Show warnings if they're not a top match
 * - Require override reason (audit trail)
 * - Display eligibility issues
 */

import React, { useState } from 'react';
import { Search, AlertTriangle, Info, X, CheckCircle } from 'lucide-react';
import { Button, LoadingSpinner } from '@/core/components';
import type { MatchCandidate, OpenShift } from '../types';

interface ManualAssignmentModalProps {
  shift: OpenShift;
  allCandidates?: MatchCandidate[];
  onAssign: (caregiverId: string, reason: string) => Promise<void>;
  onClose: () => void;
  isAssigning?: boolean;
}

export const ManualAssignmentModal: React.FC<ManualAssignmentModalProps> = ({
  shift,
  allCandidates = [],
  onAssign,
  onClose,
  isAssigning = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showReasonError, setShowReasonError] = useState(false);

  const filteredCandidates = searchQuery.trim()
    ? allCandidates.filter(c =>
        c.caregiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caregiverPhone.includes(searchQuery)
      )
    : allCandidates;

  const handleSelectCandidate = (candidate: MatchCandidate) => {
    setSelectedCandidate(candidate);
    setSearchQuery('');
  };

  const handleAssign = async () => {
    if (!selectedCandidate) return;

    if (!overrideReason.trim()) {
      setShowReasonError(true);
      return;
    }

    try {
      await onAssign(selectedCandidate.caregiverId, overrideReason);
      onClose();
    } catch (error) {
      console.error('Failed to assign:', error);
    }
  };

  const isTopMatch = selectedCandidate && allCandidates.indexOf(selectedCandidate) < 3;
  const hasIssues = selectedCandidate && selectedCandidate.eligibilityIssues.length > 0;
  const isIneligible = selectedCandidate && !selectedCandidate.isEligible;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manual Assignment</h2>
            <p className="text-sm text-gray-600 mt-1">
              Shift #{shift.id} • {shift.clientName || shift.clientId}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(shift.scheduledDate).toLocaleDateString()} • {shift.startTime} - {shift.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search for caregiver */}
          {!selectedCandidate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for Caregiver
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Search results */}
              {searchQuery.trim() && (
                <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                  {filteredCandidates.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No caregivers found</p>
                  ) : (
                    filteredCandidates.map((candidate, index) => (
                      <button
                        key={candidate.caregiverId}
                        onClick={() => handleSelectCandidate(candidate)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{candidate.caregiverName}</p>
                            <p className="text-sm text-gray-600">{candidate.caregiverPhone}</p>
                            <p className="text-xs text-gray-500">{candidate.employmentType}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{candidate.overallScore}</div>
                            <div className="text-xs text-gray-500">
                              {index < 3 ? `#${index + 1} match` : `#${index + 1}`}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Selected candidate */}
          {selectedCandidate && (
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selected Caregiver
                  </label>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{selectedCandidate.caregiverName}</p>
                      <p className="text-sm text-gray-600">{selectedCandidate.caregiverPhone}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{selectedCandidate.overallScore}</div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setOverrideReason('');
                    setShowReasonError(false);
                  }}
                >
                  Change
                </Button>
              </div>

              {/* Warnings and recommendations */}
              {!isTopMatch && !isIneligible && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                        Not a Top Match
                      </h4>
                      <p className="text-sm text-yellow-800">
                        This caregiver was not in the top 3 matches. Consider reviewing the match suggestions before proceeding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isIneligible && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-900 mb-1">
                        Eligibility Issues
                      </h4>
                      <p className="text-sm text-red-800 mb-2">
                        This caregiver has eligibility issues that may prevent successful assignment:
                      </p>
                      <ul className="text-sm text-red-800 space-y-1">
                        {selectedCandidate.eligibilityIssues.map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="mt-0.5">•</span>
                            <span>{issue.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {hasIssues && !isIneligible && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900 mb-1">
                        Considerations
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {selectedCandidate.eligibilityIssues
                          .filter(i => i.severity === 'WARNING')
                          .map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="mt-0.5">•</span>
                              <span>{issue.message}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Match details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Match Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skills:</span>
                    <span className="font-medium">{selectedCandidate.scores.skillMatch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Availability:</span>
                    <span className="font-medium">{selectedCandidate.scores.availabilityMatch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proximity:</span>
                    <span className="font-medium">{selectedCandidate.scores.proximityMatch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{selectedCandidate.scores.experienceMatch}</span>
                  </div>
                </div>
                {selectedCandidate.distanceFromShift !== undefined && (
                  <div className="mt-3 text-sm text-gray-600">
                    Distance: <span className="font-medium">{selectedCandidate.distanceFromShift.toFixed(1)} miles</span>
                  </div>
                )}
              </div>

              {/* Override reason - REQUIRED */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Manual Assignment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => {
                    setOverrideReason(e.target.value);
                    setShowReasonError(false);
                  }}
                  placeholder="Explain why you are manually assigning this caregiver instead of using the top match suggestions..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    showReasonError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {showReasonError && (
                  <p className="mt-1 text-sm text-red-600">
                    Override reason is required for audit compliance
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  This reason will be logged for compliance and quality assurance purposes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedCandidate ? (
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Manual assignment will be logged for audit trail
              </span>
            ) : (
              <span>Select a caregiver to continue</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              variant="primary"
              disabled={!selectedCandidate || isAssigning}
              className="min-w-32"
            >
              {isAssigning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
