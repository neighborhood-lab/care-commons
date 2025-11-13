# API Documentation

Comprehensive REST API documentation for the Care Commons platform.

## Quick Start

### Local Development

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access Swagger UI:**
   ```
   http://localhost:3000/api-docs
   ```

3. **Download OpenAPI spec:**
   ```
   http://localhost:3000/openapi.json
   ```

### Authentication

All API endpoints require JWT authentication. Include the bearer token in requests:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/clients
```

#### Getting a Token

Login to obtain a JWT token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@carecommons.example",
    "password": "your_password"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@carecommons.example",
    "roles": ["ADMIN"]
  }
}
```

## Documentation Formats

### Swagger UI (Interactive)

**URL:** `http://localhost:3000/api-docs`

Features:
- Interactive API explorer
- Try-it-out functionality
- Request/response examples
- Schema definitions

### OpenAPI 3.0 Specification

**URL:** `http://localhost:3000/openapi.json`

Download the JSON specification for:
- Code generation
- API client generation
- Third-party integrations

### Postman Collection

**Location:** `docs/postman-collection.json`

Import into Postman for easy testing:

1. Open Postman
2. Click Import
3. Select `docs/postman-collection.json`
4. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `jwt_token`: Your JWT token from login

**Generate latest collection:**
```bash
npm run docs:generate
```

## API Structure

### Core Modules

#### Authentication (`/api/auth`)
- Login/logout
- Token refresh
- Password reset
- Multi-factor authentication

#### Client Demographics (`/api/clients`)
- Client CRUD operations
- Demographics management
- Emergency contacts
- Risk flags and alerts

#### Caregiver Management (`/api/caregivers`)
- Staff records
- Credentials and certifications
- Background screening status
- Availability management

#### Visit Tracking (`/api/visits`)
- Visit scheduling
- Electronic Visit Verification (EVV)
- GPS-based clock-in/out
- Visit notes and documentation

#### Care Plans (`/api/care-plans`)
- Care plan creation
- Task management
- Progress notes
- Template management

#### Medications (`/api/medications`)
- Medication records
- Administration tracking (MAR)
- Prescription management

#### Incidents (`/api/incidents`)
- Incident reporting
- Investigation tracking
- Corrective actions

#### Billing (`/api/invoices`)
- Service authorization
- Invoice generation
- Payment tracking

#### Analytics (`/api/analytics`)
- Dashboard metrics
- Custom reports
- Compliance reporting

## Rate Limiting

API requests are rate-limited per user/IP:

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 5 requests | 15 min |
| General API | 100 requests | 15 min |
| Sync endpoints | 200 requests | 15 min |
| Reports | 10 requests | 15 min |
| EVV check-in/out | 500 requests | 15 min |

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699564800
```

### Handling Rate Limits

When rate limited, you'll receive a `429 Too Many Requests` response:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300
}
```

Wait for the specified `retryAfter` seconds before retrying.

## Pagination

List endpoints support pagination:

### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by
- `sortDirection`: `asc` or `desc`

### Example Request

```bash
GET /api/clients?page=2&limit=50&sortBy=lastName&sortDirection=asc
```

### Response Format

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150,
    "page": 2,
    "limit": 50,
    "totalPages": 3
  }
}
```

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for operation |
| `NOT_FOUND` | 404 | Requested resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error (logged for investigation) |

### Validation Errors

Validation errors include detailed field-level information:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "dateOfBirth",
        "message": "Date of birth is required"
      }
    ]
  }
}
```

## Compliance & Security

### HIPAA Compliance

- All PHI access is logged with audit trails
- Encryption in transit (TLS 1.3) and at rest (AES-256)
- Role-based access control (RBAC)
- Minimum necessary principle enforced

### EVV Compliance (21st Century Cures Act)

Electronic Visit Verification captures six required data elements:

1. Type of service
2. Individual receiving service
3. Individual providing service
4. Date of service
5. Location of service (GPS coordinates)
6. Time service begins and ends

### State-Specific Regulations

API supports compliance with:
- Texas HHSC regulations (26 TAC §558)
- Florida AHCA regulations (Chapter 59A-8)
- 48 other state-specific requirements

## Development

### Generate Documentation

Update API documentation after code changes:

```bash
# Generate Postman collection and OpenAPI spec
npm run docs:generate
```

### Adding New Endpoints

Document new endpoints using JSDoc comments:

```typescript
/**
 * @openapi
 * /api/example:
 *   get:
 *     tags:
 *       - Example
 *     summary: Example endpoint
 *     description: Detailed description
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Example'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/example', handler);
```

### Schema Definitions

Add reusable schemas in `packages/app/src/config/openapi-schemas.ts`.

## Support

### Documentation Issues

Found an error in the API documentation?
- Open an issue: https://github.com/neighborhood-lab/care-commons/issues
- Tag with `documentation` label

### API Support

Need help integrating with the API?
- Email: support@carecommons.example
- Slack: #api-support (for partners)

## Changelog

### v1.0.0 (Current)

- Initial API release
- Complete CRUD operations for all core modules
- EVV compliance implemented
- Rate limiting enabled
- Comprehensive error handling

## Resources

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [Swagger Documentation](https://swagger.io/docs/)
- [Postman Learning Center](https://learning.postman.com/)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/index.html)
- [EVV Requirements](https://www.medicaid.gov/medicaid/home-community-based-services/guidance/electronic-visit-verification-systems/index.html)
