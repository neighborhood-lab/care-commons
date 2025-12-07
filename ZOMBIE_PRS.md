# Zombie PRs - GitHub Database Corruption

**Date:** 2025-12-07
**Issue:** PRs exist in GitHub API but return 404 on web interface
**Created by:** gaute-bot
**Visible to:** gaute-bot only (via API)

## Summary

Three pull requests were created by gaute-bot but exist in a corrupted state where they are visible via GitHub's REST API to the creating user, but return 404 for all users (including the creator) when accessed via the web interface.

## Characteristics

- ✅ Exist in GitHub's API database
- ✅ State shows as "open"
- ✅ Have valid PR numbers, IDs, and metadata
- ✅ Associated branches exist on remote
- ❌ Return 404 when accessed by other users via API
- ❌ Return 404 on web interface for ALL users
- ❌ Comments added via API also return 404
- ❌ Orphaned/corrupted permissions/visibility

## Zombie PRs

### PR #973: Schedule Builder - Drag-and-Drop Calendar

**Metadata:**
- **Number:** 973
- **Title:** feat: Schedule Builder - drag-and-drop calendar for coordinators
- **State:** open
- **Created:** 2025-12-07T03:27:57Z
- **User:** gaute-bot
- **Branch:** feat/schedule-builder-calendar → develop
- **ID:** 3078631010
- **URL:** https://github.com/neighborhood-lab/folk-care/pull/973 (404)

**Description:**

Critical coordinator workflow tool for assigning caregivers to client visits.

**Features:**
- ✅ Drag-and-drop visits from unassigned pool to caregiver time slots
- ✅ Visual calendar grid showing all caregivers and time slots (7am-8pm)
- ✅ Caregiver availability tracking
- ✅ Skill matching visual indicators
- ✅ Real-time assignment stats (assigned/unassigned/confirmed)
- ✅ Unassign functionality
- ✅ Time conflict prevention
- ✅ Day/Week view toggle (day implemented)

**UI Components:**
- Unassigned visits sidebar with visit details and tasks
- Calendar grid with hourly time slots
- Caregiver columns with color coding and skill badges
- Visit blocks showing client name, time range, and tasks
- Confirmation status badges
- Summary stats footer

**Files Changed:**
- packages/web/src/pages/scheduling/ScheduleBuilderPage.tsx (new, 652 lines)
- packages/web/src/App.tsx (routing)

---

### PR #980: Enhanced Family Messaging

**Metadata:**
- **Number:** 980
- **Title:** feat: enhanced Family Messaging with real-time chat interface
- **State:** open
- **Created:** 2025-12-07T04:15:25Z
- **User:** gaute-bot
- **Branch:** feat/family-messaging → develop
- **ID:** 3078662741
- **URL:** https://github.com/neighborhood-lab/folk-care/pull/980 (404)

**Description:**

Modern, WhatsApp-style messaging interface for families to communicate with their care team.

**Features:**
- ✅ Two-column layout: conversation list + active chat
- ✅ WhatsApp/iMessage-style message bubbles
- ✅ Real-time message updates
- ✅ Auto-scroll to latest message
- ✅ Role-based color coding (Coordinator=Blue, Caregiver=Green, Family=Purple)
- ✅ Smart timestamps
- ✅ Read receipts
- ✅ Unread message badges

**Files Changed:**
- packages/web/src/verticals/family-engagement/pages/MessagingPage.tsx (530 lines)

---

### PR #988: Caregiver Training & Certification System

**Metadata:**
- **Number:** 988
- **Title:** Caregiver Training & Certification Tracking System (#987)
- **State:** open
- **Created:** 2025-12-07T04:34:50Z
- **User:** gaute-bot
- **Branch:** feat/caregiver-training-certification → develop
- **ID:** 3078672943
- **URL:** https://github.com/neighborhood-lab/folk-care/pull/988 (404)

**Description:**

Comprehensive training and certification management system with expiration tracking, renewal reminders, and skills-based matching.

**Features:**
- 4-tab navigation: Overview, My Certifications, My Training, Course Catalog
- Visual status indicators (Active/Expiring/Expired)
- Progress tracking for courses
- Renewal reminders
- Skills-based matching capability

**Files Changed:**
- packages/web/src/pages/caregivers/CaregiverTrainingDashboard.tsx (~1100 lines)
- packages/web/src/App.tsx (routing)

---

## Root Cause Analysis

**Permission/Visibility Corruption:**

These PRs were created successfully in GitHub's database but have broken visibility permissions. They exist in the API layer but are inaccessible via the web interface.

**Impact:**

- Code changes exist in branches but cannot be reviewed via standard GitHub UI
- PR discussions, reviews, and merges cannot happen through normal workflow
- Other team members cannot see or interact with these PRs

## Resolution Plan

1. ✅ Document all zombie PR metadata and descriptions
2. Close zombie PRs via API (as gaute-bot)
3. Recreate PRs with proper visibility
4. Verify new PRs accessible to all users via web
5. Continue normal review/merge workflow

## Technical Details

**API Endpoint Used:**
```bash
GET /repos/neighborhood-lab/folk-care/pulls/{number}
```

**Authentication:**
- Token: GITHUB_TOKEN (gaute-bot) - stored in .secrets.txt

**Verification Commands:**
```bash
# API returns full PR data (as gaute-bot)
source .secrets.txt
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/neighborhood-lab/folk-care/pulls/973

# Web returns 404 for all users
curl -I https://github.com/neighborhood-lab/folk-care/pull/973
# HTTP/2 404
```

---

**Generated:** 2025-12-07T14:14:00Z
**By:** gaute-bot via Claude Code
