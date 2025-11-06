import React from 'react';
import { useTour } from './TourProvider';
import { Play } from 'lucide-react';

interface TourLauncherProps {
  tourId: string;
  title: string;
  description: string;
  duration: string;
  icon?: React.ReactNode;
}

export function TourLauncher({ tourId, title, description, duration, icon }: TourLauncherProps) {
  const { startTour } = useTour();

  return (
    <button
      onClick={() => startTour(tourId)}
      className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
    >
      <div className="flex items-start gap-3">
        {icon && <div className="text-blue-600">{icon}</div>}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <Play className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
