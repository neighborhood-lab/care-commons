# Task 0060: Analytics Dashboard Completion

**Priority**: 🟠 MEDIUM (Feature Completion)
**Category**: Web / Frontend
**Estimated Effort**: 1 week

## Context

Analytics backend complete. Frontend 70% complete at `packages/web/src/verticals/analytics-reporting/`. Need admin and coordinator dashboards with export functionality.

## Objective

Complete analytics dashboards for administrators and coordinators with comprehensive reporting and exports.

## Requirements

**Administrator Dashboard**:
1. **Financial Metrics** - Revenue, expenses, profit margins
2. **Operational Metrics** - Visit completion rate, caregiver utilization
3. **Compliance Metrics** - EVV compliance, credential expiration
4. **Trend Analysis** - Month-over-month, year-over-year comparisons

**Coordinator Dashboard**:
1. **Today's Overview** - Active visits, upcoming visits, issues
2. **Caregiver Performance** - On-time rate, task completion rate
3. **Client Satisfaction** - Family feedback, incident reports
4. **Scheduling Efficiency** - Fill rate, cancellation rate

**Export Functionality**:
1. **PDF Reports** - Formatted reports for printing
2. **Excel Exports** - Raw data exports for further analysis
3. **CSV Exports** - Simple data exports
4. **Scheduled Reports** - Email reports daily/weekly/monthly

## Implementation

**New Components**:
- `FinancialMetricsCard.tsx` - Financial KPIs
- `ComplianceMetricsCard.tsx` - Compliance status
- `TrendChart.tsx` - Line charts for trends
- `ExportModal.tsx` - Export configuration UI

**API Integration**:
- GET `/api/analytics/financial` - Financial metrics
- GET `/api/analytics/operational` - Operational metrics
- GET `/api/analytics/compliance` - Compliance metrics
- POST `/api/analytics/export` - Generate export files

**Charting Library**: Recharts or Chart.js

## Success Criteria

- [ ] Admin dashboard shows all metrics
- [ ] Coordinator dashboard functional
- [ ] Charts render correctly
- [ ] Export to PDF/Excel/CSV works
- [ ] Date range filters work
- [ ] Real-time data updates
