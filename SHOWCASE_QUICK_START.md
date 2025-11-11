# Showcase Quick Start Guide

## Overview

The Care Commons Showcase now includes comprehensive, realistic demo data showcasing a multi-state home healthcare agency with 60+ clients, 35+ caregivers, and 100+ tasks/visits.

## Quick Access

### Browser-Based Demo (No Setup Required)

**URL:** https://neighborhood-lab.github.io/care-commons

**Features:**
- ✅ Runs entirely in browser (no backend needed)
- ✅ 60+ realistic clients across TX, FL, OH
- ✅ 35+ caregivers with varied certifications
- ✅ 100+ tasks and visits in all states
- ✅ Changes persist in localStorage
- ✅ Zero setup required

**To Reset Data:**
1. Open browser DevTools (F12)
2. Application/Storage → Local Storage
3. Delete `care-commons-showcase-data` key
4. Refresh page

### Database-Backed Demo (Optional PostgreSQL)

For development or testing with real database:

```bash
# Step 1: Create base organization and admin
npm run db:seed

# Step 2: Seed comprehensive showcase data
npm run db:seed:showcase

# Step 3: Run showcase
cd showcase
npm run dev
```

Open http://localhost:5173/care-commons

## Demo Data Highlights

### Clients (60+)
- **Texas:** Austin, Houston, Dallas clients
- **Florida:** Miami, Tampa, Orlando clients
- **Ohio:** Columbus, Cleveland, Cincinnati clients
- **Conditions:** Alzheimer's, Parkinson's, diabetes, stroke recovery, PTSD, post-surgical care
- **Mobility:** Independent, walker, wheelchair, bedbound
- **Statuses:** Active, pending intake, on hold, inquiry

### Caregivers (35+)
- **Certifications:** CNA, HHA, Companion, Medication Aide
- **Specializations:** Dementia care, medication management, wound care, mobility assistance
- **Languages:** English, Spanish, Mandarin
- **Employment:** Full-time, part-time, per-diem
- **Compliance:** Some with expiring credentials to demonstrate alerts

### Care Plans (40+)
- **Types:** Personal care, skilled nursing, companion care, therapy
- **Priorities:** Urgent, high, medium, low
- **Statuses:** Active, pending review, needs attention
- **Goals:** Progress tracking with realistic percentages

### Tasks & Visits (100+)
- **Statuses:** Scheduled, in-progress, completed, overdue
- **EVV:** GPS locations, biometric verification
- **Categories:** Bathing, medication, vital signs, mobility, companionship
- **Notes:** Realistic completion notes

### Billing (30+)
- **Invoices:** Paid, pending, overdue
- **Payment Methods:** Medicaid, Medicare, private insurance, private pay
- **Line Items:** Detailed service breakdowns

## Exploring the Demo

### 1. Landing Page

**What You'll See:**
- Demo data statistics (60+ clients, 35+ caregivers, etc.)
- Desktop/Web vs. Mobile app selection
- Role-based persona cards
- Feature highlights
- Comparison table (Showcase vs. Full Demo)

### 2. Desktop/Web Experience

**Recommended Flow:**
1. Start at Dashboard
2. Click "Clients" → See 60+ realistic client profiles
3. Click any client → View care plan, emergency contacts, insurance
4. Click "Caregivers" → See varied certifications and availability
5. Click "Tasks" → See scheduled, in-progress, and completed tasks
6. Click "Shift Matching" → Explore smart caregiver assignment
7. Click "Billing" → View invoices in various states

### 3. Mobile App Experience

**Recommended Flow:**
1. View today's visits
2. Click a visit → See client details, tasks, notes
3. Simulate check-in/check-out (GPS + biometric)
4. Complete tasks with notes
5. Apply to open shifts

### 4. Interactive Tours

**Available Tours:**
- **Coordinator Tour:** Dashboard overview, visit creation, shift matching
- **Admin Tour:** KPIs, compliance monitoring, reports
- **Caregiver Tour:** Visit workflow, task completion, offline support
- **Family Tour:** Activity feed, care team, messaging

**How to Launch:**
- Tours auto-start for first-time users
- Or click the tour icon in the top navigation

## Demo Scenarios

