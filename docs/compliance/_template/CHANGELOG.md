# [STATE NAME] Regulatory Changelog

**State Code**: [XX]

This document tracks changes to [STATE] home healthcare regulations and how they affect Care Commons implementation.

## How to Use This Document

When regulations change:

1. **Document the change** - Add entry below with date, regulation reference, and description
2. **Update REQUIREMENTS.md** - Modify requirement documentation to reflect new rules
3. **Update validators** - Change compliance validation logic in code
4. **Update tests** - Modify test scenarios to match new requirements
5. **Update configuration** - Adjust state config values if needed
6. **Deploy** - Follow deployment process to push changes to production
7. **Notify customers** - Alert agencies to regulatory changes and system updates

---

## Change Format

```markdown
## [YYYY-MM-DD] - [Regulation Reference]

### Change Description
[What changed in the regulation]

### Effective Date
[When the change takes effect - may differ from announcement date]

### Impact Analysis
- **Severity**: [Critical / High / Medium / Low]
- **Affected Components**: [List of code modules affected]
- **Customer Impact**: [How this affects agencies using the system]
- **Breaking Change**: [Yes/No]

### Implementation Changes

#### Requirements Documentation
- Updated: [REQUIREMENTS.md sections modified]
- Added: [New requirements added]
- Removed: [Deprecated requirements]

#### Code Changes
- Files modified: [List of files]
- Database migrations: [Yes/No - migration file name]
- Configuration updates: [Changes to state config]

#### Test Updates
- New test scenarios: [Count]
- Modified tests: [List]
- Removed tests: [List]

### Deployment Notes
[Special considerations for deploying this change]

### Customer Communication
**Subject**: [STATE] Regulation Change - [Brief Description]

**Message Template**:
[Draft email to send to customers]

### References
- Regulation text: [URL]
- State announcement: [URL]
- Official guidance: [URL]
- Care Commons GitHub PR: [URL]
```

---

## 2025

### [Example Entry - Delete This]

## 2025-01-15 - Background Screening Frequency Change

### Change Description
[STATE] Department of [AGENCY] amended [Code §X.XXX] to require background screening every 6 months instead of annually for caregivers serving vulnerable adults.

### Effective Date
2025-03-01 (90-day implementation window)

### Impact Analysis
- **Severity**: High
- **Affected Components**: 
  - Caregiver credential validator
  - Background screening expiration checks
  - Automated renewal reminders
- **Customer Impact**: Agencies must re-screen 47% of caregivers within 90 days
- **Breaking Change**: Yes - existing 12-month rule no longer valid

### Implementation Changes

#### Requirements Documentation
- Updated: REQUIREMENTS.md §1.1 Background Screening
  - Changed frequency from ANNUAL to SEMI_ANNUAL
  - Changed expiration from 365 days to 180 days
  - Added guidance on transitional period

#### Code Changes
```typescript
// packages/core/src/compliance/[state]/credentials.ts
// BEFORE:
backgroundScreening: {
  frequency: 'ANNUAL',
  expiration: 365,
}

// AFTER:
backgroundScreening: {
  frequency: 'SEMI_ANNUAL',
  expiration: 180,
}
```

- Files modified:
  - `packages/core/src/compliance/[state]/credentials.ts`
  - `packages/core/src/compliance/[state]/__tests__/credentials.test.ts`
- Database migrations: No (uses existing fields)
- Configuration updates: Updated expiration constant

#### Test Updates
- Modified tests:
  - `BS-002 - Expired Background Check` (365 days → 180 days)
  - `BS-003 - Background Check Expiring Soon` (adjusted thresholds)
- New test scenarios: 1
  - `BS-007 - Transitional Period Grace` (90-day window)

### Deployment Notes
- Deploy before 2025-03-01 effective date
- Enable transitional grace period: 90 days from effective date
- During transition, warn but don't block on 180-365 day checks
- After 2025-05-30, enforce strict 180-day rule

### Customer Communication
**Subject**: [STATE] Background Screening Now Required Every 6 Months

**Message**:
Dear Care Commons Customer,

Effective March 1, 2025, [STATE] requires background screening for caregivers serving vulnerable adults every 6 months instead of annually.

**What this means for you:**
- Caregivers with background checks older than 6 months will need re-screening
- Care Commons will automatically flag affected caregivers starting March 1
- You have a 90-day grace period (until May 30, 2025) to complete re-screening
- Automated reminders will be sent 30 days before expiration

**Action required:**
1. Review the list of affected caregivers (available in Reports > Compliance)
2. Schedule re-screening for caregivers serving vulnerable adults
3. Upload results to Care Commons within 90 days

**System updates:**
- Deployed: February 15, 2025
- Grace period: March 1 - May 30, 2025
- Full enforcement: May 31, 2025

**Questions?**
Contact support@carecommons.org or reference [STATE] Code §X.XXX.

Best regards,  
Care Commons Team

### References
- Regulation text: https://[state].gov/code/section-x-xxx
- State announcement: https://[state-agency].gov/news/2025/background-screening
- Official guidance: https://[state-agency].gov/bulletins/2025-001
- Care Commons GitHub PR: #123

---

## 2024

### [Previous changes would be listed here]

---

## Monitoring for Changes

### Official Sources to Monitor

- **[STATE] Medicaid Website**: [URL] - Check monthly
- **[STATE] Register of Regulations**: [URL] - Subscribe to alerts
- **[STATE AGENCY] Bulletins**: [URL] - Email subscription
- **Industry Associations**: 
  - [STATE Home Care Association]: [URL]
  - [National Association]: [URL]

### Monitoring Responsibilities

- **Primary**: [Name/Role] - Daily monitoring
- **Backup**: [Name/Role] - Weekly review
- **Escalation**: [Name/Role] - Regulatory interpretation

### Review Schedule

- **Weekly**: Scan official sources for proposed rules
- **Monthly**: Review state agency bulletins
- **Quarterly**: Full compliance audit against current regulations
- **Annually**: Comprehensive regulation review and documentation update

### Alert Triggers

Set up automated alerts for:
- "[STATE] Medicaid" + "home health"
- "[STATE] [AGENCY]" + "rule change"
- "[STATE]" + "EVV" + "update"
- "[STATE]" + "background screening"
- "[STATE]" + "license" + "requirement"

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | [YYYY-MM-DD] | Initial documentation | [Name] |

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
