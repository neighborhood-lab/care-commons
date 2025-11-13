#!/usr/bin/env node
/**
 * Test database connection script
 * Verifies PostgreSQL and Redis connectivity
 */

const { Client } = require('pg');
const redis = require('redis');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/care_commons';

async function testPostgreSQL() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log(`   URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ PostgreSQL: Connected successfully');

    // Test query
    const result = await client.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    console.log(`   Tables: ${result.rows[0].table_count} tables found`);

    // Check for key tables
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
      LIMIT 10
    `);
    console.log(`   Sample tables: ${tables.rows.map(r => r.table_name).join(', ')}`);

    // Check for users
    const users = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log(`   Users: ${users.rows[0].user_count} users in database`);

  } catch (error) {
    console.error('❌ PostgreSQL: Connection failed');
    console.error(`   Error: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}

async function testRedis() {
  console.log('\n🔍 Testing Redis connection...');
  console.log('   Host: localhost:6379');

  const redisClient = redis.createClient({
    socket: {
      host: 'localhost',
      port: 6379
    }
  });

  try {
    await redisClient.connect();
    console.log('✅ Redis: Connected successfully');

    // Test set/get
    await redisClient.set('test_key', 'test_value');
    const value = await redisClient.get('test_key');

    if (value === 'test_value') {
      console.log('   Test operation: Read/Write successful');
    }

    await redisClient.del('test_key');

  } catch (error) {
    console.error('❌ Redis: Connection failed');
    console.error(`   Error: ${error.message}`);
    throw error;
  } finally {
    await redisClient.quit();
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Database Connection Test');
  console.log('='.repeat(60));

  try {
    await testPostgreSQL();
    await testRedis();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All connections successful!');
    console.log('='.repeat(60));
    console.log('\n📊 Connection Details:');
    console.log(`   PostgreSQL: localhost:5432/care_commons`);
    console.log(`   Redis: localhost:6379`);
    console.log(`   DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
    console.log('\n👤 Admin Credentials:');
    console.log('   Email: admin@carecommons.example');
    console.log('   Password: Admin123!');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection test failed');
    process.exit(1);
  }
}

main();
