export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Care Commons API',
      version: '1.0.0',
      description: `
# Care Commons API Documentation

Comprehensive REST API for home healthcare management platform.

## Features

- **Client Demographics**: Manage client records, demographics, and intake
- **Caregiver Management**: Staff credentials, certifications, and scheduling
- **Visit Tracking**: EVV-compliant visit check-in/out with GPS verification
- **Care Plans**: Care plan creation, task management, and progress notes
- **Scheduling**: Visit scheduling and caregiver assignment
- **Time Tracking**: Electronic Visit Verification (EVV) and payroll integration
- **Incident Reporting**: Incident documentation and follow-up tracking
- **Medication Management**: Medication administration records (MAR)
- **Quality Assurance**: Audit management and corrective actions
- **Billing & Invoicing**: Service authorization and claim management
- **Analytics**: Reporting and dashboard metrics

## Authentication

All API endpoints require JWT bearer token authentication. Include the token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

Obtain a token by logging in via \`POST /api/auth/login\`.

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General API**: 100 requests per 15 minutes per user
- **Sync endpoints**: 200 requests per 15 minutes per user
- **Report generation**: 10 requests per 15 minutes per user
- **EVV check-in/out**: 500 requests per 15 minutes per user

Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining in current window
- \`X-RateLimit-Reset\`: Time when limit resets (Unix timestamp)

## Pagination

List endpoints support pagination via query parameters:

- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 20, max: 100)
- \`sortBy\`: Field to sort by
- \`sortDirection\`: \`asc\` or \`desc\`

## Error Handling

Errors follow a consistent format:

\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
\`\`\`

Common error codes:
- \`UNAUTHORIZED\`: Authentication required or invalid token
- \`FORBIDDEN\`: Insufficient permissions
- \`NOT_FOUND\`: Resource not found
- \`VALIDATION_ERROR\`: Invalid request data
- \`RATE_LIMIT_EXCEEDED\`: Too many requests
- \`INTERNAL_ERROR\`: Server error

## Compliance

This API implements:
- **HIPAA**: Secure PHI handling with audit trails
- **21st Century Cures Act**: EVV compliance for Medicaid services
- **State-specific regulations**: Texas HHSC, Florida AHCA, and 48 other states

## Versioning

The API uses semantic versioning. Breaking changes will be introduced in new major versions with deprecation notices.

Current version: **v1.0.0**
      `,
      contact: {
        name: 'Care Commons Team',
        url: 'https://github.com/neighborhood-lab/care-commons',
        email: 'support@carecommons.example'
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
        url: 'https://preview.carecommons.example',
        description: 'Staging server'
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
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Clients',
        description: 'Client demographics and records management'
      },
      {
        name: 'Caregivers',
        description: 'Caregiver staff management and credentials'
      },
      {
        name: 'Visits',
        description: 'Visit scheduling and EVV tracking'
      },
      {
        name: 'Care Plans',
        description: 'Care plan and task management'
      },
      {
        name: 'Medications',
        description: 'Medication administration records'
      },
      {
        name: 'Incidents',
        description: 'Incident reporting and tracking'
      },
      {
        name: 'Billing',
        description: 'Invoicing and service authorization'
      },
      {
        name: 'Analytics',
        description: 'Reports and dashboard metrics'
      },
      {
        name: 'Admin',
        description: 'Administrative operations'
      }
    ]
  },
  apis: [
    'packages/app/src/routes/**/*.ts',
    'packages/app/src/config/openapi-schemas.ts',
    'packages/core/src/routes/**/*.ts',
    'verticals/*/src/**/*.ts',
    'verticals/*/src/api/**/*.ts'
  ]
};
