"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode ?? 500;
    const message = err.message;
    console.error('Error:', {
        statusCode,
        message,
        stack: err.stack,
        details: err.details,
    });
    res.status(statusCode).json({
        success: false,
        error: message,
        details: err.details,
        ...(process.env['NODE_ENV'] === 'development' ? {
            stack: err.stack,
        } : {}),
    });
}
function notFoundHandler(_req, res) {
    res.status(404).json({
        success: false,
        error: 'Resource not found',
    });
}
//# sourceMappingURL=error-handler.js.map