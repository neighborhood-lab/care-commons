"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePermissions = void 0;
const auth_1 = require("./auth");
const usePermissions = () => {
    const { user } = (0, auth_1.useAuth)();
    const can = (permission) => {
        if (!user)
            return false;
        return user.permissions.includes(permission);
    };
    const canAny = (permissions) => {
        if (!user)
            return false;
        return permissions.some((permission) => user.permissions.includes(permission));
    };
    const canAll = (permissions) => {
        if (!user)
            return false;
        return permissions.every((permission) => user.permissions.includes(permission));
    };
    const hasRole = (role) => {
        if (!user)
            return false;
        return user.roles.includes(role);
    };
    const hasAnyRole = (roles) => {
        if (!user)
            return false;
        return roles.some((role) => user.roles.includes(role));
    };
    return {
        can,
        canAny,
        canAll,
        hasRole,
        hasAnyRole,
    };
};
exports.usePermissions = usePermissions;
//# sourceMappingURL=permissions.js.map