#!/usr/bin/env tsx

/**
 * Refresh Analytics Materialized Views
 *
 * This script refreshes all analytics materialized views to ensure
 * reports show the latest data. Should be run nightly via cron.
 *
 * Usage:
 *   npm run refresh-analytics
 *   or
 *   ./scripts/refresh-analytics.ts
 *
 * Cron schedule (runs at 2 AM daily):
 *   0 2 * * * cd /app && npm run refresh-analytics
 */

import { Database, initializeDatabase } from '@care-commons/core';

interface RefreshResult {
  view: string;
  success: boolean;
  duration: number;
  error?: string;
}

async function refreshAnalyticsViews(): Promise<void> {
  console.log('🔄 Starting analytics materialized views refresh...\n');

  // Initialize database connection
  const database = initializeDatabase({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'care_commons',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  });

  const results: RefreshResult[] = [];
  const overallStartTime = Date.now();

  try {
    // Check if the refresh function exists
    console.log('📋 Checking for refresh function...');
    const checkQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'refresh_analytics_views'
      ) as exists
    `;
    const checkResult = await database.query<{ exists: boolean }>(checkQuery);

    if (!checkResult.rows[0].exists) {
      console.error('❌ Error: refresh_analytics_views() function not found');
      console.error('Please run the analytics materialized views migration first');
      process.exit(1);
    }

    // Call the refresh function (refreshes all views)
    console.log('🔄 Refreshing all analytics views...\n');
    const startTime = Date.now();

    try {
      await database.query('SELECT refresh_analytics_views()');
      const duration = Date.now() - startTime;

      results.push({
        view: 'all views',
        success: true,
        duration,
      });

      console.log(`✅ All analytics views refreshed successfully in ${duration}ms\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      results.push({
        view: 'all views',
        success: false,
        duration,
        error: errorMessage,
      });

      console.error(`❌ Error refreshing views: ${errorMessage}\n`);
    }

    // Get statistics about the materialized views
    console.log('📊 Materialized View Statistics:\n');

    const statsQuery = `
      SELECT
        schemaname,
        matviewname as viewname,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size,
        last_refresh
      FROM pg_matviews
      WHERE matviewname IN (
        'daily_visit_summary',
        'monthly_caregiver_performance',
        'weekly_client_service_summary'
      )
      ORDER BY matviewname
    `;

    const statsResult = await database.query<{
      schemaname: string;
      viewname: string;
      size: string;
      last_refresh: Date | null;
    }>(statsQuery);

    if (statsResult.rows.length > 0) {
      statsResult.rows.forEach((row) => {
        const lastRefresh = row.last_refresh
          ? new Date(row.last_refresh).toLocaleString()
          : 'Never';
        console.log(`  • ${row.viewname}`);
        console.log(`    Schema: ${row.schemaname}`);
        console.log(`    Size: ${row.size}`);
        console.log(`    Last Refresh: ${lastRefresh}\n`);
      });
    } else {
      console.log('  No materialized views found\n');
    }

    // Summary
    const overallDuration = Date.now() - overallStartTime;
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log('━'.repeat(60));
    console.log('📈 Refresh Summary:');
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${failureCount}`);
    console.log(`  ⏱️  Total Duration: ${overallDuration}ms`);
    console.log('━'.repeat(60));

    if (failureCount > 0) {
      console.error('\n❌ Some views failed to refresh. Check logs above for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All analytics views refreshed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error during refresh:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run the refresh
refreshAnalyticsViews().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
