/**
 * Burnout Risk Dashboard for Coordinators
 *
 * AI-powered caregiver burnout prevention dashboard that shows:
 * - At-risk caregivers with transparent risk scoring
 * - Actionable intervention suggestions
 * - Trend tracking over time
 * - Privacy-first design (aggregate patterns, not surveillance)
 *
 * This is a key competitive differentiator: AI that PROTECTS workers!
 */

import { useState, useEffect } from 'react';

interface RiskFactor {
  factor: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  score: number; // 0-10
  description: string;
  recommendation: string;
}

interface InterventionSuggestion {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  action: string;
  estimatedImpact: string;
  implementationSteps: string[];
}

interface BurnoutRiskAssessment {
  caregiverId: string;
  caregiverName: string;
  overallRiskScore: number; // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactor[];
  interventionSuggestions: InterventionSuggestion[];
  assessedAt: string;
  nextAssessmentDue: string;
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING';
}

export function BurnoutDashboard() {
  const [assessments, setAssessments] = useState<BurnoutRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState<BurnoutRiskAssessment | null>(null);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'MODERATE' | 'HIGH' | 'CRITICAL'>('ALL');

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/caregivers/burnout-assessments');
      // const data = await response.json();
      // setAssessments(data.assessments);

      // DEMO DATA (for now)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAssessments(DEMO_ASSESSMENTS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }

  function getRiskColor(level: string): string {
    switch (level) {
      case 'LOW': return 'text-green-700 bg-green-50 border-green-200';
      case 'MODERATE': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'HIGH': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'CRITICAL': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  }

  function getRiskBadgeColor(level: string): string {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getTrendIcon(trend: string): string {
    switch (trend) {
      case 'IMPROVING': return '📈';
      case 'WORSENING': return '📉';
      default: return '➡️';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  const filteredAssessments = assessments.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.riskLevel === filterLevel;
  });

  const atRiskCount = assessments.filter(a =>
    a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Caregiver Burnout Prevention</h1>
            <p className="text-gray-600 mt-2">
              AI-powered early warning system to protect your caregivers
            </p>
          </div>
          <button
            onClick={loadAssessments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{assessments.length}</div>
            <div className="text-sm text-gray-600">Total Caregivers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{atRiskCount}</div>
            <div className="text-sm text-gray-600">At Risk (High/Critical)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {assessments.filter(a => a.trendDirection === 'IMPROVING').length}
            </div>
            <div className="text-sm text-gray-600">Improving</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">
              {assessments.filter(a => a.trendDirection === 'WORSENING').length}
            </div>
            <div className="text-sm text-gray-600">Worsening</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-6">
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {level}
              {level !== 'ALL' && (
                <span className="ml-2 text-sm">
                  ({assessments.filter(a => a.riskLevel === level).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          How Burnout Prediction Works
        </h3>
        <p className="text-sm text-blue-700">
          We analyze work patterns (hours, schedule density, time off, travel burden) to identify
          caregivers at risk of burnout. <strong>This is NOT surveillance</strong> - it's early warning
          to help you protect your team. Caregivers can see their own scores and self-assess.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Analyzing caregiver work patterns...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAssessments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🎉</div>
          <p>No caregivers match the selected filter</p>
        </div>
      )}

      {/* Caregiver List */}
      {!loading && !error && filteredAssessments.length > 0 && (
        <div className="space-y-4">
          {filteredAssessments.map(assessment => (
            <div
              key={assessment.caregiverId}
              className={`bg-white rounded-lg shadow border-l-4 transition-all cursor-pointer ${
                selectedCaregiver?.caregiverId === assessment.caregiverId
                  ? 'ring-2 ring-blue-500'
                  : ''
              } ${getRiskColor(assessment.riskLevel)}`}
              onClick={() => setSelectedCaregiver(assessment)}
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assessment.caregiverName}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeColor(assessment.riskLevel)}`}>
                      {assessment.riskLevel} RISK
                    </span>
                    <span className="text-sm text-gray-600">
                      {getTrendIcon(assessment.trendDirection)} {assessment.trendDirection}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {assessment.overallRiskScore}/100
                    </div>
                    <div className="text-xs text-gray-500">
                      Risk Score
                    </div>
                  </div>
                </div>

                {/* Risk Factors Summary */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Top Risk Factors:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assessment.riskFactors
                      .filter(f => f.severity === 'HIGH' || f.severity === 'CRITICAL')
                      .slice(0, 3)
                      .map((factor, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            factor.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {factor.factor}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Intervention Suggestions */}
                {assessment.interventionSuggestions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Recommended Actions:
                    </div>
                    <ul className="space-y-1">
                      {assessment.interventionSuggestions
                        .slice(0, 2)
                        .map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold mr-2 ${getPriorityColor(suggestion.priority)}`}>
                              {suggestion.priority}
                            </span>
                            <span>{suggestion.action}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Expand/Collapse Details */}
                {selectedCaregiver?.caregiverId === assessment.caregiverId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {/* All Risk Factors */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        All Risk Factors
                      </h4>
                      <div className="space-y-2">
                        {assessment.riskFactors.map((factor, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {factor.factor}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskBadgeColor(factor.severity)}`}>
                                {factor.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {factor.description}
                            </p>
                            <p className="text-sm text-blue-600">
                              <strong>Recommendation:</strong> {factor.recommendation}
                            </p>
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    factor.severity === 'CRITICAL' ? 'bg-red-600' :
                                    factor.severity === 'HIGH' ? 'bg-orange-600' :
                                    factor.severity === 'MODERATE' ? 'bg-yellow-600' :
                                    'bg-green-600'
                                  }`}
                                  style={{ width: `${(factor.score / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All Intervention Suggestions */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Intervention Plan
                      </h4>
                      <div className="space-y-3">
                        {assessment.interventionSuggestions.map((suggestion, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(suggestion.priority)}`}>
                                {suggestion.priority}
                              </span>
                              <span className="font-medium text-gray-900">
                                {suggestion.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Action:</strong> {suggestion.action}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Estimated Impact:</strong> {suggestion.estimatedImpact}
                            </p>
                            <div className="text-sm text-gray-600">
                              <strong>Implementation Steps:</strong>
                              <ol className="list-decimal list-inside ml-2 mt-1">
                                {suggestion.implementationSteps.map((step, stepIdx) => (
                                  <li key={stepIdx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assessment Metadata */}
                    <div className="text-xs text-gray-500 flex gap-4">
                      <span>
                        <strong>Assessed:</strong> {new Date(assessment.assessedAt).toLocaleDateString()}
                      </span>
                      <span>
                        <strong>Next Assessment:</strong> {new Date(assessment.nextAssessmentDue).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                {selectedCaregiver?.caregiverId !== assessment.caregiverId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCaregiver(assessment);
                    }}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Full Details →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// DEMO DATA (replace with actual API call)
const DEMO_ASSESSMENTS: BurnoutRiskAssessment[] = [
  {
    caregiverId: 'cg-1',
    caregiverName: 'Maria Garcia',
    overallRiskScore: 78,
    riskLevel: 'HIGH',
    riskFactors: [
      {
        factor: 'Excessive Hours',
        severity: 'CRITICAL',
        score: 9.2,
        description: 'Averaging 52 hours/week over last 30 days (target: 35-40)',
        recommendation: 'Reduce weekly hours to 40 or below. Schedule mandatory time off.',
      },
      {
        factor: 'No Time Off',
        severity: 'HIGH',
        score: 8.5,
        description: '18 consecutive days without a day off',
        recommendation: 'Schedule at least 2 consecutive days off within next week.',
      },
      {
        factor: 'Schedule Density',
        severity: 'MODERATE',
        score: 6.0,
        description: 'Average 9.2 hours/shift with insufficient breaks',
        recommendation: 'Limit shifts to 8 hours max. Add 30-min break for 8+ hour shifts.',
      },
    ],
    interventionSuggestions: [
      {
        priority: 'URGENT',
        category: 'Schedule Adjustment',
        action: 'Schedule 3 consecutive days off within next 7 days',
        estimatedImpact: 'Reduce risk score by 15-20 points',
        implementationSteps: [
          'Review upcoming schedule for coverage gaps',
          'Identify alternate caregivers for Maria\'s shifts',
          'Communicate schedule change to Maria and affected clients',
          'Block Maria\'s calendar for rest period',
        ],
      },
      {
        priority: 'HIGH',
        category: 'Workload Reduction',
        action: 'Reduce weekly hours from 52 to 40 for next 4 weeks',
        estimatedImpact: 'Reduce risk score by 10-15 points',
        implementationSteps: [
          'Identify 12 hours of shifts to redistribute',
          'Contact other caregivers for coverage',
          'Update Maria\'s availability in scheduling system',
          'Monitor weekly hours to ensure compliance',
        ],
      },
    ],
    assessedAt: new Date().toISOString(),
    nextAssessmentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trendDirection: 'WORSENING',
  },
  {
    caregiverId: 'cg-2',
    caregiverName: 'James Wilson',
    overallRiskScore: 62,
    riskLevel: 'MODERATE',
    riskFactors: [
      {
        factor: 'Geographic Overload',
        severity: 'HIGH',
        score: 7.5,
        description: 'Averaging 45 miles/day of travel between clients',
        recommendation: 'Cluster clients geographically. Reduce travel to <30 miles/day.',
      },
      {
        factor: 'Weekend Overload',
        severity: 'MODERATE',
        score: 5.0,
        description: 'Working 75% of weekends (target: <50%)',
        recommendation: 'Limit weekend shifts to 2 per month. Rotate weekend coverage.',
      },
    ],
    interventionSuggestions: [
      {
        priority: 'MEDIUM',
        category: 'Route Optimization',
        action: 'Reassign clients to reduce daily travel to <30 miles',
        estimatedImpact: 'Reduce risk score by 8-12 points',
        implementationSteps: [
          'Map James\'s current client locations',
          'Identify caregivers with complementary geographic coverage',
          'Propose client swaps to minimize travel',
          'Implement changes gradually over 2 weeks',
        ],
      },
    ],
    assessedAt: new Date().toISOString(),
    nextAssessmentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trendDirection: 'STABLE',
  },
  {
    caregiverId: 'cg-3',
    caregiverName: 'Sarah Chen',
    overallRiskScore: 28,
    riskLevel: 'LOW',
    riskFactors: [
      {
        factor: 'Schedule Variety',
        severity: 'LOW',
        score: 2.0,
        description: 'Good variety in shift types and client assignments',
        recommendation: 'Continue current scheduling pattern.',
      },
    ],
    interventionSuggestions: [
      {
        priority: 'LOW',
        category: 'Preventative',
        action: 'Maintain current work-life balance patterns',
        estimatedImpact: 'Keep risk score below 40',
        implementationSteps: [
          'Monitor weekly hours (keep at 35-38)',
          'Ensure at least 2 days off per week',
          'Continue geographic clustering',
        ],
      },
    ],
    assessedAt: new Date().toISOString(),
    nextAssessmentDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    trendDirection: 'STABLE',
  },
  {
    caregiverId: 'cg-4',
    caregiverName: 'David Brown',
    overallRiskScore: 85,
    riskLevel: 'CRITICAL',
    riskFactors: [
      {
        factor: 'Excessive Hours',
        severity: 'CRITICAL',
        score: 10.0,
        description: 'Averaging 58 hours/week - well above safe limits',
        recommendation: 'IMMEDIATE reduction to 40 hours/week required.',
      },
      {
        factor: 'No Time Off',
        severity: 'CRITICAL',
        score: 9.8,
        description: '24 consecutive days without a day off',
        recommendation: 'URGENT: Schedule 3-5 days off starting within 48 hours.',
      },
      {
        factor: 'Night Shift Burden',
        severity: 'HIGH',
        score: 8.0,
        description: '60% of shifts are overnight (disrupts sleep patterns)',
        recommendation: 'Reduce night shifts to <40% of schedule. Add recovery time after night shifts.',
      },
      {
        factor: 'Cancellation Pattern',
        severity: 'MODERATE',
        score: 6.0,
        description: '3 last-minute cancellations in past 14 days (possible avoidance behavior)',
        recommendation: 'Check in with caregiver. May indicate burnout or personal issues.',
      },
    ],
    interventionSuggestions: [
      {
        priority: 'URGENT',
        category: 'Emergency Intervention',
        action: 'Immediate schedule relief - 5 days off starting within 48 hours',
        estimatedImpact: 'Prevent imminent burnout. Reduce risk score by 20-25 points.',
        implementationSteps: [
          'URGENT: Contact David immediately to discuss well-being',
          'Emergency coverage planning for next 5 days',
          'Arrange for temporary replacement caregivers',
          'Consider referral to employee assistance program',
        ],
      },
      {
        priority: 'URGENT',
        category: 'Workload Reduction',
        action: 'Reduce weekly hours from 58 to 35 for next 6 weeks (recovery period)',
        estimatedImpact: 'Allow recovery from chronic overwork. Reduce risk score by 15-20 points.',
        implementationSteps: [
          'Redistribute 23 hours/week to other caregivers',
          'Prioritize David for only his preferred/established clients',
          'Weekly check-ins to monitor recovery',
          'Gradually increase to 40 hours after 6 weeks if recovery progresses',
        ],
      },
    ],
    assessedAt: new Date().toISOString(),
    nextAssessmentDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    trendDirection: 'WORSENING',
  },
];
