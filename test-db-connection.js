#!/usr/bin/env node

// Test database connection using DATABASE_URL
import pg from 'pg';
const { Pool } = pg;

async function testConnection() {
  console.log('Testing database connection...\n');

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('DATABASE_URL is set:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  let pool;
  try {
    // Parse the DATABASE_URL
    const url = new URL(databaseUrl);
    const config = {
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
    };

    console.log('\nConnection config:');
    console.log('  Host:', config.host);
    console.log('  Port:', config.port);
    console.log('  Database:', config.database);
    console.log('  User:', config.user);
    console.log('  SSL:', config.ssl ? 'enabled' : 'disabled');

    // Create connection pool
    pool = new Pool(config);

    // Test the connection with a simple query
    console.log('\nAttempting to connect...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to database!');

    // Run a test query
    console.log('\nRunning test query...');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version, current_database() as database');
    console.log('✅ Query successful!');
    console.log('\nDatabase info:');
    console.log('  Current time:', result.rows[0].current_time);
    console.log('  Database:', result.rows[0].database);
    console.log('  PostgreSQL version:', result.rows[0].pg_version.split(',')[0]);

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('  Tables in public schema:', tablesResult.rows[0].table_count);

    client.release();

    console.log('\n✅ Database connection test PASSED');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database connection test FAILED');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

testConnection();
