"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importDefault(require("path"));
exports.default = (0, config_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    },
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './src'),
            '@/core': path_1.default.resolve(__dirname, './src/core'),
            '@/verticals': path_1.default.resolve(__dirname, './src/verticals'),
            '@/app': path_1.default.resolve(__dirname, './src/app'),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map