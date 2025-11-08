/**
 * Performance Testing Script
 *
 * Analyzes query performance for critical database operations
 * Identifies slow queries (>100ms) and N+1 query problems
 */

import dotenv from 'dotenv';
import knex, { Knex } from 'knex';
import { performance } from 'perf_hooks';

dotenv.config({ path: '.env', quiet: true });

interface QueryPerformance {
  query: string;
  duration: number;
  rowCount: number;
}

const env = process.env.NODE_ENV || 'development';
const dbName = process.env.DB_NAME || 'care_commons';

// Use DATABASE_URL if provided, otherwise build from individual DB_* variables
const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: env === 'test' ? `${dbName}_test` : dbName,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

// Build Knex config
const config: Knex.Config = {
  client: 'postgresql',
  connection: connectionConfig,
};

const db = knex(config);

async function analyzeQueries() {
  const results: QueryPerformance[] = [];
  console.log('🔍 Starting Query Performance Analysis...\n');

  // Enable query logging if verbose mode
  if (process.env.VERBOSE === 'true') {
    db.on('query', (query) => {
      console.log('📝 Query:', query.sql);
    });
  }

  try {
    // Test critical queries
    const queries = [
      {
        name: 'List clients (paginated)',
        fn: async () => await db('clients').select('*').where('deleted_at', null).limit(50)
      },
      {
        name: 'List visits today',
        fn: async () => {
          const today = new Date().toISOString().split('T')[0];
          return await db('visits')
            .where('scheduled_date', today)
            .where('deleted_at', null)
            .select('*');
        }
      },
      {
        name: 'List caregivers (active)',
        fn: async () => await db('caregivers')
          .where('status', 'ACTIVE')
          .where('deleted_at', null)
          .limit(50)
      },
      {
        name: 'User authentication lookup',
        fn: async () => await db('users')
          .where('email', 'admin@example.com')
          .where('deleted_at', null)
          .first()
      },
      {
        name: 'Visit schedule for caregiver',
        fn: async () => {
          const caregiver = await db('caregivers').where('deleted_at', null).first();
          if (!caregiver) return [];
          return await db('visits')
            .where('assigned_caregiver_id', caregiver.id)
            .where('deleted_at', null)
            .select('*')
            .limit(100);
        }
      },
      {
        name: 'Client visit history',
        fn: async () => {
          const client = await db('clients').where('deleted_at', null).first();
          if (!client) return [];
          return await db('visits')
            .where('client_id', client.id)
            .where('deleted_at', null)
            .orderBy('scheduled_date', 'desc')
            .limit(50);
        }
      },
      {
        name: 'EVV records for visit',
        fn: async () => {
          const visit = await db('visits').where('deleted_at', null).first();
          if (!visit) return [];
          return await db('evv_records')
            .where('visit_id', visit.id)
            .select('*');
        }
      },
      {
        name: 'Care plans for client',
        fn: async () => {
          const client = await db('clients').where('deleted_at', null).first();
          if (!client) return [];
          return await db('care_plans')
            .where('client_id', client.id)
            .where('deleted_at', null)
            .select('*');
        }
      },
      {
        name: 'Active open shifts',
        fn: async () => await db('open_shifts')
          .whereIn('matching_status', ['NEW', 'MATCHING', 'NO_MATCH'])
          .where('deleted_at', null)
          .limit(50)
      },
      {
        name: 'Pending invoices',
        fn: async () => await db('invoices')
          .where('status', 'PENDING')
          .where('deleted_at', null)
          .limit(50)
      },
      {
        name: 'Audit logs (recent)',
        fn: async () => await db('audit_logs')
          .orderBy('timestamp', 'desc')
          .limit(100)
      },
      {
        name: 'Task instances (due soon)',
        fn: async () => await db('task_instances')
          .where('status', 'PENDING')
          .where('due_date', '>=', new Date())
          .where('deleted_at', null)
          .limit(50)
      }
    ];

    for (const { name, fn } of queries) {
      try {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;

        results.push({
          query: name,
          duration,
          rowCount: Array.isArray(result) ? result.length : result ? 1 : 0
        });

        const statusIcon = duration > 100 ? '🐌' : duration > 50 ? '⚠️' : '✅';
        console.log(`${statusIcon} ${name}: ${duration.toFixed(2)}ms (${Array.isArray(result) ? result.length : result ? 1 : 0} rows)`);
      } catch (error) {
        console.error(`❌ ${name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Identify slow queries (>100ms)
    const slowQueries = results.filter(r => r.duration > 100);
    const moderateQueries = results.filter(r => r.duration > 50 && r.duration <= 100);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Performance Summary');
    console.log('='.repeat(60));

    if (slowQueries.length > 0) {
      console.warn('\n⚠️ Slow queries detected (>100ms):');
      slowQueries.forEach(q => console.warn(`  🐌 ${q.query}: ${q.duration.toFixed(2)}ms`));
    } else {
      console.log('\n✅ No slow queries detected (>100ms)');
    }

    if (moderateQueries.length > 0) {
      console.warn('\n⚠️ Moderate queries (50-100ms):');
      moderateQueries.forEach(q => console.warn(`  ⚠️  ${q.query}: ${q.duration.toFixed(2)}ms`));
    }

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    console.log(`\n📈 Average query duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`📊 Total queries tested: ${results.length}`);
    console.log(`✅ Fast queries (<50ms): ${results.filter(r => r.duration <= 50).length}`);
    console.log(`⚠️  Moderate queries (50-100ms): ${moderateQueries.length}`);
    console.log(`🐌 Slow queries (>100ms): ${slowQueries.length}`);

    if (slowQueries.length > 0 || moderateQueries.length > 0) {
      console.log('\n💡 Recommendations:');
      console.log('  1. Add indexes to frequently queried columns');
      console.log('  2. Optimize N+1 query patterns with joins');
      console.log('  3. Implement caching for frequently accessed data');
      console.log('  4. Use pagination for large result sets');
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run analysis
(async () => {
  try {
    await analyzeQueries();
    console.log('\n✨ Analysis complete!\n');
  } catch (err) {
    console.error('Analysis failed: ', err);
    process.exit(1);
  }
})();
