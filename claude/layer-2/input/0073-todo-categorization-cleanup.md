# Task 0073: Codebase TODO Categorization and Cleanup

**Priority:** 🟡 MEDIUM
**Estimated Effort:** 2-3 days
**Type:** Code Quality / Technical Debt

---

## Context

The codebase analysis found **26 files with TODO/FIXME/HACK comments**. These comments range from:
- **Critical blockers** (EVV aggregator HTTP submission)
- **High-priority integrations** (family engagement notifications)
- **Planned future features** (voice-to-text in mobile app)
- **Minor improvements** (holiday filtering)
- **Technical debt** (SQL query optimization)

Currently, all TODOs are treated equally, making it difficult to:
- Identify which TODOs are blocking production
- Distinguish between "must fix now" vs "nice to have later"
- Track TODO resolution progress
- Prevent TODO accumulation

---

## Objectives

1. **Categorize all existing TODOs** by priority and type
2. **Standardize TODO format** for consistency
3. **Remove obsolete TODOs** (already completed or no longer relevant)
4. **Create tracking system** for TODO progress
5. **Establish TODO policy** for future additions

---

## TODO Categorization System

### Priority Levels

```typescript
// P0 (CRITICAL) - Production blockers, must fix before launch
// TODO(p0): Implement actual HTTP POST to aggregator
//   Related: Task 0049 - EVV Aggregator Integration
//   Blocking: Production launch

// P1 (HIGH) - Important features, should fix soon
// TODO(p1): Trigger actual notification delivery (email, SMS, push)
//   Related: Task 0067 - Notification Delivery System
//   Impact: User experience significantly degraded

// P2 (MEDIUM) - Nice to have, fix when time permits
// TODO(p2): Filter holidays if skipHolidays is true
//   Related: Task 0071 - Holiday Filtering
//   Impact: Minor inconvenience for coordinators

// P3 (FUTURE) - Planned enhancements, defer to backlog
// TODO(future): Add voice-to-text button
//   Related: Future mobile enhancements
//   Impact: Feature request, not blocking
```

### Type Labels

```typescript
// TODO(integration): Missing service integration
// TODO(optimization): Performance improvement needed
// TODO(feature): Incomplete feature implementation
// TODO(refactor): Code quality improvement
// TODO(bug): Known issue to fix
// TODO(security): Security enhancement needed
// TODO(a11y): Accessibility improvement
// TODO(test): Missing test coverage
```

### Combined Format

```typescript
// TODO(p0/integration): Implement actual HTTP POST to EVV aggregator
//   Status: Tracked in Task 0049
//   Owner: Backend team
//   Deadline: Before production launch
//   Context: Currently returning mock success, no actual submission happening
```

---

## Implementation Plan

### Phase 1: Audit & Categorize (Day 1)

Create comprehensive TODO inventory:

**File:** `docs/TODO_AUDIT.md`

```markdown
# TODO Audit - 2025-11-08

## Summary
- Total TODOs: 26 files
- P0 (Critical): 3
- P1 (High): 6
- P2 (Medium): 8
- P3 (Future): 9

## Critical (P0) - Production Blockers

### verticals/time-tracking-evv/src/service/evv-aggregator-service.ts:361
- **TODO**: Implement actual HTTP POST to aggregator
- **Type**: integration
- **Impact**: EVV records not submitted to state - compliance failure
- **Task**: 0049-external-evv-aggregator-integration.md
- **Owner**: Backend
- **Deadline**: Production launch

### verticals/time-tracking-evv/src/aggregators/sandata-aggregator.ts:312
- **TODO**: Replace with actual HTTP client implementation
- **Type**: integration
- **Impact**: Sandata submissions failing
- **Task**: 0049 (same)

### verticals/time-tracking-evv/src/aggregators/tellus-aggregator.ts:371
- **TODO**: Replace with actual HTTP client implementation
- **Type**: integration
- **Impact**: Tellus submissions failing
- **Task**: 0049 (same)

## High Priority (P1)

### verticals/family-engagement/src/services/family-engagement-service.ts:183
- **TODO**: Trigger actual notification delivery (email, SMS, push)
- **Type**: integration
- **Impact**: Families receive zero notifications
- **Task**: 0067-notification-delivery-system.md
- **Owner**: Backend
- **Estimate**: 1-2 weeks

### verticals/family-engagement/src/services/family-engagement-service.ts:335
- **TODO**: Get actual user name (currently returns userId)
- **Type**: integration
- **Impact**: UX degradation (shows "User 123" instead of "John Doe")
- **Task**: 0068-family-engagement-data-integration.md

### verticals/family-engagement/src/services/family-engagement-service.ts:357
- **TODO**: Get thread to validate access and get clientId
- **Type**: security
- **Impact**: Missing access control validation
- **Task**: 0068-family-engagement-data-integration.md

... (continue for all TODOs)

## Medium Priority (P2)

### verticals/scheduling-visits/src/service/schedule-service.ts:564
- **TODO**: Filter holidays if skipHolidays is true
- **Type**: feature
- **Impact**: Minor - coordinators manually delete holiday visits
- **Task**: 0071-scheduling-holiday-filtering.md
- **Estimate**: 2-3 days

### verticals/analytics-reporting/src/service/report-service.ts:208
- **TODO**: Rewrite using raw SQL - see ARCHITECTURAL_ISSUES.md
- **Type**: optimization
- **Impact**: Slow queries (>10s) with large datasets
- **Task**: 0072-analytics-sql-performance-optimization.md

## Future Enhancements (P3)

### packages/mobile/src/screens/visits/TasksScreen.tsx
- **TODO**: Add voice-to-text button
- **Type**: feature
- **Impact**: Nice-to-have UX enhancement
- **Task**: Defer to backlog
- **Estimate**: 1-2 days

... (continue)
```

