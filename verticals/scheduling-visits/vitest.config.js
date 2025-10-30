"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/__tests__/**/*.test.ts', 'src/**/?(*.)+(spec|test).ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/__tests__/**',
                'src/**/__mocks__/**',
                'src/index.ts',
            ],
            thresholds: {
                branches: 70,
                functions: 70,
                lines: 70,
                statements: 70,
            },
        },
    },
});
//# sourceMappingURL=vitest.config.js.map