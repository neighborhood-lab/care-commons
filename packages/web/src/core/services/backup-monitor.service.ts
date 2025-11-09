import { logger } from '@care-commons/core';
import { readFileSync } from 'fs';
import { join } from 'path';

interface BackupLogEntry {
  timestamp: string;
  backup_file: string;
  size: string;
  status: string;
}

export class BackupMonitorService {
  static async checkBackupHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    lastBackup: Date | null;
    backupAge: number; // hours
    backupSize: number; // bytes
    issues: string[];
  }> {
    const issues: string[] = [];
    const backupDir: string = process.env.BACKUP_DIR ?? '/var/backups/care-commons';

    try {
      // Read backup log
      const logPath = join(backupDir, 'backup.log');
      const logContent = readFileSync(logPath, 'utf-8');
      const logLines = logContent.trim().split('\n').filter(line => line.length > 0);

      if (logLines.length === 0) {
        throw new Error('Backup log is empty');
      }

      const lastLogLine = logLines[logLines.length - 1]!;
      const lastBackupLog: BackupLogEntry = JSON.parse(lastLogLine);

      const lastBackup = new Date(lastBackupLog.timestamp);
      const backupAge = (Date.now() - lastBackup.getTime()) / 1000 / 60 / 60; // hours

      // Check if backup is recent (< 26 hours for daily backups)
      if (backupAge > 26) {
        issues.push(`Last backup is ${backupAge.toFixed(1)} hours old (expected < 26 hours)`);
      }

      // Check if backup succeeded
      if (lastBackupLog.status !== 'success') {
        issues.push(`Last backup failed: ${lastBackupLog.status}`);
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 0) {
        status = backupAge > 48 ? 'critical' : 'warning';
      }

      return {
        status,
        lastBackup,
        backupAge,
        backupSize: 0, // Size is a string like "5.2M", return 0 for now
        issues,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to check backup health');
      return {
        status: 'critical',
        lastBackup: null,
        backupAge: 999,
        backupSize: 0,
        issues: ['Failed to read backup log'],
      };
    }
  }
}
