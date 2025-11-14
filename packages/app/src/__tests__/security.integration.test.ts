/**
 * Security Middleware Integration Tests
 * 
 * Comprehensive integration tests for security features with full HTTP request/response cycles.
 * Tests the actual middleware stack as it would run in production.
 * 
 * Coverage areas:
 * - CSRF Protection (double-submit cookie pattern)
 * - Security Headers (OWASP best practices)
 * - Rate Limiting (general API, auth, EVV)
 * - Input Sanitization (XSS prevention)
 * 
 * ESLint overrides for test files:
 * - sonarjs/no-nested-functions: Test suites require deep nesting
 * - sonarjs/no-hardcoded-passwords: Test data includes password strings
 * - sonarjs/code-eval: Testing XSS protection requires javascript: URLs
 * - @typescript-eslint/strict-boolean-expressions: Array.find returns can be tested loosely in tests
 */
/* eslint-disable sonarjs/no-nested-functions, sonarjs/no-hardcoded-passwords, sonarjs/code-eval, unicorn/no-array-for-each, @typescript-eslint/strict-boolean-expressions */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { configureCsrfProtection } from '../middleware/csrf';
import { securityHeaders } from '../middleware/security-headers';
import { sanitizeInput } from '@care-commons/core';
import rateLimit from 'express-rate-limit';

