# Folk Showcase

An interactive, browser-based demonstration of Folk features, designed to run entirely in the browser with no backend dependencies.

## Overview

The Showcase is a **static, client-side demo** that demonstrates the capabilities of Folk without requiring server infrastructure. It features a **multi-role experience** that allows you to explore the system from different perspectives: patient, family member, caregiver, care coordinator, and administrator.

Perfect for:

- Quick demos and presentations
- Feature exploration without setup
- Understanding the UI/UX from multiple user perspectives
- Testing workflows with mock data
- Experiencing real-world care coordination scenarios

## Key Differences from Full Demo

| Feature | Showcase (This) | Full Demo |
|---------|-----------------|-----------|
| **Deployment** | GitHub Pages (static) | Vercel (SSR + API) |
| **Data Storage** | Browser localStorage | PostgreSQL + Neon |
| **API Layer** | Mock provider (in-browser) | REST API + Serverless Functions |
| **Authentication** | None | Full auth with JWT |
| **Real-time Sync** | No | Yes |
| **Data Persistence** | Browser only | Database |

## Architecture

### Role Context System

The showcase implements a **role-based context system** that manages the current user perspective:

```typescript
// Role switching
const { currentRole, setRole } = useRole();

// Access current persona information
const { currentPersona } = useRole();

// Check role permissions
const canAccess = isRoleAllowed(['coordinator', 'admin']);
```

### Provider Abstraction Pattern

The showcase uses a **provider abstraction layer** following SOLID principles:

```typescript
// Core abstraction
interface DataProvider {
  getClients(...): Promise<PaginatedResult<Client>>;
  createClient(...): Promise<Client>;
  // ... other methods
}

// Implementations
- ApiProvider: Wraps real API calls
- MockProvider: In-memory with localStorage persistence
```

This architecture allows the **same frontend code** to work with either:
1. **Real backend** (API provider)
2. **Mock data** (Mock provider)

### Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Query** - Data fetching & caching
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Zustand** - Local state (from main app)

### Project Structure

```
showcase/
├── src/
│   ├── components/        # Shared components
│   │   ├── ShowcaseLayout.tsx
│   │   └── RoleSwitcher.tsx      # NEW: Role switching UI
│   ├── contexts/         # React contexts
│   │   └── RoleContext.tsx       # NEW: Role management
│   ├── data/             # Mock data
│   │   └── seed-data.ts
│   ├── pages/            # Feature pages
│   │   ├── LandingPage.tsx
│   │   ├── DashboardPage.tsx     # NEW: Role-based dashboard
│   │   ├── ClientDemographicsPage.tsx
│   │   ├── CarePlansPage.tsx
│   │   ├── TaskManagementPage.tsx
│   │   ├── CaregiverManagementPage.tsx
│   │   ├── ShiftMatchingPage.tsx
│   │   └── BillingPage.tsx
│   ├── providers/        # Data provider implementation
│   │   └── mock-provider.ts
│   ├── types/            # Type definitions
│   │   └── showcase-types.ts     # NEW: Simplified types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## Development

### Prerequisites

- Node.js 22+
- npm 10.9+

### Install Dependencies

From the root of the repository:

```bash
npm install
```

### Run Development Server

```bash
cd showcase
npm run dev
```

Open [http://localhost:5173/folkcare](http://localhost:5173/folkcare)

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

The showcase is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` directory to any static hosting service:
   - GitHub Pages
   - Netlify
   - Vercel (static)
   - AWS S3
   - Azure Static Web Apps

## Mock Data

The showcase includes **comprehensive, realistic demo data** representing a multi-state home healthcare agency:

### Data Scale (Enhanced!)

- **60+ Clients** - Diverse demographics across Texas, Florida, and Ohio
  - Various conditions: Alzheimer's, Parkinson's, diabetes, stroke recovery, post-surgical care
  - Different mobility levels: independent, walker, wheelchair, bedbound
  - Realistic emergency contacts and insurance information
  - Multiple statuses: active, pending intake, on hold, inquiry

- **35+ Caregivers** - Various certifications, specializations, and availability
  - CNAs, HHAs, companions, medication aides
  - Specializations: dementia care, medication management, wound care, mobility assistance
  - Bilingual capabilities (English, Spanish, Mandarin)
  - Different employment types: full-time, part-time, per-diem
  - Realistic credential expiration scenarios for compliance demonstrations

- **40+ Care Plans** - All plan types and compliance scenarios
  - Personal care, skilled nursing, companion care, therapy
  - Various priorities: urgent, high, medium, low
  - Compliance statuses: compliant, pending review, needs attention
  - Goals with progress tracking

- **100+ Tasks & Visits** - Full lifecycle demonstration
  - Scheduled, in-progress, completed, overdue
  - EVV requirements and biometric verification
  - GPS geolocation data
  - Task categories: bathing, medication, vital signs, mobility, companionship

