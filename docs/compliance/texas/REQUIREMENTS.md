# Texas Home Healthcare Compliance Requirements

**State Code**: TX  
**Last Updated**: 2025-11-05  
**Verified By**: Care Commons Team  
**Next Review Date**: 2026-02-05

## Table of Contents

1. [Caregiver Credentials](#1-caregiver-credentials)
2. [Client Authorization](#2-client-authorization)
3. [Visit Documentation](#3-visit-documentation)
4. [Electronic Visit Verification (EVV)](#4-electronic-visit-verification-evv)
5. [Data Retention](#5-data-retention)
6. [Privacy & Security](#6-privacy--security)
7. [Reporting Requirements](#7-reporting-requirements)
8. [State Programs](#8-state-programs)

---

## 1. Caregiver Credentials

### 1.1 Employee Misconduct Registry (EMR) Check

**Statutory Authority:**
- Texas Human Resources Code §40.053
- 26 TAC §558.353
- HHSC Policy Manual, Section 2330

**Requirement:**
Before allowing client contact, agencies must verify caregivers are not listed on the Texas Employee Misconduct Registry (EMR).

**Frequency:**
- Initial verification before first client contact
- Re-verification at least annually (every 365 days)
- Re-verification immediately if reason to believe an offense occurred

**How to Verify:**
1. Access HHSC EMR search tool: https://apps.hhs.texas.gov/emr/
2. Search by caregiver's name and date of birth
3. Document search results (print to PDF or save screenshot)
4. If listed on EMR, caregiver is **permanently prohibited** from client contact

**Implementation:**
```typescript
// Database fields
emr_check_date: timestamp
emr_check_status: enum ('CLEAR', 'LISTED', 'PENDING')
emr_check_documentation: file_reference
emr_check_next_due: timestamp (365 days from check_date)

// Validation rules
- BLOCKING: Cannot assign if emr_check_status != 'CLEAR'
- BLOCKING: Cannot assign if emr_check_date > 365 days ago
- WARNING: Alert if emr_check_date > 335 days ago (30-day warning)
- PERMANENT BLOCK: If status = 'LISTED', cannot be overridden
```

**Test Scenarios:**
- [ ] New hire with clear EMR check → Allow assignments
- [ ] Caregiver with EMR check from 13 months ago → Block assignments
- [ ] Caregiver listed on EMR → Permanent block, cannot be overridden
- [ ] Caregiver with pending EMR check → Block until results received
- [ ] Caregiver with EMR expiring in 25 days → Show warning

**Edge Cases:**
- **Name changes** (married, divorced): Verify under both maiden and married names
- **Out-of-state transfers**: Texas EMR only covers Texas offenses; may need checks from other states
- **Duplicate names**: Verify using DOB and SSN to ensure correct individual

**Related Requirements:**
- Also need Nurse Aide Registry check (separate requirement)
- Level 2 background screening if serving vulnerable adults

---

### 1.2 Nurse Aide Registry (NAR) Verification

**Statutory Authority:**
- 26 TAC §558.3
- HHSC Nurse Aide Registry Requirements

**Requirement:**
Certified Nurse Aides (CNAs) must be listed in good standing on the Texas Nurse Aide Registry before providing services.

**Applicable Roles:**
- Certified Nurse Aide (CNA)
- Medication Aide
- Any caregiver performing delegated tasks requiring certification

**Verification:**
- Registry URL: https://vo.hhsc.state.tx.us/datamart/mainMenu.do
- Frequency: At hire and annually
- Must verify status is "Active" or "Active - Pending Renewal"
- Check for any disciplinary actions

**Implementation:**
```typescript
// Database fields
nar_registration_number: string
nar_check_date: timestamp
nar_status: enum ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED')
nar_expiration_date: timestamp
nar_verification_url: string

// Validation rules
- BLOCKING: CNA role requires nar_status = 'ACTIVE'
- BLOCKING: Cannot assign CNA tasks if nar_status != 'ACTIVE'
- BLOCKING: Cannot assign if nar_expiration_date has passed
- WARNING: Alert if nar_expiration_date within 30 days
```

**Test Scenarios:**
- [ ] CNA with active registry status → Allow CNA assignments
- [ ] CNA with expired registry → Block all CNA assignments
- [ ] Non-CNA assigned to CNA-only task → Block
- [ ] CNA with suspended status → Block all assignments

---

### 1.3 Background Screening

**Statutory Authority:**
- Texas Human Resources Code §250.006
- 26 TAC §558.355

**Requirement:**
Level 2 background screening required for caregivers serving vulnerable adults (elderly or disabled).

**Background Check Components:**
1. **Criminal history check** (Texas DPS and FBI fingerprints)
2. **State and national sex offender registry**
3. **DFPS abuse/neglect registry**
4. **HHSC sanctions and exclusions list**
5. **OIG exclusion list** (federal)

**Frequency:**
- Initial: Before client contact
- Renewal: Every 2 years
- Immediate re-check if arrest or credible allegation

**Disqualifying Offenses:**
- Violent crimes
- Sexual offenses
- Theft or fraud
- Drug trafficking
- Abuse or neglect of elderly/disabled
- Healthcare fraud

**Implementation:**
```typescript
// Database fields
background_check_type: enum ('LEVEL_1', 'LEVEL_2', 'FINGERPRINT')
background_check_date: timestamp
background_check_status: enum ('CLEAR', 'PENDING', 'ISSUES', 'EXPIRED')
background_check_expiration: timestamp (730 days from check_date)
background_check_provider: string
background_check_confirmation: string

// Validation rules
- BLOCKING: Must have background_check_status = 'CLEAR'
- BLOCKING: Cannot assign if background_check_expiration has passed
- BLOCKING: If background_check_status = 'ISSUES', requires compliance review
- WARNING: Alert if expiration within 60 days
```

**Test Scenarios:**
- [ ] Caregiver with clear Level 2 background → Allow
- [ ] Background check expired → Block until renewed
- [ ] Background check reveals disqualifying offense → Permanent block
- [ ] Background check pending → Block until results received

---

### 1.4 TB Testing

**Statutory Authority:**
- 26 TAC §558.357
- Texas Health and Safety Code

**Requirement:**
All caregivers must have tuberculosis (TB) screening before client contact and annually thereafter.

**Acceptable Screening Methods:**
- TB skin test (TST/PPD)
- Interferon-Gamma Release Assay (IGRA) blood test
- Chest X-ray (if positive TB test)

**Frequency:**
- Initial: Before client contact
- Annual: Every 365 days
- Immediate: If symptomatic or exposed

**Implementation:**
```typescript
// Database fields
tb_test_date: timestamp
tb_test_type: enum ('SKIN_TEST', 'IGRA_BLOOD_TEST', 'CHEST_XRAY')
tb_test_result: enum ('NEGATIVE', 'POSITIVE', 'PENDING')
tb_test_next_due: timestamp (365 days from test_date)

// Validation rules
- BLOCKING: Cannot assign if no TB test on file
- BLOCKING: Cannot assign if tb_test_next_due has passed
- BLOCKING: If tb_test_result = 'POSITIVE', requires chest X-ray clearance
- WARNING: Alert if tb_test_next_due within 30 days
```

---

### 1.5 Training Requirements

**Statutory Authority:**
- 26 TAC §558.359
- HHSC Home Health Orientation Requirements

**Required Training (Before Client Contact):**

**Orientation Training (Minimum 16 hours):**
1. Infection control (2 hours)
2. Client rights (1 hour)
3. Emergency procedures (1 hour)
4. Confidentiality and HIPAA (1 hour)
5. Recognizing and reporting abuse/neglect (2 hours)
6. Body mechanics and safe transfers (2 hours)
7. Documentation requirements (1 hour)
8. Cultural sensitivity (1 hour)
9. Communication skills (1 hour)
10. Agency policies and procedures (4 hours)

**Annual In-Service (Minimum 12 hours):**
- Infection control review
- Documentation updates
- Regulatory changes
- Skills competency assessment

**Implementation:**
```typescript
// Database fields
orientation_completed_date: timestamp
orientation_hours_completed: number
annual_inservice_hours: number
annual_inservice_year: number
training_certifications: array<{
  course_name: string,
  completion_date: timestamp,
  hours: number,
  certificate_url: string
}>

// Validation rules
- BLOCKING: Cannot assign if orientation_completed_date is null
- BLOCKING: Cannot assign if annual_inservice_hours < 12 for current year
- WARNING: Alert if annual in-service due within 30 days
```

---

## 2. Client Authorization

### 2.1 Service Authorization

**Statutory Authority:**
- Texas Administrative Code Title 1, Part 15
- HHSC Medicaid Provider Procedures Manual

**Requirement:**
All Medicaid-funded services require prior authorization or concurrent authorization from the managed care organization (MCO) or HHSC.

**Authorization Types:**

**1. STAR+PLUS (Medicaid Managed Care):**
- Prior authorization from MCO required
- Authorization includes: service type, units, start/end dates
- Units may be hours, visits, or episodes

**2. STAR Kids (Children with Disabilities):**
- Prior authorization from MCO
- May require assessment by MCO clinical staff
- Authorization tied to plan of care

**3. Community First Choice (CFC):**
- Person-directed services
- Authorization based on assessment of functional need
- Employer of Record (EOR) model allowed

**4. Primary Home Care (PHC) - Fee-for-Service:**
- Direct authorization from HHSC
- Requires physician plan of care
- Periodic review by HHSC nurse

**Implementation:**
```typescript
// Database fields
authorization_number: string
authorization_source: enum ('MCO', 'HHSC_FFS', 'PRIVATE_PAY', 'WAIVER')
authorized_services: array<service_code>
authorized_units: number
units_consumed: number
units_remaining: number
authorization_start_date: timestamp
authorization_end_date: timestamp
authorization_status: enum ('ACTIVE', 'PENDING', 'DENIED', 'EXPIRED', 'EXHAUSTED')
mco_name: string
mco_contact: string

// Validation rules
- BLOCKING: Cannot schedule visit if authorization_status != 'ACTIVE'
- BLOCKING: Cannot schedule visit before authorization_start_date
- BLOCKING: Cannot schedule visit after authorization_end_date
- BLOCKING: Cannot schedule visit if units_remaining < visit_duration
- BLOCKING: Service type must be in authorized_services array
- WARNING: Alert if units_consumed >= 90% of authorized_units
```

**Test Scenarios:**
- [ ] Schedule visit within valid authorization → Allow
- [ ] Schedule visit with expired authorization → Block
- [ ] Schedule visit exceeding authorized units → Block
- [ ] Schedule non-authorized service type → Block
- [ ] Authorization at 95% utilization → Show warning

---

### 2.2 Plan of Care

**Statutory Authority:**
- 42 CFR §484 (Medicare Conditions of Participation)
- 26 TAC §558.363 (Texas)

**Requirement:**
All clients must have a current physician-signed plan of care before services begin.

**Plan of Care Requirements:**
1. **Physician signature** (MD, DO, NP, PA with physician supervision)
2. **Services ordered** (specific tasks and frequency)
3. **Client diagnosis** (ICD-10 codes)
4. **Start of care date**
5. **Review frequency** (every 60 days for Medicare, varies for Medicaid)
6. **Goals and outcomes** (measurable, client-specific)

**Review Frequency:**
- **Medicare**: Every 60 days
- **Medicaid**: Every 90 days (varies by program)
- **Private pay**: As specified in contract

**Physician Orders:**
- Must be renewed every 60 days for Medicare
- Must be renewed if client condition changes
- Verbal orders acceptable if countersigned within 30 days

**Implementation:**
```typescript
// Database fields
plan_of_care_date: timestamp
plan_of_care_review_date: timestamp
next_review_due: timestamp
physician_signature_date: timestamp
physician_npi: string
physician_name: string
diagnosis_codes: array<string> // ICD-10
ordered_services: array<service_code>
orders_expiration: timestamp

// Validation rules
- BLOCKING: Cannot provide service if plan_of_care_date is null
- BLOCKING: Cannot provide service if next_review_due has passed
- BLOCKING: Cannot provide service if orders_expiration has passed
- WARNING: Alert if next_review_due within 7 days
- WARNING: Alert if orders_expiration within 14 days
```

**Test Scenarios:**
- [ ] Client with current plan of care → Allow services
- [ ] Plan of care review overdue by 5 days → Block services
- [ ] Physician orders expired → Block services
- [ ] Plan of care review due in 5 days → Show warning

---

## 3. Visit Documentation

### 3.1 Required Documentation

**Statutory Authority:**
- 26 TAC §558.363
- Medicare Conditions of Participation 42 CFR §484.110

**Requirement:**
Every visit must be documented with specific required elements.

**Required Documentation Elements:**

1. **Services Provided:**
   - Specific tasks performed (not vague descriptions)
   - Task completion status
   - Any tasks refused by client

2. **Client Condition:**
   - Observable condition (appearance, mood, mobility)
   - Changes from previous visit
   - Client complaints or concerns

3. **Vital Signs** (if applicable):
   - Blood pressure
   - Pulse
   - Temperature
   - Respirations
   - Pain level (0-10 scale)

4. **Medications:**
   - Medications administered (if applicable)
   - Medication reminders given
   - Medication refusals

5. **Observations:**
   - Safety hazards in home
   - Client response to services
   - Any incidents or accidents

6. **Signatures:**
   - Caregiver signature with date/time
   - Client or representative signature (if required)

**Documentation Timeliness:**
- Must be completed within 24 hours of visit end
- Late documentation (>24 hours) requires supervisor approval

**Implementation:**
```typescript
// Database fields
services_provided: text (minimum 50 characters)
client_condition: text
vital_signs: jsonb {
  blood_pressure_systolic: number,
  blood_pressure_diastolic: number,
  pulse: number,
  temperature: number,
  respirations: number,
  pain_level: number
}
medications_administered: array<{
  medication_name: string,
  dosage: string,
  time_given: timestamp,
  route: string
}>
caregiver_observations: text
incidents: text
caregiver_signature: timestamp
client_signature: timestamp
representative_signature: timestamp
documented_at: timestamp

// Validation rules
- BLOCKING: Cannot mark visit complete if services_provided is null or < 50 chars
- BLOCKING: Cannot mark complete if client_condition is null
- BLOCKING: Cannot mark complete if caregiver_signature is null
- WARNING: If documented_at - visit_end_time > 24 hours, requires supervisor approval
- WARNING: Blocked phrases: "Client fine", "No issues", "Same as usual"
```

**Blocked Phrases** (too vague):
- "Client fine"
- "No problems"
- "Everything okay"
- "Same as usual"
- "Did everything on list"

**Good Documentation Examples:**
- ✅ "Assisted client with shower. Client able to stand with minimal support. No signs of skin breakdown."
- ✅ "Prepared lunch per diet plan (low sodium). Client ate 75% of meal, reported good appetite."
- ✅ "Transported client to physician appointment. Client ambulated 20 feet with walker to car."

**Test Scenarios:**
- [ ] Visit with all required fields → Allow completion
- [ ] Visit missing services_provided → Block completion
- [ ] Documentation completed 30 hours after visit → Require supervisor approval
- [ ] Notes contain "Client fine" → Show warning, suggest revision

---

## 4. Electronic Visit Verification (EVV)

### 4.1 EVV Mandate

**Statutory Authority:**
- 21st Century Cures Act §12006(a) (Federal)
- Texas Human Resources Code §32.00131
- HHSC EVV Policy

**Requirement:**
All personal care services and home health aide services funded by Medicaid must use EVV.

**Six Required Data Elements:**
1. **Type of service** performed
2. **Individual receiving** the service (client)
3. **Individual providing** the service (caregiver)
4. **Date** of service
5. **Location** of service delivery
6. **Time** service begins and ends

**Services Requiring EVV (Texas Medicaid):**
- Personal assistance services (PAS)
- Home health aide services
- Attendant care services
- Habilitation services
- Respite care
- Community first choice (CFC)

**Implementation:**
```typescript
// Already implemented in time-tracking-evv vertical
// Reference: verticals/time-tracking-evv/src/types/evv.ts

// Texas-specific config
state: 'TX',
aggregatorType: 'HHAEEXCHANGE',
aggregatorEndpoint: 'https://api.hhaeexchange.com/evv/v2/visits',
gracePeriodMinutes: 10,
geofenceRadiusMeters: 100,
geofenceToleranceMeters: 50,
```

---

### 4.2 HHAeXchange Aggregator (State-Mandated)

**Statutory Authority:**
- HHSC EVV Policy
- HHAeXchange is the HHSC-designated aggregator

**Requirement:**
All Texas Medicaid EVV data must be submitted to HHAeXchange.

**Aggregator Details:**
- **Name**: HHAeXchange
- **Endpoint**: `https://api.hhaeexchange.com/evv/v2/visits`
- **Authentication**: API Key (agency-specific)
- **Submission**: Real-time or batch (within 24 hours)

**Submission Requirements:**
- Submit within 24 hours of visit completion
- Include all six required data elements
- Include state-specific fields (MCO, authorization number)
- Retry failed submissions with exponential backoff

**Implementation:**
```typescript
// Reference implementation
// verticals/time-tracking-evv/src/aggregators/hhaeexchange-aggregator.ts

// Submission payload
{
  visitId: string,
  serviceType: string,
  clientMedicaidId: string,
  caregiverEmployeeId: string,
  serviceDate: date,
  serviceLocation: {
    latitude: number,
    longitude: number,
    address: string
  },
  clockInTime: timestamp,
  clockOutTime: timestamp,
  authorizationNumber: string,
  mcoCode: string,
  programType: string
}
```

**Error Handling:**
- **Submission failure**: Retry with exponential backoff (1min, 5min, 15min, 1hr)
- **Rejection**: Log error, flag for manual review
- **Network outage**: Queue for batch submission when online

---

### 4.3 Geofence Requirements

**Statutory Authority:**
- HHSC EVV Policy
- HHAeXchange Technical Specifications

**Requirements:**
- **Base geofence radius**: 100 meters
- **GPS accuracy allowance**: 50 meters
- **Total allowable variance**: 150 meters (100m base + 50m tolerance)

**Geofence Validation:**
- Clock-in location must be within geofence
- Clock-out location must be within geofence
- GPS accuracy must be ≤100 meters for mobile verification

**Exceptions:**
- **Rural areas**: May have larger geofence (150m base + 75m tolerance)
- **Multi-story buildings**: Vertical tolerance not calculated (GPS altitude unreliable)
- **Community outings**: Mobile service location updated in real-time

**Implementation:**
```typescript
// Texas geofence config
geofenceRadiusMeters: 100, // Base radius
geofenceToleranceMeters: 50, // GPS accuracy allowance
// Total = 150 meters

// Validation
function isWithinGeofence(
  clientLocation: {lat: number, lng: number},
  caregiverLocation: {lat: number, lng: number},
  gpsAccuracy: number
): boolean {
  const distance = haversineDistance(clientLocation, caregiverLocation);
  const totalAllowance = 100 + Math.min(gpsAccuracy, 50);
  return distance <= totalAllowance;
}
```

**Test Scenarios:**
- [ ] Clock-in 50m from client address, GPS accuracy 30m → Allow (within 150m total)
- [ ] Clock-in 200m from client address → Block, require supervisor override
- [ ] Clock-in with GPS accuracy 200m → Block, require better signal
- [ ] Community outing (service location changed) → Allow at new location

---

### 4.4 Grace Periods

**Statutory Authority:**
- HHSC EVV Policy
- Fair Labor Standards Act (FLSA) considerations

**Requirements:**
- **Clock-in early**: Up to 10 minutes before scheduled start
- **Clock-in late**: Up to 10 minutes after scheduled start
- **Clock-out early**: Up to 10 minutes before scheduled end (if visit complete)
- **Clock-out late**: Up to 10 minutes after scheduled end

**Rationale:**
Grace periods account for:
- GPS signal acquisition time
- Traffic delays
- Client preparation time
- Device startup time

**Beyond Grace Period:**
- Requires explanation/reason
- May require supervisor approval
- Affects billing (only actual time is billable)

**Implementation:**
```typescript
// Texas grace period config
gracePeriodMinutes: 10,

// Validation
clockInGracePeriod: {
  earlyMinutes: 10,
  lateMinutes: 10
},
clockOutGracePeriod: {
  earlyMinutes: 10,
  lateMinutes: 10
}

// Flags
- If clock-in > 10 minutes early: Flag for review
- If clock-in > 10 minutes late: Flag as late, reason required
- If clock-out > 10 minutes early: Flag, verify visit completion
- If clock-out > 10 minutes late: Flag for review
```

---

### 4.5 Visit Maintenance Unlock Request (VMUR)

**Statutory Authority:**
- HHSC EVV Policy
- HHAeXchange VMUR Procedures

**Requirement:**
After EVV data is submitted to HHAeXchange, it becomes locked. Any corrections require a Visit Maintenance Unlock Request (VMUR).

**VMUR Process:**
1. **Request**: Supervisor submits VMUR with reason code
2. **Reason Code**: Required (device malfunction, GPS unavailable, etc.)
3. **Approval**: HHAeXchange approves or denies within 24 hours
4. **Correction**: If approved, agency has 30 days to correct and resubmit
5. **Audit Trail**: All VNURs logged and auditable

**Valid Reason Codes:**
- `DEVICE_MALFUNCTION` - Device hardware/software failure
- `GPS_UNAVAILABLE` - No GPS signal available
- `NETWORK_OUTAGE` - Internet/cellular outage
- `FORGOT_TO_CLOCK` - Attendant forgot to clock in/out
- `SERVICE_LOCATION_CHANGE` - Service at alternate location
- `RURAL_POOR_SIGNAL` - Rural area with poor GPS/cellular
- `EMERGENCY_EVACUATION` - Emergency/disaster evacuation
- `OTHER_APPROVED` - Other reason with detailed explanation

**Implementation:**
```typescript
// VMUR tracking
// verticals/time-tracking-evv/src/service/vmur-service.ts

interface TexasVMUR {
  id: string,
  evvRecordId: string,
  visitId: string,
  requestedBy: string,
  requestedAt: timestamp,
  requestReason: TexasVMURReasonCode,
  requestReasonDetails: string,
  approvalStatus: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED',
  approvedBy?: string,
  approvedAt?: timestamp,
  originalData: EvvDataSnapshot,
  correctedData: EvvDataSnapshot,
  submittedToAggregator: boolean,
  expiresAt: timestamp // 30 days from approval
}
```

**Test Scenarios:**
- [ ] VMUR submitted with valid reason → Pending approval
- [ ] VMUR approved → Allow correction within 30 days
- [ ] VMUR denied → Cannot correct, must use original data
- [ ] VMUR expired (>30 days) → Cannot correct

---

## 5. Data Retention

**Statutory Authority:**
- 26 TAC §558.365
- HIPAA minimum: 6 years
- Medicare: 5 years from date of service
- Texas records retention: 6 years

**Requirements:**

**Visit Records**: 6 years from date of service
**Personnel Records**: 6 years from termination
**Financial Records**: 7 years (IRS requirement supersedes)
**Authorization Records**: 6 years from expiration
**EVV Records**: 6 years from date of service
**Quality Assurance**: 6 years

**Implementation:**
```typescript
retentionYears: 6,

// Retention policy
- Soft delete records (mark as deleted, retain data)
- Archive to cold storage after 3 years
- Permanent deletion only after 6 years + current fiscal year
- Audit trail of all deletions
```

---

## 6. Privacy & Security

### 6.1 HIPAA Compliance

**Requirement:**
All PHI must be protected per HIPAA Privacy and Security Rules.

**Key Requirements:**
- Minimum necessary access
- Role-based permissions
- Audit logging of all PHI access
- Encryption at rest and in transit
- Business Associate Agreements with vendors
- Breach notification procedures (within 60 days)

### 6.2 Texas Medical Records Privacy Act

**Statutory Authority:**
- Texas Health and Safety Code, Chapter 181

**Additional Texas Requirements:**
- Patient authorization for disclosure (beyond HIPAA)
- Stricter breach notification (15 days)
- Mental health records have additional protections

---

## 7. Reporting Requirements

### 7.1 Incident Reporting

**Statutory Authority:**
- Texas Human Resources Code §48.051
- 26 TAC §558.369

**Reportable Events:**

**Immediate (within 1 hour):**
- Client death (unexpected)
- Sexual abuse
- Life-threatening emergency

**Within 24 hours:**
- Client injury requiring medical treatment
- Physical abuse
- Exploitation
- Missing client

**Within 5 business days:**
- Medication errors
- Falls without injury
- Rights violations

**Who to Report To:**
- HHSC: 1-800-458-9858
- Adult Protective Services: 1-800-252-5400
- Law enforcement (if criminal)

---

## 8. State Programs

### 8.1 Texas Medicaid Programs

**STAR+PLUS:**
- Managed care for adults with disabilities
- Ages 21+ with disabilities
- Long-term services and supports (LTSS)

**STAR Kids:**
- Managed care for children with disabilities
- Ages 0-20
- Comprehensive services

**Community First Choice (CFC):**
- Person-directed attendant services
- Consumer or employer of record models
- Functional assessment required

**Primary Home Care (PHC):**
- Fee-for-service Medicaid
- Traditional home health
- Skilled and unskilled services

---

## Resources

### Official Sources

- **HHSC**: https://hhs.texas.gov/
- **Texas Medicaid Provider**: https://www.tmhp.com/
- **EMR Search**: https://apps.hhs.texas.gov/emr/
- **NAR Search**: https://vo.hhsc.state.tx.us/datamart/mainMenu.do
- **HHAeXchange**: https://www.hhaeexchange.com/
- **EVV Policy**: https://hhs.texas.gov/services/health/medicaid-chip/provider-information/electronic-visit-verification-evv

### Regulations

- Texas Administrative Code Title 26, Chapter 558: https://texreg.sos.state.tx.us/
- Texas Human Resources Code: https://statutes.capitol.texas.gov/

### Contacts

- HHSC Provider Helpline: 1-800-925-9126
- EVV Support: evv@hhs.texas.gov
- HHAeXchange Support: 1-855-472-3973

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
