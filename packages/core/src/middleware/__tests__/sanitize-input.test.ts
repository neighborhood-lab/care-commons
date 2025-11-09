import { describe, it, expect, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { sanitizeInput } from '../sanitize-input.js';

describe('Input Sanitization Middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(sanitizeInput);

    // Test route that echoes back the request body
    app.post('/echo', (req, res) => {
      res.json(req.body);
    });

    // Test route that echoes back query parameters
    app.get('/search', (req, res) => {
      res.json(req.query);
    });
  });

  describe('XSS Protection - Script Tags', () => {
    it('should remove script tags from request body', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          name: '<script>alert("XSS")</script>John Doe',
          bio: 'Hello<script>malicious()</script> World'
        })
        .expect(200);

      expect(response.body.name).not.toContain('<script>');
      expect(response.body.name).not.toContain('alert');
      expect(response.body.bio).not.toContain('<script>');
      expect(response.body.bio).not.toContain('malicious');
    });

    it('should remove script tags from query parameters', async () => {
      const response = await request(app)
        .get('/search')
        .query({ q: '<script>alert(1)</script>test' })
        .expect(200);

      expect(response.body.q).not.toContain('<script>');
      expect(response.body.q).not.toContain('alert');
    });
  });

  describe('XSS Protection - Event Handlers', () => {
    it('should remove onerror attributes', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          image: '<img src=x onerror="alert(1)">',
          content: 'Text with <div onerror="bad()">content</div>'
        })
        .expect(200);

      expect(response.body.image).not.toContain('onerror');
      expect(response.body.content).not.toContain('onerror');
    });

    it('should remove onclick attributes', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          button: '<button onclick="malicious()">Click</button>',
          link: '<a onclick="steal()">Link</a>'
        })
        .expect(200);

      expect(response.body.button).not.toContain('onclick');
      expect(response.body.link).not.toContain('onclick');
    });
  });

  describe('XSS Protection - JavaScript URLs', () => {
    it('should remove javascript: protocol from URLs', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          // eslint-disable-next-line sonarjs/code-eval
          link: '<a href="javascript:alert(1)">Click</a>',
          // eslint-disable-next-line sonarjs/code-eval
          redirect: 'javascript:void(0)'
        })
        .expect(200);

      // eslint-disable-next-line sonarjs/code-eval
      expect(response.body.link).not.toContain('javascript:');
      // eslint-disable-next-line sonarjs/code-eval
      expect(response.body.redirect).not.toContain('javascript:');
    });
  });

  describe('HTML Tag Removal', () => {
    it('should remove all HTML tags from input', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          text: '<div><p>Hello</p><b>World</b></div>',
          content: '<h1>Title</h1><span>Content</span>'
        })
        .expect(200);

      expect(response.body.text).not.toContain('<div>');
      expect(response.body.text).not.toContain('<p>');
      expect(response.body.text).not.toContain('<b>');
      expect(response.body.content).not.toContain('<h1>');
      expect(response.body.content).not.toContain('<span>');
    });

    it('should preserve text content while removing tags', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          message: '<p>Hello <strong>World</strong></p>'
        })
        .expect(200);

      // Text content should be preserved
      expect(response.body.message).toContain('Hello');
      expect(response.body.message).toContain('World');
      // But tags should be removed
      expect(response.body.message).not.toContain('<p>');
      expect(response.body.message).not.toContain('<strong>');
    });
  });

  describe('Nested Objects and Arrays', () => {
    it('should sanitize nested objects', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          user: {
            name: '<script>alert(1)</script>John',
            profile: {
              bio: '<b>Developer</b>'
            }
          }
        })
        .expect(200);

      expect(response.body.user.name).not.toContain('<script>');
      expect(response.body.user.profile.bio).not.toContain('<b>');
    });

    it('should sanitize arrays of strings', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          tags: [
            '<script>alert(1)</script>tag1',
            'tag2<b>bold</b>',
            '<div>tag3</div>'
          ]
        })
        .expect(200);

      expect(response.body.tags[0]).not.toContain('<script>');
      expect(response.body.tags[1]).not.toContain('<b>');
      expect(response.body.tags[2]).not.toContain('<div>');
    });

    it('should sanitize complex nested structures', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          data: {
            items: [
              { name: '<script>bad</script>Item 1', desc: '<b>Description</b>' },
              { name: 'Item 2<div>test</div>', desc: 'Clean' }
            ]
          }
        })
        .expect(200);

      expect(response.body.data.items[0].name).not.toContain('<script>');
      expect(response.body.data.items[0].desc).not.toContain('<b>');
      expect(response.body.data.items[1].name).not.toContain('<div>');
    });
  });

  describe('Non-String Values', () => {
    it('should preserve numbers', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          age: 25,
          price: 99.99
        })
        .expect(200);

      expect(response.body.age).toBe(25);
      expect(response.body.price).toBe(99.99);
    });

    it('should preserve booleans', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          active: true,
          deleted: false
        })
        .expect(200);

      expect(response.body.active).toBe(true);
      expect(response.body.deleted).toBe(false);
    });

    it('should handle null values', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          optional: null
        })
        .expect(200);

      expect(response.body.optional).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          empty: ''
        })
        .expect(200);

      expect(response.body.empty).toBe('');
    });

    it('should handle empty objects', async () => {
      const response = await request(app)
        .post('/echo')
        .send({})
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should handle empty arrays', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          items: []
        })
        .expect(200);

      expect(response.body.items).toEqual([]);
    });

    it('should handle special characters in strings', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        })
        .expect(200);

      expect(response.body.special).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should sanitize patient notes with HTML', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          patientNotes: 'Patient is <strong>stable</strong>. <script>alert("xss")</script>Follow up needed.'
        })
        .expect(200);

      expect(response.body.patientNotes).toContain('Patient is');
      expect(response.body.patientNotes).toContain('stable');
      expect(response.body.patientNotes).toContain('Follow up needed');
      expect(response.body.patientNotes).not.toContain('<strong>');
      expect(response.body.patientNotes).not.toContain('<script>');
    });

    it('should sanitize user profile updates', async () => {
      const response = await request(app)
        .post('/echo')
        .send({
          firstName: 'John<script>steal()</script>',
          lastName: 'Doe',
          email: 'john@example.com',
          bio: '<div onclick="bad()">Software Developer</div>'
        })
        .expect(200);

      expect(response.body.firstName).not.toContain('<script>');
      expect(response.body.bio).not.toContain('onclick');
      expect(response.body.email).toBe('john@example.com');
    });
  });
});
