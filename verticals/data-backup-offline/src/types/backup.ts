/**
 * Data Backup & Offline Support - Core Types
 *
 * Comprehensive backup management and offline synchronization support
 * for care coordination platforms with compliance and data integrity requirements.
 */

import type { UUID, Timestamp, Entity, SoftDeletable } from '@care-commons/core';

/**
 * Backup Configuration
 *
 * Defines backup policies, schedules, retention, and storage settings
 * for organizational data protection strategies.
 */
export interface BackupConfiguration extends Entity, SoftDeletable {
  organizationId: UUID;
  branchIds?: UUID[]; // Optional branch-specific backups

  // Identity
  name: string;
  description?: string;
  configType: BackupConfigType;

  // Schedule
  schedule: BackupSchedule;
  timezone: string; // IANA timezone (e.g., "America/Chicago")

  // Scope - What to backup
  scope: BackupScope;

  // Retention Policy
  retention: RetentionPolicy;

  // Storage
  storageDestination: StorageDestination;
  encryptionEnabled: boolean;
  encryptionKeyId?: string;
  compressionEnabled: boolean;
  compressionLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 1=fast, 9=max compression

  // Validation & Integrity
  integrityCheckEnabled: boolean;
  integrityCheckSchedule?: CronExpression;
  checksumAlgorithm: 'SHA256' | 'SHA512' | 'BLAKE3';

  // Notification
  notificationSettings: BackupNotificationSettings;

  // Status
  status: BackupConfigStatus;
  statusReason?: string;

  // Metadata
  lastBackupAt?: Timestamp;
  lastSuccessfulBackupAt?: Timestamp;
  nextScheduledBackupAt?: Timestamp;
  totalBackupsCreated: number;
  totalStorageUsed?: number; // bytes

  // Compliance
  complianceRequirements?: ComplianceRequirement[];
  auditRetentionDays?: number; // Separate from data retention

  // Custom fields
  customFields?: Record<string, unknown>;
}

export type BackupConfigType =
  | 'FULL'           // Complete data backup
  | 'INCREMENTAL'    // Only changed data since last backup
  | 'DIFFERENTIAL'   // Changed data since last full backup
  | 'CONTINUOUS';    // Real-time backup (CDC - Change Data Capture)

export type BackupConfigStatus =
  | 'ACTIVE'         // Running as scheduled
  | 'PAUSED'         // Temporarily disabled
  | 'SUSPENDED'      // Suspended due to errors
  | 'DISABLED'       // Manually disabled
  | 'ARCHIVED';      // Historical record

export interface BackupSchedule {
  frequency: BackupFrequency;
  cronExpression?: CronExpression; // For custom schedules

  // Time windows
  startTime?: string; // HH:MM format
  endTime?: string;   // HH:MM format (backup must complete within window)

  // Days
  daysOfWeek?: DayOfWeek[]; // For weekly schedules
  dayOfMonth?: number;      // For monthly schedules (1-31)

  // Advanced
  maxDuration?: number; // Maximum backup duration in minutes
  maxConcurrency?: number; // Number of parallel backup threads
}

export type BackupFrequency =
  | 'CONTINUOUS'  // Real-time
  | 'HOURLY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'CUSTOM';     // Uses cronExpression

export type CronExpression = string; // e.g., "0 2 * * *" (daily at 2 AM)

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface BackupScope {
  // Entity types to include
  includeEntities: BackupEntityType[];
  excludeEntities?: BackupEntityType[];

  // Specific filters
  clientIds?: UUID[];      // Backup specific clients only
  branchIds?: UUID[];      // Backup specific branches
  caregiverIds?: UUID[];   // Backup specific caregivers

  // Date ranges
  dateRangeStart?: Date;
  dateRangeEnd?: Date;

  // Include deleted (soft-deleted) records
  includeSoftDeleted: boolean;

  // Include attachments and files
  includeAttachments: boolean;
  includeDocuments: boolean;

  // Include audit logs
  includeAuditLogs: boolean;

  // PHI/PII handling
  includePHI: boolean;
  includeFinancialData: boolean;

  // Custom filters
  customFilters?: Record<string, unknown>;
}

export type BackupEntityType =
  | 'CLIENT'
  | 'CAREGIVER'
  | 'VISIT'
  | 'SCHEDULE'
  | 'CARE_PLAN'
  | 'TASK'
  | 'TIME_ENTRY'
  | 'EVV_RECORD'
  | 'INVOICE'
  | 'PAYMENT'
  | 'PAYROLL'
  | 'FAMILY_MEMBER'
  | 'COMMUNICATION'
  | 'DOCUMENT'
  | 'NOTE'
  | 'ASSESSMENT'
  | 'MEDICATION'
  | 'AUTHORIZATION'
  | 'SHIFT'
  | 'ORGANIZATION'
  | 'BRANCH'
  | 'USER'
  | 'ALL'; // Include all entity types

