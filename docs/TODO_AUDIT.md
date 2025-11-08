# TODO Audit - 2025-11-08

## Summary
- Total TODOs: 48 items across 21 files
- P0 (Critical): 3
- P1 (High): 7
- P2 (Medium): 7
- P3 (Future): 31

## Critical (P0) - Production Blockers

### verticals/time-tracking-evv/src/service/evv-aggregator-service.ts:361
- **TODO**: Implement actual HTTP POST to aggregator
- **Type**: integration
- **Impact**: EVV records not submitted to state - compliance failure
- **Task**: 0049-external-evv-aggregator-integration.md
- **Owner**: Backend
- **Deadline**: Production launch
- **Context**: Currently returning mock success response, no actual submission happening

### verticals/time-tracking-evv/src/aggregators/sandata-aggregator.ts:312
- **TODO**: Replace with actual HTTP client implementation
- **Type**: integration
- **Impact**: Sandata submissions failing - state compliance for Sandata aggregator
- **Task**: 0049-external-evv-aggregator-integration.md
- **Owner**: Backend
- **Deadline**: Production launch

### verticals/time-tracking-evv/src/aggregators/tellus-aggregator.ts:371
- **TODO**: Replace with actual HTTP client implementation
- **Type**: integration
- **Impact**: Tellus submissions failing - state compliance for Tellus aggregator
- **Task**: 0049-external-evv-aggregator-integration.md
- **Owner**: Backend
- **Deadline**: Production launch

## High Priority (P1)

### verticals/family-engagement/src/services/family-engagement-service.ts:183
- **TODO**: Trigger actual notification delivery (email, SMS, push)
- **Type**: integration
- **Impact**: Families receive zero notifications - critical feature completely non-functional
- **Task**: 0067-notification-delivery-system.md
- **Owner**: Backend
- **Estimate**: 1-2 weeks

### verticals/family-engagement/src/services/family-engagement-service.ts:335
- **TODO**: Get actual user name (currently returns userId)
- **Type**: integration
- **Impact**: UX degradation (shows "User 123" instead of "John Doe")
- **Task**: 0068-family-engagement-data-integration.md
- **Owner**: Backend
- **Estimate**: 2-3 days

### verticals/family-engagement/src/services/family-engagement-service.ts:357
- **TODO**: Get thread to validate access and get clientId, familyMemberId
- **Type**: security
- **Impact**: Missing access control validation - potential security issue
- **Task**: 0068-family-engagement-data-integration.md
- **Owner**: Backend
- **Estimate**: 2-3 days

### verticals/family-engagement/src/services/family-engagement-service.ts:364
- **TODO**: Get actual user name
- **Type**: integration
- **Impact**: UX degradation (shows userId instead of names)
- **Task**: 0068-family-engagement-data-integration.md
- **Owner**: Backend
- **Estimate**: 2-3 days

### verticals/family-engagement/src/services/family-engagement-service.ts:445
- **TODO**: Get upcoming visits from visit summary table
- **Type**: integration
- **Impact**: Family engagement notifications missing visit information
- **Task**: 0068-family-engagement-data-integration.md
- **Owner**: Backend
- **Estimate**: 2-3 days

### verticals/family-engagement/src/services/family-engagement-service.ts:455
- **TODO**: Fetch from client service
- **Type**: integration
- **Impact**: Missing client name in notifications
- **Task**: 0068-family-engagement-data-integration.md
- **Owner**: Backend
- **Estimate**: 2-3 days

### verticals/family-engagement/src/services/family-engagement-service.ts:462
- **TODO**: Fetch from care plan service
- **Type**: integration
- **Impact**: Missing care plan data in notifications
- **Task**: 0068-family-engagement-data-integration.md
- **Owner**: Backend
- **Estimate**: 2-3 days

## Medium Priority (P2)

### verticals/scheduling-visits/src/service/schedule-service.ts:564
- **TODO**: Filter holidays if skipHolidays is true
- **Type**: feature
- **Impact**: Minor - coordinators manually delete holiday visits
- **Task**: 0071-scheduling-holiday-filtering.md
- **Estimate**: 2-3 days

### verticals/analytics-reporting/src/service/report-service.ts:208
- **TODO**: Rewrite using raw SQL - see ARCHITECTURAL_ISSUES.md
- **Type**: optimization
- **Impact**: Slow queries (>10s) with large datasets
- **Task**: 0072-analytics-sql-performance-optimization.md
- **Estimate**: 3-5 days

### verticals/analytics-reporting/src/service/report-service.ts:282
- **TODO**: Rewrite using raw SQL - see ARCHITECTURAL_ISSUES.md
- **Type**: optimization
- **Impact**: Slow queries (>10s) with large datasets
- **Task**: 0072-analytics-sql-performance-optimization.md
- **Estimate**: 3-5 days

