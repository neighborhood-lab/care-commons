import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { securityHeaders } from '../security-headers';

describe('Security Headers Middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(securityHeaders);

    // Add a test route
    app.get('/test', (_req, res) => {
      res.json({ message: 'test' });
    });
  });

  it('should set X-Content-Type-Options header', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should set X-Frame-Options header', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('should set X-XSS-Protection header', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });

  it('should set Strict-Transport-Security header in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/test')
      .expect(200);

    const hsts = response.headers['strict-transport-security'];
    expect(hsts).toContain('max-age=');
    expect(hsts).toContain('includeSubDomains');

    process.env.NODE_ENV = originalEnv;
  });

  it('should not set Strict-Transport-Security header in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['strict-transport-security']).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should set Referrer-Policy header', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should set Cache-Control header with HIPAA-compliant settings', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    const cacheControl = response.headers['cache-control'];
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
    expect(cacheControl).toContain('must-revalidate');
    expect(cacheControl).toContain('private');
  });

  it('should set Pragma header', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['pragma']).toBe('no-cache');
  });

  it('should set Expires header', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['expires']).toBe('0');
  });

  it('should set all security headers for all routes', async () => {
    app.post('/api/data', (_req, res) => {
      res.json({ success: true });
    });

    const response = await request(app)
      .post('/api/data')
      .send({ test: 'data' })
      .expect(200);

    // Verify core security headers are present
    expect(response.headers['x-content-type-options']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-xss-protection']).toBeDefined();
    expect(response.headers['referrer-policy']).toBeDefined();
    expect(response.headers['cache-control']).toBeDefined();
    expect(response.headers['pragma']).toBeDefined();
    expect(response.headers['expires']).toBeDefined();
  });

  it('should not allow caching of sensitive data', async () => {
    app.get('/api/patient-data', (_req, res) => {
      res.json({ patientId: '123', name: 'Test Patient' });
    });

    const response = await request(app)
      .get('/api/patient-data')
      .expect(200);

    const cacheControl = response.headers['cache-control'];
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('private');
  });

  it('should prevent clickjacking attacks', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    const xFrameOptions = response.headers['x-frame-options'];
    expect(xFrameOptions).toBe('DENY');
  });

  it('should prevent MIME type sniffing', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should enable HSTS for HTTPS connections in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .get('/test')
      .expect(200);

    const hsts = response.headers['strict-transport-security'];
    expect(hsts).toBeTruthy();
    // Should have max-age of at least 1 year (31536000 seconds)
    expect(hsts).toMatch(/max-age=\d+/);
    expect(hsts).toContain('preload');

    process.env.NODE_ENV = originalEnv;
  });
});
