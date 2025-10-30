"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
exports.useAuthStore = (0, zustand_1.create)()((0, middleware_1.persist)((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
    clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
}), {
    name: 'auth-storage',
}));
const useAuth = () => {
    const { user, token, isAuthenticated, setAuth, clearAuth } = (0, exports.useAuthStore)();
    return {
        user,
        token,
        isAuthenticated,
        login: setAuth,
        logout: clearAuth,
    };
};
exports.useAuth = useAuth;
//# sourceMappingURL=auth.js.map