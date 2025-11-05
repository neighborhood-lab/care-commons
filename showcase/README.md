# Care Commons Showcase

An interactive, browser-based demonstration of Care Commons features, designed to run entirely in the browser with no backend dependencies.

## Overview

The Showcase is a **static, client-side demo** that demonstrates the capabilities of Care Commons without requiring server infrastructure. It's perfect for:

- Quick demos and presentations
- Feature exploration without setup
- Understanding the UI/UX
- Testing workflows with mock data

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

### Provider Abstraction Pattern

The showcase introduces a **provider abstraction layer** following SOLID principles:

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
│   │   └── ShowcaseLayout.tsx
│   ├── data/             # Mock data
│   │   └── seed-data.ts
│   ├── pages/            # Feature pages
│   │   ├── LandingPage.tsx
│   │   ├── ClientDemographicsPage.tsx
│   │   ├── CarePlansPage.tsx
│   │   ├── TaskManagementPage.tsx
│   │   ├── CaregiverManagementPage.tsx
│   │   ├── ShiftMatchingPage.tsx
│   │   └── BillingPage.tsx
│   ├── providers/        # Data provider implementation
│   │   └── mock-provider.ts
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

Open [http://localhost:5173/care-commons](http://localhost:5173/care-commons)

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

The showcase includes comprehensive seed data representing:

- **4 Clients** - Diverse demographics across Oregon
- **4 Caregivers** - Various certifications and specializations
- **4 Care Plans** - Different types (Personal Care, Skilled Nursing, Companion, Therapy)
- **8 Task Instances** - Mix of scheduled and completed tasks
- **2 Invoices** - Paid and pending examples
- **1 Payroll Period** - Processed payroll
- **2 Shift Listings** - Open and filled shifts

All data is **different from the main demo** to make them easily distinguishable.

### localStorage Persistence

Changes you make (creating, updating, deleting) are saved to browser localStorage under the key `care-commons-showcase-data`. This means:

- ✅ Changes persist across page reloads
- ✅ Each browser/device has its own data
- ❌ Data is not synced across devices
- ❌ Clearing browser data resets to seed data

To reset to original seed data, clear your browser's localStorage for this domain.

## Features Demonstrated

### 1. Client Demographics
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

## Contributing

To add new features to the showcase:

1. Add data to `src/data/seed-data.ts`
2. Implement provider methods in `src/providers/mock-provider.ts`
3. Create page components in `src/pages/`
4. Add routes to `src/App.tsx`
5. Update navigation in `src/components/ShowcaseLayout.tsx`

## Links

- **Showcase Demo**: https://neighborhood-lab.github.io/care-commons
- **Full Demo**: https://care-commons.vercel.app/login
- **GitHub Repository**: https://github.com/neighborhood-lab/care-commons

## License

Same as main Care Commons project.
