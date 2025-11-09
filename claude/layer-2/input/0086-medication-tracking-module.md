# Task 0086: Medication Tracking and Management Module

**Priority:** 🟠 HIGH
**Estimated Effort:** 2 weeks
**Type:** Feature / Healthcare / Compliance
**Vertical:** medication-management (NEW)

---

## Context

Medication administration is one of the **most critical tasks** in home healthcare, but Care Commons currently lacks a dedicated medication tracking module. Caregivers need to document medications given, track schedules, and flag issues.

**Compliance Risk:**
- Medication errors are leading cause of patient harm
- Documentation required for Medicare/Medicaid reimbursement
- State regulations require medication administration records (MAR)

**Current State:**
- Medications can be mentioned in care plan tasks (ad-hoc)
- No structured medication list
- No administration tracking
- No medication schedule or reminders
- No medication error reporting

**Goal State:**
- Complete medication list per client
- Scheduled medication reminders
- Caregivers document each administration
- Photo documentation of medications
- Medication error/refusal tracking
- eMAR (electronic Medication Administration Record) export

---

## Objectives

1. **Create Medication Database Schema**
2. **Build Medication Management UI (Web)**
   - Coordinators add/edit client medications
   - Medication schedules (time, frequency, PRN)
3. **Build Medication Tracking UI (Mobile)**
   - View medication schedule during visit
   - Mark as given/refused/not available
   - Photo documentation
4. **Generate eMAR Reports**
5. **Handle Medication Errors**

---

## Database Schema

```sql
-- Medications master list
CREATE TABLE medications (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),

  -- Medication details
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  strength VARCHAR(100), -- e.g., "10mg"
  form VARCHAR(50), -- pill, liquid, injection, patch, etc.

  -- Prescribing info
  prescribed_by VARCHAR(255), -- doctor name
  prescription_number VARCHAR(100),
  pharmacy VARCHAR(255),
  pharmacy_phone VARCHAR(20),

  -- Schedule
  schedule_type VARCHAR(20), -- scheduled, prn (as-needed)
  frequency VARCHAR(100), -- "2x daily", "every 6 hours", "as needed"
  times JSONB, -- ["08:00", "20:00"]

  -- Instructions
  dosage VARCHAR(255), -- "1 tablet"
  route VARCHAR(50), -- oral, topical, injection, etc.
  special_instructions TEXT,

  -- Status
  active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Medication administration log
CREATE TABLE medication_administrations (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER REFERENCES medications(id),
  visit_id INTEGER REFERENCES visits(id),
  caregiver_id INTEGER REFERENCES caregivers(id),

  -- Administration details
  scheduled_time TIMESTAMP,
  actual_time TIMESTAMP,
  status VARCHAR(20), -- given, refused, not_available, omitted

  -- Documentation
  dosage_given VARCHAR(255),
  photo_url VARCHAR(500), -- photo of medication bottle
  notes TEXT, -- if refused, why? any observations?

  -- Verification
  verified_by INTEGER REFERENCES users(id), -- nurse/coordinator verification
  verified_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Medication errors/incidents
CREATE TABLE medication_incidents (
  id SERIAL PRIMARY KEY,
  medication_id INTEGER REFERENCES medications(id),
  client_id INTEGER REFERENCES clients(id),
  caregiver_id INTEGER REFERENCES caregivers(id),

  incident_type VARCHAR(50), -- wrong_medication, wrong_dose, wrong_time, missed, other
  description TEXT,
  severity VARCHAR(20), -- low, medium, high, critical

  -- Response
  action_taken TEXT,
  reported_to VARCHAR(255), -- doctor, nurse, family, 911, etc.
  reported_at TIMESTAMP,

  resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Web UI: Medication Management

**Location:** `packages/web/src/verticals/medication-management/`

### Components Needed

1. **MedicationList.tsx** - View all medications for a client
2. **AddMedicationForm.tsx** - Add new medication
3. **MedicationSchedule.tsx** - Visual schedule of when meds are due
4. **MedicationHistory.tsx** - Administration history (eMAR view)
5. **MedicationIncidentForm.tsx** - Report medication errors

### Key Features

**For Coordinators:**
- Add medications with full details (name, dosage, schedule, prescriber)
- Set up medication schedules (specific times or PRN)
- View medication administration history
- Generate eMAR reports (PDF, CSV)
- Review and handle medication incidents

---

## Mobile UI: Medication Administration

**Location:** `packages/mobile/src/screens/MedicationsScreen.tsx`

### Caregiver Workflow

**During Visit:**

1. **View Medication Schedule**
   - Shows medications due during this visit time
   - Color-coded: due now (red), upcoming (yellow), completed (green)

2. **Administer Medication**
   - Tap medication to mark as given
   - Scan barcode (optional, if medication has barcode)
   - Take photo of medication bottle (for verification)
   - Confirm dosage given
   - Add notes (e.g., "Took with food", "Client complained of nausea")

3. **Handle Refusals**
   - Mark as "Refused"
   - Required: Select reason (doesn't want to, already took, feeling sick, etc.)
   - Required: Add notes

4. **PRN (As-Needed) Medications**
   - Separate section for PRN meds
   - Caregiver can administer if needed
   - Must document reason (e.g., "Client had headache, gave Tylenol")

### Example UI

```tsx
<View>
  <Text style={styles.sectionHeader}>Medications Due Now</Text>

  {medications.map(med => (
    <MedicationCard
      key={med.id}
      medication={med}
      onGive={() => handleGiveMedication(med)}
      onRefuse={() => handleRefuseMedication(med)}
      onNotAvailable={() => handleNotAvailable(med)}
    />
  ))}
