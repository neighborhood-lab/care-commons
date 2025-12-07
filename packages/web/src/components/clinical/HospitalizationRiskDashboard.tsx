/**
 * Hospitalization Risk Dashboard for Clinical Staff
 *
 * CLINICAL AI: Proactive identification of patients at risk of hospitalization.
 * Enables early intervention to prevent hospitalizations and improve outcomes.
 *
 * Key Features:
 * - Real-time risk scoring based on clinical indicators
 * - Evidence-based risk factors with clinical rationale
 * - Actionable intervention recommendations
 * - Priority sorting (CRITICAL → HIGH → MODERATE → LOW)
 * - Trend tracking over time
 *
 * Target Users: Nurses, physicians, care coordinators
 */

import { useState, useEffect } from 'react';

interface ClinicalRiskFactor {
  category: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  score: number;
  clinicalDescription: string;
  evidence: string[];
  detectedAt: string;
  requiresUrgentReview: boolean;
}

interface InterventionRecommendation {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  clinicalAction: string;
  rationale: string;
  expectedOutcome: string;
  responsibleRole: 'NURSE' | 'PHYSICIAN' | 'CAREGIVER' | 'COORDINATOR';
}

interface HospitalizationRiskAssessment {
  clientId: string;
  clientName: string;
  overallRiskScore: number; // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskFactors: ClinicalRiskFactor[];
  interventionRecommendations: InterventionRecommendation[];
  assessedAt: string;
  nextAssessmentDue: string;
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING';
  estimatedHospitalizationProbability: number; // 0-1
}

