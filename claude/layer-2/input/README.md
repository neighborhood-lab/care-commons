# Layer 2 Implementation Tasks

This directory contains detailed implementation tasks created by the Layer 1 central planner. Each task is designed to be executed by Layer 2 implementor instances.

**Last Reorganization**: 2025-11-10 (Prioritized exposing backend features in UIs)

---

## Current Priorities

### 1. **Expose Backend Features in UIs** (Tasks 0000-0014)
Make all implemented backend functionality visible and usable in:
- Showcase environment (for evaluation and demos)
- Production-demo (for onboarding and exploration)
- Mobile app (for caregivers in the field)
- Web app (for coordinators and administrators)

### 2. **Complete Backend Integrations** (Tasks 0015-0017)
Finish critical backend work that enables features:
- Notification delivery system
- Data integrations between verticals
- Service layer completions

### 3. **Improve Dev Speed & Onboarding** (Tasks 0020-0024)
Accelerate development and reduce time-to-productivity:
- User onboarding guides
- E2E validation workflows
- Deployment automation

---

## Task Queue

### 🔴 TIER 1: EXPOSE FEATURES IN UI (Weeks 1-4) - HIGHEST PRIORITY

**Goal**: Make 100% of implemented backend features discoverable and usable

| Task | Title | Effort | Category |
|------|-------|--------|----------|
| [0000](0000-showcase-demo-data.md) | Showcase Demo Data Seeding | 3-5 days | Showcase / Demo |
| [0001](0001-showcase-tours.md) | Showcase Interactive Tours | 1 week | Showcase / UX |
| [0014](0014-showcase-vertical-exposure.md) | Showcase Vertical Feature Exposure | 1-2 weeks | Showcase / Discovery |
| [0002](0002-mobile-clockin.md) | Mobile ClockIn Screen | 2-3 days | Mobile / Caregiver UX |
| [0003](0003-mobile-tasks.md) | Mobile Tasks Screen | 2-3 days | Mobile / Caregiver UX |
| [0004](0004-mobile-schedule.md) | Mobile Schedule Screen | 2-3 days | Mobile / Caregiver UX |
| [0005](0005-mobile-profile.md) | Mobile Profile Screen | 2-3 days | Mobile / Settings |
| [0006](0006-shift-matching-ui.md) | Shift Matching UI Implementation | 1-2 weeks | Web / Coordinator UX |
| [0007](0007-payroll-ui.md) | Payroll Processing Frontend UI | 1 week | Web / Admin UX |
| [0008](0008-analytics-ui.md) | Analytics Dashboard Completion | 1 week | Web / Insights |
| [0009](0009-qa-module-ui.md) | Quality Assurance Module Implementation | 2 weeks | Web / Compliance |
| [0010](0010-medication-tracking.md) | Medication Tracking Module | 2 weeks | New Vertical / Healthcare |
| [0011](0011-emergency-alerts.md) | Emergency Contact & Alert System | 1 week | New Vertical / Safety |
| [0012](0012-client-intake.md) | Client Intake Workflow | 1 week | Workflow / UX |
| [0013](0013-global-search.md) | Global Search Functionality | 1 week | UX / DevEx |

**Total Tier 1**: ~9-12 weeks (parallelizable across multiple developers)

---

### 🟠 TIER 2: BACKEND COMPLETIONS (Weeks 3-5) - CRITICAL

**Goal**: Complete missing backend functionality that blocks UI features

| Task | Title | Effort | Blocker For |
|------|-------|--------|-------------|
| [0015](0015-notifications.md) | Notification Delivery System | 1-2 weeks | Family engagement usability |
| [0016](0016-family-data-integration.md) | Family Engagement Data Integration | 1 week | Family portal completeness |
| [0017](0017-billing-completion.md) | Billing & Invoicing Service Completion | 2 weeks | Billing UI |

**Total Tier 2**: ~4-5 weeks

---

### 🟡 TIER 3: DEV SPEED & ONBOARDING (Weeks 6-8) - HIGH VALUE

