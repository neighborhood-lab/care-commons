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

    // Photos - Visit documentation photos
    tableSchema({
      name: 'photos',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'task_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },

        // Photo details
        { name: 'local_uri', type: 'string' }, // Local file path
        { name: 'remote_url', type: 'string', isOptional: true }, // Cloud storage URL after upload
        { name: 'file_name', type: 'string' },
        { name: 'file_size', type: 'number' }, // Bytes
        { name: 'mime_type', type: 'string' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },

        // Metadata
        { name: 'caption', type: 'string', isOptional: true },
        { name: 'photo_type', type: 'string', isIndexed: true }, // 'care_documentation', 'incident', 'task_completion', 'general'
        { name: 'taken_at', type: 'number', isIndexed: true },
        { name: 'location_json', type: 'string', isOptional: true }, // GPS location when photo taken

        // Upload status
        { name: 'upload_status', type: 'string', isIndexed: true }, // 'pending', 'uploading', 'uploaded', 'failed'
        { name: 'upload_error', type: 'string', isOptional: true },
        { name: 'uploaded_at', type: 'number', isOptional: true },

        // HIPAA compliance
        { name: 'is_hipaa_compliant', type: 'boolean' },
        { name: 'encryption_key_id', type: 'string', isOptional: true },

        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'sync_pending', type: 'boolean', isIndexed: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),

    // Signatures - Client signatures for EVV
    tableSchema({
      name: 'signatures',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },

        // Signature data
        { name: 'signature_type', type: 'string', isIndexed: true }, // 'client', 'caregiver', 'supervisor'
        { name: 'local_uri', type: 'string' }, // Local image file path
        { name: 'remote_url', type: 'string', isOptional: true }, // Cloud storage URL after upload
        { name: 'signature_data_url', type: 'string' }, // Base64 data URL for quick preview
        { name: 'file_size', type: 'number' },

        // Attestation
        { name: 'attestation_text', type: 'string' },
        { name: 'signer_name', type: 'string' },
        { name: 'signed_at', type: 'number', isIndexed: true },

        // Device info for integrity
        { name: 'device_info_json', type: 'string' },
        { name: 'location_json', type: 'string', isOptional: true },

        // Cryptographic integrity
        { name: 'integrity_hash', type: 'string' }, // SHA-256 hash of signature + attestation + device info
        { name: 'hash_algorithm', type: 'string' }, // 'SHA-256'

        // Upload status
        { name: 'upload_status', type: 'string', isIndexed: true }, // 'pending', 'uploading', 'uploaded', 'failed'
        { name: 'upload_error', type: 'string', isOptional: true },
        { name: 'uploaded_at', type: 'number', isOptional: true },

        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'sync_pending', type: 'boolean', isIndexed: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),

    // Visit Notes - Rich text notes for visit documentation
    tableSchema({
      name: 'visit_notes',
      columns: [
        { name: 'visit_id', type: 'string', isIndexed: true },
        { name: 'evv_record_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'caregiver_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },

        // Note content
        { name: 'note_text', type: 'string' },
        { name: 'note_html', type: 'string', isOptional: true }, // Rich text HTML if applicable
        { name: 'note_type', type: 'string', isIndexed: true }, // 'care_notes', 'incident', 'vital_signs', 'medication', 'general'
        { name: 'template_id', type: 'string', isOptional: true, isIndexed: true },

        // Voice-to-text metadata
        { name: 'is_voice_transcribed', type: 'boolean' },
        { name: 'audio_uri', type: 'string', isOptional: true }, // Path to audio file if recorded
        { name: 'transcription_confidence', type: 'number', isOptional: true }, // 0-1 confidence score

        // Metadata
        { name: 'recorded_at', type: 'number', isIndexed: true },
        { name: 'duration_seconds', type: 'number', isOptional: true }, // For audio notes

        // Auto-save tracking
        { name: 'is_auto_saved', type: 'boolean' },
        { name: 'last_edited_at', type: 'number', isIndexed: true },

        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'sync_pending', type: 'boolean', isIndexed: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),

    // Note Templates - Pre-defined templates for common observations
    tableSchema({
      name: 'note_templates',
      columns: [
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'template_name', type: 'string', isIndexed: true },
        { name: 'template_category', type: 'string', isIndexed: true }, // 'care_notes', 'vital_signs', 'medication', 'incident'
        { name: 'template_text', type: 'string' },
        { name: 'template_html', type: 'string', isOptional: true },

        // Variables/placeholders
        { name: 'variables_json', type: 'string', isOptional: true }, // e.g., ['client_name', 'time', 'vital_value']

        // Usage tracking
        { name: 'usage_count', type: 'number' },
        { name: 'last_used_at', type: 'number', isOptional: true },

        // Ordering
        { name: 'sort_order', type: 'number', isIndexed: true },
        { name: 'is_active', type: 'boolean', isIndexed: true },
        { name: 'is_default', type: 'boolean' },

        // Sync
        { name: 'is_synced', type: 'boolean', isIndexed: true },
        { name: 'last_synced_at', type: 'number', isOptional: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),

    // Push Notifications - Store notification history and preferences
    tableSchema({
      name: 'notifications',
      columns: [
        { name: 'notification_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },

        // Notification content
        { name: 'title', type: 'string' },
        { name: 'body', type: 'string' },
        { name: 'notification_type', type: 'string', isIndexed: true }, // 'visit_reminder', 'message', 'schedule_change', 'system'
        { name: 'priority', type: 'string' }, // 'low', 'normal', 'high'

        // Related entities
        { name: 'related_entity_type', type: 'string', isOptional: true, isIndexed: true }, // 'visit', 'message', 'schedule'
        { name: 'related_entity_id', type: 'string', isOptional: true, isIndexed: true },

        // Action data
        { name: 'action_data_json', type: 'string', isOptional: true }, // Deep link data

        // Status
        { name: 'is_read', type: 'boolean', isIndexed: true },
        { name: 'read_at', type: 'number', isOptional: true },
        { name: 'is_dismissed', type: 'boolean' },
        { name: 'dismissed_at', type: 'number', isOptional: true },

        // Scheduling
        { name: 'scheduled_for', type: 'number', isOptional: true, isIndexed: true },
        { name: 'sent_at', type: 'number', isOptional: true, isIndexed: true },
        { name: 'received_at', type: 'number', isOptional: true },

        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number', isIndexed: true },
      ],
    }),
  ],
});