</View>

<MedicationCard>
  <View style={styles.medInfo}>
    <Text style={styles.medName}>Lisinopril 10mg</Text>
    <Text style={styles.medTime}>Due: 8:00 AM</Text>
    <Text style={styles.medDosage}>1 tablet by mouth</Text>
    <Text style={styles.medPrescriber}>Dr. Smith</Text>
  </View>

  <View style={styles.actions}>
    <Button title="✓ Given" onPress={onGive} color="green" />
    <Button title="✗ Refused" onPress={onRefuse} color="red" />
    <Button title="Not Available" onPress={onNotAvailable} />
  </View>
</MedicationCard>
```

---

## eMAR (Electronic Medication Administration Record)

**Generate Report:**

PDF format showing:
- Client name and date range
- All medications administered
- Date/time of each administration
- Caregiver who administered
- Any refusals or incidents
- Signatures (caregiver, client if able, supervisor)

**Compliance Requirements:**
- Medicare/Medicaid requires MAR documentation
- Must be retained for 7 years
- Must be available for state audits

**Export Format:**
```
MEDICATION ADMINISTRATION RECORD
Client: Mary Johnson
Date Range: 11/01/2025 - 11/30/2025

Medication: Lisinopril 10mg
Prescribed by: Dr. Smith
Dosage: 1 tablet by mouth, 8:00 AM daily

Date       | Time  | Caregiver    | Status | Notes
-----------|-------|--------------|--------|------------------
11/01/2025 | 08:05 | Emma Davis   | Given  | Took with water
11/02/2025 | 08:10 | Emma Davis   | Given  | No issues
11/03/2025 | 08:15 | Robert Miller| Refused| "Felt nauseous"
11/04/2025 | 08:00 | Emma Davis   | Given  | Back to normal
```

---

## Medication Error Handling

**When Error Occurs:**

1. **Immediate Documentation**
   - Caregiver marks incident in app
   - Describes what happened
   - Notes any patient symptoms or concerns

2. **Automatic Notifications**
   - Coordinator notified immediately
   - Nurse/supervisor notified
   - Family notified (depending on severity)

3. **Follow-up Required**
   - Coordinator reviews incident
   - Determines severity
   - May require contacting doctor or 911
   - Documents resolution

4. **Reporting**
   - Incidents tracked for quality assurance
   - Patterns identified (e.g., specific caregiver needs retraining)
   - Reported to state agencies if required

---

## Success Criteria

- [ ] Coordinators can add and manage client medications
- [ ] Medication schedules are clear and accurate
- [ ] Caregivers can document medication administration in <30 seconds
- [ ] Photo documentation works on mobile
- [ ] eMAR reports are accurate and compliant
- [ ] Medication refusals and errors are properly documented
- [ ] Zero medication documentation gaps during audits

---

## Related Tasks

- Task 0091: Visit Notes Templates (medication notes)
- Task 0104: Visit Photo Documentation (medication photos)
- Task 0061: Quality Assurance Module (medication audits)
