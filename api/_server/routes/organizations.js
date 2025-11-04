"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganizationRouter = createOrganizationRouter;
const express_1 = require("express");
const core_1 = require("@care-commons/core");
function createOrganizationRouter(db) {
    const router = (0, express_1.Router)();
    const organizationService = new core_1.OrganizationService(db);
    router.post('/organizations/register', async (req, res) => {
        try {
            const request = req.body;
            const result = await organizationService.registerOrganization(request);
            res.status(201).json({
                success: true,
                data: {
                    organization: result.organization,
                    adminUserId: result.adminUserId,
                },
            });
        }
        catch (error) {
            if (error instanceof core_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            if (error instanceof core_1.ConflictError) {
                res.status(409).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            console.error('Organization registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to register organization',
            });
        }
    });
    router.get('/organizations/:id', async (req, res) => {
        try {
            const id = req.params['id'];
            if (id === undefined || id.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Organization ID is required',
                });
                return;
            }
            const organization = await organizationService.getOrganizationById(id);
            res.json({
                success: true,
                data: organization,
            });
        }
        catch (error) {
            if (error instanceof core_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            console.error('Get organization error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve organization',
            });
        }
    });
    router.post('/organizations/:id/invitations', async (req, res) => {
        try {
            const organizationId = req.params['id'];
            if (organizationId === undefined || organizationId.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Organization ID is required',
                });
                return;
            }
            const request = req.body;
            const userId = req.headers['x-user-id'];
            const createdBy = typeof userId === 'string' ? userId : 'admin-001';
            const invitation = await organizationService.createInvitation(organizationId, request, createdBy);
            res.status(201).json({
                success: true,
                data: invitation,
            });
        }
        catch (error) {
            if (error instanceof core_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            if (error instanceof core_1.ConflictError) {
                res.status(409).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            if (error instanceof core_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            console.error('Create invitation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create invitation',
            });
        }
    });
    router.get('/organizations/:id/invitations', async (req, res) => {
        try {
            const organizationId = req.params['id'];
            if (organizationId === undefined || organizationId.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Organization ID is required',
                });
                return;
            }
            const invitations = await organizationService.getOrganizationInvitations(organizationId);
            res.json({
                success: true,
                data: invitations,
            });
        }
        catch (error) {
            if (error instanceof core_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            console.error('Get invitations error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve invitations',
            });
        }
    });
    router.get('/invitations/:token', async (req, res) => {
        try {
            const token = req.params['token'];
            if (token === undefined || token.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Invitation token is required',
                });
                return;
            }
            const details = await organizationService.getInvitationDetails(token);
            res.json({
                success: true,
                data: details,
            });
        }
        catch (error) {
            if (error instanceof core_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            if (error instanceof core_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            console.error('Get invitation details error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve invitation details',
            });
        }
    });
    router.post('/invitations/accept', async (req, res) => {
        try {
            const request = req.body;
            const userId = await organizationService.acceptInvitation(request);
            res.status(201).json({
                success: true,
                data: {
                    userId,
                    message: 'Invitation accepted successfully',
                },
            });
        }
        catch (error) {
            if (error instanceof core_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            if (error instanceof core_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            console.error('Accept invitation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to accept invitation',
            });
        }
    });
    router.delete('/invitations/:token', async (req, res) => {
        try {
            const token = req.params['token'];
            if (token === undefined || token.length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'Invitation token is required',
                });
                return;
            }
            const userId = req.headers['x-user-id'];
            const revokedBy = typeof userId === 'string' ? userId : 'admin-001';
            await organizationService.revokeInvitation(token, revokedBy);
            res.json({
                success: true,
                message: 'Invitation revoked successfully',
            });
        }
        catch (error) {
            if (error instanceof core_1.NotFoundError) {
                res.status(404).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            if (error instanceof core_1.ValidationError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
                return;
            }
            console.error('Revoke invitation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to revoke invitation',
            });
        }
    });
    return router;
}
//# sourceMappingURL=organizations.js.map