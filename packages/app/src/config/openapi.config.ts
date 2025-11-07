export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Care Commons API',
      version: '1.0.0',
      description: 'Home healthcare platform API documentation',
      contact: {
        name: 'Care Commons Team',
        url: 'https://github.com/neighborhood-lab/care-commons'
      },
      license: {
        name: 'AGPL-3.0',
        url: 'https://www.gnu.org/licenses/agpl-3.0.en.html'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://care-commons.vercel.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    'packages/app/src/routes/**/*.ts',
    'packages/app/src/config/openapi-schemas.ts',
    'packages/core/src/routes/**/*.ts',
    'verticals/*/src/**/*.ts'
  ]
};
