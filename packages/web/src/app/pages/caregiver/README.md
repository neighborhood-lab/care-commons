# Mobile-Responsive Caregiver View

## Overview

This directory contains mobile-optimized pages and components specifically designed for caregivers using mobile devices in the field. All components follow mobile-first design principles with large touch targets, simplified layouts, and device-specific features.

## Features

### 1. **Check-In/Out Page** (`CheckInPage.tsx`)

Mobile-optimized visit check-in and check-out with GPS verification.

**Key Features:**
- ✅ GPS location tracking with visual indicator
- ✅ Large check-in/out buttons (min 56px height)
- ✅ Real-time location accuracy display
- ✅ Visit details with tap-to-call client
- ✅ Task checklist integration
- ✅ Sticky header on mobile
- ✅ Fixed bottom action bar

**Usage:**
```tsx
import { CheckInPage } from '@/app/pages/caregiver';

// In router
<Route path="/caregiver/checkin/:visitId" element={<CheckInPage />} />
```

**Routes:**
- `/caregiver/checkin/:visitId` - Check-in page for specific visit

**GPS Requirements:**
- Location permission must be granted
- GPS must be enabled for check-in
- Displays accuracy in meters

---

### 2. **Task Checklist Page** (`TaskChecklistPage.tsx`)

Mobile-optimized task management with swipe-to-complete gestures.

**Key Features:**
- ✅ Swipe right to complete tasks (mobile only)
- ✅ Visual swipe feedback
- ✅ Large touch targets (min 60px height)
- ✅ Progress tracking with visual bar
- ✅ Task filtering (all, pending, completed)
- ✅ Priority indicators
- ✅ Category badges

**Usage:**
```tsx
import { TaskChecklistPage } from '@/app/pages/caregiver';

<Route path="/caregiver/tasks/:visitId" element={<TaskChecklistPage />} />
```

**Swipe Gestures:**
- Swipe right 100px+ to mark complete
- Visual feedback during swipe
- Desktop fallback: click checkbox

**Task Priorities:**
- **High** - Red badge, urgent tasks
- **Medium** - Yellow badge, important tasks
- **Low** - Blue badge, optional tasks

---

### 3. **Quick Notes Page** (`QuickNotesPage.tsx`)

Voice-enabled note-taking for caregivers.

**Key Features:**
- ✅ Voice-to-text dictation (Web Speech API)
- ✅ Large text area optimized for mobile
- ✅ Quick note templates
- ✅ Note categorization
- ✅ Save draft functionality
- ✅ Visual recording indicator
- ✅ Real-time transcript display

**Usage:**
```tsx
import { QuickNotesPage } from '@/app/pages/caregiver';

<Route path="/caregiver/notes/:visitId" element={<QuickNotesPage />} />
```

**Voice Dictation:**
- Continuous recognition while recording
- Automatic punctuation
- Works in Chrome, Safari, Edge
- Graceful fallback if not supported

**Note Templates:**
- Client Well
- Medication
- Meal
- Activity

---

### 4. **Client Contact Card** (`components/ClientContactCard.tsx`)

Reusable component for displaying client contact information with mobile-friendly interactions.

**Key Features:**
- ✅ Tap-to-call phone numbers
- ✅ Tap-to-email
- ✅ Tap-to-navigate address
- ✅ Emergency contacts section
- ✅ Large touch targets (min 52px)
- ✅ Visual call-to-action indicators

**Usage:**
```tsx
import { ClientContactCard } from '@/app/pages/caregiver';

<ClientContactCard
  contact={{
    clientName: 'John Smith',
    clientPhone: '(512) 555-0101',
    clientEmail: 'john@example.com',
    address: '123 Main St, Austin, TX',
    emergencyContacts: [
      {
        name: 'Jane Smith',
        relationship: 'Daughter',
        phone: '(512) 555-0102',
      },
    ],
  }}
  showEmergencyContacts={true}
/>
```

---

## Enhanced Dashboard

The main `CaregiverDashboard.tsx` has been enhanced with mobile-responsive features:

