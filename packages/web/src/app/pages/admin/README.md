# Admin Dashboard

Comprehensive administrative interface for Care Commons, providing real-time operations monitoring, multi-state EVV configuration, database management, and compliance reporting.

## Features

### 1. Operations Center
Real-time monitoring and exception management for ongoing care operations.

**Components:**
- **Active Visits with Live GPS**: Monitor all ongoing visits with GPS status, geofence compliance, and duration tracking
- **EVV Exceptions Dashboard**: Instant visibility into violations with severity levels (critical/error/warning/info)
- **Pending VMURs (Texas)**: Texas Visit Maintenance Unlock Request approval queue with deadlines

**Use Cases:**
- Monitor field staff in real-time
- Quickly identify and resolve GPS/geofence issues
- Approve/deny Texas VMUR requests before deadlines
- Track visit durations and compliance status

### 2. State Configuration Panel  
Multi-state EVV compliance settings for all 50 states (currently supports TX, FL, OH, PA, GA, NC, AZ).

**Configurable Settings:**
- **Geofence Tolerance**: 50-300 meters (state-specific requirements)
- **Grace Periods**: Clock-in/out grace periods (5-30 minutes)
- **GPS Accuracy Thresholds**: Minimum GPS accuracy requirements
- **Aggregator Selection**: HHAeXchange, Sandata, Netsmart Tellus, iConnect
- **Required Documentation**: EVV 6 elements, GPS coordinates, task verification, signatures, photos
- **Enable/Disable States**: Toggle state operations on/off

**State-Specific Examples:**
- **Texas**: 100m geofence, 10min grace period, mandatory HHAeXchange
- **Florida**: 150m geofence, 15min grace period, multi-aggregator support

### 3. Database Management
Direct access to all system tables for data export and viewing.

**Available Tables:**
- **Core**: clients, caregivers, organizations, users
- **EVV**: visits, evv_records, evv_revisions, aggregator_submissions, vmur_requests
- **Billing**: invoices, payments
- **Scheduling**: schedules, open_shifts

**Features:**
- Category filtering (Core, EVV, Billing, Scheduling)
- Search functionality
- Row count display
- Export to CSV
- View table data

### 4. Compliance Center
Audit trails, HIPAA access logs, and regulatory reporting.

**Audit Trail:**
- User actions (CREATE, UPDATE, DELETE, APPROVE)
- Timestamps and IP addresses
- Success/failure status
- Resource tracking

**HIPAA PHI Access Logs:**
- Who accessed what PHI
- When and for what purpose
- Client information
- Audit-ready export

**Compliance Reports:**
- Texas EVV Aggregator Submissions (daily)
- Florida MCO Compliance Report (weekly)
- HIPAA Access Audit Report (monthly)
- State Regulatory Filings (quarterly)

## Access Control

**Required Permission:** `admin:access`

**Granted to Roles:**
- `SUPER_ADMIN` - Full access to all admin features
- `ORG_ADMIN` - Full access within their organization

**Fine-Grained Permissions:**
- `admin:state-config` - Edit state configurations
- `admin:data-access` - Access database tables
- `admin:compliance` - View compliance reports and audit logs

## Usage

### Accessing the Dashboard
Navigate to `/admin` in the web application. The admin link appears in the sidebar for users with appropriate permissions.

### Monitoring Operations

```typescript
// View active visits
// Navigate to Operations tab
// Click "Track" to see GPS location
// Click "Resolve" on exceptions to take action
```

### Configuring States

```typescript
// Navigate to State Configuration tab
// Select a state from the sidebar
// Modify settings (geofence, grace period, aggregator, etc.)
// Click "Save Changes" to persist
```

### Exporting Data

```typescript
// Navigate to Data Management tab
// Filter by category or search
// Click "View" to see table data
// Click export icon to download CSV
```

### Reviewing Compliance

```typescript
// Navigate to Compliance Center tab
// Switch between Audit Trail, HIPAA Logs, and Reports
// Click "Export" to download logs for external auditing
// Click "View" or "Download" on reports
```

## API Integration (Ready for Implementation)

The dashboard is built with mock data and fully typed interfaces. To connect to real APIs:

### 1. Active Visits API

```typescript
// GET /api/admin/active-visits
interface ActiveVisit {
  id: string;
  caregiverName: string;
  clientName: string;
  clockInTime: Date;
  gpsStatus: 'good' | 'weak' | 'none';
  geofenceStatus: 'within' | 'outside';
  state: StateCode;
}
```

### 2. State Configuration API

```typescript
// GET /api/admin/state-config/:state
// PUT /api/admin/state-config/:state
interface StateConfig {
  state: StateCode;
  enabled: boolean;
  geofenceTolerance: number;
  gracePeriodMinutes: number;
  aggregator: string;
  requiredDocuments: string[];
  gpsAccuracyThreshold: number;
}
```

