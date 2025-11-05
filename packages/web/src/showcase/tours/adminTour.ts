/**
 * Administrator Tour
 *
 * Comprehensive tour of admin features and compliance tools
 */

import { Tour } from '../types';

export const adminTour: Tour = {
  id: 'admin-comprehensive',
  name: 'Administrator Complete Tour',
  description: 'Explore all admin features including compliance tools, state configuration, and operations monitoring',
  role: 'admin',
  estimatedTime: 15,
  steps: [
    {
      id: 'welcome',
      target: 'body',
      title: 'Welcome to the Admin Dashboard',
      content:
        'Welcome to the Care Commons administrative interface! This tour will guide you through the powerful tools available for managing your home healthcare agency. You\'ll learn about compliance monitoring, state configuration, operations oversight, and more.',
      placement: 'bottom',
      highlightElement: false,
      showProgress: true,
    },
    {
      id: 'sidebar-navigation',
      target: '[data-tour="sidebar"]',
      title: 'Navigation Menu',
      content:
        'The sidebar provides quick access to all major sections of the platform. As an administrator, you have full access to every module including client management, caregiver scheduling, compliance tools, and system configuration.',
      placement: 'right',
      highlightElement: true,
    },
    {
      id: 'dashboard-overview',
      target: '[data-tour="dashboard-kpis"]',
      title: 'Key Performance Indicators',
      content:
        'Your dashboard displays real-time KPIs: active visits, compliance rate, revenue metrics, and staff utilization. These metrics update automatically as caregivers clock in/out and complete visits.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'compliance-rate',
      target: '[data-tour="compliance-metric"]',
      title: 'EVV Compliance Tracking',
      content:
        'The compliance rate shows the percentage of visits meeting all EVV requirements. This must be 100% for most states. Click on the metric to see a detailed breakdown of any exceptions.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'operations-center',
      target: '[data-tour="operations-panel"]',
      title: 'Real-Time Operations Center',
      content:
        'The operations panel shows what\'s happening right now: active visits with GPS locations, pending VMURs (Visit Modification/Update Requests), and EVV exceptions requiring attention.',
      placement: 'left',
      highlightElement: true,
    },
    {
      id: 'active-visits-map',
      target: '[data-tour="visits-map"]',
      title: 'Live Visit Tracking',
      content:
        'This map displays all active visits with real-time GPS locations of caregivers. Geofence boundaries are shown in blue - caregivers must be within these boundaries to clock in/out.',
      placement: 'top',
      highlightElement: true,
    },
    {
      id: 'evv-exceptions',
      target: '[data-tour="evv-exceptions"]',
      title: 'EVV Exception Management',
      content:
        'EVV exceptions occur when visits don\'t meet all six required elements (Type of Service, Individual, Date, Location, Time In/Out, Service Provider). You can review and resolve these here or delegate to coordinators.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'vmur-queue',
      target: '[data-tour="vmur-queue"]',
      title: 'VMUR Approval Workflow',
      content:
        'Visit Modification/Update Requests (VMURs) are required in states like Texas when correcting EVV data post-submission. These require supervisor approval and detailed justification for compliance audits.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'state-config-nav',
      target: '[data-tour="state-config-link"]',
      title: 'Multi-State Configuration',
      content:
        'Care Commons supports operations across all 50 states with pre-configured compliance rules. Click here to manage state-specific settings like grace periods, geofence requirements, and aggregator connections.',
      placement: 'right',
      highlightElement: true,
      action: () => {
        const link = document.querySelector('[data-tour="state-config-link"]') as HTMLElement;
        if (link) link.click();
      },
    },
    {
      id: 'state-comparison',
      target: '[data-tour="state-selector"]',
      title: 'State-Specific Rules',
      content:
        'Each state has different EVV requirements. For example, Texas requires 100m geofence accuracy and uses HHAeXchange exclusively, while Florida allows 150m accuracy and supports multiple aggregators. Compare states side-by-side here.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'compliance-center-nav',
      target: '[data-tour="compliance-link"]',
      title: 'Compliance & Audit Center',
      content:
        'The compliance center provides audit trails, HIPAA access logs, regulatory reports, and documentation required for state audits. All actions in the system are logged with timestamps and user attribution.',
      placement: 'right',
      highlightElement: true,
    },
    {
      id: 'audit-trail',
      target: '[data-tour="audit-trail"]',
      title: 'Comprehensive Audit Trails',
      content:
        'Every action in Care Commons is logged: who accessed what data, when, and from where. This audit trail is immutable and designed to meet HIPAA and state regulatory requirements.',
      placement: 'bottom',
      highlightElement: true,
    },
    {
      id: 'data-grid-access',
      target: '[data-tour="data-grid-link"]',
      title: 'Direct Database Access Panel',
      content:
        'Advanced users can access the underlying database tables directly for complex queries, bulk operations, and custom reporting. All changes are still logged in the audit trail.',
      placement: 'right',
      highlightElement: true,
    },
    {
      id: 'user-management',
      target: '[data-tour="users-link"]',
      title: 'User & Permission Management',
      content:
        'Manage user accounts, roles, and permissions. Set up role-based access control (RBAC) to ensure staff only see data relevant to their job functions - critical for HIPAA compliance.',
      placement: 'right',
      highlightElement: true,
    },
    {
      id: 'reports',
      target: '[data-tour="reports-link"]',
      title: 'Regulatory Reporting',
      content:
        'Generate reports for state agencies, insurance payors, and internal compliance. Export visit data in formats required by Medicaid, Medicare, and private insurance companies.',
      placement: 'right',
      highlightElement: true,
    },
    {
      id: 'tour-complete',
      target: 'body',
      title: 'Tour Complete!',
      content:
        'You\'ve completed the administrator tour! You\'ve learned about: dashboard KPIs, real-time operations monitoring, EVV compliance tracking, multi-state configuration, audit trails, and regulatory reporting. Explore these features on your own or try tours for other roles to see their perspectives.',
      placement: 'bottom',
      highlightElement: false,
      showProgress: true,
    },
  ],
};