export interface RetentionPolicy {
  // How long to keep backups
  retentionDays: number; // 0 = indefinite

  // Granular retention
  dailyRetention?: number;    // Keep daily backups for N days
  weeklyRetention?: number;   // Keep weekly backups for N weeks
  monthlyRetention?: number;  // Keep monthly backups for N months
  yearlyRetention?: number;   // Keep yearly backups for N years

  // Automatic deletion
  autoDeleteExpired: boolean;

  // Compliance requirements may override
  minimumRetentionDays?: number; // Legal/regulatory minimum
}

export interface StorageDestination {
  type: StorageType;

  // Cloud storage (S3, Azure Blob, GCS)
  cloudStorage?: CloudStorageConfig;

  // Local/network storage
  localStorage?: LocalStorageConfig;

  // Multi-destination
  replicationDestinations?: StorageDestination[];
}

export type StorageType =
  | 'AWS_S3'
  | 'AZURE_BLOB'
  | 'GOOGLE_CLOUD_STORAGE'
  | 'LOCAL_FILESYSTEM'
  | 'NETWORK_SHARE'
  | 'SFTP'
  | 'MULTI'; // Replicate to multiple destinations

export interface CloudStorageConfig {
  provider: 'AWS' | 'AZURE' | 'GCP';
  region: string;
  bucketName: string;
  path?: string; // Path within bucket

  // Authentication
  credentialsId?: UUID; // Reference to stored credentials
  accessKeyId?: string;

  // Storage class/tier
  storageClass?: string; // e.g., "STANDARD", "GLACIER", "ARCHIVE"

  // Options
  serverSideEncryption?: boolean;
  kmsKeyId?: string;
}

export interface LocalStorageConfig {
  path: string;

  // Network share
  networkShare?: {
    host: string;
    shareName: string;
    credentialsId?: UUID;
    protocol: 'SMB' | 'NFS' | 'SFTP';
  };

  // Permissions
  userId?: string;
  groupId?: string;
  permissions?: string; // Unix-style: "0750"
}

export interface BackupNotificationSettings {
  enabled: boolean;

  // Recipients
  emailRecipients: string[];
  smsRecipients?: string[];
  webhookUrls?: string[];

  // Events to notify on
  onSuccess: boolean;
  onFailure: boolean;
  onWarning: boolean;
  onStarted: boolean;
  onComplete: boolean;

  // Thresholds
  notifyIfDurationExceeds?: number; // minutes
  notifyIfSizeExceeds?: number;     // bytes
  notifyIfStorageThreshold?: number; // percentage (0-100)
}

export interface ComplianceRequirement {
  regulation: string; // e.g., "HIPAA", "GDPR", "STATE_TX"
  description?: string;
  minimumRetentionDays: number;
  requiresEncryption: boolean;
  requiresAuditLog: boolean;
  requiresIntegrityCheck: boolean;
}

/**
 * Backup Snapshot
 *
 * Represents a specific backup instance with all associated metadata,
 * status tracking, and integrity verification.
 */
export interface BackupSnapshot extends Entity, SoftDeletable {
  organizationId: UUID;
  configurationId: UUID; // References BackupConfiguration

  // Identity
  snapshotNumber: string; // e.g., "BKP-2025-001234"
  snapshotType: BackupConfigType;
  generation: number; // Sequential number for this config

  // Timing
  scheduledAt?: Timestamp;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // milliseconds

  // Status
  status: BackupSnapshotStatus;
  statusReason?: string;
  progress?: BackupProgress;

  // Data metrics
  dataMetrics: BackupDataMetrics;

  // Storage
  storageLocation: StorageLocation;

  // Integrity
  checksum: string;
  checksumAlgorithm: 'SHA256' | 'SHA512' | 'BLAKE3';
  integrityVerified: boolean;
  integrityVerifiedAt?: Timestamp;

  // Encryption
  encrypted: boolean;
  encryptionKeyId?: string;
  encryptionAlgorithm?: 'AES-256-GCM' | 'AES-256-CBC';

  // Compression
  compressed: boolean;
  compressionAlgorithm?: 'GZIP' | 'ZSTD' | 'LZ4';
  compressionRatio?: number; // e.g., 0.45 = 45% of original size

  // Errors & Warnings
  errors?: BackupError[];
  warnings?: BackupWarning[];

  // Retention
  expiresAt?: Timestamp;
  retentionLocked: boolean; // Prevent deletion (compliance hold)

