# Florida Home Healthcare Compliance Requirements

**State Code**: FL  
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

### 1.1 Level 2 Background Screening

**Statutory Authority:**
- Chapter 435, Florida Statutes
- Florida Administrative Code Chapter 59A-8

**Requirement:**
All personnel with direct client contact must complete Level 2 background screening before providing services.

**Screening Components:**
1. **Statewide criminal history** (Florida Department of Law Enforcement)
2. **National criminal history** (FBI fingerprints)
3. **Local criminal records** (local law enforcement)
4. **Juvenile records** (if applicable)
5. **Department of Children and Families** (abuse/neglect registry)

**Frequency:**
- Initial: Before first client contact
- Renewal: Every 5 years
- Re-screening: If employee has break in service >90 days

**Disqualifying Offenses:**
- Murder, manslaughter, assault
- Sexual battery, lewd acts, child abuse
- Exploitation of elderly or disabled
- Robbery, burglary, theft
- Drug trafficking (within 3 years)
- Fraud, forgery, counterfeiting

**5-Year Lifecycle:**
- Years 1-5: Background screening valid
- Year 5: Renewal required before expiration
- Lapse: Cannot provide services until renewed

**Implementation:**
```typescript
// Database fields
fl_background_screening_number: string // AHCA/FDLE screening number
fl_background_screening_date: timestamp
fl_background_screening_expiration: timestamp // 5 years from issue
fl_background_screening_status: enum ('CLEAR', 'PENDING', 'DISQUALIFIED', 'EXPIRED')
fl_background_screening_level: 'LEVEL_2'
fl_screening_exemption: boolean // Rare cases

// Validation rules
- BLOCKING: Must have fl_background_screening_status = 'CLEAR'
- BLOCKING: Cannot assign if fl_background_screening_expiration has passed
- BLOCKING: Cannot assign if break in service > 90 days without re-screening
- WARNING: Alert if expiration within 90 days (3-month renewal window)
```

**Test Scenarios:**
- [ ] Caregiver with valid Level 2 screening → Allow assignments
- [ ] Screening expired → Block until renewed
- [ ] Screening pending → Block until results received
- [ ] Disqualified status → Permanent block
- [ ] Screening expires in 60 days → Show warning

**Edge Cases:**
- **Out-of-state transfers**: Florida may accept reciprocal screenings from certain states
- **Break in service**: >90 days requires new screening
- **Name changes**: Must update screening records with AHCA

---

### 1.2 Certified Nursing Assistant (CNA) Registry

**Statutory Authority:**
- Section 464.203, Florida Statutes
- Florida Administrative Code 64B9-15

**Requirement:**
CNAs must be listed in good standing on the Florida Certified Nursing Assistant Registry.

**Verification:**
- Registry URL: https://mqa-internet.doh.state.fl.us/MQASearchServices/
- Search by name or license number
- Status must be "Active" or "Current"
- Check for disciplinary actions

**Frequency:**
- At hire
- Annually
- Immediately if complaint filed

**CNA Requirements:**
- Complete state-approved training program (75 hours minimum)
- Pass competency exam (written and skills)
- Maintain active registration
- Complete 24 hours continuing education every 2 years

**Implementation:**
```typescript
// Database fields
fl_cna_registration_number: string
fl_cna_registration_date: timestamp
fl_cna_expiration_date: timestamp // Biennial renewal
fl_cna_status: enum ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED')
fl_cna_verification_date: timestamp
fl_cna_ce_hours_completed: number // Continuing education

// Validation rules
- BLOCKING: CNA role requires fl_cna_status = 'ACTIVE'
- BLOCKING: Cannot assign CNA tasks if expired or inactive
- WARNING: Alert if expiration within 60 days
- WARNING: Alert if CE hours < 24 for renewal cycle
```

---

### 1.3 Home Health Aide (HHA) Certification

**Statutory Authority:**
- Chapter 400, Florida Statutes
- Florida Administrative Code Chapter 59A-8

**Requirement:**
Home Health Aides must complete state-approved training and maintain certification.

**Training Requirements:**
- 75 hours minimum (same as CNA)
- OR hold current CNA or nursing license
- Competency evaluation (written and skills demonstration)

