# Task 0038: Generate OpenAPI/Swagger Documentation

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 8-10 hours

## Context

API documentation is essential for developers integrating with Care Commons. OpenAPI (Swagger) provides interactive documentation, client SDK generation, and API contract validation.

## Problem Statement

Current gaps:
- No API documentation
- Developers must read code to understand endpoints
- No request/response examples
- No API contract validation
- Difficult for external integrations

## Task

### 1. Install Swagger Dependencies

```bash
npm install swagger-jsdoc swagger-ui-express --save
npm install @types/swagger-jsdoc @types/swagger-ui-express --save-dev
```

### 2. Configure Swagger

**File**: `packages/app/src/config/swagger.ts`

```typescript
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
        url: process.env.API_URL || 'http://localhost:3000',
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
```

### 3. Add Swagger UI Endpoint

**File**: `packages/app/src/index.ts`

```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
```

### 4. Document Authentication Endpoints

**File**: `packages/app/src/routes/auth.routes.ts`

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
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
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
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
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authController.login);

/**
 * @swagger
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
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, coordinator, caregiver, family]
 *         created_at:
 *           type: string
 *           format: date-time
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

### 5. Document EVV Endpoints

**File**: `verticals/time-tracking-evv/src/routes/evv.routes.ts`

```typescript
/**
 * @swagger
 * /api/evv/check-in:
 *   post:
 *     summary: Check in to a visit with EVV compliance
 *     tags: [EVV]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EVVCheckInRequest'
 *     responses:
 *       201:
 *         description: Check-in successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EVVRecord'
 *       400:
 *         description: Invalid request or EVV compliance failure
 *       401:
 *         description: Unauthorized
 */
router.post('/check-in', authenticate, evvController.checkIn);

/**
 * @swagger
 * components:
 *   schemas:
 *     EVVCheckInRequest:
 *       type: object
 *       required:
 *         - visitId
 *         - gpsCoordinates
 *         - deviceInfo
 *       properties:
 *         visitId:
 *           type: string
 *           format: uuid
 *         gpsCoordinates:
 *           type: object
 *           required:
 *             - latitude
 *             - longitude
 *           properties:
 *             latitude:
 *               type: number
 *               format: double
 *               example: 30.2672
 *             longitude:
 *               type: number
 *               format: double
 *               example: -97.7431
 *             accuracy:
 *               type: number
 *               description: GPS accuracy in meters
 *         deviceInfo:
 *           type: object
 *           properties:
 *             deviceId:
 *               type: string
 *             platform:
 *               type: string
 *               enum: [ios, android]
 *             osVersion:
 *               type: string
 *         biometricVerified:
 *           type: boolean
 *           description: Whether biometric authentication was used
 *     EVVRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         visit_id:
 *           type: string
 *           format: uuid
 *         check_in_time:
 *           type: string
 *           format: date-time
 *         gps_coordinates:
 *           type: object
 *         compliance_status:
 *           type: string
 *           enum: [compliant, non_compliant, pending_review]
 */
```

## Acceptance Criteria

- [ ] Swagger UI available at `/api-docs`
- [ ] All API endpoints documented
- [ ] Request/response schemas defined
- [ ] Authentication documented
- [ ] Examples provided for all endpoints
- [ ] Error responses documented
- [ ] OpenAPI spec downloadable
- [ ] Tests verify spec is valid

## Priority Justification

**MEDIUM** priority - improves developer experience but not blocking production.

---

**Next Task**: 0039 - Showcase Guided Tours Enhancement
