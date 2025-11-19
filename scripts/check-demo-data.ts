import { config as dotenvConfig } from "dotenv";
import { Pool } from "pg";

dotenvConfig({ path: '.env', quiet: true });

async function checkVisits() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  const result = await pool.query(`
    SELECT 
      MIN(scheduled_start_time::date) as earliest_visit, 
      MAX(scheduled_start_time::date) as latest_visit,
      COUNT(*) as total_visits,
      COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_visits,
      CURRENT_DATE as today
    FROM visits 
    WHERE is_demo_data = true
  `);
  
  console.log('📅 Visit Date Range:');
  console.log(result.rows[0]);
  
  // Also check invoices
  const invoiceResult = await pool.query(`
    SELECT 
      COUNT(*) as total_invoices,
      SUM(total_amount) as total_billed,
      SUM(paid_amount) as total_paid,
      MIN(invoice_date) as earliest_invoice,
      MAX(invoice_date) as latest_invoice
    FROM invoices
    WHERE is_demo_data = true
  `);
  
  console.log('\n💰 Invoice Summary:');
  console.log(invoiceResult.rows[0]);
  
  await pool.end();
}

checkVisits().catch(console.error);
