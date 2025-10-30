"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const users = [
    {
        id: 'admin-001',
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        roles: ['ADMIN'],
        organizationId: 'org-001',
    },
    {
        id: 'caregiver-001',
        email: 'caregiver@example.com',
        password: 'password123',
        name: 'Caregiver User',
        roles: ['CAREGIVER'],
        organizationId: 'org-001',
    },
];
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Invalid credentials',
        });
    }
    return res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles: user.roles,
                organizationId: user.organizationId,
            },
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
        },
    });
});
router.post('/logout', (_req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
router.get('/me', (_req, res) => {
    res.json({
        success: true,
        data: {
            id: 'admin-001',
            email: 'admin@example.com',
            name: 'Admin User',
            roles: ['ADMIN'],
            organizationId: 'org-001',
        },
    });
});
router.post('/refresh', (_req, res) => {
    res.json({
        success: true,
        data: {
            accessToken: 'mock-access-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
        },
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map