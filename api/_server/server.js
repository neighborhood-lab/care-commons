"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../.env', quiet: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const request_logger_1 = require("./middleware/request-logger");
const auth_context_1 = require("./middleware/auth-context");
const error_handler_1 = require("./middleware/error-handler");
const core_1 = require("@care-commons/core");
const index_1 = require("./routes/index");
const app = (0, express_1.default)();
const PORT = Number(process.env['PORT'] ?? 3000);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
function initDb() {
    const databaseUrl = process.env['DATABASE_URL'];
    if (databaseUrl !== undefined && databaseUrl !== '') {
        console.log('Using DATABASE_URL for connection');
        const url = new globalThis.URL(databaseUrl);
        const port = Number(url.port);
        const dbConfig = {
            host: url.hostname,
            port: port !== 0 ? port : 5432,
            database: url.pathname.slice(1),
            user: url.username,
            password: url.password,
            ssl: url.searchParams.get('sslmode') === 'require',
            max: 20,
            idleTimeoutMillis: 30000,
        };
        console.log('Database config:', {
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            ssl: dbConfig.ssl
        });
        return (0, core_1.initializeDatabase)(dbConfig);
    }
    const dbPassword = process.env['DB_PASSWORD'];
    if (dbPassword === undefined) {
        throw new Error('DATABASE_URL or DB_PASSWORD environment variable is required');
    }
    const dbConfig = {
        host: process.env['DB_HOST'] ?? 'localhost',
        port: Number(process.env['DB_PORT'] ?? 5432),
        database: process.env['DB_NAME'] ?? 'care_commons',
        user: process.env['DB_USER'] ?? 'postgres',
        password: dbPassword,
        ssl: process.env['DB_SSL'] === 'true' ? true : false,
        max: 20,
        idleTimeoutMillis: 30000,
    };
    console.log(`Initializing database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    return (0, core_1.initializeDatabase)(dbConfig);
}
function setupMiddleware() {
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));
    const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') ?? [];
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (typeof origin !== 'string') {
                callback(null, true);
                return;
            }
            if (NODE_ENV === 'development') {
                callback(null, true);
                return;
            }
            if (allowedOrigins.length === 0) {
                console.warn('⚠️  No CORS_ORIGIN configured - blocking all browser requests');
                callback(new Error('CORS not configured'), false);
                return;
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error(`Origin ${origin} not allowed by CORS`), false);
            }
        },
        credentials: true,
    }));
    app.use((0, request_logger_1.createRequestLogger)());
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    app.use(auth_context_1.authContextMiddleware);
}
function setupApiRoutes() {
    const db = (0, core_1.getDatabase)();
    app.get('/', (_req, res) => {
        res.json({
            name: 'Care Commons API',
            version: '0.1.0',
            environment: NODE_ENV,
            endpoints: {
                health: '/health',
                api: '/api',
                clients: '/api/clients',
                carePlans: '/api/care-plans',
            },
            documentation: 'http://localhost:3000/api',
        });
    });
    app.get('/api', (_req, res) => {
        res.json({
            name: 'Care Commons API',
            version: '0.1.0',
            environment: NODE_ENV,
        });
    });
    (0, index_1.setupRoutes)(app, db);
    app.use(error_handler_1.notFoundHandler);
    app.use(error_handler_1.errorHandler);
}
async function createApp() {
    console.log(`Initializing Care Commons API (${NODE_ENV})`);
    app.get('/health', async (_req, res) => {
        try {
            const startTime = Date.now();
            const db = (0, core_1.getDatabase)();
            const dbHealthy = await db.healthCheck();
            const responseTime = Date.now() - startTime;
            const status = dbHealthy === true ? 'healthy' : 'unhealthy';
            const httpStatus = dbHealthy === true ? 200 : 503;
            res.status(httpStatus).json({
                status,
                timestamp: new Date().toISOString(),
                environment: NODE_ENV,
                uptime: process.uptime(),
                responseTime,
                database: {
                    status: dbHealthy === true ? 'connected' : 'disconnected',
                    responseTime,
                },
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                },
            });
        }
        catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });
    const db = initDb();
    const isHealthy = await db.healthCheck();
    if (isHealthy !== true) {
        throw new Error('Database health check failed');
    }
    console.log('Database connection established');
    setupMiddleware();
    setupApiRoutes();
    return app;
}
async function start() {
    try {
        console.log(`Starting Care Commons API Server (${NODE_ENV})`);
        await createApp();
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on port ${PORT}`);
            console.log(`   Environment: ${NODE_ENV}`);
            console.log(`   Health check: http://localhost:${PORT}/health`);
            console.log(`   API docs: http://localhost:${PORT}/api\n`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    void (async () => {
        const db = (0, core_1.getDatabase)();
        await db.close();
        process.exit(0);
    })();
});
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    void (async () => {
        const db = (0, core_1.getDatabase)();
        await db.close();
        process.exit(0);
    })();
});
if (process.env['VERCEL'] === undefined && process.env['VERCEL_ENV'] === undefined) {
    start().catch(console.error);
}
//# sourceMappingURL=server.js.map