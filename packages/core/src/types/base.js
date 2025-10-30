"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.PermissionError = exports.ValidationError = exports.DomainError = void 0;
class DomainError extends Error {
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'DomainError';
    }
}
exports.DomainError = DomainError;
class ValidationError extends DomainError {
    constructor(message, context) {
        super(message, 'VALIDATION_ERROR', context);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class PermissionError extends DomainError {
    constructor(message, context) {
        super(message, 'PERMISSION_DENIED', context);
        this.name = 'PermissionError';
    }
}
exports.PermissionError = PermissionError;
class NotFoundError extends DomainError {
    constructor(message, context) {
        super(message, 'NOT_FOUND', context);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends DomainError {
    constructor(message, context) {
        super(message, 'CONFLICT', context);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
//# sourceMappingURL=base.js.map