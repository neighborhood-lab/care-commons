/**
 * Backup Validator
 *
 * Zod schemas for validating backup configurations, snapshots, and restore operations.
 */

import { z } from 'zod';

// Common schemas
const UUIDSchema = z.string().uuid();
const TimestampSchema = z.string().datetime();

// Backup Configuration Validation
export const BackupConfigTypeSchema = z.enum([
  'FULL',
  'INCREMENTAL',
  'DIFFERENTIAL',
  'CONTINUOUS',
]);

export const BackupFrequencySchema = z.enum([
  'CONTINUOUS',
  'HOURLY',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'CUSTOM',
]);

export const DayOfWeekSchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const BackupScheduleSchema = z.object({
  frequency: BackupFrequencySchema,
  cronExpression: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  daysOfWeek: z.array(DayOfWeekSchema).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  maxDuration: z.number().positive().optional(),
  maxConcurrency: z.number().positive().optional(),
});

export const BackupEntityTypeSchema = z.enum([
  'CLIENT',
  'CAREGIVER',
  'VISIT',
  'SCHEDULE',
  'CARE_PLAN',
  'TASK',
  'TIME_ENTRY',
  'EVV_RECORD',
  'INVOICE',
  'PAYMENT',
  'PAYROLL',
  'FAMILY_MEMBER',
  'COMMUNICATION',
  'DOCUMENT',
  'NOTE',
  'ASSESSMENT',
  'MEDICATION',
  'AUTHORIZATION',
  'SHIFT',
  'ORGANIZATION',
  'BRANCH',
  'USER',
  'ALL',
]);

export const BackupScopeSchema = z.object({
  includeEntities: z.array(BackupEntityTypeSchema).min(1),
  excludeEntities: z.array(BackupEntityTypeSchema).optional(),
  clientIds: z.array(UUIDSchema).optional(),
  branchIds: z.array(UUIDSchema).optional(),
  caregiverIds: z.array(UUIDSchema).optional(),
  dateRangeStart: z.coerce.date().optional(),
  dateRangeEnd: z.coerce.date().optional(),
  includeSoftDeleted: z.boolean(),
  includeAttachments: z.boolean(),
  includeDocuments: z.boolean(),
  includeAuditLogs: z.boolean(),
  includePHI: z.boolean(),
  includeFinancialData: z.boolean(),
  customFilters: z.record(z.unknown()).optional(),
});

export const RetentionPolicySchema = z.object({
  retentionDays: z.number().min(0),
  dailyRetention: z.number().positive().optional(),
  weeklyRetention: z.number().positive().optional(),
  monthlyRetention: z.number().positive().optional(),
  yearlyRetention: z.number().positive().optional(),
  autoDeleteExpired: z.boolean(),
  minimumRetentionDays: z.number().positive().optional(),
});

export const StorageTypeSchema = z.enum([
  'AWS_S3',
  'AZURE_BLOB',
  'GOOGLE_CLOUD_STORAGE',
  'LOCAL_FILESYSTEM',
  'NETWORK_SHARE',
  'SFTP',
  'MULTI',
]);

export const CloudStorageConfigSchema = z.object({
  provider: z.enum(['AWS', 'AZURE', 'GCP']),
  region: z.string(),
  bucketName: z.string().min(1),
  path: z.string().optional(),
  credentialsId: UUIDSchema.optional(),
  accessKeyId: z.string().optional(),
  storageClass: z.string().optional(),
  serverSideEncryption: z.boolean().optional(),
  kmsKeyId: z.string().optional(),
});

export const LocalStorageConfigSchema = z.object({
  path: z.string().min(1),
  networkShare: z
    .object({
      host: z.string(),
      shareName: z.string(),
      credentialsId: UUIDSchema.optional(),
      protocol: z.enum(['SMB', 'NFS', 'SFTP']),
    })
    .optional(),
  userId: z.string().optional(),
  groupId: z.string().optional(),
  permissions: z.string().regex(/^[0-7]{4}$/).optional(),
});

export const StorageDestinationSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: StorageTypeSchema,
    cloudStorage: CloudStorageConfigSchema.optional(),
    localStorage: LocalStorageConfigSchema.optional(),
    replicationDestinations: z.array(StorageDestinationSchema).optional(),
  })
);

export const BackupNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  emailRecipients: z.array(z.string().email()),
  smsRecipients: z.array(z.string()).optional(),
  webhookUrls: z.array(z.string().url()).optional(),
  onSuccess: z.boolean(),
  onFailure: z.boolean(),
  onWarning: z.boolean(),
  onStarted: z.boolean(),
  onComplete: z.boolean(),
  notifyIfDurationExceeds: z.number().positive().optional(),
  notifyIfSizeExceeds: z.number().positive().optional(),
  notifyIfStorageThreshold: z.number().min(0).max(100).optional(),
});

export const ComplianceRequirementSchema = z.object({
  regulation: z.string(),
  description: z.string().optional(),
  minimumRetentionDays: z.number().positive(),
  requiresEncryption: z.boolean(),
  requiresAuditLog: z.boolean(),
  requiresIntegrityCheck: z.boolean(),
});

