import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components';
import type { MatchCandidate } from '../types';
import { useShiftMatchingApi } from '../hooks';
import { ScoreBadge } from './ScoreBadge';
import { ScoreBar } from './ScoreBar';
import { MatchDetails } from './MatchDetails';

interface MatchSuggestionsPanelProps {
  shiftId: string;
  onAssign?: (caregiverId: string) => void;
}

export const MatchSuggestionsPanel: React.FC<MatchSuggestionsPanelProps> = ({
  shiftId,
  onAssign,
}) => {
  const api = useShiftMatchingApi();
  const queryClient = useQueryClient();

  const { data: candidatesData, isLoading, error } = useQuery({
    queryKey: ['shift-matches', shiftId],
    queryFn: () => api.getMatchCandidates(shiftId),
  });

  const createProposal = useMutation({
    mutationFn: (caregiverId: string) =>
      api.createProposal({
        openShiftId: shiftId,
        caregiverId,
        sendNotification: true,
        urgencyFlag: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-matches', shiftId] });
      queryClient.invalidateQueries({ queryKey: ['open-shift', shiftId] });
    },
  });

  const handleAssign = async (caregiverId: string) => {
    await createProposal.mutateAsync(caregiverId);
    onAssign?.(caregiverId);
  };

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
        message="Failed to load match suggestions"
        retry={() => queryClient.invalidateQueries({ queryKey: ['shift-matches', shiftId] })}
      />
    );
  }

  const matches = candidatesData?.items || [];

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No matching caregivers found for this shift.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Match Suggestions
        </h2>
        <span className="text-sm text-gray-500">
          {matches.length} candidate{matches.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="space-y-3">
        {matches.map((match, index) => (
          <MatchCard
            key={match.caregiverId}
            match={match}
            rank={index + 1}
            onAssign={() => handleAssign(match.caregiverId)}
            isAssigning={createProposal.isPending}
          />
        ))}
      </div>
    </div>
  );
};

interface MatchCardProps {
  match: MatchCandidate;
  rank: number;
  onAssign: () => void;
  isAssigning: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, rank, onAssign, isAssigning }) => {
  const [expanded, setExpanded] = useState(false);

  const getMedal = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const medal = getMedal(rank);

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {medal && <span className="text-2xl" aria-label={`Rank ${rank}`}>{medal}</span>}
          {!medal && (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">{rank}</span>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{match.caregiverName}</h3>
            <p className="text-sm text-gray-600">
              {match.distanceFromShift !== undefined && `${match.distanceFromShift.toFixed(1)} miles away`}
              {match.previousVisitsWithClient !== undefined && match.previousVisitsWithClient > 0 && (
                <span className="ml-2">
                  • {match.previousVisitsWithClient} previous visit{match.previousVisitsWithClient !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ScoreBadge score={match.overallScore} quality={match.matchQuality} />
          {match.isEligible && (
            <Button
              onClick={onAssign}
              variant="primary"
              size="sm"
              disabled={isAssigning}
            >
              Assign
            </Button>
          )}
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ScoreBar label="Skills" score={match.scores.skillMatch} />
        <ScoreBar label="Availability" score={match.scores.availabilityMatch} />
        <ScoreBar label="Proximity" score={match.scores.proximityMatch} />
        <ScoreBar label="Preference" score={match.scores.preferenceMatch} />
        {match.scores.experienceMatch !== undefined && (
          <ScoreBar label="Experience" score={match.scores.experienceMatch} />
        )}
        {match.scores.reliabilityMatch !== undefined && (
          <ScoreBar label="Reliability" score={match.scores.reliabilityMatch} />
        )}
      </div>

      {/* Eligibility issues */}
      {match.eligibilityIssues.length > 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-xs font-semibold text-yellow-800 mb-1">Issues</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            {match.eligibilityIssues.slice(0, 2).map((issue, idx) => (
              <li key={idx}>• {issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t">
          <MatchDetails match={match} />
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            View Details
          </>
        )}
      </button>
    </div>
  );
};
