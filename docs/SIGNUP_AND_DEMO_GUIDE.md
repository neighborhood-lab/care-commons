# Signup & Demo Account Guide

**Date:** January 12, 2026  
**Branch:** `feature/signup-production-ready`  
**Status:** Ready for Production Testing

---

## Overview

Folk Care has two ways for users to access the platform:

1. **Demo Accounts** - Pre-configured personas for exploring the platform
2. **Self-Service Signup** - Production-ready organization registration

---

## Demo Accounts (Texas-Based)

Access at: `/login`

These accounts provide a realistic Texas home healthcare agency experience with pre-populated data:

### 1. Administrator - Maria Rodriguez
- **Email:** `admin@tx.folkcare.example`
- **Password:** `Demo123!`
- **Role:** Administrator (TX)
- **Permissions:** Full system access, manage agency operations
- **Use Case:** Executive/owner view, compliance dashboards, financial reporting
- **Icon:** 👨‍💼

### 2. Care Coordinator - James Thompson
- **Email:** `coordinator@tx.folkcare.example`
- **Password:** `Demo123!`
- **Role:** Care Coordinator
- **Permissions:** Schedule visits, assign caregivers, manage care plans
- **Use Case:** Day-to-day operations, scheduling, caregiver assignments
- **Icon:** 📋

### 3. Caregiver - Sarah Chen
- **Email:** `caregiver@tx.folkcare.example`
- **Password:** `Demo123!`
- **Role:** Caregiver
- **Permissions:** Clock in/out, document visits, view assignments
- **Use Case:** Field worker experience, mobile EVV, task completion
- **Icon:** 🤝

### 4. RN Clinical - David Williams
- **Email:** `nurse@tx.folkcare.example`
- **Password:** `Demo123!`
- **Role:** RN Clinical
- **Permissions:** Clinical assessments, medication management, oversight
- **Use Case:** Clinical documentation, assessments, supervision visits
- **Icon:** ⚕️

### 5. Family Member - Emily Johnson
- **Email:** `family@tx.folkcare.example`
- **Password:** `Demo123!`
- **Role:** Family Member
- **Permissions:** View care updates, message caregivers, track visits
- **Relationship:** Daughter of Margaret Johnson (client)
- **Use Case:** Family portal, visit tracking, communication
- **Icon:** 👨‍👩‍👧

---

## Demo Data Characteristics

All demo accounts share:
- **State:** Texas (TX)
- **Data Volume:** 
  - 62 clients
  - 36 caregivers
  - 605 visits (109 scheduled)
  - 155 invoices
  - Realistic Texas addresses, phone numbers, licensure
- **Compliance:** Texas HHSC regulations, HHAeXchange EVV
- **Rate Limiting:** Login attempts are rate-limited (2-second cooldown, 5-minute lockout after excessive attempts)

---

## Self-Service Signup Flow

Access at: `/signup`

### Step 1: Organization Details
- Organization name
- State (all 50 US states + territories supported)
- Phone number (optional)

**Validation:**
- Organization name: 2-100 characters
- State: Must be valid US state code
- Phone: Optional, 10 digits if provided

### Step 2: Admin User Details
- First name
- Last name
- Email address
- Phone number (optional)

**Validation:**
- Names: 1-50 characters
- Email: Valid format, will be used for login
- Phone: Optional, 10 digits if provided

### Step 3: Password
- Password
- Confirm password

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Passwords must match

---

## Backend API

### Signup Endpoint

**POST** `/api/signup`

**Request Body:**
```json
{
  "organizationName": "Acme Home Care",
  "organizationEmail": "admin@acmehomecare.com",
  "organizationPhone": "5551234567",
  "stateCode": "TX",
  "adminFirstName": "John",
  "adminLastName": "Doe",
  "adminEmail": "john@acmehomecare.com",
  "adminPassword": "SecurePass123!",
  "adminPhone": "5559876543",
  "planName": "STARTER"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "organizationId": "uuid",
    "adminUserId": "uuid",
    "subscriptionId": "uuid",
    "message": "Organization registered successfully! Check your email for verification.",
    "user": { /* user object */ },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "jwt-token"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid input (validation errors)
- `409` - Organization or email already exists
- `500` - Server error

---

## Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| **STARTER** | 14-day trial | Basic features, limited users |
| **PROFESSIONAL** | Contact sales | Advanced features, unlimited users |
| **ENTERPRISE** | Contact sales | White-label, dedicated support |

**Note:** Stripe billing integration is not fully implemented. Subscriptions are created in trial mode.

---

## After Signup

1. **Auto-Login:** User is automatically logged in after successful registration
2. **Email Verification:** Verification email sent to admin email (not fully implemented)
3. **Onboarding:** Redirected to `/onboarding` wizard
4. **Organization Setup:** Complete address, upload logo, configure settings

---

## Testing the Signup Flow

### Local Testing (with Database)

```bash
# Start local development server
npm run dev

