import { DriveStep } from 'driver.js';

export const coordinatorOverviewSteps: DriveStep[] = [
  {
    popover: {
      title: 'Welcome to Care Commons! 🎉',
      description: 'This showcase demonstrates a complete home healthcare management platform. You\'ll see how coordinators manage clients, caregivers, and visits with real data from TX, FL, and OH.',
    }
  },
  {
    element: '[data-tour="dashboard-stats"]',
    popover: {
      title: 'Quick Stats Overview',
      description: 'These cards show your key metrics at a glance: active clients, caregivers, care plans, and open shifts. The demo includes 60+ clients and 35+ caregivers with realistic data.',
    }
  },
  {
    element: '[data-tour="upcoming-tasks"]',
    popover: {
      title: 'Upcoming Tasks & Visits',
      description: 'View scheduled tasks and visits with priority levels. The demo includes 100+ tasks in various states: scheduled, in-progress, and completed with EVV compliance tracking.',
    }
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: 'Quick Actions',
      description: 'Access frequently-used features quickly from your dashboard. These actions are personalized based on your role.',
    }
  },
  {
    popover: {
      title: 'Navigation',
      description: 'Use the navigation menu to explore different modules: Clients, Care Plans, Caregivers, Scheduling, and more. Each module includes comprehensive demo data.',
    }
  },
  {
    popover: {
      title: 'Role Switching',
      description: 'Try switching roles using the role selector to see how the platform looks from different perspectives: patient, family member, caregiver, coordinator, or admin.',
    }
  }
];

export const createVisitSteps: DriveStep[] = [
  {
    popover: {
      title: 'Scheduling a Visit',
      description: 'Let\'s walk through creating and scheduling a new visit. This demonstrates our smart shift matching system.',
    }
  },
  {
    element: '[data-tour="client-selector"]',
    popover: {
      title: 'Select Client',
      description: 'First, select the client who needs care. The system shows all active clients with their location, service needs, and authorized hours.',
    }
  },
  {
    element: '[data-tour="date-time-picker"]',
    popover: {
      title: 'Schedule Date & Time',
      description: 'Choose when the visit should occur. The system checks for conflicts with existing appointments and caregiver availability.',
    }
  },
  {
    element: '[data-tour="service-selector"]',
    popover: {
      title: 'Select Services',
      description: 'Choose which services will be provided. Options are filtered based on the client\'s authorized care plan and state regulations.',
    }
  },
  {
    element: '[data-tour="caregiver-selector"]',
    popover: {
      title: 'Assign Caregiver',
      description: 'Manually select a caregiver, or use Smart Match. The list shows each caregiver\'s qualifications, availability, and distance from the client.',
    }
  },
  {
    element: '[data-tour="smart-match-button"]',
    popover: {
      title: 'Smart Match Algorithm',
      description: 'Our ML-based matching considers: required skills, certifications, travel distance, past performance, client preferences, and schedule conflicts.',
    }
  },
  {
    element: '[data-tour="submit-visit-button"]',
    popover: {
      title: 'Create & Notify',
      description: 'Once created, the caregiver receives a mobile notification with visit details, directions, and client care instructions.',
    }
  }
];

export const caregiverWorkflowSteps: DriveStep[] = [
  {
    popover: {
      title: 'Caregiver Mobile Experience',
      description: 'Welcome to the mobile app! Let\'s walk through a typical visit workflow from a caregiver\'s perspective.',
    }
  },
  {
    element: '[data-tour="today-visits-list"]',
    popover: {
      title: 'Today\'s Visit Schedule',
      description: 'See your day\'s assignments at a glance. Each visit shows the client, time, location, and required tasks.',
    }
  },
  {
    element: '[data-tour="visit-card"]',
    popover: {
      title: 'Visit Card',
      description: 'Tap any visit for full details: client profile, care plan, special instructions, emergency contacts, and GPS directions.',
    }
  },
  {
    element: '[data-tour="clock-in-button"]',
    popover: {
      title: 'EVV Clock-In',
      description: 'When you arrive, clock in using GPS geofencing and biometric verification. This ensures EVV compliance (21st Century Cures Act) for billing.',
    }
  },
  {
    element: '[data-tour="task-checklist"]',
    popover: {
      title: 'Care Task Checklist',
      description: 'Complete assigned tasks from the care plan: ADLs, medications, vital signs, etc. Add notes and photos as needed.',
    }
  },
  {
    element: '[data-tour="photo-capture"]',
    popover: {
      title: 'Photo Documentation',
      description: 'For wound care or other visual tracking, attach photos directly to tasks. These are HIPAA-compliant and encrypted.',
    }
  },
  {
    element: '[data-tour="clock-out-button"]',
    popover: {
      title: 'EVV Clock-Out',
      description: 'Clock out when finished. Time is automatically calculated for payroll and submitted to state EVV aggregators.',
    }
  },
  {
    element: '[data-tour="offline-indicator"]',
    popover: {
      title: 'Offline-First Design',
      description: 'Work without internet! All data is stored locally and syncs automatically when you\'re back online. Perfect for rural areas.',
    }
  }
];

