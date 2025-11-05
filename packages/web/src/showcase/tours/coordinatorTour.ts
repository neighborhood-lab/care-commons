/**
 * Care Coordinator Tour
 *
 * Daily workflow tour for care coordinators
 */

import { Tour } from '../types';

export const coordinatorTour: Tour = {
  id: 'coordinator-workflow',
  name: 'Care Coordinator Workflow Tour',
  description: 'Learn how to manage clients, create care plans, assign caregivers, and handle EVV exceptions',
  role: 'coordinator',
  estimatedTime: 10,
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: 'Welcome, Care Coordinator!',
      content:
        'As a care coordinator, you\'re the bridge between clients, caregivers, and administrative operations. This tour will show you how to manage your daily responsibilities efficiently.',
      placement: 'bottom',
      highlightElement: false,
    },
    {
      id: 'coordinator-dashboard',
      target: '[data-tour="dashboard"]',
      title: 'Your Coordinator Dashboard',
      content:
        'Your dashboard shows your caseload at a glance: clients requiring attention, pending care plan reviews, open shifts to fill, and EVV exceptions to resolve.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'client-list',
      target: '[data-tour="clients-link"]',
      title: 'Client Management',
      content:
        'Access your full client roster here. You can view demographics, service authorizations, care plans, visit history, and assigned caregivers for each client.',
      placement: 'right',
      highlightElement: true,
      action: () => {
        const link = document.querySelector('[data-tour="clients-link"]') as HTMLElement;
        if (link) link.click();
      },
    },
    {
      id: 'client-details',
      target: '[data-tour="client-card"]',
      title: 'Client Overview Cards',
      content:
        'Each client card displays key information: name, Medicaid ID, service authorization status, next visit scheduled, and any alerts (like upcoming care plan review due dates).',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'care-plan-nav',
      target: '[data-tour="care-plans-link"]',
      title: 'Care Plan Management',
      content:
        'Care plans define the goals, tasks, and services for each client. You\'ll create initial care plans after assessments and update them during 60-day and 90-day reviews.',
      placement: 'right',
      highlightElement: true,
      action: () => {
        const link = document.querySelector('[data-tour="care-plans-link"]') as HTMLElement;
        if (link) link.click();
      },
    },
    {
      id: 'care-plan-tasks',
      target: '[data-tour="care-plan-tasks"]',
      title: 'Service Tasks',
      content:
        'Tasks in care plans define what caregivers must complete during visits: personal care assistance, meal preparation, medication reminders, etc. Tasks can require photo verification for quality assurance.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'shift-matching-nav',
      target: '[data-tour="shift-matching-link"]',
      title: 'Caregiver Assignment',
      content:
        'The shift matching system helps you assign qualified caregivers to open shifts. It shows certification matches, distance from client, availability, and past performance ratings.',
      placement: 'right',
      highlightElement: true,
      action: () => {
        const link = document.querySelector('[data-tour="shift-matching-link"]') as HTMLElement;
        if (link) link.click();
      },
    },
    {
      id: 'caregiver-matching',
      target: '[data-tour="match-score"]',
      title: 'Smart Matching Algorithm',
      content:
        'Our algorithm calculates match scores based on: required certifications, language compatibility, client preferences, geographic proximity, and caregiver ratings. Higher scores indicate better matches.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'evv-exceptions-coord',
      target: '[data-tour="evv-exceptions"]',
      title: 'Handling EVV Exceptions',
      content:
        'When visits don\'t meet EVV requirements (GPS too far, time discrepancies, missing tasks), they appear here. You can review the situation, contact the caregiver for clarification, and either approve or request corrections.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'exception-resolution',
      target: '[data-tour="exception-actions"]',
      title: 'Exception Resolution Options',
      content:
        'For each exception, you can: approve as-is (with justification), request caregiver correction, escalate to supervisor, or submit a VMUR for post-submission changes.',
      placement: 'left',
      highlightElement: true,
    },
    {
      id: 'communication',
      target: '[data-tour="messages"]',
      title: 'Communication Hub',
      content:
        'Stay in touch with caregivers, clients, and families through the messaging system. You can send schedule updates, clarify care plan changes, and respond to concerns.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'tour-complete',
      target: 'body',
      title: 'Great Work!',
      content:
        'You\'re now familiar with the coordinator workflow: managing clients, creating care plans, assigning caregivers, and resolving EVV exceptions. These tools help you coordinate quality care efficiently while maintaining compliance.',
      placement: 'bottom',
      highlightElement: false,
    },
  ],
};
