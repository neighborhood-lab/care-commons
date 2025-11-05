# [STATE NAME] Home Healthcare Compliance Requirements

**State Code**: [XX]  
**Last Updated**: [YYYY-MM-DD]  
**Verified By**: [Name/Organization]  
**Next Review Date**: [YYYY-MM-DD]

## Table of Contents

1. [Caregiver Credentials](#caregiver-credentials)
2. [Client Authorization](#client-authorization)
3. [Visit Documentation](#visit-documentation)
4. [Electronic Visit Verification (EVV)](#electronic-visit-verification-evv)
5. [Data Retention](#data-retention)
6. [Privacy & Security](#privacy--security)

---

## 1. Caregiver Credentials

### 1.1 Background Screening

**Statutory Authority:**
- [State Code §X.XXX]
- [Administrative Rule XX-XX-XXX]
- [Policy Manual Section]

**Requirement:**
[Describe what background screening is required]

**Frequency:**
- Initial: [When required]
- Renewal: [Every X years/months]
- Re-verification triggers: [Events requiring re-check]

**How to Verify:**
1. [Step-by-step verification process]
2. [Where to access registry/database]
3. [Documentation requirements]

**Implementation:**
```typescript
// Database fields needed
- background_check_date: timestamp
- background_check_status: enum (CLEAR, PENDING, ISSUES, EXPIRED)
- background_check_type: enum (LEVEL_1, LEVEL_2, FINGERPRINT)
- background_check_documentation: file_reference
- background_check_expiration: timestamp

// Validation rules
- Cannot assign to visit if status != 'CLEAR'
- Warning if expiration within 30 days
- Blocking if expired
```

**Test Scenarios:**
- [ ] New hire with valid background check → Allow assignments
- [ ] Caregiver with background check expiring in 20 days → Show warning
- [ ] Caregiver with expired background check → Block assignments
- [ ] Caregiver with pending background check → Block assignments
- [ ] Caregiver with issues on background check → Permanent block

**Edge Cases:**
- Out-of-state transfers: [How to handle]
- Name changes: [Verification process]
- Reciprocity agreements: [Other states honored]

**Related Requirements:**
- [Link to other related credential requirements]

---

### 1.2 Professional Licensure

**Statutory Authority:**
- [State Code §X.XXX]
- [Board of Nursing/Medicine rules]

**Requirement:**
[Describe licensure requirements by role]

**Applicable Roles:**
- RN (Registered Nurse)
- LPN/LVN (Licensed Practical/Vocational Nurse)
- HHA (Home Health Aide)
- PCA (Personal Care Attendant)
- CNA (Certified Nursing Assistant)

**Verification:**
- Registry URL: [URL to state licensure database]
- Frequency: [At hire + periodic verification]
- Grace period for renewal: [If any]

**Implementation:**
```typescript
// Database fields
- license_number: string
- license_type: enum (RN, LPN, CNA, HHA, PCA)
- license_state: state_code
- license_issue_date: timestamp
- license_expiration_date: timestamp
- license_status: enum (ACTIVE, INACTIVE, SUSPENDED, REVOKED)
- license_verification_date: timestamp

// Validation rules
- Must have active license for role
- Cannot assign RN-only tasks to LPN
- Cannot assign if license expired
- Cannot work across state lines without reciprocity
```

**Test Scenarios:**
- [ ] RN with active license assigned to skilled nursing task → Allow
- [ ] LPN assigned to RN-only task (IV therapy) → Block
- [ ] Caregiver with expired license → Block all assignments
- [ ] Out-of-state license without reciprocity → Block in this state

---

### 1.3 Registry Checks (State-Specific)

**Statutory Authority:**
- [State registry statute]
- [Administrative rules]

**Requirement:**
[Describe state registry requirements - e.g., Nurse Aide Registry, Employee Misconduct Registry]

**Registry Types:**
- [Registry Name 1]: [Purpose and who must check]
- [Registry Name 2]: [Purpose and who must check]

**Implementation:**
```typescript
// Database fields per registry
- [registry_name]_check_date: timestamp
- [registry_name]_status: enum (CLEAR, LISTED, PENDING)
- [registry_name]_documentation: file_reference

// Validation
- Block if status = 'LISTED'
- Block if check > X days old
```

**Test Scenarios:**
- [ ] Caregiver clear on all registries → Allow
- [ ] Caregiver listed on abuse registry → Permanent block
- [ ] Registry check older than requirement → Block until re-verified

---

## 2. Client Authorization

### 2.1 Service Authorization

**Statutory Authority:**
- [Medicaid rules]
- [State plan requirements]

**Requirement:**
[Describe authorization requirements]

**Authorization Types:**
- Prior authorization for: [Service types]
- Concurrent review for: [Service types]
- Retrospective review for: [Service types]

**Implementation:**
```typescript
// Database fields
- authorization_number: string
- authorized_units: number
- units_used: number
- authorization_start_date: timestamp
- authorization_end_date: timestamp
- authorized_services: array<service_code>
- payor: string
- authorization_status: enum (ACTIVE, PENDING, DENIED, EXPIRED)

// Validation
- Cannot schedule visit if authorization expired
- Cannot exceed authorized units
- Cannot provide non-authorized services
- Alert when 90% of units consumed
```

**Test Scenarios:**
- [ ] Schedule visit within authorization → Allow
- [ ] Schedule visit exceeding authorized units → Block
- [ ] Schedule visit with expired authorization → Block
- [ ] Schedule non-authorized service → Block
- [ ] Authorization at 95% units → Show warning

---

### 2.2 Plan of Care

**Statutory Authority:**
- [State regulations]
- [Medicare Conditions of Participation if applicable]

**Requirement:**
[Describe plan of care requirements]

**Frequency:**
- Initial: [When required]
- Review: [Every X days]
- Updates: [When changes needed]

**Physician Orders:**
- Required for: [Service types]
- Renewal frequency: [X days]
- Signature requirements: [Electronic/wet signature]

**Implementation:**
```typescript
// Database fields
- plan_of_care_date: timestamp
- plan_of_care_review_date: timestamp
- physician_signature_date: timestamp
- orders_expiration_date: timestamp

// Validation
- Cannot provide service without current plan of care
- Alert if review due within 7 days
- Block if orders expired
```

---

## 3. Visit Documentation

### 3.1 Required Documentation

**Statutory Authority:**
- [State documentation rules]

**Requirement:**
[What must be documented for each visit]

**Required Elements:**
- [ ] Services provided (specific tasks)
- [ ] Client condition/response
- [ ] Vital signs (if applicable)
- [ ] Medications administered (if applicable)
- [ ] Caregiver observations
- [ ] Incidents/accidents
- [ ] Refusals or missed tasks
- [ ] Signatures (caregiver and client/representative)

**Timeliness:**
- Documentation must be completed within: [X hours/days]
- Late documentation requires: [Supervisor approval/explanation]

**Implementation:**
```typescript
// Validation
- Visit cannot be marked complete without required fields
- Alert if documentation > 24 hours after visit end
- Require supervisor approval for late documentation
```

---

### 3.2 Visit Notes Quality Standards

**Statutory Authority:**
- [State survey standards]
- [Medicare CoP if applicable]

**Requirement:**
[Quality standards for visit notes]

**Standards:**
- Objective observations (not subjective opinions)
- Specific tasks performed (not vague descriptions)
- Client response documented
- Problems/concerns escalated appropriately
- Professional terminology

**Implementation:**
```typescript
// Validation
- Minimum character length for notes
- Blocked phrases ("Client fine", "No issues")
- Required fields for specific service types
- Spell check and grammar suggestions
```

---

## 4. Electronic Visit Verification (EVV)

### 4.1 EVV Mandate

**Statutory Authority:**
- 21st Century Cures Act §12006(a)
- [State EVV implementation plan]
- [State Medicaid rules]

**Requirement:**
All personal care and home health aide services require EVV.

**Six Required Data Elements:**
1. Type of service performed
2. Individual receiving the service
3. Individual providing the service
4. Date of service
5. Location of service delivery
6. Time service begins and ends

**Implementation:**
```typescript
// Already implemented in time-tracking-evv vertical
// Reference: verticals/time-tracking-evv/src/types/evv.ts
```

---

### 4.2 EVV Aggregator

**Aggregator**: [Aggregator name - e.g., Sandata, HHAeXchange, Tellus]  
**Mandate**: [State-mandated vs. open choice]  
**API Endpoint**: [Endpoint URL]

**Submission Requirements:**
- Real-time submission: [Required/Optional]
- Batch submission window: [X hours]
- Retry policy: [Requirements]

**Implementation:**
```typescript
// Reference state-specific config
// verticals/time-tracking-evv/src/config/state-evv-configs.ts

// State: [XX]
aggregatorType: '[AGGREGATOR]',
aggregatorEndpoint: '[URL]',
```

---

### 4.3 Geofence Requirements

**Statutory Authority:**
- [State EVV policy]

**Requirements:**
- Base geofence radius: [X meters]
- GPS accuracy tolerance: [X meters]
- Total allowable variance: [Base + tolerance]

**Exceptions:**
- Rural areas: [Special handling if any]
- Multi-story buildings: [Vertical tolerance]
- Community outings: [Mobile service handling]

**Implementation:**
```typescript
// State config
geofenceRadiusMeters: [X],
geofenceToleranceMeters: [X],

// Total = base + tolerance
```

---

### 4.4 Grace Periods

**Statutory Authority:**
- [State wage & hour rules]
- [EVV policy]

**Requirements:**
- Clock-in early: [X minutes]
- Clock-in late: [X minutes]
- Clock-out early: [X minutes]
- Clock-out late: [X minutes]

**Rationale:**
[Explain why grace periods exist - GPS accuracy, traffic, etc.]

**Implementation:**
```typescript
gracePeriodMinutes: [X],
```

---

### 4.5 Manual Overrides and Corrections

**Statutory Authority:**
- [State EVV policy]
- [Audit requirements]

**Requirement:**
[When manual overrides allowed and what documentation required]

**Approval Authority:**
- Must be approved by: [Role level]
- Documentation required: [Explanation, supporting evidence]
- Retention: [How long override records kept]

**Implementation:**
```typescript
// Reference VMUR system for Texas
// Adapt for state-specific requirements

// Override tracking
- override_reason: string (required)
- override_approved_by: user_id
- override_approval_date: timestamp
- override_documentation: file_reference
```

**Common Override Reasons:**
- GPS malfunction
- Signal loss (rural, basement)
- Device battery died
- Client emergency (left location)
- Weather emergency

---

## 5. Data Retention

**Statutory Authority:**
- [State record retention rules]
- [HIPAA minimum 6 years]

**Requirements:**
- Visit records: [X years]
- Personnel records: [X years]
- Financial records: [X years]
- Authorization records: [X years]
- EVV records: [X years]

**Implementation:**
```typescript
retentionYears: [X],

// Retention policy enforcement
- Soft delete with retention period
- Archive to cold storage after X years
- Permanent deletion only after retention expires
- Audit trail of deletions
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
- Breach notification procedures

**Implementation:**
```typescript
// Reference packages/core/src/permissions/
// Field-level permission checks
// Audit trail in packages/core/src/audit/
```

---

### 6.2 State-Specific Privacy Laws

**Statutory Authority:**
- [State privacy statute if any beyond HIPAA]

**Additional Requirements:**
[Any state requirements stricter than HIPAA]

**Implementation:**
[State-specific privacy controls]

---

## 7. Reporting Requirements

### 7.1 Incident Reporting

**Statutory Authority:**
- [State reporting rules]

**Reportable Events:**
- [ ] Client injury
- [ ] Client death
- [ ] Abuse/neglect allegations
- [ ] Medication errors
- [ ] Missing client
- [ ] Rights violations

**Reporting Timeline:**
- Immediate (within X hours): [Event types]
- Within 24 hours: [Event types]
- Within 5 days: [Event types]

**Who to Report To:**
- [State agency name and contact]
- [Other entities]

---

### 7.2 Quality Metrics Reporting

**Statutory Authority:**
- [State quality measurement program]

**Required Metrics:**
- [Metric 1]
- [Metric 2]

**Submission:**
- Frequency: [Quarterly, annually, etc.]
- Portal: [URL]
- Format: [CSV, XML, etc.]

---

## 8. State-Specific Programs

### 8.1 Medicaid Programs

**Program Names:**
- [Program 1]: [Description]
- [Program 2]: [Description]

**Eligibility:**
- [Requirements for each program]

**Service Coverage:**
- [What services covered under each program]

---

### 8.2 Waiver Programs

**HCBS Waivers:**
- [Waiver name 1]: [Target population]
- [Waiver name 2]: [Target population]

**Special Requirements:**
- [Waiver-specific requirements]

---

## 9. Enforcement & Penalties

**Regulatory Authority:**
- [State licensing agency]
- [Survey/inspection entity]

**Common Violations:**
- [Violation 1]: [Penalty range]
- [Violation 2]: [Penalty range]

**License Actions:**
- Warning
- Provisional license
- Suspension
- Revocation

---

## 10. Resources

### Official Sources

- State Medicaid Agency: [URL]
- Licensing Board: [URL]
- EVV Information: [URL]
- Registry Searches: [URL]

### Regulations

- [Statute/Code name]: [URL]
- [Administrative rules]: [URL]

### Contacts

- State Medicaid: [Phone/Email]
- Licensing: [Phone/Email]
- EVV Support: [Phone/Email]

---

## Change Log

### [YYYY-MM-DD] - [Version]
- Initial documentation
- [Other changes]

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