**Certification Components:**
1. Basic nursing skills
2. Personal care procedures
3. Infection control
4. Safety and emergency procedures
5. Client rights and independence
6. Communication and interpersonal skills
7. Documentation

**Annual Competency Review:**
- Skills assessment by RN supervisor
- Minimum 12 hours in-service training
- Documentation of competency

**Implementation:**
```typescript
// Database fields
fl_hha_certification_number: string
fl_hha_certification_date: timestamp
fl_hha_expiration_date: timestamp
fl_hha_training_program: string
fl_hha_competency_review_date: timestamp
fl_hha_annual_inservice_hours: number

// Validation rules
- BLOCKING: HHA role requires valid certification
- BLOCKING: Annual competency review overdue → Block HHA assignments
- WARNING: Competency review due within 30 days
```

---

### 1.4 Tuberculosis Screening

**Statutory Authority:**
- Florida Administrative Code 59A-8.0085

**Requirement:**
All personnel must have TB screening before client contact and annually thereafter.

**Acceptable Screening:**
- Mantoux tuberculin skin test (TST)
- Interferon-Gamma Release Assay (IGRA) blood test
- Chest X-ray (if previous positive test)
- Documented history of TB treatment

**Frequency:**
- Initial: Before client contact
- Annual: Every 365 days
- Immediate: If exposed or symptomatic

**Implementation:**
```typescript
// Database fields
fl_tb_screening_date: timestamp
fl_tb_screening_type: enum ('TST', 'IGRA', 'CHEST_XRAY', 'TREATMENT_HISTORY')
fl_tb_screening_result: enum ('NEGATIVE', 'POSITIVE', 'CLEARED')
fl_tb_next_due: timestamp

// Validation rules
- BLOCKING: Cannot assign without TB screening on file
- BLOCKING: Cannot assign if fl_tb_next_due has passed
- BLOCKING: If positive, requires chest X-ray clearance
```

---

### 1.5 Registered Nurse Supervision

**Statutory Authority:**
- Florida Administrative Code 59A-8.0082
- Section 400.462, Florida Statutes

**Requirement:**
Licensed home health agencies must have RN supervision for skilled nursing services.

**RN Supervision Requirements:**
- Initial visit within 48 hours of start of care (skilled cases)
- Supervisory visit every 60 days minimum
- HHA supervision: Every 60 days or more frequently as needed
- Available for consultation 24/7

**RN Licensure:**
- Must hold active, unencumbered Florida RN license
- License verification through Florida Board of Nursing
- Biennial renewal required

**Implementation:**
```typescript
// Database fields
supervising_rn_id: uuid
rn_license_number: string
rn_license_expiration: timestamp
last_supervisory_visit: timestamp
next_supervisory_visit_due: timestamp

// Validation rules
- BLOCKING: Skilled services require RN supervision within 60 days
- WARNING: Supervisory visit due within 7 days
```

---

## 2. Client Authorization

### 2.1 Managed Care Organization (MCO) Authorization

**Statutory Authority:**
- Section 409.912, Florida Statutes (Statewide Medicaid Managed Care)
- Florida Medicaid Provider General Handbook

**Requirement:**
Most Florida Medicaid recipients are enrolled in managed care plans. Services require MCO authorization.

**MCO Types:**

**Statewide Medicaid Managed Care (SMMC):**
1. **Long-Term Care (LTC)** - Elderly and disabled adults
2. **Managed Medical Assistance (MMA)** - General Medicaid population

**Managed Care Plans (Examples):**
- Sunshine Health
- Molina Healthcare
- Simply Healthcare
- WellCare
- UnitedHealthcare
- Humana

**Authorization Process:**
1. Submit service request to MCO
2. MCO reviews medical necessity
3. Authorization issued with: service type, units, dates
4. Provider delivers services within authorization
5. Submit claims to MCO (not state)

