import React from 'react';
import { User, MapPin, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components';
import type { MatchCandidate } from '../types';
import { getMatchQualityColor, getMatchScoreColor, formatDistance } from '../utils';

interface MatchCandidateCardProps {
  candidate: MatchCandidate;
  onCreateProposal?: (caregiverId: string) => void;
  isCreatingProposal?: boolean;
}

export const MatchCandidateCard: React.FC<MatchCandidateCardProps> = ({
  candidate,
  onCreateProposal,
  isCreatingProposal = false,
}) => {
  const qualityColor = getMatchQualityColor(candidate.matchQuality);
  const scoreColor = getMatchScoreColor(candidate.overallScore);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 rounded-full p-2">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{candidate.caregiverName}</h3>
            <p className="text-sm text-gray-500">{candidate.caregiverPhone}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`text-2xl font-bold ${scoreColor}`}>{candidate.overallScore}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${qualityColor}`}>
            {candidate.matchQuality}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {candidate.distanceFromShift !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              Distance:
            </span>
            <span className="font-medium">{formatDistance(candidate.distanceFromShift)}</span>
          </div>
        )}

        {candidate.previousVisitsWithClient !== undefined &&
          candidate.previousVisitsWithClient > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="h-4 w-4" />
                Previous visits:
              </span>
              <span className="font-medium">{candidate.previousVisitsWithClient}</span>
            </div>
          )}

        {candidate.clientRating !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-600">
              <Star className="h-4 w-4" />
              Client rating:
            </span>
            <span className="font-medium">{candidate.clientRating.toFixed(1)}/5</span>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-500 mb-2">Match Scores</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Skills:</span>
            <span className="font-medium">{candidate.scores.skillMatch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Availability:</span>
            <span className="font-medium">{candidate.scores.availabilityMatch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Proximity:</span>
            <span className="font-medium">{candidate.scores.proximityMatch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Experience:</span>
            <span className="font-medium">{candidate.scores.experienceMatch}</span>
          </div>
        </div>
      </div>

      {candidate.eligibilityIssues.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-medium text-yellow-800 mb-1">Issues</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                {candidate.eligibilityIssues.slice(0, 3).map((issue, idx) => (
                  <li key={idx}>{issue.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {candidate.matchReasons.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 mb-2">Why this match?</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {candidate.matchReasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className={reason.impact === 'POSITIVE' ? 'text-green-600' : 'text-gray-400'}>
                  •
                </span>
                {reason.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {onCreateProposal && candidate.isEligible && (
        <Button
          onClick={() => onCreateProposal(candidate.caregiverId)}
          disabled={isCreatingProposal}
          className="w-full"
        >
          Create Proposal
        </Button>
      )}
    </div>
  );
};