### Scenario 1: Schedule a Visit
1. Go to Dashboard
2. Click "Create Visit"
3. Select client (e.g., Margaret Thompson - Alzheimer's patient)
4. Choose date/time
5. Use "Smart Match" to find best caregiver
6. Review matches based on:
   - Skills (dementia care)
   - Location (distance from client)
   - Availability
7. Confirm assignment

### Scenario 2: Compliance Alert
1. Go to Admin Dashboard
2. View "Compliance Alerts" widget
3. See caregivers with expiring credentials
4. Click alert to view details
5. Review credential expiration dates
6. Filter by urgency

### Scenario 3: Multi-State Operations
1. Go to Clients page
2. Filter by state (TX, FL, OH)
3. Notice different:
   - EVV requirements per state
   - Medicaid/Medicare eligibility patterns
   - Emergency contact structures

### Scenario 4: Billing Workflow
1. Go to Billing page
2. View invoices in various states:
   - Paid (green)
   - Pending (yellow)
   - Overdue (red)
3. Click invoice to see:
   - Line items
   - Service dates
   - Payment method
   - Client billing address

## Key Features Demonstrated

### ✅ Client Management
- Comprehensive profiles
- Emergency contacts
- Insurance tracking
- Risk flags
- Allergy management

### ✅ Care Planning
- Multiple plan types
- Goal tracking with progress
- Compliance monitoring
- Review scheduling

### ✅ Task Management
- Task scheduling
- EVV integration
- Digital signatures
- Completion notes
- Priority levels

### ✅ Caregiver Management
- Credential tracking
- Certification expiration alerts
- Specialization matching
- Availability calendars
- Performance metrics

### ✅ Shift Matching
- Smart matching algorithm
- Skills-based filtering
- Distance calculation
- Availability checking
- Application tracking

### ✅ Billing & Invoicing
- Multi-payor support
- Line item details
- Payment tracking
- Status workflows

### ✅ Compliance
- EVV requirements
- State-specific rules
- Credential monitoring
- Audit trails

## Tips for Best Demo Experience

### For Sales/Marketing:
1. Start with landing page statistics
2. Show multi-state client diversity
3. Demonstrate smart shift matching
4. Highlight compliance automation
5. Show mobile app for field caregivers

### For Technical Evaluation:
1. Inspect localStorage data structure
2. Review provider abstraction pattern
3. Examine type safety (TypeScript)
4. Test offline functionality (mobile)
5. Review state management (Zustand)

### For Regulatory/Compliance:
1. Filter clients by state
2. Review EVV data structure
3. Examine credential tracking
4. View audit trail examples
5. Test compliance alert system

### For Operations:
1. Review scheduling workflows
2. Test visit assignment
3. Examine caregiver availability
4. View billing processes
5. Test reporting features

## Resetting Demo Data

### Browser-Based (localStorage):
```javascript
// Option 1: Browser DevTools
1. F12 → Application → Local Storage
2. Delete 'care-commons-showcase-data'
3. Refresh

// Option 2: Console
localStorage.removeItem('care-commons-showcase-data');
location.reload();
```

### Database-Backed:
```bash
# Full reset
npm run db:nuke
npm run db:migrate
npm run db:seed
npm run db:seed:showcase

# Refresh showcase data only
npm run db:seed:showcase
```

## Troubleshooting

### Issue: No data showing
**Solution:** Clear localStorage and refresh page

### Issue: Data seems outdated
**Solution:** Check browser cache, do hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Tours not launching
**Solution:** Clear localStorage `care-commons-showcase-tours-completed` key

### Issue: Database seed fails
**Solution:** 
1. Ensure base seed ran first: `npm run db:seed`
2. Check DATABASE_URL or DB_* environment variables
3. Verify PostgreSQL is running

## Performance Notes

- **Initial Load:** ~500KB gzipped
- **Demo Data:** ~50KB in localStorage
- **Lazy Loading:** Routes load on demand
- **React Query:** Caches API responses
- **Optimal for:** Chrome, Edge, Firefox, Safari (latest versions)

## Links

- **Showcase:** https://neighborhood-lab.github.io/care-commons
- **Full Demo:** https://care-commons.vercel.app/login
- **GitHub:** https://github.com/neighborhood-lab/care-commons
- **Docs:** See `showcase/README.md` for technical details

## Questions?

- Check `showcase/README.md` for technical documentation
- Review `SHOWCASE_DEMO_DATA_IMPLEMENTATION.md` for implementation details
- See code comments in `showcase/src/data/enhanced-seed-data.ts`

---

**Last Updated:** November 10, 2025  
**Version:** 1.0.0  
**Maintained by:** Care Commons Team
