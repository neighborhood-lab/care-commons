/**
 * Analytics & Reporting Web Vertical
 * Export all components, hooks, and services
 */

// Pages
export { AdminDashboard } from './pages/AdminDashboard';
export { CoordinatorDashboard } from './pages/CoordinatorDashboard';

// Components
export { KPICard } from './components/KPICard';
export { AlertCard } from './components/AlertCard';
export { StatCard } from './components/StatCard';

// Hooks
export {
  useOperationalKPIs,
  useComplianceAlerts,
  useRevenueTrends,
  useCaregiverPerformance,
  useEVVExceptions,
  useDashboardStats,
} from './hooks/useAnalytics';

// Services
export { analyticsApi } from './services/analytics-api';

// Types
export type {
  OperationalKPIs,
  ComplianceAlert,
  RevenueTrendDataPoint,
  VisitException,
  DashboardStats,
} from './services/analytics-api';
