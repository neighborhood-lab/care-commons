---
title: "The 6 AM Phone Call Nobody Wants"
subtitle: "How we built a compliance autopilot that actually understands home healthcare"
scheduled_date: 2025-11-26
image_prompt: "Flat illustration showing a shield protecting a calendar with green checkmarks, credentials and certificates floating around with visible expiration dates highlighted in orange, a coordinator looking relieved at a clean organized dashboard on their computer, warm earth tones (orange, brown, cream, olive green), simple geometric shapes, organized and calm aesthetic, no complexity"
tags: [compliance, product, technical]
category: Technical + Product Guide
---

# The 6 AM Phone Call Nobody Wants

Rosa Mendez was already awake when her phone buzzed at 6:14 AM. After twenty-three years running a home health agency in San Antonio, she'd developed a sixth sense for trouble.

"Mrs. Chen's caregiver can't work today," her scheduler said. "Her CPR certification expired. Yesterday."

Rosa closed her eyes. Three visits scheduled. One caregiver blocked. Twelve phone calls to make before 8 AM. A compliance violation already logged because they'd assigned her to a visit last week with an expired credential.

This is the hidden tax of home healthcare compliance. Not the regulations themselves—those exist to protect vulnerable people, and Rosa respects that. The tax is the *management* of compliance: tracking dozens of caregivers, each with multiple credentials, each with different expiration dates, each governed by state-specific rules that nobody outside the industry truly understands.

Enterprise software vendors love to sell "compliance modules." They're usually glorified spreadsheets with reminder emails. They don't understand that a CPR expiration in Texas triggers different rules than one in Florida. They don't know that some credentials block scheduling while others just require documentation. They don't grasp that a coordinator at 6 AM needs answers, not alerts.

So we built something different.

---

## What Compliance Actually Looks Like

Before I show you what we built, let me explain what we're solving. Home healthcare compliance isn't a checkbox exercise. It's a constraint satisfaction problem with cascading dependencies.

Consider a single caregiver in Texas. They might need:

- **State license** (expires every 2 years)
- **CPR/First Aid certification** (expires annually)
- **Background check clearance** (varies by state—Texas requires Employee Misconduct Registry checks)
- **TB test** (annual in most states)
- **HIPAA training** (annual)
- **Abuse/neglect training** (state-specific intervals)
- **COVID vaccination records** (if serving certain populations)
- **Vehicle insurance** (if transporting clients)
- **Professional liability coverage** (agency-specific)

Now multiply that by 50 caregivers. Each credential has different warning periods. Some block scheduling immediately upon expiration. Others trigger warnings but allow continued work with documentation. State regulations vary dramatically—what's acceptable in Florida might violate Texas HHSC rules under 26 TAC §558.

And that's just caregiver credentials. We haven't touched:

- **Client authorizations** (Medicaid service units that deplete and expire)
- **Care plan reviews** (60-90 day intervals depending on service type)
- **RN supervision visits** (required every 60 days for skilled nursing clients in some states)
- **Incident report filing deadlines** (24-72 hours depending on severity and state)
- **EVV submission windows** (daily, weekly, or monthly depending on aggregator)

A coordinator managing all this manually is setting themselves up for failure. The spreadsheet will fall behind. The reminder email will get buried. The 6 AM phone call will come.

---

## Building the Compliance Autopilot

