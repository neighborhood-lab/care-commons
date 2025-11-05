# Care Commons Platform - Interactive Showcase

This showcase demonstrates the full capabilities of the Care Commons platform, running entirely in your browser using GitHub Pages.

## What is This?

The Care Commons Showcase is an interactive demo that:

- **Runs 100% in-browser** - No backend server required
- **Uses localStorage** - Each visitor gets their own sandbox
- **Demonstrates real features** - All UI and functionality from the production app
- **Supports role-switching** - Experience the app as different user types
- **Includes realistic data** - Pre-populated with demo clients, care plans, and more

## Features You Can Explore

### Core Modules

- **Client Demographics** - Manage client information, contact details, and Medicaid IDs
- **Care Plans** - Create comprehensive care plans with goals and service requirements
- **Task Management** - Track and assign care tasks to team members
- **Shift Matching** - Match caregivers with open shifts based on skills and availability

### Operations

- **Electronic Visit Verification (EVV)** - Track caregiver clock-in/clock-out with location
- **Billing & Invoicing** - Generate and manage client invoices
- **Payroll Processing** - Process caregiver payroll with detailed breakdowns

## User Roles

The showcase includes 4 different user roles you can switch between:

### 1. Admin
- Full system access
- Organization configuration
- User management
- View: All features unlocked

### 2. Care Coordinator
- Manage clients and care plans
- Assign tasks and shifts
- Monitor service delivery
- View: Client-focused workflows

### 3. Caregiver
- View assigned shifts
- Log time and activities
- Complete care tasks
- View: Field operations perspective

### 4. Family Member
- View care updates
- See scheduled services
- Monitor loved one's care
- View: Family-focused information

## How to Use

### Switching Roles

Click the **"Switch Role"** button in the top-right corner to instantly change perspectives and see how different users interact with the system.

### Resetting Data

Click the **"Reset Data"** button to restore the initial demo data and start fresh.

### Making Changes

All changes you make are saved in your browser's localStorage. Your changes won't affect anyone else visiting the showcase.

## Technical Architecture

### Dual API Provider System

The showcase uses a sophisticated API provider abstraction:

```
┌─────────────────────────────────────┐
│         Application Layer           │
│    (React Components & Hooks)       │
└──────────────┬──────────────────────┘
               │
               ├─────────────────────┐
               │                     │
    ┌──────────▼──────────┐ ┌───────▼────────────┐
    │  Production API     │ │  Showcase API      │
    │  Provider           │ │  Provider          │
    │                     │ │                     │
    │  - Real backend     │ │  - In-browser      │
    │  - HTTP requests    │ │  - localStorage    │
    │  - Authentication   │ │  - No auth needed  │
    └─────────────────────┘ └────────────────────┘
```

### Key Components

1. **API Provider Interface** - Defines contract for all providers
2. **Production Provider** - Connects to real backend API
3. **Showcase Provider** - Mocks API with in-browser storage
4. **Provider Factory** - Creates appropriate provider based on config
5. **Provider Context** - React context for accessing provider

### Build System

- **Production Build**: `npm run build` - Standard production app
- **Showcase Build**: `npm run build:showcase` - GitHub Pages demo
- **Dual Entry Points**:
  - `main.tsx` - Production entry
  - `main-showcase.tsx` - Showcase entry

## Demo Data

The showcase includes realistic demo data:

- **2 Clients** - John Doe and Mary Smith
- **1 Care Plan** - Comprehensive care plan for John Doe
- **2 Tasks** - Morning care and lunch preparation
- **2 Open Shifts** - Available shifts for matching
- **1 EVV Record** - Sample time tracking entry
- **1 Invoice** - October billing for services
- **1 Payroll Run** - Sample payroll processing

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Run showcase in development mode
cd packages/web
npm run dev:showcase

# Build for production
npm run build:showcase

# Preview production build
npm run preview:showcase
```

### Adding New Demo Data

Edit `packages/web/src/core/providers/showcase-data.ts` to add or modify demo data.

### Extending the Showcase

1. Add new endpoints in `ShowcaseApiProvider.handleRequest()`
2. Update demo data in `showcase-data.ts`
3. Ensure all CRUD operations are supported
4. Test with different user roles

## Deployment

The showcase is automatically deployed to GitHub Pages when changes are pushed to the `main` or `develop` branches.

### GitHub Pages Setup

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. The `deploy-showcase.yml` workflow handles the rest

### Manual Deployment

```bash
# Build the showcase
cd packages/web
npm run build:showcase

# Deploy dist-showcase/ to your hosting provider
```

## Architecture Benefits

### Code Reuse
- **100% component reuse** - Same React components as production
- **Shared business logic** - Same hooks and utilities
- **Consistent UX** - Identical user experience

### Maintainability
- **Single codebase** - No duplicate code to maintain
- **Type safety** - TypeScript ensures contract compliance
- **Testability** - Both providers implement same interface

### Flexibility
- **Easy switching** - Toggle between providers via config
- **Extensible** - Add new providers (e.g., offline mode)
- **Portable** - Showcase runs anywhere static sites work

## Use Cases

### For Evaluators
- Explore features without installation
- Test workflows with realistic scenarios
- Experience different user perspectives
- No data privacy concerns (local only)

### For Contributors
- Understand system capabilities
- Test UI changes quickly
- Develop without backend setup
- Share work-in-progress demos

### For Stakeholders
- See latest features instantly
- Share accessible demo link
- Gather feedback efficiently
- Demonstrate to potential users

## Learn More

- **GitHub**: https://github.com/neighborhood-lab/care-commons
- **Documentation**: See `/docs` folder
- **Contributing**: See `CONTRIBUTING.md`
- **License**: Apache 2.0 (see `LICENSE`)

## Questions?

Open an issue on GitHub or check out our documentation for more details!
