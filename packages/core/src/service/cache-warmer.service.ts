import { ReferenceDataService } from './reference-data.service.js';
import { Database } from '../db/connection.js';

export class CacheWarmerService {
  private referenceDataService: ReferenceDataService;

  constructor(database: Database) {
    this.referenceDataService = new ReferenceDataService(database);
  }

  /**
   * Warm up cache with frequently accessed data
   * Run this on server startup
   */
  async warmCache(): Promise<void> {
    console.log('Warming cache...');

    try {
      // Warm reference data
      await this.referenceDataService.getServiceTypes();
      await this.referenceDataService.getTaskCategories();

      // Warm state compliance rules for all supported states
      const states = ['TX', 'FL', 'OH', 'PA', 'GA', 'NC', 'AZ'];
      await Promise.all(
        states.map(state =>
          this.referenceDataService.getStateComplianceRules(state)
        )
      );

      console.log('Cache warmed successfully');
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  }
}
