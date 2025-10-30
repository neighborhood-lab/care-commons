"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        environment: 'node',
        include: ['src/**/__tests__/**/*.ts', 'src/**/?(*.)+(spec|test).ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/__tests__/**',
                'src/index.ts',
            ],
            thresholds: {
                global: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70,
                },
            },
        },
    },
    resolve: {
        alias: {
            '@care-commons/core': '../../packages/core/src',
        },
    },
});
//# sourceMappingURL=vitest.config.js.map