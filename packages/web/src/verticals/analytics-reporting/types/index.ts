/**
 * Analytics & Reporting Frontend Types
 */

export interface OperationalKPIs {
  visits: {
    scheduled: number;
    completed: number;
    missed: number;
    inProgress: number;
    completionRate: number;
  };
  evvCompliance: {
    compliantVisits: number;
    totalVisits: number;
    complianceRate: number;
    flaggedVisits: number;
    pendingReview: number;
  };
  revenueMetrics: {
    billableHours: number;
    billedAmount: number;
    paidAmount: number;
    outstandingAR: number;
    averageReimbursementRate: number;
  };
  staffing: {
    activeCaregivers: number;
    utilizationRate: number;
    overtimeHours: number;
    credentialExpirations: number;
  };
  clientMetrics: {
    activeClients: number;
    newClients: number;
    dischargedClients: number;
    highRiskClients: number;
    overdueAssessments: number;
  };
}

export interface ComplianceAlert {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  count: number;
  message: string;
  actionRequired: string;
}

export interface DashboardStats {
  inProgress: number;
  completedToday: number;
  upcoming: number;
  needsReview: number;
}

export interface AnalyticsFilters {
  organizationId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  months?: number;
}