**Goal**: Reduce time-to-value for new users and developers

| Task | Title | Effort | Impact |
|------|-------|--------|--------|
| [0020](0020-mobile-onboarding.md) | Caregiver Mobile Onboarding Flow | 2-3 days | First-time caregiver experience |
| [0021](0021-admin-guide.md) | Administrator Quick Start Guide | 3-4 days | Admin onboarding |
| [0022](0022-coordinator-guide.md) | Coordinator Quick Start Guide | 3-4 days | Coordinator training |
| [0023](0023-e2e-validation.md) | End-to-End User Journey Validation | 1 week | Catch integration bugs |
| [0024](0024-deployment-runbook.md) | Production Deployment Runbook | 1 week | Agency self-deployment |

**Total Tier 3**: ~3-4 weeks

---

## Effort Summary

| Tier | Tasks | Estimated Weeks | Can Parallelize? |
|------|-------|-----------------|------------------|
| 🔴 Tier 1 (UI Exposure) | 15 | 9-12 weeks | ✅ Yes (4-6 devs) |
| 🟠 Tier 2 (Backend) | 3 | 4-5 weeks | ⚠️ Some dependencies |
| 🟡 Tier 3 (DevEx) | 5 | 3-4 weeks | ✅ Yes (2-3 devs) |
| **Total** | **23** | **16-21 weeks** | **2-4 weeks with team** |

**With 4-6 parallel developers focusing on Tier 1 (UI exposure), estimated timeline: 2-4 weeks for critical path**

---

## Strategic Rationale

### Why This Organization?

**Previous Priority**: Infrastructure, testing, refactoring (tasks like rate limiting, caching, security hardening, performance optimization)

**Current Priority**: **Expose features in UIs**

**Reasoning**:
1. **Backend is 85-90% complete** - significant investment already made
2. **Hidden value** - features exist but users can't discover/use them
3. **First impressions matter** - showcase determines adoption
4. **Parallelizable** - UI tasks can be done simultaneously by multiple developers
5. **User validation** - can't get feedback on features users can't see
6. **Demo quality** - evaluators need to see platform capabilities immediately

### What Was Removed?

Deleted 16 tasks focused on infrastructure, performance, and refactoring:
- API rate limiting
- Security hardening (post-launch priority)
- Monitoring/observability (basic monitoring already exists)
- Load testing
- Performance optimization
- SOLID refactoring
- DevEx improvements (beyond critical onboarding)
- Mobile test automation
- SQL optimization
- TODO cleanup

**Why delete these?**
- Can be added back easily when needed
- Lower ROI than exposing existing features
- Not blockers for initial production launch
- Better to validate features with users first, then optimize

---

## Dependencies

### Critical Path

```
┌─────────────────────────────────────────────────┐
│ SHOWCASE & DEMO (0000, 0001, 0014)             │
│ ↓ (Foundation for all UI exposure)             │
├─────────────────────────────────────────────────┤
│ MOBILE SCREENS (0002-0005)                     │
│ Can work in parallel →                         │
│                                                 │
│ WEB UIs (0006-0009, 0012-0013)                │
│ Some depend on backend tasks ↓                 │
├─────────────────────────────────────────────────┤
│ BACKEND COMPLETIONS (0015-0017)                │
│ Required for: 0001, 0006, 0007, 0008          │
├─────────────────────────────────────────────────┤
│ NEW VERTICALS (0010-0011)                      │
│ Independent - can work anytime                 │
├─────────────────────────────────────────────────┤
│ ONBOARDING & DEVEX (0020-0024)                 │
│ Final polish after features exposed            │
└─────────────────────────────────────────────────┘
```

### Task Dependencies

- **0000 → 0001, 0014**: Demo data needed before tours and feature exposure
- **0015 → 0016**: Notifications needed for family engagement
- **0017 → 0007**: Billing service completion needed for billing UI
- **0006, 0007, 0008**: Can be done in parallel (different verticals)
- **0002-0005**: Mobile screens independent of each other
- **0010, 0011**: New verticals can start anytime
- **0020-0024**: Should come after main features exposed

