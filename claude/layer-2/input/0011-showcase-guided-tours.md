# Task 0011: Add Guided Tours to Showcase Application

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 6-8 hours

## Context

The showcase application exists but lacks guided tours that help new users understand the platform's capabilities. Interactive tours will improve the learning experience and conversion from evaluators to users.

## Goal

Create interactive, step-by-step tours for each major persona (admin, coordinator, caregiver, family member) that demonstrate key workflows.

## Task

### 1. Install Tour Library

```bash
npm install react-joyride --save
npm install --save-dev @types/react-joyride
```

Or use Shepherd.js for more advanced features:
```bash
npm install shepherd.js
```

### 2. Create Tour System

**File**: `showcase/src/components/tours/TourProvider.tsx`

```typescript
import React, { createContext, useContext, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TourContextValue {
  startTour: (tourId: string) => void;
  stopTour: () => void;
  currentTour: string | null;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within TourProvider');
  return context;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [run, setRun] = useState(false);

  const tours = {
    'coordinator-overview': coordinatorOverviewSteps,
    'create-visit': createVisitSteps,
    'caregiver-workflow': caregiverWorkflowSteps,
    'family-portal': familyPortalSteps,
    'admin-dashboard': adminDashboardSteps
  };

  const startTour = (tourId: string) => {
    const tourSteps = tours[tourId as keyof typeof tours];
    if (tourSteps) {
      setSteps(tourSteps);
      setCurrentTour(tourId);
      setRun(true);
    }
  };

  const stopTour = () => {
    setRun(false);
    setCurrentTour(null);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      stopTour();
    }
  };

  return (
    <TourContext.Provider value={{ startTour, stopTour, currentTour }}>
      {children}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            zIndex: 10000
          }
        }}
      />
    </TourContext.Provider>
  );
}
```

### 3. Define Tour Steps

**File**: `showcase/src/components/tours/tour-steps.ts`

```typescript
import { Step } from 'react-joyride';

export const coordinatorOverviewSteps: Step[] = [
  {
    target: '.dashboard-overview',
    content: 'Welcome to Care Commons! This is your coordinator dashboard where you manage clients, caregivers, and visits.',
    disableBeacon: true
  },
  {
    target: '.today-visits-widget',
    content: "Here you can see today's scheduled visits and their real-time status."
  },
  {
    target: '.active-clients-widget',
    content: 'View your active clients and quickly access their care plans.'
  },
  {
    target: '.caregiver-status-widget',
    content: 'Monitor caregiver availability and current location during visits.'
  },
  {
    target: '.create-visit-button',
    content: "Let's create a new visit. Click here to get started."
  }
];

export const createVisitSteps: Step[] = [
  {
    target: '.client-selector',
    content: 'First, select the client for this visit.',
    disableBeacon: true
  },
  {
    target: '.date-time-picker',
    content: 'Choose the date and time for the visit.'
  },
  {
    target: '.service-selector',
    content: 'Select the services to be provided during this visit.'
  },
  {
    target: '.caregiver-selector',
    content: 'Choose a caregiver. The system shows availability and distance from client.'
  },
  {
    target: '.smart-match-button',
    content: 'Or use Smart Match to automatically find the best caregiver based on skills, location, and availability.'
  },
  {
    target: '.submit-visit-button',
    content: 'Review and create the visit. The caregiver will be notified on their mobile app.'
  }
];

export const caregiverWorkflowSteps: Step[] = [
  {
    target: '.today-visits-list',
    content: 'Welcome, caregiver! Here are your visits for today.',
    disableBeacon: true
  },
  {
    target: '.visit-card:first-child',
    content: 'Tap a visit to see details, get directions, or check in.'
  },
  {
    target: '.check-in-button',
    content: 'When you arrive, check in using GPS and biometric verification.'
  },
  {
    target: '.task-checklist',
    content: 'During the visit, complete assigned tasks and document care.'
  },
  {
    target: '.check-out-button',
    content: 'When finished, check out. Your time is automatically recorded for payroll.'
  },
  {
    target: '.offline-indicator',
    content: 'All features work offline! Your data syncs when you have connection.'
  }
];

export const familyPortalSteps: Step[] = [
  {
    target: '.activity-feed',
    content: 'Welcome to the family portal! See real-time updates about your loved one\'s care.',
    disableBeacon: true
  },
  {
    target: '.upcoming-visits',
    content: 'View upcoming scheduled visits and who will be providing care.'
  },
  {
    target: '.care-team',
    content: 'Meet the care team - see photos and background of assigned caregivers.'
  },
  {
    target: '.messaging',
    content: 'Send messages to the coordinator if you have questions or concerns.'
  },
  {
    target: '.notifications',
    content: 'Get notifications for important events like visit start, completion, and any issues.'
  }
];

export const adminDashboardSteps: Step[] = [
  {
    target: '.kpi-cards',
    content: 'Admin dashboard provides high-level metrics for your entire agency.',
    disableBeacon: true
  },
  {
    target: '.revenue-chart',
    content: 'Track revenue trends and financial performance.'
  },
  {
    target: '.compliance-alerts',
    content: 'Monitor compliance issues requiring attention (EVV, credentials, training).'
  },
  {
    target: '.performance-metrics',
    content: 'View caregiver performance and reliability scores.'
  },
  {
    target: '.reports-button',
    content: 'Generate detailed reports for payroll, billing, and compliance.'
  }
];
```

### 4. Add Tour Launch Buttons

**File**: `showcase/src/components/tours/TourLauncher.tsx`