export const CreateBackupConfigSchema = z.object({
  organizationId: UUIDSchema,
  branchIds: z.array(UUIDSchema).optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  configType: BackupConfigTypeSchema,
  schedule: BackupScheduleSchema,
  timezone: z.string(), // IANA timezone
  scope: BackupScopeSchema,
  retention: RetentionPolicySchema,
  storageDestination: StorageDestinationSchema,
  encryptionEnabled: z.boolean(),
  compressionEnabled: z.boolean(),
  notificationSettings: BackupNotificationSettingsSchema,
  complianceRequirements: z.array(ComplianceRequirementSchema).optional(),
});

export const UpdateBackupConfigSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  schedule: BackupScheduleSchema.optional(),
  scope: BackupScopeSchema.optional(),
  retention: RetentionPolicySchema.optional(),
  storageDestination: StorageDestinationSchema.optional(),
  notificationSettings: BackupNotificationSettingsSchema.optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'SUSPENDED', 'DISABLED', 'ARCHIVED']).optional(),
});

// Backup Snapshot Validation
export const BackupSnapshotStatusSchema = z.enum([
  'QUEUED',
  'PREPARING',
  'IN_PROGRESS',
  'FINALIZING',
  'VERIFYING',
  'COMPLETED',
  'COMPLETED_WITH_WARNINGS',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'DELETED',
]);

export const CreateBackupSnapshotSchema = z.object({
  configurationId: UUIDSchema,
  scheduledAt: TimestampSchema.optional(),
  notes: z.string().max(1000).optional(),
});

// Restore Operation Validation
export const RestoreTypeSchema = z.enum(['FULL', 'SELECTIVE', 'POINT_IN_TIME', 'FILE_LEVEL']);

export const RestoreScopeSchema = z.object({
  includeEntities: z.array(BackupEntityTypeSchema).min(1),
  excludeEntities: z.array(BackupEntityTypeSchema).optional(),
  clientIds: z.array(UUIDSchema).optional(),
  caregiverIds: z.array(UUIDSchema).optional(),
  recordIds: z.array(UUIDSchema).optional(),
  dateRangeStart: z.coerce.date().optional(),
  dateRangeEnd: z.coerce.date().optional(),
  restoreToTimestamp: TimestampSchema.optional(),
  restoreSoftDeleted: z.boolean(),
  restoreAttachments: z.boolean(),
  restoreDocuments: z.boolean(),
});

export const RestoreDestinationSchema = z.object({
  type: z.enum(['PRODUCTION', 'STAGING', 'TEST', 'TEMPORARY']),
  databaseConnection: z.string().optional(),
  schemaName: z.string().optional(),
  tablePrefix: z.string().optional(),
  fileSystemPath: z.string().optional(),
  overwriteExisting: z.boolean(),
  mergeWithExisting: z.boolean(),
});

export const ConflictResolutionStrategySchema = z.enum([
  'BACKUP_WINS',
  'EXISTING_WINS',
  'NEWEST_WINS',
  'OLDEST_WINS',
  'MANUAL',
  'MERGE',
]);

export const CreateRestoreOperationSchema = z.object({
  snapshotId: UUIDSchema,
  restoreType: RestoreTypeSchema,
  scope: RestoreScopeSchema,
  restoreDestination: RestoreDestinationSchema,
  conflictResolutionStrategy: ConflictResolutionStrategySchema,
  requiresApproval: z.boolean(),
  rollbackEnabled: z.boolean(),
  requestedBy: UUIDSchema,
  notes: z.string().max(1000).optional(),
});

/**
 * BackupValidator
 *
 * Provides validation methods for backup-related operations.
 */
export class BackupValidator {
  /**
   * Validate create backup configuration input
   */
  static validateCreateConfig(data: unknown): boolean {
    try {
      CreateBackupConfigSchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate update backup configuration input
   */
  static validateUpdateConfig(data: unknown): boolean {
    try {
      UpdateBackupConfigSchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate create backup snapshot input
   */
  static validateCreateSnapshot(data: unknown): boolean {
    try {
      CreateBackupSnapshotSchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate create restore operation input
   */
  static validateCreateRestore(data: unknown): boolean {
    try {
      CreateRestoreOperationSchema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validate retention policy meets compliance requirements
   */
  static validateRetentionCompliance(
    retention: z.infer<typeof RetentionPolicySchema>,
    requirements?: z.infer<typeof ComplianceRequirementSchema>[]
  ): boolean {
    if (!requirements || requirements.length === 0) {
      return true;
    }

    for (const req of requirements) {
      if (retention.retentionDays > 0 && retention.retentionDays < req.minimumRetentionDays) {
        throw new Error(
          `Retention policy (${retention.retentionDays} days) does not meet compliance requirement for ${req.regulation} (${req.minimumRetentionDays} days)`
        );
      }
    }

    return true;
  }
}
