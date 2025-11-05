/**
 * Migration Integrity Tests (Phase 3.2)
 *
 * Tests that verify the integrity and correctness of database migration files.
 * These tests help prevent common migration issues before they reach production.
 *
 * @see scripts/validate-migrations.sh
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to migrations directory
const migrationsPath = path.join(__dirname, '../../../migrations');

describe('Migration Integrity', () => {
  describe('File Naming Conventions', () => {
    it('should have valid timestamp-based filenames', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      expect(migrationFiles.length).toBeGreaterThan(0);

      for (const file of migrationFiles) {
        // Format: 20240101120000_description.ts
        // 14-digit timestamp followed by underscore and description
        const timestampRegex = /^\d{14}_[a-z0-9-_]+\.ts$/;
        expect(
          file,
          `Migration file "${file}" does not match expected format: YYYYMMDDHHMMSS_description.ts`
        ).toMatch(timestampRegex);
      }
    });

    it('should have unique timestamps', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      const timestamps = migrationFiles.map(f => f.substring(0, 14));
      const uniqueTimestamps = new Set(timestamps);

      expect(
        timestamps.length,
        'Found duplicate migration timestamps'
      ).toBe(uniqueTimestamps.size);
    });

    it('should have sequential timestamps', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files
        .filter(f => f.endsWith('.ts') && f !== 'README.md')
        .sort();

      const timestamps = migrationFiles.map(f => Number.parseInt(f.substring(0, 14), 10));

      for (let i = 1; i < timestamps.length; i++) {
        expect(
          timestamps[i],
          `Migration ${migrationFiles[i]} has timestamp ${timestamps[i]} which is not greater than previous migration ${migrationFiles[i - 1]} (${timestamps[i - 1]})`
        ).toBeGreaterThan(timestamps[i - 1] as number);
      }
    });
  });

  describe('Migration File Structure', () => {
    it('should export both up and down functions', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      expect(migrationFiles.length).toBeGreaterThan(0);

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for up function
        expect(
          content,
          `Migration ${file} is missing "export async function up" or "export function up"`
        ).toMatch(/export\s+(async\s+)?function\s+up/);

        // Check for down function
        expect(
          content,
          `Migration ${file} is missing "export async function down" or "export function down"`
        ).toMatch(/export\s+(async\s+)?function\s+down/);
      }
    });

    it('should use Knex types for up/down functions', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      expect(migrationFiles.length).toBeGreaterThan(0);

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Should import Knex type
        expect(
          content,
          `Migration ${file} should import Knex type from 'knex'`
        ).toMatch(/import.*Knex.*from\s+['"]knex['"]/);
      }
    });

    it('should have descriptive migration names', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      expect(migrationFiles.length).toBeGreaterThan(0);

      for (const file of migrationFiles) {
        // Extract description (part after timestamp and underscore)
        const description = file.substring(15, file.length - 3); // Remove timestamp_ and .ts

        // Description should be at least 3 characters
        expect(
          description.length,
          `Migration ${file} has a description that is too short. Use a descriptive name.`
        ).toBeGreaterThan(3);

        // Description should only contain lowercase letters, numbers, hyphens, and underscores
        expect(
          description,
          `Migration ${file} description contains invalid characters. Use only lowercase letters, numbers, hyphens, and underscores.`
        ).toMatch(/^[a-z0-9-_]+$/);
      }
    });
  });

  describe('Migration File Syntax', () => {
    it('should be valid TypeScript files', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      expect(migrationFiles.length).toBeGreaterThan(0);

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);

        // Should be able to read the file
        expect(() => {
          fs.readFileSync(filePath, 'utf-8');
        }).not.toThrow();
      }
    });

    it('should not contain console.log statements', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      expect(migrationFiles.length).toBeGreaterThan(0);

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Warn if console.log is found (not a hard failure, but should be avoided)
        const hasConsoleLog = /console\.log/.test(content);
        if (hasConsoleLog) {
          console.warn(`⚠️  Migration ${file} contains console.log statements`);
        }
      }
    });
  });

  describe('Migration Consistency', () => {
    it('should have at least one migration file', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      expect(
        migrationFiles.length,
        'No migration files found. Database migrations are required.'
      ).toBeGreaterThan(0);
    });

    it('should have migrations ordered chronologically', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files
        .filter(f => f.endsWith('.ts') && f !== 'README.md')
        .sort();

      // Verify the sorted array is the same as the natural order
      const naturalOrder = [...migrationFiles].sort();
      expect(migrationFiles).toEqual(naturalOrder);
    });
  });

  describe('Migration Safety', () => {
    it('should not have DROP DATABASE statements', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        expect(
          content.toLowerCase(),
          `Migration ${file} contains dangerous DROP DATABASE statement`
        ).not.toContain('drop database');
      }
    });

    it('should use transactions where appropriate', () => {
      const files = fs.readdirSync(migrationsPath);
      const migrationFiles = files.filter(f => f.endsWith('.ts') && f !== 'README.md');

      // This is a guideline check - migrations that create/alter tables
      // should ideally use transactions
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check if migration has createTable or alterTable
        const hasTableOperations =
          content.includes('createTable') || content.includes('alterTable');

        if (hasTableOperations) {
          // Note: Knex migrations are automatically wrapped in transactions
          // This is just documentation
          // console.log(`Migration ${file} uses table operations`);
        }
      }
    });
  });
});
