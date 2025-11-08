# Authentication Login Failure Debugging Report

## Executive Summary

This report analyzes authentication login failures from Vercel logs and provides diagnostic tools and recommendations for resolution.

## Analysis of Vercel Logs

### Observed Failure Pattern

From the logs dated 2025-11-08, we observed multiple 401 authentication failures on:
- `/api/auth/login` - Password authentication endpoint
- `/api/demo/sessions` - Demo session endpoint requiring authentication

### Login Flow Analysis

When a login attempt fails, the following sequence occurs:

1. **Rate Limit Check** - Query checks failed attempts in last 15 minutes
   ```sql
   SELECT COUNT(*) FROM auth_events
   WHERE email = $1
   AND timestamp > NOW() - INTERVAL '15 minutes'
   AND result = 'FAILED'
   ```

2. **User Lookup** - Query finds user by email
   ```sql
   SELECT id, password_hash, status, locked_until, failed_login_attempts
   FROM users WHERE email = $1 AND deleted_at IS NULL
   ```

3. **Password Verification** - PBKDF2 hash verification in code

4. **Failed Attempt Recording** - On failure:
   - Increment `failed_login_attempts` counter
   - Set `locked_until` if attempts >= 5 (30 minute lockout)
   - Insert record into `auth_events` table

### Key Findings

✅ **Working Correctly:**
- Database queries executing successfully
- User records exist and are being found
- Failed attempt tracking working
- Account lockout mechanism functioning

❌ **The Issue:**
- Password verification is failing (line 223 in `packages/core/src/service/auth-service.ts`)
- This could be due to:
  1. Wrong password being used
  2. Password hash format mismatch
  3. Stale/incorrect password hash in database
  4. Environment variable mismatch during seeding

## Root Cause Analysis

### Expected Password Format

According to `packages/core/scripts/seed-users.ts:9`:
```typescript
// Default password for all users: Admin123!
const defaultPassword = process.env['ADMIN_PASSWORD'] ?? 'Admin123!';
```

**Default credentials for seeded users:**
- Admin: `admin@carecommons.example` / `Admin123!`
- Coordinator: `coordinator@carecommons.example` / `Admin123!`
- Caregiver: `caregiver@carecommons.example` / `Admin123!`

### Password Hashing Mechanism

The system uses PBKDF2 with the following parameters:
- **Algorithm:** PBKDF2-HMAC-SHA512
- **Iterations:** 100,000
- **Key Length:** 64 bytes (512 bits)
- **Salt Length:** 16 bytes (128 bits)
- **Format:** `salt:hash` (both hex-encoded)

See `packages/core/src/utils/password-utils.ts` for implementation.

### Possible Causes

1. **User Using Wrong Password** (Most Likely)
   - Expected: `Admin123!`
   - User might be trying different password
   - Password might have been changed manually

2. **Password Hash Format Mismatch**
   - Database might have hash from old system (bcrypt, plain text, etc.)
   - Manual database edits with wrong format
   - Migration issues

3. **Environment Variable Mismatch**
   - Database seeded with `ADMIN_PASSWORD=SomethingElse`
   - User trying default `Admin123!` which doesn't match

4. **Account Locked**
   - After 5 failed attempts, account locks for 30 minutes
   - Logs show incremental failed attempts

## Diagnostic Tools

### 1. Debug Authentication Script

Created: `packages/core/scripts/debug-auth-login.ts`

This script provides comprehensive diagnostics:
- ✅ Checks if user exists
- ✅ Verifies account status (ACTIVE/INACTIVE)
- ✅ Checks account lock status
- ✅ Validates password hash format
- ✅ Tests password verification
- ✅ Reviews recent failed login attempts
- ✅ Checks rate limiting

**Usage:**
```bash
# Check user status
tsx packages/core/scripts/debug-auth-login.ts admin@carecommons.example

# Test password verification
tsx packages/core/scripts/debug-auth-login.ts admin@carecommons.example "Admin123!"
```

### 2. Password Reset Script

Existing: `packages/core/scripts/set-admin-password.ts`

Resets admin password to default or `ADMIN_PASSWORD` env var.

**Usage:**
```bash
# Reset to default (Admin123!)
tsx packages/core/scripts/set-admin-password.ts

# Reset to custom password
ADMIN_PASSWORD="NewPassword123!" tsx packages/core/scripts/set-admin-password.ts
```

### 3. User Seeding Script

Existing: `packages/core/scripts/seed-users.ts`

Creates/updates all user accounts with fresh password hashes.

