# Task 0010: Implement HHAeXchange EVV Aggregator Integration

## Status
- [ ] To Do
- [ ] In Progress
- [ ] Completed

## Priority
High

## Description
Replace the placeholder implementation in Texas EVV Provider with actual HHAeXchange API integration. This is required for Texas HHSC compliance - all EVV data must be submitted to the state-mandated aggregator within required timeframes.

## Acceptance Criteria
- [ ] HHAeXchange API client implemented with proper authentication
- [ ] Visit clock-in/out data submitted to aggregator in real-time
- [ ] Retry logic for failed submissions (with exponential backoff)
- [ ] Audit trail for all aggregator submissions
- [ ] Error handling for aggregator downtime (queue for later submission)
- [ ] VMUR (Visit Maintenance Unlock Request) submission for corrections
- [ ] Unit tests with mocked API responses
- [ ] Integration tests with HHAeXchange sandbox environment

## Technical Notes
**HHAeXchange API**:
- REST API with OAuth2 authentication
- Requires agency credentials (CLIENT_ID, CLIENT_SECRET)
- Sandbox URL: https://sandbox.hhaexchange.com/api/v1
- Production URL: https://api.hhaexchange.com/api/v1

**EVV Data Requirements (Texas 26 TAC §558.503)**:
1. Service type code
2. Member ID (client Medicaid number)
3. Provider ID (agency NPI)
4. Caregiver ID (employee/contractor ID)
5. Service start date/time (clock-in)
6. Service end date/time (clock-out)
7. GPS coordinates (latitude/longitude)
8. Service location address

**Implementation Location**:
- File: `verticals/time-tracking-evv/src/providers/texas-evv-provider.ts`
- Method: `submitVisitToAggregator()` (currently has TODO placeholder)

**Architecture**:
- Use Axios for HTTP client
- Store aggregator credentials in environment variables (HHAEXCHANGE_CLIENT_ID, HHAEXCHANGE_CLIENT_SECRET)
- Queue failed submissions in database (`evv_aggregator_queue` table)
- Background job processes queued submissions every 5 minutes

**Security Considerations**:
- Never log credentials or PHI
- Use HTTPS only (enforce in client config)
- Validate aggregator responses (prevent injection attacks)
- Rate limiting (max 100 requests/minute per aggregator docs)

## Related Tasks
- Depends on: #0004 (EVV validation - provides data structure)
- Blocks: Texas production deployment
- Related to: #0005 (Notification service for submission failures)

## Completion Checklist
- [ ] Environment variables added to `.env.example`
- [ ] HHAeXchange API client class implemented
- [ ] OAuth2 token management (fetch, refresh, cache)
- [ ] EVV data mapping (internal format → HHAeXchange format)
- [ ] Submit visit API endpoint integration
- [ ] Submit correction (VMUR) API endpoint integration
- [ ] Retry logic with exponential backoff
- [ ] Database queue for failed submissions
- [ ] Background job for queue processing
- [ ] Unit tests (mocked API)
- [ ] Integration tests (sandbox environment)
- [ ] Error logging and monitoring hooks (Sentry integration)
- [ ] Documentation: Setup guide for HHAeXchange credentials
- [ ] PR created, checks passing
- [ ] PR merged to develop
- [ ] Post-merge checks passing

## Notes
This is critical for Texas agencies - without aggregator submission, they cannot bill Medicaid for services. Failure to submit EVV data within 72 hours can result in payment denials.

Reference: Texas HHSC EVV Requirements https://www.hhs.texas.gov/providers/long-term-care-providers/electronic-visit-verification-evv