We shipped the [Compliance Autopilot](https://care-commons.vercel.app/compliance) this week. Here's what it does and why it matters.

### Proactive Scanning

The system continuously scans your organization for compliance deadlines. Not just "things that expired" but "things that will expire in 30/14/7 days." The dashboard shows you:

```
┌─────────────────────────────────────────────────────────────┐
│  OVERDUE          DUE SOON         CAREGIVERS      UPCOMING │
│     2                7              45/50              23    │
│  ▓▓▓▓▓▓▓▓         ░░░░░░░░       compliant          items   │
│  Requires         Action                              30d   │
│  attention        this week                                 │
└─────────────────────────────────────────────────────────────┘
```

Those two overdue items? You see them immediately. Not buried in a report. Not waiting for someone to check. Right there, categorized by severity, with direct links to take action.

### Intelligent Categorization

Not all deadlines are equal. A caregiver's license expiration is critical—they legally cannot provide care. A training certificate that's due for renewal is important but might not block scheduling.

We built this understanding into the system:

```typescript
const DEADLINE_CATEGORIES = {
  CAREGIVER_CREDENTIAL: {
    blocksScheduling: true,
    blocksAssignment: true,
    warningDays: 30,
    urgentDays: 7,
  },
  CAREGIVER_TRAINING: {
    blocksScheduling: false,
    blocksAssignment: false,
    warningDays: 30,
    urgentDays: 14,
  },
  CLIENT_AUTHORIZATION: {
    blocksScheduling: true,  // Can't bill for unauthorized services
    warningDays: 14,
    urgentDays: 7,
  },
  // ... 10+ more categories with state-specific variations
};
```

This isn't configuration—it's domain knowledge encoded as software. We read the regulations so coordinators don't have to interpret them at 6 AM.

### Authorization Usage Tracking

One of the most insidious compliance failures is authorization exhaustion. A client is approved for 40 hours per month of personal care. You schedule 42 hours. Now you have two hours of unbillable service, potential Medicaid fraud exposure, and an unhappy caregiver who might not get paid.

The Autopilot tracks usage in real-time:

```
┌──────────────────────────────────────────────────────────┐
│ AUTHORIZATION ALERTS                                      │
├──────────────────────────────────────────────────────────┤
│ Martha Johnson                                            │
│ 36 / 40 units used (90%)                    ⚠️ WARNING   │
│ Projected exhaust: Dec 3                                  │
│                                                          │
│ Robert Williams                                           │
│ 40 / 40 units used (100%)                   🔴 EXHAUSTED │
│ Authorization expires: Nov 30                             │
└──────────────────────────────────────────────────────────┘
```

You see the problem before it becomes a crisis. You can reduce visit frequency, request authorization increases, or have the difficult conversation with the family—on your terms, not in a panic.

### One-Click Audit Reports

Every home health agency dreads the audit. Whether it's Medicaid program integrity, state licensing boards, or accreditation surveyors, the request is always the same: "Show us your compliance documentation."

The Autopilot generates audit-ready reports:

```typescript
const report = await complianceService.generateAuditReport(
  organizationId,
  startDate,
  endDate
);

// Returns comprehensive data:
// - Caregiver credential status at any point in time
// - Authorization usage history
// - Care plan review compliance
// - EVV submission rates
// - Historical compliance trends
```

What used to take two days of pulling records now takes two seconds. And because the data is already structured and validated, you know it's accurate before the auditor sees it.

---

## The Technical Foundation

Building this required solving several hard problems.

### Real-Time Constraint Checking

When a coordinator assigns a caregiver to a visit, we need to check compliance instantly. Not "eventually consistent." Not "check back in a few minutes." Immediate feedback.

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

If a caregiver's CPR is expired, the scheduling UI shows it immediately. The coordinator can't accidentally create a non-compliant visit. The system prevents the problem instead of documenting it after the fact.

### State-Specific Validation

Texas and Florida don't just have different regulations—they have different regulatory *structures*. Texas HHSC enforces through the Health and Human Services Commission. Florida uses AHCA (Agency for Health Care Administration). The rules don't just differ in content; they differ in how they're applied.

We modeled this explicitly:

```typescript
interface StateComplianceRules {
  backgroundCheckLifecycle: number;  // Florida: 5 years, Texas: varies
  nursAideRegistryRequired: boolean;  // Texas: yes (Employee Misconduct)
  evvAggregator: 'HHAeXchange' | 'Sandata' | 'Other';
  clockInGracePeriod: number;  // Texas: 10 min, Florida: 15 min
  geofenceBase: number;  // Texas: 100m, Florida: 150m
  // ... dozens more state-specific parameters
}
```

When you configure your agency for Texas, you get Texas rules. Not generic rules that sort of apply. Not enterprise "compliance modules" that require you to customize everything yourself. Actual Texas rules, maintained by people who read 26 TAC §558 so you don't have to.

### Offline-First Compliance

Here's something enterprise vendors never consider: what happens when a caregiver is at a client's home with no cell signal?

They still need to know if they're compliant. They still need to document their visit. They still need confidence that they're not violating regulations.

The Autopilot syncs compliance status to the mobile app. Caregivers see their credential status offline. The app warns them if something is expiring. They can make informed decisions even in that basement apartment with no connectivity.

This is what "offline-first" actually means. Not just caching data—understanding which data matters for which decisions and ensuring it's available when decisions need to be made.

---

## What This Means for Agencies

If you're running a home health agency, here's what the Compliance Autopilot gives you:

**No more surprise expirations.** You see credentials approaching expiration 30 days out. Plenty of time to renew, document, or plan coverage.

**No more unauthorized scheduling.** The system blocks non-compliant assignments before they happen. You can't accidentally create a compliance violation.

**No more audit panic.** Reports generate instantly. Documentation is structured and complete. Surveyors get what they need; you get back to running your agency.

**No more generic software.** Your state's rules are built in. You're not paying consultants to customize enterprise software to match regulations you're already required to follow.

---

## Try It Today

The Compliance Autopilot is live in [Care Commons](https://care-commons.vercel.app/compliance). You can explore it in our [interactive showcase](https://neighborhood-lab.github.io/care-commons/) or spin up your own instance.

This is what community-owned healthcare software looks like. Not compliance as a profit center. Not "modules" that require consultants. Just working software that respects the people who use it.

Rosa Mendez still gets early morning calls. But now they're about client care, not credential chaos. The system handles compliance so she can focus on what matters: the people she serves.

---

*Brian Edwards builds Care Commons with [Neighborhood Lab](https://neighborhoodlab.org). Join us on [Discord](https://discord.gg/EkeXQZFq) or support the project on [Patreon](https://www.patreon.com/cw/neighborhood_lab).*
