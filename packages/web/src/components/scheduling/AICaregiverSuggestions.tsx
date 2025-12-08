/**
 * AI-Powered Caregiver Suggestions Component
 *
 * Shows intelligent caregiver recommendations for a visit with:
 * - Transparent scoring breakdown
 * - Human-readable reasoning
 * - Conflict detection
 * - One-click assignment
 *
 * This is the UI manifestation of our competitive differentiator:
 * AI-powered scheduling that actually helps workers!
 */

import { useState, useEffect } from 'react';

interface CaregiverSuggestion {
  caregiverId: string;
  caregiverName: string;
  score: number;
  scoreBreakdown: {
    continuityScore: number;
    geographicScore: number;
    skillMatchScore: number;
    preferenceScore: number;
    availabilityScore: number;
    totalScore: number;
  };
  isAvailable: boolean;
  conflicts: Array<{
    type: string;
    severity: 'BLOCKING' | 'WARNING';
    description: string;
  }>;
  reasoning: string[];
}

interface AICaregiverSuggestionsProps {
  visitId: string;
  clientName: string;
  visitDate: string;
  visitTime: string;
  requiredSkills?: string[];
  onAssign: (caregiverId: string) => void;
  onClose: () => void;
}

export function AICaregiverSuggestions({
  visitId,
  clientName,
  visitDate,
  visitTime,
  requiredSkills = [],
  onAssign,
  onClose,
}: AICaregiverSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<CaregiverSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CaregiverSuggestion | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [visitId]);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);

    try {
      // Phase 2: Replace with actual API call
      // const response = await fetch(`/api/scheduling/suggest-caregivers`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ visitId }),
      // });
      // const data = await response.json();
      // setSuggestions(data.suggestions);

      // DEMO DATA (for now)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      setSuggestions(DEMO_SUGGESTIONS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-700 bg-green-50';
    if (score >= 60) return 'text-yellow-700 bg-yellow-50';
    return 'text-orange-700 bg-orange-50';
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">🤖 AI Caregiver Suggestions</h2>
              <p className="text-blue-100 text-sm mt-1">
                For {clientName} • {visitDate} at {visitTime}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-full p-2 transition-colors"
            >
              ✕
            </button>
          </div>
          {requiredSkills.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="text-blue-100 text-sm">Required:</span>
              {requiredSkills.map(skill => (
                <span
                  key={skill}
                  className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600">Analyzing caregivers...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <p>No caregivers available for this time slot</p>
            </div>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <div className="space-y-4">
              {/* Explanation Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 How AI Suggestions Work
                </h3>
                <p className="text-sm text-blue-700">
                  We analyze continuity of care, geographic proximity, skill matching,
                  patient preferences, and availability to recommend the best caregiver.
                  <strong className="ml-1">You always have the final say!</strong>
                </p>
              </div>

              {/* Suggestions List */}
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.caregiverId}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedSuggestion?.caregiverId === suggestion.caregiverId
                      ? 'ring-2 ring-blue-500 border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  {/* Rank Badge */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        #{index + 1}
                      </div>
                    </div>

                    <div className="flex-1">
                      {/* Caregiver Name & Score */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {suggestion.caregiverName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(
                              suggestion.score
                            )}`}
                          >
                            {getScoreLabel(suggestion.score)} • {suggestion.score}/100
                          </span>
                        </div>
                      </div>

                      {/* Availability Status */}
                      {!suggestion.isAvailable && (
                        <div className="bg-orange-50 border border-orange-200 rounded px-3 py-2 mb-3">
                          <span className="text-orange-700 font-semibold">
                            ⚠️ Has scheduling conflicts
                          </span>
                          {suggestion.conflicts.map((conflict, idx) => (
                            <p key={idx} className="text-sm text-orange-600 mt-1">
                              • {conflict.description}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Reasoning */}
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">
                          Why this suggestion:
                        </h4>
                        <ul className="space-y-1">
                          {suggestion.reasoning.map((reason, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Score Breakdown */}
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                          📊 View Score Breakdown
                        </summary>
                        <div className="mt-2 grid grid-cols-2 gap-2 bg-gray-50 rounded p-3">
                          <ScoreBar
                            label="Continuity"
                            score={suggestion.scoreBreakdown.continuityScore}
                            max={30}
                          />
                          <ScoreBar
                            label="Geography"
                            score={suggestion.scoreBreakdown.geographicScore}
                            max={25}
                          />
                          <ScoreBar
                            label="Skills"
                            score={suggestion.scoreBreakdown.skillMatchScore}
                            max={20}
                          />
                          <ScoreBar
                            label="Preferences"
                            score={suggestion.scoreBreakdown.preferenceScore}
                            max={15}
                          />
                          <ScoreBar
                            label="Availability"
                            score={suggestion.scoreBreakdown.availabilityScore}
                            max={10}
                            className="col-span-2"
                          />
                        </div>
                      </details>

                      {/* Assign Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (suggestion.isAvailable) {
                            onAssign(suggestion.caregiverId);
                          } else {
                            alert('This caregiver has conflicts. Please resolve them first or choose another caregiver.');
                          }
                        }}
                        className={`mt-3 w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                          suggestion.isAvailable
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!suggestion.isAvailable}
                      >
                        {suggestion.isAvailable ? '✓ Assign to Visit' : '⚠️ Resolve Conflicts First'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              AI suggestions are recommendations only. You make the final decision.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  max,
  className = '',
}: {
  label: string;
  score: number;
  max: number;
  className?: string;
}) {
  const percentage = (score / max) * 100;
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-xs text-gray-500">
          {score}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// DEMO DATA (replace with actual API call)
const DEMO_SUGGESTIONS: CaregiverSuggestion[] = [
  {
    caregiverId: 'cg-1',
    caregiverName: 'Maria Garcia',
    score: 92,
    scoreBreakdown: {
      continuityScore: 28,
      geographicScore: 24,
      skillMatchScore: 20,
      preferenceScore: 10,
      availabilityScore: 10,
      totalScore: 92,
    },
    isAvailable: true,
    conflicts: [],
    reasoning: [
      'Maria has worked with this client 15 times in the last 30 days - excellent continuity',
      'Very close to client location - only 3 miles away',
      'Perfect match for all required skills and certifications',
      '✅ Available - no conflicts',
    ],
  },
  {
    caregiverId: 'cg-2',
    caregiverName: 'James Wilson',
    score: 75,
    scoreBreakdown: {
      continuityScore: 12,
      geographicScore: 20,
      skillMatchScore: 18,
      preferenceScore: 15,
      availabilityScore: 10,
      totalScore: 75,
    },
    isAvailable: true,
    conflicts: [],
    reasoning: [
      'James has some history with this client (5 visits total)',
      'Close to client location - 6 miles away',
      'Good match for required qualifications',
      '✅ Available - no conflicts',
    ],
  },
  {
    caregiverId: 'cg-3',
    caregiverName: 'Sarah Chen',
    score: 68,
    scoreBreakdown: {
      continuityScore: 0,
      geographicScore: 25,
      skillMatchScore: 20,
      preferenceScore: 13,
      availabilityScore: 10,
      totalScore: 68,
    },
    isAvailable: true,
    conflicts: [],
    reasoning: [
      "Sarah hasn't worked with this client before (opportunity to build relationship)",
      'Very close to client location - only 2 miles away',
      'Perfect match for all required skills and certifications',
      '✅ Available - no conflicts',
    ],
  },
  {
    caregiverId: 'cg-4',
    caregiverName: 'David Brown',
    score: 55,
    scoreBreakdown: {
      continuityScore: 8,
      geographicScore: 15,
      skillMatchScore: 18,
      preferenceScore: 14,
      availabilityScore: 0,
      totalScore: 55,
    },
    isAvailable: false,
    conflicts: [
      {
        type: 'EXISTING_VISIT',
        severity: 'BLOCKING',
        description: 'Conflicts with existing visit at 13:00-15:00',
      },
    ],
    reasoning: [
      'David has worked with this client a few times',
      'Reasonable distance from client (12 miles)',
      'Good match for required qualifications',
      '⚠️ Has scheduling conflicts - may need adjustment',
    ],
  },
];
