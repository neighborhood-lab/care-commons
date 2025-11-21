# Screenshot Capture Tool

Single unified script for capturing comprehensive screenshots showing ALL seed data.

## Features

✅ **All 5 Personas**: Admin, Coordinator, Caregiver, Nurse, Family  
✅ **Proper Authentication**: Email/password or persona card login  
✅ **Automatic Logout**: Clean session between personas  
✅ **Image Optimization**: Auto-resize to 2000px width with ImageMagick  
✅ **Multiple Targets**: Web, Showcase, Mobile views  
✅ **Environment Support**: Local or Production  
✅ **Error Handling**: Detailed stats and failure reporting  
✅ **Metadata Generation**: JSON metadata for AI agents

## Prerequisites

```bash
# Install ImageMagick (optional but recommended for image resizing)
brew install imagemagick

# Verify installation
which mogrify
```

## Usage

### Basic (Local, All Personas, Web Only)
```bash
npm run capture
```

### Production
```bash
npm run capture:prod
```

### Include Showcase
```bash
npm run capture -- --showcase
```

### Include Mobile Views
```bash
npm run capture -- --mobile
```

### Everything (Web + Showcase + Mobile)
```bash
npm run capture:all
```

### Single Persona
```bash
npm run capture -- --persona=admin
npm run capture -- --persona=coordinator
npm run capture -- --persona=caregiver
npm run capture -- --persona=nurse
npm run capture -- --persona=family
```

### Disable Image Resizing
```bash
npm run capture -- --no-resize
```

## Output Structure

### Local Development
```
ui-screenshots-personas/
├── web/
│   ├── 01-administrator/
│   │   ├── home.png
│   │   ├── admin-dashboard.png
│   │   ├── clients.png
│   │   ├── caregivers.png
│   │   ├── visits.png
│   │   └── ...
│   ├── 02-coordinator/
│   ├── 03-caregiver/
│   ├── 04-nurse/
│   └── 05-family/
├── showcase/
│   ├── landing-page.png
│   └── demo.png
├── mobile/
│   ├── login.png
│   └── dashboard.png
└── metadata.json
```

### Production
```
ui-screenshots-production-comprehensive/
└── (same structure as above)
```

## Personas & Routes

### 1. Administrator (Maria Rodriguez)
**Email**: `admin@tx.carecommons.example`  
**Password**: `Demo123!`

**Routes** (15 total):
- Home, Admin Dashboard, Dashboard
- Clients, Caregivers, Visits
- Scheduling, Calendar, Care Plans
- Tasks, Time Tracking, Billing
- Quality Assurance, Analytics, Settings

### 2. Care Coordinator (James Thompson)
**Email**: `coordinator@tx.carecommons.example`  
**Password**: `Demo123!`

**Routes** (12 total):
- Home, Dashboard
- Clients, Caregivers, Visits
- Scheduling, Calendar, Care Plans
- Tasks, Time Tracking
- Analytics, Settings

### 3. Caregiver (Sarah Chen)
**Email**: `caregiver@tx.carecommons.example`  
**Password**: `Demo123!`

**Routes** (8 total):
- Home, Dashboard
- Clients, Visits
- Scheduling, Tasks
- Time Tracking, Settings

### 4. RN Clinical (David Williams)
**Email**: `nurse@tx.carecommons.example`  
**Password**: `Demo123!`

**Routes** (9 total):
- Home, Dashboard
- Clients, Caregivers, Visits
- Care Plans, Tasks
- Quality Assurance, Settings

### 5. Family Member (Emily Johnson)
**Email**: `family@tx.carecommons.example`  
**Password**: `Demo123!`

**Routes** (9 total):
- Home, Family Dashboard
- Activity, Messages, Notifications
- Schedule, Care Plan
- Health Updates, Settings

## What You Should See

Screenshots should show **REAL SEED DATA**, including:

✅ **60 Texas clients** (Austin, Houston, Dallas, San Antonio, Fort Worth)  
✅ **35 Texas caregivers** (distributed across cities)  
✅ **600+ visits** (past, present, future with EVV compliance)  
✅ **50 care plans** with goals and tasks  
✅ **40 family members** with portal access  
✅ **Invoices and payments**  
✅ **Realistic names, addresses, medical conditions**

If you only see demo persona cards or empty tables, the seed data is not loaded or visible.

## Troubleshooting

### "Image not resized" warning
- ImageMagick not installed
- Solution: `brew install imagemagick` or use `--no-resize`

### Login fails with persona card
- Persona cards not available (production without demo mode)
- Script automatically falls back to email/password form

### Screenshots show empty data
- Seed data not loaded: `npm run db:seed:demo`
- Database connection issue: Check `DATABASE_URL`

### Timeouts on analytics pages
- Analytics pages make multiple API calls
- Script automatically adds 3s wait time
- If still timing out, increase `waitMs` in persona routes

## Metadata

Each capture generates `metadata.json`:

```json
{
  "timestamp": "2025-11-20T12:00:00.000Z",
  "environment": {
    "webUrl": "http://localhost:5173",
    "showcaseUrl": "http://localhost:5174"
  },
  "settings": {
    "resize": true,
    "maxWidth": 2000
  },
  "personas": [...],
  "stats": {
    "total": 63,
    "success": 60,
    "failed": 3,
    "failedRoutes": [...]
  }
}
```

## For AI Agents

This tool generates screenshots specifically for AI agents to:
- Understand UI state and data visibility
- Verify seed data is properly displayed
- Perform visual regression testing
- Analyze permission-based view differences

The metadata.json provides context about what was captured and any failures.

## Script Location

`scripts/capture-screenshots.ts`

## Related Scripts

- `npm run db:seed:demo` - Seed demo data (run before capturing)
- `npm run ui:report` - Generate UI state report
- `npm run cache:clear` - Clear cache after seeding
