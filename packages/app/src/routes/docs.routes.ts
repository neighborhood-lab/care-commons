import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from '../config/openapi.config.js';

const router = express.Router();

const specs = swaggerJsdoc(swaggerOptions);

// Swagger UI
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(specs, {
  customSiteTitle: 'Care Commons API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// OpenAPI JSON
router.get('/openapi.json', (req, res) => {
  res.json(specs);
});

export default router;
