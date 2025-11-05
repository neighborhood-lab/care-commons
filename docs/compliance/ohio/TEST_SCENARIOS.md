# Ohio Compliance Test Scenarios

**State Code**: OH  
**Last Updated**: 2025-11-05  
**Total Scenarios**: 65

---

## Overview

This document defines comprehensive test scenarios for Ohio compliance validation. Every scenario must have a corresponding automated test in `packages/core/src/compliance/ohio/__tests__/validator.test.ts`.

**Test Coverage Goals:**
- ✅ 100% of BLOCKING validations
- ✅ 100% of WARNING validations
- ✅ 80%+ of edge cases
- ✅ All state-specific regulations
- ✅ Performance < 100ms per validation

---

## 1. Background Screening Tests (FBI+BCI)

### Scenario 1.1: Valid FBI+BCI Check
**Given**: Caregiver has FBI+BCI check completed 2 years ago, status = CLEAR  
**When**: Validating assignment to visit  
**Then**: ✅ Allow assignment, no issues

### Scenario 1.2: No Background Check on File
**Given**: Caregiver has no background check record  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_FBI_BCI_MISSING` (BLOCKING)  
**Regulation**: Ohio Revised Code §5164.34

### Scenario 1.3: Background Check Pending
**Given**: Caregiver has FBI+BCI submitted, status = PENDING  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_BACKGROUND_PENDING` (BLOCKING)

### Scenario 1.4: Background Check with Issues
**Given**: Caregiver has FBI+BCI completed, status = ISSUES (disqualifying offense found)  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment (permanent)  
**Issue**: `OH_BACKGROUND_ISSUES` (BLOCKING, requires compliance review)  
**Override**: Cannot be overridden

### Scenario 1.5: Background Check Expired (>5 Years)
**Given**: Caregiver has FBI+BCI check from 5.5 years ago  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_BACKGROUND_EXPIRED` (BLOCKING)  
**Regulation**: 5-year renewal requirement

### Scenario 1.6: Background Check Expiring Soon (45 Days)
**Given**: Caregiver has FBI+BCI check from 4.8 years ago (expires in 73 days, but warn at 60 days)  
**When**: Validating assignment to visit  
**Then**: ⚠️ Allow assignment with warning  
**Issue**: `OH_BACKGROUND_EXPIRING_SOON` (WARNING)  
**Remediation**: "Schedule background screening renewal"

### Scenario 1.7: Wrong Background Check Type (Name-Based)
**Given**: Caregiver has name-based background check (not FBI+BCI fingerprint)  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_WRONG_BACKGROUND_TYPE` (BLOCKING)  
**Message**: "Ohio requires FBI+BCI fingerprint background check, not name-based check"

### Scenario 1.8: Break in Service (>90 Days)
**Given**: Caregiver has valid FBI+BCI check but 100-day break in service  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_RECHECK_REQUIRED_BREAK_IN_SERVICE` (BLOCKING)  
**Regulation**: Re-verification required after 90-day break

---

## 2. STNA Registry Tests (Nurse Aide)

### Scenario 2.1: CNA with Active STNA
**Given**: Caregiver is CNA, ohio_stna_number present, status = ACTIVE, certification not expired  
**When**: Validating assignment to visit  
**Then**: ✅ Allow assignment

### Scenario 2.2: CNA Missing STNA Number
**Given**: Caregiver is CNA, no ohio_stna_number on file  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_STNA_NUMBER_MISSING` (BLOCKING)  
**Remediation**: "Verify STNA registration at https://odh.ohio.gov/..."

### Scenario 2.3: STNA Status Inactive
**Given**: Caregiver is CNA, ohio_stna_status = INACTIVE  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_STNA_INACTIVE` (BLOCKING)

### Scenario 2.4: STNA Status Suspended
**Given**: Caregiver is CNA, ohio_stna_status = SUSPENDED  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment (permanent)  
**Issue**: `OH_STNA_INACTIVE` (BLOCKING, requires compliance review)  
**Override**: Cannot be overridden  
**Message**: "STNA suspended/revoked - permanent disqualification"

### Scenario 2.5: STNA Status Revoked
**Given**: Caregiver is CNA, ohio_stna_status = REVOKED  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment (permanent)  
**Issue**: `OH_STNA_INACTIVE` (BLOCKING, requires compliance review)  
**Override**: Cannot be overridden

### Scenario 2.6: STNA Certification Expired
**Given**: Caregiver is CNA, ohio_stna_certification_exp = 30 days ago (expired)  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_STNA_CERTIFICATION_EXPIRED` (BLOCKING)  
**Regulation**: STNA must renew every 2 years with 12 hours CE

