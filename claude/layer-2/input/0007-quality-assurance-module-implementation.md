# Task 0007: Implement Quality Assurance & Audits Module

**Priority**: 🟡 MEDIUM
**Phase**: Phase 2 - Feature Completeness
**Estimated Effort**: 10-12 hours

## Context

The QA vertical has database schema ready but lacks the service logic and UI for conducting quality audits, tracking corrective actions, and generating QA reports.

## Existing Foundation

- ✅ Database schema: `quality_audits`, `audit_findings`, `corrective_actions`, `qa_metrics`
- ⚠️ Service logic needed
- ⚠️ Frontend UI needed

## Task

### 1. Implement QA Service Logic

**File**: `verticals/quality-assurance-audits/src/services/qa.service.ts`

**Methods to Implement**:

```typescript
// Create audit from template
createAudit(auditData: CreateAuditDTO): Promise<QualityAudit>

// Conduct audit (visit, caregiver, process audit)
conductAudit(auditId: string, responses: AuditResponse[]): Promise<QualityAudit>

// Record findings
recordFinding(auditId: string, finding: FindingDTO): Promise<AuditFinding>

// Create corrective action plan
createCorrectiveAction(findingId: string, action: CorrectiveActionDTO): Promise<CorrectiveAction>

// Track corrective action completion
updateCorrectiveAction(actionId: string, status: ActionStatus): Promise<CorrectiveAction>

// Calculate QA scores
calculateAuditScore(auditId: string): Promise<number>

// Generate QA metrics
generateQAMetrics(dateRange: DateRange): Promise<QAMetrics>
```

**Audit Types**:
1. **Visit Quality Audit**: Review caregiver visit documentation
2. **Caregiver Performance Audit**: Review caregiver skills and compliance
3. **Documentation Audit**: Review care plan and task documentation
4. **Process Audit**: Review agency processes and procedures

### 2. Create Audit Templates Service

**File**: `verticals/quality-assurance-audits/src/services/audit-template.service.ts`

**Predefined Templates**:
- HIPAA Compliance Audit (checklist of HIPAA requirements)
- EVV Compliance Audit (state-specific EVV requirements)
- Care Plan Audit (review care plan quality and outcomes)
- Medication Administration Audit (if applicable)
- Infection Control Audit (COVID-19, hygiene practices)

**Template Structure**:
```typescript
interface AuditTemplate {
  id: string;
  name: string;
  description: string;
  categories: AuditCategory[];
  scoringMethod: 'pass-fail' | 'weighted' | 'percentage';
}

interface AuditCategory {
  name: string;
  weight: number; // for weighted scoring
  questions: AuditQuestion[];
}

interface AuditQuestion {
  id: string;
  text: string;
  type: 'yes-no' | 'scale' | 'text' | 'multiple-choice';
  required: boolean;
  weight?: number;
  passingCriteria?: any;
}
```

### 3. Implement Frontend UI

**Audit Management** (`packages/web/src/app/pages/quality-assurance/AuditsPage.tsx`):
- List all audits (scheduled, in-progress, completed)
- Filter by type, status, date, auditor
- Create new audit from template
- Schedule recurring audits

**Conduct Audit** (`packages/web/src/app/pages/quality-assurance/ConductAuditPage.tsx`):
- Display audit questions by category
- Capture responses (checkboxes, radio, text, ratings)
- Save progress (draft mode)
- Record findings with severity (critical, major, minor)
- Assign corrective actions
- Submit audit for review

**Audit Detail** (`packages/web/src/app/pages/quality-assurance/AuditDetailPage.tsx`):
- View completed audit
- See all findings
- Track corrective actions status
- View audit score
- Export audit report as PDF

**Corrective Actions** (`packages/web/src/app/pages/quality-assurance/CorrectiveActionsPage.tsx`):
- List all corrective actions
- Filter by status (open, in-progress, completed, overdue)
- Assign to responsible party
- Track completion with evidence
- Send reminders for overdue actions

