# Task 0005: Complete Analytics Dashboard UI

**Priority**: 🟡 MEDIUM
**Phase**: Phase 2 - Feature Completeness
**Estimated Effort**: 8-10 hours

## Context

The analytics vertical has a complete backend with KPI calculations, compliance reporting, and revenue analysis. The frontend has a partial implementation that needs to be completed for admin and coordinator dashboards.

## Existing Backend

- ✅ KPI service with calculations
- ✅ Compliance alert service
- ✅ Revenue analysis service
- ✅ Export service (PDF, Excel, CSV)

## Task

### 1. Complete Admin Dashboard

**File**: `packages/web/src/app/pages/analytics/AdminDashboard.tsx`

**Widgets to Implement**:
- **Revenue Overview**: Total revenue, outstanding invoices, payment trends (line chart)
- **Visit Metrics**: Total visits, completed, missed, EVV compliance rate
- **Caregiver Performance**: Reliability scores, top performers, training compliance
- **Client Overview**: Active clients, new enrollments, churn rate
- **Compliance Alerts**: Outstanding issues requiring attention (list)
- **Financial Projections**: Revenue forecast based on scheduled visits

**Charts**:
- Use Chart.js or Recharts for visualizations
- Line charts for trends over time
- Bar charts for comparisons
- Pie charts for distributions
- KPI cards for single metrics

### 2. Complete Coordinator Dashboard

**File**: `packages/web/src/app/pages/analytics/CoordinatorDashboard.tsx`

**Widgets to Implement**:
- **Today's Overview**: Visits today, in progress, completed, issues
- **Upcoming Visits**: Next 7 days, potential conflicts
- **Caregiver Status**: Available, on visit, off-duty, sick
- **Client Alerts**: High-risk clients, missed visits, overdue tasks
- **Schedule Efficiency**: Fill rate, travel time optimization
- **EVV Issues**: Geofence violations, missing check-ins/outs

**Real-Time Updates**:
- Poll every 60 seconds for live visit status
- Notification toast for new alerts
- Red/yellow/green status indicators

### 3. Implement Report Generation

**File**: `packages/web/src/app/pages/analytics/ReportsPage.tsx`

**Report Types**:
- **Payroll Report**: Hours worked by caregiver, date range selector
- **Billing Report**: Billable services, invoice status, client breakdown
- **Compliance Report**: EVV compliance, credential status, training completion
- **Visit Report**: Visit history, completion rates, service types
- **Custom Report Builder**: Select metrics, date range, filters

**Export Options**:
- PDF (formatted for printing)
- Excel (data with charts)
- CSV (raw data for analysis)

### 4. Add Filtering and Date Range Selection

**Component**: `packages/web/src/app/pages/analytics/components/AnalyticsFilters.tsx`

**Filters**:
- Date range picker (preset: today, week, month, quarter, custom)
- Client filter (dropdown, multi-select)
- Caregiver filter (dropdown, multi-select)
- Service type filter
- Status filter (completed, missed, pending)
- Branch filter (for multi-location agencies)

### 5. Implement Data Visualization Components

**Components** (`packages/web/src/app/pages/analytics/components/charts/`):
- `RevenueChart.tsx` - Revenue over time
- `VisitMetricsChart.tsx` - Visit statistics
- `ComplianceGauge.tsx` - Compliance percentage gauge
- `TopPerformersTable.tsx` - Top caregivers by metrics
- `AlertsList.tsx` - Compliance alerts list

### 6. Add Real-Time Updates

**Use React Query with polling**:
```typescript
useQuery(['analytics', 'dashboard'], fetchDashboardData, {
  refetchInterval: 60000, // 60 seconds
  refetchIntervalInBackground: false
});
```

### 7. Add Drill-Down Navigation

- Click on KPI card → detailed view
- Click on chart data point → filtered list
- Click on alert → navigate to resolution page
- Click on caregiver/client → their detail page

## User Stories

1. **As an administrator**, I can view high-level KPIs for the entire agency
2. **As an administrator**, I can generate financial reports for accounting
3. **As an administrator**, I can identify compliance issues requiring attention
4. **As a coordinator**, I can view real-time status of today's visits
5. **As a coordinator**, I can identify caregivers available for fill-in shifts
6. **As a coordinator**, I can drill down into specific metrics for details
7. **As any user**, I can export reports in multiple formats

## Acceptance Criteria

- [ ] Admin dashboard complete with all widgets
- [ ] Coordinator dashboard complete with real-time updates
- [ ] Report generation working for all report types
- [ ] Export functionality (PDF, Excel, CSV) working
- [ ] Filtering and date range selection working
- [ ] Charts rendering correctly and responsive
- [ ] Drill-down navigation working
- [ ] Real-time polling for live updates
- [ ] Loading states and error handling
- [ ] Mobile responsive design
- [ ] Tests for data calculations

## Design Considerations

- Use consistent color scheme for charts (green=good, yellow=warning, red=critical)
- Ensure charts are accessible (proper labels, alt text)
- Optimize performance for large datasets (pagination, lazy loading)
- Cache dashboard data with React Query

## Backend API Reference

- Analytics API: `verticals/analytics-reporting/src/routes/analytics.routes.ts`
- KPI Service: `verticals/analytics-reporting/src/services/kpi.service.ts`
- Export Service: `verticals/analytics-reporting/src/services/export.service.ts`
