/**
 * Persona definitions for Care Commons Showcase
 */

import { Persona } from '../types';

export const personas: Persona[] = [
  {
    id: 'admin',
    name: 'Administrator',
    title: 'System Administrator',
    description: 'Full system access and configuration',
    missionTitle: "Review Q4 compliance report and approve 3 pending VMURs",
    missionDescription: "Explore the admin dashboard, compliance center, and state configuration features",
    estimatedTime: 15,
    features: [
      'Admin dashboard with KPIs',
      'Compliance center & audit trails',
      'State configuration management',
      'Operations center monitoring',
      'Data grid panel for direct database access'
    ],
    difficulty: 'advanced',
    color: 'purple',
  },
  {
    id: 'coordinator',
    name: 'Sarah Kim',
    title: 'Care Coordinator',
    description: 'Manage clients, care plans, and caregiver assignments',
    missionTitle: "Assign 5 caregivers to new client visits and resolve 2 EVV exceptions",
    missionDescription: "Experience the daily workflow of coordinating care for multiple clients",
    estimatedTime: 10,
    features: [
      'Client management',
      'Care plan creation & reviews',
      'Caregiver scheduling & assignments',
      'EVV exception handling',
      'Visit monitoring'
    ],
    difficulty: 'intermediate',
    color: 'blue',
  },
  {
    id: 'caregiver',
    name: 'Emily Rodriguez',
    title: 'Caregiver',
    description: 'Complete visits with tasks and EVV clock in/out',
    missionTitle: "Complete 4 visits with tasks and clock in/out with GPS verification",
    missionDescription: "Experience the mobile app workflow for caregivers in the field",
    estimatedTime: 12,
    features: [
      'Mobile visit workflow',
      'GPS clock in/out',
      'Task completion with photos',
      'Visit notes & documentation',
      'Offline mode support'
    ],
    difficulty: 'beginner',
    color: 'green',
  },
  {
    id: 'patient',
    name: 'Margaret Thompson',
    title: 'Patient & Family',
    description: 'View care plan progress and upcoming visits',
    missionTitle: "View your care plan progress and upcoming visits",
    missionDescription: "See how patients and families stay informed about their care",
    estimatedTime: 5,
    features: [
      'Personal dashboard',
      'Upcoming visit schedule',
      'Care plan progress tracking',
      'Care team information',
      'Communication with coordinators'
    ],
    difficulty: 'beginner',
    color: 'pink',
  },
];

export const getPersona = (role: string): Persona | undefined => {
  return personas.find(p => p.id === role);
};