---

### Phase 2: Update All TODOs (Days 1-2)

**Script:** `scripts/update-todos.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface TODOMapping {
  pattern: RegExp;
  replacement: string;
  priority: 'p0' | 'p1' | 'p2' | 'future';
  task?: string;
}

const mappings: TODOMapping[] = [
  // P0 - Critical
  {
    pattern: /TODO: Implement actual HTTP POST to aggregator/,
    replacement: 'TODO(p0/integration): Implement actual HTTP POST to EVV aggregator\n   // Status: Tracked in Task 0049 - EVV Aggregator Integration\n   // Blocking: Production launch - EVV compliance failure without this',
    priority: 'p0',
    task: '0049',
  },
  {
    pattern: /TODO: Replace with actual HTTP client implementation/,
    replacement: 'TODO(p0/integration): Replace with actual HTTP client implementation\n   // Status: Tracked in Task 0049 - EVV Aggregator Integration',
    priority: 'p0',
    task: '0049',
  },

  // P1 - High
  {
    pattern: /FIXME: Trigger actual notification delivery/,
    replacement: 'TODO(p1/integration): Trigger actual notification delivery (email, SMS, push)\n   // Status: Tracked in Task 0067 - Notification Delivery System\n   // Impact: Families receive zero proactive notifications',
    priority: 'p1',
    task: '0067',
  },
  {
    pattern: /FIXME: Get actual user name/,
    replacement: 'TODO(p1/integration): Get actual user name from user provider\n   // Status: Tracked in Task 0068 - Family Engagement Data Integration\n   // Impact: UX shows "User 123" instead of names',
    priority: 'p1',
    task: '0068',
  },

  // P2 - Medium
  {
    pattern: /TODO: Filter holidays if skipHolidays is true/,
    replacement: 'TODO(p2/feature): Filter holidays if skipHolidays is true\n   // Status: Tracked in Task 0071 - Holiday Filtering\n   // Impact: Coordinators manually delete holiday visits',
    priority: 'p2',
    task: '0071',
  },
  {
    pattern: /TODO: Rewrite using raw SQL/,
    replacement: 'TODO(p2/optimization): Rewrite using raw SQL for performance\n   // Status: Tracked in Task 0072 - Analytics SQL Optimization\n   // Impact: Slow queries (>10s) with large datasets',
    priority: 'p2',
    task: '0072',
  },

  // Future
  {
    pattern: /TODO: Add voice-to-text button/,
    replacement: 'TODO(future/feature): Add voice-to-text button for documentation\n   // Deferred: Nice-to-have UX enhancement, not blocking',
    priority: 'future',
  },
  {
    pattern: /TODO: Load from WatermelonDB/,
    replacement: 'TODO(future/integration): Load from WatermelonDB instead of mock data\n   // Deferred: Mobile app screens - addressed in tasks 0055-0058',
    priority: 'future',
  },
];

async function updateTODOs() {
  const files = await glob('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', '**/build/**'],
  });

  let updatedCount = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    for (const mapping of mappings) {
      if (mapping.pattern.test(content)) {
        content = content.replace(mapping.pattern, mapping.replacement);
        modified = true;
        updatedCount++;
        console.log(`Updated ${file}: ${mapping.priority} TODO`);
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
    }
  }

  console.log(`\nUpdated ${updatedCount} TODOs across ${files.length} files`);
}

updateTODOs().catch(console.error);
```

---

### Phase 3: Remove Obsolete TODOs (Day 2)

Review and remove TODOs for:
- Features already implemented
- Decisions already made
- Approaches that were abandoned

**Examples to remove:**

```typescript
// REMOVE - Feature already implemented
// TODO: Add timezone support
// ^ Migration 025 already added timezone columns

// REMOVE - Already decided against
// TODO: Consider using Prisma instead of Knex
// ^ Decision made to stick with Knex

// REMOVE - Completed in previous PR
// TODO: Wire up provider interfaces
// ^ Confirmed complete in codebase analysis
```

---

### Phase 4: Establish TODO Policy (Day 3)

**File:** `docs/CONTRIBUTING.md` (update)

