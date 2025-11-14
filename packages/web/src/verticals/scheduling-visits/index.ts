/**
 * Scheduling & Visits Vertical - Web UI
 */

// Pages
export { VisitList, CalendarView } from './pages';

// Components
export { VisitCard } from './components';

// Hooks
export { useVisits, useMyVisits, useVisitApi, useCalendarVisits, useCaregiverAvailability } from './hooks/useVisits';

// Types
export type {
  Visit,
  VisitSearchFilters,
  VisitStatus,
  VisitType,
  VisitAddress,
} from './types';
