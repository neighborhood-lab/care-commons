import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Care Commons API',
      version: '1.0.0',
      description: 'Self-hostable home healthcare platform API',
      contact: {
        name: 'Neighborhood Lab',
        url: 'https://neighborhood-lab.github.io',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env['API_URL'] ?? 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://care-commons.vercel.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './verticals/*/src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