### 3. Database Tables API

```typescript
// GET /api/admin/tables/:tableName?page=1&limit=50
interface TableData {
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
}
```

### 4. Audit Logs API

```typescript
// GET /api/admin/audit-logs?startDate=...&endDate=...
// GET /api/admin/hipaa-logs?startDate=...&endDate=...
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'success' | 'failure';
}
```

### 5. Compliance Reports API

```typescript
// GET /api/admin/reports
// GET /api/admin/reports/:id/download
interface ComplianceReport {
  id: string;
  name: string;
  category: 'evv' | 'hipaa' | 'state' | 'billing';
  lastGenerated: Date;
  frequency: 'daily' | 'weekly' | 'monthly';
}
```

## Components

### AdminDashboard.tsx
Main dashboard with tab navigation and real-time stats.

### OperationsCenter.tsx
Real-time monitoring of active visits, exceptions, and VMURs.

### StateConfigPanel.tsx
Multi-state configuration editor with save/reset functionality.

### DataGridPanel.tsx
Database table browser with search, filter, and export.

### ComplianceCenter.tsx
Audit trails, HIPAA logs, and compliance reports.

## Types

All types are defined in `types/admin.types.ts`:
- `StateCode` - Supported state codes
- `StateConfig` - State configuration interface
- `ActiveVisit` - Real-time visit data
- `EVVException` - Exception tracking
- `VMURRequest` - Texas VMUR workflow
- `AuditLogEntry` - System audit trail
- `HIPAAAccessLog` - PHI access tracking
- `ComplianceReport` - Regulatory reports
- `DatabaseTable` - Table metadata

## State-Specific Compliance

### Texas (TX)
- **Aggregator**: HHAeXchange (mandatory)
- **Geofence**: 100m base + GPS accuracy tolerance
- **Grace Period**: 10 minutes clock-in/out
- **GPS Accuracy**: 100m minimum
- **Special Requirements**: VMUR for corrections, Employee Misconduct Registry checks

### Florida (FL)
- **Aggregator**: Multi-aggregator (HHAeXchange, Netsmart Tellus, others)
- **Geofence**: 150m base + GPS accuracy tolerance
- **Grace Period**: 15 minutes clock-in/out
- **GPS Accuracy**: 150m minimum
- **Special Requirements**: Level 2 background screening, RN supervision visits (60 days)

### Other States
Ohio, Pennsylvania, Georgia, North Carolina, Arizona configurations can be enabled and customized as needed.

## Security Considerations

1. **Permission Checks**: All admin routes require `admin:access` permission
2. **Audit Logging**: All admin actions are logged with user, timestamp, and IP
3. **Data Export**: Exports should be logged and monitored for compliance
4. **State Config Changes**: Changes to state configurations should trigger notifications
5. **PHI Access**: HIPAA logs track all access to protected health information

## Future Enhancements

1. **WebSocket Integration**: Real-time updates for active visits without polling
2. **Advanced Filtering**: Date ranges, multiple filters, saved filter presets
3. **Report Scheduling**: Automated report generation and email delivery
4. **Bulk Operations**: Bulk approve/deny VMURs, bulk export tables
5. **Dashboard Customization**: User-configurable widgets and layouts
6. **Mobile Support**: Responsive design for tablet/mobile admin access
7. **Additional States**: Expand to all 50 states with specific compliance rules
8. **Integration Testing**: Comprehensive test coverage for all components

## Troubleshooting

### Admin Link Not Visible
- Verify user has `admin:access` permission
- Check user role is `SUPER_ADMIN` or `ORG_ADMIN`
- Refresh browser to reload permissions

### State Configuration Not Saving
- Check for unsaved changes warning
- Verify user has `admin:state-config` permission
- Check browser console for API errors

### Data Export Not Working
- Verify user has `admin:data-access` permission
- Check browser allows file downloads
- Verify table has data to export

### Compliance Reports Empty
- Check date range filters
- Verify audit logging is enabled
- Check API endpoints are connected

## Contributing

When adding new features to the admin dashboard:

1. **Maintain Permission Checks**: All new features should have appropriate permission requirements
2. **Add Type Definitions**: Update `types/admin.types.ts` for new data structures
3. **Follow Naming Conventions**: Use consistent naming (e.g., `StateConfig`, `VMURRequest`)
4. **Document API Contracts**: Add API documentation for new endpoints
5. **Test State-Specific Logic**: Verify compliance rules for TX, FL, and other states
6. **Update README**: Document new features and usage instructions

## License

Copyright © 2025 Neighborhood Lab  
Licensed under the terms of the Care Commons project.
