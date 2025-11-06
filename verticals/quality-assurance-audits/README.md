# Quality Assurance & Audits Vertical

Comprehensive audit management system for quality assurance, compliance tracking, and corrective action management in home care operations.

## Overview

This vertical provides a complete solution for managing audits, tracking findings, and implementing corrective actions to ensure compliance with regulatory standards and maintain high-quality care.

## Features

### Audit Management
- Create and manage various types of audits (compliance, quality, safety, documentation, etc.)
- Schedule audits with defined scope (organization, branch, department, caregiver, client, process)
- Track audit lifecycle from draft through completion and approval
- Generate audit numbers and maintain audit history
- Calculate compliance scores and overall ratings
- Support for follow-up audits

### Audit Types Supported
- **Compliance Audits** - Regulatory compliance verification
- **Quality Audits** - Quality of care assessments
- **Safety Audits** - Safety protocol reviews
- **Documentation Audits** - Documentation quality checks
- **Financial Audits** - Billing and financial reviews
- **Medication Audits** - Medication management verification
- **Infection Control Audits** - Infection control compliance
- **Training Audits** - Staff training verification
- **Internal Reviews** - Internal quality assessments
- **External Audits** - Third-party agency audits

### Findings Management
- Document audit findings with severity levels (critical, major, minor, observation)
- Categorize findings by type (documentation, training, policy, safety, etc.)
- Reference regulatory standards and requirements
- Attach evidence (photos, documents)
- Track finding resolution status
- Verify corrective action effectiveness

### Corrective Action Plans
- Create detailed corrective action plans for findings
- Conduct root cause analysis
- Define specific actions and responsibilities
- Set target completion dates
- Track progress with percentage completion
- Monitor resource requirements and costs
- Verify action effectiveness
- Support for different action types (immediate, short-term, long-term, preventive)

### Dashboard & Reporting
- Real-time audit dashboard
- Track upcoming, in-progress, and completed audits
- Monitor critical findings
- View overdue corrective actions
- Generate audit statistics and metrics
- Compliance score tracking

## Architecture

### Data Models

#### Core Entities
- **Audit** - Main audit record with metadata, scheduling, and results
- **AuditFinding** - Individual findings or deficiencies identified during audit
- **CorrectiveAction** - Action plans to address findings
- **AuditTemplate** - Reusable audit templates with checklists
- **AuditChecklistResponse** - Completed checklist items

#### Key Enumerations
- `AuditType` - Types of audits
- `AuditStatus` - Audit lifecycle states
- `AuditScope` - Scope of audit (organization, branch, etc.)
- `FindingSeverity` - Severity levels for findings
- `FindingStatus` - Finding resolution states
- `CorrectiveActionStatus` - Action plan states

### Service Layer

The `AuditService` provides comprehensive business logic:

```typescript
class AuditService {
  // Audit management
  createAudit(input, context)
  getAudit(auditId, context)
  getAuditDetail(auditId, context)
  updateAudit(auditId, updates, context)
  startAudit(auditId, context)
  completeAudit(auditId, summary, recommendations, context)

  // Findings management
  createFinding(input, context)
  getFindingsForAudit(auditId, context)
  updateFindingStatus(findingId, status, context)
  verifyFinding(findingId, notes, context)
  getCriticalFindings(context, limit)

  // Corrective actions
  createCorrectiveAction(input, context)
  getCorrectiveActionsForAudit(auditId, context)
  updateCorrectiveActionProgress(actionId, progress, context)
  completeCorrectiveAction(actionId, context)
  verifyCorrectiveAction(actionId, rating, notes, context)
  getOverdueCorrectiveActions(context, limit)

  // Dashboard & analytics
  getAuditDashboard(context)
}
```

### Repository Layer

Three main repositories handle data access:
- `AuditRepository` - Audit CRUD operations and queries
- `AuditFindingRepository` - Finding management
- `CorrectiveActionRepository` - Corrective action management

### API Routes

RESTful API endpoints for all operations:

