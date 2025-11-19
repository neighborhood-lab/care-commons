import { config as dotenvConfig } from 'dotenv';
import { Database } from '../packages/core/src/db/connection.js';

dotenvConfig({ path: '.env' });

async function testEVV() {
  const db = new Database({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'care_commons0',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  });

  try {
    const orgId = '0c5bf93f-7ad2-48eb-aa46-450271076bae';
    
    console.log('🔍 Checking EVV records...\n');
    
    // Total EVV records
    const total = await db.query(`
      SELECT COUNT(*) as count FROM evv_records 
      WHERE organization_id = $1
    `, [orgId]);
    console.log('Total EVV records:', total.rows[0].count);
    
    // EVV by status
    const byStatus = await db.query(`
      SELECT record_status, COUNT(*) as count 
      FROM evv_records 
      WHERE organization_id = $1 
      GROUP BY record_status
    `, [orgId]);
    console.log('\nEVV by record_status:');
    byStatus.rows.forEach(row => console.log(`  ${row.record_status}: ${row.count}`));
    
    // EVV by verification level
    const byLevel = await db.query(`
      SELECT verification_level, COUNT(*) as count 
      FROM evv_records 
      WHERE organization_id = $1 
      GROUP BY verification_level
    `, [orgId]);
    console.log('\nEVV by verification_level:');
    byLevel.rows.forEach(row => console.log(`  ${row.verification_level}: ${row.count}`));
    
    // Compliant count (as analytics expects)
    const compliant = await db.query(`
      SELECT COUNT(*) as count
      FROM evv_records
      WHERE organization_id = $1
        AND record_status = 'COMPLETE'
        AND verification_level = 'FULL'
        AND compliance_flags = '[]'::jsonb
    `, [orgId]);
    console.log('\nCompliant (status=COMPLETE + level=FULL + no flags):', compliant.rows[0].count);
    
    // Flagged count
    const flagged = await db.query(`
      SELECT COUNT(*) as count
      FROM evv_records
      WHERE organization_id = $1
        AND jsonb_array_length(compliance_flags) > 0
    `, [orgId]);
    console.log('Flagged (has compliance_flags):', flagged.rows[0].count);
    
    // Sample record
    const sample = await db.query(`
      SELECT record_status, verification_level, compliance_flags
      FROM evv_records
      WHERE organization_id = $1
      LIMIT 5
    `, [orgId]);
    console.log('\nSample EVV records:');
    sample.rows.forEach((row, i) => {
      console.log(`  ${i+1}. status=${row.record_status}, level=${row.verification_level}, flags=${JSON.stringify(row.compliance_flags)}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

testEVV().catch(console.error);
