/**
 * Family Care Plan Page
 *
 * Shows the care plan and daily activities with detailed progress
 */

import React from 'react';
import { Card } from '@/core/components';
import { useFamilyDashboard } from '../hooks';
import { useAuth } from '@/core/hooks';
import { CarePlanSummary, CareTeam } from '../components';
import { ClipboardList, Users } from 'lucide-react';
import type { UUID } from '@care-commons/core/browser';

export const CarePlanPage: React.FC = () => {
  const { user } = useAuth();
  const familyMemberId = user?.id as UUID | null;
  const { data: dashboardData, isLoading } = useFamilyDashboard(familyMemberId);

  const clientName = dashboardData?.client?.name || 'your loved one';

  // Mock care plan report data
  // In a real implementation, this would come from an API endpoint
  const mockCarePlanReport = dashboardData?.activeCarePlan ? {
    id: 'report-1' as UUID,
    carePlanId: dashboardData.activeCarePlan.id,
    clientId: dashboardData.client.id,
    familyMemberIds: [familyMemberId!],
    reportPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    reportPeriodEnd: new Date(),
    reportType: 'MONTHLY' as const,
    goalsTotal: dashboardData.activeCarePlan.goalsTotal,
    goalsAchieved: dashboardData.activeCarePlan.goalsAchieved,
    goalsInProgress: Math.floor(dashboardData.activeCarePlan.goalsTotal * 0.5),
    goalsAtRisk: Math.floor(dashboardData.activeCarePlan.goalsTotal * 0.1),
    goalProgress: [
      {
        goalId: 'goal-1' as UUID,
        goalName: 'Improve Mobility and Independence',
        category: 'Physical Therapy',
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        currentStatus: 'ON_TRACK' as const,
        progressPercentage: 75,
        recentUpdates: 'Patient has shown significant improvement in walking without assistance. Able to walk 100 feet independently.',
      },
      {
        goalId: 'goal-2' as UUID,
        goalName: 'Medication Management',
        category: 'Healthcare',
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        currentStatus: 'ACHIEVED' as const,
        progressPercentage: 100,
        recentUpdates: 'Patient is now taking all medications as prescribed without reminders. Goal achieved ahead of schedule.',
      },
      {
        goalId: 'goal-3' as UUID,
        goalName: 'Social Engagement',
        category: 'Activities of Daily Living',
        targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        currentStatus: 'IN_PROGRESS' as const,
        progressPercentage: 60,
        recentUpdates: 'Patient has attended 3 social events this month. Building confidence in group settings.',
      },
      {
        goalId: 'goal-4' as UUID,
        goalName: 'Nutritional Goals',
        category: 'Nutrition',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentStatus: 'AT_RISK' as const,
        progressPercentage: 35,
        recentUpdates: 'Patient is struggling with appetite. Dietitian has recommended meal supplements.',
      },
    ],
    overallSummary: `${clientName.split(' ')[0]} is making excellent progress on the care plan. Physical mobility has improved significantly, and medication compliance is now at 100%. We're focusing on increasing social engagement and addressing nutritional concerns.`,
    concernsNoted: 'Nutritional intake has decreased slightly over the past two weeks. Care team is monitoring closely and has introduced meal supplements.',
    recommendationsForFamily: 'Continue to encourage participation in social activities. Consider joining for meals to promote better eating habits. The care team is here to support you.',
    preparedBy: user?.id || ('coordinator-1' as UUID),
    preparedByName: 'Care Coordinator',
    createdBy: user?.id || ('coordinator-1' as UUID),
    updatedBy: user?.id || ('coordinator-1' as UUID),
    version: 1,
    publishedAt: new Date(),
    organizationId: 'org-1' as UUID,
    branchId: 'branch-1' as UUID,
    createdAt: new Date(),
    updatedAt: new Date(),
  } : undefined;

  // Mock care team data
  const mockCareTeam = [
    {
      id: 'caregiver-1',
      name: 'Sarah Johnson',
      role: 'Primary Caregiver',
      photoUrl: undefined,
      email: 'sarah.johnson@carecommons.example',
      phone: '(555) 123-4567',
      availability: 'Mon-Fri, 9AM-5PM',
      specialties: ['Personal Care', 'Mobility Assistance'],
    },
    {
      id: 'coordinator-1',
      name: 'Michael Chen',
      role: 'Care Coordinator',
      photoUrl: undefined,
      email: 'michael.chen@carecommons.example',
      phone: '(555) 234-5678',
      availability: 'Mon-Sun, 24/7',
      specialties: ['Care Planning', 'Family Support'],
    },
    {
      id: 'nurse-1',
      name: 'Emily Rodriguez, RN',
      role: 'Registered Nurse',
      photoUrl: undefined,
      email: 'emily.rodriguez@carecommons.example',
      phone: '(555) 345-6789',
      availability: 'On-call',
      specialties: ['Medication Management', 'Health Monitoring'],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-gray-200 rounded-lg" />
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Care Plan</h1>
        <p className="text-gray-600 mt-1">
          View care goals and progress for {clientName}
        </p>
      </div>

      {/* Care Plan Summary */}
      {mockCarePlanReport ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Progress Report</h2>
          </div>
          <CarePlanSummary report={mockCarePlanReport} loading={false} />
        </div>
      ) : (
        <Card padding="lg">
          <div className="text-center py-12">
            <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Active Care Plan
            </h3>
            <p className="text-gray-600">
              A care plan will be created by the care coordinator and will appear here.
            </p>
          </div>
        </Card>
      )}

      {/* Care Team */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Care Team</h2>
        </div>
        <CareTeam members={mockCareTeam} loading={false} />
      </div>
    </div>
  );
};
