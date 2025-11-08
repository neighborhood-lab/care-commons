import React, { useState } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/core/components';
import type { MatchCandidate } from '../types';
import { ScoreBadge } from './ScoreBadge';

interface MatchComparisonViewProps {
  candidates: MatchCandidate[];
  maxCompare?: number;
  onSelect?: (caregiverId: string) => void;
  onClose?: () => void;
}

export const MatchComparisonView: React.FC<MatchComparisonViewProps> = ({
  candidates,
  maxCompare = 4,
  onSelect,
  onClose,
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>(
    candidates.slice(0, Math.min(maxCompare, candidates.length)).map((c) => c.caregiverId)
  );

  const handleToggleCandidate = (caregiverId: string) => {
    if (selectedCandidates.includes(caregiverId)) {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== caregiverId));
    } else if (selectedCandidates.length < maxCompare) {
      setSelectedCandidates([...selectedCandidates, caregiverId]);
    }
  };

  const comparisonCandidates = candidates.filter((c) =>
    selectedCandidates.includes(c.caregiverId)
  );

  const getMedal = (index: number): string => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return '';
    }
  };

  const handleExportPDF = () => {
    // Placeholder for PDF export functionality
    console.log('Export to PDF functionality would be implemented here');
    alert('PDF export would be implemented with a library like jsPDF or react-pdf');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compare Candidates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comparing {comparisonCandidates.length} of {candidates.length} candidates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export PDF
          </Button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Close comparison"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Candidate Selection */}
      {candidates.length > maxCompare && (
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Select up to {maxCompare} candidates to compare:
          </h3>
          <div className="flex flex-wrap gap-2">
            {candidates.map((candidate) => {
              const isSelected = selectedCandidates.includes(candidate.caregiverId);
              const isDisabled = !isSelected && selectedCandidates.length >= maxCompare;

              return (
                <button
                  key={candidate.caregiverId}
                  onClick={() => handleToggleCandidate(candidate.caregiverId)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-500'
                  }`}
                >
                  {candidate.caregiverName} ({candidate.overallScore})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide sticky left-0 bg-gray-50 z-10">
                Criteria
              </th>
              {comparisonCandidates.map((candidate, index) => (
                <th
                  key={candidate.caregiverId}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[200px]"
                >
                  <div className="flex flex-col items-center gap-1">
                    {getMedal(index) && (
                      <span className="text-lg">{getMedal(index)}</span>
                    )}
                    <span>{candidate.caregiverName}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Overall Score */}
            <ComparisonRow
              label="Overall Score"
              values={comparisonCandidates.map((c) => (
                <ScoreBadge key={c.caregiverId} score={c.overallScore} quality={c.matchQuality} />
              ))}
              highlight="max"
              compareValues={comparisonCandidates.map((c) => c.overallScore)}
            />

            {/* Skill Match */}
            <ComparisonRow
              label="Skills"
              values={comparisonCandidates.map((c) => c.scores.skillMatch)}
              highlight="max"
              compareValues={comparisonCandidates.map((c) => c.scores.skillMatch)}
            />

            {/* Availability */}
            <ComparisonRow
              label="Availability"
              values={comparisonCandidates.map((c) => c.scores.availabilityMatch)}
              highlight="max"
              compareValues={comparisonCandidates.map((c) => c.scores.availabilityMatch)}
            />

            {/* Proximity */}
            <ComparisonRow
              label="Location"
              values={comparisonCandidates.map((c) =>
                c.distanceFromShift !== undefined
                  ? `${c.scores.proximityMatch} (${c.distanceFromShift.toFixed(1)} mi)`
                  : c.scores.proximityMatch
              )}
              highlight="max"
              compareValues={comparisonCandidates.map((c) => c.scores.proximityMatch)}
            />

            {/* Experience */}
            <ComparisonRow
              label="Experience"
              values={comparisonCandidates.map((c) => c.scores.experienceMatch || 0)}
              highlight="max"
              compareValues={comparisonCandidates.map((c) => c.scores.experienceMatch || 0)}
            />

            {/* Reliability */}
            <ComparisonRow
              label="Reliability"
              values={comparisonCandidates.map((c) => c.scores.reliabilityMatch || 0)}
              highlight="max"
              compareValues={comparisonCandidates.map((c) => c.scores.reliabilityMatch || 0)}
            />

            {/* Previous Visits */}
            <ComparisonRow
              label="Previous Visits"
              values={comparisonCandidates.map((c) =>
                c.previousVisitsWithClient !== undefined && c.previousVisitsWithClient > 0
                  ? `${c.previousVisitsWithClient} visit${c.previousVisitsWithClient !== 1 ? 's' : ''}`
                  : 'None'
              )}
              highlight="custom"
              compareValues={comparisonCandidates.map((c) => c.previousVisitsWithClient || 0)}
            />

            {/* Client Rating */}
            <ComparisonRow
              label="Client Rating"
              values={comparisonCandidates.map((c) =>
                c.clientRating !== undefined ? `${c.clientRating.toFixed(1)} ⭐` : 'N/A'
              )}
              highlight="custom"
              compareValues={comparisonCandidates.map((c) => c.clientRating || 0)}
            />

            {/* Conflicts */}
            <ComparisonRow
              label="Schedule Conflict"
              values={comparisonCandidates.map((c) => (
                c.hasConflict ? (
                  <span className="text-red-600 font-medium">Yes</span>
                ) : (
                  <span className="text-green-600 font-medium">✓ Clear</span>
                )
              ))}
            />

            {/* Eligibility */}
            <ComparisonRow
              label="Eligible"
              values={comparisonCandidates.map((c) =>
                c.isEligible ? (
                  <span className="text-green-600 font-medium">✓ Yes</span>
                ) : (
                  <span className="text-red-600 font-medium">
                    {c.eligibilityIssues.filter((i) => i.severity === 'BLOCKING').length} issues
                  </span>
                )
              )}
            />
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      {onSelect && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-end gap-2">
            {comparisonCandidates.map((candidate) => (
              <Button
                key={candidate.caregiverId}
                onClick={() => onSelect(candidate.caregiverId)}
                variant="primary"
                size="sm"
                disabled={!candidate.isEligible}
                leftIcon={<CheckCircle className="h-4 w-4" />}
              >
                Select {candidate.caregiverName.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ComparisonRowProps {
  label: string;
  values: (React.ReactNode | number | string)[];
  highlight?: 'max' | 'min' | 'custom';
  compareValues?: number[];
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({
  label,
  values,
  highlight,
  compareValues,
}) => {
  const getHighlightedIndex = (): number | null => {
    if (!highlight || !compareValues || compareValues.length === 0) return null;

    if (highlight === 'max') {
      const max = Math.max(...compareValues);
      return compareValues.indexOf(max);
    }

    if (highlight === 'min') {
      const min = Math.min(...compareValues);
      return compareValues.indexOf(min);
    }

    return null;
  };

  const highlightedIndex = getHighlightedIndex();

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white">
        {label}
      </td>
      {values.map((value, index) => {
        const isHighlighted = highlightedIndex === index;
        const isMaxValue = compareValues && compareValues[index] === Math.max(...compareValues);

        return (
          <td
            key={index}
            className={`px-4 py-3 text-sm text-center transition ${
              isHighlighted || isMaxValue
                ? 'bg-green-50 font-semibold text-gray-900'
                : 'text-gray-700'
            }`}
          >
            {typeof value === 'number' ? value : value}
          </td>
        );
      })}
    </tr>
  );
};