### Scenario 2.7: STNA Certification Expiring Soon (40 Days)
**Given**: Caregiver is CNA, ohio_stna_certification_exp = 40 days from now  
**When**: Validating assignment to visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_STNA_CERTIFICATION_EXPIRING_SOON` (WARNING)

### Scenario 2.8: STNA Verification Date Over 1 Year Old
**Given**: Caregiver is CNA, ohio_stna_verification_date = 400 days ago  
**When**: Validating assignment to visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_STNA_VERIFICATION_OVERDUE` (WARNING)  
**Recommendation**: Re-verify STNA status annually

### Scenario 2.9: HHA (Not CNA) Without STNA
**Given**: Caregiver is HHA (not CNA), no ohio_stna_number  
**When**: Validating assignment to visit  
**Then**: ✅ Allow assignment (STNA not required for HHA)

### Scenario 2.10: CNA with Out-of-State Registry (PA)
**Given**: Caregiver is CNA, has PA nurse aide registry, no Ohio STNA  
**When**: Validating assignment to visit in Ohio  
**Then**: ❌ Block assignment  
**Issue**: `OH_STNA_NUMBER_MISSING` (BLOCKING)  
**Message**: Must be on Ohio registry (reciprocity requires Ohio registration)

---

## 3. HHA Training Tests

### Scenario 3.1: HHA with Valid Training and Competency
**Given**: Caregiver is HHA, ohio_hha_training_completion present, ohio_hha_competency_status = PASSED  
**When**: Validating assignment to visit  
**Then**: ✅ Allow assignment

### Scenario 3.2: HHA Missing Training Certificate
**Given**: Caregiver is HHA, no ohio_hha_training_completion  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_HHA_TRAINING_MISSING` (BLOCKING)  
**Regulation**: Must complete 75-hour state-approved training

### Scenario 3.3: HHA Competency Evaluation Failed
**Given**: Caregiver is HHA, ohio_hha_competency_status = FAILED  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_HHA_COMPETENCY_NOT_PASSED` (BLOCKING)

### Scenario 3.4: HHA Competency Evaluation Pending
**Given**: Caregiver is HHA, ohio_hha_competency_status = PENDING  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_HHA_COMPETENCY_NOT_PASSED` (BLOCKING)

### Scenario 3.5: HHA Annual Competency Check Overdue
**Given**: Caregiver is HHA, ohio_last_competency_check = 380 days ago  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_HHA_ANNUAL_COMPETENCY_OVERDUE` (BLOCKING)  
**Regulation**: RN must conduct annual skills check-off

### Scenario 3.6: HHA Annual Competency Check Due Soon (340 Days)
**Given**: Caregiver is HHA, ohio_last_competency_check = 340 days ago  
**When**: Validating assignment to visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_HHA_ANNUAL_COMPETENCY_DUE_SOON` (WARNING)

### Scenario 3.7: HHA Annual In-Service Training Incomplete (8 Hours)
**Given**: Caregiver is HHA, ohio_annual_inservice_hours = 8 (needs 12)  
**When**: Validating assignment to visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_HHA_INSERVICE_HOURS_LOW` (WARNING)  
**Message**: "HHA has 8 hours in-service training this year, needs 12"

### Scenario 3.8: CNA Without HHA Training (CNA Training Sufficient)
**Given**: Caregiver is CNA, no ohio_hha_training_completion  
**When**: Validating assignment to HHA visit  
**Then**: ✅ Allow assignment (CNA training exceeds HHA requirements)

---

## 4. RN Supervision Tests

### Scenario 4.1: New Client, RN Visit 10 Days Ago
**Given**: Client service start = 30 days ago, ohio_last_rn_supervision_visit = 10 days ago  
**When**: Validating assignment to visit  
**Then**: ✅ Allow assignment (within 14-day requirement for new clients)

### Scenario 4.2: New Client, RN Visit 20 Days Ago (Overdue)
**Given**: Client service start = 30 days ago, ohio_last_rn_supervision_visit = 20 days ago  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_RN_SUPERVISION_14DAY_OVERDUE` (BLOCKING)  
**Message**: "RN supervision visit overdue by 6 days. New clients require RN visit every 14 days for first 60 days."

### Scenario 4.3: Established Client, RN Visit 50 Days Ago
**Given**: Client service start = 100 days ago, ohio_last_rn_supervision_visit = 50 days ago  
**When**: Validating assignment to visit  
**Then**: ✅ Allow assignment (within 60-day requirement for established clients)

### Scenario 4.4: Established Client, RN Visit 70 Days Ago (Overdue)
**Given**: Client service start = 100 days ago, ohio_last_rn_supervision_visit = 70 days ago  
**When**: Validating assignment to visit  
**Then**: ❌ Block assignment  
**Issue**: `OH_RN_SUPERVISION_60DAY_OVERDUE` (BLOCKING)  
**Message**: "RN supervision visit overdue by 10 days. Established clients require RN visit every 60 days."

### Scenario 4.5: New Client, No RN Visit Yet
**Given**: Client service start = 5 days ago, ohio_last_rn_supervision_visit = NULL  
**When**: Validating assignment to visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_RN_SUPERVISION_NOT_ESTABLISHED` (WARNING)  
**Message**: "RN supervision visit not yet documented for this client"

