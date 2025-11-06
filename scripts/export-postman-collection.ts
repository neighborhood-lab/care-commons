#!/usr/bin/env tsx
/**
 * Export OpenAPI specification to Postman collection
 *
 * Usage:
 *   npm run docs:postman
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';
import Converter from 'openapi-to-postmanv2';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import swagger options
const swaggerOptions = {
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
    path.join(__dirname, '../packages/app/src/config/openapi-schemas.ts'),
    path.join(__dirname, '../packages/app/src/routes/**/*.ts'),
    path.join(__dirname, '../verticals/*/src/api/**/*.ts')
  ]
};

async function exportPostmanCollection(): Promise<void> {
  console.log('Generating OpenAPI specification...');
  const specs = swaggerJsdoc(swaggerOptions);

  console.log('Converting to Postman collection...');

  return new Promise((resolve, reject) => {
    Converter.convert(
      { type: 'json', data: specs },
      {
        folderStrategy: 'Tags',
        requestNameSource: 'url',
        includeAuthInfoInExample: true
      },
      (err, conversionResult) => {
        if (err) {
          console.error('Error converting to Postman:', err);
          reject(err);
          return;
        }

        if (!conversionResult.result) {
          console.error('Conversion failed:', conversionResult.reason);
          reject(new Error(conversionResult.reason));
          return;
        }

        // Ensure docs directory exists
        const docsDir = path.join(__dirname, '../docs');
        if (!fs.existsSync(docsDir)) {
          fs.mkdirSync(docsDir, { recursive: true });
        }

        // Write Postman collection
        const collectionPath = path.join(docsDir, 'postman-collection.json');
        fs.writeFileSync(
          collectionPath,
          JSON.stringify(conversionResult.output[0].data, null, 2)
        );

        console.log(`✅ Postman collection exported to: ${collectionPath}`);

        // Also save the OpenAPI spec
        const openapiPath = path.join(docsDir, 'openapi.json');
        fs.writeFileSync(
          openapiPath,
          JSON.stringify(specs, null, 2)
        );

        console.log(`✅ OpenAPI spec saved to: ${openapiPath}`);

        resolve();
      }
    );
  });
}

// Run the export
exportPostmanCollection()
  .then(() => {
    console.log('\n✅ Export complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  });
