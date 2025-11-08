import { useState, useEffect } from 'react';

interface TourProgress {
  tourId: string;
  completed: boolean;
  completedAt?: string;
}

export function useTourProgress() {
  const [progress, setProgress] = useState<TourProgress[]>([]);

  useEffect(() => {
    // Load progress from localStorage
    const loadProgress = () => {
      const tourIds = [
        'coordinator-overview',
        'create-visit',
        'caregiver-workflow',
        'family-portal',
        'admin-dashboard'
      ];

      const loadedProgress = tourIds.map(tourId => {
        const stored = localStorage.getItem(`tour-progress-${tourId}`);
        if (stored) {
          return JSON.parse(stored) as TourProgress;
        }
        return {
          tourId,
          completed: false
        };
      });

      setProgress(loadedProgress);
    };

    loadProgress();
  }, []);

  const markTourComplete = (tourId: string) => {
    const newProgress: TourProgress = {
      tourId,
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(`tour-progress-${tourId}`, JSON.stringify(newProgress));

    setProgress(prev => {
      const index = prev.findIndex(p => p.tourId === tourId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = newProgress;
        return updated;
      }
      return [...prev, newProgress];
    });
  };

  const getTourProgress = (tourId: string): TourProgress | undefined => {
    return progress.find(p => p.tourId === tourId);
  };

  const completedCount = progress.filter(p => p.completed).length;
  const totalCount = progress.length;

  return {
    progress,
    markTourComplete,
    getTourProgress,
    completedCount,
    totalCount
  };
}
