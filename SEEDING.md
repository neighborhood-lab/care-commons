# Database Seeding Guide

## Overview

The Care Commons platform requires database seeding to create demo/test users and data. The production deployment at https://care-commons.vercel.app requires manual seeding after deployment.

## Important Note

**Database seeding is NOT automatic on deployment.** After deploying to Vercel, you must manually run the seed script to populate the database with demo data and user accounts.

## Quick Start - Seed Production Database

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-neon-production-connection-string"

# Run comprehensive seed (all 50 states + DC)
npm run db:seed-comprehensive
```

## Available Seed Scripts

| Script | Description | Users Created |
|--------|-------------|---------------|
| `npm run db:seed` | Basic seed with organization | Minimal |
| `npm run db:seed:demo` | Complete demo data | Texas & Florida focused |
| `npm run db:seed-comprehensive` | **Comprehensive** - All 50 states + DC | 255 users (5 roles × 51 states) |
| `npm run db:seed-all-states` | All states users only | 255 users |

## Comprehensive Seed Data

The comprehensive seed (`seed-comprehensive-demo.ts`) creates:

- **255 Users** (5 roles × 51 states)
- **255 Clients** (5 per state)
- **153 Caregivers** (3 per state)
- **510 Visits** (10 per state)
- **255 Care Plans** (1 per client)
- **1,275 Tasks** (5 per care plan)
- **510 Medications** (2 per client)
- **765 Clinical Notes** (3 per client)
- **26 Incidents** (1 per 10 clients)
- **51 Quality Audits** (1 per state)

**Total: ~4,000+ realistic demo records**

## Login Credentials

### Pattern

All user credentials follow this pattern:

- **Email:** `{role}@{state-code}.carecommons.example`
- **Password:** `Demo{STATE_CODE}{ROLE}123!`

Where:
- `{role}` = admin, coordinator, caregiver, nurse, or family
- `{state-code}` = Two-letter state code (lowercase in email, uppercase in password)
- `{STATE_CODE}` = Two-letter state code in UPPERCASE
- `{ROLE}` = Role name in UPPERCASE

### Examples by State

#### Alabama (AL)
- **Admin:** `admin@al.carecommons.example` / `DemoALADMIN123!`
- **Coordinator:** `coordinator@al.carecommons.example` / `DemoALCOORDINATOR123!`
- **Caregiver:** `caregiver@al.carecommons.example` / `DemoALCAREGIVER123!`
- **Nurse:** `nurse@al.carecommons.example` / `DemoALNURSE123!`
- **Family:** `family@al.carecommons.example` / `DemoALFAMILY123!`

#### California (CA)
- **Admin:** `admin@ca.carecommons.example` / `DemoCAADMIN123!`
- **Coordinator:** `coordinator@ca.carecommons.example` / `DemoCACOORDINATOR123!`
- **Caregiver:** `caregiver@ca.carecommons.example` / `DemoCACAREGIVER123!`
- **Nurse:** `nurse@ca.carecommons.example` / `DemoCANURSE123!`
- **Family:** `family@ca.carecommons.example` / `DemoCAFAMILY123!`

#### Texas (TX)
- **Admin:** `admin@tx.carecommons.example` / `DemoTXADMIN123!`
- **Coordinator:** `coordinator@tx.carecommons.example` / `DemoTXCOORDINATOR123!`
- **Caregiver:** `caregiver@tx.carecommons.example` / `DemoTXCAREGIVER123!`
- **Nurse:** `nurse@tx.carecommons.example` / `DemoTXNURSE123!`
- **Family:** `family@tx.carecommons.example` / `DemoTXFAMILY123!`

#### Florida (FL)
- **Admin:** `admin@fl.carecommons.example` / `DemoFLADMIN123!`
- **Coordinator:** `coordinator@fl.carecommons.example` / `DemoFLCOORDINATOR123!`
- **Caregiver:** `caregiver@fl.carecommons.example` / `DemoFLCAREGIVER123!`
- **Nurse:** `nurse@fl.carecommons.example` / `DemoFLNURSE123!`
- **Family:** `family@fl.carecommons.example` / `DemoFLFAMILY123!`

#### New York (NY)
- **Admin:** `admin@ny.carecommons.example` / `DemoNYADMIN123!`
- **Coordinator:** `coordinator@ny.carecommons.example` / `DemoNYCOORDINATOR123!`
- **Caregiver:** `caregiver@ny.carecommons.example` / `DemoNYCAREGIVER123!`
- **Nurse:** `nurse@ny.carecommons.example` / `DemoNYNURSE123!`
- **Family:** `family@ny.carecommons.example` / `DemoNYFAMILY123!`

### All States

The comprehensive seed creates users for all 50 US states plus DC:

AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, KS, KY, LA, ME, MD, MA, MI, MN, MS, MO, MT, NE, NV, NH, NJ, NM, NY, NC, ND, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY, DC

## Roles

Each state has 5 user roles:

1. **ADMIN** - Full system access
2. **COORDINATOR** - Care coordination and planning
3. **CAREGIVER** - Direct care provision
4. **NURSE** - Clinical oversight
5. **FAMILY** - Family member access

## Production Deployment Steps

1. **Deploy to Vercel** (migrations run automatically)
2. **Seed the database manually:**
   ```bash
   # Connect to production database
   export DATABASE_URL="your-production-database-url"

   # Run comprehensive seed
   npm run db:seed-comprehensive
   ```
3. **Verify login at:** https://care-commons.vercel.app/login
4. **Test with any state's admin credentials** (e.g., `admin@al.carecommons.example` / `DemoALADMIN123!`)

## Troubleshooting

### Login Fails with "Invalid credentials"

**Cause:** Database has not been seeded.

**Solution:**
```bash
export DATABASE_URL="your-database-url"
npm run db:seed-comprehensive
```

### Users already exist

If you need to re-seed, you have two options:

1. **Reset database (destructive):**
   ```bash
   npm run db:nuke && npm run db:migrate && npm run db:seed-comprehensive
   ```

2. **Clear users only:**
   ```sql
   -- Connect to your database and run:
   DELETE FROM users WHERE email LIKE '%@%.carecommons.example';
   ```

### Wrong credentials pattern

Ensure you're using the correct pattern:
- Email uses **lowercase** state code
- Password uses **UPPERCASE** state code and role

**Correct:** `admin@al.carecommons.example` / `DemoALADMIN123!`
**Wrong:** `admin@AL.carecommons.example` / `Demoaladmin123!`

## Security Note

These credentials are for **demo/development use only**. For production deployments with real users:

1. Create proper user accounts via admin interface
2. Use strong, unique passwords
3. Enable MFA where applicable
4. Disable or remove demo accounts

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Seed Script Documentation](./docs/SEED_SCRIPTS.md)
- [Development Setup](./docs/DEVELOPMENT.md)
