/**
 * WatermelonDB Schema - Offline-first database for mobile app
 * 
 * This schema defines the local SQLite database structure for offline storage
 * of visits, EVV records, and sync queue items. The schema is optimized for
 * read-heavy mobile workflows with efficient indexing.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Visits - Core scheduling and visit tracking
    tableSchema({
      name: 'visits',
      columns: [
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'branch_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        
        // Schedule
        { name: 'scheduled_start_time', type: 'number', isIndexed: true }, // Unix timestamp
        { name: 'scheduled_end_time', type: 'number', isIndexed: true },
        { name: 'scheduled_duration', type: 'number' },
        
        // Client info
        { name: 'client_name', type: 'string' },
        { name: 'client_address_json', type: 'string' }, // JSON serialized ServiceAddress
        
        // Service
        { name: 'service_type_code', type: 'string', isIndexed: true },
        { name: 'service_type_name', type: 'string' },
        
        // Status
        { name: 'status', type: 'string', isIndexed: true },
        
        // EVV link
        { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
        
        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'last_modified_at', type: 'number', isIndexed: true },
        { name: 'sync_pending', type: 'boolean', isIndexed: true },
        { name: 'server_version', type: 'number' }, // For optimistic locking
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // EVV Records - Electronic Visit Verification records
    tableSchema({
      name: 'evv_records',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'branch_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        
        // EVV data - Stored as JSON for flexibility
        { name: 'evv_data_json', type: 'string' }, // Serialized EVVRecord
        
        // Quick access fields (denormalized for queries)
        { name: 'service_date', type: 'number', isIndexed: true },
        { name: 'clock_in_time', type: 'number', isIndexed: true },
        { name: 'clock_out_time', type: 'number', isOptional: true, isIndexed: true },
        { name: 'record_status', type: 'string', isIndexed: true },
        { name: 'verification_level', type: 'string', isIndexed: true },
        
        // Integrity
        { name: 'integrity_hash', type: 'string' },
        
        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'sync_pending', type: 'boolean', isIndexed: true },
        { name: 'server_version', type: 'number' },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // Time Entries - Individual clock events
    tableSchema({
      name: 'time_entries',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        
        // Entry details
        { name: 'entry_type', type: 'string', isIndexed: true }, // CLOCK_IN, CLOCK_OUT, etc.
        { name: 'entry_timestamp', type: 'number', isIndexed: true },
        
        // Location and device - Stored as JSON
        { name: 'location_json', type: 'string' }, // Serialized LocationVerification
        { name: 'device_info_json', type: 'string' }, // Serialized DeviceInfo
        
        // Integrity
        { name: 'integrity_hash', type: 'string' },
        { name: 'server_received_at', type: 'number', isOptional: true },
        
        // Sync
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'offline_recorded', type: 'boolean', isIndexed: true },
        { name: 'offline_recorded_at', type: 'number', isOptional: true },
        
        // Verification
        { name: 'verification_passed', type: 'boolean', isIndexed: true },
        { name: 'verification_issues_json', type: 'string', isOptional: true },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // Sync Queue - Operations pending sync to server
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'operation_type', type: 'string', isIndexed: true }, // CREATE, UPDATE, DELETE
        { name: 'entity_type', type: 'string', isIndexed: true }, // VISIT, EVV_RECORD, TIME_ENTRY
        { name: 'entity_id', type: 'string', isIndexed: true },
        { name: 'payload_json', type: 'string' }, // Serialized operation payload
        
        // Retry logic
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'next_retry_at', type: 'number', isOptional: true, isIndexed: true },
        
        // Status
        { name: 'status', type: 'string', isIndexed: true }, // PENDING, IN_PROGRESS, FAILED, COMPLETED
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'error_details_json', type: 'string', isOptional: true },
        
        // Priority
        { name: 'priority', type: 'number', isIndexed: true }, // Higher = more important
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'completed_at', type: 'number', isOptional: true },
      ],
    }),
    
    // Geofences - Cached geofence data for offline verification
    tableSchema({
      name: 'geofences',
      columns: [
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'address_id', type: 'string', isIndexed: true },
        
        // Location
        { name: 'center_latitude', type: 'number' },
        { name: 'center_longitude', type: 'number' },
        { name: 'radius_meters', type: 'number' },
        
        // Settings
        { name: 'is_active', type: 'boolean', isIndexed: true },
        
        // Full data as JSON
        { name: 'geofence_data_json', type: 'string' },
        
        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // User session and preferences
    tableSchema({
      name: 'user_session',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isOptional: true, isIndexed: true },
        
        // Auth tokens (encrypted in secure storage, just metadata here)
        { name: 'token_expires_at', type: 'number', isIndexed: true },
        { name: 'refresh_token_expires_at', type: 'number', isIndexed: true },
        
        // User info
        { name: 'user_name', type: 'string' },
        { name: 'user_email', type: 'string' },
        { name: 'user_roles_json', type: 'string' },
        { name: 'permissions_json', type: 'string' },
        
        // Preferences
        { name: 'preferences_json', type: 'string' },
        
        // Last sync
        { name: 'last_sync_at', type: 'number', isOptional: true },
        { name: 'last_sync_success', type: 'boolean' },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
  ],
});
