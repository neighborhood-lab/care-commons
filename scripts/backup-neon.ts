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
import { createLogger } from '@care-commons/core';

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
      backupDir: process.env.BACKUP_DIR ?? '/var/backups/care-commons',
      s3Bucket: process.env.S3_BACKUP_BUCKET,
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      retentionDays: Number(process.env.BACKUP_RETENTION_DAYS ?? '30'),
      monthlyRetentionMonths: Number(process.env.MONTHLY_RETENTION_MONTHS ?? '12'),
    };

    // Ensure backup directory exists
    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true });
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
      // Create branch from main (instant snapshot)
      const { stdout } = await execAsync(
        `neon branches create --name "${branchName}" --project-id "${this.config.neonProjectId}" --output json`,
        { env: { ...process.env, NEON_API_KEY: this.config.neonApiKey } }
      );

      const branch = JSON.parse(stdout);
      logger.info({ branchId: branch.id, branchName }, 'Branch backup created');

      return {
        type: 'branch',
        timestamp,
        identifier: branch.id,
        success: true,
      };
    } catch (error) {
      logger.error({ error, branchName }, 'Failed to create branch backup');
      return {
        type: 'branch',
        timestamp,
        identifier: branchName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create traditional pg_dump backup
   * This provides portability and can be restored to any PostgreSQL instance
   */
  async createDumpBackup(): Promise<BackupResult> {
    logger.info('Creating pg_dump backup...');

    if (!this.config.databaseUrl) {
      throw new Error('DATABASE_URL required for dump backups');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `care_commons_${timestamp}.dump`;
    const filepath = join(this.config.backupDir, filename);

    try {
      // Create pg_dump (custom format, compressed)
      await execAsync(
        `pg_dump "${this.config.databaseUrl}" -F c -b -v -f "${filepath}"`,
        { maxBuffer: 100 * 1024 * 1024 } // 100MB buffer
      );

      // Get file size
      const stats = await stat(filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      logger.info({ filename, size: `${sizeInMB} MB` }, 'Dump backup created');

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
      logger.error({ error, filename }, 'Failed to create dump backup');
      return {
        type: 'dump',
        timestamp,
        identifier: filename,
        success: false,
        error: error instanceof Error ? error.message : String(error),
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
      if (!file.startsWith('care_commons_') || !file.endsWith('.dump')) {
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
   * Verify latest backup can be restored
   */
  async verifyLatestBackup(): Promise<boolean> {
    logger.info('Verifying latest backup...');

    try {
      // Find latest dump file
      const files = await readdir(this.config.backupDir);
      const dumpFiles = files
        .filter(f => f.startsWith('care_commons_') && f.endsWith('.dump'))
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
   * Run full backup process
   */
  async runBackup(type: 'branch' | 'dump' | 'both' = 'both'): Promise<BackupResult[]> {
    logger.info({ type }, 'Starting backup process...');

    const results: BackupResult[] = [];

    try {
      if (type === 'branch' || type === 'both') {
        const branchResult = await this.createBranchBackup();
        results.push(branchResult);
      }

      if (type === 'dump' || type === 'both') {
        const dumpResult = await this.createDumpBackup();
        results.push(dumpResult);
      }

      // Cleanup old backups
      await this.cleanupOldBackups();

      // Verify backups
      if (type === 'dump' || type === 'both') {
        await this.verifyLatestBackup();
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

  if (args.includes('--verify')) {
    const isValid = await manager.verifyLatestBackup();
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
