/**
 * Match Comparison View
 * 
 * Side-by-side comparison of 2-4 caregiver candidates:
 * - Compare scores across all dimensions
 * - Highlight differences
 * - Visual diff indicators
 * - Select winner from comparison
 */

import React, { useState } from 'react';
import { X, Download, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/core/components';
import type { MatchCandidate } from '../types';
import { getMatchScoreColor, formatDistance } from '../utils';

interface MatchComparisonViewProps {
  candidates: MatchCandidate[];
  maxCandidates?: number;
  onSelect?: (caregiverId: string) => void;
  onClose?: () => void;
}

export const MatchComparisonView: React.FC<MatchComparisonViewProps> = ({
  candidates: allCandidates,
  maxCandidates = 4,
  onSelect,
  onClose,
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState<MatchCandidate[]>(
    allCandidates.slice(0, Math.min(maxCandidates, allCandidates.length))
  );

  const handleRemoveCandidate = (caregiverId: string) => {
    setSelectedCandidates(prev => prev.filter(c => c.caregiverId !== caregiverId));
  };

  const handleAddCandidate = (candidate: MatchCandidate) => {
    if (selectedCandidates.length < maxCandidates) {
      setSelectedCandidates(prev => [...prev, candidate]);
    }
  };

  const availableCandidates = allCandidates.filter(
    c => !selectedCandidates.find(sc => sc.caregiverId === c.caregiverId)
  );

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  // Find highest/lowest scores for highlighting
  const getValueClass = (value: number, allValues: number[]) => {
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    if (value === max && max !== min) return 'font-bold text-green-700 bg-green-50';
    if (value === min && max !== min) return 'text-red-600';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compare Candidates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comparing {selectedCandidates.length} of {allCandidates.length} candidates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              // Export comparison as PDF/CSV
              console.log('Export comparison');
            }}
          >
            Export
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Add more candidates */}
      {availableCandidates.length > 0 && selectedCandidates.length < maxCandidates && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Add More Candidates</h3>
          <div className="flex gap-2 flex-wrap">
            {availableCandidates.slice(0, 5).map(candidate => (
              <button
                key={candidate.caregiverId}
                onClick={() => handleAddCandidate(candidate)}
                className="px-3 py-1 bg-white border border-blue-300 rounded-md text-sm hover:bg-blue-100 transition-colors"
              >
                {candidate.caregiverName} ({candidate.overallScore})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Metric
                </th>
                {selectedCandidates.map((candidate, index) => (
                  <th
                    key={candidate.caregiverId}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getMedal(index) && <span>{getMedal(index)}</span>}
                        <span>Candidate {index + 1}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveCandidate(candidate.caregiverId)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Name */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Name
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {candidate.caregiverName}
                  </td>
                ))}
              </tr>

              {/* Overall Score */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Overall Score
                </td>
                {selectedCandidates.map(candidate => {
                  const scoreColor = getMatchScoreColor(candidate.overallScore);
                  return (
                    <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap ${getValueClass(candidate.overallScore, selectedCandidates.map(c => c.overallScore))}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${scoreColor}`}>
                          {candidate.overallScore}
                        </span>
                        <span className="text-sm text-gray-500">/ 100</span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Skills */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Skills Match
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${getValueClass(candidate.scores.skillMatch, selectedCandidates.map(c => c.scores.skillMatch))}`}>
                    {candidate.scores.skillMatch}
                  </td>
                ))}
              </tr>

              {/* Availability */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Availability
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${getValueClass(candidate.scores.availabilityMatch, selectedCandidates.map(c => c.scores.availabilityMatch))}`}>
                    <div className="flex items-center gap-2">
                      {candidate.scores.availabilityMatch}
                      {candidate.hasConflict && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Distance */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Location (Distance)
                </td>
                {selectedCandidates.map(candidate => {
                  const distances = selectedCandidates
                    .filter(c => c.distanceFromShift !== undefined)
                    .map(c => c.distanceFromShift!);
                  return (
                    <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${candidate.distanceFromShift !== undefined ? getValueClass(-candidate.distanceFromShift, distances.map(d => -d)) : ''}`}>
                      {candidate.distanceFromShift !== undefined
                        ? formatDistance(candidate.distanceFromShift)
                        : 'N/A'}
                    </td>
                  );
                })}
              </tr>

              {/* Proximity Score */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Proximity Score
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${getValueClass(candidate.scores.proximityMatch, selectedCandidates.map(c => c.scores.proximityMatch))}`}>
                    {candidate.scores.proximityMatch}
                  </td>
                ))}
              </tr>

              {/* Experience */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Experience
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${getValueClass(candidate.scores.experienceMatch, selectedCandidates.map(c => c.scores.experienceMatch))}`}>
                    {candidate.scores.experienceMatch}
                  </td>
                ))}
              </tr>

              {/* Previous Visits */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Previous Visits
                </td>
                {selectedCandidates.map(candidate => {
                  const visits = selectedCandidates
                    .filter(c => c.previousVisitsWithClient !== undefined)
                    .map(c => c.previousVisitsWithClient!);
                  return (
                    <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${candidate.previousVisitsWithClient !== undefined ? getValueClass(candidate.previousVisitsWithClient, visits) : ''}`}>
                      {candidate.previousVisitsWithClient ?? 0}
                    </td>
                  );
                })}
              </tr>

              {/* Client Rating */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Client Rating
                </td>
                {selectedCandidates.map(candidate => {
                  const ratings = selectedCandidates
                    .filter(c => c.clientRating !== undefined)
                    .map(c => c.clientRating!);
                  return (
                    <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${candidate.clientRating !== undefined ? getValueClass(candidate.clientRating, ratings) : ''}`}>
                      {candidate.clientRating !== undefined
                        ? `${candidate.clientRating.toFixed(1)} ⭐`
                        : 'N/A'}
                    </td>
                  );
                })}
              </tr>

              {/* Reliability */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Reliability
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${getValueClass(candidate.scores.reliabilityMatch, selectedCandidates.map(c => c.scores.reliabilityMatch))}`}>
                    {candidate.scores.reliabilityMatch}
                  </td>
                ))}
              </tr>

              {/* Compliance */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Compliance
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className={`px-6 py-4 whitespace-nowrap text-sm ${getValueClass(candidate.scores.complianceMatch, selectedCandidates.map(c => c.scores.complianceMatch))}`}>
                    {candidate.scores.complianceMatch}
                  </td>
                ))}
              </tr>

              {/* Employment Type */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Employment
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {candidate.employmentType}
                  </td>
                ))}
              </tr>

              {/* Eligibility */}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Eligible
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className="px-6 py-4 whitespace-nowrap">
                    {candidate.isEligible ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <X className="h-3 w-3 mr-1" />
                        No
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Issues */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  Issues
                </td>
                {selectedCandidates.map(candidate => (
                  <td key={candidate.caregiverId} className="px-6 py-4 text-sm text-gray-600">
                    {candidate.eligibilityIssues.length === 0 ? (
                      <span className="text-gray-400">None</span>
                    ) : (
                      <ul className="text-xs space-y-1">
                        {candidate.eligibilityIssues.slice(0, 2).map((issue, idx) => (
                          <li key={idx} className={issue.severity === 'BLOCKING' ? 'text-red-600' : 'text-yellow-600'}>
                            • {issue.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                ))}
              </tr>

              {/* Action Row */}
              {onSelect && (
                <tr className="bg-gray-100">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    Select Candidate
                  </td>
                  {selectedCandidates.map(candidate => (
                    <td key={candidate.caregiverId} className="px-6 py-4">
                      <Button
                        onClick={() => onSelect(candidate.caregiverId)}
                        variant={candidate.isEligible ? 'primary' : 'outline'}
                        disabled={!candidate.isEligible}
                        size="sm"
                        className="w-full"
                      >
                        {candidate.isEligible ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Select
                          </>
                        ) : (
                          'Ineligible'
                        )}
                      </Button>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Legend</h3>
        <div className="flex gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
            <span>Highest value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
            <span>Middle value</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600">Red text</span>
            <span>Lowest value</span>
          </div>
        </div>
      </div>
    </div>
  );
};
