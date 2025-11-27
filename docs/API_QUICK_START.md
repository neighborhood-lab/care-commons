# API Quick Start Guide

Fast guide to using the Care Commons REST API.

## Base URL

```
Production:  https://care-commons.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

All API requests require a JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://care-commons.vercel.app/api/clients
```

### Get a Token

```bash
# Login
curl -X POST https://care-commons.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@carecommons.example",
    "password": "Care2024!"
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "admin@carecommons.example",
    "role": "ADMIN"
  }
}
```

## Common Endpoints

### Clients

```bash
# List clients
GET /api/clients

# Get client by ID
GET /api/clients/:id

# Create client
POST /api/clients
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1950-01-15",
  "address": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "zipCode": "78701",
  "phone": "512-555-0100"
}

# Update client
PATCH /api/clients/:id

# Delete client
DELETE /api/clients/:id
```

### Caregivers

```bash
# List caregivers
GET /api/caregivers

# Get caregiver by ID
GET /api/caregivers/:id

# Create caregiver
POST /api/caregivers
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "512-555-0200",
  "licenseType": "RN",
  "licenseNumber": "RN123456",
  "licenseExpiration": "2025-12-31"
}
```

### Visits

```bash
# List visits
GET /api/visits?startDate=2025-11-01&endDate=2025-11-30

# Get visit by ID
GET /api/visits/:id

# Create visit
POST /api/visits
{
  "clientId": "client_123",
  "caregiverId": "caregiver_456",
  "serviceType": "PERSONAL_CARE",
  "scheduledStartTime": "2025-11-27T09:00:00Z",
  "scheduledEndTime": "2025-11-27T11:00:00Z",
  "location": {
    "address": "123 Main St",
    "latitude": 30.2672,
    "longitude": -97.7431
  }
}

# Clock in
POST /api/visits/:id/clock-in
{
  "timestamp": "2025-11-27T09:02:00Z",
  "gpsCoordinates": {
    "latitude": 30.2672,
    "longitude": -97.7431,
    "accuracy": 10
  },
  "deviceId": "device_789"
}

# Clock out
POST /api/visits/:id/clock-out
{
  "timestamp": "2025-11-27T11:05:00Z",
  "gpsCoordinates": {
    "latitude": 30.2672,
    "longitude": -97.7431,
    "accuracy": 8
  },
  "signature": "data:image/png;base64,...",
  "notes": "All tasks completed"
}
```

### Care Plans

```bash
# List care plans
GET /api/care-plans?clientId=client_123

# Get care plan by ID
GET /api/care-plans/:id

# Create care plan
POST /api/care-plans
{
  "clientId": "client_123",
  "goals": [
    {
      "description": "Improve mobility",
      "target": "Walk 100 feet independently"
    }
  ],
  "interventions": [
    {
      "description": "Physical therapy exercises",
      "frequency": "DAILY"
    }
  ]
}
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "client_123",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date format",
    "details": [
      {
        "field": "dateOfBirth",
        "message": "Must be in YYYY-MM-DD format"
      }
    ]
  }
}
```

## Rate Limiting

- **Authenticated**: 1000 requests per 15 minutes
- **Unauthenticated**: 100 requests per 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1732712400
```

## Pagination

List endpoints support pagination:

```bash
GET /api/clients?page=2&limit=50

# Response includes pagination metadata
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 235,
    "totalPages": 5
  }
}
```

## Filtering & Sorting

```bash
# Filter by field
GET /api/clients?state=TX&status=ACTIVE

# Sort
GET /api/clients?sortBy=lastName&order=asc

# Search
GET /api/clients?search=John

# Combine
GET /api/clients?state=TX&sortBy=lastName&order=asc&page=1&limit=25
```

## Webhooks

Subscribe to events (coming soon):

```bash
POST /api/webhooks
{
  "url": "https://your-app.com/webhooks/care-commons",
  "events": ["visit.started", "visit.completed", "credential.expiring"]
}
```

## SDKs

Coming soon:
- JavaScript/TypeScript
- Python
- PHP
- Ruby

## Postman Collection

Import our Postman collection:
- [Download](../docs/postman-collection.json)
- Import into Postman
- Set environment variables (base URL, auth token)

## OpenAPI Spec

View our OpenAPI 3.0 spec:
- [Download](../docs/openapi.json)
- Import into Swagger UI or other tools

## Examples

### Check EVV Status

```bash
# Get EVV records for a date range
curl -H "Authorization: Bearer $TOKEN" \
  "https://care-commons.vercel.app/api/evv/records?startDate=2025-11-01&endDate=2025-11-30&state=TX"

# Response
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "evv_123",
        "visitId": "visit_456",
        "clientName": "John Doe",
        "caregiverName": "Jane Smith",
        "clockIn": "2025-11-27T09:02:00Z",
        "clockOut": "2025-11-27T11:05:00Z",
        "gpsVerified": true,
        "complianceStatus": "COMPLIANT",
        "state": "TX",
        "aggregator": "HHAeXchange"
      }
    ],
    "summary": {
      "total": 45,
      "compliant": 44,
      "pending": 1,
      "complianceRate": "97.8%"
    }
  }
}
```

### Get State Compliance Rules

```bash
# Get Texas EVV rules
curl -H "Authorization: Bearer $TOKEN" \
  "https://care-commons.vercel.app/api/compliance/states/TX"

# Response
{
  "success": true,
  "data": {
    "state": "TX",
    "evvRequired": true,
    "gracePeriod": {
      "clockIn": 10,
      "clockOut": 10,
      "unit": "minutes"
    },
    "geofence": {
      "base": 100,
      "gpsAccuracyAllowance": true,
      "unit": "meters"
    },
    "aggregators": ["HHAeXchange"],
    "mandatoryAggregator": "HHAeXchange"
  }
}
```

## Support

- **API Issues**: GitHub Issues
- **Questions**: Discord #api-help
- **Feature Requests**: GitHub Discussions

## More Documentation

- [Full API Documentation](./API_DOCUMENTATION.md)
- [Authentication Guide](./API_AUTHENTICATION.md) (TBD)
- [Webhooks](./API_WEBHOOKS.md) (TBD)
- [Rate Limiting](./API_RATE_LIMITS.md) (TBD)

---

**Quick Start**: Login → Get Token → Make Requests with `Authorization: Bearer $TOKEN`

**Need Help?** Join Discord: https://discord.gg/EkeXQZFq