**Mobile Enhancements:**
- ✅ Responsive grid layouts (1 column on mobile)
- ✅ Larger touch targets (min 44px)
- ✅ Prominent check-in/out buttons
- ✅ Tap-to-call client phone
- ✅ Mobile-optimized card layouts
- ✅ Sticky headers and larger text

**Desktop vs Mobile:**
```tsx
// Grid adjusts automatically
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
  {/* Stacks on mobile, 3 columns on desktop */}
</div>

// Button sizes adjust
<Button
  size={isMobile ? 'lg' : 'sm'}
  className={isMobile ? 'w-full min-h-[44px]' : ''}
>
  Check In
</Button>
```

---

## Responsive Utilities

### **useMediaQuery Hook**

Custom hook for responsive design logic.

**Location:** `packages/web/src/core/hooks/useMediaQuery.ts`

**Available Hooks:**
```tsx
import { useIsMobile, useIsTablet, useIsDesktop, useIsTouchDevice } from '@/core/hooks';

const isMobile = useIsMobile();     // < 768px
const isTablet = useIsTablet();     // 768px - 1023px
const isDesktop = useIsDesktop();   // >= 1024px
const isTouch = useIsTouchDevice(); // Touch-enabled device
```

**Usage Example:**
```tsx
const Component = () => {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'p-4' : 'p-6'}>
      <h1 className={isMobile ? 'text-xl' : 'text-2xl'}>
        Title
      </h1>
    </div>
  );
};
```

---

## Mobile Design Principles

### **Touch Targets**

All interactive elements follow Apple and Google's minimum touch target guidelines:

- **Minimum**: 44x44px (iOS), 48x48px (Android)
- **Recommended**: 44-48px for all touch targets
- **Implementation**: Use `min-h-[44px]` or `min-h-[48px]`

```tsx
// ✅ Good - Large enough touch target
<button className="min-h-[44px] px-4">
  Check In
</button>

// ❌ Bad - Too small for mobile
<button className="h-8 px-2">
  Check In
</button>
```

### **Typography**

Mobile-optimized text sizing:

```tsx
// Headings
<h1 className={isMobile ? 'text-xl' : 'text-2xl'}>Main Heading</h1>
<h2 className={isMobile ? 'text-lg' : 'text-xl'}>Subheading</h2>

// Body text - use text-base (16px) on mobile for readability
<p className={isMobile ? 'text-base' : 'text-sm'}>Content</p>
```

### **Spacing**

Adjust spacing for mobile screens:

```tsx
// Vertical spacing
<div className={`space-y-${isMobile ? '4' : '6'}`}>

// Padding
<Card padding={isMobile ? 'md' : 'lg'}>

// Gaps in flex/grid
<div className="gap-4 md:gap-6">
```

### **Layout Patterns**

**Stack on Mobile, Grid on Desktop:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 col mobile, 2 col tablet, 3 col desktop */}
</div>
```

**Full Width on Mobile:**
```tsx
<Button
  className={isMobile ? 'w-full' : 'w-auto'}
>
  Submit
</Button>
```

**Fixed Bottom Actions (Mobile):**
```tsx
<div className={isMobile ? 'fixed bottom-0 left-0 right-0 p-4 bg-white border-t' : ''}>
  <Button>Check In</Button>
</div>
```

---

## Testing

### **Responsive Testing**

Test on actual devices when possible. Browser DevTools responsive mode is useful but doesn't capture all mobile behaviors:

**Recommended Test Devices:**
- iPhone SE (small screen)
- iPhone 14 Pro (modern iOS)
- Samsung Galaxy S23 (modern Android)
- iPad (tablet)

**Manual Tests:**
1. Touch target sizes (can you easily tap without mistakes?)
2. Swipe gestures (smooth and responsive?)
3. Voice dictation (works in Safari/Chrome?)
4. GPS location (prompts for permission?)
5. Tap-to-call (opens phone dialer?)
6. Orientation changes (portrait/landscape)

### **Browser DevTools Testing**

```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Select device: iPhone 14 Pro, Pixel 7, etc.
4. Test both portrait and landscape

