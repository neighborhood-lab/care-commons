# Care Commons Showcase Enhancements

This directory contains the enhanced showcase experience for the Care Commons platform, designed to transform the static demo into an interactive, narrative-driven experience.

## Overview

The showcase enhancements include:

### Phase 1: Enhanced Landing Page & Onboarding ✅
- **Enhanced Landing Page** (`pages/EnhancedLandingPage.tsx`)
  - Immersive hero section with animated elements
  - Value proposition cards
  - Interactive persona selection
  - Stats and metrics display

- **Welcome Modal** (`components/onboarding/WelcomeModal.tsx`)
  - First-time visitor onboarding flow
  - Multi-step wizard with progress indicator
  - Role selection guidance
  - Quick tips for using the showcase

- **Enhanced Role Selector** (`components/onboarding/EnhancedRoleSelector.tsx`)
  - Full-screen role selection experience
  - Detailed persona cards with missions
  - Search and filter functionality
  - "Surprise me!" random role selection

- **Comparison Table** (`components/visual/ComparisonTable.tsx`)
  - Feature comparison between showcase and full demo
  - Clear differentiation of capabilities

### Phase 2: Device Simulation & Mobile Experience ✅
- **Device Simulator** (`components/device/DeviceSimulator.tsx`)
  - Realistic mobile device frames (iPhone, Samsung, iPad)
  - Device rotation (portrait/landscape)
  - Multiple device configurations
  - Status bar simulation

- **Touch Simulator** (`components/device/TouchSimulator.tsx`)
  - Visual touch ripples on interaction
  - Touch feedback animations
  - Gesture visualization

### Future Phases (To Be Implemented)

#### Phase 3: Guided Interactive Tours
- Tour system architecture and provider
- Role-specific tours (admin, coordinator, caregiver, patient)
- Interactive validation and branching paths
- Progress tracking

#### Phase 4: Narrative-Driven Scenarios
- "Day in the life" scenarios
- Crisis response workflows
- Compliance demonstrations
- Real-world use cases

#### Phase 5: Visual Enhancements
- Animations and micro-interactions
- Feature carousel
- State compliance map
- Enhanced UI polish

#### Phase 6: Analytics & Insights
- Privacy-first analytics
- User engagement tracking
- Feedback collection
- Heatmap visualization

#### Phase 7: PWA Features
- Service worker for offline access
- Install prompt
- Progressive web app capabilities

#### Phase 8: Video & Multimedia
- Hero video production
- Feature demo videos
- Interactive video player

## Directory Structure

```
showcase/
├── components/
│   ├── onboarding/
│   │   ├── WelcomeModal.tsx
│   │   └── EnhancedRoleSelector.tsx
│   ├── device/
│   │   ├── DeviceSimulator.tsx
│   │   └── TouchSimulator.tsx
│   ├── visual/
│   │   └── ComparisonTable.tsx
│   ├── tours/ (coming soon)
│   ├── scenarios/ (coming soon)
│   └── analytics/ (coming soon)
├── pages/
│   └── EnhancedLandingPage.tsx
├── data/
│   └── personas.ts
├── types/
│   └── index.ts
├── ShowcaseRouter.tsx
└── README.md
```

## Key Features

### Personas

The showcase includes four detailed personas:

1. **Administrator** - System configuration and compliance oversight
2. **Care Coordinator (Sarah Kim)** - Client management and caregiver assignments
3. **Caregiver (Emily Rodriguez)** - Mobile workflows and visit completion
4. **Patient (Margaret Thompson)** - Family portal and care visibility

Each persona includes:
- Detailed mission description
- Estimated completion time
- Key features to explore
- Difficulty level indicator
- Color-coded branding

### Animations

All components use `framer-motion` for smooth, accessible animations:
- Fade-in effects for initial page load
- Scale transformations for interactive elements
- Slide transitions for modals and overlays
- Blob animations for background decoration

### Responsive Design

- Mobile-first approach with Tailwind CSS
- Adaptive layouts for all screen sizes
- Touch-optimized interactions
- Accessible keyboard navigation

## Usage

### Development

Run the showcase in development mode:

```bash
cd packages/web
npm run dev:showcase
```

Visit `http://localhost:5173/care-commons` to see the showcase.

### Production Build

Build the showcase for deployment:

```bash
cd packages/web
npm run build:showcase
```

The built files will be in `dist-showcase/` directory.

### Preview Build

Preview the production build locally:

```bash
cd packages/web
npm run preview:showcase
```

## Configuration

The showcase uses the following configuration:

- **Base Path**: `/care-commons` (for GitHub Pages)
- **Storage Key**: `care-commons-showcase-visited` (for first-time visitor detection)
- **Role Key**: `showcase-current-role` (for persisting selected role)

## Dependencies

### Core
- `react` - UI framework
- `react-dom` - DOM rendering
- `react-router-dom` - Routing
- `framer-motion` - Animations

### UI Components
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `@headlessui/react` - Accessible UI primitives

### State Management
- `@tanstack/react-query` - Data fetching
- `zustand` - Local state
- `react-hot-toast` - Notifications

## Best Practices

### Component Structure
- Use TypeScript for all components
- Include JSDoc comments for public APIs
- Export components via index files
- Keep components focused and composable

### Styling
- Use Tailwind utility classes
- Leverage Tailwind's color palette
- Use responsive modifiers (`sm:`, `md:`, `lg:`)
- Implement dark mode support where appropriate

### Accessibility
- Include ARIA labels for interactive elements
- Support keyboard navigation
- Provide focus indicators
- Use semantic HTML

### Performance
- Lazy load heavy components
- Code split by route
- Optimize images and assets
- Minimize bundle size

## Contributing

When adding new showcase features:

1. Follow the established directory structure
2. Add TypeScript types to `types/index.ts`
3. Create comprehensive documentation
4. Test on multiple devices and browsers
5. Ensure accessibility compliance
6. Update this README

## Analytics & Privacy

The showcase includes optional, privacy-first analytics:
- No personal data collection
- Cookie consent required
- GDPR/CCPA compliant
- User can opt-out anytime

Analytics track:
- Page views and navigation
- Feature exploration
- Tour completion rates
- Role switching patterns

## Future Enhancements

See the main specification document for detailed plans on:
- Interactive guided tours
- Narrative-driven scenarios
- Mobile app simulation
- Compliance demonstrations
- Video integration
- PWA capabilities

## Support

For questions or issues:
- GitHub Issues: https://github.com/neighborhood-lab/care-commons/issues
- Documentation: https://docs.care-commons.org
- Community: Join our discussions

---

**Care Commons** - Shared care software, community owned
Brought to you by [Neighborhood Lab](https://neighborhoodlab.org)
