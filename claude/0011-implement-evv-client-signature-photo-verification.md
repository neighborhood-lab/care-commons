# Task 0011: Implement EVV Client Signature & Photo Verification

## Status
- [ ] To Do
- [x] In Progress
- [ ] Completed

## Priority
High

## Description
The EVV data structures (`EVVRecord`, `Attestation`, `LocationVerification`) already support client signatures and photo verification, but the validation logic in `evv-validator.ts` is commented out with TODOs. Some MCO (Managed Care Organization) contracts require client signatures and/or photo verification for EVV compliance. Activate and test this validation logic.

## Acceptance Criteria
- [x] Analyze existing data structures (already complete)
- [ ] Uncomment and activate client signature validation (line 698)
- [ ] Uncomment and activate photo verification validation (line 715)
- [ ] Add unit tests for signature validation
- [ ] Add unit tests for photo verification validation
- [ ] Test with MCO configurations requiring signatures
- [ ] Test with MCO configurations requiring photo verification
- [ ] All CI checks passing (lint, typecheck, test, build)

## Technical Notes

**Files to Update**:
- `verticals/time-tracking-evv/src/validation/evv-validator.ts` (lines 698, 715)
- `verticals/time-tracking-evv/src/__tests__/evv-validator.test.ts` (add tests)

**Existing Data Structures** (already complete):
- `EVVRecord.clientAttestation?: Attestation` - Client signature on EVV record
- `Attestation.signatureData?: string` - Base64 encoded signature image
- `Attestation.signatureHash?: string` - Integrity hash of signature
- `LocationVerification.photoUrl?: string` - Photo at clock-in/out
- `LocationVerification.photoHash?: string` - Photo integrity hash
- `ClockOutInput.clientSignature?: AttestationInput` - Client signature input

**MCO Requirements**:
Some Managed Care Organizations (MCOs) require:
1. **Client signature** - Client must sign to acknowledge service delivery
2. **Photo verification** - Photo of caregiver at service location

**State Variations**:
- Texas: Some MCOs require photo verification
- Florida: Some MCOs require client signature
- Other states: Varies by payor contract

## Related Tasks
- Depends on: #0004 (State-Specific EVV Validation) - provides MCO config
- Improves: EVV compliance with MCO contracts
- Blocks: Full MCO contract compliance

## Completion Checklist
- [x] Analyze existing data structures
- [ ] Uncomment client signature validation
- [ ] Uncomment photo verification validation
- [ ] Add unit tests for signature validation
- [ ] Add unit tests for photo verification validation
- [ ] Run full CI checks (`./scripts/check.sh`)
- [ ] Manual testing with demo MCO configurations
- [ ] PR created, checks passing
- [ ] PR merged to develop

## Domain Context

### Regulatory Background
**MCO (Managed Care Organization) Contracts**:
- MCOs are insurance plans that contract with state Medicaid programs
- Each MCO can have additional requirements beyond state minimums
- Common MCO add-ons:
  - Client signature acknowledgment (proof client received service)
  - Photo verification (proof caregiver was on-site)
  - Biometric verification (fingerprint/face recognition)

**Examples**:
- **Texas**: Amerigroup, Superior HealthPlan may require photo verification
- **Florida**: Humana, Sunshine Health may require client signatures
- **California**: L.A. Care, Health Net may require both

### Business Impact
Failure to collect required signatures/photos:
- **Claim denial** - MCO rejects billing claim
- **Audit failure** - Non-compliance flagged during audit
- **Revenue loss** - Cannot bill for services
- **Contract risk** - May lose MCO contract

This feature ensures agencies can meet all MCO requirements and avoid claim denials.

## Implementation Notes

### Validation Logic
The validation checks:
1. **MCO requires client signature** - Check if `EVVRecord.clientAttestation` exists
2. **MCO requires photo verification** - Check if `LocationVerification.photoUrl` exists
3. **If missing** - Add high-severity issue, flag for supervisor review

### Error Handling
- **Severity**: HIGH (blocks claim submission)
- **Override**: Cannot be overridden (contractual requirement)
- **Supervisor review**: Required to resolve
- **Resolution**: Caregiver must return to collect signature/photo, or claim cannot be submitted

### Testing Strategy
- Mock MCO configurations with various requirements
- Test cases:
  - MCO requires signature + signature present = pass
  - MCO requires signature + signature missing = fail
  - MCO requires photo + photo present = pass
  - MCO requires photo + photo missing = fail
  - MCO requires both + both present = pass
  - MCO requires both + one missing = fail
  - MCO requires neither = pass regardless

