#!/usr/bin/env npx tsx
/**
 * Migration Template Generator
 *
 * Generates database migration templates with common patterns to reduce boilerplate
 * and ensure consistency across migrations.
 *
 * Usage:
 *   npx tsx scripts/generate-migration.ts --type=<type> --name=<name> [options]
 *
 * Types:
 *   add-table       Create a new table with standard columns
 *   add-column      Add column(s) to an existing table
 *   add-index       Add index to an existing table
 *   add-foreign-key Add foreign key constraint
 *   rename-column   Rename an existing column
 *   drop-column     Remove column from a table
 *
 * Examples:
 *   npx tsx scripts/generate-migration.ts --type=add-table --name=medications
 *   npx tsx scripts/generate-migration.ts --type=add-column --name=add_priority_to_tasks --table=tasks --column=priority
 *   npx tsx scripts/generate-migration.ts --type=add-index --name=idx_visits_date --table=visits --column=scheduled_date
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '../packages/core/migrations');

interface MigrationOptions {
  type: string;
  name: string;
  table?: string;
  column?: string;
  targetTable?: string;
  newName?: string;
}

function parseArgs(): MigrationOptions {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      options[match[1]] = match[2];
    }
  }

  if (!options.type || !options.name) {
    console.error('Usage: npx tsx scripts/generate-migration.ts --type=<type> --name=<name> [options]');
    console.error('\nTypes: add-table, add-column, add-index, add-foreign-key, rename-column, drop-column');
    console.error('\nOptions:');
    console.error('  --table=<table>       Target table name (required for most types)');
    console.error('  --column=<column>     Column name (for column operations)');
    console.error('  --targetTable=<table> Referenced table (for foreign keys)');
    console.error('  --newName=<name>      New column name (for rename-column)');
    process.exit(1);
  }

  return {
    type: options.type,
    name: options.name,
    table: options.table,
    column: options.column,
    targetTable: options.targetTable,
    newName: options.newName,
  };
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .split(/[_\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function generateAddTableTemplate(tableName: string): string {
  const snakeName = toSnakeCase(tableName);
  const pascalName = toPascalCase(tableName);

  return `import type { Knex } from 'knex';

/**
 * Create ${snakeName} table
 *
 * TODO: Update table structure according to requirements
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('${snakeName}', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations');

    // TODO: Add your columns here
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('status', 50).notNullable().defaultTo('ACTIVE');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.timestamp('deleted_at');
    table.uuid('deleted_by').references('id').inTable('users');

    // Demo data flag
    table.boolean('is_demo_data').notNullable().defaultTo(false);
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_${snakeName}_organization ON ${snakeName}(organization_id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX idx_${snakeName}_status ON ${snakeName}(status) WHERE deleted_at IS NULL');

  // Trigger to automatically update updated_at
  await knex.raw(\`
    CREATE TRIGGER update_${snakeName}_updated_at
      BEFORE UPDATE ON ${snakeName}
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  \`);

  // Table comment
  await knex.raw("COMMENT ON TABLE ${snakeName} IS 'TODO: Add table description'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_${snakeName}_updated_at ON ${snakeName}');
  await knex.schema.dropTableIfExists('${snakeName}');
}
`;
}

function generateAddColumnTemplate(tableName: string, columnName: string): string {
  const snakeTable = toSnakeCase(tableName);
  const snakeColumn = toSnakeCase(columnName);

  return `import type { Knex } from 'knex';

/**
 * Add ${snakeColumn} column to ${snakeTable} table
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('${snakeTable}', (table) => {
    // TODO: Adjust column type and constraints as needed
    table.string('${snakeColumn}', 255);
    // table.string('${snakeColumn}', 255).notNullable().defaultTo('');
    // table.integer('${snakeColumn}').notNullable().defaultTo(0);
    // table.boolean('${snakeColumn}').notNullable().defaultTo(false);
    // table.jsonb('${snakeColumn}').defaultTo('{}');
  });

  // Optional: Add index if the column will be queried frequently
  // await knex.raw('CREATE INDEX idx_${snakeTable}_${snakeColumn} ON ${snakeTable}(${snakeColumn}) WHERE deleted_at IS NULL');

  // Column comment
  await knex.raw("COMMENT ON COLUMN ${snakeTable}.${snakeColumn} IS 'TODO: Add column description'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('${snakeTable}', (table) => {
    table.dropColumn('${snakeColumn}');
  });
}
`;
}

function generateAddIndexTemplate(tableName: string, columnName: string): string {
  const snakeTable = toSnakeCase(tableName);
  const snakeColumn = toSnakeCase(columnName);
  const indexName = `idx_${snakeTable}_${snakeColumn}`;

  return `import type { Knex } from 'knex';

/**
 * Add index on ${snakeColumn} column in ${snakeTable} table
 */
