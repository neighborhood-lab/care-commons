import express, { type Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { swaggerOptions } from '../config/openapi.config';

const router: Router = express.Router();

const specs = swaggerJsdoc(swaggerOptions);

// Swagger UI
router.use('/api-docs', swaggerUi.serve as any);
router.get('/api-docs', swaggerUi.setup(specs, {
  customSiteTitle: 'Care Commons API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  explorer: true,
}) as any);

// OpenAPI JSON
router.get('/openapi.json', (_req, res) => {
  res.json(specs);
});

export default router;
