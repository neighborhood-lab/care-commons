import { config as dotenvConfig } from 'dotenv';
import { Database } from '../packages/core/src/db/connection.js';

dotenvConfig({ path: '.env' });

async function testAnalyticsDirect() {
  const db = new Database({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons0',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  });

  try {
    // The same org ID that the admin user has
    const orgId = '0c5bf93f-7ad2-48eb-aa46-450271076bae';
    
    // Date range for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    console.log('🔍 Testing analytics queries directly...\n');
    console.log('Org ID:', orgId);
    console.log('Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);
    console.log('');
    
    // Test a raw query matching what the analytics repo does
    console.log('📊 Testing SCHEDULED visits query...');
    const scheduledResult = await db.query(`
      SELECT COUNT(*) as count
      FROM visits
      WHERE organization_id = $1
        AND status = ANY($2)
        AND scheduled_date BETWEEN $3 AND $4
    `, [orgId, ['SCHEDULED'], startDate, endDate]);
    console.log('Result:', scheduledResult.rows[0]);
    
    console.log('\n📊 Testing COMPLETED visits query...');
    const completedResult = await db.query(`
      SELECT COUNT(*) as count
      FROM visits
      WHERE organization_id = $1
        AND status = ANY($2)
        AND scheduled_date BETWEEN $3 AND $4
    `, [orgId, ['COMPLETED'], startDate, endDate]);
    console.log('Result:', completedResult.rows[0]);
    
    // Let's also test with a simpler query
    console.log('\n📊 Simple query test...');
    const simpleResult = await db.query(`
      SELECT COUNT(*) as count
      FROM visits
      WHERE organization_id = $1
        AND status = 'COMPLETED'
        AND scheduled_date BETWEEN $2 AND $3
    `, [orgId, startDate, endDate]);
    console.log('Simple result:', simpleResult.rows[0]);
    
    // Check what's actually in the date range
    console.log('\n📊 Visits in date range by status...');
    const statusResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM visits
      WHERE organization_id = $1
        AND scheduled_date BETWEEN $2 AND $3
      GROUP BY status
    `, [orgId, startDate, endDate]);
    console.log('Status breakdown:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

testAnalyticsDirect().catch(console.error);