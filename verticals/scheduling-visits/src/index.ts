/**
 * @care-commons/scheduling-visits
 * 
 * Scheduling & Visit Management vertical
 * 
 * Provides comprehensive scheduling and visit tracking functionality:
 * - Service pattern templates for recurring care
 * - Automated schedule generation
 * - Visit lifecycle management (planned → in progress → completed)
 * - Intelligent caregiver assignment
 * - Real-time status tracking
 * - Exception handling
 * - Availability checking and conflict detection
 */

// Types
export * from './types/schedule';

// Service
export { ScheduleService, IClientAddressProvider } from './service/schedule-service';

// Providers
export * from './providers';

// Repository
export { ScheduleRepository } from './repository/schedule-repository';

// Validation
export { ScheduleValidator } from './validation/schedule-validator';

// Utilities
export * from './utils/schedule-utils';

// API / Integration
export { VisitProvider, createVisitProvider } from './api/visit-provider';
