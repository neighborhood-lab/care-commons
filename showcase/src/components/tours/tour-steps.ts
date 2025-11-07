import { DriveStep } from 'driver.js';

export const coordinatorOverviewSteps: DriveStep[] = [
  {
    element: '.dashboard-overview',
    popover: {
      title: 'Welcome to Care Commons!',
      description: 'This is your coordinator dashboard where you manage clients, caregivers, and visits.',
    }
  },
  {
    element: '.today-visits-widget',
    popover: {
      title: "Today's Visits",
      description: "Here you can see today's scheduled visits and their real-time status."
    }
  },
  {
    element: '.active-clients-widget',
    popover: {
      title: 'Active Clients',
      description: 'View your active clients and quickly access their care plans.'
    }
  },
  {
    element: '.caregiver-status-widget',
    popover: {
      title: 'Caregiver Status',
      description: 'Monitor caregiver availability and current location during visits.'
    }
  },
  {
    element: '.create-visit-button',
    popover: {
      title: 'Create New Visit',
      description: "Let's create a new visit. Click here to get started."
    }
  }
];

export const createVisitSteps: DriveStep[] = [
  {
    element: '.client-selector',
    popover: {
      title: 'Select Client',
      description: 'First, select the client for this visit.',
    }
  },
  {
    element: '.date-time-picker',
    popover: {
      title: 'Schedule Time',
      description: 'Choose the date and time for the visit.'
    }
  },
  {
    element: '.service-selector',
    popover: {
      title: 'Choose Services',
      description: 'Select the services to be provided during this visit.'
    }
  },
  {
    element: '.caregiver-selector',
    popover: {
      title: 'Assign Caregiver',
      description: 'Choose a caregiver. The system shows availability and distance from client.'
    }
  },
  {
    element: '.smart-match-button',
    popover: {
      title: 'Smart Match',
      description: 'Or use Smart Match to automatically find the best caregiver based on skills, location, and availability.'
    }
  },
  {
    element: '.submit-visit-button',
    popover: {
      title: 'Create Visit',
      description: 'Review and create the visit. The caregiver will be notified on their mobile app.'
    }
  }
];

export const caregiverWorkflowSteps: DriveStep[] = [
  {
    element: '.today-visits-list',
    popover: {
      title: 'Your Visits',
      description: 'Welcome, caregiver! Here are your visits for today.',
    }
  },
  {
    element: '.visit-card:first-child',
    popover: {
      title: 'Visit Details',
      description: 'Tap a visit to see details, get directions, or check in.'
    }
  },
  {
    element: '.check-in-button',
    popover: {
      title: 'Check In',
      description: 'When you arrive, check in using GPS and biometric verification.'
    }
  },
  {
    element: '.task-checklist',
    popover: {
      title: 'Complete Tasks',
      description: 'During the visit, complete assigned tasks and document care.'
    }
  },
  {
    element: '.check-out-button',
    popover: {
      title: 'Check Out',
      description: 'When finished, check out. Your time is automatically recorded for payroll.'
    }
  },
  {
    element: '.offline-indicator',
    popover: {
      title: 'Offline Support',
      description: 'All features work offline! Your data syncs when you have connection.'
    }
  }
];

export const familyPortalSteps: DriveStep[] = [
  {
    element: '.activity-feed',
    popover: {
      title: 'Activity Feed',
      description: 'Welcome to the family portal! See real-time updates about your loved one\'s care.',
    }
  },
  {
    element: '.upcoming-visits',
    popover: {
      title: 'Upcoming Visits',
      description: 'View upcoming scheduled visits and who will be providing care.'
    }
  },
  {
    element: '.care-team',
    popover: {
      title: 'Care Team',
      description: 'Meet the care team - see photos and background of assigned caregivers.'
    }
  },
  {
    element: '.messaging',
    popover: {
      title: 'Messaging',
      description: 'Send messages to the coordinator if you have questions or concerns.'
    }
  },
  {
    element: '.notifications',
    popover: {
      title: 'Notifications',
      description: 'Get notifications for important events like visit start, completion, and any issues.'
    }
  }
];

export const adminDashboardSteps: DriveStep[] = [
  {
    element: '.kpi-cards',
    popover: {
      title: 'Admin Dashboard',
      description: 'Admin dashboard provides high-level metrics for your entire agency.',
    }
  },
  {
    element: '.revenue-chart',
    popover: {
      title: 'Revenue Trends',
      description: 'Track revenue trends and financial performance.'
    }
  },
  {
    element: '.compliance-alerts',
    popover: {
      title: 'Compliance Monitoring',
      description: 'Monitor compliance issues requiring attention (EVV, credentials, training).'
    }
  },
  {
    element: '.performance-metrics',
    popover: {
      title: 'Performance Metrics',
      description: 'View caregiver performance and reliability scores.'
    }
  },
  {
    element: '.reports-button',
    popover: {
      title: 'Reports',
      description: 'Generate detailed reports for payroll, billing, and compliance.'
    }
  }
];
