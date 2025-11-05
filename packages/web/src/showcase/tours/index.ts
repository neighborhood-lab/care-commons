/**
 * Tour Exports
 *
 * Central export for all tours and tour utilities
 */

export { TourProvider, useTour } from './TourContext';
export { TourOverlay } from './TourOverlay';
export { adminTour } from './adminTour';
export { coordinatorTour } from './coordinatorTour';
export { caregiverTour } from './caregiverTour';
export { patientTour } from './patientTour';

import { Tour, PersonaRole } from '../types';
import { adminTour } from './adminTour';
import { coordinatorTour } from './coordinatorTour';
import { caregiverTour } from './caregiverTour';
import { patientTour } from './patientTour';

/**
 * All available tours
 */
export const allTours: Tour[] = [
  adminTour,
  coordinatorTour,
  caregiverTour,
  patientTour,
];

/**
 * Get tour by ID
 */
export const getTourById = (id: string): Tour | undefined => {
  return allTours.find(tour => tour.id === id);
};

/**
 * Get tours for a specific role
 */
export const getToursByRole = (role: PersonaRole): Tour[] => {
  return allTours.filter(tour => tour.role === role);
};

/**
 * Get recommended tour for a role (first tour for that role)
 */
export const getRecommendedTour = (role: PersonaRole): Tour | undefined => {
  return getToursByRole(role)[0];
};
