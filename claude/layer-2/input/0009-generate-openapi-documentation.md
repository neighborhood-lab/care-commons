# Task 0009: Generate OpenAPI Documentation for All APIs

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 6-8 hours

## Context

The project has 100+ API endpoints across verticals but lacks comprehensive API documentation. OpenAPI (Swagger) documentation will improve developer experience for API consumers and frontend developers.

## Goal

Generate OpenAPI 3.0 specification for all REST APIs and serve interactive Swagger UI for exploration and testing.

## Task

### 1. Install OpenAPI Dependencies

```bash
npm install --save swagger-jsdoc swagger-ui-express
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-express
```

### 2. Create OpenAPI Configuration

**File**: `packages/app/src/config/openapi.config.ts`

```typescript
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
    './src/routes/**/*.ts',
    '../verticals/*/src/routes/**/*.ts'
  ]
};
```

### 3. Add Swagger UI Endpoint

**File**: `packages/app/src/routes/docs.routes.ts`

```typescript
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
```

**Register in main app** (`packages/app/src/index.ts`):
```typescript
import docsRoutes from './routes/docs.routes.js';
app.use('/', docsRoutes);
```

### 4. Document Authentication Routes

**File**: `packages/core/src/routes/auth.routes.ts`

Add JSDoc annotations:

```typescript
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with email and password
 *     description: Authenticate user and receive JWT access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', loginHandler);
```

### 5. Define Reusable Schemas

**File**: `packages/app/src/config/openapi-schemas.ts`

Define schemas for common types:

```typescript
/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, coordinator, caregiver, family]
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [active, inactive, discharged]
 *         // ... more fields
 *
 *     Visit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         clientId:
 *           type: string
 *           format: uuid
 *         caregiverId:
 *           type: string
 *           format: uuid
 *         scheduledStart:
 *           type: string
 *           format: date-time
 *         scheduledEnd:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *         // ... more fields
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         message:
 *           type: string
 *         details:
 *           type: object
 */
```

### 6. Document All Vertical APIs

**Document each vertical's routes** (example pattern):

**Clients** (`verticals/client-demographics/src/routes/clients.routes.ts`):
- GET /clients (list with pagination, filtering)
- POST /clients (create)
- GET /clients/:id (get single)
- PUT /clients/:id (update)
- DELETE /clients/:id (soft delete)

**Caregivers** (`verticals/caregiver-staff/src/routes/caregivers.routes.ts`):
- GET /caregivers (list)
- POST /caregivers (create)
- GET /caregivers/:id (get)
- PUT /caregivers/:id (update)
- DELETE /caregivers/:id (delete)

**Visits** (`verticals/scheduling-visits/src/routes/visits.routes.ts`):
- GET /visits (list with filters)
- POST /visits (create)
- GET /visits/:id (get)
- PUT /visits/:id (update)
- DELETE /visits/:id (cancel)
- POST /visits/:id/check-in (EVV check-in)
- POST /visits/:id/check-out (EVV check-out)

**Care Plans** (`verticals/care-plans-tasks/src/routes/care-plans.routes.ts`):
- GET /care-plans (list)
- POST /care-plans (create)
- GET /care-plans/:id (get)
- PUT /care-plans/:id (update)
- DELETE /care-plans/:id (delete)

**Continue for all verticals...**

### 7. Add Request/Response Examples

For each endpoint, provide realistic examples:

```typescript
/**
 * @openapi
 * /clients/{id}:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Client UUID
 *     responses:
 *       200:
 *         description: Client found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               firstName: "John"
 *               lastName: "Doe"
 *               dateOfBirth: "1950-01-15"
 *               status: "active"
 *               primaryAddress:
 *                 street: "123 Main St"
 *                 city: "Austin"
 *                 state: "TX"
 *                 zip: "78701"
 *       404:
 *         description: Client not found
 */
```

### 8. Add Authentication Examples

Show how to authenticate in Swagger UI:

```typescript
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 */
```

### 9. Add Postman Collection Export

Generate Postman collection from OpenAPI spec:

**File**: `scripts/export-postman-collection.ts`

```typescript
import fs from 'fs';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from '../packages/app/src/config/openapi.config.js';
import Converter from 'openapi-to-postmanv2';

const specs = swaggerJsdoc(swaggerOptions);

Converter.convert({ type: 'json', data: specs }, {}, (err, result) => {
  if (err) {
    console.error('Error converting to Postman:', err);
    process.exit(1);
  }

  fs.writeFileSync(
    './docs/postman-collection.json',
    JSON.stringify(result.output[0].data, null, 2)
  );

  console.log('Postman collection exported to docs/postman-collection.json');
});
```

Add to package.json scripts:
```json
"scripts": {
  "docs:postman": "tsx scripts/export-postman-collection.ts"
}
```

### 10. Update README with API Documentation Link

**Update `README.md`**:

```markdown
## API Documentation

Interactive API documentation is available at:
- **Local Development**: http://localhost:3000/api-docs
- **Production**: https://care-commons.vercel.app/api-docs

You can also import the Postman collection from `docs/postman-collection.json`.
```

## Acceptance Criteria

- [ ] OpenAPI 3.0 configuration created
- [ ] Swagger UI accessible at `/api-docs`
- [ ] All authentication routes documented
- [ ] All vertical APIs documented (100+ endpoints)
- [ ] Reusable schemas defined for common types
- [ ] Request/response examples provided
- [ ] Authentication flow documented
- [ ] Postman collection export script working
- [ ] README updated with documentation links
- [ ] Documentation tested and verified accurate

## Best Practices

- **Keep in Sync**: Update OpenAPI annotations when changing API
- **Use Schemas**: Define reusable schemas, don't repeat
- **Examples**: Provide realistic examples for every endpoint
- **Error Responses**: Document all possible error codes (400, 401, 403, 404, 500)
- **Pagination**: Document pagination parameters (page, limit, offset)
- **Filtering**: Document filter query parameters
- **Versioning**: Consider API versioning strategy for future

## Reference

- OpenAPI 3.0 Specification: https://swagger.io/specification/
- swagger-jsdoc: https://github.com/Surnet/swagger-jsdoc
- Swagger UI: https://swagger.io/tools/swagger-ui/
