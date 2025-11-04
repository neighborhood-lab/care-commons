"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authContextMiddleware = authContextMiddleware;
exports.requireAuth = requireAuth;
function authContextMiddleware(req, _res, next) {
    const userId = req.header('X-User-Id') ?? 'system';
    const organizationId = req.header('X-Organization-Id') ?? '';
    const branchId = req.header('X-Branch-Id');
    const roles = (req.header('X-User-Roles') ?? 'CAREGIVER').split(',');
    const permissions = (req.header('X-User-Permissions') ?? '').split(',').filter(Boolean);
    req.userContext = {
        userId,
        organizationId,
        branchIds: branchId !== undefined ? [branchId] : [],
        roles,
        permissions,
    };
    next();
}
function requireAuth(req, res, next) {
    if (req.userContext?.userId === undefined) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
        return;
    }
    next();
}
//# sourceMappingURL=auth-context.js.map