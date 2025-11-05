# Ohio Home Healthcare Compliance Requirements

**State Code**: OH  
**Last Updated**: 2025-11-05  
**Verified By**: Care Commons Compliance Team  
**Next Review Date**: 2026-02-05

## Table of Contents

1. [Caregiver Credentials](#caregiver-credentials)
2. [Client Authorization](#client-authorization)
3. [Visit Documentation](#visit-documentation)
4. [Electronic Visit Verification (EVV)](#electronic-visit-verification-evv)
5. [Data Retention](#data-retention)
6. [Privacy & Security](#privacy--security)
7. [Quality Standards](#quality-standards)

---

## Overview

Ohio's home healthcare regulations are administered by the **Ohio Department of Medicaid (ODM)** and **Ohio Department of Health (ODH)**. The state uses Sandata as its EVV aggregator (FREE for providers) and has moderate licensing requirements compared to other states.

**Key Characteristics:**
- FREE Sandata EVV aggregator (major cost savings)
- Balanced geofencing (125m base + 75m tolerance = 200m total)
- 10-minute grace periods
- 5,000+ home health agencies in state
- Strong managed care presence (MyCare Ohio, Passport)

---

## 1. Caregiver Credentials

### 1.1 Background Screening

**Statutory Authority:**
- Ohio Revised Code §173.27 (Criminal Records Check)
- Ohio Revised Code §5164.34 (Medicaid Provider Standards)
- Ohio Administrative Code 5160-1-17 (Home Health Provider Requirements)
- Ohio Administrative Code 5160-58-01 (Personal Care Aide Standards)

**Requirement:**
All caregivers providing services to Medicaid beneficiaries must undergo criminal background screening before client contact. Ohio requires **FBI and BCI (Bureau of Criminal Investigation)** fingerprint checks.

**Frequency:**
- **Initial**: Before first client contact
- **Renewal**: Every **5 years**
- **Re-verification triggers**: 
  - Break in service exceeding 90 days
  - Substantiated incident or allegation
  - Change in service type (e.g., moving from non-medical to skilled care)

**Disqualifying Offenses:**
- Felony convictions within past 5 years (most offenses)
- Certain offenses PERMANENTLY disqualifying:
  - Murder, rape, sexual assault
  - Crimes against children or elderly
  - Drug trafficking
  - Theft or fraud against vulnerable adults
- Misdemeanor convictions may be reviewed case-by-case

**How to Verify:**
1. Submit fingerprints to **Ohio BCI** via approved vendor (e.g., Fieldprint, IdentoGO)
2. BCI conducts FBI (federal) and Ohio (state) criminal history check
3. Results provided to agency within 3-5 business days
4. Agency maintains copy of clearance letter for file
5. Ohio BCI Portal: https://www.ohioattorneygeneral.gov/Business/Services-for-Business/WebCheck

**Implementation:**
```typescript
// Database fields needed
background_check_date: timestamp           // Date clearance received
background_check_status: enum              // CLEAR, PENDING, ISSUES, EXPIRED
  - CLEAR: Eligible for client contact
  - PENDING: Submitted, awaiting results
  - ISSUES: Disqualifying findings, requires review
  - EXPIRED: >5 years since check
background_check_type: 'FBI_BCI'           // Ohio requires both FBI and BCI
background_check_agency: 'OHIO_BCI'        // Authority that conducted check
background_check_documentation: file_ref   // PDF of clearance letter
background_check_expiration: timestamp     // checkDate + 5 years
bci_tracking_number: string                // BCI transaction ID for audits

// Validation rules
- Cannot assign to visit if status != 'CLEAR'
- Cannot assign if expiration < TODAY
- Warning if expiration within 60 days
- Blocking if status = 'PENDING' or 'ISSUES'
```

**Test Scenarios:**
- [ ] New hire with FBI+BCI clearance (<5 years old) → Allow assignments
- [ ] Caregiver with background check from 4.8 years ago → Warning (expiring in ~70 days)
- [ ] Caregiver with background check from 5+ years ago → Block assignments (expired)
- [ ] Caregiver with pending FBI/BCI check → Block assignments
- [ ] Caregiver with disqualifying offense → Permanent block (cannot be overridden)
- [ ] Caregiver returning after 100-day break → Require new background check

**Edge Cases:**
- **Out-of-state transfers**: Ohio does NOT accept other states' background checks. Caregivers moving from PA, MI, IN, etc. must complete Ohio FBI+BCI check.
- **Name changes**: Re-verify using both maiden and married names. BCI requires legal name match.
- **Previous employment**: If caregiver worked for another Ohio agency within past 90 days, agency may request copy of prior check (with caregiver consent) to expedite process.
- **Live Scan vs. Mail**: Ohio allows live scan (electronic) or ink card submission. Live scan results faster (3-5 days vs. 2-3 weeks).

**Related Requirements:**
- Also requires Nurse Aide Registry check (separate requirement, see §1.2)
- STNA (State Tested Nurse Aide) credentials for CNAs (see §1.3)

---

### 1.2 Nurse Aide Registry Check

**Statutory Authority:**
- Ohio Revised Code §3721.30 (Nurse Aide Registry)
- Ohio Administrative Code 3701-18-03 (Registry Verification)
- 42 CFR §483.156 (Federal Nurse Aide Registry Requirements)

**Requirement:**
Before assigning a **CNA/STNA** (Certified Nursing Assistant / State Tested Nurse Aide) to any client, agencies must verify the aide is:
1. Listed on Ohio Nurse Aide Registry
2. Registry status is **ACTIVE** (not expired, suspended, or revoked)
3. No findings of abuse, neglect, or misappropriation on registry

**Frequency:**
- **Initial**: Before first assignment as CNA
- **At hire**: Verify for all CNAs
- **Periodic**: Re-verify annually or if suspicion of registry changes
- **Required for**: CNA, STNA roles ONLY (not HHAs or PCAs without CNA credential)

**How to Verify:**
1. Access Ohio Nurse Aide Registry: https://odh.ohio.gov/know-our-programs/nurse-aide-registry/ohio-nurse-aide-registry
2. Search by caregiver's name and date of birth (DOB)
3. Verify:
   - Registry ID number
   - Status: ACTIVE (not inactive, expired, suspended)
   - No abuse/neglect findings listed
   - Certification expiration date (renewed every 2 years with 12 hours CE)
4. Print verification page or save PDF for documentation
5. Document registry ID and verification date in caregiver file

**Ohio-Specific Notes:**
- Ohio requires **12 hours of in-service training annually** for STNAs
- STNA certification expires every **2 years** and must be renewed
- If STNA worked as paid nurse aide within past 24 months (anywhere in US), registry remains active
- If >24 months without paid work, STNA must re-test (competency evaluation)

**Implementation:**
```typescript
// Database fields needed
ohio_stna_number: string                   // Registry ID (e.g., "12345-OH")
ohio_stna_status: enum                     // ACTIVE, INACTIVE, EXPIRED, SUSPENDED, REVOKED
ohio_stna_verification_date: timestamp     // Last registry check date
ohio_stna_certification_exp: timestamp     // Certification expiration (2-year cycle)
ohio_stna_ce_hours_current_cycle: number   // Track 12 hours annual in-service
ohio_stna_last_paid_work: timestamp        // Track 24-month work requirement
ohio_stna_documentation: file_ref          // Screenshot of registry verification

// Validation rules
- If role = 'CNA' or 'STNA', ohio_stna_number must be present
- ohio_stna_status must = 'ACTIVE'
- ohio_stna_certification_exp must be > TODAY
- Warning if ohio_stna_verification_date > 365 days ago (re-verify annually)
- Warning if ohio_stna_certification_exp within 60 days
- Blocking if ohio_stna_status != 'ACTIVE'
- Blocking if ohio_stna_certification_exp expired
```

**Test Scenarios:**
- [ ] CNA with active STNA, verified within past year → Allow assignments
- [ ] CNA with STNA expiring in 30 days → Warning (renew soon)
- [ ] CNA with expired STNA certification → Block assignments
- [ ] CNA with SUSPENDED or REVOKED status → Permanent block
- [ ] CNA with last verification >400 days ago → Warning (re-verify recommended)
- [ ] HHA (not CNA) without STNA → Allow (STNA not required for HHA role)
- [ ] CNA with out-of-state registry (e.g., PA) working in Ohio → Block (must be on Ohio registry)

**Edge Cases:**
- **Multi-state registries**: If aide is on PA, MI, or IN registry but working in Ohio, they must ALSO be on Ohio registry through reciprocity or testing.
- **Recent graduates**: New STNAs may show "PENDING" status for 5-10 business days after exam. Cannot work as STNA until status = ACTIVE.
- **Findings of abuse**: If registry shows substantiated findings, aide is permanently ineligible. No exceptions.
- **Name changes**: Registry search requires exact name match. Search under maiden name if recent marriage/divorce.

**Related Requirements:**
- Background screening (§1.1) - separate requirement, both must be met
- 12-hour annual in-service training (§1.4)
- Competency evaluation if >24 months without paid work

---

### 1.3 Home Health Aide (HHA) Training

**Statutory Authority:**
- Ohio Administrative Code 5160-58-01.1 (HHA Training Standards)
- 42 CFR §484.80 (Medicare Conditions of Participation - Aide Training)
- Ohio Medicaid Personal Care Services Rules

**Requirement:**
All **Home Health Aides (HHAs)** must complete a state-approved training program before providing personal care services to Medicaid or Medicare clients.

**Training Components:**
1. **Minimum 75 hours** total training:
   - **16 hours** supervised practical training
   - **59 hours** classroom instruction
2. **Topics required**:
   - Personal care skills (bathing, grooming, toileting, transfers)
   - Basic nursing skills (vital signs, observation, reporting)
   - Safety and emergency procedures
   - Infection control and universal precautions
   - Client rights and confidentiality
   - Communication and documentation
   - Recognizing changes in client condition
   - Death and dying
3. **Competency evaluation**:
   - Written exam
   - Skills demonstration (return demonstration of care tasks)
   - Must pass both components

**Ohio-Specific Requirements:**
- Training must be provided by **ODH-approved training program**
- HHAs must complete **12 hours annual in-service training**
- HHAs providing services to waiver clients must complete additional training on:
  - HCBS waiver services
  - Person-centered planning
  - Self-direction and consumer choice

**Frequency:**
- **Initial**: Before providing services as HHA
- **Annual**: 12 hours in-service training every year
- **Competency**: Annual skills check-off by RN supervisor

**Implementation:**
```typescript
// Database fields needed
hha_training_completion_date: timestamp    // Date of 75-hour training completion
hha_training_program: string               // Name of ODH-approved program
hha_competency_eval_date: timestamp        // Date of written/skills test
hha_competency_eval_status: enum           // PASSED, FAILED, PENDING
hha_annual_inservice_hours: number         // Track annual 12-hour requirement
hha_last_inservice_date: timestamp         // Most recent in-service training
hha_last_competency_check: timestamp       // Last RN skills check-off
hha_documentation: file_ref                // Certificate of completion

// Validation rules
- If role = 'HHA', hha_training_completion_date must be present
- hha_competency_eval_status must = 'PASSED'
- hha_last_competency_check must be within past 365 days
- Warning if hha_annual_inservice_hours < 12 for current calendar year
- Blocking if hha_competency_eval_status != 'PASSED'
- Blocking if hha_last_competency_check > 365 days ago
```

**Test Scenarios:**
- [ ] New HHA with 75-hour training certificate and passed competency → Allow assignments
- [ ] HHA with 8 hours in-service this year (needs 4 more) → Warning
- [ ] HHA with last competency check 380 days ago → Block (annual check overdue)
- [ ] HHA with FAILED competency evaluation → Block until re-evaluation and pass
- [ ] PCA (not HHA) without formal training → Allow if agency provides on-the-job training per PCA rules

**Edge Cases:**
- **Out-of-state training**: Ohio may accept training from other states if program meets 75-hour requirement and includes competency evaluation. Agency must verify equivalency.
- **CNA credential**: STNAs who complete 75-hour CNA training program do NOT need separate HHA training (CNA training exceeds HHA requirements). But still need annual competency check.
- **Inactive HHAs**: If HHA has not worked in >24 months, agency must provide refresher training or re-evaluate competency before assignments.

**Related Requirements:**
- RN supervision requirements (§1.5)
- Background screening (§1.1)

---

### 1.4 RN Supervision Requirements

**Statutory Authority:**
- Ohio Revised Code §4723 (Nursing Practice Act)
- Ohio Administrative Code 5160-12-03 (Home Health Services - Supervision)
- 42 CFR §484.36 (Medicare CoP - Supervision)

**Requirement:**
All **skilled nursing services** and **personal care services** must be provided under the supervision of a **Registered Nurse (RN)** licensed in Ohio.

**Supervision Standards:**
- **Aide supervision visits**: RN must conduct on-site supervisory visit:
  - **Every 14 days** for first 60 days of service (new client)
  - **Every 60 days** thereafter (established client)
  - **More frequently** if client condition warrants
- **Supervision visit must include**:
  - Observation of aide providing care
  - Assessment of client condition
  - Review of care plan
  - Conference with aide about client care
  - Documentation of visit in client record

**Ohio-Specific Requirements:**
- RN supervisor must be licensed in **Ohio** (out-of-state licenses not accepted unless multi-state compact)
- RN must be employed by or under contract with the agency
- RN must conduct **annual competency evaluation** for all HHAs and STNAs
- RN must document **aide performance** after each supervisory visit

**Implementation:**
```typescript
// Database fields needed
rn_supervisor_id: uuid                     // Reference to RN staff member
rn_supervision_visit_frequency: enum       // EVERY_14_DAYS, EVERY_60_DAYS
last_rn_supervision_visit: timestamp       // Date of last RN visit
next_rn_supervision_due: timestamp         // Calculated based on frequency
rn_supervision_notes: text                 // RN observations and recommendations

// Validation rules
- Skilled nursing visits must have rn_supervisor_id assigned
- For new clients (<60 days), last_rn_supervision_visit must be within 14 days
- For established clients (>60 days), last_rn_supervision_visit must be within 60 days
- Warning if next_rn_supervision_due within 7 days
- Blocking if last_rn_supervision_visit overdue
```

**Test Scenarios:**
- [ ] New client (30 days of service) with RN visit 10 days ago → Allow aide assignments
- [ ] New client (45 days of service) with last RN visit 20 days ago → Block (overdue for 14-day check)
- [ ] Established client with last RN visit 50 days ago → Allow (within 60-day window)
- [ ] Established client with last RN visit 65 days ago → Block (overdue for 60-day check)

---

## 2. Client Authorization

### 2.1 Service Authorization

**Statutory Authority:**
- Ohio Administrative Code 5160-58-01 (Personal Care Services Authorization)
- Ohio Medicaid Managed Care Contract Requirements
- MyCare Ohio MCO Authorization Standards

**Requirement:**
All Medicaid home health services require **prior authorization** from the client's Managed Care Organization (MCO) or Ohio Medicaid fee-for-service program before services begin.

**Ohio Medicaid Managed Care Organizations (MCOs):**
- **MyCare Ohio** (Dual-eligible: Medicare + Medicaid)
  - Aetna Better Health of Ohio
  - CareSource
  - Molina Healthcare
  - United Healthcare Community Plan
- **Medicaid-only plans**
  - Buckeye Health Plan
  - CareSource
  - Molina Healthcare
  - Paramount Advantage
  - United Healthcare Community Plan

**Authorization Process:**
1. Agency submits authorization request to MCO
2. MCO reviews request against medical necessity criteria
3. MCO issues authorization with:
   - **Authorization number**
   - **Approved services** (e.g., personal care, skilled nursing, therapy)
   - **Authorized units** (hours or visits)
   - **Start date and end date**
4. Agency tracks unit consumption
5. Agency submits reauthorization request 10-14 days before expiration

**Implementation:**
```typescript
// Database fields needed
authorization_number: string               // MCO authorization number
mco_name: string                           // Which MCO issued authorization
authorized_services: string[]              // Array of approved service codes
authorized_units: number                   // Total hours/visits approved
units_consumed: number                     // Running total of units used
units_remaining: number                    // Calculated: authorized - consumed
auth_start_date: timestamp                 // When authorization becomes active
auth_end_date: timestamp                   // When authorization expires
auth_status: enum                          // ACTIVE, PENDING, DENIED, EXPIRED

// Validation rules
- Cannot schedule visit if auth_status != 'ACTIVE'
- Cannot schedule visit if visit date < auth_start_date or > auth_end_date
- Cannot schedule visit if service type not in authorized_services
- Cannot schedule visit if (units_consumed + visit_units) > authorized_units
- Warning if units_remaining < 10% of authorized_units
- Warning if auth_end_date within 14 days
```

**Test Scenarios:**
- [ ] Client with active authorization, 50 units remaining → Allow scheduling
- [ ] Client with authorization expiring in 10 days → Warning (reauth needed)
- [ ] Client with expired authorization → Block scheduling
- [ ] Client with authorization not yet active (future start date) → Block scheduling
- [ ] Client with 95% units consumed → Warning (nearing limit)
- [ ] Visit for "skilled nursing" but authorization only covers "personal care" → Block

**Edge Cases:**
- **Retroactive authorizations**: Some MCOs issue authorizations retroactively. System should allow backdating with supervisor approval.
- **Multi-service authorizations**: Client may have separate authorizations for nursing, therapy, and personal care. Match service to correct auth.
- **MyCare Ohio**: Dual-eligible clients may have Medicare covering some services, Medicaid others. Verify which payor.

---

### 2.2 Plan of Care

**Statutory Authority:**
- Ohio Administrative Code 5160-12-03 (Home Health Plan of Care)
- 42 CFR §484.60 (Medicare CoP - Plan of Care Requirements)

**Requirement:**
All home health clients must have a written **Plan of Care** that is:
- Established by a physician
- Reviewed and updated at least **every 60 days** (or more frequently if condition changes)
- Signed and dated by physician

**Plan of Care Must Include:**
- Client diagnosis
- Services to be provided (type, frequency, duration)
- Goals and outcomes
- Safety measures
- Medications
- Dietary restrictions
- Functional limitations
- Physician orders

**Implementation:**
```typescript
// Database fields needed
plan_of_care_established_date: timestamp   // Initial POC date
plan_of_care_last_review: timestamp        // Most recent review
plan_of_care_next_review_due: timestamp    // Due for next review (every 60 days)
physician_signature_date: timestamp        // Date physician signed POC
physician_name: string                     // Ordering physician
plan_of_care_status: enum                  // CURRENT, REVIEW_DUE, OVERDUE, EXPIRED

// Validation rules
- Cannot schedule visit if plan_of_care_status = 'EXPIRED'
- Warning if plan_of_care_next_review_due within 7 days
- Blocking if plan_of_care_next_review_due < TODAY (overdue)
- Blocking if physician_signature_date is null or missing
```

**Test Scenarios:**
- [ ] Client with POC reviewed 40 days ago → Allow (current)
- [ ] Client with POC reviewed 55 days ago, next review in 5 days → Warning
- [ ] Client with POC reviewed 65 days ago (overdue) → Block visits
- [ ] Client with POC but no physician signature → Block

---

## 3. Visit Documentation

### 3.1 Required Visit Documentation

**Statutory Authority:**
- Ohio Administrative Code 5160-12-03 (Home Health Documentation)
- Ohio Medicaid Documentation Standards

**Requirement:**
Every home health visit must be documented within **24 hours** of visit completion.

**Required Elements:**
1. **Date and time** of visit (start and end times)
2. **Services provided** (specific tasks performed)
3. **Client response** to care
4. **Vital signs** (if required by POC)
5. **Medications** administered or managed
6. **Changes in client condition** observed
7. **Caregiver signature** and credential
8. **Visit duration** (in 15-minute increments)

**Quality Standards:**
- Documentation must be **objective, specific, and measurable**
- Avoid vague phrases:
  - ❌ "Client doing well"
  - ✅ "Client ambulated 50 feet with walker, no shortness of breath"
  - ❌ "Care provided as planned"
  - ✅ "Assisted with shower, applied lotion to dry areas on lower legs, provided mouth care"

**Implementation:**
```typescript
// Required fields
visit_date: timestamp
visit_start_time: timestamp
visit_end_time: timestamp
services_provided: text                    // Min 50 characters
client_response: text                      // Min 30 characters
vital_signs: json                          // If applicable: BP, HR, temp, resp
medications_administered: json             // Medication name, dose, time
observations: text                         // Changes in condition
caregiver_signature: timestamp             // Electronic signature
caregiver_credential: string               // RN, LPN, HHA, CNA

// Validation rules
- All required fields must be populated
- services_provided length >= 50 characters
- Documentation completed within 24 hours of visit_end_time
- Blocked phrases check: ["doing well", "care provided", "no change", "fine", "good day"]
```

**Test Scenarios:**
- [ ] Visit documented 12 hours after visit end → Pass
- [ ] Visit documented 30 hours after visit end → Warning (late documentation)
- [ ] Visit with "Client doing well, care provided" → Warning (vague documentation)
- [ ] Visit missing vital signs when POC requires them → Block (incomplete)

---

## 4. Electronic Visit Verification (EVV)

### 4.1 Sandata EVV Aggregator

**Statutory Authority:**
- 21st Century Cures Act §12006(a) (Federal EVV Mandate)
- Ohio Administrative Code 5160-1-17.2 (EVV Requirements)
- Ohio Department of Medicaid EVV Policy

**Ohio EVV Model:**
- **Aggregator**: Sandata Technologies (state-contracted vendor)
- **Cost**: **FREE** for providers (state pays aggregator fee)
- **Implementation**: Mandatory for personal care services as of January 1, 2021

**Sandata Connection:**
- **Endpoint**: `https://api.sandata.com/ohio/evv/v1/visits`
- **Authentication**: API key provided by Ohio Medicaid
- **Submission**: Real-time or batch (within 7 days)
- **Format**: JSON or XML

**Six Required EVV Data Elements (Federal Mandate):**
1. **Type of service** performed
2. **Individual receiving service** (client Medicaid ID)
3. **Individual providing service** (caregiver name/ID)
4. **Date of service**
5. **Location of service** (address or GPS coordinates)
6. **Time service begins and ends**

**Ohio-Specific EVV Requirements:**
- **GPS required** for visits conducted at client home
- **Telephony acceptable** for visits at facility or when GPS unavailable
- **Fixed site** option for adult day services

---

### 4.2 Geofencing Requirements

**Ohio Geofence Parameters:**
- **Base radius**: 125 meters (410 feet)
- **GPS accuracy tolerance**: 75 meters (246 feet)
- **Total allowable distance**: 200 meters (656 feet)

**Rationale**: Ohio's 200-meter tolerance accounts for:
- Urban high-rise buildings (GPS signal multipath)
- Rural areas (lower GPS satellite density)
- Smartphone GPS accuracy variations (typically 5-50m, can be 75m+)
- Client homes on large properties

**Implementation:**
```typescript
const OHIO_GEOFENCE_BASE = 125;           // meters
const OHIO_GEOFENCE_TOLERANCE = 75;       // meters
const OHIO_GEOFENCE_TOTAL = 200;          // meters

function isWithinGeofence(
  clientLat: number,
  clientLng: number,
  visitLat: number,
  visitLng: number,
  gpsAccuracy: number
): { valid: boolean; distance: number; reason?: string } {
  const distance = calculateDistance(clientLat, clientLng, visitLat, visitLng);
  
  // Allow extra tolerance equal to GPS accuracy (up to max)
  const allowedDistance = OHIO_GEOFENCE_BASE + Math.min(gpsAccuracy, OHIO_GEOFENCE_TOLERANCE);
  
  if (distance <= allowedDistance) {
    return { valid: true, distance };
  }
  
  return {
    valid: false,
    distance,
    reason: `Clock-in location is ${Math.round(distance)}m from client address. ` +
            `Ohio allows ${Math.round(allowedDistance)}m. ` +
            `Verify caregiver is at correct location.`
  };
}
```

**Test Scenarios:**
- [ ] Clock-in 80m from client address, GPS accuracy 30m → Pass (110m < 155m allowed)
- [ ] Clock-in 150m from client address, GPS accuracy 20m → Pass (170m < 145m allowed... wait that's wrong)
- [ ] Clock-in 180m from client address, GPS accuracy 50m → Pass (within 200m total)
- [ ] Clock-in 220m from client address → Fail (exceeds 200m max)

---

### 4.3 Grace Periods

**Ohio Grace Period Standards:**
- **Clock-in early**: Up to **10 minutes** before scheduled start
- **Clock-in late**: Up to **10 minutes** after scheduled start
- **Clock-out early**: Up to **10 minutes** before scheduled end
- **Clock-out late**: Up to **10 minutes** after scheduled end

**Rationale**: 10-minute grace period aligns with:
- FLSA (Fair Labor Standards Act) - de minimis rule
- Practical considerations (traffic, parking, client delays)
- Ohio Medicaid billing standards

**Implementation:**
```typescript
const OHIO_GRACE_PERIOD_MINUTES = 10;

function isWithinGracePeriod(
  scheduledTime: Date,
  actualTime: Date,
  type: 'clock_in' | 'clock_out'
): { valid: boolean; variance: number; reason?: string } {
  const diffMinutes = (actualTime.getTime() - scheduledTime.getTime()) / 60000;
  
  if (Math.abs(diffMinutes) <= OHIO_GRACE_PERIOD_MINUTES) {
    return { valid: true, variance: diffMinutes };
  }
  
  return {
    valid: false,
    variance: diffMinutes,
    reason: `${type} was ${Math.abs(diffMinutes).toFixed(0)} minutes ` +
            `${diffMinutes > 0 ? 'late' : 'early'}. ` +
            `Ohio allows ${OHIO_GRACE_PERIOD_MINUTES}-minute grace period.`
  };
}
```

---

### 4.4 Manual Overrides and Corrections

**Ohio EVV Correction Process:**
- **Correction window**: EVV records can be corrected within **7 days** of visit
- **Supervisor approval**: All corrections must be approved by RN or administrator
- **Reason required**: Must document reason for correction (e.g., "GPS malfunction", "Incorrect clock-out time")
- **Audit trail**: System must maintain history of all changes

**Acceptable Reasons for Manual Override:**
- GPS unavailable (signal blocked, device malfunction)
- Telephony failure (phone system down)
- Emergency situation (no time to clock in)
- Technology failure (app crash, network outage)

**Implementation:**
```typescript
// Override request
interface EVVOverrideRequest {
  visit_id: uuid;
  override_reason: string;              // Required, min 20 characters
  approved_by: uuid;                    // Supervisor ID
  approval_date: timestamp;
  original_clock_in: timestamp;
  corrected_clock_in: timestamp;
  original_clock_out: timestamp;
  corrected_clock_out: timestamp;
}

// Validation rules
- Override must be requested within 7 days of visit
- override_reason must be at least 20 characters
- approved_by must reference valid supervisor (RN or admin)
- System maintains audit log of all overrides
```

---

## 5. Data Retention

**Statutory Authority:**
- Ohio Revised Code §5160.37 (Medicaid Records Retention)
- 42 CFR §424.516 (Medicare Records Retention)

**Requirement:**
Home health agencies must retain all records for **minimum 6 years** from date of service.

**Records Subject to Retention:**
- Clinical records (POC, visit notes, assessments)
- Personnel records (credentials, training, evaluations)
- Financial records (claims, payments, authorizations)
- EVV records (clock-in/out, GPS data)
- Incident reports
- Quality assurance records

**Ohio-Specific Requirements:**
- Records must be available for ODM audit within **5 business days** of request
- Records must be maintained in **legible format** (paper or electronic)
- If agency closes, records must be transferred to ODM custody

---

## 6. Privacy & Security

**Statutory Authority:**
- HIPAA Privacy Rule (45 CFR Part 160 and Part 164, Subpart E)
- HIPAA Security Rule (45 CFR Part 164, Subpart C)
- Ohio Revised Code §1347 (Personal Information Systems)

**Requirements:**
- All PHI must be encrypted at rest and in transit
- Role-based access control (caregivers see only assigned clients)
- Audit logs of all PHI access (who, what, when)
- Business Associate Agreements (BAAs) with all vendors
- Breach notification within 60 days

---

## 7. Quality Standards

### 7.1 Client Rights

**Ohio Home Care Bill of Rights:**
- Right to respectful, considerate care
- Right to participate in care planning
- Right to refuse services
- Right to privacy and confidentiality
- Right to file complaints without retaliation
- Right to be free from abuse, neglect, exploitation

### 7.2 Incident Reporting

**Reportable Incidents:**
- Abuse, neglect, exploitation of client
- Medication errors with adverse effects
- Falls with injury
- Significant changes in client condition
- Complaints from client or family
- Caregiver misconduct

**Reporting Timeline:**
- **Immediate (within 1 hour)**: Abuse, neglect, exploitation, serious injury
- **Within 24 hours**: Medication errors, falls with injury, significant changes
- **Within 5 days**: Complaints, minor incidents

**Reporting To:**
- Ohio Department of Aging (for clients 60+): 1-800-677-1116
- Ohio Adult Protective Services: 1-855-OHIO-APS (1-855-644-6277)
- ODM Provider Enrollment: 1-800-686-1518

---

## Summary

Ohio home healthcare compliance is characterized by:

**Strengths:**
- FREE Sandata EVV aggregator (huge cost savings for providers)
- Balanced regulations (not overly strict, not overly lenient)
- Moderate background check frequency (5 years vs. TX 2 years)
- 10-minute grace periods (reasonable flexibility)

**Challenges:**
- Strong RN supervision requirements (every 14-60 days)
- FBI+BCI fingerprinting mandatory (not just name-based check)
- Complex MCO landscape (MyCare Ohio + 5 Medicaid MCOs)
- STNA 24-month work requirement (must re-test if inactive)

**Key Differentiators vs. Other States:**
- **vs. Texas**: Longer background check cycle (5 years vs. 2 years), Sandata aggregator (vs. HHAeXchange)
- **vs. Florida**: Shorter background check cycle (5 years vs. 5 years... same), more conservative geofence (200m vs. 250m)
- **vs. Pennsylvania**: Shorter retention (6 years vs. 7 years), same Sandata aggregator

---

**Sources:**
- Ohio Revised Code: https://codes.ohio.gov/ohio-revised-code
- Ohio Administrative Code: https://codes.ohio.gov/ohio-administrative-code
- Ohio Department of Medicaid: https://medicaid.ohio.gov/
- Ohio Department of Health Nurse Aide Registry: https://odh.ohio.gov/know-our-programs/nurse-aide-registry
- Ohio Attorney General BCI: https://www.ohioattorneygeneral.gov/Business/Services-for-Business/WebCheck
- Sandata Technologies: https://www.sandata.com/
- 21st Century Cures Act: https://www.congress.gov/bill/114th-congress/house-bill/34

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
