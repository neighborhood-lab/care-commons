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
