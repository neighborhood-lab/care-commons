# Task 0080: Coordinator Quick Start Guide and Training Materials

**Priority:** 🔴 CRITICAL
**Estimated Effort:** 3-4 days
**Type:** Documentation / User Experience / Training
**Persona:** Coordinator

---

## Context

Coordinators are the primary daily users of Care Commons - they schedule visits, manage caregivers, handle client needs, and ensure smooth operations. If coordinators can't quickly understand the platform, the agency can't operate effectively.

**Current State:**
- No coordinator-specific quick start guide
- No training materials for new coordinators
- Coordinators must learn by trial and error
- High risk of scheduling mistakes or inefficient workflows
- No onboarding checklist for coordinators

**Goal State:**
- Coordinator can complete core tasks within first hour
- Step-by-step guide for daily workflows
- Video training for common scenarios
- Interactive product tours for key features
- Coordinator feels competent and confident

---

## Objectives

1. **Create Coordinator Quick Start Guide** (documentation)
2. **Build Training Materials** (video + interactive)
3. **Create Daily Workflow Checklists** (operational guides)
4. **Add In-App Help and Tooltips** (contextual guidance)
5. **Create Troubleshooting Guide** (common issues and solutions)

---

## Deliverable 1: Coordinator Quick Start Guide

**File:** `docs/user-guides/coordinator-quick-start.md`