**Usage:**
```bash
# Seed all users with default password
npm run seed:users

# Seed with custom password
ADMIN_PASSWORD="YourPassword123!" npm run seed:users
```

## Recommendations

### Immediate Actions

1. **Run Diagnostic Script**
   ```bash
   tsx packages/core/scripts/debug-auth-login.ts admin@carecommons.example "Admin123!"
   ```
   This will identify the exact issue.

2. **If Account is Locked**
   Wait 30 minutes or manually unlock:
   ```sql
   UPDATE users
   SET locked_until = NULL, failed_login_attempts = 0
   WHERE email = 'admin@carecommons.example';
   ```

3. **If Password Hash is Invalid**
   Reset password:
   ```bash
   tsx packages/core/scripts/set-admin-password.ts
   ```

4. **If User Doesn't Exist**
   Run user seeding:
   ```bash
   npm run seed:users
   ```

### Long-term Improvements

1. **Add Better Logging**
   - Log failure reasons more explicitly
   - Include sanitized email in logs (for debugging)
   - Add correlation IDs for tracking login attempts

2. **Add Admin Dashboard**
   - View failed login attempts
   - Unlock accounts manually
   - Reset passwords via UI

3. **Improve Error Messages**
   - Return more specific errors (account locked vs wrong password)
   - Include lock duration in error response
   - Add "Forgot Password" flow

4. **Add Monitoring Alerts**
   - Alert on high failure rates
   - Notify on account lockouts
   - Track password reset requests

5. **Password Hash Migration Tool**
   - Detect old/invalid hash formats
   - Auto-migrate to new format
   - Validate all user passwords on startup

## Security Considerations

### Current Security Features ✅

- PBKDF2 with 100,000 iterations (exceeds NIST recommendations)
- Salted hashes (prevents rainbow table attacks)
- Constant-time comparison (prevents timing attacks)
- Account lockout after 5 failed attempts
- 30-minute lockout duration
- Rate limiting (10 attempts per 15 minutes)
- HIPAA-compliant audit logging
- OAuth 2.0 support (Google)

### Password Complexity Requirements

- Minimum 8 characters (12+ recommended)
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended

### Audit Trail

All authentication events logged to `auth_events` table:
- Login attempts (success/failure)
- Account lockouts
- Password changes
- Token refreshes
- Logouts

## Testing Steps

1. **Test with Default Password**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@carecommons.example","password":"Admin123!"}'
   ```

2. **Run Diagnostic Script**
   ```bash
   tsx packages/core/scripts/debug-auth-login.ts admin@carecommons.example "Admin123!"
   ```

3. **Check Database Directly**
   ```sql
   SELECT email, status, failed_login_attempts, locked_until,
          LENGTH(password_hash) as hash_length,
          CASE WHEN password_hash LIKE '%:%' THEN 'Valid Format' ELSE 'Invalid Format' END as hash_format
   FROM users
   WHERE email = 'admin@carecommons.example';
   ```

4. **Review Auth Events**
   ```sql
   SELECT timestamp, event_type, result, failure_reason, ip_address
   FROM auth_events
   WHERE email = 'admin@carecommons.example'
   ORDER BY timestamp DESC
   LIMIT 10;
   ```

## Code References

- Auth Route Handler: `packages/app/src/routes/auth.ts:205-260`
- Auth Service: `packages/core/src/service/auth-service.ts:178-277`
- Password Utils: `packages/core/src/utils/password-utils.ts`
- User Seeding: `packages/core/scripts/seed-users.ts`
- Password Reset: `packages/core/scripts/set-admin-password.ts`
- Debug Script: `packages/core/scripts/debug-auth-login.ts` (NEW)

## Next Steps

1. Run the diagnostic script to identify the exact issue
2. Follow the recommended fix based on diagnostic output
3. Test login with corrected credentials
4. Review and implement long-term improvements
5. Add monitoring for future login failures

## Questions to Answer

To help diagnose the issue further, please answer:

1. **What email are you trying to login with?**
   - Expected: `admin@carecommons.example`

2. **What password are you trying to use?**
   - Expected: `Admin123!` (or value of `ADMIN_PASSWORD` env var during seeding)

3. **When was the database last seeded?**
   - Check if seed-users script was run recently

4. **What is the value of `ADMIN_PASSWORD` environment variable?**
   - During database seeding
   - In the deployment environment

5. **Have there been any manual database changes?**
   - Direct SQL updates to users table
   - Password hash modifications

---

**Created:** 2025-11-08
**Author:** Claude Code
**Status:** Active Investigation
