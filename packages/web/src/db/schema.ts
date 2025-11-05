/**
 * WatermelonDB Schema for Web - Offline-first database for PWA
 * 
 * This schema defines the local IndexedDB database structure for offline storage.
 * Uses the same schema as mobile but optimized for web browser storage.
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
        { name: 'scheduled_start_time', type: 'number', isIndexed: true },
        { name: 'scheduled_end_time', type: 'number', isIndexed: true },
        { name: 'scheduled_duration', type: 'number' },
        
        // Client info
        { name: 'client_name', type: 'string' },
        { name: 'client_address_json', type: 'string' },
        
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
        { name: 'server_version', type: 'number' },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // Tasks - Care plan tasks
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isOptional: true, isIndexed: true },
        
        // Task details
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'task_type', type: 'string', isIndexed: true },
        { name: 'status', type: 'string', isIndexed: true },
        
        // Completion
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'completed_by', type: 'string', isOptional: true },
        { name: 'completion_notes', type: 'string', isOptional: true },
        
        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'sync_pending', type: 'boolean', isIndexed: true },
        { name: 'server_version', type: 'number' },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // Clients - Cached client data for offline access
    tableSchema({
      name: 'clients',
      columns: [
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'branch_id', type: 'string', isIndexed: true },
        
        // Demographics
        { name: 'first_name', type: 'string' },
        { name: 'last_name', type: 'string' },
        { name: 'date_of_birth', type: 'number' },
        
        // Contact
        { name: 'phone_number', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        
        // Address as JSON
        { name: 'service_address_json', type: 'string' },
        
        // Status
        { name: 'status', type: 'string', isIndexed: true },
        
        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // Time Entries - EVV clock events
    tableSchema({
      name: 'time_entries',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        
        // Entry details
        { name: 'entry_type', type: 'string', isIndexed: true },
        { name: 'entry_timestamp', type: 'number', isIndexed: true },
        
        // Location and device (JSON)
        { name: 'location_json', type: 'string' },
        { name: 'device_info_json', type: 'string' },
        
        // Integrity
        { name: 'integrity_hash', type: 'string' },
        
        // Sync
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'offline_recorded', type: 'boolean', isIndexed: true },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
    
    // Sync Queue - Operations pending sync to server
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'operation_type', type: 'string', isIndexed: true },
        { name: 'entity_type', type: 'string', isIndexed: true },
        { name: 'entity_id', type: 'string', isIndexed: true },
        { name: 'payload_json', type: 'string' },
        
        // Retry logic
        { name: 'retry_count', type: 'number' },
        { name: 'max_retries', type: 'number' },
        { name: 'next_retry_at', type: 'number', isOptional: true, isIndexed: true },
        
        // Status
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'error_details_json', type: 'string', isOptional: true },
        
        // Priority
        { name: 'priority', type: 'number', isIndexed: true },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
        { name: 'synced_at', type: 'number', isOptional: true },
      ],
    }),
  ],
});