  // Restore information
  restoreCount: number;
  lastRestoredAt?: Timestamp;

  // Parent/child relationships (for incremental backups)
  parentSnapshotId?: UUID; // For incremental/differential backups
  childSnapshotIds?: UUID[];

  // Metadata
  tags?: Record<string, string>;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type BackupSnapshotStatus =
  | 'QUEUED'          // Scheduled but not started
  | 'PREPARING'       // Initializing backup
  | 'IN_PROGRESS'     // Actively backing up data
  | 'FINALIZING'      // Completing backup, generating checksum
  | 'VERIFYING'       // Verifying integrity
  | 'COMPLETED'       // Successfully completed
  | 'COMPLETED_WITH_WARNINGS' // Completed but with warnings
  | 'FAILED'          // Failed to complete
  | 'CANCELLED'       // Manually cancelled
  | 'EXPIRED'         // Past retention period (pending deletion)
  | 'DELETED';        // Deleted (audit record)

export interface BackupProgress {
  currentPhase: BackupPhase;
  overallPercent: number; // 0-100

  // Entity-level progress
  entitiesTotal: number;
  entitiesProcessed: number;
  entitiesFailed: number;

  // Data-level progress
  bytesTotal: number;
  bytesProcessed: number;
  bytesPerSecond: number;

  // Estimated time
  estimatedTimeRemaining?: number; // seconds
  estimatedCompletionAt?: Timestamp;

  // Current operation
  currentEntity?: BackupEntityType;
  currentOperation?: string;
}

export type BackupPhase =
  | 'INITIALIZING'
  | 'COLLECTING_METADATA'
  | 'BACKING_UP_DATA'
  | 'COMPRESSING'
  | 'ENCRYPTING'
  | 'UPLOADING'
  | 'VERIFYING'
  | 'FINALIZING';

export interface BackupDataMetrics {
  // Record counts
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;

  // Record breakdown by entity type
  recordsByEntity: Record<BackupEntityType, number>;

  // Size metrics
  originalSize: number; // bytes
  compressedSize?: number; // bytes
  storedSize: number; // bytes (after compression & encryption)

  // File metrics
  totalFiles: number;
  totalFileSize: number; // bytes

  // PHI/PII metrics (for compliance)
  phiRecordCount?: number;
  piiRecordCount?: number;
  financialRecordCount?: number;
}

export interface StorageLocation {
  type: StorageType;

  // Cloud
  bucketName?: string;
  region?: string;
  objectKey?: string; // Full path to backup file

  // Local
  filePath?: string;

  // Multi-destination
  replicationLocations?: StorageLocation[];

  // Access
  url?: string; // Pre-signed URL for download (temporary)
  urlExpiresAt?: Timestamp;
}

export interface BackupError {
  id: UUID;
  timestamp: Timestamp;
  severity: 'ERROR' | 'CRITICAL';

  code: string; // Error code for categorization
  message: string;

  entityType?: BackupEntityType;
  entityId?: UUID;

  stackTrace?: string;
  context?: Record<string, unknown>;
}

export interface BackupWarning {
  id: UUID;
  timestamp: Timestamp;

  code: string;
  message: string;

  entityType?: BackupEntityType;
  entityId?: UUID;

  context?: Record<string, unknown>;
}

/**
 * Restore Operation
 *
 * Tracks data restoration from backups, including selective restores,
 * point-in-time recovery, and validation.
 */
export interface RestoreOperation extends Entity {
  organizationId: UUID;
  snapshotId: UUID;

  // Identity
  restoreNumber: string; // e.g., "RST-2025-000123"
  restoreType: RestoreType;

  // Timing
  requestedAt: Timestamp;
  requestedBy: UUID;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // milliseconds

  // Scope
  scope: RestoreScope;

  // Destination
  restoreDestination: RestoreDestination;

  // Status
  status: RestoreStatus;
  statusReason?: string;
  progress?: RestoreProgress;

  // Data metrics
  dataMetrics: RestoreDataMetrics;

  // Validation
  validationEnabled: boolean;
  validationResults?: ValidationResults;

  // Conflict handling
  conflictResolutionStrategy: ConflictResolutionStrategy;
  conflictsDetected?: ConflictRecord[];

  // Errors & Warnings
  errors?: RestoreError[];
  warnings?: RestoreWarning[];

  // Approval (for production restores)
  requiresApproval: boolean;
  approvedBy?: UUID;
  approvedAt?: Timestamp;
  approvalNotes?: string;

  // Rollback capability
  rollbackEnabled: boolean;
  rollbackSnapshotId?: UUID; // Snapshot created before restore

