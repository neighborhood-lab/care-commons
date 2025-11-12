# Task 0006: Build Clinical Documentation Foundation

## Status
- [x] To Do
- [ ] In Progress
- [ ] Completed

## Priority
High

## Description
Create database schema and API foundation for clinical documentation (visit notes, vital signs, wound assessments, OASIS assessments). Required for Medicare/Medicaid certification and unlocks skilled nursing market.

## Acceptance Criteria
- [ ] Database tables for visit notes, vital signs, wound care, OASIS assessments
- [ ] CRUD APIs for clinical documentation
- [ ] Permission-based access (nurses only for skilled nursing documentation)
- [ ] Audit trail for all clinical record changes
- [ ] Support for templates and structured data entry
- [ ] HIPAA-compliant field-level encryption for sensitive data

## Technical Notes
**Database Schema**:
- `visit_notes` (free-text + structured fields)
- `vital_signs` (BP, HR, RR, temp, O2 sat, pain level)
- `wound_assessments` (location, size, stage, drainage, treatment)
- `oasis_assessments` (Medicare home health outcomes)

**Regulatory Requirements**:
- Medicare requires OASIS assessments at admission, resumption of care, discharge
- State regulations vary on documentation retention (typically 5-7 years)
- Signed and dated by licensed clinical staff (RN, LVN, PT, OT, ST)

## Related Tasks
- Blocks: Skilled nursing workflows
- Blocks: Medicare billing integration

## Completion Checklist
- [ ] Database migrations for clinical tables
- [ ] TypeScript types and Zod schemas
- [ ] Repository layer (clinical-repository.ts)
- [ ] Service layer (clinical-service.ts)
- [ ] API handlers (clinical-handlers.ts)
- [ ] Permission checks (nurses only)
- [ ] Audit logging
- [ ] Unit tests >80% coverage
- [ ] API integration tests
- [ ] PR created, checks passing
- [ ] PR merged to develop

## Notes
This unlocks a major market segment (skilled nursing agencies). High business impact.