export const familyPortalSteps: DriveStep[] = [
  {
    popover: {
      title: 'Family Engagement Portal',
      description: 'Welcome! This portal keeps you connected with your loved one\'s care. Let\'s explore the features.',
    }
  },
  {
    element: '[data-tour="activity-feed"]',
    popover: {
      title: 'Real-Time Activity Feed',
      description: 'See updates as they happen: when visits start and end, tasks completed, medications given, vital signs recorded, and any notable events.',
    }
  },
  {
    element: '[data-tour="upcoming-visits"]',
    popover: {
      title: 'Upcoming Visit Schedule',
      description: 'View all scheduled visits for the next 7 days. You\'ll know who\'s coming, when, and what services they\'ll provide.',
    }
  },
  {
    element: '[data-tour="care-team"]',
    popover: {
      title: 'Care Team Profiles',
      description: 'Meet the caregivers providing care. See their photos, certifications, background check status, and years of experience.',
    }
  },
  {
    element: '[data-tour="messaging"]',
    popover: {
      title: 'Secure Messaging',
      description: 'Communicate directly with coordinators and care team. All messages are HIPAA-compliant and encrypted.',
    }
  },
  {
    element: '[data-tour="care-plan"]',
    popover: {
      title: 'Care Plan Access',
      description: 'Review the current care plan, goals, and progress. You can see what tasks are scheduled and how your loved one is doing.',
    }
  },
  {
    element: '[data-tour="notifications"]',
    popover: {
      title: 'Smart Notifications',
      description: 'Receive alerts for: visit start/end, missed visits, medication reminders, falls or incidents, and care plan changes.',
    }
  },
  {
    element: '[data-tour="reports"]',
    popover: {
      title: 'Care Reports',
      description: 'Download monthly care summaries, visit logs, and progress reports. Perfect for family discussions or medical appointments.',
    }
  }
];

export const adminDashboardSteps: DriveStep[] = [
  {
    popover: {
      title: 'Administrator Dashboard 📊',
      description: 'Welcome to the executive view. Monitor your entire agency\'s operations across multiple states and locations.',
    }
  },
  {
    element: '[data-tour="kpi-cards"]',
    popover: {
      title: 'Key Performance Indicators',
      description: 'Agency-wide metrics at a glance: revenue, client census, caregiver utilization, EVV compliance rate, and more. The demo shows realistic multi-state operations.',
    }
  },
  {
    element: '[data-tour="revenue-chart"]',
    popover: {
      title: 'Financial Performance',
      description: 'Track revenue trends, billing cycles, A/R aging, and payer mix. The demo includes 30+ invoices across Medicare, Medicaid, and private pay.',
    }
  },
  {
    element: '[data-tour="compliance-dashboard"]',
    popover: {
      title: 'Compliance Monitoring',
      description: 'Real-time compliance tracking: EVV submission rates, background checks, credential expiration, mandatory training completion, and audit readiness.',
    }
  },
  {
    element: '[data-tour="state-compliance"]',
    popover: {
      title: 'State-Specific Compliance',
      description: 'Each state has unique requirements (TX HHSC, FL AHCA, OH ODM). The system tracks all 50 states\' regulations and alerts you to issues.',
    }
  },
  {
    element: '[data-tour="performance-metrics"]',
    popover: {
      title: 'Operational Metrics',
      description: 'Monitor caregiver performance, client satisfaction, on-time arrival rates, task completion rates, and turnover metrics.',
    }
  },
  {
    element: '[data-tour="analytics"]',
    popover: {
      title: 'Advanced Analytics',
      description: 'Drill down into trends: visit duration vs. scheduled, service utilization, payer authorization tracking, and predictive scheduling.',
    }
  },
  {
    element: '[data-tour="reports-button"]',
    popover: {
      title: 'Regulatory Reports',
      description: 'Generate reports for: state submissions, EVV aggregator files, payroll, billing reconciliation, incident reports, and OASIS data.',
    }
  },
  {
    popover: {
      title: 'Multi-Agency Support',
      description: 'The platform supports white-labeling for multiple agencies, each with separate data, branding, and compliance configurations.',
    }
  }
];