**QA Dashboard** (`packages/web/src/app/pages/quality-assurance/QADashboardPage.tsx`):
- Overall QA score trend
- Audits by status
- Top findings by category
- Corrective actions completion rate
- Compliance scores by audit type

### 4. Create Components

**Components** (`packages/web/src/app/pages/quality-assurance/components/`):
- `AuditTemplateSelector.tsx` - Select audit template
- `AuditQuestionCard.tsx` - Display single audit question
- `FindingCard.tsx` - Display audit finding with severity
- `CorrectiveActionCard.tsx` - Display corrective action with status
- `QAScoreGauge.tsx` - Visual score display
- `AuditTimeline.tsx` - Audit lifecycle timeline

### 5. Add Notifications

**Notifications for**:
- New audit assigned to auditor
- Corrective action assigned
- Corrective action overdue (email reminder)
- Critical findings requiring immediate attention
- Audit report available for review

### 6. Add Integrations

**Integrate with Other Verticals**:
- **Care Plans**: Audit care plan quality and outcomes
- **Visits**: Audit visit documentation and compliance
- **Caregivers**: Audit caregiver performance and credentials
- **EVV**: Audit EVV compliance (geofencing, timestamps)

**Data Collection**:
- Pull visit data for visit quality audits
- Pull caregiver data for performance audits
- Pull care plan data for documentation audits

### 7. Implement Reporting

**QA Reports** (`packages/web/src/app/pages/quality-assurance/ReportsPage.tsx`):
- **Audit Summary Report**: All audits in date range
- **Findings Report**: All findings by category/severity
- **Corrective Actions Report**: Status and completion
- **Compliance Trend Report**: Scores over time
- **Caregiver QA Report**: QA scores by caregiver
- **Agency Accreditation Report**: For accreditation bodies

**Export Formats**:
- PDF (formatted for accreditation review)
- Excel (data analysis)
- CSV (raw data)

## User Stories

1. **As a QA manager**, I can create audits from templates and schedule them
2. **As an auditor**, I can conduct audits using a structured checklist
3. **As an auditor**, I can record findings and assign corrective actions
4. **As a coordinator**, I can track corrective actions assigned to my team
5. **As a caregiver**, I can view corrective actions assigned to me and mark them complete
6. **As an administrator**, I can view QA metrics and compliance trends
7. **As an administrator**, I can generate reports for accreditation bodies

## Audit Best Practices

- **Random Sampling**: Randomly select visits/caregivers to avoid bias
- **Regular Schedule**: Conduct audits on a regular schedule (monthly, quarterly)
- **Anonymous Feedback**: Option for anonymous caregiver feedback
- **Root Cause Analysis**: For recurring findings, conduct root cause analysis
- **Continuous Improvement**: Track metrics over time to measure improvement

## Acceptance Criteria

- [ ] QA service logic implemented
- [ ] Audit template service with predefined templates
- [ ] Frontend UI for audit management
- [ ] Conduct audit interface functional
- [ ] Findings and corrective actions tracking
- [ ] QA dashboard with metrics
- [ ] Notifications for assignments and reminders
- [ ] Integration with other verticals (care plans, visits, caregivers)
- [ ] Reporting and export functionality
- [ ] Tests for scoring algorithms
- [ ] Works end-to-end in local dev

## Compliance Considerations

- **HIPAA**: Audit PHI access and handling
- **State Regulations**: State-specific QA requirements
- **Accreditation**: CHAP, ACHC, Joint Commission standards
- **CMS**: Medicare/Medicaid quality measures

## Reference

- Joint Commission Standards for Home Care
- CHAP Accreditation Standards
- CMS Home Health Quality Measures
- State home care regulations (TX, FL, OH, PA, GA, NC, AZ)

## Future Enhancements (Document in README)

- AI-powered finding categorization
- Predictive analytics for risk areas
- Automated audit scheduling
- Mobile app for field audits
- Voice-to-text for audit notes