### verticals/quality-assurance-audits/src/services/audit-service.ts:600
- **TODO**: Calculate statistics
- **Type**: feature
- **Impact**: Audit statistics not available
- **Task**: Not yet tracked
- **Estimate**: 2-3 days

### verticals/time-tracking-evv/src/service/evv-aggregator-service.ts:309
- **TODO**: Retry the submission
- **Type**: feature
- **Impact**: No automatic retry on submission failures
- **Task**: Not yet tracked
- **Estimate**: 1-2 days

### verticals/time-tracking-evv/src/validation/evv-validator.ts:697
- **TODO**: Implement client signature validation once EVVRecord type is extended
- **Type**: feature
- **Impact**: Client signature validation not enforced
- **Task**: Not yet tracked
- **Estimate**: 2-3 days

### verticals/time-tracking-evv/src/validation/evv-validator.ts:714
- **TODO**: Implement photo verification validation once EVVRecord type is extended
- **Type**: feature
- **Impact**: Photo verification validation not enforced
- **Task**: Not yet tracked
- **Estimate**: 2-3 days

## Future Enhancements (P3)

### Mobile App - WatermelonDB Integration (Multiple TODOs)

#### packages/mobile/src/screens/visits/TodayVisitsScreen.tsx:41
- **TODO**: Load from WatermelonDB and sync with API
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure tasks 0055-0058
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitDetailScreen.tsx:40
- **TODO**: Load from WatermelonDB
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitHistoryScreen.tsx:68
- **TODO**: Load from WatermelonDB
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitCheckOutScreen.tsx:75
- **TODO**: Load from WatermelonDB
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitDocumentationScreen.tsx:100
- **TODO**: Load from WatermelonDB
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitDocumentationScreen.tsx:119
- **TODO**: Save to WatermelonDB
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitDocumentationScreen.tsx:173
- **TODO**: Save to WatermelonDB and queue for sync
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitCheckInScreen.tsx:63
- **TODO**: Load from WatermelonDB
- **Type**: integration
- **Impact**: Mobile offline functionality not implemented
- **Task**: Deferred - Mobile app infrastructure
- **Estimate**: Part of larger mobile effort

### Mobile App - Service Integration

#### packages/mobile/src/screens/visits/VisitCheckInScreen.tsx:106
- **TODO**: Integrate with actual location service
- **Type**: integration
- **Impact**: Location service using mock data
- **Task**: Deferred - Mobile location service
- **Estimate**: 2-3 days

#### packages/mobile/src/screens/visits/VisitCheckInScreen.tsx:160
- **TODO**: Integrate with actual biometric service
- **Type**: integration
- **Impact**: Biometric service using mock data
- **Task**: Deferred - Mobile biometric service
- **Estimate**: 2-3 days

#### packages/mobile/src/screens/visits/VisitCheckInScreen.tsx:221
- **TODO**: Queue check-in for sync
- **Type**: integration
- **Impact**: Mobile offline sync not implemented
- **Task**: Deferred - Mobile sync infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/VisitCheckOutScreen.tsx:135
- **TODO**: Integrate with actual location service
- **Type**: integration
- **Impact**: Location service using mock data
- **Task**: Deferred - Mobile location service
- **Estimate**: 2-3 days

#### packages/mobile/src/screens/visits/VisitCheckOutScreen.tsx:170
- **TODO**: Integrate with actual biometric service
- **Type**: integration
- **Impact**: Biometric service using mock data
- **Task**: Deferred - Mobile biometric service
- **Estimate**: 2-3 days

#### packages/mobile/src/screens/visits/VisitCheckOutScreen.tsx:260
- **TODO**: Queue check-out for sync
- **Type**: integration
- **Impact**: Mobile offline sync not implemented
- **Task**: Deferred - Mobile sync infrastructure
- **Estimate**: Part of larger mobile effort

#### packages/mobile/src/screens/visits/SignatureScreen.tsx:104
- **TODO**: Add queueSignature method to OfflineQueueService
- **Type**: integration
- **Impact**: Signature sync not implemented
- **Task**: Deferred - Mobile sync infrastructure
- **Estimate**: 2-3 days

#### packages/mobile/src/services/api-client.ts:244
- **TODO**: Integrate with offlineQueueService.enqueue()
- **Type**: integration
- **Impact**: API client offline queue not integrated
- **Task**: Deferred - Mobile sync infrastructure
- **Estimate**: 2-3 days

### Mobile App - Features & UX

#### packages/mobile/src/screens/visits/VisitDetailScreen.tsx:120
- **TODO**: Add phone number to visit data
- **Type**: feature
- **Impact**: Phone number not shown in visit details
- **Task**: Deferred - Nice-to-have feature
- **Estimate**: 1 day

