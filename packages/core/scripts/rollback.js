"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const knex_1 = __importDefault(require("knex"));
dotenv_1.default.config({ path: '.env', quiet: true });
async function rollbackMigrations() {
    console.log('🔄 Rolling back last migration batch...\n');
    const environment = process.env.NODE_ENV || 'development';
    const config = {
        client: 'postgresql',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: environment === 'test'
                ? (process.env.DB_NAME || 'care_commons') + '_test'
                : process.env.DB_NAME || 'care_commons',
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
        const [batchNo, migrations] = await db.migrate.rollback();
        if (migrations.length === 0) {
            console.log('✨ No migrations to rollback!');
        }
        else {
            console.log(`✅ Batch ${batchNo} rolled back: ${migrations.length} migration(s)`);
            migrations.forEach((migration) => {
                console.log(`   📝 ${migration}`);
            });
        }
        const [completedMigrations] = await db.migrate.list();
        console.log(`\n📊 Remaining migrations: ${completedMigrations.length}`);
    }
    catch (error) {
        console.error('❌ Rollback failed:', error);
        process.exit(1);
    }
    finally {
        await db.destroy();
    }
}
rollbackMigrations().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=rollback.js.map