import React from 'react';
import { Info } from 'lucide-react';

export interface VisitStatusLegendProps {
  compact?: boolean;
  showTitle?: boolean;
}

export const VisitStatusLegend: React.FC<VisitStatusLegendProps> = ({
  compact = false,
  showTitle = true,
}) => {
  const legendItems = [
    {
      color: 'bg-amber-500',
      border: 'border-2 border-dashed border-amber-600',
      label: 'Unassigned',
      description: 'Visit needs caregiver assignment',
    },
    {
      color: 'bg-blue-500',
      border: 'border border-blue-600',
      label: 'Assigned',
      description: 'Visit has assigned caregiver (color-coded by caregiver)',
    },
    {
      color: 'bg-cyan-500',
      border: 'border border-cyan-600',
      label: 'In Progress',
      description: 'Caregiver has clocked in',
    },
    {
      color: 'bg-green-500',
      border: 'border border-green-600',
      label: 'Completed',
      description: 'Visit successfully completed',
    },
    {
      color: 'bg-purple-500',
      border: 'border border-purple-600',
      label: 'Needs Review',
      description: 'Requires coordinator review',
    },
    {
      color: 'bg-gray-400',
      border: 'border border-gray-500',
      label: 'Cancelled',
      description: 'Visit was cancelled',
      opacity: 'opacity-50',
    },
  ];

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${item.color} ${item.border} ${item.opacity || ''}`}></div>
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      {showTitle && (
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Visit Status Legend</h3>
        </div>
      )}
      <div className="space-y-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded mt-0.5 flex-shrink-0 ${item.color} ${item.border} ${item.opacity || ''}`}></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{item.label}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Each assigned caregiver is shown in a different color to help distinguish their schedule.
        </p>
      </div>
    </div>
  );
};