```typescript
import React from 'react';
import { useTour } from './TourProvider';
import { PlayIcon } from '@heroicons/react/24/outline';

interface TourLauncherProps {
  tourId: string;
  title: string;
  description: string;
  duration: string;
  icon?: React.ReactNode;
}

export function TourLauncher({ tourId, title, description, duration, icon }: TourLauncherProps) {
  const { startTour } = useTour();

  return (
    <button
      onClick={() => startTour(tourId)}
      className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-blue-600">{icon}</div>}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <PlayIcon className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
```

### 5. Create Tours Page

**File**: `showcase/src/pages/ToursPage.tsx`

```typescript
import React from 'react';
import { TourLauncher } from '../components/tours/TourLauncher';
import {
  UserGroupIcon,
  CalendarIcon,
  DevicePhoneMobileIcon,
  HomeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export function ToursPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Interactive Tours
      </h1>
      <p className="text-gray-600 mb-8">
        Learn how Care Commons works through guided, interactive tours for each role.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Coordinators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="coordinator-overview"
              title="Dashboard Overview"
              description="Learn to navigate the coordinator dashboard and understand key metrics."
              duration="3 minutes"
              icon={<ChartBarIcon className="w-6 h-6" />}
            />
            <TourLauncher
              tourId="create-visit"
              title="Create & Schedule Visits"
              description="Step-by-step guide to creating visits and using Smart Match."
              duration="4 minutes"
              icon={<CalendarIcon className="w-6 h-6" />}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Caregivers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="caregiver-workflow"
              title="Complete a Visit"
              description="Learn the full visit workflow from check-in to check-out."
              duration="5 minutes"
              icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Family Members
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="family-portal"
              title="Family Portal Tour"
              description="Discover how to stay connected with your loved one's care."
              duration="3 minutes"
              icon={<HomeIcon className="w-6 h-6" />}
            />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            For Administrators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TourLauncher
              tourId="admin-dashboard"
              title="Admin Dashboard"
              description="Understand agency-wide metrics and reporting capabilities."
              duration="4 minutes"
              icon={<UserGroupIcon className="w-6 h-6" />}
            />
          </div>
        </section>
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">
          Need help?
        </h3>
        <p className="text-blue-800 text-sm">
          Tours can be restarted at any time. Click the "?" icon in the top navigation to access tours from anywhere in the showcase.
        </p>
      </div>
    </div>
  );
}
```

### 6. Add Tour Help Button to Navigation

**File**: `showcase/src/components/Navigation.tsx`

Add help button that opens tours menu:

```typescript
<button
  onClick={() => navigate('/tours')}
  className="p-2 rounded-lg hover:bg-gray-100"
  title="Interactive Tours"
>
  <QuestionMarkCircleIcon className="w-6 h-6 text-gray-600" />
</button>
```

### 7. Add Auto-Start Tours for First-Time Users

**File**: `showcase/src/hooks/useFirstTimeUser.ts`

```typescript
import { useEffect } from 'react';
import { useTour } from '../components/tours/TourProvider';

export function useFirstTimeUser(tourId: string) {
  const { startTour } = useTour();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`tour-seen-${tourId}`);

    if (!hasSeenTour) {
      // Wait 1 second for page to load
      setTimeout(() => {
        startTour(tourId);
        localStorage.setItem(`tour-seen-${tourId}`, 'true');
      }, 1000);
    }
  }, [tourId, startTour]);
}
```

Use in pages:
```typescript
export function CoordinatorDashboard() {
  useFirstTimeUser('coordinator-overview');
  // ... rest of component
}
```

### 8. Add Tour Progress Tracking

**File**: `showcase/src/components/tours/TourProgress.tsx`

Track which tours user has completed:

```typescript
interface TourProgress {
  tourId: string;
  completed: boolean;
  completedAt?: string;
}

export function useTourProgress() {
  const [progress, setProgress] = useState<TourProgress[]>([]);

  const markTourComplete = (tourId: string) => {
    const newProgress: TourProgress = {
      tourId,
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(`tour-progress-${tourId}`, JSON.stringify(newProgress));
  };

  // Show completion badge or certificate
}
```

### 9. Add Video Walkthroughs

**File**: `showcase/src/pages/VideosPage.tsx`

Embed video walkthroughs for users who prefer video:

```typescript
const videos = [
  {
    title: 'Getting Started with Care Commons',
    duration: '5:30',
    thumbnail: '/videos/thumbnails/getting-started.jpg',
    url: '/videos/getting-started.mp4',
    description: 'Overview of Care Commons and key features'
  },
  // ... more videos
];
```

## Acceptance Criteria

- [ ] react-joyride or Shepherd.js integrated
- [ ] TourProvider system working
- [ ] 5+ tours defined for different personas
- [ ] Tours page created with all available tours
- [ ] Tour help button in navigation
- [ ] Auto-start tours for first-time users
- [ ] Tour progress tracking
- [ ] Tours work on mobile viewport
- [ ] Tours are skippable
- [ ] Tours save progress (can resume)
- [ ] Clear visual design for tour tooltips
- [ ] Video walkthroughs page created

## Design Considerations

- **Non-intrusive**: Easy to skip or pause
- **Contextual**: Tours start at relevant points in workflow
- **Progressive**: Simple → advanced features
- **Mobile-friendly**: Touch-friendly tooltips and navigation
- **Accessible**: Keyboard navigable, screen reader friendly

## Reference

- react-joyride: https://react-joyride.com/
- Shepherd.js: https://shepherdjs.dev/
- Intro.js: https://introjs.com/ (alternative)
