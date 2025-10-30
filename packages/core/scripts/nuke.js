"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const knex_1 = __importDefault(require("knex"));
const fs_1 = require("fs");
const path_1 = require("path");
const readline = __importStar(require("readline"));
dotenv_1.default.config({ path: '.env', quiet: true });
async function confirmNuke() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question('⚠️  WARNING: This will DROP ALL TABLES! Type "NUKE" to confirm: ', (answer) => {
            rl.close();
            resolve(answer === 'NUKE');
        });
    });
}
async function nukeDatabase() {
    const environment = process.env.NODE_ENV || 'development';
    const dbName = environment === 'test'
        ? (process.env.DB_NAME || 'care_commons') + '_test'
        : process.env.DB_NAME || 'care_commons';
    console.log('💣 Database Nuke Script\n');
    console.log(`Environment: ${environment}`);
    console.log(`Database: ${dbName}`);
    console.log(`Host: ${process.env.DB_HOST || 'localhost'}\n`);
    if (process.env.FORCE_NUKE !== 'true') {
        const confirmed = await confirmNuke();
        if (!confirmed) {
            console.log('\n❌ Nuke cancelled. Database is safe.');
            process.exit(0);
        }
    }
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
    };
    const db = (0, knex_1.default)(config);
    try {
        console.log('\n🔄 Reading nuke.sql script...');
        const nukeSqlPath = (0, path_1.join)(__dirname, 'nuke.sql');
        const nukeSql = (0, fs_1.readFileSync)(nukeSqlPath, 'utf-8');
        console.log('💥 Executing DROP statements...\n');
        await db.raw(nukeSql);
        console.log('✅ Database nuked successfully!');
        console.log('   - All tables dropped');
        console.log('   - All functions dropped');
        console.log('   - All extensions dropped');
        console.log('   - Migration tracking tables dropped');
        console.log('\n💡 Run `npm run db:migrate` to rebuild the database.');
    }
    catch (error) {
        console.error('\n❌ Nuke failed:', error);
        process.exit(1);
    }
    finally {
        await db.destroy();
    }
}
nukeDatabase().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=nuke.js.map