# Access signup page
open http://localhost:5173/signup

# Database is automatically populated with demo data
# Use a unique email for each test signup
```

### Production Testing (Vercel Preview)

Once deployed to preview:
```
https://folk-care-git-feature-signup-production-ready-*.vercel.app/signup
```

**Test Scenarios:**
1. ✅ Complete signup with valid data
2. ✅ Test validation errors (invalid email, weak password)
3. ✅ Test duplicate organization name
4. ✅ Test duplicate email address
5. ✅ Verify auto-login after signup
6. ✅ Verify onboarding redirect
7. ✅ Test all 50 states + territories

---

## Known Limitations

### Not Fully Implemented:
- **Email Verification:** Emails are sent but verification workflow incomplete
- **Stripe Integration:** Trial subscriptions created but payment not required
- **Google OAuth:** OAuth login not functional
- **Multi-Tenant Isolation:** Data isolation exists but not fully tested

### Working Features:
- ✅ Organization creation
- ✅ Admin user creation
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ Trial subscription creation
- ✅ Auto-login after signup
- ✅ Demo account login
- ✅ Rate limiting

---

## Technical Details

### Database Tables Involved

**Organizations:**
- `organizations` - Organization master record
- `organization_settings` - Feature flags, preferences

**Users:**
- `users` - User accounts
- `permissions` - Role-based access control

**Billing:**
- `subscriptions` - Subscription records
- `subscription_plans` - Plan definitions (STARTER, PROFESSIONAL, ENTERPRISE)

**Audit:**
- `audit_logs` - All user actions logged

### State-Specific Compliance

Each state has unique regulations. The system supports:
- All 50 US states
- Washington DC
- Puerto Rico, US Virgin Islands, Guam

State-specific features:
- Background check requirements
- License types
- EVV mandates
- Medicaid programs

---

## Security Features

1. **Password Security:**
   - Bcrypt hashing (10 rounds)
   - Minimum complexity requirements
   - No plaintext storage

2. **Rate Limiting:**
   - Auth endpoints: 10 requests per 15 minutes per IP
   - Demo login: 2-second cooldown between attempts
   - Excessive failures: 5-minute lockout

3. **Session Management:**
   - JWT with 24-hour expiration
   - Refresh tokens (7 days)
   - Automatic token rotation

4. **Input Validation:**
   - Zod schemas for all inputs
   - SQL injection prevention
   - XSS protection

---

## Troubleshooting

### Demo Login Issues

**Problem:** "Too many login attempts"
**Solution:** Wait 5 minutes or clear browser localStorage

**Problem:** "Invalid credentials"
**Solution:** Ensure using exact email/password from this guide

**Problem:** Demo data missing
**Solution:** Run `npm run db:seed` to restore demo data

### Signup Issues

**Problem:** "Organization already exists"
**Solution:** Use a different organization name

**Problem:** "Email already registered"
**Solution:** Use a different email address or recover existing account

**Problem:** Stuck on onboarding
**Solution:** Complete required fields or skip to dashboard

---

## Contact & Support

**Repository:** https://github.com/neighborhood-lab/folk-care  
**Issues:** https://github.com/neighborhood-lab/folk-care/issues  
**Documentation:** `/docs` directory

**Maintainers:**
- Brian Edwards (brian.mabry.edwards@gmail.com)
- Neighborhood Lab (https://neighborhoodlab.org)

---

**Last Updated:** January 12, 2026  
**Version:** 0.1.0  
**Status:** ✅ Production-Ready (Pending Vercel Deployment)