**Implementation:**
```typescript
// Database fields
fl_mco_name: string // e.g., 'Sunshine Health'
fl_mco_member_id: string
fl_authorization_number: string
authorized_services: array<service_code>
authorized_units: number
units_consumed: number
authorization_start_date: timestamp
authorization_end_date: timestamp
authorization_status: enum ('ACTIVE', 'PENDING', 'DENIED', 'EXPIRED')

// Validation rules
- BLOCKING: Cannot schedule without active MCO authorization
- BLOCKING: Service type must be authorized
- BLOCKING: Cannot exceed authorized units
- WARNING: Alert at 90% utilization
```

---

### 2.2 Fee-for-Service Medicaid Authorization

**Statutory Authority:**
- Chapter 409, Florida Statutes
- Florida Medicaid Provider General Handbook

**Requirement:**
Small percentage of recipients remain in fee-for-service. Services require prior authorization from AHCA.

**Prior Authorization:**
- Submit to Agency for Health Care Administration (AHCA)
- Medical necessity documentation required
- Physician plan of care required
- Authorization valid for specified time period

---

### 2.3 Plan of Care

**Statutory Authority:**
- Florida Administrative Code Chapter 59A-8
- 42 CFR §484 (Medicare)

**Requirement:**
All clients must have physician-signed plan of care before services begin.

**Plan of Care Requirements:**
1. Physician signature (MD, DO, NP, PA)
2. Diagnoses (ICD-10 codes)
3. Specific services ordered
4. Frequency and duration
5. Goals and outcomes
6. Measurable objectives

**Review Frequency:**
- **Medicare**: Every 60 days
- **Medicaid**: Every 90 days (varies by plan)
- **Private pay**: Per contract

**RN Supervisory Visit:**
- Every 60 days for skilled nursing clients
- Update plan of care based on client status
- Physician signature on changes

**Implementation:**
```typescript
// Database fields
plan_of_care_established_date: timestamp
plan_of_care_review_date: timestamp
next_review_due: timestamp
physician_signature_date: timestamp
physician_npi: string
diagnosis_codes: array<string>
ordered_services: array<service_code>
rn_supervisory_visit_date: timestamp

// Validation rules
- BLOCKING: Cannot provide service without current plan of care
- BLOCKING: Cannot provide service if review overdue
- WARNING: Alert if review due within 14 days
- WARNING: Alert if RN supervisory visit due within 7 days
```

---

## 3. Visit Documentation

### 3.1 Required Documentation Elements

**Statutory Authority:**
- Florida Administrative Code Chapter 59A-8
- Medicare Conditions of Participation

**Requirement:**
Every visit must be documented within 24 hours with required elements.

**Required Elements:**

1. **Date and time** of visit (start and end)
2. **Services provided** (specific tasks, not vague)
3. **Client response** to services
4. **Observations** of client condition
5. **Vital signs** (if applicable)
6. **Medications** administered or reminded
7. **Incidents/accidents** if any
8. **Client signature** (or reason for absence)
9. **Caregiver signature** with credentials

**Documentation Standards:**
- Objective, factual observations
- Professional terminology
- Specific, measurable descriptions
- No vague phrases
- Legible (if handwritten)
- No erasures or white-out (electronic preferred)

**Timeliness:**
- Documentation completed within 24 hours of visit
- Late documentation requires supervisor approval
- Pattern of late documentation is survey deficiency

**Implementation:**
```typescript
// Database fields
visit_start_time: timestamp
visit_end_time: timestamp
services_provided: text (minimum 75 characters)
client_response: text
observations: text
vital_signs: jsonb
medications: array
incidents: text
client_signature_timestamp: timestamp
client_signature_declined_reason: string
caregiver_signature_timestamp: timestamp
documented_at: timestamp

// Validation rules
- BLOCKING: Cannot complete visit without all required fields
- BLOCKING: services_provided minimum 75 characters
- WARNING: If documented_at - visit_end_time > 24 hours
- WARNING: Blocked phrases: "Client fine", "No issues", "Normal"
```

---

## 4. Electronic Visit Verification (EVV)

### 4.1 EVV Mandate

**Statutory Authority:**
- 21st Century Cures Act §12006(a) (Federal)
- Section 409.908, Florida Statutes
- AHCA EVV Requirements

**Requirement:**
Personal care services funded by Medicaid must use EVV capturing six required data elements.

**Six Required Elements:**
1. Type of service
2. Individual receiving service
3. Individual providing service
4. Date of service
5. Location of service
6. Time service begins and ends

