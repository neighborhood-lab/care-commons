import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { configureCsrfProtection } from '../csrf';

describe('CSRF Protection Middleware', () => {
  let app: Express;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Save original NODE_ENV and set to test/production to enable CSRF
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    app = express();
    app.use(express.json());
    app.use(cookieParser());

    // Configure CSRF protection
    configureCsrfProtection(app);

    // Add test routes
    app.post('/api/test', (_req, res) => {
      res.json({ success: true, message: 'POST successful' });
    });

    app.get('/api/test', (_req, res) => {
      res.json({ success: true, message: 'GET successful' });
    });

    app.put('/api/test', (_req, res) => {
      res.json({ success: true, message: 'PUT successful' });
    });

    app.delete('/api/test', (_req, res) => {
      res.json({ success: true, message: 'DELETE successful' });
    });
  });

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('CSRF Token Generation', () => {
    it('should generate and set CSRF cookie on first request', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      if (Array.isArray(cookies)) {
        expect(cookies[0]).toContain('_csrf=');
      }
      expect(response.body.csrfToken).toBeDefined();
      expect(typeof response.body.csrfToken).toBe('string');
    });

    it('should return existing token if cookie already exists', async () => {
      // First request to get token
      const firstResponse = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = firstResponse.headers['set-cookie'];
      if (!Array.isArray(cookies) || cookies.length === 0) {
        throw new Error('No cookies set');
      }
      const csrfCookie = cookies[0].split(';')[0];

      // Second request with cookie
      const secondResponse = await request(app)
        .get('/api/csrf-token')
        .set('Cookie', csrfCookie ?? '')
        .expect(200);

      expect(secondResponse.body.csrfToken).toBeDefined();
    });

    it('should set httpOnly and secure flags on CSRF cookie in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      if (Array.isArray(cookies)) {
        const cookieHeader = cookies[0];
        expect(cookieHeader).toContain('HttpOnly');
        expect(cookieHeader).toContain('SameSite=Strict');
      }

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CSRF Protection for Safe Methods', () => {
    it('should allow GET requests without CSRF token', async () => {
      await request(app)
        .get('/api/test')
        .expect(200)
        .expect({ success: true, message: 'GET successful' });
    });

    it('should allow HEAD requests without CSRF token', async () => {
      await request(app)
        .head('/api/test')
        .expect(200);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      await request(app)
        .options('/api/test')
        .expect(200);
    });
  });

  describe('CSRF Protection for Unsafe Methods', () => {
    it('should reject POST request without CSRF token', async () => {
      const response = await request(app)
        .post('/api/test')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toBe('CSRF token missing');
    });

    it('should reject PUT request without CSRF token', async () => {
      const response = await request(app)
        .put('/api/test')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toBe('CSRF token missing');
    });

    it('should reject DELETE request without CSRF token', async () => {
      const response = await request(app)
        .delete('/api/test')
        .expect(403);

      expect(response.body.error).toBe('CSRF token missing');
    });

    it('should reject POST request with invalid CSRF token', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('x-csrf-token', 'invalid-token')
        .set('Cookie', '_csrf=invalid-hash')
        .send({ data: 'test' })
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
        .post('/api/test')
        .set('x-csrf-token', csrfToken)
        .set('Cookie', cookies.join('; '))
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('CSRF Protection - Mobile App Exemption', () => {
    it('should skip CSRF check for mobile app requests', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('x-mobile-app', 'true')
        .send({ data: 'test' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('CSRF Token Validation', () => {
    it('should reject request with mismatched token and cookie', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('x-csrf-token', 'token123')
        .set('Cookie', '_csrf=different-hash')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toBe('CSRF token invalid');
    });

    it('should reject request with empty CSRF token', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('x-csrf-token', '')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toBe('CSRF token missing');
    });

    it('should handle buffer length mismatch gracefully', async () => {
      const response = await request(app)
        .post('/api/test')
        .set('x-csrf-token', 'short')
        .set('Cookie', '_csrf=verylonghashvalue')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.error).toBe('CSRF token invalid');
      expect(response.body.message).toBe('CSRF token verification failed');
    });
  });

  describe('CSRF Token Endpoint', () => {
    it('should expose /api/csrf-token endpoint', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      expect(response.body).toHaveProperty('csrfToken');
    });

    it('should provide csrfToken property on request object', async () => {
      let tokenFromRequest: string | undefined;

      app.get('/test-token-function', (req, res) => {
        tokenFromRequest = (req as any).csrfToken;
        res.json({ token: tokenFromRequest });
      });

      await request(app)
        .get('/test-token-function')
        .expect(200);

      expect(tokenFromRequest).toBeDefined();
      expect(typeof tokenFromRequest).toBe('string');
    });
  });
});
