# Task 0070: Shift Matching UI Implementation

**Priority:** 🟠 HIGH
**Estimated Effort:** 1-2 weeks
**Vertical:** shift-matching
**Type:** Frontend Implementation

---

## Context

The shift matching vertical has:
- ✅ Complete database schema
- ✅ Sophisticated 8-dimensional scoring algorithm
- ✅ Backend service implementation
- ❌ Minimal UI (basic components only)

The algorithm is **production-ready** and considers:
1. Skill match
2. Geographic proximity
3. Schedule availability
4. Language compatibility
5. Client preferences
6. Caregiver preferences
7. Historical performance
8. Compliance requirements

However, coordinators currently have no way to:
- View match scores
- Compare multiple candidates
- Override automatic matches
- See match reasoning
- Track match success over time

---

## Objectives

Build a comprehensive UI for:
1. **Match Suggestions** - Show top matches with scores
2. **Match Comparison** - Side-by-side caregiver comparison
3. **Match Override** - Manual assignment with reason tracking
4. **Match Analytics** - Success metrics and trends
5. **Match History** - Audit trail of assignments

---

## UI Components to Build

### 1. Match Suggestions Panel

**Location:** `packages/web/src/verticals/shift-matching/components/MatchSuggestionsPanel.tsx`

**Features:**
- Display top 5-10 matches for open shift
- Show overall match score (0-100)
- Show score breakdown by dimension
- Visual score indicators (progress bars, color coding)
- "Assign" quick action button
- "View Details" expansion

**Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│  Match Suggestions for Shift #12345                     │
│  Client: Mary Johnson | Service: Personal Care          │
│  Date: Jan 15, 2025 | Time: 9:00 AM - 1:00 PM          │
├─────────────────────────────────────────────────────────┤
│  🥇 Sarah Martinez                      Score: 94/100   │
│     ████████████████████████░░ 94%                      │
│     Skills: ████████████████████ 95                     │
│     Location: ██████████████████░ 90                    │
│     Availability: ████████████████████ 100              │
│     [Assign] [View Details]                             │
├─────────────────────────────────────────────────────────┤
│  🥈 Jennifer Lee                        Score: 88/100   │
│     ████████████████████░░░░ 88%                        │
│     Skills: ██████████████████░░ 92                     │
│     Location: ████████████░░░░░░ 75                     │
│     Availability: ████████████████████ 100              │
│     [Assign] [View Details]                             │
├─────────────────────────────────────────────────────────┤
│  🥉 Patricia Chen                       Score: 82/100   │
│     ██████████████████░░░░░░ 82%                        │
│     ...                                                  │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
```tsx
export function MatchSuggestionsPanel({ shiftId }: { shiftId: number }) {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['shift-matches', shiftId],
    queryFn: () => shiftMatchingApi.getMatches(shiftId),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Match Suggestions for Shift #{shiftId}
      </h2>

      {matches.map((match, index) => (
        <MatchCard
          key={match.caregiverId}
          match={match}
          rank={index + 1}
          onAssign={() => handleAssign(match)}
        />
      ))}
    </div>
  );
}

function MatchCard({ match, rank, onAssign }) {
  const [expanded, setExpanded] = useState(false);

  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{medal}</span>
          <div>
            <h3 className="font-semibold">{match.caregiverName}</h3>
            <p className="text-sm text-gray-600">
              {match.distance} miles away • {match.languages.join(', ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ScoreBadge score={match.overallScore} />
          <Button onClick={onAssign} variant="primary" size="sm">
            Assign
          </Button>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <ScoreBar label="Skills" score={match.scores.skillMatch} />
        <ScoreBar label="Location" score={match.scores.proximityScore} />
        <ScoreBar label="Availability" score={match.scores.availabilityScore} />
        <ScoreBar label="Language" score={match.scores.languageMatch} />
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <MatchDetails match={match} />
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        {expanded ? 'Hide Details' : 'View Details'}
      </button>
    </div>
  );
}
```

---