#### packages/mobile/src/screens/visits/VisitHistoryScreen.tsx:260
- **TODO**: Implement export functionality
- **Type**: feature
- **Impact**: Cannot export visit history
- **Task**: Deferred - Nice-to-have feature
- **Estimate**: 2-3 days

#### packages/mobile/src/screens/visits/VisitDocumentationScreen.tsx:271
- **TODO**: Add voice-to-text button
- **Type**: feature
- **Impact**: Nice-to-have UX enhancement
- **Task**: Deferred - Future mobile enhancements
- **Estimate**: 2-3 days

#### packages/mobile/src/screens/visits/VisitDocumentationScreen.tsx:143
- **TODO**: Get from visit
- **Type**: integration
- **Impact**: Client name not pulled from visit data
- **Task**: Deferred - Data integration
- **Estimate**: 1 day

#### packages/mobile/src/screens/visits/VisitDocumentationScreen.tsx:145
- **TODO**: Handle signature capture callback
- **Type**: integration
- **Impact**: Signature capture not wired up
- **Task**: Deferred - Signature integration
- **Estimate**: 1-2 days

#### packages/mobile/src/features/visits/screens/VisitDetailScreen.tsx:78
- **TODO**: Ask caregiver
- **Type**: feature
- **Impact**: Client present checkbox not interactive
- **Task**: Deferred - UI enhancement
- **Estimate**: 1 day

#### packages/mobile/src/features/visits/screens/VisitDetailScreen.tsx:115
- **TODO**: Prompt caregiver for notes
- **Type**: feature
- **Impact**: Completion notes not prompted
- **Task**: Deferred - UI enhancement
- **Estimate**: 1-2 days

#### packages/mobile/src/features/visits/screens/VisitDetailScreen.tsx:116
- **TODO**: Get from task list
- **Type**: integration
- **Impact**: Tasks completed not pulled from task list
- **Task**: Deferred - Task integration
- **Estimate**: 1-2 days

#### packages/mobile/src/features/visits/screens/VisitDetailScreen.tsx:118
- **TODO**: Capture signature if required
- **Type**: feature
- **Impact**: Client signature capture not implemented
- **Task**: Deferred - Signature feature
- **Estimate**: 2-3 days

#### packages/mobile/src/features/visits/screens/VisitDetailScreen.tsx:196
- **TODO**: Show map with geofence circle
- **Type**: feature
- **Impact**: Map visualization not shown
- **Task**: Deferred - Nice-to-have feature
- **Estimate**: 3-5 days

### Mobile App - Device Info

#### packages/mobile/src/services/device-info.ts:182
- **TODO**: Check if biometric hardware available (requires expo-local-authentication)
- **Type**: integration
- **Impact**: Biometric availability not checked
- **Task**: Deferred - Mobile device capabilities
- **Estimate**: 1 day

#### packages/mobile/src/services/device-info.ts:186
- **TODO**: Check permissions (requires expo-location permissions check)
- **Type**: integration
- **Impact**: Background location permissions not checked
- **Task**: Deferred - Mobile device capabilities
- **Estimate**: 1 day

### Core Providers

#### packages/core/src/providers/caregiver.provider.ts:260
- **TODO**: Implement actual availability checking using startTime and endTime
- **Type**: feature
- **Impact**: Caregiver availability not properly validated
- **Task**: Not yet tracked
- **Estimate**: 2-3 days

#### packages/core/src/providers/caregiver.provider.ts:273
- **TODO**: In a full implementation, this would join with visits table
- **Type**: optimization
- **Impact**: Query optimization opportunity
- **Task**: Not yet tracked
- **Estimate**: 1-2 days

### Other

#### verticals/time-tracking-evv/src/providers/texas-evv-provider.ts:47
- **TODO**: Replace with actual HHAeXchange API call
- **Type**: integration
- **Impact**: Texas EVV provider using mock data
- **Task**: Not yet tracked
- **Estimate**: 1-2 weeks

## TODOs to Remove (Obsolete)

None identified yet - requires review with team to determine which TODOs are no longer relevant.

## Monthly Review Schedule

- **Next Review**: 2025-12-01
- **Owner**: Engineering Lead
- **Actions**:
  - Review all P0/P1 TODOs for progress
  - Downgrade stale P1 TODOs to P2
  - Remove completed or obsolete TODOs
  - Create tasks for new high-priority TODOs

## Notes

- The majority of TODOs (31 out of 48) are in the mobile app, mostly related to WatermelonDB offline-first architecture
- P0 TODOs are all EVV aggregator related and block state compliance
- P1 TODOs are all family engagement related and represent incomplete feature functionality
- Many mobile TODOs are part of larger infrastructure efforts (tasks 0055-0058)
