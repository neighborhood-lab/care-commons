# Database Seed Scripts

Comprehensive demo data seeding for Care Commons platform.

## Quick Start

### Option 1: Full Comprehensive Demo Data (Recommended)
Creates **4,000+ realistic records** for all 50 states + DC:

```bash
cd packages/core
npm run db:seed-comprehensive
```

**What gets created:**
- ✅ **255 users** (5 roles × 51 states)
- ✅ **255 clients** with realistic demographics
- ✅ **153 caregivers** with skills and certifications
- ✅ **510 visits** with scheduling
- ✅ **255 care plans** with detailed goals
- ✅ **1,275 care tasks** across all plans
- ✅ **510 medications** with dosing schedules
- ✅ **765 clinical notes** with assessments
- ✅ **Incidents** for quality tracking
- ✅ **Audit data** for compliance

### Option 2: Users Only (All States)
Creates **255 user accounts** (one per role per state):

```bash
cd packages/core
npm run db:seed-all-states
```

**Credential Pattern:**
- Email: `{role}@{state}.carecommons.example`
- Password: `Demo{STATE}{ROLE}123!`

**Examples:**
```
admin@ca.carecommons.example / DemoCAADMIN123!
coordinator@tx.carecommons.example / DemoTXCOORDINATOR123!
caregiver@fl.carecommons.example / DemoFLCAREGIVER123!
nurse@ny.carecommons.example / DemoNYNURSE123!
family@il.carecommons.example / DemoILFAMILY123!
```

## All Available Seed Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **Comprehensive Demo** | `npm run db:seed-comprehensive` | 4,000+ records for all states |
| **All States Users** | `npm run db:seed-all-states` | 255 user accounts (all states) |
| **Base Seed** | `npm run db:seed` | Foundation data (organization, branch, admin) |
| **Demo Complete** | `npm run db:seed:demo` | Texas/Florida complete demo |
| **Showcase** | `npm run db:seed:showcase` | Interactive showcase data |
| **Individual Users** | `npm run db:seed-users` | Specific user accounts |

## Login Roles

Each state has 5 role types:

| Role | Key | Description | Permissions |
|------|-----|-------------|-------------|
| **Administrator** | `admin` | Full system access | All permissions |
| **Care Coordinator** | `coordinator` | Schedule & manage care | Create visits, assign caregivers |
| **Caregiver** | `caregiver` | Provide direct care | Clock in/out, document visits |
| **Family Member** | `family` | View care information | Read-only access to care data |
| **Nurse/Clinical** | `nurse` | Clinical oversight | Medications, assessments, care plans |

## State Codes

All 50 US States + DC are supported. Example state codes:

```
AL (Alabama)      AK (Alaska)       AZ (Arizona)      AR (Arkansas)
CA (California)   CO (Colorado)     CT (Connecticut)  DE (Delaware)
FL (Florida)      GA (Georgia)      HI (Hawaii)       ID (Idaho)
IL (Illinois)     IN (Indiana)      IA (Iowa)         KS (Kansas)
KY (Kentucky)     LA (Louisiana)    ME (Maine)        MD (Maryland)
MA (Massachusetts) MI (Michigan)    MN (Minnesota)    MS (Mississippi)
MO (Missouri)     MT (Montana)      NE (Nebraska)     NV (Nevada)
NH (New Hampshire) NJ (New Jersey)  NM (New Mexico)   NY (New York)
NC (North Carolina) ND (North Dakota) OH (Ohio)       OK (Oklahoma)
OR (Oregon)       PA (Pennsylvania) RI (Rhode Island) SC (South Carolina)
SD (South Dakota) TN (Tennessee)    TX (Texas)        UT (Utah)
VT (Vermont)      VA (Virginia)     WA (Washington)   WV (West Virginia)
WI (Wisconsin)    WY (Wyoming)      DC (District of Columbia)
```

## Data Details

### Comprehensive Seed Data Structure

**Clients (5 per state = 255 total)**
- Realistic names and demographics
- Age range: 65-95 years old
- Medicaid/Medicare numbers
- Emergency contacts
- Primary diagnoses: Diabetes, Hypertension, CHF, COPD, Dementia, etc.
- Full addresses in major cities

**Caregivers (3 per state = 153 total)**
- CNA, CPR, First Aid certifications
- Skills: Personal care, medication administration, vital signs, wound care
- Hourly rates: $15-30/hour
- Active employment status

**Visits (10 per state = 510 total)**
- Mix of scheduled, in-progress, and completed visits
- 2-hour visit durations
- Past 30 days of visit history
- Assigned to specific caregiver-client pairs

**Care Plans (1 per client = 255 total)**
- Diagnosis-specific goals
- Daily frequency scheduling
- Status: Active
- 5 tasks per plan (total 1,275 tasks):
  - Vital signs monitoring
  - Medication administration
  - Personal hygiene assistance
  - Meal preparation
  - Ambulation assistance
  - And more...

**Medications (2 per client = 510 total)**
- Common medications: Metformin, Lisinopril, Atorvastatin, etc.
- Proper dosing and frequency
- Prescriber information
- Start dates
- Route of administration

**Clinical Notes (3 per client = 765 total)**
- Progress notes format
- Subjective/Objective/Assessment/Plan (SOAP)
- Realistic vital signs
- Clinical assessments
- Care plans

**Incidents (Variable by state)**
- Fall incidents
- Medication errors
- Missed visits
- Severity levels: Low, Medium, High
- Investigation status tracking

## Running Seeds in Production

**⚠️ WARNING:** These seed scripts are for **DEMO PURPOSES ONLY**. Do not run in production with real patient data.

For production deployment, use:
```bash
# Run migrations only
npm run db:migrate

# DO NOT run seed scripts in production
# Create real users through the admin interface
```

## Troubleshooting

**"Organization not found" error:**
```bash
# Run base seed first
cd packages/core
npm run db:seed
# Then run comprehensive seed
npm run db:seed-comprehensive
```

**Database connection error:**
```bash
# Check your .env file has correct DATABASE_URL
echo $DATABASE_URL

# Or set individual variables:
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=care_commons
export DB_USER=postgres
export DB_PASSWORD=postgres
```

**Duplicate key errors:**
The scripts handle duplicates gracefully:
- Users: Updates existing records
- Other entities: Skips if ID exists (ON CONFLICT DO NOTHING)

## Development

To modify or create new seed scripts:

1. Create TypeScript file in `packages/core/scripts/`
2. Follow the pattern in `seed-comprehensive-demo.ts`
3. Add script to `package.json`:
   ```json
   "db:seed:my-script": "cd ../.. && tsx packages/core/scripts/my-script.ts"
   ```
4. Run: `npm run db:seed:my-script`

## License

Part of Care Commons - Shared care software, community owned