```markdown
# Coordinator Quick Start Guide

**Time to Complete:** 30-45 minutes
**Goal:** Learn how to manage daily operations in Care Commons

---

## Welcome, Coordinator! 👋

As a care coordinator, you're the heart of your agency's operations. This guide will teach you how to:

✅ Schedule visits efficiently
✅ Manage clients and caregivers
✅ Use shift matching to find the best caregiver
✅ Handle day-of changes and emergencies
✅ Communicate with families
✅ Review and approve completed visits

---

## Your Dashboard Overview (5 minutes)

### What You See on Login

1. **Today's Overview Card**
   - Total visits scheduled today
   - In-progress visits
   - Pending approvals
   - Any alerts or issues

2. **Quick Actions**
   - Schedule Visit (most common task)
   - Add New Client
   - Add New Caregiver
   - View Messages

3. **Recent Activity**
   - Latest visit updates
   - Recent messages
   - System notifications

4. **This Week's Schedule**
   - Calendar view of all scheduled visits
   - Color-coded by status (scheduled, in-progress, completed)

### Navigation

- **Dashboard:** Your home base
- **Scheduling:** Create and manage visits
- **Clients:** Manage client profiles and care plans
- **Caregivers:** Manage caregiver profiles and availability
- **Visits:** View all visits (past, present, future)
- **Messages:** Communicate with team and families
- **Reports:** View analytics and generate reports

---

## Core Task #1: Add a New Client (10 minutes)

### Step-by-Step: Onboarding a Client

1. **Navigate to:** Clients → Add New Client

2. **Basic Information Tab:**
   ```
   First Name: Mary
   Last Name: Johnson
   Date of Birth: 03/15/1945 (age 79)
   Email: mary.johnson@email.com (optional)
   Phone: (512) 555-7890
   ```

3. **Address Tab:**
   ```
   Street Address: 456 Oak Street
   Apartment/Unit: (leave blank if none)
   City: Austin
   State: Texas
   ZIP Code: 78704
   ```

   💡 **Tip:** The system automatically geocodes the address for GPS verification.
   If geocoding fails, you'll be prompted to verify the address.

4. **Care Information Tab:**
   ```
   Diagnosis: Alzheimer's Disease
   Mobility Level: Walker
   Care Type: Personal Care
   Hours Per Week: 20
   Preferred Language: English
   ```

5. **Emergency Contact Tab:**
   ```
   Contact Name: Sarah Johnson (daughter)
   Relationship: Daughter
   Phone: (512) 555-1234
   Email: sarah.j@email.com
   ```

6. **Insurance/Billing Tab:**
   ```
   Medicaid ID: TX1234567890
   Medicare ID: (if applicable)
   Private Pay: No
   Rate Schedule: Personal Care - Standard
   ```

7. **Click "Save Client"**

✅ **Success Indicator:** You see "Client added successfully" and client appears in client list

---

## Core Task #2: Create a Care Plan (5 minutes)

After adding a client, create their care plan.

1. **From Client Profile → Click "Care Plans" Tab**

2. **Click "Create Care Plan"**

3. **Select Template** (or start from scratch):
   - Alzheimer's/Dementia Care
   - Post-Stroke Recovery
   - Diabetes Management
   - General Personal Care

4. **Add Care Tasks:**

   **Example Tasks for Alzheimer's Care:**
   - [ ] Morning routine assistance (bathing, dressing, grooming)
   - [ ] Medication administration (see medication list)
   - [ ] Meal preparation and feeding assistance
   - [ ] Mobility assistance and fall prevention
   - [ ] Cognitive stimulation activities
   - [ ] Bathroom assistance
   - [ ] Evening routine

   For each task:
   - **Task Name:** Bathing Assistance
   - **Category:** ADL (Activities of Daily Living)
   - **Frequency:** Daily
   - **Estimated Time:** 20 minutes
   - **Instructions:** Use shower chair, monitor water temperature, ensure safety bars are used

5. **Click "Save Care Plan"**

✅ **Success:** Caregivers will see these tasks during visits

---

## Core Task #3: Schedule a Visit Using Shift Matching (10 minutes)

**Scenario:** You need to schedule a recurring visit for Mary Johnson, 3 days per week (M/W/F), 9am-11am.

### Step 1: Create the Shift

1. **Navigate to:** Scheduling → Create Visit

2. **Select Client:** Mary Johnson

3. **Visit Details:**
   ```
   Service Type: Personal Care
   Date: Tomorrow (or select date)
   Start Time: 9:00 AM
   End Time: 11:00 AM
   Recurring: Yes
   Pattern: Weekly on Monday, Wednesday, Friday
   End Date: +3 months (or specific date)
   ```

4. **Special Instructions:**
   ```
   "Please use side entrance. Dog (Buddy) is friendly.
   Medication chart is on kitchen counter."
   ```

### Step 2: Use Shift Matching

5. **Click "Find Best Caregiver"** (this runs the shift matching algorithm)

6. **Review Recommendations:**

   You'll see caregivers ranked by match score:

   ```
   1. Emma Davis - 95% Match
      ✅ Has Alzheimer's training
      ✅ Speaks English
      ✅ Available M/W/F 9am-11am
      ✅ Within 5 miles of client
      ✅ No scheduling conflicts
      ⚠️  New caregiver (3 months experience)

   2. Robert Miller - 88% Match
      ✅ 5 years experience
      ✅ Alzheimer's certified
      ✅ Available M/W/F 9am-11am
      ⚠️  10 miles from client (longer drive)

   3. Lisa Garcia - 75% Match
      ✅ 2 years experience
      ⚠️  No Alzheimer's training
      ✅ Available M/W/F 9am-11am
   ```

7. **Select Caregiver:** Click "Assign" next to Emma Davis

8. **Review Recurring Schedule:**
   - The system shows all visit dates that will be created
   - Review for any conflicts or holidays

9. **Click "Create Visits"**

✅ **Success:**
- Visits appear on calendar
- Caregiver receives notification
- Client/family receives notification (if enabled)

---

## Core Task #4: Handle a Day-Of Change (5 minutes)

**Scenario:** Emma calls in sick. You need to find a replacement for today's visit.

### Step 1: Mark Caregiver Unavailable

1. **Navigate to:** Caregivers → Emma Davis → Availability

2. **Click "Mark Unavailable"**
   ```
   Date: Today
   Reason: Sick
   All Day: Yes
   ```

### Step 2: Reassign Visit

3. **Navigate to:** Dashboard → Today's Visits

4. **Find Mary Johnson's 9am visit** (now showing ⚠️ "Caregiver Unavailable")

5. **Click visit → "Find Replacement"**

6. **Shift Matching runs again** showing available caregivers:
   ```
   1. Robert Miller - 88% Match (available now)
   2. Lisa Garcia - 75% Match (available now)
   ```

7. **Assign Robert Miller**

8. **Notify affected parties:**
   - [ ] Robert gets notification with visit details
   - [ ] Mary Johnson's emergency contact gets SMS/email about change
   - [ ] Family portal shows updated caregiver

✅ **Success:** Visit reassigned in <5 minutes, all parties notified

---

## Core Task #5: Approve a Completed Visit (5 minutes)

At end of day, review completed visits before they go to billing.

1. **Navigate to:** Visits → Completed (Today)

2. **Click on a visit** to review:

   **What to Check:**
   - ✅ Clock-in/out times match scheduled times (±10 minutes is normal)
   - ✅ GPS location verified (within 300 feet of client address)
   - ✅ Caregiver signature captured
   - ✅ Care tasks marked complete
   - ✅ Visit notes entered
   - ⚠️ Any issues flagged?

3. **Review EVV Compliance:**
   ```
   EVV Status: ✅ Compliant

   ✅ GPS: Clock-in 456 Oak St (15 feet from client)
   ✅ GPS: Clock-out 456 Oak St (8 feet from client)
   ✅ Biometric: Face ID verified
   ✅ Time: 9:02 AM - 11:05 AM (2.05 hours, within tolerance)
   ✅ Signature: Captured
   ✅ Tasks: 7/7 completed
   ```

4. **Read Visit Notes:**
   ```
   "Mary was in good spirits today. Completed all ADLs without
   difficulty. Ate full breakfast. Reminded about afternoon medication.
   No concerns."
   ```

5. **Approve or Flag:**
   - **If all looks good:** Click "Approve for Billing"
   - **If issues:** Click "Flag for Review" and add note

✅ **Success:** Visit approved, will appear on next invoice

---

## Daily Workflow Checklist

### Morning (8:00 AM - 9:00 AM)

- [ ] Review today's visit schedule
- [ ] Check for any caregiver call-offs or issues
- [ ] Handle any reassignments
- [ ] Review family messages from overnight
- [ ] Check upcoming week for gaps

### During the Day (9:00 AM - 5:00 PM)

- [ ] Monitor visit statuses (clock-ins/outs)
- [ ] Handle any emergency changes
- [ ] Respond to caregiver questions
- [ ] Respond to family inquiries
- [ ] Schedule new visits as needed
- [ ] Onboard new clients/caregivers

### End of Day (5:00 PM - 6:00 PM)

- [ ] Review all completed visits
- [ ] Approve visits for billing
- [ ] Flag any issues for follow-up
- [ ] Confirm tomorrow's schedule
- [ ] Send any necessary communications

---

## Keyboard Shortcuts

Speed up your workflow with these shortcuts:

- `Ctrl+N` or `Cmd+N`: New Visit
- `Ctrl+F` or `Cmd+F`: Search (clients, caregivers, visits)
- `Ctrl+K` or `Cmd+K`: Quick Actions menu
- `/`: Jump to search bar
- `?`: Show all keyboard shortcuts

---

## Common Scenarios

### Scenario: Client Requests Schedule Change

**Steps:**
1. Navigate to client's recurring visits
2. Select visits to modify
3. Choose: "Update This and Future Visits" or "Update Just This Visit"
4. Change time/day as requested
5. Check for caregiver conflicts
6. Save changes
7. System automatically notifies all parties

### Scenario: Family Member Has Concerns

**Steps:**
1. Navigate to Messages
2. Find message from family member
3. Read concern
4. Check visit history and caregiver notes for context
5. Reply with empathy and action plan
6. If needed, schedule phone call
7. Flag for follow-up if not resolved

### Scenario: Caregiver Needs Training

**Steps:**
1. Navigate to Caregiver Profile → Certifications
2. Click "Request Training/Certification"
3. Select training type (e.g., Alzheimer's Care)
4. Assign training provider or internal trainer
5. Set deadline
6. Caregiver receives notification
7. Track completion in caregiver profile

---

## Tips for Success

### Best Practices

1. **Schedule Proactively:** Try to schedule 2-3 weeks ahead when possible
2. **Use Shift Matching:** Don't manually assign - let the algorithm find the best fit
3. **Keep Care Plans Updated:** Review care plans monthly or when client needs change
4. **Communicate Early:** Notify families of changes as soon as possible
5. **Review Daily:** Don't let visits pile up for approval - review daily

### Time-Saving Tips

1. **Use Templates:** Create care plan templates for common scenarios
2. **Bulk Actions:** Select multiple visits to approve at once
3. **Filters:** Use filters to find specific visits quickly
4. **Favorites:** Star frequently accessed clients/caregivers
5. **Quick Notes:** Use saved note templates for common visit notes

### Avoid These Mistakes

- ❌ Assigning without checking caregiver availability
- ❌ Not verifying GPS addresses for new clients
- ❌ Ignoring EVV compliance warnings
- ❌ Forgetting to notify families of caregiver changes
- ❌ Approving visits without reviewing notes

---

## Troubleshooting

### Issue: Shift Matching Shows No Results

**Solution:**
- Check date/time - may be outside caregiver availability
- Expand search radius (increase max drive distance)
- Relax requirements (skills, certifications)
- Check if it's a holiday (some caregivers may be unavailable)

### Issue: GPS Verification Failed

**Solution:**
- Verify client address is correct
- Check if caregiver has location services enabled
- Increase GPS tolerance in settings (if within 500 feet, likely ok)
- Manual override with justification (document reason)

### Issue: Caregiver Didn't Clock In

**Solution:**
- Check if caregiver's phone had connectivity
- Verify visit actually occurred (call caregiver/client)
- Manually enter visit times with justification
- Document for payroll and billing

---

## Next Steps

**Now that you know the basics:**

- 📚 [Complete Coordinator Guide](./coordinator-complete-guide.md)
- 🎥 [Video Training Series](./coordinator-video-training.md)
- 💡 [Advanced Features Guide](./coordinator-advanced-features.md)
- 📊 [Reports and Analytics Guide](./coordinator-reports.md)

**Need Help?**
- 💬 Ask your administrator
- 📧 Contact support: support@care-commons.com
- 📚 Search documentation: docs.care-commons.com

---

## Quick Reference Card

Print this and keep it at your desk:

| Task | Steps |
|------|-------|
| **Schedule Visit** | Scheduling → Create → Select Client → Use Shift Matching → Assign |
| **Find Replacement** | Today's Visits → Click Visit → Find Replacement |
| **Approve Visit** | Visits → Completed → Review → Approve |
| **Add Client** | Clients → Add New → Fill Form → Save |
| **Message Family** | Messages → New Message → Select Recipient → Send |
| **View Reports** | Reports → Select Report Type → Set Date Range → Generate |

**Emergency Contact:**
- After-hours support: (555) 555-0199
- Your administrator: [admin contact]
```

