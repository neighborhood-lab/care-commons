import React from 'react';
import { GuidedTour } from '../components/GuidedTour';
import { useShowcasePersona } from '../hooks';
import { Dashboard } from '../../app/pages';

export const ShowcaseDashboard: React.FC = () => {
  const persona = useShowcasePersona();

  // Map persona roles to tour IDs
  const getTourId = (): 'coordinator' | 'caregiver' | 'family' | undefined => {
    if (persona === 'coordinator') return 'coordinator';
    if (persona === 'caregiver') return 'caregiver';
    if (persona === 'patient') return 'family';
    return undefined;
  };

  const tourId = getTourId();

  return (
    <>
      {tourId && (
        <GuidedTour tourId={tourId} onComplete={() => console.log('Tour completed')} />
      )}

      <Dashboard />
    </>
  );
};
