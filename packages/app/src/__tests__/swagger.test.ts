/**
 * Swagger/OpenAPI Documentation Tests
 * 
 * These tests verify that the OpenAPI documentation is properly configured
 * and accessible through the API endpoints.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';

// Type assertion for swagger spec (swagger-jsdoc returns object type)
type SwaggerSpec = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact: {
      name: string;
      url: string;
    };
    license: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  components: {
    securitySchemes: {
      BearerAuth: {
        type: string;
        scheme: string;
        bearerFormat: string;
      };
    };
  };
  security: Array<{ BearerAuth: unknown[] }>;
};

const spec = swaggerSpec as SwaggerSpec;

describe('Swagger Configuration', () => {
  describe('Swagger Spec', () => {
    it('should have valid OpenAPI 3.0 structure', () => {
      expect(spec).toBeDefined();
      expect(spec.openapi).toBe('3.0.0');
    });

    it('should have API info metadata', () => {
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('Care Commons API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.info.description).toBe('Self-hostable home healthcare platform API');
    });

    it('should have contact information', () => {
      expect(spec.info.contact).toBeDefined();
      expect(spec.info.contact.name).toBe('Neighborhood Lab');
      expect(spec.info.contact.url).toBe('https://neighborhood-lab.github.io');
    });

    it('should have license information', () => {
      expect(spec.info.license).toBeDefined();
      expect(spec.info.license.name).toBe('MIT');
      expect(spec.info.license.url).toBe('https://opensource.org/licenses/MIT');
    });

    it('should have server configurations', () => {
      expect(spec.servers).toBeDefined();
      expect(Array.isArray(spec.servers)).toBe(true);
      expect(spec.servers.length).toBeGreaterThan(0);
      
      // Development server
      const devServer = spec.servers.find((s) => 
        s.description === 'Development server'
      );
      expect(devServer).toBeDefined();
      
      // Production server
      const prodServer = spec.servers.find((s) => 
        s.url === 'https://care-commons.vercel.app'
      );
      expect(prodServer).toBeDefined();
    });

    it('should have security schemes defined', () => {
      expect(spec.components).toBeDefined();
      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
      expect(spec.components.securitySchemes.BearerAuth.type).toBe('http');
      expect(spec.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
      expect(spec.components.securitySchemes.BearerAuth.bearerFormat).toBe('JWT');
    });

    it('should have global security requirements', () => {
      expect(spec.security).toBeDefined();
      expect(Array.isArray(spec.security)).toBe(true);
      expect(spec.security).toContainEqual({ BearerAuth: [] });
    });
  });

  describe('Swagger Endpoints', () => {
    let app: express.Express;

    beforeAll(() => {
      // Create minimal Express app with swagger endpoints
      app = express();

      // Swagger UI endpoint
      app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec) as any);
      
      // Swagger JSON endpoint
      app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
      });
    });

    it('should serve swagger JSON spec at /api-docs.json', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toBeDefined();
      expect(response.body.openapi).toBe('3.0.0');
      expect(response.body.info.title).toBe('Care Commons API');
    });

    it('should serve swagger UI at /api-docs', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200);

      // Swagger UI serves HTML
      expect(response.text).toContain('<!DOCTYPE html>');
      expect(response.text).toContain('swagger-ui');
    });

    it('should return same spec structure as swaggerSpec object', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200);

      // Verify structure matches
      expect(response.body.openapi).toBe(spec.openapi);
      expect(response.body.info.title).toBe(spec.info.title);
      expect(response.body.info.version).toBe(spec.info.version);
      expect(response.body.components.securitySchemes).toEqual(spec.components.securitySchemes);
    });
  });
});
