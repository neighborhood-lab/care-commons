/**
 * Deployment Smoke Tests (Phase 3.1)
 *
 * Critical path integration tests that verify the application
 * is working correctly after deployment. These tests should be
 * run as part of the deployment health check.
 *
 * @see docs/runbooks/MANUAL_DEPLOYMENT.md
 */

/* eslint-disable sonarjs/no-hardcoded-passwords */
// Test files need hardcoded test passwords

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../server.js';
import type { Express } from 'express';

describe('Deployment Smoke Tests', () => {
  let app: Express;

  beforeAll(async () => {
    // Initialize the app (this will also initialize the database)
    app = await createApp();
  });

  afterAll(async () => {
    // Clean up any resources if needed
    // Note: Database connections are managed by the Database singleton
  });

  describe('Health Endpoint', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    });

    it('should confirm database connectivity', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.database).toHaveProperty('status', 'connected');
      expect(response.body.database).toHaveProperty('responseTime');
      expect(response.body.database.responseTime).toBeLessThan(5000); // 5 second max
    });

    it('should include system information', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('API Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/api');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Care Commons API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api')
        .set('Origin', 'https://care-commons.vercel.app');

      // CORS headers should be present
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
    });

    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });

    it('should include X-XSS-Protection header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
    });

    it('should include Content-Security-Policy header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should include Permissions-Policy header', async () => {
      const response = await request(app).get('/health');
      expect(response.headers).toHaveProperty('permissions-policy');
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers on auth endpoints', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'test' });

      // Rate limit headers should be present
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
      expect(response.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route');
      expect(response.status).toBe(404);
    });

    it('should return JSON error for 404', async () => {
      const response = await request(app).get('/api/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('API Routes Availability', () => {
    it('should have authentication routes available', async () => {
      // Attempt login with invalid credentials - should get 401, not 404
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid@example.com', password: 'wrong' });

      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it('should have client routes available', async () => {
      // Without authentication, should get 401, not 404
      const response = await request(app).get('/api/clients');

      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });

    it('should have care plan routes available', async () => {
      // Without authentication, should get 401, not 404
      const response = await request(app).get('/api/care-plans');

      // Should not be 404 (route exists)
      expect(response.status).not.toBe(404);
    });
  });

  describe('Request/Response Format', () => {
    it('should accept JSON requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: 'test@example.com', password: 'test' }));

      // Should process JSON (even if authentication fails)
      expect(response.status).not.toBe(415); // Not "Unsupported Media Type"
    });

    it('should return JSON responses', async () => {
      const response = await request(app).get('/health');
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });
});
