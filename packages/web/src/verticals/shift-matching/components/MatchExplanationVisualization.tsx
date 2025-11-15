/**
 * Match Explanation Visualization
 *
 * Displays detailed, data-driven explanations for why a caregiver is matched
 * to a specific shift. Shows coordinators the specific factors that influenced
 * the match score with concrete examples.
 *
 * Features:
 * - Visual category breakdown with icons
 * - Specific requirement → caregiver attribute mappings
 * - Color-coded match quality indicators
 * - Expandable sections for detailed view
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Award,
  MapPin,
  Calendar,
  Heart,
  TrendingUp,
  Shield,
  Info,
} from 'lucide-react';

export interface MatchDetail {
  requirement: string;
  caregiverAttribute: string;
  match: 'PERFECT' | 'GOOD' | 'PARTIAL' | 'MISSING' | 'NEUTRAL';
  explanation: string;
  icon?: string;
}

export interface EnhancedMatchExplanation {
  category: string;
  title: string;
  details: MatchDetail[];
  overallImpact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
}

interface MatchExplanationVisualizationProps {
  explanations: EnhancedMatchExplanation[];
  overallScore: number;
  caregiverName: string;
  compact?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  skills: <Award className="h-5 w-5" />,
  proximity: <MapPin className="h-5 w-5" />,
  availability: <Calendar className="h-5 w-5" />,
  preferences: <Heart className="h-5 w-5" />,
  experience: <TrendingUp className="h-5 w-5" />,
  reliability: <Shield className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  skills: 'blue',
  proximity: 'purple',
  availability: 'green',
  preferences: 'pink',
  experience: 'orange',
  reliability: 'indigo',
};

export const MatchExplanationVisualization: React.FC<
  MatchExplanationVisualizationProps
> = ({ explanations, overallScore, caregiverName, compact = false }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(compact ? [] : explanations.map(e => e.category))
  );

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getOverallQuality = (score: number): { label: string; color: string } => {
    if (score >= 85) return { label: 'Excellent Match', color: 'text-green-600' };
    if (score >= 70) return { label: 'Good Match', color: 'text-blue-600' };
    if (score >= 50) return { label: 'Fair Match', color: 'text-yellow-600' };
    return { label: 'Poor Match', color: 'text-red-600' };
  };

  const quality = getOverallQuality(overallScore);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Why {caregiverName}?
              </h3>
              <p className="text-sm text-gray-600">
                Match score breakdown and detailed explanations
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${quality.color}`}>
              {overallScore}
            </div>
            <div className="text-sm text-gray-500">{quality.label}</div>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <div className="divide-y divide-gray-200">
        {explanations.map(explanation => {
          const isExpanded = expandedCategories.has(explanation.category);
          const categoryColor = categoryColors[explanation.category] || 'gray';
          const impactBadgeColor =
            explanation.overallImpact === 'POSITIVE'
              ? 'bg-green-100 text-green-800'
              : explanation.overallImpact === 'NEGATIVE'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800';

          return (
            <div key={explanation.category} className="px-6 py-4">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(explanation.category)}
                className="w-full flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`text-${categoryColor}-600`}>
                    {categoryIcons[explanation.category]}
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">
                      {explanation.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {explanation.details.length} factor{explanation.details.length !== 1 ? 's' : ''} evaluated
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${impactBadgeColor}`}>
                    {explanation.overallImpact}
                  </span>
                  <div className={`text-2xl font-bold text-${categoryColor}-600`}>
                    {explanation.score}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Details */}
              {isExpanded && (
                <div className="mt-4 space-y-3 ml-8">
                  {explanation.details.map((detail, idx) => (
                    <MatchDetailCard key={idx} detail={detail} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Recommendation
            </h4>
            <p className="text-sm text-gray-700">
              {overallScore >= 85 && (
                <>
                  <span className="font-semibold text-green-700">Highly recommended.</span> This
                  caregiver is an excellent match for this shift with strong alignment across
                  multiple factors.
                </>
              )}
              {overallScore >= 70 && overallScore < 85 && (
                <>
                  <span className="font-semibold text-blue-700">Good candidate.</span> This
                  caregiver meets the key requirements and should be considered for assignment.
                </>
              )}
              {overallScore >= 50 && overallScore < 70 && (
                <>
                  <span className="font-semibold text-yellow-700">Acceptable option.</span> This
                  caregiver meets basic requirements but may have some limitations. Review details
                  before assignment.
                </>
              )}
              {overallScore < 50 && (
                <>
                  <span className="font-semibold text-red-700">Not recommended.</span> This
                  caregiver has significant gaps or conflicts. Consider alternative candidates.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MatchDetailCardProps {
  detail: MatchDetail;
}

const MatchDetailCard: React.FC<MatchDetailCardProps> = ({ detail }) => {
  const getMatchIcon = (match: MatchDetail['match']) => {
    switch (match) {
      case 'PERFECT':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'GOOD':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'PARTIAL':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'MISSING':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getBorderColor = (match: MatchDetail['match']) => {
    switch (match) {
      case 'PERFECT':
        return 'border-green-200 bg-green-50';
      case 'GOOD':
        return 'border-blue-200 bg-blue-50';
      case 'PARTIAL':
        return 'border-yellow-200 bg-yellow-50';
      case 'MISSING':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getBorderColor(detail.match)}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {detail.icon ? (
            <span className="text-xl">{detail.icon}</span>
          ) : (
            getMatchIcon(detail.match)
          )}
        </div>
        <div className="flex-1 min-w-0">
          {/* Requirement → Attribute */}
          <div className="space-y-2 mb-2">
            <div className="flex items-start gap-2 text-sm">
              <span className="font-medium text-gray-700 whitespace-nowrap">Need:</span>
              <span className="text-gray-900">{detail.requirement}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">→</span>
              <span className="text-sm font-semibold text-gray-900">
                {detail.caregiverAttribute}
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div className="text-xs text-gray-600 mt-2 p-2 bg-white bg-opacity-60 rounded border border-gray-200">
            {detail.explanation}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact version for quick view in lists
 */
export const MatchExplanationCompact: React.FC<{
  explanations: EnhancedMatchExplanation[];
}> = ({ explanations }) => {
  // Show only top positive details
  const topDetails: Array<{ category: string; detail: MatchDetail }> = [];

  for (const explanation of explanations) {
    if (explanation.overallImpact === 'POSITIVE') {
      for (const detail of explanation.details
        .filter(d => d.match === 'PERFECT' || d.match === 'GOOD')
        .slice(0, 2)) {
          topDetails.push({ category: explanation.category, detail });
        }
    }
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        Why this match?
      </h4>
      <div className="space-y-1.5">
        {topDetails.slice(0, 5).map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="text-lg flex-shrink-0">{item.detail.icon || '✓'}</span>
            <span className="text-gray-700">{item.detail.caregiverAttribute}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
