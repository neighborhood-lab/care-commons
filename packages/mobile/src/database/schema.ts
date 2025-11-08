/**
 * WatermelonDB Schema - Offline-first database for mobile app
 * 
 * This schema defines the local SQLite database structure for offline storage
 * of visits, EVV records, and sync queue items. The schema is optimized for
 * read-heavy mobile workflows with efficient indexing.
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
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

    // Media - Photos and signatures attached to visits/tasks
    tableSchema({
      name: 'media',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'task_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },

        // Media type
        { name: 'media_type', type: 'string', isIndexed: true }, // PHOTO, SIGNATURE
        { name: 'source', type: 'string' }, // CAMERA, GALLERY, SIGNATURE_PAD

        // File info
        { name: 'local_uri', type: 'string' }, // Local file path
        { name: 'file_name', type: 'string' },
        { name: 'file_size', type: 'number' },
        { name: 'mime_type', type: 'string' },
        { name: 'width', type: 'number', isOptional: true },
        { name: 'height', type: 'number', isOptional: true },

        // Server sync
        { name: 'server_url', type: 'string', isOptional: true },
        { name: 'upload_status', type: 'string', isIndexed: true }, // PENDING, UPLOADING, UPLOADED, FAILED
        { name: 'upload_progress', type: 'number' }, // 0-100
        { name: 'upload_error', type: 'string', isOptional: true },

        // Compression (for photos)
        { name: 'original_size', type: 'number', isOptional: true },
        { name: 'compressed', type: 'boolean' },
        { name: 'compression_quality', type: 'number', isOptional: true },

        // HIPAA compliance
        { name: 'encrypted', type: 'boolean' },
        { name: 'phi_present', type: 'boolean' }, // Contains Protected Health Information

        // Metadata
        { name: 'metadata_json', type: 'string', isOptional: true },
        { name: 'caption', type: 'string', isOptional: true },

        // Timestamps
        { name: 'captured_at', type: 'number', isIndexed: true },
        { name: 'uploaded_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),

    // Visit notes - Rich text notes with templates
    tableSchema({
      name: 'visit_notes',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },

        // Note content
        { name: 'note_text', type: 'string' },
        { name: 'note_type', type: 'string', isIndexed: true }, // GENERAL, TEMPLATE, VOICE, INCIDENT
        { name: 'template_id', type: 'string', isOptional: true, isIndexed: true },

        // Voice-to-text
        { name: 'is_voice_transcription', type: 'boolean' },
        { name: 'voice_confidence', type: 'number', isOptional: true },

        // Rich formatting
        { name: 'formatted_content_json', type: 'string', isOptional: true },

        // Auto-save support
        { name: 'is_draft', type: 'boolean', isIndexed: true },
        { name: 'last_auto_save_at', type: 'number', isOptional: true },

        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'sync_pending', type: 'boolean', isIndexed: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),

    // Note templates - Common observation templates
    tableSchema({
      name: 'note_templates',
      columns: [
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true }, // ADL, MEDICATION, VITAL_SIGNS, OBSERVATION
        { name: 'title', type: 'string' },
        { name: 'template_text', type: 'string' },
        { name: 'tags_json', type: 'string', isOptional: true },
        { name: 'is_active', type: 'boolean', isIndexed: true },
        { name: 'sort_order', type: 'number' },
        { name: 'use_count', type: 'number' }, // Track popular templates

        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'last_synced_at', type: 'number', isOptional: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),

    // Push notification settings and history
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'notification_type', type: 'string', isIndexed: true }, // VISIT_REMINDER, MESSAGE, SCHEDULE_CHANGE, SYSTEM
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'data_json', type: 'string', isOptional: true },

        // Related entities
        { name: 'visit_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },

        // Status
        { name: 'is_read', type: 'boolean', isIndexed: true },
        { name: 'is_delivered', type: 'boolean' },
        { name: 'delivered_at', type: 'number', isOptional: true },
        { name: 'read_at', type: 'number', isOptional: true },

        // Scheduling
        { name: 'scheduled_for', type: 'number', isOptional: true, isIndexed: true },
        { name: 'sent_at', type: 'number', isOptional: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
  ],
});
