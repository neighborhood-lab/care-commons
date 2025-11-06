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
