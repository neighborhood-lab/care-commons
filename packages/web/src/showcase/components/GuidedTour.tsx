import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { tours } from '../services/tour.service';

interface GuidedTourProps {
  tourId: keyof typeof tours;
  onComplete?: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ tourId, onComplete }) => {
  const [run, setRun] = useState(true);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      onComplete?.();

      // Save tour completion
      localStorage.setItem(`tour_${tourId}_completed`, 'true');
    }
  };

  // Don't show tour if already completed
  if (localStorage.getItem(`tour_${tourId}_completed`)) {
    return null;
  }

  return (
    <Joyride
      steps={tours[tourId]}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#4F46E5',
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};
