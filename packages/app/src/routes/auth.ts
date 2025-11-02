/**
 * Authentication Routes
 * 
 * Simple mock authentication for development
 * In production, this would integrate with proper auth providers
 */

import { Router } from 'express';

const router = Router();

// Mock user database - for development only
// In production, use proper authentication with hashed passwords
const MOCK_USER_PASSWORD = process.env['MOCK_USER_PASSWORD'] ?? 'default-dev-password';

const users = [
  {
    id: 'admin-001',
    email: 'admin@example.com',
    password: MOCK_USER_PASSWORD,
    name: 'Admin User',
    roles: ['ADMIN'],
    organizationId: 'org-001',
  },
  {
    id: 'caregiver-001',
    email: 'caregiver@example.com',
    password: MOCK_USER_PASSWORD,
    name: 'Caregiver User',
    roles: ['CAREGIVER'],
    organizationId: 'org-001',
  },
];

/**
 * POST /api/auth/login
 * Authenticate user and return user info
 */
router.post('/login', (req, res) => {
  // Validate request body exists
  if (req.body === undefined || req.body === null || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request body',
    });
  }

  const { email, password } = req.body;

  // Validate required fields
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required',
    });
  }

  // Find user by email
  const user = users.find(u => u.email === email && u.password === password);

  if (user === undefined) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
    });
  }

  // Return user info (in production, this would include JWT tokens)
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
      // Mock tokens - in production these would be real JWTs
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    },
  });
});

/**
 * POST /api/auth/logout
 * Logout user (mock implementation)
 */
router.post('/logout', (_req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', (_req, res) => {
  // In production, this would validate JWT and return user info
  // For now, return a mock user
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

/**
 * POST /api/auth/refresh
 * Refresh access token (mock implementation)
 */
router.post('/refresh', (_req, res) => {
  res.json({
    success: true,
    data: {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    },
  });
});

export default router;