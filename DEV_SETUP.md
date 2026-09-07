# Development Setup Guide

## Quick Start

### Prerequisites

- Node.js 22.x (use `nvm use` to switch)
- Docker and Docker Compose (for local database)
- Git

### 1. Clone and Install

```bash
git clone https://github.com/neighborhood-lab/folkcare.git
cd folkcare
nvm use
npm install
```

### 2. Start Local Database (Docker)

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Verify services are running
docker compose ps
# Should show: folkcare-db (postgres) and folkcare-redis

# Optional: Start with admin tools (pgAdmin, Redis Commander, MailHog)
docker compose --profile tools up -d
```

**Service URLs (with --profile tools):**
- pgAdmin: http://localhost:5050 (admin@folkcare.local / admin)
- Redis Commander: http://localhost:8081
- MailHog: http://localhost:8025

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example packages/core/.env

# The defaults work with docker-compose out of the box:
# - DB_HOST=localhost
# - DB_PORT=5432
# - DB_NAME=folkcare
# - DB_USER=postgres
# - DB_PASSWORD=postgres
```

**Alternative: Use DATABASE_URL instead of individual variables:**
```bash
# Add this to packages/core/.env (overrides DB_* variables)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/folkcare
```

### 4. Initialize Database

```bash
# Run migrations to create schema
npm run db:migrate

# Seed with operational data (creates admin user)
npm run db:seed

# Optional: Add demo data for testing
npm run db:seed:demo
```

### 5. Start Development Server

```bash
npm run dev
```

Navigate to http://localhost:5173 to see the app.

### 2. User Accounts

Three role-based accounts are now available for testing:

#### Super Admin
- **Email:** `admin@folkcare.example`
- **Password:** `Wanyama2026$`
- **Access:** Full system access, all permissions
- **Use for:** System configuration, user management, full administrative tasks

#### Coordinator
- **Email:** `coordinator@folkcare.example`
- **Password:** `Wanyama2026$`
- **Access:** Client management, scheduling, care plan coordination
- **Use for:** Day-to-day care coordination, scheduling visits, managing client records

#### Caregiver
- **Email:** `caregiver@folkcare.example`
- **Password:** `Wanyama2026$`
- **Access:** View assigned clients, clock in/out of visits, update tasks
- **Use for:** Field caregiver workflows, mobile visit tracking

### 3. Testing Login

1. Navigate to `http://localhost:5173`
2. Use any of the credentials above
3. The demo credentials section has been removed from the login page

## Database Scripts

### Database Workflow

The database setup is organized in three layers:

1. **Schema (DDL)** - `npm run db:migrate`
   - Creates all tables, indexes, functions, extensions
   - Pure DDL, no data inserts

2. **Operational Data** - `npm run db:seed`
   - Minimal data required for any installation
   - Creates: 1 organization, 1 branch, 1 admin user
   - Login: `admin@folkcare.example` / `Wanyama2026$`

3. **Demo Data** - `npm run db:seed:demo`
   - Sample data for testing and development
   - Creates: 1 program, 5 clients, 5 caregivers

### Quick Setup Commands

```bash
# Clean slate with minimal data
npm run db:reset

# Clean slate with demo data
npm run db:reset:demo

# Or step-by-step:
npm run db:nuke      # Drop everything
npm run db:migrate   # Create schema
npm run db:seed      # Add operational data
npm run db:seed:demo # Add demo data (optional)
```

### Seed Role-Based Users

To recreate or reset user accounts:

```bash
cd packages/core
npm run db:seed-users
```

This creates/updates additional role-based accounts (coordinator, caregiver) with proper permissions.

### Custom Password

To use a different password for all accounts:

```bash
ADMIN_PASSWORD="YourSecurePassword1!" npm run db:seed-users
```

**Password requirements:**
- At least 8 characters (12+ recommended)
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Troubleshooting

