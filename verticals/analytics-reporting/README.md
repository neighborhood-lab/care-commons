# Analytics & Reporting Vertical

Comprehensive analytics, reporting, and data visualization for operational metrics, compliance monitoring, and performance tracking.

## Features

### 1. Analytics Service
- **Operational KPIs**: Real-time calculation of key performance indicators
  - Visit metrics (completion rate, scheduled, completed, missed)
  - EVV compliance metrics (compliance rate, flagged visits, pending review)
  - Revenue metrics (billable hours, billed/paid amounts, outstanding A/R)
  - Staffing metrics (active caregivers, utilization rate, overtime, credential expirations)
  - Client metrics (active clients, new/discharged, high-risk, overdue assessments)

- **Compliance Alerts**: Automated detection of compliance issues
  - Credential expirations
  - Authorization expirations
  - Overdue assessments
  - EVV submission delays
  - Supervisory visit requirements

- **Performance Metrics**: Caregiver performance tracking
  - Visits completed
  - Average visit duration
  - On-time percentage
  - EVV compliance rate
  - Client satisfaction scores
  - Geofence violations

### 2. Reporting Engine
Pre-built reports for compliance and operational analysis:

#### EVV Compliance Report
- State-specific compliance tracking
- Flagged visit details
- Aggregator submission status
- Compliance rate calculations

#### Productivity Report
- Caregiver performance metrics
- Total hours and utilization
- Top performers identification
- Areas needing improvement

#### Revenue Cycle Report
- Billed vs. paid analysis
- Outstanding accounts receivable
- Aging bucket analysis
- Revenue by payer breakdown
- Denial rate tracking

### 3. Export Service
Multiple export formats for all reports:
- **PDF**: Professional report formatting
- **Excel**: Detailed data tables with formatting
- **CSV**: Raw data export for further analysis

### 4. Dashboard UI

#### Admin Dashboard
Comprehensive operational overview for administrators:
- Real-time KPI cards with trend indicators
- Compliance alerts with action buttons
- Revenue trends visualization
- Target achievement tracking
- Status indicators (success/warning/danger)

#### Coordinator Dashboard
Day-to-day operational management:
- Today's visit status (in progress, completed, upcoming)
- EVV exception queue with approval workflow
- Quick action buttons
- Exception resolution tracking

## Architecture

### Backend Structure
```
verticals/analytics-reporting/
├── src/
│   ├── types/
│   │   └── analytics.ts           # TypeScript interfaces
│   ├── repository/
│   │   └── analytics-repository.ts # Database queries
│   ├── service/
│   │   ├── analytics-service.ts    # Business logic
│   │   ├── report-service.ts       # Report generation
│   │   └── export-service.ts       # Export formatting
│   ├── __tests__/
│   │   └── analytics-service.test.ts
│   └── index.ts                    # Public exports
├── package.json
├── tsconfig.json
└── README.md
```

### Frontend Structure
```
packages/web/src/verticals/analytics-reporting/
├── pages/
│   ├── AdminDashboard.tsx
│   └── CoordinatorDashboard.tsx
├── components/
│   ├── KPICard.tsx
│   ├── AlertCard.tsx
│   └── StatCard.tsx
├── hooks/
│   └── useAnalytics.ts
├── services/
│   └── analytics-api.ts
└── index.ts
```

### API Endpoints
```
GET  /api/analytics/kpis                          # Get operational KPIs
GET  /api/analytics/compliance-alerts             # Get compliance alerts
GET  /api/analytics/revenue-trends                # Get revenue trends
GET  /api/analytics/caregiver-performance/:id     # Get caregiver performance
GET  /api/analytics/evv-exceptions                # Get EVV exceptions
GET  /api/analytics/dashboard-stats               # Get dashboard stats
POST /api/analytics/reports/evv-compliance        # Generate EVV report
POST /api/analytics/reports/productivity          # Generate productivity report
POST /api/analytics/reports/revenue-cycle         # Generate revenue cycle report
GET  /api/analytics/reports/:id/export            # Export report
```

## Usage

### Backend

```typescript
import { AnalyticsService, ReportService, ExportService } from '@care-commons/analytics-reporting';

// Initialize services
const analyticsService = new AnalyticsService(database);
const reportService = new ReportService(database);
const exportService = new ExportService();

// Get KPIs
const kpis = await analyticsService.getOperationalKPIs(
  {
    organizationId: 'org-123',
    dateRange: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    },
  },
  userContext
);

// Get compliance alerts
const alerts = await analyticsService.getComplianceAlerts('org-123', undefined, userContext);

// Generate report
const report = await reportService.generateProductivityReport(
  'org-123',
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  },
  undefined,
  userContext
);

// Export to PDF
const pdfBuffer = await exportService.exportReport(report, 'PDF');
```

### Frontend

```typescript
import {
  AdminDashboard,
  CoordinatorDashboard,
  useOperationalKPIs,
  useComplianceAlerts
} from '@care-commons/analytics-reporting/web';

// Use in routes
function App() {
  return (
    <Routes>
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/coordinator" element={<CoordinatorDashboard />} />
    </Routes>
  );
}

// Use hooks in custom components
function MyDashboard() {
  const { data: kpis, isLoading } = useOperationalKPIs({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  });

  const { data: alerts } = useComplianceAlerts();

  return (
    <div>
      <h1>Visit Completion: {kpis?.visits.completionRate}%</h1>
      <ul>
        {alerts?.map(alert => (
          <li key={alert.type}>{alert.message}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Performance Considerations

### Database Query Optimization
- Indexed queries on frequently accessed columns
- Parallel execution of independent queries
- Efficient aggregation using database functions
- Connection pooling for multiple concurrent requests

### Real-time Updates
- Configurable refetch intervals (30-60 seconds)
- Stale-while-revalidate strategy
- Optimistic updates for better UX
- Background data refreshing

### Caching Strategy
- Query result caching with TTL
- Computed metric caching
- Report result storage
- CDN delivery for exported reports

## Testing

Run tests:
```bash
npm test
```

Test coverage includes:
- Unit tests for analytics service methods
- Repository query validation
- Authorization checks
- Data transformation logic
- Export format generation

## Security

### Access Control
- Organization-level data isolation
- Branch-level filtering when specified
- User context validation on all endpoints
- Permission checks before sensitive operations

### Data Privacy
- HIPAA-compliant data handling
- Encrypted sensitive fields
- Audit trail for all data access
- Secure report generation and export

## Future Enhancements

### Phase 2 Features
- Custom report builder
- Scheduled report generation
- Email delivery of reports
- Interactive data visualization (charts/graphs)
- Predictive analytics
- Benchmarking against industry standards
- Mobile-optimized dashboards

### Advanced Analytics
- Machine learning for visit pattern prediction
- Anomaly detection in compliance metrics
- Staff scheduling optimization recommendations
- Revenue forecasting models

## Dependencies

- `@care-commons/core`: Database, authentication, and shared utilities
- `@tanstack/react-query`: Data fetching and caching (frontend)
- `lucide-react`: Icon library (frontend)

## Contributing

When adding new analytics features:
1. Define types in `types/analytics.ts`
2. Add repository methods for data access
3. Implement service layer business logic
4. Create API endpoints
5. Build frontend hooks and components
6. Write tests
7. Update documentation

## License

Copyright © 2024 Care Commons
