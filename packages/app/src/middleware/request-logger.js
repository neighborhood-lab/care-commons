"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestLogger = createRequestLogger;
const morgan_1 = __importDefault(require("morgan"));
function createRequestLogger() {
    const format = process.env.NODE_ENV === 'production'
        ? 'combined'
        : 'dev';
    const options = {
        skip: (req) => {
            return req.url === '/health';
        },
    };
    return (0, morgan_1.default)(format, options);
}
//# sourceMappingURL=request-logger.js.map