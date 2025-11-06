/**
 * Analytics Dashboard Page
 */

import React from 'react';
import { useOperationalKPIs, useComplianceAlerts } from '../hooks/useAnalytics';
import { KPICard } from '../components/KPICard';
import { AlertCard } from '../components/AlertCard';

export const AnalyticsDashboard: React.FC = () => {
  const { data: kpis, isLoading: kpisLoading } = useOperationalKPIs();
  const { data: alerts, isLoading: alertsLoading } = useComplianceAlerts();

  if (kpisLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics & Reporting</h1>

      {/* Compliance Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Compliance Alerts</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert, idx) => (
              <AlertCard key={idx} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Visit Metrics */}
      {kpis && (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Visit Metrics</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Scheduled Visits"
                value={kpis.visits.scheduled}
                subtitle="Total scheduled"
              />
              <KPICard
                title="Completed Visits"
                value={kpis.visits.completed}
                subtitle="Successfully completed"
              />
              <KPICard
                title="In Progress"
                value={kpis.visits.inProgress}
                subtitle="Currently active"
              />
              <KPICard
                title="Completion Rate"
                value={`${(kpis.visits.completionRate * 100).toFixed(1)}%`}
                subtitle="Visit completion rate"
              />
            </div>
          </div>

          {/* EVV Compliance */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">EVV Compliance</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Compliance Rate"
                value={`${(kpis.evvCompliance.complianceRate * 100).toFixed(1)}%`}
                subtitle="EVV compliance"
              />
              <KPICard
                title="Compliant Visits"
                value={kpis.evvCompliance.compliantVisits}
                subtitle="Fully compliant"
              />
              <KPICard
                title="Flagged Visits"
                value={kpis.evvCompliance.flaggedVisits}
                subtitle="Require review"
              />
              <KPICard
                title="Pending Review"
                value={kpis.evvCompliance.pendingReview}
                subtitle="Awaiting approval"
              />
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Billable Hours"
                value={kpis.revenueMetrics.billableHours.toFixed(0)}
                subtitle="Total hours"
              />
              <KPICard
                title="Billed Amount"
                value={`$${kpis.revenueMetrics.billedAmount.toLocaleString()}`}
                subtitle="Total billed"
              />
              <KPICard
                title="Paid Amount"
                value={`$${kpis.revenueMetrics.paidAmount.toLocaleString()}`}
                subtitle="Received payments"
              />
              <KPICard
                title="Outstanding A/R"
                value={`$${kpis.revenueMetrics.outstandingAR.toLocaleString()}`}
                subtitle="Accounts receivable"
              />
            </div>
          </div>

          {/* Staffing */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Staffing</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Active Caregivers"
                value={kpis.staffing.activeCaregivers}
                subtitle="Currently active"
              />
              <KPICard
                title="Utilization Rate"
                value={`${(kpis.staffing.utilizationRate * 100).toFixed(1)}%`}
                subtitle="Staff utilization"
              />
              <KPICard
                title="Overtime Hours"
                value={kpis.staffing.overtimeHours}
                subtitle="Total OT"
              />
              <KPICard
                title="Credential Expirations"
                value={kpis.staffing.credentialExpirations}
                subtitle="Expiring within 30 days"
              />
            </div>
          </div>

          {/* Client Metrics */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Clients</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <KPICard
                title="Active Clients"
                value={kpis.clientMetrics.activeClients}
                subtitle="Currently active"
              />
              <KPICard
                title="New Clients"
                value={kpis.clientMetrics.newClients}
                subtitle="Recently added"
              />
              <KPICard
                title="Discharged"
                value={kpis.clientMetrics.dischargedClients}
                subtitle="Recently discharged"
              />
              <KPICard
                title="High Risk"
                value={kpis.clientMetrics.highRiskClients}
                subtitle="Flagged clients"
              />
              <KPICard
                title="Overdue Assessments"
                value={kpis.clientMetrics.overdueAssessments}
                subtitle="Need review"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
