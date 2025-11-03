# Shift Matching & Assignment

Intelligent caregiver-to-shift matching system for Care Commons. Automatically
evaluates and ranks caregivers based on skills, availability, proximity,
preferences, and performance history to optimize shift assignments.

## Overview

The Shift Matching & Assignment vertical bridges scheduling with staffing by:

- **Automated candidate evaluation**: Scores caregivers across 8 dimensions
  (skills, availability, proximity, preferences, experience, reliability,
  compliance, capacity)
- **Configurable matching rules**: Adjust weights, thresholds, and optimization
  goals per organization or branch
- **Assignment proposal workflow**: Send proposals to caregivers, track
  responses, handle acceptance/rejection
- **Bulk matching**: Optimize assignments across multiple shifts simultaneously
- **Caregiver preferences**: Allow caregivers to set their own shift preferences
  for better matches
- **Analytics and history**: Track match outcomes, response times, and
  performance metrics

## Key Concepts

### Open Shift

An unassigned visit requiring a caregiver. Created when:

- A new visit is scheduled without assignment
- An assigned caregiver cancels or is unavailable
- A scheduler manually flags a visit as needing reassignment

### Match Candidate

A caregiver evaluated for a specific shift, with:

- Overall score (0-100) indicating fit quality
- Dimensional scores across 8 criteria
- Eligibility determination (blocking issues vs warnings)
- Distance, travel time, and schedule conflict analysis
- Human-readable reasons explaining the match

### Assignment Proposal

A system-generated or manual suggestion to assign a caregiver to a shift:

- Sent to caregivers via push, SMS, email, or phone
- Tracked through viewed → responded → accepted/rejected
- Can expire if not responded to within configured time
- Records rejection reasons for algorithm improvement

### Matching Configuration

Organization or branch-specific rules controlling:

- Score weights for each dimension
- Distance and travel constraints
- Skill/certification matching strictness
- Auto-assignment thresholds
- Proposal expiration times
- Optimization goals (best match, fastest fill, cost efficiency, etc.)

## Matching Algorithm

The algorithm evaluates caregivers across **8 weighted dimensions**:

1. **Skill Match** (default weight: 20%)
   - Checks required skills and certifications
   - Perfect match = 100, missing skills reduce score significantly

2. **Availability Match** (20%)
   - Detects schedule conflicts at shift time
   - Available = 100, any conflict = 0 (blocking)

3. **Proximity Match** (15%)
   - Calculates distance from caregiver to client location
   - Closer is better, beyond max distance = 0

4. **Preference Match** (10%)
   - Client's preferred/blocked caregiver lists
   - Gender and language preferences
   - Preferred caregivers get bonus points

5. **Experience Match** (10%)
   - Previous visits with this client (continuity of care)
   - Client ratings of this caregiver
   - More history = higher score

6. **Reliability Match** (10%)
   - Historical performance and reliability metrics
   - Recent rejection count (if penalized by config)
   - Bonus for high performers (if boosted by config)

7. **Compliance Match** (10%)
   - Active, unexpired credentials required by client/service
   - Compliant = 100, expired/missing = 0

8. **Capacity Match** (5%)
   - Weekly hour limits and remaining capacity
   - Prefers moderate utilization (60-80%)
   - Exceeding limit = 0 (blocking)

### Overall Score Calculation

```
overallScore = (
  skillMatch * weightSkill +
  availabilityMatch * weightAvailability +
  proximityMatch * weightProximity +
  preferenceMatch * weightPreference +
  experienceMatch * weightExperience +
  reliabilityMatch * weightReliability +
  complianceMatch * weightCompliance +
  capacityMatch * weightCapacity
) / 100
```

### Match Quality Tiers

- **Excellent**: 85-100 (ideal match, consider auto-assignment)
- **Good**: 70-84 (strong match, propose with confidence)
- **Fair**: 50-69 (acceptable match, may require manual review)
- **Poor**: 0-49 (weak match, avoid unless necessary)
- **Ineligible**: Has blocking issues (conflicts, missing requirements, etc.)

## Data Model

### Core Tables

- `open_shifts`: Unassigned visits needing caregivers
- `assignment_proposals`: Match proposals sent to caregivers
- `matching_configurations`: Scoring rules and weights
- `caregiver_preference_profiles`: Caregiver-set shift preferences
- `bulk_match_requests`: Batch matching jobs
- `match_history`: Audit log of all matching attempts

### Database Functions

- `calculate_distance(lat1, lon1, lat2, lon2)`: Haversine distance in miles
- `is_caregiver_available(caregiverId, date, startTime, endTime)`: Conflict
  check
- `refresh_active_open_shifts()`: Refresh materialized view of unassigned shifts

## Usage Examples

### Create an Open Shift

```typescript
import { ShiftMatchingRepository } from '@care-commons/shift-matching';

const repo = new ShiftMatchingRepository(pool);

const openShift = await repo.createOpenShift(
  {
    visitId: 'visit-uuid',
    priority: 'HIGH',
    fillByDate: new Date('2025-01-30T08:00:00Z'),
    internalNotes: 'Client prefers morning arrivals',
  },
  context
);
```

### Evaluate Match Candidates

```typescript
import {
  MatchingAlgorithm,
  CaregiverContext,
} from '@care-commons/shift-matching';

const candidate = MatchingAlgorithm.evaluateMatch(
  openShift,
  caregiverContext,
  configuration
);

console.log(`Match score: ${candidate.overallScore}`);
console.log(`Quality: ${candidate.matchQuality}`);
console.log(`Eligible: ${candidate.isEligible}`);
console.log(`Reasons:`, candidate.matchReasons);
```

