/**
 * Server-Level Swagger Integration Tests
 * 
 * These tests execute the actual swagger setup code in server.ts (lines 199-205)
 * to ensure codecov tracks coverage of those specific lines.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Mock the database before importing server
const mockQuery = vi.fn();
const mockClient = {
  query: vi.fn(),
  release: vi.fn(),
};
const mockPool = {
  query: mockQuery,
  connect: vi.fn().mockResolvedValue(mockClient),
  end: vi.fn().mockResolvedValue(null),
};

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(function() {
    return mockPool;
  }),
}));

// Mock console to reduce noise
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// Set test environment
process.env['NODE_ENV'] = 'test';
process.env['VERCEL'] = '1'; // Prevent auto-start
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
process.env['DB_PASSWORD'] = 'test_password';
process.env['DATABASE_URL'] = 'postgresql://test:test_password@localhost:5432/test_db';

describe('Server Swagger Setup (server.ts lines 199-205)', () => {
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;

  beforeAll(async () => {
    // Mock successful health check
    mockQuery.mockResolvedValue({
      rows: [{ healthy: true }],
      rowCount: 1,
    });

    // Import and create app - this executes setupApiRoutes() which contains lines 199-205
    const { createApp } = await import('../server.js');
    app = await createApp();
  }, 30000); // 30 second timeout for app initialization

  afterAll(async () => {
    // Clean up
    await mockPool.end();
  });

  describe('Swagger UI Endpoint (line 199)', () => {
    it('should serve swagger UI at /api-docs', async () => {
      // This tests line 199: app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      // Verify swagger UI is served
      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('swagger-ui');
    });

    it('should serve swagger UI HTML content', async () => {
      const response = await request(app).get('/api-docs/');
      
      expect(response.status).toBe(200);
      expect(response.type).toMatch(/html/);
    });
  });

  describe('Swagger JSON Endpoint (lines 202-205)', () => {
    it('should serve swagger JSON at /api-docs.json', async () => {
      // This tests lines 202-205:
      // app.get('/api-docs.json', (_req, res) => {
      //   res.setHeader('Content-Type', 'application/json');
      //   res.send(swaggerSpec);
      // });
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('openapi');
      expect(response.body.openapi).toBe('3.0.0');
    });

    it('should set Content-Type header to application/json', async () => {
      // Tests line 203: res.setHeader('Content-Type', 'application/json');
      const response = await request(app).get('/api-docs.json');
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return complete swagger specification', async () => {
      // Tests line 204: res.send(swaggerSpec);
      const response = await request(app).get('/api-docs.json');
      
      expect(response.body.info).toBeDefined();
      expect(response.body.info.title).toBe('Care Commons API');
      expect(response.body.servers).toBeDefined();
      expect(response.body.components).toBeDefined();
    });
  });

  describe('Complete Swagger Integration', () => {
    it('should have both swagger endpoints accessible', async () => {
      // Verify both endpoints from server.ts setupApiRoutes() work together
      const uiResponse = await request(app).get('/api-docs/');
      const jsonResponse = await request(app).get('/api-docs.json');

      expect(uiResponse.status).toBe(200);
      expect(jsonResponse.status).toBe(200);
      expect(jsonResponse.body.openapi).toBe('3.0.0');
    });

    it('should include swagger documentation link in root endpoint', async () => {
      const response = await request(app).get('/');
      
      expect(response.body.documentation).toBe('http://localhost:3000/api-docs');
    });
  });
});
