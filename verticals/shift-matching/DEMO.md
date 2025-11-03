# Shift Matching & Assignment Demo

This document provides hands-on demonstrations of the Shift Matching &
Assignment vertical, showing real-world workflows for schedulers, caregivers,
and administrators.

## Table of Contents

1. [Setup](#setup)
2. [Scheduler Workflows](#scheduler-workflows)
3. [Caregiver Workflows](#caregiver-workflows)
4. [Admin Workflows](#admin-workflows)
5. [Analytics & Reporting](#analytics--reporting)

---

## Setup

### Database Setup

1. Run the core migration:

```bash
psql -d care_commons -f packages/core/migrations/007_shift_matching.sql
```

2. Seed demo data:

```bash
cd packages/core
npx ts-node scripts/seed-shift-matching.ts
```

This creates:

- **1 default matching configuration** with balanced weights
- **10 unassigned visits** spread over the next 7 days
- **10 open shifts** with varying requirements and priorities
- **Caregiver preferences** for all active caregivers
- **3 proposal scenarios**: accepted, rejected, and pending

### Import the Service

```typescript
import { Pool } from 'pg';
import {
  ShiftMatchingService,
  ShiftMatchingHandlers,
} from '@care-commons/shift-matching';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const service = new ShiftMatchingService(pool);
const handlers = new ShiftMatchingHandlers(pool);
```

---

## Scheduler Workflows

### Workflow 1: Create an Open Shift

**Scenario**: A client calls to request a visit, but no caregiver is assigned
yet.

```typescript
import { UserContext } from '@care-commons/core';

const context: UserContext = {
  userId: 'scheduler-uuid',
  organizationId: 'org-uuid',
  branchIds: ['branch-uuid'],
  roles: ['SCHEDULER'],
  permissions: ['shifts:create', 'shifts:match'],
};

// Create open shift from an unassigned visit
const openShift = await handlers.createOpenShift(
  {
    visitId: 'visit-uuid',
    priority: 'HIGH',
    fillByDate: new Date('2025-01-30T08:00:00Z'),
    internalNotes: 'Client prefers morning shifts',
  },
  context
);

console.log('Open shift created:', openShift.id);
console.log('Status:', openShift.matchingStatus); // 'NEW'
console.log('Priority:', openShift.priority); // 'HIGH'
```

### Workflow 2: Run Matching Algorithm

**Scenario**: Find the best caregivers for an open shift and send proposals.

```typescript
// Run matching for the open shift
const result = await handlers.matchOpenShift(
  openShift.id,
  {
    autoPropose: true, // Automatically send proposals to top matches
    maxCandidates: 5, // Send to top 5 matches
  },
  context
);

console.log('Matching complete!');
console.log('Eligible candidates:', result.eligibleCount);
console.log('Ineligible candidates:', result.ineligibleCount);
console.log('Proposals sent:', result.proposalsCreated.length);

// Review top candidates
result.candidates.slice(0, 5).forEach((candidate, index) => {
  console.log(`\n${index + 1}. ${candidate.caregiverName}`);
  console.log(
    `   Score: ${candidate.overallScore}/100 (${candidate.matchQuality})`
  );
  console.log(`   Distance: ${candidate.distanceFromShift?.toFixed(1)} miles`);
  console.log(`   Eligible: ${candidate.isEligible ? 'Yes' : 'No'}`);

  if (!candidate.isEligible) {
    console.log(`   Issues:`);
    candidate.eligibilityIssues.forEach((issue) => {
      console.log(`     - [${issue.severity}] ${issue.message}`);
    });
  }

  console.log(`   Reasons:`);
  candidate.matchReasons.forEach((reason) => {
    const sign =
      reason.impact === 'POSITIVE'
        ? '+'
        : reason.impact === 'NEGATIVE'
          ? '-'
          : '=';
    console.log(`     ${sign} ${reason.description}`);
  });
});
```

**Example Output**:

```
Matching complete!
Eligible candidates: 6
Ineligible candidates: 2
Proposals sent: 5

1. Sarah Johnson
   Score: 92/100 (EXCELLENT)
   Distance: 3.2 miles
   Eligible: Yes
   Reasons:
     + Has all required skills and certifications
     + No schedule conflicts
     + Close to client location
     + Preferred by client
     + Highly reliable performer

2. Michael Chen
   Score: 85/100 (EXCELLENT)
   Distance: 7.5 miles
   Eligible: Yes
   Reasons:
     + Has required skills
     + Available for shift
     + Has 8 previous visit(s) with this client
     + Client rating: 4.8/5

3. Emily Rodriguez
   Score: 78/100 (GOOD)
   Distance: 12.1 miles
   Eligible: Yes
   Reasons:
     + Perfect skill match
     + No conflicts
     = Moderate distance from client
```

### Workflow 3: Monitor Proposal Responses

**Scenario**: Check which proposals have been accepted/rejected.

```typescript
// Get all proposals for a shift
const proposals = await handlers.getProposalsForShift(openShift.id, context);

proposals.forEach((proposal) => {
  console.log(`\nCaregiver: ${proposal.caregiverId}`);
  console.log(`Status: ${proposal.proposalStatus}`);
  console.log(`Match Score: ${proposal.matchScore}`);
  console.log(`Sent: ${proposal.sentAt}`);

  if (proposal.viewedAt) {
    console.log(`Viewed: ${proposal.viewedAt}`);
  }

  if (proposal.proposalStatus === 'ACCEPTED') {
    console.log(`✅ Accepted at: ${proposal.acceptedAt}`);
  } else if (proposal.proposalStatus === 'REJECTED') {
    console.log(`❌ Rejected: ${proposal.rejectionReason}`);
    console.log(`   Category: ${proposal.rejectionCategory}`);
  }
});
```

### Workflow 4: Manually Create a Proposal

**Scenario**: Scheduler manually assigns a specific caregiver to a shift.

```typescript
const proposal = await handlers.createManualProposal(
  {
    openShiftId: openShift.id,
    caregiverId: 'preferred-caregiver-uuid',
    proposalMethod: 'MANUAL',
    sendNotification: true,
    notificationMethod: 'SMS',
    urgencyFlag: true,
    notes: 'Client specifically requested this caregiver',
  },
  context
);

console.log('Manual proposal created:', proposal.id);
console.log('Match score:', proposal.matchScore);
```

### Workflow 5: Search Open Shifts

**Scenario**: Find all urgent open shifts that need attention.

```typescript
const urgentShifts = await handlers.searchOpenShifts(
  {
    organizationId: 'org-uuid',
    priority: ['HIGH', 'CRITICAL'],
    isUrgent: true,
    matchingStatus: ['NEW', 'NO_MATCH', 'MATCHED'],
    dateFrom: new Date(),
    dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
  },
  { page: 1, limit: 20, sortBy: 'fill_by_date', sortOrder: 'asc' },
  context
);

console.log(`Found ${urgentShifts.total} urgent shifts:`);
urgentShifts.items.forEach((shift) => {
  console.log(`\n- ${shift.scheduledDate} ${shift.startTime}`);
  console.log(`  Client: ${shift.clientId}`);
  console.log(`  Priority: ${shift.priority}`);
  console.log(`  Status: ${shift.matchingStatus}`);
  console.log(`  Fill by: ${shift.fillByDate}`);
  console.log(`  Attempts: ${shift.matchAttempts}`);
});
```

---

## Caregiver Workflows

### Workflow 1: Browse Available Shifts

**Scenario**: Caregiver opens the app to see shifts they're eligible for.

```typescript
const caregiverContext: UserContext = {
  userId: 'caregiver-uuid',
  organizationId: 'org-uuid',
  branchIds: ['branch-uuid'],
  roles: ['CAREGIVER'],
  permissions: ['shifts:view', 'proposals:respond'],
};

const availableShifts = await handlers.getAvailableShifts(
  caregiverContext.userId,
  caregiverContext
);

console.log(`\n📋 Available Shifts for You (${availableShifts.length}):\n`);

availableShifts.forEach((candidate, index) => {
  console.log(
    `${index + 1}. ${candidate.openShift.scheduledDate} ${candidate.openShift.startTime}-${candidate.openShift.endTime}`
  );
  console.log(`   Client: ${candidate.openShift.clientId}`);
  console.log(
    `   Location: ${candidate.distanceFromShift?.toFixed(1)} miles away`
  );
  console.log(
    `   Match: ${candidate.overallScore}/100 (${candidate.matchQuality})`
  );
  console.log(`   Duration: ${candidate.openShift.duration} minutes`);

  if (candidate.previousVisitsWithClient > 0) {
    console.log(
      `   💙 You've visited this client ${candidate.previousVisitsWithClient} times before`
    );
  }

  if (candidate.warnings.length > 0) {
    console.log(`   ⚠️  ${candidate.warnings.join(', ')}`);
  }

  console.log('');
});
```

**Example Output**:

```
📋 Available Shifts for You (8):

1. 2025-01-26 08:00:00-10:00:00
   Client: client-abc-123
   Location: 3.2 miles away
   Match: 92/100 (EXCELLENT)
   Duration: 120 minutes
   💙 You've visited this client 5 times before

2. 2025-01-26 14:00:00-16:00:00
   Client: client-def-456
   Location: 8.7 miles away
   Match: 78/100 (GOOD)
   Duration: 120 minutes
   ⚠️  Some credentials are expiring soon

3. 2025-01-27 09:00:00-11:00:00
   Client: client-ghi-789
   Location: 5.1 miles away
   Match: 85/100 (EXCELLENT)
   Duration: 120 minutes
```

### Workflow 2: View Pending Proposals

**Scenario**: Check shift proposals sent by the scheduler.

```typescript
const proposals = await handlers.getCaregiverProposals(
  caregiverContext.userId,
  ['PENDING', 'SENT', 'VIEWED'],
  caregiverContext
);

console.log(`\n🔔 You have ${proposals.length} pending shift offer(s):\n`);

proposals.forEach((proposal, index) => {
  console.log(
    `${index + 1}. Shift on ${proposal.scheduledDate} ${proposal.startTime}`
  );
  console.log(`   Match Score: ${proposal.matchScore}/100`);
  console.log(`   Sent: ${proposal.sentAt}`);
  console.log(`   ${proposal.urgencyFlag ? '🚨 URGENT' : ''}`);
  console.log(`   Proposal ID: ${proposal.id}`);
  console.log('');
});
```

### Workflow 3: Accept a Shift Proposal

**Scenario**: Caregiver accepts an offered shift.

```typescript
// Mark as viewed first
await handlers.markProposalViewed(proposal.id, caregiverContext);

// Accept the proposal
const accepted = await handlers.acceptProposal(
  proposal.id,
  'Happy to take this shift! Looking forward to seeing this client again.',
  caregiverContext
);

console.log('✅ Shift accepted successfully!');
console.log('Accepted at:', accepted.acceptedAt);
console.log('Visit ID:', accepted.visitId);
```

### Workflow 4: Reject a Shift Proposal

**Scenario**: Caregiver cannot take the shift.

```typescript
const rejected = await handlers.rejectProposal(
  proposal.id,
  'I have a family commitment that day. Sorry!',
  'PERSONAL_REASON',
  undefined,
  caregiverContext
);

console.log('Shift declined.');
console.log('Reason:', rejected.rejectionReason);
```

### Workflow 5: Self-Select a Shift

**Scenario**: Caregiver claims an available shift proactively.

```typescript
const claimedProposal = await handlers.claimShift(
  openShift.id,
  caregiverContext.userId,
  caregiverContext
);

console.log('🎉 Shift claimed!');
console.log('Proposal:', claimedProposal.id);
console.log('Match score:', claimedProposal.matchScore);
console.log('Auto-accepted:', claimedProposal.proposalStatus === 'ACCEPTED');
```

### Workflow 6: Update Shift Preferences

**Scenario**: Caregiver sets their availability and preferences.

```typescript
await handlers.updateCaregiverPreferences(
  caregiverContext.userId,
  {
    preferredDaysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    preferredTimeRanges: [{ startTime: '08:00', endTime: '16:00' }],
    maxTravelDistance: 20, // miles
    maxHoursPerWeek: 35,
    willingToAcceptUrgentShifts: true,
    willingToWorkWeekends: false,
    willingToWorkHolidays: false,
    acceptAutoAssignment: true, // Auto-accept excellent matches
    notificationMethods: ['PUSH', 'SMS'],
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  },
  caregiverContext
);

console.log('✅ Preferences updated successfully');
```

---

## Admin Workflows

### Workflow 1: Configure Matching Rules

**Scenario**: Adjust matching algorithm weights for the organization.

```typescript
const adminContext: UserContext = {
  userId: 'admin-uuid',
  organizationId: 'org-uuid',
  branchIds: [],
  roles: ['ORG_ADMIN'],
  permissions: ['config:write'],
};

// Create a new configuration
const config = await handlers.createConfiguration(
  {
    organizationId: adminContext.organizationId,
    name: 'High Priority Configuration',
    description: 'Optimized for urgent shift fill rates',
    weights: {
      skillMatch: 25, // Emphasize skills
      availabilityMatch: 25, // Must be available
      proximityMatch: 20, // Proximity matters
      preferenceMatch: 5, // Less weight on preferences
      experienceMatch: 10,
      reliabilityMatch: 10,
      complianceMatch: 5,
      capacityMatch: 0,
    },
    maxTravelDistance: 25,
    requireExactSkillMatch: true, // Strict skill matching
    minScoreForProposal: 70, // Higher threshold
    maxProposalsPerShift: 3, // Fewer proposals
    proposalExpirationMinutes: 60, // Faster response needed
    optimizeFor: 'FASTEST_FILL',
    isActive: true,
    isDefault: false,
  },
  adminContext
);

console.log('Configuration created:', config.id);
```

### Workflow 2: Expire Stale Proposals

**Scenario**: Clean up old proposals that weren't responded to.

```typescript
const result = await handlers.expireStaleProposals(adminContext);

console.log(`${result.expiredCount} stale proposals expired`);
```

---

## Analytics & Reporting

### Workflow 1: Matching Performance Metrics

**Scenario**: Review how well the matching system is performing.

```typescript
const metrics = await handlers.getMatchingMetrics(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  adminContext
);

console.log('\n📊 Matching Performance (January 2025)\n');
console.log('Total Open Shifts:', metrics.totalOpenShifts);
console.log('Successfully Matched:', metrics.shiftsMatched);
console.log('Match Rate:', `${metrics.matchRate.toFixed(1)}%`);
console.log('Average Match Score:', metrics.averageMatchScore.toFixed(1));
console.log(
  'Average Response Time:',
  `${metrics.averageResponseTimeMinutes.toFixed(1)} minutes`
);
console.log('\nProposal Outcomes:');
console.log('  Accepted:', metrics.proposalsAccepted);
console.log('  Rejected:', metrics.proposalsRejected);
console.log('  Expired:', metrics.proposalsExpired);
```

### Workflow 2: Caregiver Performance

**Scenario**: Evaluate a specific caregiver's matching behavior.

```typescript
const performance = await handlers.getCaregiverPerformance(
  'caregiver-uuid',
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  adminContext
);

console.log('\n👤 Caregiver Performance\n');
console.log('Proposals Received:', performance.proposalsReceived);
console.log('Acceptance Rate:', `${performance.acceptanceRate.toFixed(1)}%`);
console.log('Average Match Score:', performance.averageMatchScore.toFixed(1));
console.log(
  'Average Response Time:',
  `${performance.averageResponseTimeMinutes.toFixed(1)} minutes`
);
```

### Workflow 3: Top Rejection Reasons

**Scenario**: Identify why caregivers are rejecting shifts.

```typescript
const rejectionReasons = await handlers.getTopRejectionReasons(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  adminContext
);

console.log('\n📉 Top Rejection Reasons\n');
rejectionReasons.forEach((reason, index) => {
  console.log(
    `${index + 1}. ${reason.category}: ${reason.count} (${reason.percentage}%)`
  );
});
```

**Example Output**:

```
📉 Top Rejection Reasons

1. TOO_FAR: 45 (32.1%)
2. TIME_CONFLICT: 38 (27.1%)
3. PERSONAL_REASON: 25 (17.9%)
4. PREFER_DIFFERENT_CLIENT: 15 (10.7%)
5. ALREADY_BOOKED: 12 (8.6%)
```

---

## Testing the Demo

### Quick Test Script

```typescript
// demo.ts
import { Pool } from 'pg';
import { ShiftMatchingHandlers } from '@care-commons/shift-matching';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const handlers = new ShiftMatchingHandlers(pool);

async function runDemo() {
  // Get first open shift
  const shifts = await handlers.searchOpenShifts(
    { matchingStatus: ['NEW'] },
    { page: 1, limit: 1 },
    context
  );

  if (shifts.items.length === 0) {
    console.log('No open shifts found. Run seed script first.');
    return;
  }

  const openShift = shifts.items[0];
  console.log('Testing with shift:', openShift.id);

  // Run matching
  const result = await handlers.matchOpenShift(
    openShift.id,
    { autoPropose: true, maxCandidates: 3 },
    context
  );

  console.log(`\nMatching complete!`);
  console.log(`Found ${result.eligibleCount} eligible caregivers`);
  console.log(`Sent ${result.proposalsCreated.length} proposals`);
}

runDemo()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
  });
```

Run with:

```bash
npx ts-node demo.ts
```

---

## Next Steps

1. **Integrate with notification service** to send real push/SMS notifications
2. **Add mobile app integration** for caregiver self-service
3. **Implement machine learning** to improve match scores over time
4. **Add route optimization** for consecutive shifts
5. **Build scheduler dashboard** for visual shift management
6. **Create caregiver mobile SDK** for easy integration

---

For more details, see the [README](./README.md) and
[implementation guide](./IMPLEMENTATION.md).
