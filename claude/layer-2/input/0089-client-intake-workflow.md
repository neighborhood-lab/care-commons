# Task 0089: Client Intake and Onboarding Workflow

**Priority:** 🟠 HIGH
**Estimated Effort:** 1 week
**Type:** Feature / Workflow / UX
**Persona:** Coordinator

---

## Context

Client intake is a **multi-step, complex process** that coordinators handle frequently. Currently, coordinators must manually navigate between different screens to complete intake (client profile, care plan, scheduling, family portal setup). A streamlined intake workflow would dramatically improve efficiency.

**Current State:**
- Coordinator creates client in one screen
- Navigates to care plans to create care plan
- Navigates to scheduling to create first visit
- Navigates to family portal to invite family
- Each step is manual and easy to forget
- No checklist or guided workflow
- Takes 30-45 minutes per client

**Goal State:**
- Single intake wizard guides coordinator through all steps
- All client setup completed in one workflow
- Automatic task creation (geocode address, invite family, schedule first visit)
- Intake completed in <15 minutes
- Nothing forgotten or missed

---

## Objectives

1. **Create Multi-Step Intake Wizard**
2. **Auto-Complete Common Tasks**
3. **Add Intake Checklist and Validation**
4. **Generate Welcome Packet for Client/Family**
5. **Integrate with External Data Sources** (insurance verification, etc.)

---

## Intake Wizard Flow

### Step 1: Basic Information (2 min)
- Client demographics
- Contact information
- Emergency contacts

### Step 2: Address and Service Area (1 min)
- Home address
- Auto-geocode for GPS verification
- Confirm service area coverage

### Step 3: Health and Care Needs (3 min)
- Diagnosis
- Mobility level
- Care type and hours needed
- Special needs or considerations

### Step 4: Care Plan (5 min)
- Select care plan template
- Customize tasks
- Set goals

### Step 5: Scheduling (3 min)
- Preferred visit days/times
- Frequency (daily, weekly, etc.)
- Use shift matching to assign caregiver
- Create first visit or recurring schedule

### Step 6: Family Portal (2 min)
- Add family members
- Set notification preferences
- Send invitation emails

### Step 7: Billing (2 min)
- Insurance information
- Rate schedule selection
- Billing contact

### Step 8: Review and Confirm (1 min)
- Review all entered information
- Confirm and save
- Generate welcome packet

---

## UI Implementation

**File:** `packages/web/src/components/ClientIntakeWizard.tsx`

```tsx
export function ClientIntakeWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState({});

  const steps = [
    { id: 1, title: 'Basic Info', component: BasicInfoStep },
    { id: 2, title: 'Address', component: AddressStep },
    { id: 3, title: 'Care Needs', component: CareNeedsStep },
    { id: 4, title: 'Care Plan', component: CarePlanStep },
    { id: 5, title: 'Scheduling', component: SchedulingStep },
    { id: 6, title: 'Family Portal', component: FamilyPortalStep },
    { id: 7, title: 'Billing', component: BillingStep },
    { id: 8, title: 'Review', component: ReviewStep },
  ];

  return (
    <div className="intake-wizard">
      <ProgressIndicator currentStep={currentStep} totalSteps={8} />

      <StepContent>
        {React.createElement(steps[currentStep - 1].component, {
          data: clientData,
          onChange: setClientData,
        })}
      </StepContent>

      <Navigation>
        <Button onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1}>
          Back
        </Button>
        <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={currentStep === 8}>
          Next
        </Button>
        {currentStep === 8 && (
          <Button onClick={handleComplete} variant="primary">
            Complete Intake
          </Button>
        )}
      </Navigation>
    </div>
  );
}
```

---

## Auto-Complete Features

**Address Geocoding:**
- When coordinator enters address, auto-geocode using Google Maps API
- Validate address is within service area
- Store GPS coordinates for EVV compliance

**Care Plan Templates:**
- Suggest care plan based on diagnosis (e.g., "Alzheimer's" → Dementia Care template)
- Pre-populate common tasks
- Coordinator can customize

**Shift Matching Integration:**
- When coordinator selects preferred schedule, automatically run shift matching
- Show best caregiver matches
- One-click to assign and create visits

**Family Portal Invites:**
- Auto-generate invitation emails with login links
- Send immediately or schedule for later
- Track invitation status

---

## Welcome Packet Generation

**Auto-Generated PDF:**

```
Welcome to Sunshine Home Healthcare!

Client: Mary Johnson
Start Date: 11/15/2025

Your Care Team:
- Care Coordinator: Emily Rodriguez (512) 555-0101
- Primary Caregiver: Emma Davis (512) 555-0202

Your Schedule:
Monday, Wednesday, Friday: 9:00 AM - 11:00 AM

Your Care Plan:
[Summary of care plan goals and tasks]

Family Portal Access:
Your family members can access updates at:
https://app.care-commons.com/family-portal

Emergency Contact: (512) 555-0100 (24/7)

Next Steps:
- First visit: Monday, 11/15/2025 at 9:00 AM
- We will call you on 11/14 to confirm
- Please have your medications ready for caregiver to review

Questions? Call us anytime at (512) 555-0100
```

**Delivery:**
- Email to client
- Print and mail option
- Accessible in family portal

---

## Checklist Integration

**Intake Completion Checklist:**

```
Client Intake Checklist for Mary Johnson

Basic Information:
✅ Client demographics entered
✅ Emergency contact added
✅ Phone number verified

Address and Service:
✅ Address geocoded successfully
✅ Within service area (Austin, TX)
✅ GPS coordinates stored

Care Needs:
✅ Diagnosis documented
✅ Care type selected (Personal Care)
✅ Hours per week: 6 hours

Care Plan:
✅ Care plan created (Alzheimer's Care)
✅ 7 tasks defined
✅ Goals set

Scheduling:
✅ Schedule preference: M/W/F 9-11am
✅ Caregiver assigned: Emma Davis
✅ 12 visits created (next 4 weeks)

Family Portal:
✅ Family member added: Sarah Johnson
✅ Invitation sent
⏳ Waiting for Sarah to accept invitation

Billing:
✅ Medicaid ID entered
✅ Rate schedule: Personal Care - Standard
✅ Billing contact: Sarah Johnson

Final Steps:
✅ Welcome packet generated
✅ Welcome packet emailed to client
⏳ Waiting for first visit (11/15/2025)

Status: Ready for First Visit ✓
```

---

## External Integrations (Future Enhancement)

**Insurance Verification API:**
- Auto-verify Medicaid/Medicare eligibility
- Retrieve coverage details
- Flag expiring coverage

**Electronic Health Records (EHR) Integration:**
- Import client medical history
- Sync medications and allergies
- Bi-directional updates

**State Registry Check:**
- Verify client is eligible for home care services
- Check for any service restrictions

---

## Success Criteria

- [ ] Client intake time reduced from 45 min to <15 min
- [ ] 95% of intake steps auto-completed or pre-filled
- [ ] Zero missed steps (care plan, family portal, etc.)
- [ ] Welcome packet auto-generated 100% of the time
- [ ] First visit scheduled during intake 90% of the time
- [ ] Family portal invitations sent immediately
- [ ] Coordinator satisfaction with intake process >90%

---

## Related Tasks

- Task 0080: Coordinator Quick Start Guide
- Task 0076: Demo Data Seeding (includes intake examples)
- Task 0074: End-to-End User Journey Validation
