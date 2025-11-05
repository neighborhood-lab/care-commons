/**
 * Patient/Family Tour
 *
 * Brief tour of patient and family portal features
 */

import { Tour } from '../types';

export const patientTour: Tour = {
  id: 'patient-family',
  name: 'Patient & Family Portal Tour',
  description: 'View your care plan, upcoming visits, and communicate with your care team',
  role: 'patient',
  estimatedTime: 5,
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: 'Welcome to Your Care Portal',
      content:
        'This portal lets you and your family stay informed about your care. You can view your care plan progress, see upcoming visits, review visit history, and message your care team.',
      placement: 'bottom',
      highlightElement: false,
    },
    {
      id: 'personal-dashboard',
      target: '[data-tour="patient-dashboard"]',
      title: 'Your Personal Dashboard',
      content:
        'Your dashboard provides an overview of: upcoming visits this week, care plan goal progress, recent caregiver visits, and any messages from your care coordinator.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'upcoming-visits',
      target: '[data-tour="upcoming-visits"]',
      title: 'Upcoming Visit Schedule',
      content:
        'See who will be visiting you and when. You can view the caregiver\'s name, photo, scheduled time, and what services they\'ll be providing during the visit.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'caregiver-info',
      target: '[data-tour="caregiver-profile"]',
      title: 'Your Care Team',
      content:
        'Learn about your assigned caregivers: their certifications, years of experience, languages spoken, and any special training they have. You can also rate your experience after each visit.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'care-plan-progress',
      target: '[data-tour="care-plan"]',
      title: 'Care Plan & Goals',
      content:
        'Your care plan lists the goals your care team is working on with you, such as improving mobility, medication management, or nutrition. Track progress and see what activities are planned.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'visit-history',
      target: '[data-tour="visit-history"]',
      title: 'Visit History',
      content:
        'Review past visits: who came, when they arrived and left, what tasks were completed, and notes from your caregivers. This helps you stay informed about your care.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'communication',
      target: '[data-tour="messages"]',
      title: 'Messaging Your Care Team',
      content:
        'Send messages to your care coordinator if you need to request schedule changes, ask questions about your care plan, or report any concerns. They typically respond within 24 hours.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'emergency-contacts',
      target: '[data-tour="emergency-info"]',
      title: 'Emergency Information',
      content:
        'Access important contact information: your care coordinator, agency phone number, after-hours emergency line, and family members listed as emergency contacts.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'tour-complete',
      target: 'body',
      title: 'Stay Connected!',
      content:
        'You now know how to use your care portal to stay informed about your care, view your schedule, track progress on your goals, and communicate with your care team. Feel free to explore!',
      placement: 'bottom',
      highlightElement: false,
    },
  ],
};