**Florida Services Requiring EVV:**
- Personal care services
- Home health aide services
- Companion services
- Homemaker services
- Respite care
- Attendant care

---

### 4.2 Multi-Aggregator Model (Florida Unique)

**Statutory Authority:**
- AHCA EVV Policy

**Florida's Open Model:**
Unlike Texas's single aggregator, Florida allows agencies to choose from multiple EVV vendors and aggregators.

**Approved Aggregators:**
1. **HHAeXchange** - Most common
2. **Tellus (Netsmart)** - Second most common
3. **iConnect** - Smaller player
4. **Other AHCA-approved vendors**

**MCO-Specific Routing:**
- Different MCOs may prefer different aggregators
- Agency may need to submit to multiple aggregators
- Must track which aggregator for which MCO/client

**Implementation:**
```typescript
// Multi-aggregator configuration
florida_aggregators: [
  {
    id: 'hhaeexchange-fl',
    name: 'HHAeXchange',
    endpoint: 'https://api.hhaeexchange.com/florida/evv/v1',
    assigned_mcos: ['SUNSHINE_HEALTH', 'MOLINA', 'SIMPLY'],
    is_default: true
  },
  {
    id: 'tellus-fl',
    name: 'Tellus',
    endpoint: 'https://api.tellus.netsmart.com/florida/evv/v1',
    assigned_mcos: ['WELLCARE', 'UNITED'],
    is_default: false
  }
]

// Aggregator selection logic
function selectAggregator(client: Client): Aggregator {
  const mco = client.mco_name;
  const aggregator = florida_aggregators.find(agg => 
    agg.assigned_mcos.includes(mco)
  );
  return aggregator || florida_aggregators.find(agg => agg.is_default);
}
```

---

### 4.3 Geofence Requirements (More Lenient)

**Statutory Authority:**
- AHCA EVV Policy

**Florida Geofencing:**
- **Base geofence radius**: 150 meters (more lenient than Texas)
- **GPS accuracy allowance**: 100 meters
- **Total allowable variance**: 250 meters (150m + 100m)

**Rationale for Larger Geofence:**
- Diverse geography (urban, suburban, rural, coastal)
- High-rise buildings common in urban areas
- GPS challenges in dense tree cover (hurricanes create gaps)
- Elderly communities with large campuses

**Exceptions:**
- **Assisted Living Facilities**: May use facility-wide geofence
- **Continuing Care Communities**: Large campus geofence
- **Mobile services**: Community outings, transportation

**Implementation:**
```typescript
// Florida geofence config
FL: {
  state: 'FL',
  aggregatorType: 'MULTI',
  geofenceRadiusMeters: 150, // Base (more lenient)
  geofenceToleranceMeters: 100, // GPS accuracy (more lenient)
  // Total = 250 meters
  gracePeriodMinutes: 15, // Also more lenient
}
```

---

### 4.4 Grace Periods (More Generous)

**Statutory Authority:**
- AHCA EVV Policy
- Fair Labor Standards Act

**Florida Grace Periods:**
- **Clock-in early**: Up to 15 minutes before scheduled start
- **Clock-in late**: Up to 15 minutes after scheduled start
- **Clock-out early**: Up to 15 minutes before scheduled end
- **Clock-out late**: Up to 15 minutes after scheduled end

**More Lenient Than Texas:**
Florida allows 15-minute grace (vs. Texas 10-minute), reflecting:
- Traffic congestion in major metros (Miami, Tampa, Orlando)
- Hurricane season travel disruptions
- Larger state geographic area
- Tourist traffic patterns

**Implementation:**
```typescript
gracePeriodMinutes: 15,

clockInGracePeriod: {
  earlyMinutes: 15,
  lateMinutes: 15
},
clockOutGracePeriod: {
  earlyMinutes: 15,
  lateMinutes: 15
}
```

---

### 4.5 Telephony Fallback

**Statutory Authority:**
- AHCA EVV Policy

**Florida Allows Telephony:**
If mobile GPS unavailable, telephone verification is acceptable backup.