### Docker PostgreSQL: "password authentication failed"

**Cause:** Your `packages/core/.env` might be pointing to a cloud database (Neon) instead of local Docker.

**Solution 1:** Use individual DB_* variables (recommended for local dev):
```bash
# In packages/core/.env, ensure these are set:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=folkcare
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Remove or comment out DATABASE_URL if present
# DATABASE_URL=...
```

**Solution 2:** Use DATABASE_URL for local Docker:
```bash
# In packages/core/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/folkcare
```

**Verify Docker is running:**
```bash
docker compose ps
# Should show folkcare-db as "running"

# Check PostgreSQL logs if issues persist:
docker compose logs postgres
```

### Login fails with "JWT_REFRESH_SECRET not set"

**Solution:** Restart the dev server after environment changes:
```bash
# Stop with Ctrl+C
npm run dev
```

### "Invalid credentials" error

**Solution:** Re-run the user seed script:
```bash
cd packages/core
npm run db:seed-users
```

### User already exists with different email

**Solution:** The seed script will update existing users. If you have conflicts, you can:

1. Check existing users:
   ```bash
   psql -h localhost -U postgres -d develop_folkcare -c "SELECT email, username, roles FROM users;"
   ```

2. Delete conflicting users:
   ```bash
   psql -h localhost -U postgres -d develop_folkcare -c "DELETE FROM users WHERE email IN ('admin@folkcare.example', 'coordinator@folkcare.example', 'caregiver@folkcare.example');"
   ```

3. Re-seed:
   ```bash
   cd packages/core
   npm run db:seed-users
   ```

## Security Notes

### Development vs Production

- **Development:** Uses the default password `Wanyama2026$` for convenience
- **Production:** Users MUST change their password after first login
- **JWT Secrets:** The generated secrets in `.env` are for development only. Use proper secrets in production.

### Password Security

The system uses PBKDF2 with the following parameters:
- 100,000 iterations (NIST recommended minimum: 10,000)
- 512-bit key length
- SHA-512 digest
- Cryptographically secure random salt
- Constant-time comparison to prevent timing attacks

### HIPAA Compliance

All authentication events are logged with:
- Email address
- IP address
- User agent
- Timestamp
- Result (success/failure)
- Failure reason (if applicable)

Account lockout after 5 failed attempts (30-minute lockout period).

## Role Permissions

### SUPER_ADMIN
Full access to all features:
- `organizations:*` - Manage organizations
- `users:*` - Manage all users
- `clients:*` - Full client access
- `caregivers:*` - Full caregiver access
- `visits:*` - Full visit access
- `schedules:*` - Full scheduling access
- `care-plans:*` - Full care plan access
- `billing:*` - Billing management
- `reports:*` - All reports
- `settings:*` - System settings

### COORDINATOR, SCHEDULER
Care coordination and scheduling:
- `clients:create`, `clients:read`, `clients:update` - Manage clients
- `caregivers:read`, `caregivers:assign` - View and assign caregivers
- `visits:create`, `visits:read`, `visits:update`, `visits:delete` - Manage visits
- `schedules:create`, `schedules:read`, `schedules:update`, `schedules:delete` - Manage schedules
- `care-plans:create`, `care-plans:read`, `care-plans:update` - Manage care plans
- `reports:read`, `reports:generate` - View and generate reports

### CAREGIVER
Field caregiver access:
- `clients:read` - View assigned clients
- `visits:read`, `visits:clock-in`, `visits:clock-out`, `visits:update` - Visit tracking
- `care-plans:read` - View care plans
- `tasks:read`, `tasks:update` - Task management

## Next Steps

1. **Start the dev server:** `npm run dev`
2. **Login:** Navigate to `http://localhost:5173` and use one of the accounts
3. **Test roles:** Try logging in with different accounts to see permission-based UI differences
4. **Change password:** Implement password change functionality (recommended for production)

---

**Folk Care** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