---

## Deliverable 2: Video Training Series

### Video 1: "Welcome to Care Commons" (5 minutes)
- Dashboard overview
- Navigation basics
- Where to find help

### Video 2: "Scheduling Your First Visit" (8 minutes)
- Client selection
- Setting visit details
- Using shift matching
- Creating recurring visits

### Video 3: "Managing Day-of-Changes" (6 minutes)
- Handling caregiver call-offs
- Finding replacements quickly
- Notifying affected parties

### Video 4: "End-of-Day Workflow" (7 minutes)
- Reviewing completed visits
- EVV compliance checks
- Approving for billing
- Handling flags

### Video 5: "Family Communication Best Practices" (5 minutes)
- Reading and responding to messages
- Proactive communication
- Managing expectations

---

## Deliverable 3: In-App Interactive Tours

**File:** `packages/web/src/tours/coordinator-tours.ts`

```typescript
import Shepherd from 'shepherd.js';

export function startSchedulingTour() {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: 'shepherd-theme-custom',
      scrollTo: true,
    }
  });

  tour.addStep({
    id: 'scheduling-intro',
    text: `<h3>Let's Schedule a Visit!</h3>
           <p>I'll walk you through scheduling a visit using our shift matching feature.</p>`,
    buttons: [
      { text: 'Skip', action: tour.cancel },
      { text: 'Start', action: tour.next }
    ]
  });

  tour.addStep({
    id: 'select-client',
    text: `<p>First, select the client you're scheduling for.</p>`,
    attachTo: { element: '.client-select', on: 'bottom' },
    buttons: [
      { text: 'Back', action: tour.back },
      { text: 'Next', action: tour.next }
    ]
  });

  tour.addStep({
    id: 'visit-details',
    text: `<p>Enter the visit date, start time, and end time. You can also make this a recurring visit.</p>`,
    attachTo: { element: '.visit-details-form', on: 'right' },
    buttons: [
      { text: 'Back', action: tour.back },
      { text: 'Next', action: tour.next }
    ]
  });

  tour.addStep({
    id: 'shift-matching',
    text: `<p>Click "Find Best Caregiver" to see our recommendations. We use 8 factors to match the perfect caregiver for this visit.</p>`,
    attachTo: { element: '.shift-matching-button', on: 'top' },
    buttons: [
      { text: 'Back', action: tour.back },
      { text: 'Next', action: tour.next }
    ]
  });

  tour.addStep({
    id: 'review-matches',
    text: `<p>Review the match scores and select the best caregiver. The score shows skills, availability, location, and more.</p>`,
    attachTo: { element: '.caregiver-matches', on: 'left' },
    buttons: [
      { text: 'Back', action: tour.back },
      { text: 'Finish', action: tour.complete }
    ]
  });

  tour.start();
}
```

**Trigger tours on:**
- First login as coordinator
- First time accessing each feature
- Opt-in via Help menu

---

## Success Criteria

- [ ] Coordinator Quick Start Guide published and accessible
- [ ] 5-video training series recorded and embedded
- [ ] Interactive product tours implemented for core workflows
- [ ] Daily workflow checklists created and laminated
- [ ] User testing shows 90%+ of coordinators can schedule a visit independently within 30 minutes
- [ ] Coordinators feel confident using the platform after onboarding
- [ ] Support tickets related to "how to" questions reduced by 80%

---

## Related Tasks

- Task 0074: End-to-End User Journey Validation
- Task 0076: Demo Data Seeding
- Task 0079: Administrator Quick Start Guide
- Task 0089: Client Intake Workflow
