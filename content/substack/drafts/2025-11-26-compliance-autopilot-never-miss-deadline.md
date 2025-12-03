---
title: "Compliance Tracking in Home Healthcare: Why It's Broken and How to Fix It"
subtitle: "Folk ships proactive compliance monitoring"
scheduled_date: 2025-11-26
image_prompt: "Flat illustration showing a dashboard with credential expiration dates, warning indicators, calendar with deadlines, warm earth tones (orange, brown, cream, olive green), simple geometric shapes, organized and precise aesthetic"
tags: [compliance, product, technical]
category: Product
---

# Compliance Tracking in Home Healthcare: Why It's Broken and How to Fix It

CMS proposed new home health conditions of participation in October 2025, adding requirements for infection control documentation and emergency preparedness. Meanwhile, states continue tightening EVV enforcement—Texas HHSC issued 47 enforcement actions in Q3 2025 alone, mostly for visit verification failures.

Home healthcare agencies face a compliance environment that gets more complex every year. The tools they have to manage it haven't kept pace.

This article explains what compliance tracking actually requires, why existing solutions fail, and what Folk built to address the gap.

---

## What Compliance Tracking Means in Home Healthcare

Home healthcare compliance isn't a single thing. It's several distinct tracking problems that interact:

**Caregiver credentials.** Each caregiver has multiple documents that expire on different schedules:

| Credential | Typical Cycle | Consequence if Expired |
|------------|---------------|------------------------|
| State license/certification | 1-2 years | Cannot legally provide care |
| CPR/First Aid | 1 year | Cannot work (most states) |
| Background check | Varies (TX: ongoing, FL: 5 years) | Cannot work |
| TB test | 1 year | Cannot work |
| HIPAA training | 1 year | Agency liability |
| Abuse/neglect training | State-specific | Agency liability |

A 50-caregiver agency has 300-500 credential expirations to track per year.

**Client authorizations.** Medicaid and insurance authorizations specify:
- Service type (personal care, skilled nursing, etc.)
- Unit allocation (hours per week/month)
- Date range (authorization period)

Exceeding authorized units means unbillable services. Expired authorizations mean the same. Both create audit findings and potential fraud exposure.

**Care plan reviews.** Federal conditions of participation require care plan updates at specified intervals (typically 60-90 days). State requirements may be stricter. Missing a review deadline is a deficiency on survey.

**EVV submission.** The 21st Century Cures Act mandates Electronic Visit Verification for Medicaid-funded personal care and home health services. States set submission windows—some require daily transmission, others weekly or monthly. Late submissions trigger compliance flags.

**Incident reporting.** Abuse, neglect, and exploitation incidents have mandatory reporting windows (24-72 hours depending on state and severity). Missing the window is itself a violation.

These five categories interact. A caregiver with an expired credential can't be scheduled, which affects visit coverage, which affects authorization utilization, which affects billing. Compliance is a constraint satisfaction problem.

---

## Why Existing Tools Fail

Enterprise home health software (HHAeXchange, Sandata, AlayaCare, WellSky) includes "compliance modules." Having evaluated several, the failures cluster into patterns:

**1. Alert-based rather than preventive.**

Most systems send reminder emails when credentials approach expiration. This puts the burden on humans to act on alerts. Alerts get buried. Coordinators have 50 other things demanding attention. The 6 AM crisis happens anyway.

Prevention means blocking non-compliant assignments at the point of scheduling, not sending emails that may or may not be read.

**2. Generic rather than state-specific.**

Texas requires Employee Misconduct Registry checks. Florida requires Level 2 background screening with a 5-year lifecycle. Ohio has different rules. Pennsylvania different still.

Enterprise vendors sell nationwide and configure for the lowest common denominator. Agencies either accept generic rules that don't match their state's requirements, or pay consultants to customize. Neither is acceptable.

**3. Siloed rather than integrated.**

Credential tracking lives in one module. Scheduling in another. Authorization management in a third. They don't talk to each other in real-time.

A coordinator scheduling a visit doesn't see that the caregiver's CPR expired yesterday. They find out later, when the visit has already happened and the compliance violation is already logged.

**4. Reporting-focused rather than operational.**

Enterprise compliance tools are designed to generate reports for audits. They answer "what happened" well. They answer "what should I do right now" poorly.

An audit report showing credential expiration history doesn't help a coordinator at 6 AM who needs to know which caregivers can legally work today.

---

## What Folk Built

We shipped the Compliance Autopilot this week. It addresses each failure mode directly.

### Preventive Enforcement

When a coordinator schedules a visit, the system checks caregiver compliance in real-time:

```typescript
async canCaregiverBeScheduled(
  organizationId: UUID,
  caregiverId: UUID
): Promise<{ canSchedule: boolean; reasons: string[] }> {
  const status = await this.getCaregiverCredentialStatus(
    organizationId, 
    caregiverId
  );
  
  return {
    canSchedule: status.blockingIssues.length === 0,
    reasons: status.blockingIssues,
  };
}
```

Non-compliant assignments are blocked with specific reasons:

```
Assignment Blocked: Maria Garcia has compliance issues
- CPR certification expired (Nov 20, 2025)
- Background check expiring in 5 days

Supervisor can force assignment with documented override.
```

The system prevents violations rather than documenting them after the fact. Supervisors can override when operational necessity requires it, but the override is logged for audit purposes.