### Scenario 4.6: RN Visit Due in 3 Days
**Given**: Client has ohio_next_rn_supervision_due = 3 days from now  
**When**: Validating assignment to visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_RN_SUPERVISION_DUE_SOON` (WARNING)

---

## 5. Authorization Tests

### Scenario 5.1: Valid Authorization with Units Remaining
**Given**: Client has active authorization, 50 units authorized, 20 consumed, 30 remaining  
**When**: Scheduling 4-hour visit (4 units)  
**Then**: ✅ Allow scheduling

### Scenario 5.2: Authorization Expired
**Given**: Client authorization end_date = 10 days ago  
**When**: Scheduling visit  
**Then**: ❌ Block scheduling  
**Issue**: `OH_AUTHORIZATION_EXPIRED` (BLOCKING)

### Scenario 5.3: Authorization Not Yet Active (Future Start Date)
**Given**: Client authorization start_date = 5 days from now  
**When**: Scheduling visit for tomorrow  
**Then**: ❌ Block scheduling  
**Issue**: `OH_AUTHORIZATION_NOT_ACTIVE` (BLOCKING)

### Scenario 5.4: Units Nearing Limit (95% Consumed)
**Given**: Client has 100 units authorized, 95 consumed, 5 remaining  
**When**: Scheduling visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_AUTHORIZATION_NEARING_LIMIT` (WARNING)  
**Message**: "Authorization 95% consumed"

### Scenario 5.5: Units Would Exceed Authorized
**Given**: Client has 100 units authorized, 98 consumed, 2 remaining  
**When**: Scheduling 4-hour visit (4 units)  
**Then**: ❌ Block scheduling  
**Issue**: `OH_AUTHORIZATION_EXCEEDED` (BLOCKING)  
**Message**: "Would exceed authorized units by 2"

### Scenario 5.6: Service Type Not Authorized
**Given**: Client authorization covers "Personal Care" only  
**When**: Scheduling "Skilled Nursing" visit  
**Then**: ❌ Block scheduling  
**Issue**: `OH_SERVICE_NOT_AUTHORIZED` (BLOCKING)

### Scenario 5.7: MyCare Ohio Authorization
**Given**: Client has MyCare Ohio MCO (dual-eligible), authorization through Aetna Better Health  
**When**: Scheduling visit  
**Then**: ✅ Allow (verify MCO-specific routing to Sandata)

---

## 6. Plan of Care Tests

### Scenario 6.1: Current Plan of Care (Reviewed 40 Days Ago)
**Given**: Client plan_of_care_last_review = 40 days ago, next_review_due = 20 days from now  
**When**: Scheduling visit  
**Then**: ✅ Allow scheduling

### Scenario 6.2: Plan of Care Review Overdue
**Given**: Client plan_of_care_next_review_due = 10 days ago (overdue)  
**When**: Scheduling visit  
**Then**: ❌ Block scheduling  
**Issue**: `OH_POC_REVIEW_OVERDUE` (BLOCKING)  
**Regulation**: Plan of care must be reviewed every 60 days

### Scenario 6.3: Plan of Care Review Due Soon (5 Days)
**Given**: Client plan_of_care_next_review_due = 5 days from now  
**When**: Scheduling visit  
**Then**: ⚠️ Allow with warning  
**Issue**: `OH_POC_REVIEW_DUE_SOON` (WARNING)

### Scenario 6.4: Physician Orders Expired
**Given**: Client plan_of_care has physician_orders_expiration = 15 days ago  
**When**: Scheduling visit  
**Then**: ❌ Block scheduling  
**Issue**: `OH_PHYSICIAN_ORDERS_EXPIRED` (BLOCKING)

### Scenario 6.5: Plan of Care Missing Physician Signature
**Given**: Client plan_of_care established but physician_signature_date = NULL  
**When**: Scheduling visit  
**Then**: ❌ Block scheduling  
**Issue**: `OH_POC_PHYSICIAN_SIGNATURE_MISSING` (BLOCKING)

