import { getCacheService } from './cache.service';
import { CacheKeys, CacheTTL } from '../constants/cache-keys';
import { Database } from '../db/connection';

interface ServiceType extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface TaskCategory extends Record<string, unknown> {
  id: string;
  name: string;
  description?: string;
}

interface ComplianceRules extends Record<string, unknown> {
  id: string;
  state: string;
  rules: unknown;
}

export class ReferenceDataService {
  constructor(private db: Database) {}

  async getServiceTypes(): Promise<ServiceType[]> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.serviceTypes(),
      async () => {
        const result = await this.db.query<ServiceType>('SELECT * FROM service_types');
        return result.rows;
      },
      CacheTTL.VERY_LONG // Reference data rarely changes
    );
  }

  async getTaskCategories(): Promise<TaskCategory[]> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.taskCategories(),
      async () => {
        const result = await this.db.query<TaskCategory>('SELECT * FROM task_categories');
        return result.rows;
      },
      CacheTTL.VERY_LONG
    );
  }

  async getStateComplianceRules(state: string): Promise<ComplianceRules | null> {
    const cache = getCacheService();

    return cache.getOrSet(
      CacheKeys.stateComplianceRules(state),
      async () => {
        const result = await this.db.query<ComplianceRules>(
          'SELECT * FROM state_compliance_rules WHERE state = $1',
          [state]
        );
        return result.rows[0] ?? null;
      },
      CacheTTL.VERY_LONG
    );
  }
}