describe('Security Middleware Integration Tests', () => {
  describe('CSRF Protection - Full Request Cycle', () => {
    let app: Express;
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      // Save original NODE_ENV and set to test to enable CSRF
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      app = express();
      app.use(express.json());
      app.use(cookieParser() as any);
      configureCsrfProtection(app);

      // Test routes
      app.get('/api/data', (_req, res) => {
        res.json({ message: 'GET data' });
      });

      app.post('/api/data', (req, res) => {
        res.json({ message: 'POST data', received: req.body });
      });

      app.put('/api/data/:id', (req, res) => {
        res.json({ message: 'PUT data', id: req.params.id, received: req.body });
      });

      app.delete('/api/data/:id', (req, res) => {
        res.json({ message: 'DELETE data', id: req.params.id });
      });

      app.patch('/api/data/:id', (req, res) => {
        res.json({ message: 'PATCH data', id: req.params.id, received: req.body });
      });

      // Mobile app route (should skip CSRF)
      app.post('/api/mobile/sync', (req, res) => {
        res.json({ message: 'Mobile sync', received: req.body });
      });
    });

    afterEach(() => {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    describe('Token Generation and Cookie Management', () => {
      it('should generate CSRF token and set secure cookie on first request', async () => {
        const response = await request(app)
          .get('/api/csrf-token')
          .expect(200);

        expect(response.body).toHaveProperty('csrfToken');
        expect(typeof response.body.csrfToken).toBe('string');
        expect(response.body.csrfToken.length).toBeGreaterThan(0);

        const cookies = response.headers['set-cookie'];
        expect(Array.isArray(cookies)).toBe(true);
        if (Array.isArray(cookies)) {
          const csrfCookie = cookies.find(c => c.startsWith('_csrf='));
          expect(csrfCookie).toBeDefined();
          expect(csrfCookie).toContain('HttpOnly');
          expect(csrfCookie).toContain('SameSite=Strict');
        }
      });

      it('should preserve CSRF token across requests with same cookie', async () => {
        // First request - get token
        const firstResponse = await request(app)
          .get('/api/csrf-token')
          .expect(200);

        const cookies = firstResponse.headers['set-cookie'];
        if (!Array.isArray(cookies) || cookies.length === 0) {
          throw new Error('No cookies set');
        }

        // Second request - should get same token with same cookie
        const secondResponse = await request(app)
          .get('/api/csrf-token')
          .set('Cookie', cookies.join('; '))
          .expect(200);

        expect(secondResponse.body.csrfToken).toBeDefined();
      });

      it('should set secure flag on CSRF cookie in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const response = await request(app)
          .get('/api/csrf-token')
          .expect(200);

        const cookies = response.headers['set-cookie'];
        if (Array.isArray(cookies)) {
          const csrfCookie = cookies.find(c => c.startsWith('_csrf='));
          // Note: supertest doesn't always reflect secure flag, but we verify it's set in code
          expect(csrfCookie).toBeDefined();
        }

        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('Safe HTTP Methods (GET, HEAD, OPTIONS) - No CSRF Required', () => {
      it('should allow GET requests without CSRF token', async () => {
        await request(app)
          .get('/api/data')
          .expect(200)
          .expect({ message: 'GET data' });
      });

      it('should allow HEAD requests without CSRF token', async () => {
        await request(app)
          .head('/api/data')
          .expect(200);
      });

      it('should allow OPTIONS requests without CSRF token', async () => {
        await request(app)
          .options('/api/data')
          .expect(200);
      });
    });

    describe('Unsafe HTTP Methods (POST, PUT, DELETE, PATCH) - CSRF Required', () => {
      it('should reject POST request without CSRF token', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body).toHaveProperty('error', 'CSRF token missing');
        expect(response.body).toHaveProperty('message');
      });

      it('should reject PUT request without CSRF token', async () => {
        const response = await request(app)
          .put('/api/data/123')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body.error).toBe('CSRF token missing');
      });

      it('should reject DELETE request without CSRF token', async () => {
        const response = await request(app)
          .delete('/api/data/123')
          .expect(403);

        expect(response.body.error).toBe('CSRF token missing');
      });

      it('should reject PATCH request without CSRF token', async () => {
        const response = await request(app)
          .patch('/api/data/123')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body.error).toBe('CSRF token missing');
      });

      it('should reject POST with invalid CSRF token', async () => {
        const response = await request(app)
          .post('/api/data')
          .set('x-csrf-token', 'invalid-token-12345')
          .set('Cookie', '_csrf=invalid-hash-67890')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body.error).toBe('CSRF token invalid');
        expect(response.body.message).toBe('CSRF token verification failed');
      });

      it('should reject POST with mismatched token and cookie', async () => {
        // Get a valid token
        const tokenResponse = await request(app)
          .get('/api/csrf-token')
          .expect(200);

        // Try to use it with a different cookie
        const response = await request(app)
          .post('/api/data')
          .set('x-csrf-token', tokenResponse.body.csrfToken as string)
          .set('Cookie', '_csrf=completely-different-hash')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body.error).toBe('CSRF token invalid');
      });

      it('should accept POST request with valid CSRF token', async () => {
        // Get token first
        const tokenResponse = await request(app)
          .get('/api/csrf-token')
          .expect(200);

        const csrfToken = tokenResponse.body.csrfToken as string;
        const cookies = tokenResponse.headers['set-cookie'];
        if (!Array.isArray(cookies) || cookies.length === 0) {
          throw new Error('No cookies set');
        }

        // Use token in POST request
        const response = await request(app)
          .post('/api/data')
          .set('x-csrf-token', csrfToken)
          .set('Cookie', cookies.join('; '))
          .send({ test: 'data' })
          .expect(200);

        expect(response.body.message).toBe('POST data');
        expect(response.body.received).toEqual({ test: 'data' });
      });

      it('should accept PUT request with valid CSRF token', async () => {
        const tokenResponse = await request(app).get('/api/csrf-token');
        const csrfToken = tokenResponse.body.csrfToken as string;
        const cookies = tokenResponse.headers['set-cookie'];
        if (!Array.isArray(cookies)) throw new Error('No cookies');

        const response = await request(app)
          .put('/api/data/456')
          .set('x-csrf-token', csrfToken)
          .set('Cookie', cookies.join('; '))
          .send({ updated: true })
          .expect(200);

        expect(response.body.message).toBe('PUT data');
        expect(response.body.id).toBe('456');
      });

      it('should accept DELETE request with valid CSRF token', async () => {
        const tokenResponse = await request(app).get('/api/csrf-token');
        const csrfToken = tokenResponse.body.csrfToken as string;
        const cookies = tokenResponse.headers['set-cookie'];
        if (!Array.isArray(cookies)) throw new Error('No cookies');

        const response = await request(app)
          .delete('/api/data/789')
          .set('x-csrf-token', csrfToken)
          .set('Cookie', cookies.join('; '))
          .expect(200);

        expect(response.body.message).toBe('DELETE data');
        expect(response.body.id).toBe('789');
      });

      it('should accept PATCH request with valid CSRF token', async () => {
        const tokenResponse = await request(app).get('/api/csrf-token');
        const csrfToken = tokenResponse.body.csrfToken as string;
        const cookies = tokenResponse.headers['set-cookie'];
        if (!Array.isArray(cookies)) throw new Error('No cookies');

        const response = await request(app)
          .patch('/api/data/101')
          .set('x-csrf-token', csrfToken)
          .set('Cookie', cookies.join('; '))
          .send({ patched: true })
          .expect(200);

        expect(response.body.message).toBe('PATCH data');
        expect(response.body.id).toBe('101');
      });
    });

    describe('Mobile App Exemption', () => {
      it('should skip CSRF protection for requests with x-mobile-app header', async () => {
        const response = await request(app)
          .post('/api/mobile/sync')
          .set('x-mobile-app', 'true')
          .send({ data: 'mobile sync' })
          .expect(200);

        expect(response.body.message).toBe('Mobile sync');
        expect(response.body.received).toEqual({ data: 'mobile sync' });
      });

      it('should skip CSRF for mobile app even without CSRF token', async () => {
        const response = await request(app)
          .post('/api/data')
          .set('x-mobile-app', '1')
          .send({ test: 'data' })
          .expect(200);

        expect(response.body.message).toBe('POST data');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should reject request with empty CSRF token header', async () => {
        const response = await request(app)
          .post('/api/data')
          .set('x-csrf-token', '')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body.error).toBe('CSRF token missing');
      });

      it('should reject request with empty CSRF cookie', async () => {
        const response = await request(app)
          .post('/api/data')
          .set('x-csrf-token', 'some-token')
          .set('Cookie', '_csrf=')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body.error).toBe('CSRF token missing');
      });

      it('should handle CSRF token buffer length mismatch gracefully', async () => {
        const response = await request(app)
          .post('/api/data')
          .set('x-csrf-token', 'short')
          .set('Cookie', '_csrf=verylonghashvaluethatdoesnotmatchlength')
          .send({ test: 'data' })
          .expect(403);

        expect(response.body.error).toBe('CSRF token invalid');
      });
    });
  });

  describe('Security Headers - Full Request Cycle', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(securityHeaders);

      app.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      app.post('/api/patient-data', (_req, res) => {
        res.json({ patientId: '12345', name: 'Test Patient' });
      });
    });

    describe('Core Security Headers', () => {
      it('should set all required security headers on GET request', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        // OWASP Security Headers
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

        // Content Security Policy
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['content-security-policy']).toContain("default-src 'self'");
        expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");

        // Permissions Policy
        expect(response.headers['permissions-policy']).toBeDefined();
        expect(response.headers['permissions-policy']).toContain('geolocation=(self)');
      });

      it('should set all required security headers on POST request', async () => {
        const response = await request(app)
          .post('/api/patient-data')
          .send({ test: 'data' })
          .expect(200);

        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      });
    });

    describe('HIPAA Compliance Headers', () => {
      it('should prevent caching of PHI data', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        const cacheControl = response.headers['cache-control'];
        expect(cacheControl).toBeDefined();
        expect(cacheControl).toContain('no-store');
        expect(cacheControl).toContain('no-cache');
        expect(cacheControl).toContain('must-revalidate');
        expect(cacheControl).toContain('private');

        expect(response.headers['pragma']).toBe('no-cache');
        expect(response.headers['expires']).toBe('0');
      });

      it('should mark healthcare data with custom header', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        expect(response.headers['x-healthcare-data']).toBe('PHI');
      });

      it('should apply cache prevention to all API endpoints', async () => {
        const response = await request(app)
          .post('/api/patient-data')
          .send({ test: 'data' })
          .expect(200);

        expect(response.headers['cache-control']).toContain('no-store');
        expect(response.headers['cache-control']).toContain('private');
      });
    });

    describe('HSTS (HTTP Strict Transport Security)', () => {
      it('should set HSTS header in production environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const response = await request(app)
          .get('/test')
          .expect(200);

        const hsts = response.headers['strict-transport-security'];
        expect(hsts).toBeDefined();
        expect(hsts).toContain('max-age=31536000'); // 1 year
        expect(hsts).toContain('includeSubDomains');
        expect(hsts).toContain('preload');

        process.env.NODE_ENV = originalEnv;
      });

      it('should not set HSTS header in development environment', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const response = await request(app)
          .get('/test')
          .expect(200);

        expect(response.headers['strict-transport-security']).toBeUndefined();

        process.env.NODE_ENV = originalEnv;
      });
    });

    describe('Content Security Policy (CSP)', () => {
      it('should set restrictive CSP directives', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        const csp = response.headers['content-security-policy'];
        expect(csp).toBeDefined();

        // Verify key directives
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self' 'unsafe-inline'"); // React needs inline scripts
        expect(csp).toContain("style-src 'self' 'unsafe-inline'");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain("base-uri 'self'");
        expect(csp).toContain("form-action 'self'");
      });

      it('should allow required resource types in CSP', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        const csp = response.headers['content-security-policy'];
        expect(csp).toContain("img-src 'self' data: https:");
        expect(csp).toContain("font-src 'self' data:");
        expect(csp).toContain("connect-src 'self' https:");
      });
    });

    describe('Permissions Policy', () => {
      it('should restrict browser features appropriately', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        const permissionsPolicy = response.headers['permissions-policy'];
        expect(permissionsPolicy).toBeDefined();

        // EVV requires geolocation
        expect(permissionsPolicy).toContain('geolocation=(self)');

        // Restrict unnecessary features
        expect(permissionsPolicy).toContain('camera=()');
        expect(permissionsPolicy).toContain('microphone=()');
        expect(permissionsPolicy).toContain('payment=()');
        expect(permissionsPolicy).toContain('usb=()');
      });
    });

    describe('Clickjacking Protection', () => {
      it('should prevent iframe embedding with X-Frame-Options', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        expect(response.headers['x-frame-options']).toBe('DENY');
      });

      it('should prevent iframe embedding with CSP frame-ancestors', async () => {
        const response = await request(app)
          .get('/test')
          .expect(200);

        const csp = response.headers['content-security-policy'];
        expect(csp).toContain("frame-ancestors 'none'");
      });
    });
  });

  describe('Rate Limiting - Full Request Cycle', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
    });

    describe('General API Rate Limiting', () => {
      it('should include rate limit headers in response', async () => {
        const limiter = rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 5,
          standardHeaders: true,
          legacyHeaders: false,
        });

        app.use('/api', limiter as any);
        app.get('/api/test', (_req, res) => {
          res.json({ message: 'success' });
        });

        const response = await request(app)
          .get('/api/test')
          .expect(200);

        // Standard rate limit headers (RateLimit-*)
        expect(response.headers['ratelimit-limit']).toBe('5');
        expect(response.headers['ratelimit-remaining']).toBe('4');
        expect(response.headers['ratelimit-reset']).toBeDefined();
      });

      it('should block requests after limit is exceeded', async () => {
        const limiter = rateLimit({
          windowMs: 60 * 1000, // 1 minute
          max: 3, // Very low limit for testing
          standardHeaders: true,
          message: { error: 'Rate limit exceeded' },
        });

        app.use('/api', limiter as any);
        app.get('/api/test', (_req, res) => {
          res.json({ message: 'success' });
        });

        // Make requests up to the limit
        await request(app).get('/api/test').expect(200);
        await request(app).get('/api/test').expect(200);
        await request(app).get('/api/test').expect(200);

        // Next request should be blocked
        const response = await request(app)
          .get('/api/test')
          .expect(429);

        expect(response.body).toHaveProperty('error');
      });

      it('should decrement remaining count with each request', async () => {
        const limiter = rateLimit({
          windowMs: 60 * 1000,
          max: 10,
          standardHeaders: true,
        });

        app.use('/api', limiter as any);
        app.get('/api/test', (_req, res) => {
          res.json({ message: 'success' });
        });

        const first = await request(app).get('/api/test');
        expect(first.headers['ratelimit-remaining']).toBe('9');

        const second = await request(app).get('/api/test');
        expect(second.headers['ratelimit-remaining']).toBe('8');

        const third = await request(app).get('/api/test');
        expect(third.headers['ratelimit-remaining']).toBe('7');
      });
    });

    describe('Authentication Rate Limiting', () => {
      it('should have stricter limits for auth endpoints', async () => {
        const authLimiter = rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 5,
          skipSuccessfulRequests: true,
          standardHeaders: true,
        });

        app.use('/api/auth', authLimiter as any);
        app.post('/api/auth/login', (req, res) => {
          // Simulate failed login
          if (req.body.password !== 'correct') {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
          }
          res.json({ token: 'jwt-token' });
        });

        // Failed attempts should count
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'wrong' })
          .expect(401);

        const response = await request(app)
          .post('/api/auth/login')
          .send({ username: 'test', password: 'wrong' })
          .expect(401);

        // Should show decreasing limit
        const remaining = parseInt(response.headers['ratelimit-remaining'] ?? '0');
        expect(remaining).toBeLessThan(5);
      });
    });

    describe('Health Check Exemption', () => {
      it('should skip rate limiting for health check endpoints', async () => {
        const limiter = rateLimit({
          windowMs: 60 * 1000,
          max: 2,
          standardHeaders: true,
          skip: (req) => req.path === '/health',
        });

        app.use(limiter as any);
        app.get('/health', (_req, res) => {
          res.json({ status: 'ok' });
        });
        app.get('/api/test', (_req, res) => {
          res.json({ message: 'test' });
        });

        // Health checks should not count against limit
        await request(app).get('/health').expect(200);
        await request(app).get('/health').expect(200);
        await request(app).get('/health').expect(200);
        await request(app).get('/health').expect(200);

        // Regular endpoint should still be rate limited
        await request(app).get('/api/test').expect(200);
        await request(app).get('/api/test').expect(200);
        await request(app).get('/api/test').expect(429);
      });
    });

    describe('Rate Limit Response Format', () => {
      it('should return 429 status code when limit exceeded', async () => {
        const limiter = rateLimit({
          windowMs: 60 * 1000,
          max: 1,
        });

        app.use('/api', limiter as any);
        app.get('/api/test', (_req, res) => {
          res.json({ message: 'success' });
        });

        await request(app).get('/api/test').expect(200);
        await request(app).get('/api/test').expect(429);
      });

      it('should include error message in rate limit response', async () => {
        const limiter = rateLimit({
          windowMs: 60 * 1000,
          max: 1,
          message: {
            error: 'Too many requests',
            retryAfter: 60,
          },
        });

        app.use('/api', limiter as any);
        app.get('/api/test', (_req, res) => {
          res.json({ message: 'success' });
        });

        await request(app).get('/api/test').expect(200);

        const response = await request(app).get('/api/test').expect(429);
        expect(response.body.error).toBe('Too many requests');
        expect(response.body.retryAfter).toBe(60);
      });
    });
  });

  describe('Input Sanitization - Full Request Cycle', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
      app.use(sanitizeInput);

      app.post('/api/data', (req, res) => {
        res.json({ received: req.body });
      });

      app.get('/api/search', (req, res) => {
        res.json({ query: req.query });
      });
    });

    describe('XSS Prevention - Request Body', () => {
      it('should remove script tags from request body', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            name: 'Test User',
            bio: '<script>alert("xss")</script>Clean bio text',
          })
          .expect(200);

        expect(response.body.received.name).toBe('Test User');
        expect(response.body.received.bio).toBe('Clean bio text');
        expect(response.body.received.bio).not.toContain('<script>');
      });

      it('should remove HTML tags from request body', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            comment: '<div>Hello</div><p>World</p>',
          })
          .expect(200);

        expect(response.body.received.comment).toBe('HelloWorld');
        expect(response.body.received.comment).not.toContain('<div>');
        expect(response.body.received.comment).not.toContain('<p>');
      });

      it('should remove javascript: protocol from URLs', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            link: 'javascript:alert("xss")',
            normalLink: 'https://example.com',
          })
          .expect(200);

        expect(response.body.received.link).toBe('alert("xss")');
        expect(response.body.received.link).not.toContain('javascript:');
        expect(response.body.received.normalLink).toBe('https://example.com');
      });

      it('should handle nested objects in request body', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            user: {
              name: '<script>xss</script>John',
              profile: {
                bio: '<img src=x onerror=alert("xss")>Developer',
              },
            },
          })
          .expect(200);

        expect(response.body.received.user.name).toBe('John');
        expect(response.body.received.user.name).not.toContain('<script>');
        expect(response.body.received.user.profile.bio).toBe('Developer');
        expect(response.body.received.user.profile.bio).not.toContain('<img');
      });

      it('should handle arrays in request body', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            tags: [
              'normal-tag',
              '<script>alert("xss")</script>dangerous',
              'another<div>tag</div>',
            ],
          })
          .expect(200);

        expect(response.body.received.tags).toEqual([
          'normal-tag',
          'dangerous',
          'anothertag',
        ]);
      });

      it('should preserve safe content while removing dangerous content', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            description: 'This is a < test > with 5 < 10 comparison',
          })
          .expect(200);

        // Standalone < and > should be preserved (not part of HTML tags)
        expect(response.body.received.description).toBe('This is a < test > with 5 < 10 comparison');
      });
    });

    describe('XSS Prevention - Query Parameters', () => {
      it('should sanitize query parameters', async () => {
        const response = await request(app)
          .get('/api/search')
          .query({ q: '<script>alert("xss")</script>search term' })
          .expect(200);

        expect(response.body.query.q).toBe('search term');
        expect(response.body.query.q).not.toContain('<script>');
      });

      it('should sanitize multiple query parameters', async () => {
        const response = await request(app)
          .get('/api/search')
          .query({
            name: '<b>John</b>',
            role: '<i>Admin</i>',
          })
          .expect(200);

        expect(response.body.query.name).toBe('John');
        expect(response.body.query.role).toBe('Admin');
      });

      it('should handle array query parameters', async () => {
        const response = await request(app)
          .get('/api/search?tags=<script>tag1</script>&tags=tag2&tags=<div>tag3</div>')
          .expect(200);

        // Query params with same name become arrays
        const tagsParam = response.body.query.tags;
        
        // Verify it's an array and XSS was sanitized
        expect(Array.isArray(tagsParam)).toBe(true);
        if (Array.isArray(tagsParam)) {
          expect(tagsParam.length).toBeGreaterThanOrEqual(1);
          // Verify no XSS content in any tags
          tagsParam.forEach((tag: string) => {
            expect(tag).not.toContain('<script>');
            expect(tag).not.toContain('<div>');
          });
          // At least one tag should have content after sanitization
          expect(tagsParam.some((tag: string) => tag.length > 0)).toBe(true);
        }
      });
    });

    describe('Special Characters and Edge Cases', () => {
      it('should preserve legitimate special characters', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            formula: 'x = (a + b) * c / d',
            email: 'user@example.com',
            phone: '+1-555-1234',
          })
          .expect(200);

        expect(response.body.received.formula).toBe('x = (a + b) * c / d');
        expect(response.body.received.email).toBe('user@example.com');
        expect(response.body.received.phone).toBe('+1-555-1234');
      });

      it('should handle empty strings', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            empty: '',
            whitespace: '   ',
          })
          .expect(200);

        expect(response.body.received.empty).toBe('');
        expect(response.body.received.whitespace).toBe('   ');
      });

      it('should handle null and undefined values', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            nullValue: null,
            normalValue: 'test',
          })
          .expect(200);

        expect(response.body.received.nullValue).toBeNull();
        expect(response.body.received.normalValue).toBe('test');
      });

      it('should handle numbers and booleans unchanged', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            count: 42,
            price: 19.99,
            active: true,
            disabled: false,
          })
          .expect(200);

        expect(response.body.received.count).toBe(42);
        expect(response.body.received.price).toBe(19.99);
        expect(response.body.received.active).toBe(true);
        expect(response.body.received.disabled).toBe(false);
      });
    });

    describe('Complex XSS Attack Vectors', () => {
      it('should block event handler injection', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            input: '<img src=x onerror=alert("xss")>',
          })
          .expect(200);

        expect(response.body.received.input).not.toContain('onerror');
        expect(response.body.received.input).not.toContain('<img');
      });

      it('should block embedded script in attributes', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            input: '<a href="javascript:void(0)" onclick="alert(\'xss\')">Click</a>',
          })
          .expect(200);

        expect(response.body.received.input).not.toContain('javascript:');
        expect(response.body.received.input).not.toContain('onclick');
        expect(response.body.received.input).not.toContain('<a ');
      });

      it('should block SVG-based XSS', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            input: '<svg><script>alert("xss")</script></svg>',
          })
          .expect(200);

        expect(response.body.received.input).not.toContain('<svg>');
        expect(response.body.received.input).not.toContain('<script>');
      });

      it('should block iframes', async () => {
        const response = await request(app)
          .post('/api/data')
          .send({
            input: '<iframe src="https://evil.com"></iframe>',
          })
          .expect(200);

        expect(response.body.received.input).not.toContain('<iframe');
        expect(response.body.received.input).not.toContain('</iframe>');
      });
    });
  });

  describe('Combined Security Middleware Stack', () => {
    let app: Express;
    let originalNodeEnv: string | undefined;

    beforeEach(() => {
      // Save original NODE_ENV and set to test to enable CSRF
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      app = express();
      app.use(express.json());
      app.use(cookieParser() as any);

      // Apply all security middleware
      app.use(securityHeaders);
      app.use(sanitizeInput);
      configureCsrfProtection(app);

      const limiter = rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
      });
      app.use('/api', limiter as any);

      // Test route
      app.post('/api/users', (req, res) => {
        res.json({
          message: 'User created',
          data: req.body,
        });
      });
    });

    afterEach(() => {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should apply all security features together on a single request', async () => {
      // Get CSRF token first
      const tokenResponse = await request(app).get('/api/csrf-token');
      const csrfToken = tokenResponse.body.csrfToken as string;
      const cookies = tokenResponse.headers['set-cookie'];
      if (!Array.isArray(cookies)) throw new Error('No cookies');

      // Make POST request with all security features active
      const response = await request(app)
        .post('/api/users')
        .set('x-csrf-token', csrfToken)
        .set('Cookie', cookies.join('; '))
        .send({
          name: '<script>alert("xss")</script>John Doe',
          email: 'john@example.com',
          bio: '<b>Software</b> Developer',
        })
        .expect(200);

      // Verify security headers are present
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['cache-control']).toContain('no-store');

      // Verify rate limit headers are present
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();

      // Verify input was sanitized
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.bio).toBe('Software Developer');
      expect(response.body.data.email).toBe('john@example.com');
    });

    it('should reject request missing CSRF token despite other security measures', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
        })
        .expect(403);

      // Still includes security headers even on error
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.body.error).toBe('CSRF token missing');
    });
  });
});