export function HospitalizationRiskDashboard() {
  const [assessments, setAssessments] = useState<HospitalizationRiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<HospitalizationRiskAssessment | null>(null);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE'>('ALL');

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/clinical/hospitalization-risk');
      // const data = await response.json();
      // setAssessments(data.assessments);

      // DEMO DATA (for now)
      await new Promise(resolve => setTimeout(resolve, 800));
      setAssessments(DEMO_ASSESSMENTS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk assessments');
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
      case 'IMPROVING': return '✅';
      case 'WORSENING': return '⚠️';
      default: return '➡️';
    }
  }

  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  }

  const filteredAssessments = assessments.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.riskLevel === filterLevel;
  });

  const criticalCount = assessments.filter(a => a.riskLevel === 'CRITICAL').length;
  const highCount = assessments.filter(a => a.riskLevel === 'HIGH').length;
  const atRiskCount = criticalCount + highCount;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hospitalization Risk Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Clinical AI for proactive patient monitoring and early intervention
            </p>
          </div>
          <button
            onClick={loadAssessments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{assessments.length}</div>
            <div className="text-sm text-gray-600">Total Patients Monitored</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-sm text-gray-600">Critical Risk</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{highCount}</div>
            <div className="text-sm text-gray-600">High Risk</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {assessments.filter(a => a.trendDirection === 'IMPROVING').length}
            </div>
            <div className="text-sm text-gray-600">Improving Trends</div>
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

      {/* Clinical Evidence Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          📊 Evidence-Based Risk Assessment
        </h3>
        <p className="text-sm text-blue-700">
          Risk scores based on validated clinical predictors: respiratory status, functional decline,
          wound care issues, chronic disease control, polypharmacy, recent hospitalizations, weight loss,
          falls, medication adherence, and social factors. Research shows early intervention reduces
          preventable hospitalizations by 25-40%.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading risk assessments...</span>
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
          <p>No patients match the selected risk filter</p>
        </div>
      )}

      {/* Patient List */}
      {!loading && !error && filteredAssessments.length > 0 && (
        <div className="space-y-4">
          {filteredAssessments.map(assessment => (
            <div
              key={assessment.clientId}
              className={`bg-white rounded-lg shadow border-l-4 transition-all cursor-pointer ${
                selectedClient?.clientId === assessment.clientId
                  ? 'ring-2 ring-blue-500'
                  : ''
              } ${getRiskColor(assessment.riskLevel)}`}
              onClick={() => setSelectedClient(assessment)}
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {assessment.clientName}
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
                      {(assessment.estimatedHospitalizationProbability * 100).toFixed(1)}% probability (30d)
                    </div>
                  </div>
                </div>

                {/* Critical Risk Factors */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Key Clinical Concerns:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assessment.riskFactors
                      .filter(f => f.requiresUrgentReview || f.severity === 'CRITICAL' || f.severity === 'HIGH')
                      .slice(0, 4)
                      .map((factor, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            factor.requiresUrgentReview
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : factor.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {factor.requiresUrgentReview && '🚨 '}
                          {factor.category.replace(/_/g, ' ')}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Urgent Interventions */}
                {assessment.interventionRecommendations.filter(i => i.priority === 'URGENT' || i.priority === 'HIGH').length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Recommended Actions:
                    </div>
                    <ul className="space-y-1">
                      {assessment.interventionRecommendations
                        .filter(i => i.priority === 'URGENT' || i.priority === 'HIGH')
                        .slice(0, 2)
                        .map((intervention, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(intervention.priority)}`}>
                              {intervention.priority}
                            </span>
                            <span className="text-gray-700">{intervention.clinicalAction}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Expand/Collapse Details */}
                {selectedClient?.clientId === assessment.clientId && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {/* All Risk Factors */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Clinical Risk Factors
                      </h4>
                      <div className="space-y-2">
                        {assessment.riskFactors.map((factor, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {factor.category.replace(/_/g, ' ')}
                                {factor.requiresUrgentReview && <span className="ml-2 text-red-600">🚨 URGENT</span>}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskBadgeColor(factor.severity)}`}>
                                {factor.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Finding:</strong> {factor.clinicalDescription}
                            </p>
                            <div className="text-xs text-gray-600">
                              <strong>Clinical Evidence:</strong>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {factor.evidence.map((e, i) => (
                                  <li key={i}>{e}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* All Interventions */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Intervention Plan
                      </h4>
                      <div className="space-y-3">
                        {assessment.interventionRecommendations.map((intervention, idx) => (
                          <div key={idx} className="bg-gray-50 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(intervention.priority)}`}>
                                {intervention.priority}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {intervention.responsibleRole}
                              </span>
                              <span className="font-medium text-gray-900">
                                {intervention.category.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Action:</strong> {intervention.clinicalAction}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Rationale:</strong> {intervention.rationale}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Expected Outcome:</strong> {intervention.expectedOutcome}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assessment Metadata */}
                    <div className="text-xs text-gray-500 flex gap-4">
                      <span>
                        <strong>Assessed:</strong> {new Date(assessment.assessedAt).toLocaleString()}
                      </span>
                      <span>
                        <strong>Next Assessment:</strong> {new Date(assessment.nextAssessmentDue).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                {selectedClient?.clientId !== assessment.clientId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(assessment);
                    }}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Full Clinical Details →
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

// DEMO DATA
const DEMO_ASSESSMENTS: HospitalizationRiskAssessment[] = [
  {
    clientId: 'client-1',
    clientName: 'Margaret Thompson',
    overallRiskScore: 85,
    riskLevel: 'CRITICAL',
    riskFactors: [
      {
        category: 'RESPIRATORY_DISTRESS',
        severity: 'CRITICAL',
        score: 15,
        clinicalDescription: 'Low oxygen saturation: Average 91.2%, Minimum 88%',
        evidence: [
          'Recent O2 sat readings: 92, 89, 88, 91, 93%',
          'Respiratory distress is #1 predictor of hospitalization',
        ],
        detectedAt: new Date().toISOString(),
        requiresUrgentReview: true,
      },
      {
        category: 'RECENT_HOSPITALIZATION',
        severity: 'HIGH',
        score: 10,
        clinicalDescription: 'Recent acute care: 1 hospitalization, 1 ER visit',
        evidence: [
          'Recent hospitalization is strongest predictor of re-hospitalization',
          'High-risk period: 30 days post-discharge',
        ],
        detectedAt: new Date().toISOString(),
        requiresUrgentReview: false,
      },
      {
        category: 'CHRONIC_DISEASE',
        severity: 'HIGH',
        score: 10,
        clinicalDescription: 'Uncontrolled chronic conditions: 2',
        evidence: ['CHF (uncontrolled)', 'COPD (uncontrolled)'],
        detectedAt: new Date().toISOString(),
        requiresUrgentReview: false,
      },
    ],
    interventionRecommendations: [
      {
        priority: 'URGENT',
        category: 'CLINICAL_REVIEW',
        clinicalAction: 'Immediate RN or physician assessment required',
        rationale: '1 critical risk factors detected',
        expectedOutcome: 'Prevent imminent hospitalization through early intervention',
        responsibleRole: 'NURSE',
      },
      {
        priority: 'URGENT',
        category: 'CLINICAL_REVIEW',
        clinicalAction: 'Assess respiratory status, consider oxygen therapy or medication adjustment',
        rationale: 'Low oxygen saturation: Average 91.2%, Minimum 88%',
        expectedOutcome: 'Stabilize respiratory function, prevent pneumonia/COPD exacerbation',
        responsibleRole: 'PHYSICIAN',
      },
    ],
    assessedAt: new Date().toISOString(),
    nextAssessmentDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    trendDirection: 'WORSENING',
    estimatedHospitalizationProbability: 0.42,
  },
  {
    clientId: 'client-2',
    clientName: 'Robert Martinez',
    overallRiskScore: 58,
    riskLevel: 'HIGH',
    riskFactors: [
      {
        category: 'POLYPHARMACY',
        severity: 'MODERATE',
        score: 5,
        clinicalDescription: 'Polypharmacy: 14 medications',
        evidence: [
          'High-risk medications: 2',
          'Polypharmacy increases adverse events and hospitalization',
        ],
        detectedAt: new Date().toISOString(),
        requiresUrgentReview: false,
      },
      {
        category: 'FALLS_RISK',
        severity: 'HIGH',
        score: 8,
        clinicalDescription: 'Recent falls: 2 in last 30 days',
        evidence: [
          'Falls increase fracture risk and hospitalization',
          'Indicates mobility/balance issues',
        ],
        detectedAt: new Date().toISOString(),
        requiresUrgentReview: false,
      },
    ],
    interventionRecommendations: [
      {
        priority: 'HIGH',
        category: 'MEDICATION_REVIEW',
        clinicalAction: 'Comprehensive medication review with physician/pharmacist',
        rationale: 'Polypharmacy: 14 medications',
        expectedOutcome: 'Reduce adverse drug events, simplify regimen',
        responsibleRole: 'PHYSICIAN',
      },
    ],
    assessedAt: new Date().toISOString(),
    nextAssessmentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trendDirection: 'STABLE',
    estimatedHospitalizationProbability: 0.21,
  },
  {
    clientId: 'client-3',
    clientName: 'Dorothy Chen',
    overallRiskScore: 22,
    riskLevel: 'LOW',
    riskFactors: [
      {
        category: 'SOCIAL_ISOLATION',
        severity: 'MODERATE',
        score: 6,
        clinicalDescription: 'Social isolation: Lives alone without caregiver support',
        evidence: [
          'Isolation score: 6/10',
          'Social isolation increases hospitalization risk by 30%',
        ],
        detectedAt: new Date().toISOString(),
        requiresUrgentReview: false,
      },
    ],
    interventionRecommendations: [],
    assessedAt: new Date().toISOString(),
    nextAssessmentDue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    trendDirection: 'IMPROVING',
    estimatedHospitalizationProbability: 0.08,
  },
];
