# Task 0039: Showcase Guided Tours and Enhancements

**Priority**: 🟡 MEDIUM
**Phase**: Phase 3 - Polish & Developer Experience
**Estimated Effort**: 8-10 hours

## Context

The showcase is the first experience for new users. Guided tours help users understand the platform's capabilities and encourage adoption.

## Problem Statement

Current gaps:
- No guided tours
- Users must explore independently
- Features may be missed
- Learning curve is steep

## Task

### 1. Install Tour Library

```bash
npm install react-joyride --save
npm install @types/react-joyride --save-dev
```

### 2. Create Tour System

**File**: `packages/web/src/showcase/services/tour.service.ts`

```typescript
import { Step } from 'react-joyride';

export const tours = {
  coordinator: [
    {
      target: '#dashboard',
      content: 'Welcome! This is your coordinator dashboard where you manage clients, caregivers, and visits.',
      disableBeacon: true,
    },
    {
      target: '#clients-nav',
      content: 'View and manage all your clients here. You can add new clients, update their information, and manage care plans.',
    },
    {
      target: '#scheduling',
      content: 'The scheduling system helps you match caregivers to visits based on skills, location, and availability.',
    },
    {
      target: '#evv-status',
      content: 'Monitor real-time visit status with EVV compliance tracking for Texas, Florida, and 5 other states.',
    },
  ] as Step[],

  caregiver: [
    {
      target: '#today-visits',
      content: 'Here are your visits for today. Tap a visit to check in when you arrive.',
      disableBeacon: true,
    },
    {
      target: '#check-in-btn',
      content: 'Use this button to check in when you arrive. GPS and biometric verification ensure EVV compliance.',
    },
    {
      target: '#tasks',
      content: 'Complete care plan tasks during the visit. All tasks are tracked and reported to families.',
    },
  ] as Step[],

  family: [
    {
      target: '#family-dashboard',
      content: 'Welcome! View real-time updates about your loved one\'s care.',
      disableBeacon: true,
    },
    {
      target: '#visit-timeline',
      content: 'See exactly when caregivers check in and out, with automatic notifications.',
    },
    {
      target: '#messages',
      content: 'Send messages directly to coordinators and caregivers.',
    },
    {
      target: '#care-plan',
      content: 'View the current care plan and see which tasks have been completed.',
    },
  ] as Step[],
};
```

### 3. Implement Tour Component

**File**: `packages/web/src/showcase/components/GuidedTour.tsx`

```typescript
import React, { useState } from 'react';
import Joyride, { CallBackProps, Step, STATUS } from 'react-joyride';
import { tours } from '../services/tour.service';

interface GuidedTourProps {
  tourId: keyof typeof tours;
  onComplete?: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ tourId, onComplete }) => {
  const [run, setRun] = useState(true);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      onComplete?.();

      // Save tour completion
      localStorage.setItem(`tour_${tourId}_completed`, 'true');
    }
  };

  // Don't show tour if already completed
  if (localStorage.getItem(`tour_${tourId}_completed`)) {
    return null;
  }

  return (
    <Joyride
      steps={tours[tourId]}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4F46E5',
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};
```

### 4. Add Tour Triggers

**File**: `packages/web/src/showcase/pages/ShowcaseDashboard.tsx`

```typescript
import { GuidedTour } from '../components/GuidedTour';

export const ShowcaseDashboard: React.FC = () => {
  const persona = useShowcasePersona();

  return (
    <>
      <GuidedTour tourId={persona} onComplete={() => console.log('Tour completed')} />

      {/* Rest of dashboard */}
    </>
  );
};
```

## Acceptance Criteria

- [ ] Tours created for all personas
- [ ] Tour system implemented
- [ ] Tours skippable
- [ ] Tour progress saved
- [ ] Tours don't repeat after completion
- [ ] Mobile-friendly tours

## Priority Justification

**MEDIUM** priority - improves onboarding but not critical for launch.

---

**Next Task**: 0040 - Production Launch Checklist
