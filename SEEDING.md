# Database Seeding Guide

## Overview

The Folk platform requires database seeding to create demo/test users and data. The production deployment at https://folk.care requires manual seeding after deployment.

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

- **Email:** `{role}@{state-code}.folkcare.example`
- **Password:** `Wanyama2026${STATE_CODE}{ROLE}123!`

Where:
- `{role}` = admin, coordinator, caregiver, nurse, or family
- `{state-code}` = Two-letter state code (lowercase in email, uppercase in password)
- `{STATE_CODE}` = Two-letter state code in UPPERCASE
- `{ROLE}` = Role name in UPPERCASE

### Examples by State

#### Alabama (AL)
- **Admin:** `admin@al.folkcare.example` / `Wanyama2026$ALADMIN123!`
- **Coordinator:** `coordinator@al.folkcare.example` / `Wanyama2026$ALCOORDINATOR123!`
- **Caregiver:** `caregiver@al.folkcare.example` / `Wanyama2026$ALCAREGIVER123!`
- **Nurse:** `nurse@al.folkcare.example` / `Wanyama2026$ALNURSE123!`
- **Family:** `family@al.folkcare.example` / `Wanyama2026$ALFAMILY123!`

#### California (CA)
- **Admin:** `admin@ca.folkcare.example` / `Wanyama2026$CAADMIN123!`
- **Coordinator:** `coordinator@ca.folkcare.example` / `Wanyama2026$CACOORDINATOR123!`
- **Caregiver:** `caregiver@ca.folkcare.example` / `Wanyama2026$CACAREGIVER123!`
- **Nurse:** `nurse@ca.folkcare.example` / `Wanyama2026$CANURSE123!`
- **Family:** `family@ca.folkcare.example` / `Wanyama2026$CAFAMILY123!`

#### Texas (TX)
- **Admin:** `admin@tx.folkcare.example` / `Wanyama2026$TXADMIN123!`
- **Coordinator:** `coordinator@tx.folkcare.example` / `Wanyama2026$TXCOORDINATOR123!`
- **Caregiver:** `caregiver@tx.folkcare.example` / `Wanyama2026$TXCAREGIVER123!`
- **Nurse:** `nurse@tx.folkcare.example` / `Wanyama2026$TXNURSE123!`
- **Family:** `family@tx.folkcare.example` / `Wanyama2026$TXFAMILY123!`

#### Florida (FL)
- **Admin:** `admin@fl.folkcare.example` / `Wanyama2026$FLADMIN123!`
- **Coordinator:** `coordinator@fl.folkcare.example` / `Wanyama2026$FLCOORDINATOR123!`
- **Caregiver:** `caregiver@fl.folkcare.example` / `Wanyama2026$FLCAREGIVER123!`
- **Nurse:** `nurse@fl.folkcare.example` / `Wanyama2026$FLNURSE123!`
- **Family:** `family@fl.folkcare.example` / `Wanyama2026$FLFAMILY123!`

#### New York (NY)
- **Admin:** `admin@ny.folkcare.example` / `Wanyama2026$NYADMIN123!`
- **Coordinator:** `coordinator@ny.folkcare.example` / `Wanyama2026$NYCOORDINATOR123!`
- **Caregiver:** `caregiver@ny.folkcare.example` / `Wanyama2026$NYCAREGIVER123!`
- **Nurse:** `nurse@ny.folkcare.example` / `Wanyama2026$NYNURSE123!`
- **Family:** `family@ny.folkcare.example` / `Wanyama2026$NYFAMILY123!`

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
3. **Verify login at:** https://folk.care/login
4. **Test with any state's admin credentials** (e.g., `admin@al.folkcare.example` / `Wanyama2026$ALADMIN123!`)

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
   DELETE FROM users WHERE email LIKE '%@%.folkcare.example';
   ```

### Wrong credentials pattern

Ensure you're using the correct pattern:
- Email uses **lowercase** state code
- Password uses **UPPERCASE** state code and role

**Correct:** `admin@al.folkcare.example` / `Wanyama2026$ALADMIN123!`
**Wrong:** `admin@AL.folkcare.example` / `Wanyama2026$aladmin123!`

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
