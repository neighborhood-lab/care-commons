import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, MapPin, Star } from 'lucide-react';
import type { MatchCandidate } from '../types';

interface MatchDetailsProps {
  match: MatchCandidate;
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({ match }) => {
  return (
    <div className="space-y-4">
      {/* Match Reasons */}
      {match.matchReasons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Why this match?
          </h4>
          <ul className="space-y-1.5">
            {match.matchReasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                {reason.impact === 'POSITIVE' && (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                )}
                {reason.impact === 'NEGATIVE' && (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                {reason.impact === 'NEUTRAL' && (
                  <AlertTriangle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-gray-700">{reason.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {match.distanceFromShift !== undefined && (
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">Distance</span>
            </div>
            <p className="text-gray-900">{match.distanceFromShift.toFixed(1)} miles</p>
            {match.estimatedTravelTime !== undefined && (
              <p className="text-xs text-gray-500">~{match.estimatedTravelTime} min drive</p>
            )}
          </div>
        )}

        {match.previousVisitsWithClient !== undefined && match.previousVisitsWithClient > 0 && (
          <div>
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Star className="h-4 w-4" />
              <span className="font-medium">Previous Visits</span>
            </div>
            <p className="text-gray-900">{match.previousVisitsWithClient} visits</p>
            {match.clientRating !== undefined && (
              <p className="text-xs text-gray-500">Rated {match.clientRating.toFixed(1)}/5.0</p>
            )}
          </div>
        )}
      </div>

      {/* Schedule Conflict Warning */}
      {match.hasConflict && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <h5 className="text-sm font-semibold text-red-800">Schedule Conflict</h5>
              <p className="text-xs text-red-700 mt-1">
                This caregiver has a conflicting appointment during this shift time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Eligibility Issues */}
      {match.eligibilityIssues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">All Issues</h4>
          <ul className="space-y-1.5">
            {match.eligibilityIssues.map((issue, idx) => (
              <li
                key={idx}
                className={`text-xs p-2 rounded ${
                  issue.severity === 'BLOCKING'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}
              >
                <span className="font-medium">{issue.severity}:</span> {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