**Telephony Requirements:**
- Call to client's landline
- IVR system verification
- Client address verification
- Reason for using telephony documented
- GPS attempted first (evidence required)

**Common Telephony Scenarios:**
- Rural areas with poor cellular coverage
- Building basements/interior rooms
- Device malfunction
- Battery died during visit
- Emergency situations

**Implementation:**
```typescript
// Telephony fallback
fl_telephony_allowed: true,

// Telephony verification
{
  verification_method: 'TELEPHONY_IVR',
  phone_number: string,
  call_timestamp: timestamp,
  reason_for_telephony: string,
  gps_attempt_evidence: string
}
```

---

## 5. Data Retention

**Statutory Authority:**
- Florida Statutes Chapter 400
- HIPAA minimum: 6 years
- Florida records retention: 6 years

**Requirements:**

**Clinical Records**: 6 years from discharge or last service
**Personnel Records**: 3 years from termination (less than federal)
**Financial Records**: 7 years (IRS supersedes)
**Authorization Records**: 6 years
**EVV Records**: 6 years
**Survey/Inspection**: 6 years

**Implementation:**
```typescript
retentionYears: 6,

// Florida-specific retention
personnel_retention_years: 3, // Less than other states
clinical_retention_years: 6,
financial_retention_years: 7
```

---

## 6. Privacy & Security

### 6.1 HIPAA Compliance

Standard HIPAA Privacy and Security Rules apply.

### 6.2 Florida Patient Rights

**Statutory Authority:**
- Section 400.022, Florida Statutes
- Florida Patient Bill of Rights

**Additional Florida Requirements:**
- Patient access to records within 48 hours (faster than HIPAA 30 days)
- Ability to request corrections immediately
- Right to refuse specific caregivers
- Right to voice grievances without retaliation

---

## 7. Reporting Requirements

### 7.1 Incident Reporting

**Statutory Authority:**
- Section 400.022, Florida Statutes
- Florida Administrative Code 59A-8

**Reportable Events:**

**Immediate (within 1 hour):**
- Client death (unexpected)
- Sexual abuse or battery
- Missing client

**Within 24 hours:**
- Physical abuse
- Exploitation
- Neglect
- Significant injury

**Within 1 business day:**
- Medication errors requiring medical intervention
- Falls with injury
- Theft or loss of client property >$100

**Who to Report To:**
- AHCA: 1-888-419-3456
- Adult Protective Services: 1-800-96-ABUSE (1-800-962-2873)
- Law enforcement (if criminal)

---

## 8. State Programs

### 8.1 Florida Medicaid Programs

**Statewide Medicaid Managed Care (SMMC):**

**Long-Term Care (LTC):**
- Nursing facility diversion
- Assisted living services
- Home and community-based services
- Medicaid waiver programs

**Managed Medical Assistance (MMA):**
- General Medicaid population
- Acute care services
- Limited home health

**Fee-for-Service:**
- Small percentage still FFS
- Direct billing to AHCA
- Prior authorization required

### 8.2 DOEA (Department of Elder Affairs)

**Community Care for the Elderly (CCE):**
- State-funded program (non-Medicaid)
- Eligible: 60+ with care needs
- Services: homemaker, respite, adult day care
- Sliding fee scale based on income

**Alzheimer's Disease Initiative (ADI):**
- Respite services
- Specialized day care
- Caregiver support

---

## Resources

### Official Sources

- **AHCA**: https://ahca.myflorida.com/
- **Florida Medicaid**: https://www.flmedicaid.com/
- **FL Board of Nursing**: https://floridasnursing.gov/
- **CNA Registry**: https://mqa-internet.doh.state.fl.us/MQASearchServices/
- **Background Screening**: https://ahca.myflorida.com/MCHQ/Health_Facility_Regulation/Background_Screening/index.shtml
- **DOEA**: https://elderaffairs.org/

### Regulations

- Florida Statutes: http://www.leg.state.fl.us/Statutes/
- Florida Administrative Code: https://www.flrules.org/

### Contacts

- AHCA Provider Support: 1-850-412-4018
- EVV Support: evv@ahca.myflorida.com
- Adult Protective Services: 1-800-962-2873
- DOEA: 1-850-414-2000

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
