"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const knex_1 = __importDefault(require("knex"));
dotenv_1.default.config({ path: '.env', quiet: true });
const env = process.env.NODE_ENV || 'development';
const dbName = process.env.DB_NAME || 'care_commons';
const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
async function runMigrations() {
    console.log('🔄 Starting database migrations with Knex...\n');
    let connection;
    if (process.env.DATABASE_URL) {
        connection = connectionConfig;
    }
    else {
        const database = env === 'test' ? `${dbName}_test` : dbName;
        connection = { ...connectionConfig, database };
    }
    const config = {
        client: 'postgresql',
        connection,
        migrations: {
            directory: './migrations',
            tableName: 'knex_migrations',
            extension: 'ts',
            loadExtensions: ['.ts'],
        },
    };
    const db = (0, knex_1.default)(config);
    try {
        const [batchNo, migrations] = await db.migrate.latest();
        if (migrations.length === 0) {
            console.log('✨ Database is already up to date!');
        }
        else {
            console.log(`✅ Batch ${batchNo} run: ${migrations.length} migration(s)`);
            migrations.forEach((migration) => {
                console.log(`   📝 ${migration}`);
            });
        }
        const [completedMigrations] = await db.migrate.list();
        console.log(`\n📊 Total migrations applied: ${completedMigrations.length}`);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
    finally {
        await db.destroy();
    }
}
async function createDatabase() {
    if (process.env.DATABASE_URL) {
        console.log('📝 Using DATABASE_URL, skipping database creation');
        return;
    }
    const config = {
        client: 'postgresql',
        connection: {
            ...connectionConfig,
            database: 'postgres',
        },
    };
    const db = (0, knex_1.default)(config);
    try {
        const existsResult = await db.raw(`SELECT 1 FROM pg_database WHERE datname = ?`, [dbName]);
        if (existsResult.rowCount === 0) {
            await db.raw(`CREATE DATABASE ${dbName} TEMPLATE template1`);
        }
    }
    finally {
        await db.destroy();
    }
}
(async () => {
    try {
        await createDatabase();
        await runMigrations();
    }
    catch (err) {
        console.error('Migration failed: ', err);
        process.exit(1);
    }
})();
//# sourceMappingURL=migrate.js.map