# Safari Responsive Design Mode
1. Develop → Enter Responsive Design Mode
2. Test iOS-specific features
```

### **Automated Testing**

Add viewport tests to your test files:

```tsx
import { render } from '@testing-library/react';
import { useMediaQuery } from '@/core/hooks';

// Mock mobile viewport
beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query === '(max-width: 767px)',
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }));
});
```

---

## Performance Considerations

### **Mobile Optimization**

1. **Reduce Bundle Size**: Mobile users often have slower connections
   - Lazy load components
   - Code split by route
   - Optimize images

2. **Touch Performance**:
   - Use CSS transforms for smooth animations
   - Debounce expensive operations
   - Optimize scroll handlers

3. **Network Awareness**:
   - Handle offline scenarios
   - Show loading states
   - Cache data when possible

### **GPS Performance**

```tsx
// Use appropriate accuracy settings
navigator.geolocation.getCurrentPosition(
  successCallback,
  errorCallback,
  {
    enableHighAccuracy: true,  // More accurate but slower
    timeout: 10000,             // 10 second timeout
    maximumAge: 0,              // No cached position
  }
);
```

---

## Browser Support

### **Required Features**

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Touch Events | ✅ | ✅ | ✅ | ✅ |
| Geolocation API | ✅ | ✅ | ✅ | ✅ |
| Web Speech API | ✅ | ✅ | ❌ | ✅ |
| Media Queries | ✅ | ✅ | ✅ | ✅ |
| Flexbox | ✅ | ✅ | ✅ | ✅ |

### **Graceful Degradation**

All features have fallbacks for unsupported browsers:

```tsx
// Voice dictation fallback
{speechSupported ? (
  <VoiceButton />
) : (
  <TextInput placeholder="Type your notes..." />
)}

// GPS fallback
{location.error && (
  <ManualLocationInput />
)}
```

---

## Future Enhancements

Potential improvements for mobile caregiver experience:

- [ ] **Offline Mode**: Cache visit data for offline access
- [ ] **Push Notifications**: Visit reminders and updates
- [ ] **Photo Upload**: Document visit with photos
- [ ] **Signature Capture**: Client/caregiver signatures
- [ ] **Biometric Auth**: Touch ID / Face ID login
- [ ] **QR Code Check-in**: Scan client QR for instant check-in
- [ ] **Dark Mode**: Reduce eye strain in low light
- [ ] **Accessibility**: Screen reader optimization
- [ ] **Multi-language**: i18n support for non-English caregivers

---

## Troubleshooting

### **Common Issues**

**GPS Not Working:**
```
Problem: Location always returns error
Solution:
  1. Check HTTPS (required for geolocation)
  2. User must grant permission
  3. GPS must be enabled on device
```

**Voice Dictation Silent:**
```
Problem: No speech recognition
Solution:
  1. Check browser support (Chrome, Safari, Edge)
  2. Grant microphone permission
  3. Must use HTTPS
  4. Check for quiet environment
```

**Touch Targets Too Small:**
```
Problem: Hard to tap buttons
Solution:
  1. Ensure min-h-[44px] or larger
  2. Test on actual device
  3. Add padding around interactive elements
```

**Swipe Gestures Not Working:**
```
Problem: Swipe doesn't complete task
Solution:
  1. Check touch-pan-y class is set
  2. Ensure swipe threshold is appropriate
  3. Test on touch device (not mouse drag)
```

---

## Contributing

When adding new mobile features:

1. **Always use `useIsMobile` hook** for responsive logic
2. **Minimum touch target: 44px** height
3. **Test on actual devices** before committing
4. **Add fallbacks** for unsupported features
5. **Document** new components in this README

---

## Resources

- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/inputs/touch)
- [Material Design - Touch Targets](https://m3.material.io/foundations/accessible-design/accessibility-basics)
- [MDN - Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [MDN - Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [MDN - Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