- **30+ Invoices** - Billing workflow scenarios
  - Paid, pending, overdue statuses
  - Multiple payment methods: Medicaid, Medicare, private insurance, private pay
  - Line item details and service dates

- **Payroll Periods** - Processed payroll data
- **Shift Listings** - Open and filled shifts with applications
- **Family Engagement** - Messages and notifications

All data is **different from the production demo** to make environments easily distinguishable.

### localStorage Persistence

Changes you make (creating, updating, deleting) are saved to browser localStorage under the key `folkcare-showcase-data`. This means:

- ✅ Changes persist across page reloads
- ✅ Each browser/device has its own data
- ❌ Data is not synced across devices
- ❌ Clearing browser data resets to seed data

### Resetting Demo Data

To reset to the original comprehensive seed data:

**Option 1: Browser Developer Tools**
1. Open browser DevTools (F12)
2. Go to Application/Storage → Local Storage
3. Delete the `folkcare-showcase-data` key
4. Refresh the page

**Option 2: Browser Settings**
- Clear browsing data for this domain
- Refresh the page

**Option 3: Database Seed (For PostgreSQL Backend)**

If running showcase with real PostgreSQL backend:

```bash
# From repository root
npm run db:seed:showcase
```

This seeds the comprehensive showcase dataset (60+ clients, 35+ caregivers, etc.) into your database.

## 🎭 Multi-Role Experience (New in Part 3!)

The showcase now features a **role-based navigation system** that lets you experience the platform from different perspectives:

### Available Personas

1. **Patient (Margaret Thompson)** - View your own care plan, upcoming tasks, and caregiver schedule
2. **Family Member (Sarah Thompson)** - Monitor loved one's care status and communicate with care team
3. **Caregiver (Emily Rodriguez)** - Manage daily schedule, complete tasks, and apply to shifts
4. **Care Coordinator** - Oversee care plans, assign caregivers, and monitor compliance
5. **System Administrator** - Full system access including billing, payroll, and analytics

### How to Use

- **Role Switcher**: Click the persona selector in the top-right corner of any page
- **Dashboard**: Each role has a personalized dashboard showing relevant information
- **Filtered Views**: Data is automatically filtered based on the selected role
- **Quick Actions**: Role-specific actions are highlighted for easy access

## Features Demonstrated

### 1. Role-Based Dashboards (NEW!)
- Personalized views for each user type
- Real-time statistics and metrics
- Role-specific quick actions
- Contextual task lists and schedules

### 2. Client Demographics
- Comprehensive client profiles
- Emergency contacts
- Insurance information
- Search and filtering

### 2. Care Plans & Goals
- Multiple plan types
- Goal tracking with progress
- Compliance status
- Review scheduling

### 3. Task Management
- Task scheduling
- Status tracking
- EVV and signature requirements
- Completion notes

### 4. Caregiver Management
- Caregiver profiles
- Certification tracking
- Specializations
- Hourly rates

### 5. Shift Matching
- Shift listings
- Application tracking
- Certification requirements
- Smart matching

### 6. Billing & Invoicing
- Invoice generation
- Payment tracking
- Line item details
- Multiple payment methods

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- Initial load: ~500KB (gzipped)
- Lazy loading for routes
- React Query caching
- Optimized bundle splitting

## Development Status

### ✅ Completed (Parts 1-3)
- [x] Provider abstraction pattern
- [x] Mock data provider with localStorage
- [x] Comprehensive seed data
- [x] Feature pages (Clients, Care Plans, Tasks, Caregivers, Shifts, Billing)
- [x] Role-based context system
- [x] Multi-persona experience
- [x] Role switcher UI component
- [x] Personalized dashboards
- [x] Enhanced landing page

### 🚧 In Progress
- [ ] Type alignment between showcase and production types
- [ ] Complete TypeScript compilation without errors
- [ ] Build optimization and testing

### 📋 Future Enhancements
- [ ] Guided tours/walkthroughs
- [ ] Scenario-based demonstrations
- [ ] Interactive tutorials
- [ ] Data reset/reseed functionality
- [ ] Export/import demo data

## Contributing

To add new features to the showcase:

1. Add data to `src/data/seed-data.ts`
2. Implement provider methods in `src/providers/mock-provider.ts`
3. Create page components in `src/pages/`
4. Add routes to `src/App.tsx`
5. Update navigation in `src/components/ShowcaseLayout.tsx`
6. Add role-specific logic in `src/contexts/RoleContext.tsx` if needed

### Type Alignment Notes

The showcase currently uses simplified types in `src/types/showcase-types.ts`. To align with production types:

1. Update mock provider to use production type imports
2. Adjust seed data to match production type structure
3. Handle type differences between showcase and production features

## Links

- **Showcase Demo**: https://folk.care
- **Full Demo**: https://folk.care/login
- **GitHub Repository**: https://github.com/neighborhood-lab/folkcare

## License

Same as main Folk project.
