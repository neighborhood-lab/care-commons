/**
 * useCompliance Hook
 * 
 * Manages compliance autopilot state including deadlines, dashboard summary,
 * and actions like scanning and resolving deadlines.
 */

import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './api.js';
import type {
  ComplianceDeadline,
  ComplianceDashboardSummary,
  ComplianceAuditReport,
  CaregiverCredentialStatus,
  AuthorizationUsage,
} from '@care-commons/core';

interface ComplianceState {
  dashboard: ComplianceDashboardSummary | null;
  deadlines: ComplianceDeadline[];
  isLoading: boolean;
  error: string | null;
}

interface ComplianceActions {
  refresh: () => Promise<void>;
  runScan: () => Promise<void>;
  resolveDeadline: (deadlineId: string, note?: string) => Promise<void>;
  getCaregiverStatus: (caregiverId: string) => Promise<CaregiverCredentialStatus>;
  canCaregiverBeScheduled: (caregiverId: string) => Promise<{ canSchedule: boolean; reasons: string[] }>;
  getAuthorizationUsage: (clientId: string) => Promise<AuthorizationUsage[]>;
  generateAuditReport: (startDate: string, endDate: string) => Promise<ComplianceAuditReport>;
}

interface DashboardApiResponse {
  success: boolean;
  data?: ComplianceDashboardSummary;
  error?: string;
}

interface DeadlinesApiResponse {
  success: boolean;
  data?: {
    deadlines: ComplianceDeadline[];
    total: number;
  };
  error?: string;
}

interface ScanApiResponse {
  success: boolean;
  data?: {
    deadlines: ComplianceDeadline[];
    scannedAt: string;
    totalDeadlines: number;
  };
  error?: string;
}

interface CaregiverStatusApiResponse {
  success: boolean;
  data?: CaregiverCredentialStatus;
  error?: string;
}

interface CanScheduleApiResponse {
  success: boolean;
  data?: { canSchedule: boolean; reasons: string[] };
  error?: string;
}

interface AuthorizationUsageApiResponse {
  success: boolean;
  data?: {
    authorizations: AuthorizationUsage[];
    total: number;
  };
  error?: string;
}

interface AuditReportApiResponse {
  success: boolean;
  data?: ComplianceAuditReport;
  error?: string;
}

export function useCompliance(): ComplianceState & ComplianceActions {
  const apiClient = useApiClient();
  
  const [dashboard, setDashboard] = useState<ComplianceDashboardSummary | null>(null);
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch dashboard and deadlines in parallel
      const [dashboardRes, deadlinesRes] = await Promise.all([
        apiClient.get<DashboardApiResponse>('/api/compliance/dashboard'),
        apiClient.get<DeadlinesApiResponse>('/api/compliance/deadlines'),
      ]);
      
      if (dashboardRes.success && dashboardRes.data !== undefined) {
        setDashboard(dashboardRes.data);
      }
      
      if (deadlinesRes.success && deadlinesRes.data !== undefined) {
        setDeadlines(deadlinesRes.data.deadlines);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load compliance data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  const runScan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<ScanApiResponse>('/api/compliance/scan');
      if (response.success && response.data !== undefined) {
        setDeadlines(response.data.deadlines);
        // Refresh dashboard after scan
        await refresh();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run compliance scan';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, refresh]);

  const resolveDeadline = useCallback(async (deadlineId: string, note?: string) => {
    setError(null);
    try {
      await apiClient.post(`/api/compliance/deadlines/${deadlineId}/resolve`, { note });
      // Refresh deadlines after resolution
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve deadline';
      setError(message);
      throw err;
    }
  }, [apiClient, refresh]);

  const getCaregiverStatus = useCallback(async (caregiverId: string): Promise<CaregiverCredentialStatus> => {
    const response = await apiClient.get<CaregiverStatusApiResponse>(`/api/compliance/caregivers/${caregiverId}/status`);
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    throw new Error('Failed to get caregiver status');
  }, [apiClient]);

  const canCaregiverBeScheduled = useCallback(async (caregiverId: string): Promise<{ canSchedule: boolean; reasons: string[] }> => {
    const response = await apiClient.get<CanScheduleApiResponse>(`/api/compliance/caregivers/${caregiverId}/can-schedule`);
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    throw new Error('Failed to check scheduling eligibility');
  }, [apiClient]);

  const getAuthorizationUsage = useCallback(async (clientId: string): Promise<AuthorizationUsage[]> => {
    const response = await apiClient.get<AuthorizationUsageApiResponse>(`/api/compliance/clients/${clientId}/authorizations`);
    if (response.success && response.data !== undefined) {
      return response.data.authorizations;
    }
    throw new Error('Failed to get authorization usage');
  }, [apiClient]);

  const generateAuditReport = useCallback(async (startDate: string, endDate: string): Promise<ComplianceAuditReport> => {
    const response = await apiClient.get<AuditReportApiResponse>(
      `/api/compliance/reports/audit?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
    if (response.success && response.data !== undefined) {
      return response.data;
    }
    throw new Error('Failed to generate audit report');
  }, [apiClient]);

  // Load compliance data on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    dashboard,
    deadlines,
    isLoading,
    error,
    refresh,
    runScan,
    resolveDeadline,
    getCaregiverStatus,
    canCaregiverBeScheduled,
    getAuthorizationUsage,
    generateAuditReport,
  };
}
