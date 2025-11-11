/**
 * Match Suggestions Panel
 * 
 * Displays top-scoring matches for an open shift with:
 * - Visual ranking (medals for top 3)
 * - Overall match score with progress indicator
 * - Dimensional score breakdown
 * - Quick action buttons
 * - Expandable detailed view
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Star, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button, LoadingSpinner } from '@/core/components';
import type { MatchCandidate } from '../types';
import { getMatchQualityColor, getMatchScoreColor, formatDistance } from '../utils';

interface MatchSuggestionsPanelProps {
  shiftId: string;
  candidates: MatchCandidate[];
  isLoading?: boolean;
  onAssign?: (caregiverId: string) => void;
  onCreateProposal?: (caregiverId: string) => void;
  isCreatingProposal?: boolean;
}

export const MatchSuggestionsPanel: React.FC<MatchSuggestionsPanelProps> = ({
  shiftId,
  candidates,
  isLoading = false,
  onAssign,
  onCreateProposal,
  isCreatingProposal = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
        <p className="text-gray-600">
          No eligible caregivers were found for this shift. Try adjusting the requirements or matching configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">
          Match Suggestions ({candidates.length})
        </h2>
        <div className="text-sm text-gray-600">
          Shift #{shiftId}
        </div>
      </div>

      <div className="space-y-4">
        {candidates.map((candidate, index) => (
          <MatchSuggestionCard
            key={candidate.caregiverId}
            candidate={candidate}
            rank={index + 1}
            onAssign={onAssign}
            onCreateProposal={onCreateProposal}
            isCreatingProposal={isCreatingProposal}
          />
        ))}
      </div>
    </div>
  );
};

interface MatchSuggestionCardProps {
  candidate: MatchCandidate;
  rank: number;
  onAssign?: (caregiverId: string) => void;
  onCreateProposal?: (caregiverId: string) => void;
  isCreatingProposal?: boolean;
}

const MatchSuggestionCard: React.FC<MatchSuggestionCardProps> = ({
  candidate,
  rank,
  onAssign,
  onCreateProposal,
  isCreatingProposal = false,
}) => {
  const [expanded, setExpanded] = useState(rank <= 3); // Auto-expand top 3

  const getMedal = (rank: number): string | null => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const medal = getMedal(rank);
  const qualityColor = getMatchQualityColor(candidate.matchQuality);
  const scoreColor = getMatchScoreColor(candidate.overallScore);

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow border-2 ${rank === 1 ? 'border-yellow-400' : rank === 2 ? 'border-gray-300' : rank === 3 ? 'border-orange-300' : 'border-transparent'}`}>
      {/* Main card content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Rank and Medal */}
            <div className="flex flex-col items-center gap-1">
              {medal ? (
                <span className="text-3xl">{medal}</span>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600">#{rank}</span>
                </div>
              )}
            </div>

            {/* Caregiver info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{candidate.caregiverName}</h3>
                  <p className="text-sm text-gray-600">{candidate.employmentType}</p>
                  <p className="text-xs text-gray-500">{candidate.caregiverPhone}</p>
                </div>
                
                {/* Score badge */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${scoreColor}`}>{candidate.overallScore}</div>
                    <div className="text-xs text-gray-500">/ 100</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${qualityColor}`}>
                    {candidate.matchQuality}
                  </span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {candidate.distanceFromShift !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{formatDistance(candidate.distanceFromShift)}</span>
                  </div>
                )}
                
                {candidate.estimatedTravelTime !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{candidate.estimatedTravelTime} min</span>
                  </div>
                )}
                
                {candidate.previousVisitsWithClient !== undefined && candidate.previousVisitsWithClient > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{candidate.previousVisitsWithClient} visits</span>
                  </div>
                )}
                
                {candidate.clientRating !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium">{candidate.clientRating.toFixed(1)}/5</span>
                  </div>
                )}
              </div>

              {/* Score breakdown - Progress bars */}
              <div className="mt-4">
                <h4 className="text-xs font-medium text-gray-500 mb-3">Match Score Breakdown</h4>
                <div className="space-y-2">
                  <ScoreBar label="Skills" score={candidate.scores.skillMatch} color="blue" />
                  <ScoreBar label="Availability" score={candidate.scores.availabilityMatch} color="green" />
                  <ScoreBar label="Proximity" score={candidate.scores.proximityMatch} color="purple" />
                  <ScoreBar label="Experience" score={candidate.scores.experienceMatch} color="orange" />
                </div>
              </div>

              {/* Eligibility issues */}
              {candidate.eligibilityIssues.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-xs font-medium text-yellow-800 mb-1">
                        {candidate.eligibilityIssues.filter(i => i.severity === 'BLOCKING').length > 0
                          ? 'Eligibility Issues'
                          : 'Warnings'}
                      </h4>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {candidate.eligibilityIssues.slice(0, 3).map((issue, idx) => (
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

              {/* Action buttons */}
              <div className="mt-4 flex gap-2">
                {candidate.isEligible && onAssign && (
                  <Button
                    onClick={() => onAssign(candidate.caregiverId)}
                    disabled={isCreatingProposal}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Assign Now
                  </Button>
                )}
                
                {candidate.isEligible && onCreateProposal && (
                  <Button
                    onClick={() => onCreateProposal(candidate.caregiverId)}
                    disabled={isCreatingProposal}
                    variant="outline"
                    className="flex-1"
                  >
                    Send Proposal
                  </Button>
                )}
                
                <Button
                  onClick={() => setExpanded(!expanded)}
                  variant="ghost"
                  size="sm"
                  className="px-3"
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* All dimensional scores */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Detailed Scores</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Skills Match:</span>
                    <span className="font-medium">{candidate.scores.skillMatch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Availability:</span>
                    <span className="font-medium">{candidate.scores.availabilityMatch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Proximity:</span>
                    <span className="font-medium">{candidate.scores.proximityMatch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Preference:</span>
                    <span className="font-medium">{candidate.scores.preferenceMatch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium">{candidate.scores.experienceMatch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reliability:</span>
                    <span className="font-medium">{candidate.scores.reliabilityMatch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Compliance:</span>
                    <span className="font-medium">{candidate.scores.complianceMatch}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{candidate.scores.capacityMatch}</span>
                  </div>
                </div>
              </div>

              {/* Match reasons */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Why This Match?</h4>
                <ul className="space-y-2 text-sm">
                  {candidate.matchReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`mt-1 flex-shrink-0 ${
                        reason.impact === 'POSITIVE' ? 'text-green-600' : 
                        reason.impact === 'NEGATIVE' ? 'text-red-600' : 
                        'text-gray-400'
                      }`}>
                        {reason.impact === 'POSITIVE' ? '✓' : reason.impact === 'NEGATIVE' ? '✗' : '•'}
                      </span>
                      <span className="text-gray-700">{reason.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Additional details */}
            {(candidate.hasConflict || candidate.warnings.length > 0) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {candidate.hasConflict && candidate.conflictingVisits && candidate.conflictingVisits.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Schedule Conflicts</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {candidate.conflictingVisits.map((conflict, idx) => (
                        <li key={idx}>
                          {conflict.clientName}: {conflict.startTime} - {conflict.endTime}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {candidate.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Warnings</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {candidate.warnings.map((warning, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="mt-0.5">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ScoreBarProps {
  label: string;
  score: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, score, color = 'blue' }) => {
  const getColorClasses = (color: string, score: number) => {
    // Dynamic color based on score
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return `bg-${color}-500`;
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const barColor = getColorClasses(color, score);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
};
