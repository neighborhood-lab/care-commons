import { DriveStep } from 'driver.js';

export const coordinatorOverviewSteps: DriveStep[] = [
  {
    element: '.dashboard-overview',
    popover: {
      title: 'Welcome to Care Commons! 🎉',
      description: 'This is your coordinator dashboard where you manage clients, caregivers, and visits. The showcase includes 60+ clients, 35+ caregivers, and 100+ tasks across TX, FL, and OH.',
    }
  },
  {
    element: '.today-visits-widget',
    popover: {
      title: "Today's Visits",
      description: "See today's scheduled visits and their real-time status. The demo includes visits in various states: scheduled, in-progress, and completed with EVV compliance data."
    }
  },
  {
    element: '.active-clients-widget',
    popover: {
      title: 'Active Clients',
      description: 'View your 60+ active clients with realistic demographics, conditions, and emergency contacts. Click any client to see their full profile and care plan.'
    }
  },
  {
    element: '.caregiver-status-widget',
    popover: {
      title: 'Caregiver Status',
      description: 'Monitor your 35+ caregivers with varied certifications (CNAs, HHAs, companions) and availability. Real-time location tracking during visits.'
    }
  },
  {
    element: '.create-visit-button',
    popover: {
      title: 'Create New Visit',
      description: "Try the smart shift matching system! It automatically suggests the best caregiver based on skills, location, and availability."
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
      title: 'Admin Dashboard 📊',
      description: 'High-level metrics for your entire agency across all locations. The demo includes multi-state operations (TX, FL, OH) with realistic KPIs.',
    }
  },
  {
    element: '.revenue-chart',
    popover: {
      title: 'Revenue Trends',
      description: 'Track revenue trends and financial performance with 30+ realistic invoices across paid, pending, and overdue states.'
    }
  },
  {
    element: '.compliance-alerts',
    popover: {
      title: 'Compliance Monitoring',
      description: 'Monitor compliance issues: EVV requirements, expiring credentials, and mandatory training. The demo includes caregivers with certifications expiring soon to demonstrate alerts.'
    }
  },
  {
    element: '.performance-metrics',
    popover: {
      title: 'Performance Metrics',
      description: 'View caregiver performance scores, reliability metrics, and client satisfaction ratings based on completed visits.'
    }
  },
  {
    element: '.reports-button',
    popover: {
      title: 'Reports',
      description: 'Generate detailed reports for payroll, billing, compliance, and state-specific regulatory requirements (21 CFR Part 11, HIPAA).'
    }
  }
];