### State-Specific Rules

Compliance rules are modeled per state:

```typescript
interface StateComplianceRules {
  backgroundCheckLifecycle: number;  // FL: 5 years, TX: varies
  nurseAideRegistryRequired: boolean; // TX: Employee Misconduct Registry
  evvAggregator: 'HHAeXchange' | 'Sandata' | 'Other';
  clockInGracePeriod: number;  // TX: 10 min, FL: 15 min
  geofenceBase: number;  // TX: 100m, FL: 150m
}
```

Texas agencies get Texas rules. Florida agencies get Florida rules. The configuration is built-in, not consultant-dependent.

This matters because state-specific compliance is where agencies get burned. Generic systems either under-enforce (missing state requirements) or over-enforce (blocking things that are actually permitted). Both create problems.

### Integrated Constraint Checking

Credentials, authorizations, and scheduling share a unified data model. When any constraint changes, dependent calculations update immediately.

A credential expiration doesn't just update a report—it flags affected scheduled visits, alerts relevant supervisors, and blocks future assignments until resolved.

Authorization utilization is tracked in real-time:

```
CLIENT AUTHORIZATION STATUS
Martha Johnson - Personal Care
36 / 40 hours used (90%)
Projected exhaustion: Dec 3
```

Coordinators see utilization when scheduling, not after they've over-scheduled.

### Proactive Dashboard

The compliance dashboard shows operational state, not just historical reports:

| Category | Count | Action Required |
|----------|-------|-----------------|
| Overdue | 2 | Immediate attention |
| Urgent (7 days) | 7 | This week |
| Warning (30 days) | 23 | Plan ahead |
| Compliant caregivers | 45/50 | - |

Each item links directly to the resolution action—update credential, request authorization extension, schedule supervision visit.

This answers "what should I do right now" rather than "what happened historically."

### Scheduled Scanning

A cron job runs daily compliance scans:

```typescript
// Runs at 6 AM local time
const urgentDeadlines = await complianceService.scanForDeadlines(
  organizationId,
  { urgentDays: 7, warningDays: 30 }
);

// Send notifications with rate limiting to prevent alert fatigue
await notificationService.sendDeadlineNotifications(
  organizationId,
  urgentDeadlines
);
```

Supervisors receive morning digests summarizing compliance status. Caregivers receive alerts for their own expiring credentials. The system is proactive rather than reactive.

---

## Differentiation from Enterprise Vendors

The honest comparison:

| Capability | Enterprise Vendors | Folk |
|------------|-------------------|--------------|
| Credential tracking | Yes | Yes |
| State-specific rules | Configuration required | Built-in |
| Real-time scheduling blocks | Partial | Yes |
| Authorization tracking | Separate module | Integrated |
| Audit reports | Yes | Yes |
| Proactive dashboard | Limited | Yes |
| Offline credential status | No | Yes |
| Pricing | $500-2000/month | Open source |

Enterprise vendors have advantages: larger support teams, more integrations, established relationships with state aggregators. For large agencies (500+ caregivers), those advantages may outweigh the limitations.

For small-to-medium agencies (10-200 caregivers), the enterprise tradeoffs are worse. You pay for features you don't use, configure around state-specific gaps, and still end up with alert-based rather than preventive compliance.

Folk is built for the latter segment.

---

## Technical Implementation Notes

For those interested in the architecture:

**Database schema.** Credentials are stored with expiration dates and category metadata. Categories define blocking behavior and warning thresholds. State-specific rules are stored as configuration, not hardcoded.

**Constraint checking.** Compliance checks run as database queries, not application-level loops. A single query returns all blocking issues for a caregiver. This scales to agencies with hundreds of caregivers.

**Notification rate limiting.** Alert fatigue is a real problem. The system limits notification frequency: overdue items notify daily (max 7 times), urgent items every 48 hours (max 3 times), warnings once. Supervisors aren't buried in repetitive alerts.

**Offline sync.** The mobile app caches credential status for offline access. Caregivers see their compliance state even without connectivity. The cache refreshes on connection with conflict resolution for any status changes.

**Audit trail.** All compliance state changes are logged: credential updates, override approvals, notification sends. The audit report reconstructs compliance state at any historical point.

---

## What's Next

The Compliance Autopilot ships with credential and authorization tracking. Planned additions:

- **Care plan review scheduling** - Automated 60/90-day review reminders with care plan versioning
- **Incident report deadlines** - State-specific mandatory reporting windows
- **EVV submission monitoring** - Aggregator submission status and deadline tracking
- **OIG/SAM exclusion checks** - Automated exclusion list screening (already implemented in backend, pending UI)

Each addition follows the same pattern: state-specific rules, real-time constraint checking, proactive rather than reactive.

---

## Try It

The Compliance Autopilot is live:

- **Production:** [folk.care/compliance](https://folk.care/compliance)
- **Showcase:** [folk.care](https://folk.care/)
- **Source:** [github.com/neighborhood-lab/folkcare](https://github.com/neighborhood-lab/folkcare)

Folk is open source under MIT license. Contributions welcome, especially state-specific compliance rules from practitioners who know their state's requirements.

---

*Brian Edwards builds Folk with Neighborhood Lab. Contact: brian.mabry.edwards@gmail.com*
