# Care Commons API Server

Express.js application layer that integrates all Care Commons vertical packages
into a unified REST API.

## Architecture

This package follows the **application layer** pattern, where:

- **Verticals** (in `verticals/*`) provide business logic, services, and route
  handlers
- **Core** (in `packages/core`) provides shared database, types, and utilities
- **App** (this package) wires everything together into a running web server

## Structure

```
packages/app/
├── src/
│   ├── middleware/          # Express middleware
│   │   ├── auth-context.ts  # User context extraction
│   │   ├── error-handler.ts # Centralized error handling
│   │   └── request-logger.ts # HTTP request logging
│   ├── routes/              # Route integration
│   │   └── index.ts         # Combines all vertical routers
│   └── server.ts            # Main application entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Prerequisites

1. PostgreSQL database running (see root `.env.example`)
2. Database migrations applied: `npm run db:migrate`
3. (Optional) Seed data loaded: `npm run db:seed`

### Running the Server

**Development mode** (with auto-reload):

```bash
npm run dev:server
```

Or from the root:

```bash
npm run dev:server
```

The server will:

- Connect to the database
- Register all vertical routes
- Start listening on `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run start
```

## API Endpoints

### Health & Info

- `GET /health` - Health check (returns database status)
- `GET /api` - API version information

### Client Demographics

- `GET /api/clients` - List clients with filters
- `POST /api/clients` - Create new client
- `GET /api/clients/:id` - Get client by ID
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Soft delete client
- See `verticals/client-demographics/README.md` for full API

### Care Plans & Tasks

- `GET /api/care-plans` - Search care plans
- `POST /api/care-plans` - Create care plan
- `GET /api/care-plans/:id` - Get care plan
- `POST /api/tasks` - Create task instance
- `POST /api/tasks/:id/complete` - Complete task
- See `verticals/care-plans-tasks/README.md` for full API

## Configuration

Environment variables (set in `.env` at repository root):

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=care_commons
DB_USER=postgres
DB_PASSWORD=your_password

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
```

## Authentication

Currently uses **header-based mock authentication** for development:

```
X-User-Id: user-uuid
X-Organization-Id: org-uuid
X-Branch-Id: branch-uuid
X-User-Roles: ADMIN,CAREGIVER
X-User-Permissions: clients:read,clients:write
```

In production, replace `auth-context.ts` middleware with JWT validation.

## Adding New Verticals

To integrate a new vertical package:

1. Ensure the vertical exports a `create*Router()` or handler function
2. Import it in `src/routes/index.ts`
3. Initialize required services/repositories
4. Mount the router: `app.use('/api', verticalRouter)`

Example:

```typescript
// In src/routes/index.ts
import {
  createSchedulingRouter,
  SchedulingService,
} from '@care-commons/scheduling-visits';

const schedulingService = new SchedulingService(db);
const schedulingRouter = createSchedulingRouter(schedulingService);
app.use('/api', schedulingRouter);
```

## Error Handling

All errors are caught by the centralized error handler in
`middleware/error-handler.ts`:

- `ValidationError` → 400 Bad Request
- `PermissionError` → 403 Forbidden
- `NotFoundError` → 404 Not Found
- Others → 500 Internal Server Error

Errors include stack traces in development mode only.

## Testing

Use HTTP clients like curl, Postman, or Thunder Client:

```bash
# Health check
curl http://localhost:3000/health

# Create a client (requires headers)
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user" \
  -H "X-Organization-Id: test-org" \
  -d '{"firstName": "John", "lastName": "Doe", ...}'
```