---

## 7. Visit Documentation Tests

### Scenario 7.1: Complete Documentation Within 24 Hours
**Given**: Visit completed at 10:00 AM, documentation completed at 2:00 PM same day  
**When**: Validating documentation  
**Then**: ✅ Pass validation

### Scenario 7.2: Late Documentation (30 Hours)
**Given**: Visit completed at 10:00 AM yesterday, documentation completed at 4:00 PM today (30 hours)  
**When**: Validating documentation  
**Then**: ⚠️ Warning  
**Issue**: `OH_DOCUMENTATION_LATE` (WARNING)

### Scenario 7.3: Missing Required Field (Services Provided)
**Given**: Visit documentation missing services_provided field  
**When**: Validating documentation  
**Then**: ❌ Fail validation  
**Issue**: `OH_DOC_SERVICES_MISSING` (BLOCKING)

### Scenario 7.4: Vague Documentation ("Client doing well")
**Given**: Visit observations = "Client doing well, care provided as planned"  
**When**: Validating documentation  
**Then**: ⚠️ Warning  
**Issue**: `OH_VAGUE_DOCUMENTATION` (WARNING)  
**Message**: "Avoid vague phrases like 'doing well' - be more specific"

### Scenario 7.5: Documentation Too Short (25 Characters)
**Given**: Visit services_provided = "Assisted with shower" (25 characters, minimum is 50)  
**When**: Validating documentation  
**Then**: ⚠️ Warning  
**Issue**: `OH_NOTE_TOO_SHORT` (WARNING)

---

## 8. EVV Geofencing Tests

### Scenario 8.1: Clock-In Within Base Radius (80m)
**Given**: Client address coordinates (39.9612, -82.9988), clock-in at 80m distance  
**When**: Validating geofence  
**Then**: ✅ Pass (within 125m base radius)

### Scenario 8.2: Clock-In Within Tolerance (150m, Good GPS)
**Given**: Clock-in at 150m distance, GPS accuracy = 30m  
**When**: Validating geofence (allowance = 125 + 30 = 155m)  
**Then**: ✅ Pass (150m < 155m allowed)

### Scenario 8.3: Clock-In Within Tolerance (180m, Poor GPS)
**Given**: Clock-in at 180m distance, GPS accuracy = 70m  
**When**: Validating geofence (allowance = 125 + 70 = 195m)  
**Then**: ✅ Pass (180m < 195m allowed)

### Scenario 8.4: Clock-In Exceeds Total Tolerance (220m)
**Given**: Clock-in at 220m distance, GPS accuracy = 50m  
**When**: Validating geofence (allowance = 125 + 50 = 175m)  
**Then**: ❌ Fail  
**Issue**: `OH_GEOFENCE_VIOLATION` (BLOCKING)  
**Message**: "Clock-in location is 220m from client address. Ohio allows 175m. Verify caregiver is at correct location."

### Scenario 8.5: GPS Accuracy Over Max Tolerance (90m)
**Given**: Clock-in at 150m distance, GPS accuracy = 90m (exceeds 75m max tolerance)  
**When**: Validating geofence (allowance = 125 + 75 = 200m, cap tolerance at 75m)  
**Then**: ✅ Pass (150m < 200m allowed, but used capped tolerance)

---

## 9. Grace Period Tests

### Scenario 9.1: Clock-In 5 Minutes Early
**Given**: Scheduled start = 9:00 AM, clock-in = 8:55 AM  
**When**: Validating grace period (10 minutes allowed)  
**Then**: ✅ Pass

### Scenario 9.2: Clock-In 10 Minutes Early (Boundary)
**Given**: Scheduled start = 9:00 AM, clock-in = 8:50 AM  
**When**: Validating grace period  
**Then**: ✅ Pass (exactly at boundary)

### Scenario 9.3: Clock-In 15 Minutes Early (Exceeds)
**Given**: Scheduled start = 9:00 AM, clock-in = 8:45 AM  
**When**: Validating grace period  
**Then**: ❌ Fail  
**Issue**: `OH_CLOCK_IN_TOO_EARLY` (BLOCKING)  
**Message**: "Clock-in was 15 minutes early. Ohio allows 10-minute grace period."

### Scenario 9.4: Clock-In 8 Minutes Late
**Given**: Scheduled start = 9:00 AM, clock-in = 9:08 AM  
**When**: Validating grace period  
**Then**: ✅ Pass