### 2. Match Comparison View

**Location:** `packages/web/src/verticals/shift-matching/components/MatchComparisonView.tsx`

**Features:**
- Side-by-side comparison of 2-4 caregivers
- Highlight differences
- Allow selection from comparison
- Export comparison as PDF

**Mockup:**
```
┌──────────────────────────────────────────────────────────────┐
│  Compare Candidates                                          │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│              │ Sarah M.     │ Jennifer L.  │ Patricia C.      │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ Overall      │ 94 🥇        │ 88 🥈        │ 82 🥉            │
│ Skills       │ 95           │ 92           │ 88               │
│ Location     │ 90 (2.1 mi)  │ 75 (5.3 mi)  │ 85 (3.2 mi)      │
│ Availability │ 100 ✓        │ 100 ✓        │ 80 (conflict)    │
│ Languages    │ EN, ES       │ EN           │ EN, CN           │
│ Experience   │ 5 years      │ 8 years      │ 3 years          │
│ Rating       │ 4.8 ⭐       │ 4.9 ⭐       │ 4.6 ⭐           │
│ Hourly Rate  │ $22/hr       │ $25/hr       │ $20/hr           │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│              │ [Select]     │ [Select]     │ [Select]         │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

---

### 3. Match Override Interface

**Location:** `packages/web/src/verticals/shift-matching/components/ManualAssignmentModal.tsx`

**Features:**
- Search for any caregiver
- Show why they might not be top match
- Require reason for override
- Record decision in audit log

```tsx
export function ManualAssignmentModal({ shiftId, onClose }) {
  const [selectedCaregiver, setSelectedCaregiver] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const handleAssign = async () => {
    await shiftMatchingApi.assignWithOverride(shiftId, {
      caregiverId: selectedCaregiver,
      reason: overrideReason,
      overriddenBy: currentUser.id,
    });

    onClose();
  };

  return (
    <Modal title="Manual Assignment" onClose={onClose}>
      <CaregiverSearch
        onSelect={setSelectedCaregiver}
        filters={{ available: true }}
      />

      {selectedCaregiver && (
        <div className="mt-4">
          <MatchWarnings caregiverId={selectedCaregiver} shiftId={shiftId} />

          <label className="block mt-4">
            <span className="text-sm font-medium">Reason for Override</span>
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
              rows={3}
              required
            />
          </label>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose} variant="secondary">Cancel</Button>
        <Button
          onClick={handleAssign}
          variant="primary"
          disabled={!selectedCaregiver || !overrideReason}
        >
          Assign
        </Button>
      </div>
    </Modal>
  );
}
```

---

### 4. Match Analytics Dashboard

**Location:** `packages/web/src/verticals/shift-matching/pages/MatchAnalyticsDashboard.tsx`

**Metrics:**
- Match acceptance rate
- Average match score
- Override frequency
- Top-performing caregivers
- Client satisfaction with matches

```tsx
export function MatchAnalyticsDashboard() {
  const { data: analytics } = useQuery({
    queryKey: ['match-analytics'],
    queryFn: shiftMatchingApi.getAnalytics,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Match Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Acceptance Rate"
          value={`${analytics.acceptanceRate}%`}
          trend="+5% vs last month"
        />
        <MetricCard
          title="Avg Match Score"
          value={analytics.avgMatchScore}
          trend="+2 points"
        />
        <MetricCard
          title="Override Rate"
          value={`${analytics.overrideRate}%`}
          trend="-3% vs last month"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Match Score Distribution">
          <MatchScoreHistogram data={analytics.scoreDistribution} />
        </Card>

        <Card title="Top Matched Caregivers">
          <TopCaregiversTable data={analytics.topCaregivers} />
        </Card>
      </div>

      <Card title="Match Trends Over Time">
        <MatchTrendsChart data={analytics.trends} />
      </Card>
    </div>
  );
}
```

---

### 5. Match History & Audit Log

**Location:** `packages/web/src/verticals/shift-matching/components/MatchHistoryTable.tsx`

**Features:**
- Show all assignments for a shift/caregiver/client
- Filter by date range, status, override
- Export to CSV
- Drill into match details

```tsx
export function MatchHistoryTable({ filters }: { filters: MatchHistoryFilters }) {
  const { data: history } = useQuery({
    queryKey: ['match-history', filters],
    queryFn: () => shiftMatchingApi.getHistory(filters),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Shift</TableHead>
          <TableHead>Caregiver</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Override</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history?.map(match => (
          <TableRow key={match.id}>
            <TableCell>{formatDate(match.assignedAt)}</TableCell>
            <TableCell>#{match.shiftId}</TableCell>
            <TableCell>{match.caregiverName}</TableCell>
            <TableCell>{match.clientName}</TableCell>
            <TableCell>
              <ScoreBadge score={match.matchScore} />
            </TableCell>
            <TableCell>
              <StatusBadge status={match.status} />
            </TableCell>
            <TableCell>
              {match.wasOverride && (
                <Tooltip content={match.overrideReason}>
                  <span className="text-amber-600">⚠️ Override</span>
                </Tooltip>
              )}
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => viewDetails(match.id)}
              >
                Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## API Endpoints

Add to `packages/app/routes/shift-matching.ts`:

```typescript
// GET /api/shift-matching/matches/:shiftId
router.get('/matches/:shiftId', async (req, res) => {
  const { shiftId } = req.params;
  const matches = await shiftMatchingService.findMatches(Number(shiftId));
  res.json(matches);
});

// POST /api/shift-matching/assign
router.post('/assign', async (req, res) => {
  const { shiftId, caregiverId, overrideReason } = req.body;

  const assignment = await shiftMatchingService.assignCaregiver(
    shiftId,
    caregiverId,
    {
      overrideReason,
      assignedBy: req.user.id,
    }
  );

  res.json(assignment);
});

// GET /api/shift-matching/analytics
router.get('/analytics', async (req, res) => {
  const { startDate, endDate } = req.query;

  const analytics = await shiftMatchingService.getAnalytics({
    startDate: new Date(startDate as string),
    endDate: new Date(endDate as string),
  });

  res.json(analytics);
});

// GET /api/shift-matching/history
router.get('/history', async (req, res) => {
  const filters = req.query;
  const history = await shiftMatchingService.getHistory(filters);
  res.json(history);
});
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('MatchSuggestionsPanel', () => {
  it('should render top matches in score order', () => {
    render(<MatchSuggestionsPanel shiftId={1} />);
    const matches = screen.getAllByRole('article');
    expect(matches[0]).toHaveTextContent('94'); // Top score first
  });

  it('should show medal emojis for top 3', () => {
    render(<MatchSuggestionsPanel shiftId={1} />);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
describe('Match Assignment Flow', () => {
  it('should assign top match to shift', async () => {
    // Navigate to shift
    await page.goto('/scheduling/shifts/123');

    // Click "Find Match"
    await page.click('[data-testid="find-match-btn"]');

    // Verify suggestions loaded
    await page.waitForSelector('[data-testid="match-suggestion"]');

    // Assign top match
    await page.click('[data-testid="assign-btn-0"]');

    // Confirm assignment
    await page.click('[data-testid="confirm-assign"]');

    // Verify success message
    await expect(page.locator('.success-toast')).toContainText('Assigned');
  });
});
```

---

## Success Criteria

- [ ] Match suggestions panel displays top matches with scores
- [ ] Score breakdown shows all 8 dimensions
- [ ] Match comparison allows side-by-side evaluation
- [ ] Manual override requires reason and logs to audit trail
- [ ] Analytics dashboard shows key metrics
- [ ] Match history searchable and exportable
- [ ] All UI components responsive
- [ ] Tests passing with >80% coverage
- [ ] Coordinators can complete full match workflow

---

## Related Tasks

- Task 0069: Billing Service Layer (similar pattern of backend-ready, needs UI)
- Task 0060: Analytics Dashboard Completion