  // Metadata
  notes?: string;
  customFields?: Record<string, unknown>;
}

export type RestoreType =
  | 'FULL'            // Complete restore
  | 'SELECTIVE'       // Restore specific entities/records
  | 'POINT_IN_TIME'   // Restore to specific timestamp
  | 'FILE_LEVEL';     // Restore specific files only

export type RestoreStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'QUEUED'
  | 'PREPARING'
  | 'IN_PROGRESS'
  | 'VALIDATING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_WARNINGS'
  | 'FAILED'
  | 'CANCELLED'
  | 'ROLLED_BACK';

export interface RestoreScope {
  // Entity types to restore
  includeEntities: BackupEntityType[];
  excludeEntities?: BackupEntityType[];

  // Specific records
  clientIds?: UUID[];
  caregiverIds?: UUID[];
  recordIds?: UUID[];

  // Date range
  dateRangeStart?: Date;
  dateRangeEnd?: Date;

  // Point-in-time
  restoreToTimestamp?: Timestamp;

  // Options
  restoreSoftDeleted: boolean;
  restoreAttachments: boolean;
  restoreDocuments: boolean;
}

export interface RestoreDestination {
  type: 'PRODUCTION' | 'STAGING' | 'TEST' | 'TEMPORARY';

  // Database
  databaseConnection?: string;
  schemaName?: string;
  tablePrefix?: string; // e.g., "restored_" for safe testing

  // File system
  fileSystemPath?: string;

  // Options
  overwriteExisting: boolean;
  mergeWithExisting: boolean;
}

export interface RestoreProgress {
  currentPhase: RestorePhase;
  overallPercent: number; // 0-100

  entitiesTotal: number;
  entitiesProcessed: number;
  entitiesFailed: number;

  bytesTotal: number;
  bytesProcessed: number;
  bytesPerSecond: number;

  estimatedTimeRemaining?: number; // seconds
  estimatedCompletionAt?: Timestamp;

  currentEntity?: BackupEntityType;
  currentOperation?: string;
}

export type RestorePhase =
  | 'PREPARING'
  | 'DOWNLOADING'
  | 'DECRYPTING'
  | 'DECOMPRESSING'
  | 'VALIDATING_INTEGRITY'
  | 'RESTORING_DATA'
  | 'VALIDATING_DATA'
  | 'FINALIZING';

export interface RestoreDataMetrics {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  skippedRecords: number;

  recordsByEntity: Record<BackupEntityType, number>;

  totalBytes: number;
  totalFiles: number;
}

export interface ValidationResults {
  passed: boolean;

  checksumValid: boolean;
  dataIntegrityValid: boolean;
  schemaValid: boolean;

  recordsValidated: number;
  recordsInvalid: number;

  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  id: UUID;
  timestamp: Timestamp;

  type: 'CHECKSUM_MISMATCH' | 'DATA_CORRUPTION' | 'SCHEMA_MISMATCH' | 'MISSING_DATA' | 'OTHER';
  message: string;

  entityType?: BackupEntityType;
  entityId?: UUID;
  field?: string;

  context?: Record<string, unknown>;
}

export interface ValidationWarning {
  id: UUID;
  timestamp: Timestamp;

  type: string;
  message: string;

  entityType?: BackupEntityType;
  entityId?: UUID;

  context?: Record<string, unknown>;
}

export type ConflictResolutionStrategy =
  | 'BACKUP_WINS'      // Always use data from backup
  | 'EXISTING_WINS'    // Keep existing data
  | 'NEWEST_WINS'      // Use most recently modified
  | 'OLDEST_WINS'      // Use least recently modified
  | 'MANUAL'           // Require manual resolution
  | 'MERGE';           // Attempt to merge both versions

export interface ConflictRecord {
  id: UUID;
  entityType: BackupEntityType;
  entityId: UUID;

  backupVersion: Record<string, unknown>;
  existingVersion: Record<string, unknown>;

  conflictingFields: string[];

  resolution?: 'BACKUP' | 'EXISTING' | 'MERGED' | 'SKIPPED';
  resolvedBy?: UUID;
  resolvedAt?: Timestamp;

  mergedVersion?: Record<string, unknown>;
}

export interface RestoreError {
  id: UUID;
  timestamp: Timestamp;
  severity: 'ERROR' | 'CRITICAL';

  code: string;
  message: string;

  entityType?: BackupEntityType;
  entityId?: UUID;

  stackTrace?: string;
  context?: Record<string, unknown>;
}

export interface RestoreWarning {
  id: UUID;
  timestamp: Timestamp;

  code: string;
  message: string;

  entityType?: BackupEntityType;
  entityId?: UUID;

  context?: Record<string, unknown>;
}
