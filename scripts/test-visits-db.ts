import { config as dotenvConfig } from 'dotenv';
import { Database } from '../packages/core/src/db/connection.js';

dotenvConfig({ path: '.env' });

async function testVisitsDirectly() {
  // Use the individual database config variables from .env
  const db = new Database({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons0',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  });

  try {
    console.log('🔍 Testing database directly...\n');
    
    // 1. Check if visits table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'visits'
      );
    `);
    console.log('✅ Visits table exists:', tableCheck.rows[0].exists);
    
    // 2. Count total visits
    const totalVisits = await db.query(`
      SELECT COUNT(*) as total FROM visits;
    `);
    console.log('📊 Total visits in table:', totalVisits.rows[0].total);
    
    // 3. Count demo visits
    const demoVisits = await db.query(`
      SELECT COUNT(*) as total FROM visits WHERE is_demo_data = true;
    `);
    console.log('🎭 Demo visits:', demoVisits.rows[0].total);
    
    // 4. Check visit statuses
    const statuses = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM visits 
      WHERE is_demo_data = true 
      GROUP BY status;
    `);
    console.log('\n📈 Visit statuses:');
    statuses.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
    // 5. Check date ranges
    const dateRange = await db.query(`
      SELECT 
        MIN(scheduled_date) as earliest,
        MAX(scheduled_date) as latest,
        CURRENT_DATE as today
      FROM visits 
      WHERE is_demo_data = true;
    `);
    console.log('\n📅 Date range:');
    console.log('   Earliest:', dateRange.rows[0].earliest);
    console.log('   Latest:', dateRange.rows[0].latest);
    console.log('   Today:', dateRange.rows[0].today);
    
    // 6. Check organization IDs
    const orgs = await db.query(`
      SELECT organization_id, COUNT(*) as count 
      FROM visits 
      WHERE is_demo_data = true 
      GROUP BY organization_id;
    `);
    console.log('\n🏢 Visits by organization:');
    orgs.rows.forEach(row => {
      console.log(`   ${row.organization_id}: ${row.count} visits`);
    });
    
    // 7. Sample a visit to see its structure
    const sample = await db.query(`
      SELECT * FROM visits 
      WHERE is_demo_data = true 
      LIMIT 1;
    `);
    if (sample.rows.length > 0) {
      console.log('\n🔍 Sample visit columns:');
      console.log('   Columns:', Object.keys(sample.rows[0]).join(', '));
    }
    
    // 8. Check for visits in last 30 days
    const last30 = await db.query(`
      SELECT COUNT(*) as count
      FROM visits
      WHERE is_demo_data = true
        AND scheduled_date >= CURRENT_DATE - INTERVAL '30 days'
        AND scheduled_date <= CURRENT_DATE + INTERVAL '30 days';
    `);
    console.log('\n📊 Visits in last 30 days (±30):', last30.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

testVisitsDirectly().catch(console.error);