### Create Assignment Proposal

```typescript
const proposal = await repo.createProposal(
  {
    openShiftId: 'shift-uuid',
    caregiverId: 'caregiver-uuid',
    proposalMethod: 'AUTOMATIC',
    sendNotification: true,
    notificationMethod: 'PUSH',
  },
  candidate.overallScore,
  candidate.matchQuality,
  candidate.matchReasons,
  context
);
```

### Caregiver Responds to Proposal

```typescript
await repo.respondToProposal(
  proposalId,
  {
    accept: true,
    responseMethod: 'MOBILE',
    notes: 'Happy to take this shift',
  },
  context
);
```

### Search Open Shifts

```typescript
const result = await repo.searchOpenShifts(
  {
    organizationId: 'org-uuid',
    dateFrom: new Date('2025-01-25'),
    dateTo: new Date('2025-01-31'),
    priority: ['HIGH', 'CRITICAL'],
    matchingStatus: ['NEW', 'NO_MATCH'],
    isUrgent: true,
  },
  { page: 1, limit: 20, sortBy: 'scheduled_date', sortOrder: 'asc' }
);

console.log(`Found ${result.total} urgent open shifts`);
```

### Update Caregiver Preferences

```typescript
await repo.upsertCaregiverPreferences(
  caregiverId,
  organizationId,
  {
    preferredDaysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    maxTravelDistance: 15, // miles
    maxHoursPerWeek: 35,
    willingToAcceptUrgentShifts: true,
    willingToWorkWeekends: false,
    acceptAutoAssignment: true,
    notificationMethods: ['PUSH', 'SMS'],
  },
  context
);
```

## Configuration

### Default Matching Weights

```json
{
  "skillMatch": 20,
  "availabilityMatch": 20,
  "proximityMatch": 15,
  "preferenceMatch": 10,
  "experienceMatch": 10,
  "reliabilityMatch": 10,
  "complianceMatch": 10,
  "capacityMatch": 5
}
```

Weights must sum to 100 and represent percentage contribution to overall score.

### Optimization Goals

- `BEST_MATCH`: Prioritize highest scores (quality over speed)
- `FASTEST_FILL`: Fill shifts ASAP (speed over quality)
- `COST_EFFICIENT`: Minimize labor costs (lower pay rates preferred)
- `BALANCED_WORKLOAD`: Distribute shifts evenly across caregivers
- `CONTINUITY`: Same caregiver for recurring visits (client relationship)
- `CAREGIVER_SATISFACTION`: Match caregiver preferences (retention)

### Auto-Assignment Threshold

If set (e.g., 90), shifts with candidates scoring >= threshold are automatically
assigned without manual review. Use with caution on high-compliance orgs only.

## Integration Points

### Required Verticals

- **Scheduling & Visits**: Source of open shifts, visit details
- **Caregiver & Staff**: Caregiver profiles, skills, availability, compliance
- **Client Demographics**: Client location, preferences, restrictions

### Optional Verticals

- **Care Plans & Tasks**: Task requirements inform skill matching
- **Time Tracking & EVV**: Historical visit completion affects reliability
  scores
- **Billing & Invoicing**: Cost data for cost-optimization goals

## Workflow

1. **Shift Creation**: Visit becomes unassigned → creates `open_shift`
2. **Matching Triggered**: Scheduler or automated job initiates matching
3. **Candidate Evaluation**: Algorithm scores all eligible caregivers
4. **Ranking**: Candidates sorted by score, ineligible filtered out
5. **Proposal Generation**: Top N candidates receive proposals (configurable)
6. **Notification**: Caregivers notified via preferred channel(s)
7. **Response Tracking**: System tracks views, responses, timeouts
8. **Assignment**: Accepted proposal → visit assigned, other proposals withdrawn
9. **History Logging**: Match attempt, outcome, performance metrics recorded

## Analytics & Reporting

### Matching Metrics

- **Match rate**: % of open shifts successfully filled
- **Average match score**: Quality indicator
- **Average response time**: Caregiver engagement
- **Proposal acceptance rate**: Algorithm effectiveness
- **Top rejection reasons**: Algorithm improvement insights

### Caregiver Performance

- **Proposals received vs accepted**: Acceptance rate by caregiver
- **Average match scores**: How well caregiver fits typical shifts
- **Response time distribution**: Engagement and reliability
- **No-shows and cancellations**: Reliability scoring input

## Future Enhancements

- **Machine learning**: Train models on historical outcomes to improve scoring
- **Multi-shift optimization**: Assign multiple shifts per caregiver in one
  transaction
- **Route optimization**: Minimize travel between consecutive shifts
- **Team assignments**: Match care teams (e.g., RN + HHA) to complex visits
- **Fair scheduling**: Ensure equitable distribution (hours, desirable shifts)
- **Predictive availability**: Learn caregiver availability patterns
- **Client preference learning**: Infer preferences from past
  acceptances/rejections

## Dependencies

- `@care-commons/core`: Base types, error handling, database connection
- `@care-commons/caregiver-staff`: Caregiver profiles and availability
- `@care-commons/scheduling-visits`: Visit details and status
- `pg`: PostgreSQL client
- `zod`: Runtime validation
- `date-fns`: Date/time utilities

## Database Migration

Run migration `007_shift_matching.sql` to create tables, indexes, functions, and
materialized views.

```bash
psql -d care_commons -f packages/core/migrations/007_shift_matching.sql
```

## License

AGPL-3.0 - See LICENSE file for details

## Authors

Neighborhood Lab - Community-owned care software