// New vertical-specific tours
export const clientManagementSteps: DriveStep[] = [
  {
    popover: {
      title: 'Client Demographics Module',
      description: 'Comprehensive client management with full demographic data, medical history, and emergency contacts.',
    }
  },
  {
    element: '[data-tour="client-list"]',
    popover: {
      title: 'Client Directory',
      description: 'Browse all clients with filtering by status, location, payer source, and service type. The demo includes 60+ realistic profiles.',
    }
  },
  {
    element: '[data-tour="client-search"]',
    popover: {
      title: 'Advanced Search',
      description: 'Search by name, address, phone, medical record number, or condition. Results update in real-time.',
    }
  },
  {
    element: '[data-tour="add-client"]',
    popover: {
      title: 'Client Intake',
      description: 'Add new clients with guided intake forms that adapt based on state requirements and payer source.',
    }
  }
];

export const carePlanSteps: DriveStep[] = [
  {
    popover: {
      title: 'Care Plans & Tasks',
      description: 'Create personalized care plans with goals, assessments, and task scheduling.',
    }
  },
  {
    element: '[data-tour="care-plan-templates"]',
    popover: {
      title: 'Care Plan Templates',
      description: 'Start with evidence-based templates for common conditions: diabetes, CHF, post-surgical, dementia, etc.',
    }
  },
  {
    element: '[data-tour="task-scheduling"]',
    popover: {
      title: 'Task Scheduling',
      description: 'Schedule recurring tasks (medications, vitals, ADLs) with customizable frequencies and reminders.',
    }
  }
];

export const billingSteps: DriveStep[] = [
  {
    popover: {
      title: 'Billing & Invoicing',
      description: 'Automated billing for Medicare, Medicaid, and private pay clients with EVV integration.',
    }
  },
  {
    element: '[data-tour="invoice-list"]',
    popover: {
      title: 'Invoice Management',
      description: 'Track all invoices by status: draft, submitted, paid, or overdue. The demo includes 30+ sample invoices.',
    }
  },
  {
    element: '[data-tour="evv-verification"]',
    popover: {
      title: 'EVV-Based Billing',
      description: 'Invoices are auto-generated from verified EVV records, ensuring accurate billable time and compliance.',
    }
  }
];

export const shiftMatchingSteps: DriveStep[] = [
  {
    popover: {
      title: 'Smart Shift Matching',
      description: 'ML-powered caregiver-to-client matching based on skills, location, preferences, and availability.',
    }
  },
  {
    element: '[data-tour="open-shifts"]',
    popover: {
      title: 'Open Shift Board',
      description: 'View all unfilled shifts with priority levels. The system automatically suggests best-match caregivers.',
    }
  },
  {
    element: '[data-tour="match-algorithm"]',
    popover: {
      title: 'Matching Algorithm',
      description: 'Considers: required certifications, language match, past performance, travel distance, client preferences, and schedule conflicts.',
    }
  }
];

export const payrollSteps: DriveStep[] = [
  {
    popover: {
      title: 'Payroll Processing',
      description: 'Automated payroll from EVV records with overtime calculation and state-specific rules.',
    }
  },
  {
    element: '[data-tour="timesheet-review"]',
    popover: {
      title: 'Timesheet Review',
      description: 'Review and approve timesheets before processing. All times are verified by EVV GPS and biometric data.',
    }
  },
  {
    element: '[data-tour="payroll-export"]',
    popover: {
      title: 'Payroll Export',
      description: 'Export to popular payroll systems: ADP, Paychex, QuickBooks. Includes all required tax withholdings.',
    }
  }
];
