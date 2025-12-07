/**
 * Caregiver Burnout Self-Assessment
 *
 * Privacy-first self-service tool for caregivers to:
 * - View their own burnout risk score
 * - Understand contributing factors
 * - Access self-care resources
 * - Request schedule adjustments
 *
 * Key principle: TRANSPARENCY. Caregivers should see the same data
 * coordinators see about them. No hidden surveillance.
 */

import { useState, useEffect } from 'react';

interface RiskFactor {
  factor: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  score: number;
  description: string;
  recommendation: string;
}

interface SelfCareResource {
  title: string;
  description: string;
  category: 'MENTAL_HEALTH' | 'PHYSICAL_HEALTH' | 'WORK_LIFE_BALANCE' | 'COMMUNITY';
  actionUrl?: string;
}

interface BurnoutRiskAssessment {
  caregiverId: string;
  caregiverName: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactor[];
  assessedAt: string;
  nextAssessmentDue: string;
  trendDirection: 'IMPROVING' | 'STABLE' | 'WORSENING';
  historicalScores: Array<{ date: string; score: number }>;
}

export function BurnoutSelfAssessment() {
  const [assessment, setAssessment] = useState<BurnoutRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestHelp, setShowRequestHelp] = useState(false);

  useEffect(() => {
    loadAssessment();
  }, []);

  async function loadAssessment() {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/me/burnout-assessment');
      // const data = await response.json();
      // setAssessment(data.assessment);

      // DEMO DATA (for now)
      await new Promise(resolve => setTimeout(resolve, 800));
      setAssessment(DEMO_ASSESSMENT);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }

  function getRiskColor(level: string): string {
    switch (level) {
      case 'LOW': return 'text-green-700 bg-green-50';
      case 'MODERATE': return 'text-yellow-700 bg-yellow-50';
      case 'HIGH': return 'text-orange-700 bg-orange-50';
      case 'CRITICAL': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  }

  function getRiskMessage(level: string): string {
    switch (level) {
      case 'LOW': return 'Your work-life balance looks healthy! Keep it up.';
      case 'MODERATE': return 'Your schedule is getting busy. Consider some adjustments.';
      case 'HIGH': return 'Your workload may be too much. Let\'s work on reducing stress.';
      case 'CRITICAL': return 'You may be at risk of burnout. Please reach out for support.';
      default: return '';
    }
  }

  function getTrendIcon(trend: string): string {
    switch (trend) {
      case 'IMPROVING': return '📈';
      case 'WORSENING': return '📉';
      default: return '➡️';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Unable to Load Assessment
          </h2>
          <p className="text-red-700">{error || 'No assessment data available'}</p>
          <button
            onClick={loadAssessment}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Well-Being Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your work-life balance and get personalized recommendations
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Your Privacy Matters
          </h3>
          <p className="text-sm text-blue-700">
            This assessment is based on your work schedule patterns. Your coordinator can see
            this same information - there are no hidden metrics. This tool is designed to help
            you and your team prevent burnout, not to surveil you.
          </p>
        </div>

        {/* Risk Score Card */}
        <div className={`rounded-lg shadow-lg p-6 mb-6 ${getRiskColor(assessment.riskLevel)}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Burnout Risk Score</h2>
              <p className="text-sm opacity-80">{getRiskMessage(assessment.riskLevel)}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{assessment.overallRiskScore}</div>
              <div className="text-sm opacity-80">out of 100</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Risk Level</span>
              <span className="font-semibold">{assessment.riskLevel}</span>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-current"
                style={{ width: `${assessment.overallRiskScore}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span>
              {getTrendIcon(assessment.trendDirection)} Trend: {assessment.trendDirection}
            </span>
            <span>
              Next check: {new Date(assessment.nextAssessmentDue).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Score History Chart */}
        {assessment.historicalScores.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Score History (Last 30 Days)</h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {assessment.historicalScores.map((point, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-200 rounded-t relative" style={{ height: '120px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t ${
                        point.score >= 70 ? 'bg-red-500' :
                        point.score >= 50 ? 'bg-orange-500' :
                        point.score >= 30 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ height: `${point.score}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Factors Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">What's Contributing to Your Score</h3>
          <div className="space-y-4">
            {assessment.riskFactors.map((factor, idx) => (
              <div key={idx} className="border-l-4 pl-4 py-2" style={{
                borderColor:
                  factor.severity === 'CRITICAL' ? '#dc2626' :
                  factor.severity === 'HIGH' ? '#ea580c' :
                  factor.severity === 'MODERATE' ? '#ca8a04' :
                  '#16a34a'
              }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{factor.factor}</span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    factor.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    factor.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    factor.severity === 'MODERATE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {factor.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{factor.description}</p>
                <p className="text-sm text-blue-600">
                  <strong>Suggestion:</strong> {factor.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Care Resources */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Self-Care Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SELF_CARE_RESOURCES.map((resource, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{resource.title}</h4>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {resource.category.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                {resource.actionUrl && (
                  <a
                    href={resource.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Learn More →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Request Help Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Need Support?</h3>
          <p className="text-gray-600 mb-4">
            If you're feeling overwhelmed or need help adjusting your schedule, we're here for you.
          </p>

          {!showRequestHelp ? (
            <button
              onClick={() => setShowRequestHelp(true)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Request Schedule Adjustment
            </button>
          ) : (
            <div className="space-y-4">
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                rows={4}
                placeholder="Let your coordinator know how we can help (e.g., 'I need a few days off' or 'Can we reduce my weekend shifts?')"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    alert('Help request sent! Your coordinator will reach out soon.');
                    setShowRequestHelp(false);
                  }}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Send Request
                </button>
                <button
                  onClick={() => setShowRequestHelp(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Crisis Resources (24/7):</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• National Suicide Prevention Lifeline: <strong>988</strong></li>
              <li>• Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></li>
              <li>• SAMHSA National Helpline: <strong>1-800-662-4357</strong></li>
            </ul>
          </div>
        </div>

        {/* Assessment Metadata */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Last assessed: {new Date(assessment.assessedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// DEMO DATA
const DEMO_ASSESSMENT: BurnoutRiskAssessment = {
  caregiverId: 'me',
  caregiverName: 'You',
  overallRiskScore: 62,
  riskLevel: 'MODERATE',
  riskFactors: [
    {
      factor: 'Work Hours',
      severity: 'MODERATE',
      score: 6.5,
      description: 'Averaging 44 hours/week over the last 30 days',
      recommendation: 'Try to keep weekly hours between 35-40 to maintain work-life balance.',
    },
    {
      factor: 'Time Off',
      severity: 'MODERATE',
      score: 5.5,
      description: 'Only had 1 day off in the last 10 days',
      recommendation: 'Schedule at least 2 days off per week for adequate rest.',
    },
    {
      factor: 'Travel Burden',
      severity: 'LOW',
      score: 3.0,
      description: 'Averaging 22 miles/day of travel',
      recommendation: 'Current travel load is manageable. Keep up the good work!',
    },
    {
      factor: 'Schedule Variety',
      severity: 'LOW',
      score: 2.5,
      description: 'Good mix of shift types and client assignments',
      recommendation: 'Your varied schedule helps prevent monotony and burnout.',
    },
  ],
  assessedAt: new Date().toISOString(),
  nextAssessmentDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  trendDirection: 'STABLE',
  historicalScores: [
    { date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), score: 45 },
    { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), score: 52 },
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), score: 58 },
    { date: new Date().toISOString(), score: 62 },
  ],
};

const SELF_CARE_RESOURCES: SelfCareResource[] = [
  {
    title: 'Stress Management Techniques',
    description: 'Evidence-based breathing exercises, meditation, and relaxation techniques for caregivers.',
    category: 'MENTAL_HEALTH',
    actionUrl: 'https://www.caregiver.org/resource/caregiver-stress/',
  },
  {
    title: 'Sleep Hygiene for Shift Workers',
    description: 'Tips for better sleep when working irregular hours or night shifts.',
    category: 'PHYSICAL_HEALTH',
    actionUrl: 'https://www.sleepfoundation.org/shift-work-disorder',
  },
  {
    title: 'Setting Boundaries at Work',
    description: 'Learn how to say no, manage expectations, and protect your personal time.',
    category: 'WORK_LIFE_BALANCE',
  },
  {
    title: 'Caregiver Support Groups',
    description: 'Connect with other caregivers who understand your challenges.',
    category: 'COMMUNITY',
  },
  {
    title: 'Physical Activity for Busy Schedules',
    description: 'Quick 10-15 minute exercises you can do between shifts.',
    category: 'PHYSICAL_HEALTH',
  },
  {
    title: 'Mindfulness for Caregivers',
    description: 'Simple mindfulness practices to stay present and reduce stress.',
    category: 'MENTAL_HEALTH',
    actionUrl: 'https://www.mindful.org/mindfulness-for-caregivers/',
  },
];