export async function up(knex: Knex): Promise<void> {
  // Standard index with soft-delete filter
  await knex.raw(\`
    CREATE INDEX IF NOT EXISTS ${indexName}
    ON ${snakeTable}(${snakeColumn})
    WHERE deleted_at IS NULL
  \`);

  // Alternative index types (uncomment as needed):

  // Partial index for specific status
  // await knex.raw(\`
  //   CREATE INDEX IF NOT EXISTS ${indexName}_active
  //   ON ${snakeTable}(${snakeColumn})
  //   WHERE deleted_at IS NULL AND status = 'ACTIVE'
  // \`);

  // Composite index on multiple columns
  // await knex.raw(\`
  //   CREATE INDEX IF NOT EXISTS ${indexName}_composite
  //   ON ${snakeTable}(${snakeColumn}, other_column)
  //   WHERE deleted_at IS NULL
  // \`);

  // GIN index for JSONB columns
  // await knex.raw(\`
  //   CREATE INDEX IF NOT EXISTS ${indexName}_gin
  //   ON ${snakeTable} USING gin(${snakeColumn})
  // \`);

  // Full-text search index
  // await knex.raw(\`
  //   CREATE INDEX IF NOT EXISTS ${indexName}_fts
  //   ON ${snakeTable} USING gin(to_tsvector('english', ${snakeColumn}))
  //   WHERE deleted_at IS NULL
  // \`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS ${indexName}');
}
`;
}

function generateAddForeignKeyTemplate(tableName: string, columnName: string, targetTable: string): string {
  const snakeTable = toSnakeCase(tableName);
  const snakeColumn = toSnakeCase(columnName);
  const snakeTarget = toSnakeCase(targetTable);
  const constraintName = `fk_${snakeTable}_${snakeColumn}`;

  return `import type { Knex } from 'knex';

/**
 * Add foreign key from ${snakeTable}.${snakeColumn} to ${snakeTarget}.id
 */
export async function up(knex: Knex): Promise<void> {
  // First, add the column if it doesn't exist
  const hasColumn = await knex.schema.hasColumn('${snakeTable}', '${snakeColumn}');
  if (!hasColumn) {
    await knex.schema.alterTable('${snakeTable}', (table) => {
      table.uuid('${snakeColumn}');
    });
  }

  // Add the foreign key constraint
  await knex.raw(\`
    ALTER TABLE ${snakeTable}
    ADD CONSTRAINT ${constraintName}
    FOREIGN KEY (${snakeColumn})
    REFERENCES ${snakeTarget}(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
  \`);

  // Add index for the foreign key (improves JOIN performance)
  await knex.raw(\`
    CREATE INDEX IF NOT EXISTS idx_${snakeTable}_${snakeColumn}
    ON ${snakeTable}(${snakeColumn})
    WHERE deleted_at IS NULL
  \`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE ${snakeTable} DROP CONSTRAINT IF EXISTS ${constraintName}');
  await knex.raw('DROP INDEX IF EXISTS idx_${snakeTable}_${snakeColumn}');

  // Optionally drop the column
  // await knex.schema.alterTable('${snakeTable}', (table) => {
  //   table.dropColumn('${snakeColumn}');
  // });
}
`;
}

function generateRenameColumnTemplate(tableName: string, oldName: string, newName: string): string {
  const snakeTable = toSnakeCase(tableName);
  const snakeOld = toSnakeCase(oldName);
  const snakeNew = toSnakeCase(newName);

  return `import type { Knex } from 'knex';

/**
 * Rename column ${snakeOld} to ${snakeNew} in ${snakeTable} table
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('${snakeTable}', (table) => {
    table.renameColumn('${snakeOld}', '${snakeNew}');
  });

  // Update any indexes that reference the old column name
  // await knex.raw('DROP INDEX IF EXISTS idx_${snakeTable}_${snakeOld}');
  // await knex.raw('CREATE INDEX idx_${snakeTable}_${snakeNew} ON ${snakeTable}(${snakeNew}) WHERE deleted_at IS NULL');

  // Update column comment
  await knex.raw("COMMENT ON COLUMN ${snakeTable}.${snakeNew} IS 'Renamed from ${snakeOld}'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('${snakeTable}', (table) => {
    table.renameColumn('${snakeNew}', '${snakeOld}');
  });
}
`;
}

function generateDropColumnTemplate(tableName: string, columnName: string): string {
  const snakeTable = toSnakeCase(tableName);
  const snakeColumn = toSnakeCase(columnName);

  return `import type { Knex } from 'knex';

/**
 * Drop ${snakeColumn} column from ${snakeTable} table
 *
 * WARNING: This is a destructive operation. Data in this column will be lost.
 * Consider backing up data before running this migration.
 */
export async function up(knex: Knex): Promise<void> {
  // Drop any indexes on this column first
  await knex.raw('DROP INDEX IF EXISTS idx_${snakeTable}_${snakeColumn}');

  // Drop foreign key constraints if any
  // await knex.raw('ALTER TABLE ${snakeTable} DROP CONSTRAINT IF EXISTS fk_${snakeTable}_${snakeColumn}');

  await knex.schema.alterTable('${snakeTable}', (table) => {
    table.dropColumn('${snakeColumn}');
  });
}

export async function down(knex: Knex): Promise<void> {
  // WARNING: Cannot restore data that was in the column
  await knex.schema.alterTable('${snakeTable}', (table) => {
    // TODO: Recreate column with original type and constraints
    table.string('${snakeColumn}', 255);
  });
}
`;
}

function generateMigration(options: MigrationOptions): string {
  switch (options.type) {
    case 'add-table':
      return generateAddTableTemplate(options.name);

    case 'add-column':
      if (!options.table || !options.column) {
        console.error('add-column requires --table and --column options');
        process.exit(1);
      }
      return generateAddColumnTemplate(options.table, options.column);

    case 'add-index':
      if (!options.table || !options.column) {
        console.error('add-index requires --table and --column options');
        process.exit(1);
      }
      return generateAddIndexTemplate(options.table, options.column);

    case 'add-foreign-key':
      if (!options.table || !options.column || !options.targetTable) {
        console.error('add-foreign-key requires --table, --column, and --targetTable options');
        process.exit(1);
      }
      return generateAddForeignKeyTemplate(options.table, options.column, options.targetTable);

    case 'rename-column':
      if (!options.table || !options.column || !options.newName) {
        console.error('rename-column requires --table, --column, and --newName options');
        process.exit(1);
      }
      return generateRenameColumnTemplate(options.table, options.column, options.newName);

    case 'drop-column':
      if (!options.table || !options.column) {
        console.error('drop-column requires --table and --column options');
        process.exit(1);
      }
      return generateDropColumnTemplate(options.table, options.column);

    default:
      console.error(`Unknown migration type: ${options.type}`);
      console.error('Valid types: add-table, add-column, add-index, add-foreign-key, rename-column, drop-column');
      process.exit(1);
  }
}

function main(): void {
  const options = parseArgs();
  const timestamp = generateTimestamp();
  const snakeName = toSnakeCase(options.name);
  const filename = `${timestamp}_${snakeName}.ts`;
  const filepath = path.join(MIGRATIONS_DIR, filename);

  // Check if migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  // Generate migration content
  const content = generateMigration(options);

  // Write migration file
  fs.writeFileSync(filepath, content);

  console.log(`\nMigration created: ${filename}`);
  console.log(`Location: ${filepath}`);
  console.log('\nNext steps:');
  console.log('1. Edit the migration file to customize the schema');
  console.log('2. Run: npm run db:migrate');
  console.log('3. Test: npm run db:rollback && npm run db:migrate');
}

main();