```markdown
## TODO Comment Policy

### When to Add a TODO

✅ **Do add TODOs for:**
- Incomplete features that need finishing
- Known performance issues
- Missing error handling
- Planned refactorings
- Integration points not yet wired

❌ **Don't add TODOs for:**
- Things you could fix right now (fix it instead)
- Vague ideas without clear action items
- Features not yet approved
- Nice-to-have enhancements (use backlog instead)

### TODO Format

Use this format for all TODOs:

```typescript
// TODO(priority/type): Clear description of what needs to be done
//   Status: Tracked in Task XXXX | Not yet tracked
//   Impact: What happens if this isn't fixed
//   Estimate: Time estimate if known
```

**Priorities:**
- `p0` - Production blocker, must fix before launch
- `p1` - Important, should fix soon (within 2 weeks)
- `p2` - Medium priority, fix when time permits
- `future` - Planned enhancement, defer to backlog

**Types:**
- `integration` - Missing service/data integration
- `optimization` - Performance improvement
- `feature` - Incomplete feature
- `bug` - Known issue
- `security` - Security concern
- `refactor` - Code quality
- `test` - Missing tests
- `a11y` - Accessibility

### Examples

```typescript
// Good
// TODO(p0/integration): Implement actual HTTP POST to EVV aggregator
//   Status: Tracked in Task 0049
//   Impact: EVV records not submitted - compliance failure
//   Estimate: 1 week

// Bad
// TODO: fix this later
```

### TODO Lifecycle

1. **Add TODO** with proper format
2. **Create tracking task** in `claude/layer-2/input/` if P0 or P1
3. **Update TODO** with task number
4. **Remove TODO** when work is complete
5. **Archive completed TODOs** in `docs/TODO_CHANGELOG.md`

### Monthly TODO Review

On the 1st of each month:
- Review all P0/P1 TODOs for progress
- Downgrade stale P1 TODOs to P2
- Remove obsolete TODOs
- Update task references
```

---

### Phase 5: Create TODO Tracking Dashboard

**Script:** `scripts/todo-stats.ts`

```typescript
import { execSync } from 'child_process';

function getTODOStats() {
  const output = execSync('grep -r "TODO(" --include="*.ts" --include="*.tsx" .', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore'],
  }).toString();

  const lines = output.split('\n').filter(Boolean);

  const stats = {
    total: lines.length,
    p0: lines.filter(l => l.includes('TODO(p0')).length,
    p1: lines.filter(l => l.includes('TODO(p1')).length,
    p2: lines.filter(l => l.includes('TODO(p2')).length,
    future: lines.filter(l => l.includes('TODO(future')).length,
    uncategorized: lines.filter(l => !l.includes('TODO(p') && !l.includes('TODO(future')).length,
  };

  console.log('📋 TODO Statistics\n');
  console.log(`Total TODOs: ${stats.total}`);
  console.log(`  🔴 P0 (Critical): ${stats.p0}`);
  console.log(`  🟠 P1 (High): ${stats.p1}`);
  console.log(`  🟡 P2 (Medium): ${stats.p2}`);
  console.log(`  🟢 Future: ${stats.future}`);
  console.log(`  ⚪ Uncategorized: ${stats.uncategorized}`);

  if (stats.uncategorized > 0) {
    console.log('\n⚠️  Warning: Uncategorized TODOs found. Please categorize them.');
  }

  if (stats.p0 > 0) {
    console.log('\n🚨 Critical TODOs detected - these block production!');
  }

  return stats;
}

getTODOStats();
```

Add to CI:

```yaml
# .github/workflows/todo-check.yml
name: TODO Check

on: [pull_request]

jobs:
  check-todos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 22

      - name: Check TODO format
        run: |
          # Fail if new uncategorized TODOs added
          NEW_TODOS=$(git diff origin/main...HEAD | grep "+.*TODO" | grep -v "TODO(p" | grep -v "TODO(future" || true)

          if [ -n "$NEW_TODOS" ]; then
            echo "❌ Uncategorized TODOs found in PR:"
            echo "$NEW_TODOS"
            echo ""
            echo "Please use format: TODO(priority/type): Description"
            exit 1
          fi

      - name: Report TODO stats
        run: npm run todo:stats
```

---

## Success Criteria

- [ ] All 26 TODO files audited
- [ ] All TODOs categorized with priority
- [ ] Obsolete TODOs removed
- [ ] TODO policy documented in CONTRIBUTING.md
- [ ] Tracking script created and working
- [ ] CI check for uncategorized TODOs
- [ ] Zero P0 TODOs after related tasks complete
- [ ] All team members trained on new format

---

## Maintenance

**Monthly Review:**
- Run `npm run todo:stats` to see current state
- Review P0/P1 TODOs for progress
- Create new tasks for new TODOs
- Archive completed TODOs

**Before Each Release:**
- Zero P0 TODOs required
- Document any P1 TODOs as known issues

---

## Related Tasks

- Task 0067: Notification Delivery (resolves P1 TODOs)
- Task 0068: Family Engagement Data Integration (resolves P1 TODOs)
- Task 0049: EVV Aggregator Integration (resolves P0 TODOs)
- Task 0071: Holiday Filtering (resolves P2 TODO)
- Task 0072: Analytics Optimization (resolves P2 TODOs)
