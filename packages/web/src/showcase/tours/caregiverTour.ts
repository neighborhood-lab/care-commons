/**
 * Caregiver Tour
 *
 * Mobile workflow tour for field caregivers
 */

import { Tour } from '../types';

export const caregiverTour: Tour = {
  id: 'caregiver-mobile',
  name: 'Caregiver Mobile Experience',
  description: 'Complete visit workflow with GPS clock-in, task completion, and offline mode',
  role: 'caregiver',
  estimatedTime: 12,
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: 'Welcome to the Mobile App!',
      content:
        'As a caregiver, you\'ll use this mobile app in the field to manage your visits, clock in/out with GPS verification, complete care tasks, and document your work - even when offline!',
      placement: 'bottom',
      highlightElement: false,
    },
    {
      id: 'todays-schedule',
      target: '[data-tour="visit-schedule"]',
      title: 'Today\'s Visit Schedule',
      content:
        'Your schedule shows all visits for today with client names, addresses, scheduled times, and visit durations. Tap any visit to see details or start navigation.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'visit-details',
      target: '[data-tour="visit-card"]',
      title: 'Visit Information',
      content:
        'Each visit card shows: client name, address with map link, scheduled time window, required tasks, and any special instructions or client preferences.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'navigation',
      target: '[data-tour="navigate-button"]',
      title: 'GPS Navigation',
      content:
        'Tap "Navigate" to open your phone\'s map app with directions to the client\'s address. The app uses GPS to verify you\'ve arrived at the correct location.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'clock-in',
      target: '[data-tour="clock-in-button"]',
      title: 'Clock In with EVV',
      content:
        'When you arrive at the client location, tap "Clock In". The app captures: your GPS coordinates, current time, device ID, and verifies you\'re within the geofence boundary (typically 100-150 meters).',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'geofence-verification',
      target: '[data-tour="gps-status"]',
      title: 'Geofence Verification',
      content:
        'You must be within the blue geofence circle to clock in. If GPS shows you\'re too far away, move closer to the address or wait for better GPS accuracy. This ensures EVV compliance.',
      placement: 'top',
      highlightElement: true,
    },
    {
      id: 'task-list',
      target: '[data-tour="visit-tasks"]',
      title: 'Care Plan Tasks',
      content:
        'These are the tasks from the client\'s care plan that you need to complete during this visit. Check off each task as you finish it. Some tasks may require photo verification.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'photo-verification',
      target: '[data-tour="photo-task"]',
      title: 'Photo Verification',
      content:
        'Tasks marked with a camera icon require photo verification. This could be documentation of meal preparation, medication administration log, or environmental safety checks.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'visit-notes',
      target: '[data-tour="visit-notes"]',
      title: 'Visit Documentation',
      content:
        'Document important observations here: client mood and engagement, any changes in condition, medication compliance, safety concerns, or communication with family members.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'voice-to-text',
      target: '[data-tour="voice-button"]',
      title: 'Voice-to-Text Notes',
      content:
        'Use voice-to-text to quickly dictate your notes hands-free. This is especially useful when you need to document observations while providing care.',
      placement: 'left',
      highlightElement: true,
    },
    {
      id: 'clock-out',
      target: '[data-tour="clock-out-button"]',
      title: 'Clock Out Process',
      content:
        'Before clocking out, ensure all required tasks are checked off and you\'ve added visit notes. Clock out captures the same EVV elements as clock in: GPS, time, device ID.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'offline-mode',
      target: '[data-tour="offline-indicator"]',
      title: 'Works Offline',
      content:
        'The app works even without internet connection. All your visits, tasks, and clock in/out data is stored locally on your device and automatically syncs when you\'re back online.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'sync-status',
      target: '[data-tour="sync-badge"]',
      title: 'Sync Status',
      content:
        'This icon shows your sync status. When you have unsynced visits (because you were offline), it shows a count. When back online, it automatically uploads your data to the system.',
      placement: 'left',
      highlightElement: true,
    },
    {
      id: 'tour-complete',
      target: 'body',
      title: 'You\'re Ready to Go!',
      content:
        'You now know how to use the mobile app for your visits: check your schedule, navigate to clients, clock in/out with GPS, complete tasks, document your work, and work offline. Great job!',
      placement: 'bottom',
      highlightElement: false,
    },
  ],
};
