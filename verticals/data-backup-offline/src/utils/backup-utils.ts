/**
 * Backup Utilities
 *
 * Helper functions for backup operations, retention calculations,
 * and snapshot management.
 */

import type {
  BackupConfiguration,
  BackupSnapshot,
  RetentionPolicy,
  BackupSchedule,
} from '../types/backup';
import type { Timestamp } from '@care-commons/core';

/**
 * Calculate next backup time based on schedule and timezone
 */
export function calculateNextBackupTime(
  schedule: BackupSchedule,
  timezone: string,
  fromDate: Date = new Date()
): Date {
  const now = fromDate;

  switch (schedule.frequency) {
    case 'CONTINUOUS':
      return now; // Immediate

    case 'HOURLY':
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      return nextHour;

    case 'DAILY':
      const nextDay = new Date(now);
      if (schedule.startTime) {
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        nextDay.setHours(hours, minutes, 0, 0);
        if (nextDay <= now) {
          nextDay.setDate(nextDay.getDate() + 1);
        }
      } else {
        nextDay.setDate(nextDay.getDate() + 1);
      }
      return nextDay;

    case 'WEEKLY':
      // Implementation would use daysOfWeek
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      return nextWeek;

    case 'MONTHLY':
      // Implementation would use dayOfMonth
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      return nextMonth;

    case 'CUSTOM':
      // Would parse cronExpression
      return now;

    default:
      return now;
  }
}

/**
 * Calculate snapshot expiration date based on retention policy
 */
export function calculateExpirationDate(
  snapshot: BackupSnapshot,
  retention: RetentionPolicy
): Date | null {
  if (retention.retentionDays === 0) {
    return null; // Indefinite retention
  }

  const createdAt = new Date(snapshot.createdAt);
  const expirationDate = new Date(createdAt);
  expirationDate.setDate(createdAt.getDate() + retention.retentionDays);

  return expirationDate;
}

/**
 * Check if snapshot is expired based on retention policy
 */
export function isSnapshotExpired(
  snapshot: BackupSnapshot,
  retention: RetentionPolicy
): boolean {
  if (snapshot.retentionLocked) {
    return false; // Retention locked snapshots never expire
  }

  if (retention.retentionDays === 0) {
    return false; // Indefinite retention
  }

  const expirationDate = calculateExpirationDate(snapshot, retention);
  if (!expirationDate) {
    return false;
  }

  return new Date() > expirationDate;
}

/**
 * Determine which snapshots to keep based on GFS retention
 * (Grandfather-Father-Son rotation scheme)
 */
export function applyGFSRetention(
  snapshots: BackupSnapshot[],
  retention: RetentionPolicy
): {
  keep: BackupSnapshot[];
  delete: BackupSnapshot[];
} {
  const now = new Date();
  const keep: BackupSnapshot[] = [];
  const remove: BackupSnapshot[] = [];

  // Sort by creation date descending
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const snapshot of sorted) {
    const age = Math.floor(
      (now.getTime() - new Date(snapshot.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    let shouldKeep = false;

    // Daily retention
    if (retention.dailyRetention && age <= retention.dailyRetention) {
      shouldKeep = true;
    }

    // Weekly retention (keep one per week)
    if (retention.weeklyRetention) {
      const weekAge = Math.floor(age / 7);
      if (weekAge <= retention.weeklyRetention) {
        // Keep first snapshot of each week
        shouldKeep = true;
      }
    }

    // Monthly retention (keep one per month)
    if (retention.monthlyRetention) {
      const monthAge = Math.floor(age / 30);
      if (monthAge <= retention.monthlyRetention) {
        shouldKeep = true;
      }
    }

    // Yearly retention (keep one per year)
    if (retention.yearlyRetention) {
      const yearAge = Math.floor(age / 365);
      if (yearAge <= retention.yearlyRetention) {
        shouldKeep = true;
      }
    }

    // Retention locked snapshots are always kept
    if (snapshot.retentionLocked) {
      shouldKeep = true;
    }

    if (shouldKeep) {
      keep.push(snapshot);
    } else {
      remove.push(snapshot);
    }
  }

  return { keep, delete: remove };
}

/**
 * Calculate checksum for data
 */
export async function calculateChecksum(
  data: string | Buffer,
  algorithm: 'SHA256' | 'SHA512' | 'BLAKE3' = 'SHA256'
): Promise<string> {
  // In real implementation, would use crypto library
  // For now, return a placeholder
  return `checksum-${algorithm}-placeholder`;
}

/**
 * Verify checksum matches
 */
export function verifyChecksum(data: string, expectedChecksum: string): boolean {
  // In real implementation, would calculate and compare
  return true;
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return compressedSize / originalSize;
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Estimate backup duration based on data size and historical averages
 */
export function estimateBackupDuration(
  dataSizeBytes: number,
  averageThroughputBytesPerSecond: number = 10 * 1024 * 1024 // 10 MB/s default
): number {
  if (averageThroughputBytesPerSecond === 0) {
    return 0;
  }

  return Math.ceil(dataSizeBytes / averageThroughputBytesPerSecond);
}

/**
 * Generate snapshot number
 */
export function generateSnapshotNumber(prefix: string = 'BKP'): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');

  return `${prefix}-${year}-${timestamp}${random}`;
}

/**
 * Parse cron expression to human-readable format
 */
export function parseCronExpression(cronExpression: string): string {
  // Simplified implementation
  // In real implementation, would use a cron parser library
  return `Custom schedule: ${cronExpression}`;
}

/**
 * Validate backup window
 */
export function isWithinBackupWindow(schedule: BackupSchedule, date: Date = new Date()): boolean {
  if (!schedule.startTime || !schedule.endTime) {
    return true; // No window restriction
  }

  const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
  const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const windowStart = startHours * 60 + startMinutes;
  const windowEnd = endHours * 60 + endMinutes;

  return currentMinutes >= windowStart && currentMinutes <= windowEnd;
}

/**
 * Calculate storage efficiency
 */
export function calculateStorageEfficiency(
  originalSize: number,
  storedSize: number
): {
  compressionSavings: number;
  compressionRatio: number;
  efficiency: number;
} {
  const compressionRatio = calculateCompressionRatio(originalSize, storedSize);
  const compressionSavings = originalSize - storedSize;
  const efficiency = compressionSavings / originalSize;

  return {
    compressionSavings,
    compressionRatio,
    efficiency,
  };
}
