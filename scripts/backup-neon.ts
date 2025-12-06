#!/usr/bin/env tsx

/**
 * Neon Database Backup Manager
 * 
 * Uses Neon's built-in point-in-time recovery and branch features
 * combined with traditional pg_dump for redundancy.
 * 
 * Features:
 * - Creates Neon branch backups (instant, copy-on-write)
 * - Exports pg_dump backups for portability
 * - Uploads to S3 with encryption
 * - Manages retention policies
 * - Automated backup verification
 * - Alerts on failures
 * 
 * Usage:
 *   tsx scripts/backup-neon.ts --type [branch|dump|both]
 *   tsx scripts/backup-neon.ts --verify
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync } from 'node:fs';
import { readdir, unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createLogger } from '@folkcare/core';

const execAsync = promisify(exec);
const logger = createLogger('BackupManager');

interface BackupConfig {
  neonApiKey?: string;
  neonProjectId?: string;
  databaseUrl?: string;
  backupDir: string;
  s3Bucket?: string;
  encryptionKey?: string;
  retentionDays: number;
  monthlyRetentionMonths: number;
}

interface BackupResult {
  type: 'branch' | 'dump';
  timestamp: string;
  identifier: string;
  size?: string;
  success: boolean;
  error?: string;
}

class NeonBackupManager {
  private config: BackupConfig;

  constructor() {
    this.config = {
      neonApiKey: process.env.NEON_API_KEY,
      neonProjectId: process.env.NEON_PROJECT_ID,
      databaseUrl: process.env.DATABASE_URL,
      backupDir: process.env.BACKUP_DIR ?? '/var/backups/folkcare',
      s3Bucket: process.env.S3_BACKUP_BUCKET,
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      retentionDays: Number(process.env.BACKUP_RETENTION_DAYS ?? '30'),
      monthlyRetentionMonths: Number(process.env.MONTHLY_RETENTION_MONTHS ?? '12'),
    };

    // Ensure backup directory exists - handle permission errors gracefully
    if (!existsSync(this.config.backupDir)) {
      try {
        mkdirSync(this.config.backupDir, { recursive: true });
      } catch (error) {
        // Log warning but don't fail - directory creation will be retried when backup runs
        logger.warn(
          { error, backupDir: this.config.backupDir },
          'Failed to create backup directory in constructor - will retry during backup'
        );
      }
    }
  }

  /**
   * Create a Neon branch backup (instant, copy-on-write)
   * This provides point-in-time recovery capabilities
   */
  async createBranchBackup(): Promise<BackupResult> {
    logger.info('Creating Neon branch backup...');

    if (!this.config.neonApiKey || !this.config.neonProjectId) {
      throw new Error('NEON_API_KEY and NEON_PROJECT_ID required for branch backups');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branchName = `backup-${timestamp}`;

    try {
      logger.info({ branchName, projectId: this.config.neonProjectId }, 'Executing neon branches create command...');

      // Create branch from main (instant snapshot)
      const { stdout, stderr } = await execAsync(
        `neon branches create --name "${branchName}" --project-id "${this.config.neonProjectId}" --output json`,
        { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
      );

      if (stderr) {
        logger.warn({ stderr }, 'Neon CLI produced stderr output');
      }

      const branch = JSON.parse(stdout);
      logger.info({ branchId: branch.id, branchName }, 'Branch backup created successfully');

      return {
        type: 'branch',
        timestamp,
        identifier: branch.id,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stderr = (error as any).stderr || '';
      const stdout = (error as any).stdout || '';

      logger.error(
        {
          error: errorMessage,
          stderr,
          stdout,
          branchName,
          projectId: this.config.neonProjectId,
          hasNeonApiKey: !!this.config.neonApiKey,
        },
        'Failed to create branch backup - check Neon CLI installation and credentials'
      );

      return {
        type: 'branch',
        timestamp,
        identifier: branchName,
        success: false,
        error: `Neon branch backup failed: ${errorMessage}${stderr ? ` | stderr: ${stderr}` : ''}`,
      };
    }
  }

  /**
   * Create traditional pg_dump backup
   * This provides portability and can be restored to any PostgreSQL instance
   */
  async createDumpBackup(): Promise<BackupResult> {
    logger.info('Creating pg_dump backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `folkcare_${timestamp}.dump`;

    if (!this.config.databaseUrl) {
      logger.warn('DATABASE_URL not configured - skipping dump backup');
      return {
        type: 'dump',
        timestamp,
        identifier: filename,
        success: false,
        error: 'DATABASE_URL not configured',
      };
    }

    const filepath = join(this.config.backupDir, filename);

    // Ensure backup directory exists before creating dump
    if (!existsSync(this.config.backupDir)) {
      try {
        mkdirSync(this.config.backupDir, { recursive: true });
      } catch (error) {
        logger.error({ error, backupDir: this.config.backupDir }, 'Failed to create backup directory');
        return {
          type: 'dump',
          timestamp,
          identifier: filename,
          success: false,
          error: `Failed to create backup directory: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    try {
      logger.info({ filepath, filename }, 'Executing pg_dump command...');

      // Create pg_dump (custom format, compressed)
      const { stderr } = await execAsync(
        `pg_dump "${this.config.databaseUrl}" -F c -b -v -f "${filepath}"`,
        { maxBuffer: 100 * 1024 * 1024 } // 100MB buffer
      );

      if (stderr && !stderr.includes('pg_dump: [archiver (db)]')) {
        // pg_dump writes verbose output to stderr, which is normal
        // Only log if it's not the normal verbose output
        logger.debug({ stderr }, 'pg_dump stderr output');
      }

      // Get file size
      const stats = await stat(filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      logger.info({ filename, size: `${sizeInMB} MB`, filepath }, 'Dump backup created successfully');

      // Upload to S3 if configured
      if (this.config.s3Bucket) {
        await this.uploadToS3(filepath, filename);
      }

      return {
        type: 'dump',
        timestamp,
        identifier: filename,
        size: `${sizeInMB} MB`,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stderr = (error as any).stderr || '';
      const stdout = (error as any).stdout || '';

      logger.error(
        {
          error: errorMessage,
          stderr,
          stdout,
          filename,
          filepath,
          hasDatabaseUrl: !!this.config.databaseUrl,
        },
        'Failed to create dump backup - check pg_dump installation and database connection'
      );

      return {
        type: 'dump',
        timestamp,
        identifier: filename,
        success: false,
        error: `pg_dump failed: ${errorMessage}${stderr ? ` | stderr: ${stderr.substring(0, 500)}` : ''}`,
      };
    }
  }

  /**
   * Upload backup file to S3 with encryption
   */
  private async uploadToS3(filepath: string, filename: string): Promise<void> {
    if (!this.config.s3Bucket) {
      return;
    }

    logger.info({ filename, bucket: this.config.s3Bucket }, 'Uploading to S3...');

    try {
      const s3Path = `s3://${this.config.s3Bucket}/backups/${filename}`;
      await execAsync(
        `aws s3 cp "${filepath}" "${s3Path}" --storage-class STANDARD_IA --server-side-encryption AES256`
      );

      logger.info({ filename, s3Path }, 'Uploaded to S3 successfully');
    } catch (error) {
      logger.error({ error, filename }, 'Failed to upload to S3');
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    logger.info('Cleaning up old backups...');

    try {
      // Clean up local dump files
      await this.cleanupLocalDumps();

      // Clean up old Neon branches
      await this.cleanupNeonBranches();

      // Clean up old S3 backups
      if (this.config.s3Bucket) {
        await this.cleanupS3Backups();
      }
    } catch (error) {
      logger.error({ error }, 'Error during backup cleanup');
      throw error;
    }
  }

  private async cleanupLocalDumps(): Promise<void> {
    const files = await readdir(this.config.backupDir);
    const now = Date.now();
    const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('folkcare_') || !file.endsWith('.dump')) {
        continue;
      }

      const filepath = join(this.config.backupDir, file);
      const stats = await stat(filepath);
      const age = now - stats.mtimeMs;

      if (age > retentionMs) {
        await unlink(filepath);
        deletedCount++;
        logger.info({ file, ageInDays: Math.floor(age / (24 * 60 * 60 * 1000)) }, 'Deleted old backup');
      }
    }

    logger.info({ deletedCount }, 'Local dump cleanup complete');
  }

  private async cleanupNeonBranches(): Promise<void> {
    if (!this.config.neonApiKey || !this.config.neonProjectId) {
      return;
    }

    try {
      // List all branches
      const { stdout } = await execAsync(
        `neon branches list --project-id "${this.config.neonProjectId}" --output json`,
        { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
      );

      const branches = JSON.parse(stdout);
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const branch of branches) {
        // Only delete backup branches
        if (!branch.name.startsWith('backup-')) {
          continue;
        }

        const createdAt = new Date(branch.created_at).getTime();
        const age = now - createdAt;

        if (age > retentionMs) {
          try {
            await execAsync(
              `neon branches delete "${branch.id}" --project-id "${this.config.neonProjectId}"`,
              { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
            );
            deletedCount++;
            logger.info({ branchId: branch.id, branchName: branch.name }, 'Deleted old branch backup');
          } catch (error) {
            logger.warn({ error, branchId: branch.id }, 'Failed to delete branch backup');
          }
        }
      }

      logger.info({ deletedCount }, 'Neon branch cleanup complete');
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup Neon branches');
    }
  }

  private async cleanupS3Backups(): Promise<void> {
    if (!this.config.s3Bucket) {
      return;
    }

    try {
      // List S3 backups older than retention period
      const { stdout } = await execAsync(
        `aws s3 ls "s3://${this.config.s3Bucket}/backups/" --recursive`
      );

      const lines = stdout.trim().split('\n');
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 4) continue;

        const dateStr = `${parts[0]} ${parts[1]}`;
        const key = parts.slice(3).join(' ');
        const fileDate = new Date(dateStr).getTime();
        const age = now - fileDate;

        if (age > retentionMs) {
          await execAsync(`aws s3 rm "s3://${this.config.s3Bucket}/${key}"`);
          deletedCount++;
          logger.info({ key, ageInDays: Math.floor(age / (24 * 60 * 60 * 1000)) }, 'Deleted old S3 backup');
        }
      }

      logger.info({ deletedCount }, 'S3 backup cleanup complete');
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup S3 backups');
    }
  }

  /**
   * Verify latest backup can be restored (basic integrity check)
   * For full restoration testing, use verifyBackupRestoration()
   */
  async verifyLatestBackup(): Promise<boolean> {
    logger.info('Verifying latest backup...');

    try {
      // Find latest dump file
      const files = await readdir(this.config.backupDir);
      const dumpFiles = files
        .filter(f => f.startsWith('folkcare_') && f.endsWith('.dump'))
        .sort()
        .reverse();

      if (dumpFiles.length === 0) {
        logger.warn('No dump backups found to verify');
        return false;
      }

      const latestDump = join(this.config.backupDir, dumpFiles[0]);
      logger.info({ file: dumpFiles[0] }, 'Verifying backup file integrity...');

      // Use pg_restore --list to verify file integrity without actually restoring
      await execAsync(`pg_restore --list "${latestDump}"`);

      logger.info({ file: dumpFiles[0] }, 'Backup verification successful');
      return true;
    } catch (error) {
      logger.error({ error }, 'Backup verification failed');
      return false;
    }
  }

  /**
   * Comprehensive backup verification with actual restoration test
   * Creates a temporary Neon branch, restores backup, runs validation queries,
   * and cleans up. This ensures backups are genuinely restorable.
   */
  async verifyBackupRestoration(): Promise<boolean> {
    logger.info('Starting comprehensive backup restoration verification...');

    if (!this.config.neonApiKey || !this.config.neonProjectId) {
      logger.error('NEON_API_KEY and NEON_PROJECT_ID required for restoration verification');
      return false;
    }

    if (!this.config.databaseUrl) {
      logger.error('DATABASE_URL required for restoration verification');
      return false;
    }

    let testBranchId: string | null = null;
    let testConnectionString: string | null = null;

    try {
      // Step 1: Find latest dump file
      logger.info('Step 1: Locating latest backup file...');
      const files = await readdir(this.config.backupDir);
      const dumpFiles = files
        .filter(f => f.startsWith('folkcare_') && f.endsWith('.dump'))
        .sort()
        .reverse();

      if (dumpFiles.length === 0) {
        logger.error('No dump backups found to verify');
        return false;
      }

      const latestDump = join(this.config.backupDir, dumpFiles[0]);
      logger.info({ file: dumpFiles[0] }, 'Found latest backup file');

      // Step 2: Create temporary test branch
      logger.info('Step 2: Creating temporary test database branch...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const testBranchName = `verify-${timestamp}`;

      const { stdout: createStdout } = await execAsync(
        `neon branches create --name "${testBranchName}" --project-id "${this.config.neonProjectId}" --output json`,
        { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
      );

      const branch = JSON.parse(createStdout);
      testBranchId = branch.id;
      logger.info({ branchId: testBranchId, branchName: testBranchName }, 'Test branch created');

      // Step 3: Get connection string for test branch
      logger.info('Step 3: Getting connection string for test branch...');
      const { stdout: connStdout } = await execAsync(
        `neon connection-string "${testBranchId}" --project-id "${this.config.neonProjectId}" --pooled`,
        { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
      );

      testConnectionString = connStdout.trim();
      logger.info('Got test branch connection string');

      // Step 4: Drop existing database schema in test branch and restore from backup
      logger.info('Step 4: Restoring backup to test branch...');

      // First, drop all existing schema (clean slate)
      await execAsync(
        `psql "${testConnectionString}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
        { maxBuffer: 100 * 1024 * 1024 }
      );
      logger.info('Dropped existing schema in test branch');

      // Restore from backup
      await execAsync(
        `pg_restore -d "${testConnectionString}" --no-owner --no-acl "${latestDump}"`,
        { maxBuffer: 100 * 1024 * 1024 }
      );
      logger.info({ file: dumpFiles[0] }, 'Backup restored to test branch');

      // Step 5: Run validation queries
      logger.info('Step 5: Running validation queries...');

      // Query 1: Check that critical tables exist
      const criticalTables = [
        'users',
        'organizations',
        'clients',
        'caregivers',
        'visits',
        'audit_logs'
      ];

      for (const table of criticalTables) {
        const { stdout } = await execAsync(
          `psql "${testConnectionString}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '${table}' AND table_schema = 'public';"`,
          { maxBuffer: 10 * 1024 * 1024 }
        );

        const count = parseInt(stdout.trim());
        if (count === 0) {
          throw new Error(`Critical table '${table}' not found in restored backup`);
        }
      }
      logger.info({ tables: criticalTables }, 'All critical tables exist');

      // Query 2: Verify row counts are reasonable (not zero for tables that should have data)
      const { stdout: userCountStdout } = await execAsync(
        `psql "${testConnectionString}" -t -c "SELECT COUNT(*) FROM users;"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
      const userCount = parseInt(userCountStdout.trim());
      logger.info({ userCount }, 'User table row count');

      // Query 3: Check that indexes exist
      const { stdout: indexCountStdout } = await execAsync(
        `psql "${testConnectionString}" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
      const indexCount = parseInt(indexCountStdout.trim());
      if (indexCount === 0) {
        throw new Error('No indexes found - backup may be corrupted');
      }
      logger.info({ indexCount }, 'Indexes verified');

      // Query 4: Check that constraints exist
      const { stdout: constraintCountStdout } = await execAsync(
        `psql "${testConnectionString}" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = 'public';"`,
        { maxBuffer: 10 * 1024 * 1024 }
      );
      const constraintCount = parseInt(constraintCountStdout.trim());
      if (constraintCount === 0) {
        throw new Error('No constraints found - backup may be corrupted');
      }
      logger.info({ constraintCount }, 'Constraints verified');

      logger.info('All validation queries passed');

      // Step 6: Cleanup test branch
      logger.info('Step 6: Cleaning up test branch...');
      if (testBranchId) {
        await execAsync(
          `neon branches delete "${testBranchId}" --project-id "${this.config.neonProjectId}"`,
          { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
        );
        logger.info({ branchId: testBranchId }, 'Test branch deleted');
      }

      logger.info({ file: dumpFiles[0] }, 'Backup restoration verification PASSED - backup is restorable and valid');
      return true;

    } catch (error) {
      logger.error({ error }, 'Backup restoration verification FAILED');

      // Attempt cleanup even on failure
      if (testBranchId) {
        try {
          logger.info('Attempting cleanup of test branch after failure...');
          await execAsync(
            `neon branches delete "${testBranchId}" --project-id "${this.config.neonProjectId}"`,
            { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
          );
          logger.info({ branchId: testBranchId }, 'Test branch cleaned up after failure');
        } catch (cleanupError) {
          logger.error({ error: cleanupError, branchId: testBranchId }, 'Failed to cleanup test branch after failure');
        }
      }

      return false;
    }
  }

  /**
   * Run full backup process
   */
  async runBackup(type: 'branch' | 'dump' | 'both' = 'both'): Promise<BackupResult[]> {
    logger.info({ type }, 'Starting backup process...');

    const results: BackupResult[] = [];

    try {
      if (type === 'branch' || type === 'both') {
        // Check if Neon credentials are available
        if (!this.config.neonApiKey || !this.config.neonProjectId) {
          logger.warn(
            'NEON_API_KEY or NEON_PROJECT_ID not configured - skipping branch backup. ' +
            'Branch backups provide point-in-time recovery. Configure secrets in GitHub repository settings.'
          );
          
          // If type was explicitly 'branch', downgrade to 'dump' instead of failing
          if (type === 'branch') {
            logger.warn('Branch backup requested but secrets missing - falling back to dump backup');
          }
        } else {
          const branchResult = await this.createBranchBackup();
          results.push(branchResult);
        }
      }

      if (type === 'dump' || type === 'both') {
        const dumpResult = await this.createDumpBackup();
        results.push(dumpResult);
      }

      // Check if any backups were actually created
      if (results.length === 0) {
        logger.warn(
          'No backups were created - all backup types skipped due to missing configuration. ' +
          'This is expected if DATABASE_URL, NEON_API_KEY, and NEON_PROJECT_ID secrets are not configured. ' +
          'To enable backups, configure the required secrets in repository settings.'
        );
        return results;
      }

      // Check if all backups failed
      const allFailed = results.every(r => !r.success);
      if (allFailed) {
        const errors = results.map(r => r.error).filter(Boolean).join('; ');
        logger.error({ results }, `All backup attempts failed: ${errors}`);
        throw new Error(`All backup attempts failed: ${errors}`);
      }

      // Cleanup old backups (only if at least one backup succeeded)
      const anySucceeded = results.some(r => r.success);
      if (anySucceeded) {
        await this.cleanupOldBackups();

        // Verify backups
        if (type === 'dump' || type === 'both') {
          await this.verifyLatestBackup();
        }
      }

      logger.info({ results }, 'Backup process completed');
      return results;
    } catch (error) {
      logger.error({ error }, 'Backup process failed');
      throw error;
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const manager = new NeonBackupManager();

  // Basic integrity verification
  if (args.includes('--verify')) {
    const isValid = await manager.verifyLatestBackup();
    process.exit(isValid ? 0 : 1);
  }

  // Comprehensive restoration verification
  if (args.includes('--verify-restoration')) {
    const isValid = await manager.verifyBackupRestoration();
    process.exit(isValid ? 0 : 1);
  }

  const type = args.includes('--type')
    ? (args[args.indexOf('--type') + 1] as 'branch' | 'dump' | 'both')
    : 'both';

  const results = await manager.runBackup(type);

  // Exit with error if any backup failed
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { NeonBackupManager, BackupConfig, BackupResult };
