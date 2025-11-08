import { useEffect } from 'react';
import { useTour } from '../components/tours/TourProvider';

export function useFirstTimeUser(tourId: string) {
  const { startTour } = useTour();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`tour-seen-${tourId}`);

    if (!hasSeenTour) {
      // Wait 1 second for page to load
      setTimeout(() => {
        startTour(tourId);
        localStorage.setItem(`tour-seen-${tourId}`, 'true');
      }, 1000);
    }
  }, [tourId, startTour]);
}
