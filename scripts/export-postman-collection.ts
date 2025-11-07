/**
 * Export Postman Collection from OpenAPI Spec
 *
 * Generates a Postman collection from the OpenAPI specification
 * for easy API testing and development
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from '../packages/app/src/config/openapi.config.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportPostmanCollection() {
  try {
    console.log('Generating OpenAPI specification...');
    const specs = swaggerJsdoc(swaggerOptions);

    // Write OpenAPI JSON
    const openApiPath = path.join(__dirname, '../docs/openapi.json');
    fs.writeFileSync(openApiPath, JSON.stringify(specs, null, 2));
    console.log(`✓ OpenAPI specification exported to: ${openApiPath}`);

    // Try to convert to Postman collection if package is available
    try {
      const Converter = await import('openapi-to-postmanv2');

      // @ts-expect-error - openapi-to-postmanv2 has incomplete types
      Converter.convert({ type: 'json', data: specs }, {}, (err: Error | null, result: { result: boolean; output?: Array<{ type: string; data: unknown }> }) => {
        if (err) {
          console.error('Error converting to Postman:', err);
          process.exit(1);
        }

        if (!result.result || !result.output) {
          console.error('Conversion failed: no output generated');
          process.exit(1);
        }

        const postmanPath = path.join(__dirname, '../docs/postman-collection.json');
        fs.writeFileSync(
          postmanPath,
          JSON.stringify(result.output[0]?.data, null, 2)
        );

        console.log(`✓ Postman collection exported to: ${postmanPath}`);
        console.log('\nYou can import this collection into Postman for API testing.');
      });
    } catch (converterError) {
      console.log('\nNote: openapi-to-postmanv2 package not available.');
      console.log('Install it with: npm install --save-dev openapi-to-postmanv2');
      console.log('OpenAPI JSON is available for manual import.');
    }
  } catch (error) {
    console.error('Error generating documentation:', error);
    process.exit(1);
  }
}

// Run the export
exportPostmanCollection();
