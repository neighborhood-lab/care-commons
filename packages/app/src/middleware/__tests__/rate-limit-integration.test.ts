/**
 * Rate Limit Integration Tests
 * 
 * Tests the custom auth limiter handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

describe('Rate Limit Custom Handler Integration', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create a test rate limiter with custom handler matching production
    const testAuthLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute for testing
      max: 2, // 2 requests max for testing
      skipSuccessfulRequests: true,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req: Request, res: Response) => {
        const retryAfter = res.getHeader('Retry-After') as string;
        const retrySeconds = parseInt(retryAfter, 10);
        const finalRetrySeconds = !isNaN(retrySeconds) && retrySeconds > 0 ? retrySeconds : 300;
        res.status(429).json({
          success: false,
          error: 'Too many login attempts. Please wait before trying again.',
          code: 'RATE_LIMIT_EXCEEDED',
          context: {
            retryAfter: finalRetrySeconds,
            message: `You can try again in ${Math.ceil(finalRetrySeconds / 60)} minutes.`,
          },
        });
      },
    });

    // Test endpoint with rate limiting
    app.post('/test/auth/login', testAuthLimiter, (req: Request, res: Response) => {
      const { success } = req.body;
      if (success === true) {
        return res.json({ success: true, message: 'Login successful' });
      }
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    });
  });

  it('should allow requests within rate limit', async () => {
    const response = await request(app)
      .post('/test/auth/login')
      .send({ success: true });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should return custom error when rate limit exceeded', async () => {
    // Make failed requests to trigger rate limit (skipSuccessfulRequests = true)
    await request(app).post('/test/auth/login').send({ success: false });
    await request(app).post('/test/auth/login').send({ success: false });

    // Third request should be rate limited
    const response = await request(app)
      .post('/test/auth/login')
      .send({ success: false });

    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(response.body.error).toBe('Too many login attempts. Please wait before trying again.');
  });

  it('should include retry information in error context', async () => {
    // Trigger rate limit
    await request(app).post('/test/auth/login').send({ success: false });
    await request(app).post('/test/auth/login').send({ success: false });

    const response = await request(app)
      .post('/test/auth/login')
      .send({ success: false });

    expect(response.body.context).toBeDefined();
    expect(response.body.context.retryAfter).toBeDefined();
    expect(typeof response.body.context.retryAfter).toBe('number');
    expect(response.body.context.retryAfter).toBeGreaterThan(0);
  });

  it('should include user-friendly message with minutes', async () => {
    // Trigger rate limit
    await request(app).post('/test/auth/login').send({ success: false });
    await request(app).post('/test/auth/login').send({ success: false });

    const response = await request(app)
      .post('/test/auth/login')
      .send({ success: false });

    expect(response.body.context.message).toBeDefined();
    expect(response.body.context.message).toMatch(/You can try again in \d+ minutes?/);
  });

  it('should set standard rate limit headers', async () => {
    const response = await request(app)
      .post('/test/auth/login')
      .send({ success: false });

    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
  });

  it('should handle missing Retry-After header gracefully', async () => {
    // This tests the fallback to 300 seconds
    const appWithoutRetryAfter = express();
    appWithoutRetryAfter.use(express.json());

    const limiterWithoutRetryAfter = rateLimit({
      windowMs: 60 * 1000,
      max: 1,
      skipSuccessfulRequests: true,
      handler: (_req: Request, res: Response) => {
        // Simulate missing Retry-After header
        const retryAfter = undefined as unknown as string;
        const retrySeconds = parseInt(retryAfter, 10);
        const finalRetrySeconds = !isNaN(retrySeconds) && retrySeconds > 0 ? retrySeconds : 300;
        res.status(429).json({
          success: false,
          error: 'Too many login attempts. Please wait before trying again.',
          code: 'RATE_LIMIT_EXCEEDED',
          context: {
            retryAfter: finalRetrySeconds,
            message: `You can try again in ${Math.ceil(finalRetrySeconds / 60)} minutes.`,
          },
        });
      },
    });

    appWithoutRetryAfter.post('/test/login', limiterWithoutRetryAfter, (_req: Request, res: Response) => {
      res.status(401).json({ success: false });
    });

    await request(appWithoutRetryAfter).post('/test/login').send({ success: false });
    const response = await request(appWithoutRetryAfter).post('/test/login').send({ success: false });

    expect(response.status).toBe(429);
    expect(response.body.context.retryAfter).toBe(300); // Default value
    expect(response.body.context.message).toMatch(/5 minutes/); // 300 seconds = 5 minutes
  });

  it('should skip successful requests from rate limiting', async () => {
    // Successful requests should not count toward limit
    await request(app).post('/test/auth/login').send({ success: true });
    await request(app).post('/test/auth/login').send({ success: true });
    await request(app).post('/test/auth/login').send({ success: true });

    // Should still allow requests because successful ones don't count
    const response = await request(app)
      .post('/test/auth/login')
      .send({ success: true });

    expect(response.status).toBe(200);
  });
});