### Scenario 9.5: Clock-In 12 Minutes Late (Exceeds)
**Given**: Scheduled start = 9:00 AM, clock-in = 9:12 AM  
**When**: Validating grace period  
**Then**: ❌ Fail (or warning depending on policy)  
**Issue**: `OH_CLOCK_IN_TOO_LATE` (WARNING)

---

## 10. Manual Override Tests

### Scenario 10.1: Valid Override with Reason
**Given**: Visit has geofence violation, supervisor submits override with reason "GPS malfunction, verified via phone call"  
**When**: Validating override request  
**Then**: ✅ Accept override

### Scenario 10.2: Override Requested After 7-Day Window
**Given**: Visit occurred 10 days ago, supervisor submits override today  
**When**: Validating override request  
**Then**: ❌ Reject override  
**Issue**: `OH_OVERRIDE_WINDOW_EXPIRED` (BLOCKING)  
**Message**: "EVV corrections must be submitted within 7 days of visit"

### Scenario 10.3: Override Without Adequate Reason (Too Short)
**Given**: Supervisor submits override with reason "GPS issue" (10 characters, minimum is 20)  
**When**: Validating override request  
**Then**: ❌ Reject override  
**Issue**: `OH_OVERRIDE_REASON_INSUFFICIENT` (BLOCKING)

### Scenario 10.4: Override by Non-Supervisor
**Given**: Non-supervisor staff attempts to approve override  
**When**: Validating override request  
**Then**: ❌ Reject override  
**Issue**: `OH_OVERRIDE_UNAUTHORIZED` (BLOCKING)  
**Message**: "Only RN supervisors and administrators can approve EVV overrides"

---

## 11. Edge Cases

### Scenario 11.1: Caregiver Name Change (Marriage)
**Given**: Caregiver background check under maiden name "Jane Smith", now "Jane Doe"  
**When**: Validating credentials  
**Then**: ⚠️ Warning  
**Issue**: `OH_NAME_MISMATCH` (WARNING)  
**Recommendation**: Re-verify under both names

### Scenario 11.2: Out-of-State Transfer (From Pennsylvania)
**Given**: Caregiver has valid PA background check (5 years), moving to Ohio  
**When**: Validating Ohio assignment  
**Then**: ❌ Block  
**Issue**: `OH_OUT_OF_STATE_CHECK_NOT_ACCEPTED` (BLOCKING)  
**Message**: "Ohio does not accept other states' background checks. Must complete Ohio FBI+BCI check."

### Scenario 11.3: Multi-State Work (Lives in WV, Works in OH)
**Given**: Caregiver lives in West Virginia, works in Ohio  
**When**: Validating credentials  
**Then**: ✅ Allow if has valid Ohio credentials (license, background check)

### Scenario 11.4: Daylight Saving Time Visit
**Given**: Visit scheduled during DST transition (clock "springs forward" 1 hour)  
**When**: Validating clock-in/out times  
**Then**: ✅ Handle timezone conversion correctly

### Scenario 11.5: Client Moved During Service Period
**Given**: Client authorization issued for Address A, client moved to Address B  
**When**: Validating geofence at Address B  
**Then**: ❌ Fail geofence (using old address coordinates)  
**Required**: Update client address, update authorization, notify MCO

---

## 12. Performance Tests

### Scenario 12.1: Single Caregiver Validation
**Given**: Standard caregiver with all credentials  
**When**: Running canAssignToVisit()  
**Then**: ✅ Complete in <100ms

### Scenario 12.2: Batch Validation (100 Caregivers)
**Given**: 100 caregivers, 100 visits  
**When**: Running batch validation  
**Then**: ✅ Complete in <5 seconds (50ms average per validation)

### Scenario 12.3: Concurrent Validations (10 Parallel)
**Given**: 10 simultaneous validation requests  
**When**: Running in parallel  
**Then**: ✅ No race conditions, all complete successfully

---

## Summary

**Total Scenarios**: 65  
**Blocking Issues**: 40  
**Warning Issues**: 18  
**Edge Cases**: 7  

**Coverage by Category:**
- Background Screening: 8 scenarios
- STNA Registry: 10 scenarios
- HHA Training: 8 scenarios
- RN Supervision: 6 scenarios
- Authorization: 7 scenarios
- Plan of Care: 5 scenarios
- Visit Documentation: 5 scenarios
- EVV Geofencing: 5 scenarios
- Grace Periods: 5 scenarios
- Manual Overrides: 4 scenarios
- Edge Cases: 5 scenarios
- Performance: 3 scenarios

**Next Steps:**
1. Implement all 65 scenarios as automated tests
2. Achieve 100% test pass rate
3. Measure and optimize performance (<100ms target)
4. Document any additional edge cases discovered during implementation

---

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
