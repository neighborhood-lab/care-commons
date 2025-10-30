"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const knex_1 = __importDefault(require("knex"));
dotenv_1.default.config({ path: '.env', quiet: true });
async function showMigrationStatus() {
    console.log('📊 Checking migration status...\n');
    const environment = process.env.NODE_ENV || 'development';
    const dbName = environment === 'test'
        ? (process.env.DB_NAME || 'care_commons') + '_test'
        : process.env.DB_NAME || 'care_commons';
    const config = {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: dbName,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        },
        migrations: {
            directory: './packages/core/migrations',
            tableName: 'knex_migrations',
            extension: 'ts',
            loadExtensions: ['.ts'],
        },
    };
    const db = (0, knex_1.default)(config);
    try {
        const [completed, pending] = await db.migrate.list();
        console.log(`Environment: ${environment}`);
        console.log(`Database: ${dbName}\n`);
        if (completed.length > 0) {
            console.log('✅ Completed migrations:');
            completed.forEach((migration) => {
                const name = typeof migration === 'string' ? migration : migration.file || migration.name;
                console.log(`   ${name}`);
            });
        }
        else {
            console.log('✅ No migrations have been run yet.');
        }
        if (pending.length > 0) {
            console.log('\n⏳ Pending migrations:');
            pending.forEach((migration) => {
                const name = typeof migration === 'string' ? migration : migration.file || migration.name;
                console.log(`   ${name}`);
            });
        }
        else {
            console.log('\n✨ Database is up to date!');
        }
        console.log(`\n📈 Summary: ${completed.length} completed, ${pending.length} pending`);
    }
    catch (error) {
        console.error('❌ Failed to check migration status:', error);
        process.exit(1);
    }
    finally {
        await db.destroy();
    }
}
showMigrationStatus().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=migrate-status.js.map