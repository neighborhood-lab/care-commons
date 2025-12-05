#!/usr/bin/env tsx
/**
 * Database Type Generator
 *
 * Introspects the PostgreSQL database schema and generates TypeScript types.
 * This ensures type definitions stay in sync with the actual database structure.
 *
 * Usage:
 *   npm run db:generate-types
 *   or
 *   npx tsx scripts/generate-db-types.ts
 */

import dotenv from 'dotenv';
import knex, { Knex } from 'knex';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env', quiet: true });

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  udt_name: string;
}

interface TableInfo {
  table_name: string;
  table_schema: string;
}

function mapPostgresTypeToTS(pgType: string, udtName: string): string {
  // Handle specific UDT types
  if (udtName === 'uuid') return 'string';
  if (udtName === 'timestamptz' || udtName === 'timestamp') return 'Date | string';
  if (udtName === 'jsonb' || udtName === 'json') return 'Record<string, any>';
  if (udtName === 'bool') return 'boolean';
  if (udtName === 'int4' || udtName === 'int8' || udtName === 'float4' || udtName === 'float8' || udtName === 'numeric') return 'number';

  // Handle array types
  if (udtName.startsWith('_')) {
    const baseType = udtName.slice(1);
    return `${mapPostgresTypeToTS(pgType, baseType)}[]`;
  }

  // Common type mappings
  const typeMap: Record<string, string> = {
    'character varying': 'string',
    'varchar': 'string',
    'text': 'string',
    'char': 'string',
    'integer': 'number',
    'bigint': 'number',
    'smallint': 'number',
    'decimal': 'number',
    'numeric': 'number',
    'real': 'number',
    'double precision': 'number',
    'boolean': 'boolean',
    'date': 'Date | string',
    'timestamp': 'Date | string',
    'timestamp with time zone': 'Date | string',
    'timestamp without time zone': 'Date | string',
    'time': 'string',
    'uuid': 'string',
    'json': 'Record<string, any>',
    'jsonb': 'Record<string, any>',
    'bytea': 'Buffer',
    'ARRAY': 'any[]',
  };

  return typeMap[pgType] || 'any';
}

function toPascalCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

async function generateTypes() {
  console.log('🔍 Introspecting database schema...\n');

  // Build database connection
  const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'folk-care-0',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      };

  const db: Knex = knex({
    client: 'pg',
    connection: connectionConfig,
  });

  try {
    // Get all tables in the public schema
    const tables = await db.raw<{ rows: TableInfo[] }>(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    let output = `/**
 * Database Type Definitions
 *
 * Auto-generated from database schema.
 * Do not edit manually - run 'npm run db:generate-types' to regenerate.
 *
 * Generated: ${new Date().toISOString()}
 */

`;

    for (const table of tables.rows) {
      const tableName = table.table_name;

      // Get columns for this table
      const columns = await db.raw<{ rows: ColumnInfo[] }>(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ?
        ORDER BY ordinal_position
      `, [tableName]);

      // Generate interface name
      const interfaceName = toPascalCase(tableName.replace(/_revisions$/, 'Revision'));

      output += `/**\n * Table: ${tableName}\n */\n`;
      output += `export interface ${interfaceName} {\n`;

      for (const col of columns.rows) {
        const tsType = mapPostgresTypeToTS(col.data_type, col.udt_name);
        const isOptional = col.is_nullable === 'YES' || col.column_default !== null;
        const optionalMarker = isOptional ? '?' : '';

        // Add JSDoc comment for special columns
        if (col.column_name === 'id') {
          output += `  /** Primary key (UUID) */\n`;
        } else if (col.column_name === 'created_at') {
          output += `  /** Timestamp when record was created */\n`;
        } else if (col.column_name === 'updated_at') {
          output += `  /** Timestamp when record was last updated */\n`;
        } else if (col.column_name === 'is_deleted') {
          output += `  /** Soft delete flag */\n`;
        } else if (col.column_name === 'is_demo_data') {
          output += `  /** Flag indicating this is demo/seed data */\n`;
        }

        output += `  ${toCamelCase(col.column_name)}${optionalMarker}: ${tsType};\n`;
      }

      output += `}\n\n`;

      // Generate creation type (excludes auto-generated fields)
      const createInterfaceName = `Create${interfaceName}`;
      output += `/**\n * Input type for creating ${tableName}\n */\n`;
      output += `export type ${createInterfaceName} = Omit<${interfaceName}, 'id' | 'createdAt' | 'updatedAt'>;\n\n`;

      // Generate update type (all fields optional except id)
      const updateInterfaceName = `Update${interfaceName}`;
      output += `/**\n * Input type for updating ${tableName}\n */\n`;
      output += `export type ${updateInterfaceName} = Partial<Omit<${interfaceName}, 'id' | 'createdAt'>> & { id: string };\n\n`;
    }

    // Add database interface with all tables
    output += `/**\n * Database schema mapping\n */\n`;
    output += `export interface Database {\n`;
    for (const table of tables.rows) {
      const interfaceName = toPascalCase(table.table_name.replace(/_revisions$/, 'Revision'));
      output += `  ${toCamelCase(table.table_name)}: ${interfaceName};\n`;
    }
    output += `}\n`;

    // Write to file
    const outputPath = join(process.cwd(), 'packages/core/src/generated-types.ts');
    writeFileSync(outputPath, output, 'utf-8');

    console.log(`✅ Generated types for ${tables.rows.length} tables`);
    console.log(`📄 Output: ${outputPath}\n`);
    console.log('Tables processed:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));

  } catch (error) {
    console.error('❌ Error generating types:', error);
    await db.destroy();
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTypes().catch(console.error);
}

export { generateTypes };