---

## How to Use These Tasks

### For Layer 2 Implementors:

1. **Start with Tier 1** - highest impact (exposing features)
2. **Parallelize**: Multiple devs can work on different UI tasks simultaneously
3. **Each task file contains**:
   - Complete implementation instructions
   - Code examples and mockups
   - Testing requirements
   - Success criteria
4. **Pre-commit hooks MUST pass** - zero warnings/errors
5. **Create PR when complete** - all CI checks must pass

### For Project Managers:

- **Tier 1 is critical path** - determines when platform is "demo-ready"
- **Assign by expertise**:
  - Mobile developers → Tasks 0002-0005, 0020
  - React developers → Tasks 0006-0009, 0012-0014
  - Fullstack → Tasks 0010-0011, 0015-0017
  - UX/Content → Tasks 0000-0001, 0021-0022
- **Track via GitHub Projects** - create issues from task files

### Suggested Sprint Breakdown

**Sprint 1 (Week 1-2)**: Showcase Foundation
- Tasks: 0000, 0001, 0014
- Goal: Compelling demo environment

**Sprint 2 (Week 3-4)**: Mobile App Completion
- Tasks: 0002, 0003, 0004, 0005, 0020
- Goal: Functional caregiver mobile experience

**Sprint 3 (Week 3-4, parallel)**: Web UI Priority 1
- Tasks: 0006, 0007, 0015, 0017
- Goal: Shift matching and payroll UIs

**Sprint 4 (Week 5-6)**: Web UI Priority 2
- Tasks: 0008, 0009, 0012, 0013, 0016
- Goal: Analytics, QA, intake, search

**Sprint 5 (Week 7-8)**: New Verticals & Polish
- Tasks: 0010, 0011, 0021-0024
- Goal: Medications, emergency alerts, onboarding

---

## Task Structure

Each task file includes:

1. **Priority & Estimated Effort**
2. **Context**: Why this task exists and current state
3. **Objectives**: What needs to be built
4. **Detailed Implementation**: Step-by-step guide with code examples
5. **UI Mockups**: Visual representation of deliverables
6. **API Integration**: Backend endpoints needed
7. **Testing Requirements**: Unit, integration, and manual tests
8. **Success Criteria**: Definition of done
9. **Related Tasks**: Dependencies and follow-ups

---

## Monitoring Progress

Create `STATUS.md` in this directory to track completion:

```markdown
# Implementation Status

Last Updated: YYYY-MM-DD

## Tier 1: UI Exposure (15 tasks)

| Task | Status | Assignee | PR | Completed |
|------|--------|----------|----|-----------| 
| 0000 | ✅ Complete | @dev1 | #234 | 2025-11-12 |
| 0001 | ⏳ In Progress | @dev2 | #235 | |
| 0002 | 📋 Not Started | | | |
...

## Tier 2: Backend (3 tasks)

| Task | Status | Assignee | PR | Completed |
|------|--------|----------|----|-----------| 
| 0015 | ⏳ In Progress | @dev3 | #236 | |
...

## Tier 3: DevEx (5 tasks)

| Task | Status | Assignee | PR | Completed |
|------|--------|----------|----|-----------| 
| 0020 | 📋 Not Started | | | |
...
```

---

## Contact & Resources

- **Vision Document**: `claude/layer-1/memory.md`
- **Central Planner Instructions**: `claude/layer-1/input.md`
- **Architecture**: Root `README.md`
- **Deployment**: `DEPLOYMENT.md`
- **Contributing**: `CONTRIBUTING.md`

---

**Last Updated**: 2025-11-10  
**Generated By**: Layer 1 Central Planner  
**Total Tasks**: 23 (down from 39 after prioritization cleanup)  
**Focus**: Expose backend features in UIs, improve first impressions
