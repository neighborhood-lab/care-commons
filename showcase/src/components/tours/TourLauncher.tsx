import React, { useState, useEffect } from 'react';
import { useTour } from './TourProvider';
import { Play, CheckCircle2 } from 'lucide-react';

interface TourLauncherProps {
  tourId: string;
  title: string;
  description: string;
  duration: string;
  icon?: React.ReactNode;
}

export function TourLauncher({ tourId, title, description, duration, icon }: TourLauncherProps) {
  const { startTour } = useTour();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(`tour-completed-${tourId}`);
    setCompleted(hasCompletedTour === 'true');
  }, [tourId]);

  const handleStartTour = () => {
    startTour(tourId);
    // Mark as completed when started (simplified - in production, would track actual completion)
    localStorage.setItem(`tour-completed-${tourId}`, 'true');
    setCompleted(true);
  };

  return (
    <button
      onClick={handleStartTour}
      className={`p-4 border rounded-lg transition-all text-left ${
        completed
          ? 'border-green-200 bg-green-50 hover:border-green-300'
          : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className={completed ? 'text-green-600' : 'text-blue-600'}>{icon}</div>}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {completed && (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Play className="w-4 h-4" />
            <span>{duration}</span>
            {completed && (
              <span className="ml-auto text-green-600 font-medium">Completed</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