```
GET    /api/audits                     - List audits with filters
GET    /api/audits/:id                 - Get audit details
POST   /api/audits                     - Create new audit
PATCH  /api/audits/:id                 - Update audit
POST   /api/audits/:id/start           - Start audit
POST   /api/audits/:id/complete        - Complete audit

GET    /api/audits/:auditId/findings   - Get findings
POST   /api/audits/:auditId/findings   - Create finding
PATCH  /api/findings/:id/status        - Update finding status
POST   /api/findings/:id/verify        - Verify finding

GET    /api/audits/:auditId/corrective-actions  - Get actions
POST   /api/corrective-actions                  - Create action
POST   /api/corrective-actions/:id/progress     - Update progress
POST   /api/corrective-actions/:id/complete     - Complete action
POST   /api/corrective-actions/:id/verify       - Verify effectiveness

GET    /api/audits-dashboard            - Get dashboard data
GET    /api/audits/critical-findings    - Get critical findings
GET    /api/audits/overdue-actions      - Get overdue actions
```

## Usage

### Creating an Audit

```typescript
import { AuditService } from '@care-commons/quality-assurance-audits';

const audit = await auditService.createAudit({
  title: 'Q1 2024 Compliance Audit',
  description: 'Quarterly compliance review for Branch A',
  auditType: 'COMPLIANCE',
  priority: 'HIGH',
  scope: 'BRANCH',
  scopeEntityId: branchId,
  scheduledStartDate: new Date('2024-01-15'),
  scheduledEndDate: new Date('2024-01-20'),
  leadAuditorId: auditorId,
  standardsReference: 'CMS 42 CFR 484'
}, userContext);
```

### Recording a Finding

```typescript
const finding = await auditService.createFinding({
  auditId: audit.id,
  title: 'Missing Caregiver Certification',
  description: 'Caregiver X certification expired 30 days ago',
  category: 'TRAINING',
  severity: 'MAJOR',
  standardReference: 'CMS 484.80',
  requiredCorrectiveAction: 'Renew certification within 7 days',
  targetResolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
}, userContext);
```

### Creating Corrective Action

```typescript
const action = await auditService.createCorrectiveAction({
  findingId: finding.id,
  auditId: audit.id,
  title: 'Renew Caregiver Certification',
  description: 'Schedule and complete certification renewal',
  actionType: 'IMMEDIATE',
  specificActions: [
    'Contact training provider',
    'Schedule certification exam',
    'Complete certification within 7 days'
  ],
  responsiblePersonId: managerId,
  targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  resourcesRequired: 'Certification exam fee: $150'
}, userContext);
```

### Tracking Progress

```typescript
await auditService.updateCorrectiveActionProgress(
  action.id,
  {
    progressNote: 'Exam scheduled for Jan 18, 2024',
    completionPercentage: 50,
    nextSteps: 'Complete exam and submit certificate'
  },
  userContext
);
```

## Compliance & Standards

The system supports tracking compliance with various regulatory standards:
- CMS Home Health Conditions of Participation (42 CFR 484)
- State-specific home care regulations
- OSHA safety standards
- HIPAA privacy requirements
- Internal quality standards

## Permissions

Required permissions for various operations:
- `audits:create` - Create new audits
- `audits:view` - View audits and findings
- `audits:update` - Update audit information
- `audits:create-findings` - Document findings
- `audits:verify-findings` - Verify finding resolution
- `audits:create-corrective-actions` - Create action plans
- `audits:update-corrective-actions` - Update action progress
- `audits:verify-corrective-actions` - Verify action effectiveness

## Database Schema

The vertical requires the following database tables:
- `audits` - Main audit records
- `audit_findings` - Audit findings
- `corrective_actions` - Corrective action plans
- `audit_templates` - Reusable audit templates
- `audit_checklist_responses` - Completed checklist items

## Development

### Build
```bash
npm run build
```

### Test
```bash
npm test
npm run test:coverage
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npm run typecheck
```

## Integration Points

This vertical integrates with:
- **Core Package** - Base types, database, permissions
- **Caregiver Staff** - Link findings to specific caregivers
- **Client Demographics** - Link findings to specific clients
- **Training Management** - Track training-related findings
- **Documentation** - Reference documentation deficiencies

## Future Enhancements

Planned features:
- AI-powered finding categorization
- Automated compliance score calculations
- Trend analysis and predictive analytics
- Mobile audit app for on-site inspections
- Photo/video evidence capture
- Digital signature support
- Automated notifications for overdue actions
- Integration with external audit agencies
- Customizable audit templates
- Report generation (PDF, Excel)

## License

Copyright © 2024 Care Commons
