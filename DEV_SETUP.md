# Development Setup Guide

## Quick Start

### 1. Environment Configuration

The `.env` file has been updated with JWT secrets. **Restart your dev server** to pick up the changes:

```bash
# Stop the current dev server (Ctrl+C)
# Then start it again:
npm run dev
```

### 2. User Accounts

Three role-based accounts are now available for testing:

#### Super Admin
- **Email:** `admin@carecommons.example`
- **Password:** `Admin123!`
- **Access:** Full system access, all permissions
- **Use for:** System configuration, user management, full administrative tasks

#### Coordinator
- **Email:** `coordinator@carecommons.example`
- **Password:** `Admin123!`
- **Access:** Client management, scheduling, care plan coordination
- **Use for:** Day-to-day care coordination, scheduling visits, managing client records

#### Caregiver
- **Email:** `caregiver@carecommons.example`
- **Password:** `Admin123!`
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
   - Login: `admin@carecommons.example` / `Admin123!`

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
   psql -h localhost -U postgres -d develop_care_commons -c "SELECT email, username, roles FROM users;"
   ```

2. Delete conflicting users:
   ```bash
   psql -h localhost -U postgres -d develop_care_commons -c "DELETE FROM users WHERE email IN ('admin@carecommons.example', 'coordinator@carecommons.example', 'caregiver@carecommons.example');"
   ```

3. Re-seed:
   ```bash
   cd packages/core
   npm run db:seed-users
   ```

## Security Notes

### Development vs Production

- **Development:** Uses the default password `Admin123!` for convenience
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

**Care Commons** - Shared care software, community owned  
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
