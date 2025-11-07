import { database } from '../index.js';
import { Q } from '@nozbe/watermelondb';

// Helper function to get all client IDs
async function getClientIds(): Promise<string[]> {
  // This should be implemented based on your database schema
  // For now, return empty array
  return [];
}

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export class IntegrityChecker {
  static async verifyDatabase() {
    const issues: string[] = [];

    try {
      // Check for orphaned records
      const clientIds = await getClientIds();
      if (clientIds.length > 0) {
        const orphanedVisits = await database
          .get('visits')
          .query(Q.where('client_id', Q.notIn(clientIds)))
          .fetch();

        if (orphanedVisits.length > 0) {
          issues.push(`Found ${orphanedVisits.length} orphaned visits`);
        }
      }

      // Check for invalid timestamps
      const futureDate = addDays(new Date(), 365);
      const futureVisits = await database
        .get('visits')
        .query(Q.where('scheduled_date', Q.gt(futureDate.getTime())))
        .fetch();

      if (futureVisits.length > 0) {
        issues.push(`Found ${futureVisits.length} visits scheduled >1 year in future`);
      }

      // Check for duplicate records
      const duplicates = await this.findDuplicateRecords();
      if (duplicates.length > 0) {
        issues.push(`Found ${duplicates.length} duplicate records`);
      }
    } catch (error) {
      issues.push(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private static async findDuplicateRecords(): Promise<any[]> {
    // This is a simplified implementation
    // In a real scenario, you would check for duplicate records based on unique constraints
    const visits = await database.get('visits').query().fetch();
    const seen = new Map<string, any>();
    const duplicates: any[] = [];

    for (const visit of visits) {
      const key = `${visit.id}`;
      if (seen.has(key)) {
        duplicates.push(visit);
      } else {
        seen.set(key, visit);
      }
    }

    return duplicates;
  }

  static async repair() {
    // Remove orphaned records
    const clientIds = await getClientIds();
    if (clientIds.length > 0) {
      const orphanedVisits = await database
        .get('visits')
        .query(Q.where('client_id', Q.notIn(clientIds)))
        .fetch();

      await database.write(async () => {
        for (const visit of orphanedVisits) {
          await visit.destroyPermanently();
        }
      });

      console.log(`Removed ${orphanedVisits.length} orphaned visits`);
    }

    // Merge duplicates
    const duplicates = await this.findDuplicateRecords();
    if (duplicates.length > 0) {
      await database.write(async () => {
        for (const duplicate of duplicates) {
          await duplicate.destroyPermanently();
        }
      });

      console.log(`Removed ${duplicates.length} duplicate records`);
    }

    // Fix invalid timestamps - remove visits scheduled too far in the future
    const futureDate = addDays(new Date(), 365);
    const futureVisits = await database
      .get('visits')
      .query(Q.where('scheduled_date', Q.gt(futureDate.getTime())))
      .fetch();

    if (futureVisits.length > 0) {
      await database.write(async () => {
        for (const visit of futureVisits) {
          await visit.destroyPermanently();
        }
      });

      console.log(`Removed ${futureVisits.length} visits with invalid timestamps`);
    }

    console.log('Database repair completed');
  }
}
