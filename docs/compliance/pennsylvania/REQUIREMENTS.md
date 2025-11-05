# Pennsylvania Home Healthcare Compliance Requirements

**State Code**: PA  
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

Pennsylvania's home healthcare regulations are administered by the **Pennsylvania Department of Human Services (DHS)** and **Pennsylvania Department of Health (DOH)**. Pennsylvania is the **largest home health market** with 8,000+ agencies and uses Sandata as its FREE EVV aggregator.

**Key Characteristics:**
- **Largest market**: 8,000+ agencies (more than TX, FL, OH)
- FREE Sandata EVV aggregator (shared with OH, NC, AZ)
- **Longest data retention**: **7 years** (vs. 6 years in most states)
- Conservative geofencing (100m base + 50m tolerance = 150m total)
- 15-minute grace periods (more lenient than OH's 10 minutes)
- PROMISe MMIS integration for claims/authorization
- Community HealthChoices (CHC) managed care program

---

## 1. Caregiver Credentials

### 1.1 Criminal History Background Check

**Statutory Authority:**
- 23 Pa.C.S. §6344 (Background Check Requirements)
- 55 Pa. Code §51.3 (Home Health Agency Licensing)
- 55 Pa. Code Chapter 275 (Background Checks for Direct Care Workers)

**Requirement:**
All direct care workers must complete **Pennsylvania State Police (PSP) criminal history check** and **FBI fingerprint check** before client contact.

**Frequency:**
- **Initial**: Before first client contact
- **Renewal**: Every **5 years** (same as Ohio)
- **Re-verification triggers**:
  - Conviction of any crime after employment
  - Substantiated finding of abuse/neglect
  - Break in direct care service exceeding 365 days (different from OH's 90 days)

**Pennsylvania-Specific Requirements:**
- **Two separate checks required**:
  1. **PA State Police Criminal History Check**: State-level background
  2. **FBI Fingerprint Check**: Federal-level background
- **Cost**: ~$10 PA check + ~$28 FBI fingerprinting (employee typically pays)
- **Processing time**: 3-5 business days (PA), 2-4 weeks (FBI)

**Disqualifying Offenses (Pa.C.S. §6344):**
- **Permanent disqualification**:
  - Homicide, aggravated assault
  - Rape, sexual assault, indecent assault
  - Kidnapping, unlawful restraint
  - Endangering welfare of children
  - Child pornography
  - Drug trafficking (manufacturing/distribution)
  - Robbery, burglary of a residence
  - Arson
- **Conditional disqualification** (case-by-case review):
  - Simple assault (if >5 years ago)
  - Theft, fraud, forgery (if >7 years ago)
  - DUI (3+ convictions = disqualifying)
  - Drug possession (if >10 years ago and successfully completed rehabilitation)

**How to Verify:**
1. **PA State Police Check**:
   - Online: https://epatch.state.pa.us/
   - Request: Pennsylvania Access To Criminal History (PATCH)
   - Cost: $10 (credit card or money order)
   - Results: Immediate if no record, 3-5 days if record found
2. **FBI Fingerprint Check**:
   - Schedule appointment at IdentoGO or similar approved vendor
   - Provide fingerprints digitally (live scan) or via ink card
   - FBI processes and returns results to agency
   - Results: 2-4 weeks typically

**Implementation:**
```typescript
// Database fields needed
pa_patch_check_date: timestamp             // Date of PA PATCH check
pa_patch_status: enum                      // CLEAR, PENDING, ISSUES, EXPIRED
pa_patch_certification_number: string      // PATCH cert number for audits
pa_fbi_check_date: timestamp               // Date of FBI check
pa_fbi_status: enum                        // CLEAR, PENDING, ISSUES, EXPIRED
fbi_fingerprint_transaction_number: string // FBI tracking number
background_check_expiration: timestamp     // Both checks expire after 5 years

// Validation rules
- BOTH pa_patch_status AND pa_fbi_status must = 'CLEAR'
- Cannot assign if either check is PENDING, ISSUES, or EXPIRED
- Warning if expiration within 90 days
- Blocking if either check expired
```

**Test Scenarios:**
- [ ] Caregiver with valid PA PATCH + FBI check (both <5 years) → Allow assignments
- [ ] Caregiver with valid PA PATCH but missing FBI check → Block assignments
- [ ] Caregiver with FBI check but missing PA PATCH → Block assignments
- [ ] Caregiver with PA PATCH from 5.5 years ago → Block (expired)
- [ ] Caregiver with disqualifying offense (homicide) → Permanent block
- [ ] Caregiver with 8-year-old theft conviction → Allow (>7 years, conditional review passed)

**Edge Cases:**
- **Live scan vs. ink card**: Agencies should use live scan (IdentoGO) for faster FBI processing (2-4 weeks vs. 4-8 weeks)
- **Name changes**: Must submit both maiden and married names for PATCH search
- **Out-of-state transfers**: PA does NOT accept other states' checks (except FBI fingerprint check if <5 years old and original submitted to PA)
- **Break in service >365 days**: Unlike Ohio (90 days), PA allows longer break (365 days) before requiring re-check

---

### 1.2 Child Abuse History Clearance

**Statutory Authority:**
- 23 Pa.C.S. §6344.2 (Child Abuse History Clearance)
- 55 Pa. Code Chapter 3490 (ChildLine and Abuse Registry)

**Requirement:**
All direct care workers must obtain **Pennsylvania Child Abuse History Clearance** from Department of Human Services (DHS).

**Frequency:**
- **Initial**: Before first client contact (if serving children or families with children)
- **Renewal**: Every **5 years**
- **Required for**: Caregivers serving clients under age 18, or households with children present

**How to Verify:**
1. Access PA Child Abuse History Clearance online: https://www.compass.state.pa.us/cwis/
2. Complete form CY-113 online or by mail
3. Cost: FREE for volunteers, $13 for paid employees
4. Processing: 14 business days typically
5. Results mailed to applicant and agency

**Pennsylvania-Specific Notes:**
- **Not required** if caregiver only serves adult-only households
- **Highly recommended** even for adult-only caregivers (best practice)
- **Findings**: If indicated on registry, applicant is disqualified (no exceptions)
- **Expiration**: 5-year cycle (aligned with criminal background checks)

**Implementation:**
```typescript
// Database fields needed
pa_child_abuse_clearance_date: timestamp
pa_child_abuse_status: enum                // CLEAR, PENDING, INDICATED, EXPIRED
pa_child_abuse_cert_number: string         // Certificate number
pa_child_abuse_expiration: timestamp       // clearanceDate + 5 years

// Validation rules
- If client has household members <18 years old, pa_child_abuse_status must = 'CLEAR'
- If pa_child_abuse_status = 'INDICATED', permanent disqualification
- Warning if expiration within 90 days
```

---

### 1.3 Nurse Aide Registry Check

**Statutory Authority:**
- 35 P.S. §448.809b (Nurse Aide Registry)
- 28 Pa. Code §51.21 (Nurse Aide Requirements)

**Requirement:**
All **Certified Nursing Assistants (CNAs)** must be registered on the Pennsylvania Nurse Aide Registry with status = ACTIVE.

**Frequency:**
- **Initial**: Before first assignment as CNA
- **Renewal**: Every **2 years** (registration renewal)
- **Continuing Education**: **24 hours every 2 years** (12 hours annually)

**How to Verify:**
1. Access PA Nurse Aide Registry: https://www.health.pa.gov/topics/programs/NARS/Pages/NARS.aspx
2. Search by name and DOB
3. Verify:
   - Registry status = ACTIVE
   - No findings of abuse/neglect/misappropriation
   - Certification expiration date
4. Document registry ID and verification date

**Pennsylvania-Specific Requirements:**
- **24 hours CE every 2 years** (vs. Ohio's 12 hours)
- Must work as paid CNA at least **8 hours within past 24 months** to maintain active status
- If >24 months without paid work, must complete competency re-evaluation

**Implementation:**
```typescript
// Database fields needed
pa_cna_registry_number: string             // PA Registry ID
pa_cna_status: enum                        // ACTIVE, INACTIVE, EXPIRED, SUSPENDED, REVOKED
pa_cna_verification_date: timestamp
pa_cna_certification_exp: timestamp        // 2-year renewal cycle
pa_cna_ce_hours_current_cycle: number      // Track 24 hours CE (12/year)
pa_cna_last_paid_work: timestamp           // Track 24-month work requirement

// Validation rules
- If role = 'CNA', pa_cna_registry_number must be present
- pa_cna_status must = 'ACTIVE'
- pa_cna_certification_exp must be > TODAY
- Warning if pa_cna_ce_hours_current_cycle < 24 in current 2-year cycle
- Blocking if pa_cna_status != 'ACTIVE' or certification expired
```

---

### 1.4 Home Health Aide (HHA) Training

**Statutory Authority:**
- 55 Pa. Code §51.22 (Home Health Aide Training)
- 42 CFR §484.80 (Medicare CoP - Aide Training)

**Requirement:**
All Home Health Aides must complete **Pennsylvania DOH-approved 75-hour training program**.

**Training Components:**
- **Minimum 75 hours** total training (same as Ohio, federal standard)
  - 16 hours supervised practical training
  - 59 hours classroom instruction
- **Topics**: Personal care, basic nursing skills, safety, infection control, client rights, communication, documentation
- **Competency Evaluation**: Written exam + skills demonstration
- **Annual requirement**: 12 hours in-service training

**Pennsylvania-Specific Requirements:**
- Training must be through **PA DOH-approved program** (list available at PA DOH website)
- HHAs working for Medicare-certified agencies must complete **annual competency evaluation** by RN
- HHAs serving Community HealthChoices (CHC) waiver clients must complete additional training on:
  - Person-centered thinking
  - Self-direction
  - Supporting people with disabilities
  - Cultural competency

**Implementation:**
```typescript
// Database fields needed
pa_hha_training_completion_date: timestamp
pa_hha_training_program: string            // Name of PA DOH-approved program
pa_hha_competency_eval_date: timestamp
pa_hha_competency_eval_status: enum        // PASSED, FAILED, PENDING
pa_hha_annual_inservice_hours: number      // Track 12 hours/year
pa_hha_last_competency_check: timestamp    // Annual RN competency

// Validation rules
- If role = 'HHA', pa_hha_training_completion_date must be present
- pa_hha_competency_eval_status must = 'PASSED'
- pa_hha_last_competency_check must be within past 365 days
```

---

### 1.5 RN Supervision Requirements

**Statutory Authority:**
- 55 Pa. Code §51.23 (Supervision of Home Health Aides)
- 42 CFR §484.36 (Medicare CoP - Supervision Requirements)

**Requirement:**
All personal care and skilled nursing services must be supervised by a **Registered Nurse (RN)** licensed in Pennsylvania.

**Supervision Standards:**
- **Aide supervision visits**:
  - **Every 14 days** for first 60 days (new client)
  - **Every 60 days** thereafter (established client)
  - More frequently if client condition warrants
- **Supervision visit must include**:
  - On-site observation of aide providing care
  - Client assessment
  - Care plan review
  - Conference with aide
  - Documentation in client record

**Pennsylvania-Specific Requirements:**
- RN must be licensed in **Pennsylvania** (multi-state compact accepted: PA is NLC state)
- RN must conduct **annual skills competency evaluation** for all HHAs
- For Community HealthChoices (CHC) clients, RN must document **quarterly (90-day) reviews**

**Implementation:**
```typescript
// Database fields needed
pa_rn_supervisor_id: uuid                  // Reference to RN
pa_last_rn_supervision_visit: timestamp
pa_next_rn_supervision_due: timestamp      // Calculated: 14 or 60 days
pa_rn_supervision_frequency: enum          // EVERY_14_DAYS, EVERY_60_DAYS, EVERY_90_DAYS

// Validation rules
- New clients (<60 days): last supervision must be within 14 days
- Established clients (>60 days): last supervision must be within 60 days
- CHC waiver clients: also require quarterly review within 90 days
- Blocking if supervision overdue
```

---

## 2. Client Authorization

### 2.1 Community HealthChoices (CHC) Authorization

**Statutory Authority:**
- 55 Pa. Code Chapter 6000 (Community HealthChoices)
- Community HealthChoices (CHC) Managed Care Contract

**Overview:**
Pennsylvania's **Community HealthChoices (CHC)** is the state's Medicaid managed long-term services and supports (MLTSS) program. CHC covers adults ages 21+ with physical disabilities or older adults needing long-term care.

**CHC Managed Care Organizations (MCOs):**
- **AmeriHealth Caritas Northeast**
- **Pennsylvania Health & Wellness** (Centene)
- **UPMC Community HealthChoices**

**Authorization Process:**
1. Client enrolled in CHC MCO
2. Agency submits service authorization request to MCO
3. MCO conducts assessment and determines medical necessity
4. MCO issues authorization with:
   - Authorization number
   - Approved services (personal care, skilled nursing, etc.)
   - Authorized hours (weekly or monthly)
   - Start and end dates
5. Agency tracks hour consumption via PROMISe MMIS system
6. Reauthorization required at least annually or when needs change

**Pennsylvania-Specific Requirements:**
- **PROMISe MMIS Integration**: Pennsylvania's Medicaid Management Information System
- **Prior authorization** required for all CHC services
- **Service plans** must align with person-centered thinking principles
- **Quarterly reviews** required for CHC participants

**Implementation:**
```typescript
// Database fields needed
pa_chc_mco_name: string                    // Which CHC MCO
chc_authorization_number: string
chc_authorized_hours_weekly: number        // Hours per week approved
chc_hours_consumed_current_week: number
chc_auth_start_date: timestamp
chc_auth_end_date: timestamp
chc_last_quarterly_review: timestamp       // CHC requires quarterly reviews

// Validation rules
- Cannot schedule visit if auth_status != 'ACTIVE'
- Cannot schedule if visit date outside auth_start_date to auth_end_date
- Warning if hours consumed approaching weekly limit
- Warning if quarterly review due within 14 days
- Blocking if quarterly review overdue (>90 days)
```

---

### 2.2 Plan of Care Requirements

**Statutory Authority:**
- 55 Pa. Code §51.23 (Plan of Care)
- 42 CFR §484.60 (Medicare CoP - Care Planning)

**Requirement:**
All home health clients must have a physician-ordered **Plan of Care** reviewed at least **every 60 days**.

**Pennsylvania-Specific Requirements:**
- Physician signature required on initial POC and any changes
- RN must review POC every 60 days minimum
- For CHC clients, POC must align with **Independent Service Plan (ISP)** developed by service coordinator
- POC must include:
  - Client goals (person-centered)
  - Services to be provided
  - Frequency and duration
  - Safety measures
  - Medications and treatments
  - Functional status

**Implementation:**
```typescript
// Database fields needed
plan_of_care_established_date: timestamp
plan_of_care_last_review: timestamp
plan_of_care_next_review_due: timestamp    // Every 60 days
physician_signature_date: timestamp
physician_name: string
pa_isp_alignment_verified: boolean         // CHC requirement

// Validation rules
- Cannot provide services without current POC
- Blocking if plan_of_care_next_review_due < TODAY
- Warning if plan_of_care_next_review_due within 7 days
```

---

## 3. Visit Documentation

### 3.1 Required Documentation Elements

**Statutory Authority:**
- 55 Pa. Code §51.24 (Clinical Records)
- Pennsylvania Medicaid Provider Handbook

**Requirement:**
Every visit must be documented within **24 hours** of visit completion.

**Required Elements (identical to Ohio, federal standards):**
1. Date and time of visit
2. Services provided (specific tasks)
3. Client response to care
4. Vital signs (if required by POC)
5. Medications administered/managed
6. Changes in client condition
7. Caregiver signature
8. Visit duration (15-minute increments)

**Pennsylvania-Specific Requirements:**
- Documentation must be available for **PA DHS audit within 48 hours** of request
- Electronic signatures acceptable if system maintains audit trail
- For CHC clients, documentation must align with ISP goals
- Quality standards: Must be objective, specific, measurable

**Implementation:**
Same database structure as Ohio (federal standards), with additional CHC alignment check.

---

## 4. Electronic Visit Verification (EVV)

### 4.1 Sandata EVV Aggregator

**Statutory Authority:**
- 21st Century Cures Act §12006(a)
- 55 Pa. Code §1187.105 (Pennsylvania EVV Requirements)

**Pennsylvania EVV Model:**
- **Aggregator**: Sandata Technologies (state-contracted, FREE for providers)
- **Cost**: FREE for providers (PA DHS pays aggregator fee)
- **Implementation**: Mandatory for personal care services

**Sandata Connection:**
- **Endpoint**: `https://api.sandata.com/pennsylvania/evv/v1/visits`
- **Authentication**: API key provided by PA DHS
- **Submission**: Real-time or batch (within 7 days)
- **PROMISe MMIS Integration**: Sandata submits to PROMISe for claims processing

**Six Required Data Elements (Same as Ohio, Federal Standard):**
1. Type of service
2. Individual receiving service (client Medicaid ID)
3. Individual providing service (caregiver ID)
4. Date of service
5. Location of service (GPS or address)
6. Time service begins and ends

---

### 4.2 Geofencing Requirements

**Pennsylvania Geofence Parameters:**
- **Base radius**: 100 meters (328 feet)
- **GPS accuracy tolerance**: 50 meters (164 feet)
- **Total allowable distance**: 150 meters (492 feet)

**Rationale**: Pennsylvania's 150-meter tolerance is:
- **More conservative than Florida** (250m) and Georgia (250m)
- **Same as Texas** (150m)
- **Less lenient than Ohio** (200m)

Pennsylvania chose conservative geofencing due to:
- High urban density (Philadelphia, Pittsburgh metro areas)
- Smaller properties (row homes, apartments)
- Less GPS accuracy issues than rural states

**Implementation:**
```typescript
const PA_GEOFENCE_BASE = 100;              // meters
const PA_GEOFENCE_TOLERANCE = 50;          // meters
const PA_GEOFENCE_TOTAL = 150;             // meters

function isWithinGeofence(
  clientLat: number, clientLng: number,
  visitLat: number, visitLng: number,
  gpsAccuracy: number
): { valid: boolean; distance: number; reason?: string } {
  const distance = calculateDistance(clientLat, clientLng, visitLat, visitLng);
  const allowedDistance = PA_GEOFENCE_BASE + Math.min(gpsAccuracy, PA_GEOFENCE_TOLERANCE);
  
  if (distance <= allowedDistance) {
    return { valid: true, distance };
  }
  
  return {
    valid: false,
    distance,
    reason: `Clock-in location is ${Math.round(distance)}m from client address. ` +
            `Pennsylvania allows ${Math.round(allowedDistance)}m.`
  };
}
```

---

### 4.3 Grace Periods

**Pennsylvania Grace Period Standards:**
- **Clock-in early**: Up to **15 minutes** before scheduled start
- **Clock-in late**: Up to **15 minutes** after scheduled start
- **Clock-out early**: Up to **15 minutes** before scheduled end
- **Clock-out late**: Up to **15 minutes** after scheduled end

**Rationale**: 15-minute grace period (vs. Ohio's 10 minutes) reflects:
- Pennsylvania's urban congestion (Philadelphia, Pittsburgh traffic)
- FLSA de minimis rule (15 minutes is commonly accepted)
- Alignment with Pennsylvania Department of Labor & Industry guidance

**Implementation:**
```typescript
const PA_GRACE_PERIOD_MINUTES = 15;
```

---

### 4.4 Manual Overrides and Corrections

**Pennsylvania EVV Correction Process:**
- **Correction window**: **7 days** from visit date (same as Ohio)
- **Supervisor approval**: RN or administrator must approve
- **Reason required**: Minimum 20 characters, specific explanation
- **Audit trail**: System must log all overrides with timestamp, reason, approver

**Acceptable Reasons:**
- GPS unavailable (signal blocked, device failure)
- Technology failure (app crash, network outage)
- Emergency situation
- Administrative error (wrong client address, wrong schedule)

---

## 5. Data Retention

**Statutory Authority:**
- 55 Pa. Code §51.25 (Record Retention)
- 62 P.S. §443.5 (Medical Assistance Records)

**Requirement:**
Home health agencies must retain all records for **minimum 7 years** from date of service.

**Pennsylvania Has LONGEST Retention Requirement in the Nation:**
- **Pennsylvania**: 7 years
- **Most states**: 6 years
- **Federal (HIPAA)**: 6 years

**Records Subject to Retention:**
- Clinical records (POC, visit notes, assessments)
- Personnel records (credentials, training, performance)
- Financial records (claims, payments, authorizations)
- EVV records (clock-in/out, GPS data)
- Incident reports
- Quality assurance records

**Pennsylvania-Specific Requirements:**
- Records must be available for **PA DHS audit within 48 hours** of request
- If agency closes, records must be transferred to PA DHS or designated custodian
- Electronic records acceptable if system maintains integrity and security

**Implementation:**
```typescript
const PA_RETENTION_YEARS = 7;              // Longest in nation

// Database policy
retention_date = service_date + (7 years)
archive_eligible = retention_date + 30 days  // Grace period for archival
```

---

## 6. Privacy & Security

**Statutory Authority:**
- HIPAA Privacy Rule (45 CFR Part 160 and Part 164, Subpart E)
- HIPAA Security Rule (45 CFR Part 164, Subpart C)
- 43 P.S. §1301 (Pennsylvania Confidentiality of HIV-Related Information Act)

**Requirements (Same as Federal + Pennsylvania Additions):**
- PHI encrypted at rest and in transit
- Role-based access control
- Audit logs of all PHI access
- Business Associate Agreements (BAAs) with vendors
- Breach notification within 60 days
- **Pennsylvania addition**: Special protections for HIV/AIDS-related information

---

## 7. Quality Standards

### 7.1 Home Care Bill of Rights

**Pennsylvania-Specific Rights:**
- Right to self-determination
- Right to participate in service planning
- Right to choose providers (CHC requirement)
- Right to file grievances
- Right to be free from abuse, neglect, exploitation
- Right to privacy and confidentiality

### 7.2 Incident Reporting

**Reportable Incidents:**
- Abuse, neglect, exploitation (report immediately)
- Serious injury (within 24 hours)
- Medication errors with adverse effects (within 24 hours)
- Complaints (within 5 days)
- Service disruptions (within 24 hours)

**Reporting To:**
- **PA DHS Abuse Hotline**: 1-800-932-0582 (24/7)
- **PA Adult Protective Services**: https://www.dhs.pa.gov/Services/Assistance/Pages/Adult-Protective-Services.aspx
- **CHC MCO**: Per contract requirements (usually within 24 hours)

---

## Summary

Pennsylvania home healthcare compliance is characterized by:

**Strengths:**
- FREE Sandata EVV aggregator (same as Ohio)
- Large market (8,000+ agencies = more community support)
- Multi-state compact (RN licensure portable)
- 15-minute grace periods (more flexible than Ohio's 10 minutes)

**Challenges:**
- **Longest data retention**: 7 years (vs. 6 in most states)
- **Three background checks** required (PA PATCH + FBI + Child Abuse vs. Ohio's 2)
- Higher CNA CE requirement (24 hours/2 years vs. Ohio's 12 hours/2 years)
- Complex CHC managed care system (3 MCOs with varying processes)
- PROMISe MMIS integration complexity

**Key Differentiators:**
- **vs. Ohio**: 7-year retention (vs. 6), 15-min grace (vs. 10), child abuse clearance required, stricter geofence (150m vs. 200m)
- **vs. Texas**: Sandata aggregator (vs. HHAeXchange), 15-min grace (vs. 10), same geofence (150m)
- **vs. Florida**: Much stricter geofence (150m vs. 250m), 7-year retention (vs. 6), same aggregator flexibility

---

**Sources:**
- Pennsylvania Code: https://www.pacodeandbulletin.gov/
- PA Department of Human Services: https://www.dhs.pa.gov/
- PA Department of Health: https://www.health.pa.gov/
- Community HealthChoices: https://www.dhs.pa.gov/Services/Assistance/Pages/CHC-Services.aspx
- PROMISe MMIS: https://www.dhs.pa.gov/providers/Promise/Pages/default.aspx
- Sandata Technologies: https://www.sandata.com/
- 21st Century Cures Act: https://www.congress.gov/bill/114th-congress/house-bill/34

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
