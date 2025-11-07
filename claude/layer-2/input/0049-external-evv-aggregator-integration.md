# Task 0049: External EVV Aggregator Integration (Sandata, HHAeXchange)

**Priority**: 🟡 MEDIUM
**Phase**: Phase 2 - Feature Completeness
**Estimated Effort**: 16-20 hours

## Context

Many states require EVV data submission to external aggregators. Implement integrations with major EVV aggregators for automated submission.

## Task

1. **Research aggregator APIs**:
   - Sandata API
   - HHAeXchange API
   - Other state-specific aggregators

2. **Implement submission service**:
   - Format EVV data per aggregator spec
   - Submit visits automatically
   - Handle submission responses
   - Retry failed submissions
   - Track submission status

3. **Error handling**:
   - Parse aggregator error messages
   - Surface errors to coordinators
   - Allow manual resubmission
   - Log all submissions

4. **Configuration**:
   - Per-organization aggregator config
   - API credentials management
   - State-to-aggregator mapping
   - Submission schedule

## Acceptance Criteria

- [ ] Sandata integration working
- [ ] HHAeXchange integration working
- [ ] Automatic submission functional
- [ ] Error handling robust
- [ ] Manual resubmission available
- [ ] Submission tracking UI

## Priority Justification

**MEDIUM** - required for some states but not all initial target markets.

---

**Next Task**: 0050 - Advanced Scheduling with ML-Based Matching
