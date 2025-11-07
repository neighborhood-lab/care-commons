import React from 'react';
import { Button } from '@/core/components';
import { Filter, X } from 'lucide-react';

interface ActivityFiltersProps {
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  dateRange?: { start: Date; end: Date };
  onDateRangeChange?: (range: { start: Date; end: Date } | undefined) => void;
}

const activityTypes = [
  { value: 'VISIT', label: 'Visits' },
  { value: 'CARE_PLAN', label: 'Care Plans' },
  { value: 'GOAL', label: 'Goals' },
  { value: 'TASK', label: 'Tasks' },
  { value: 'NOTE', label: 'Notes' },
  { value: 'INCIDENT', label: 'Incidents' },
  { value: 'MESSAGE', label: 'Messages' },
  { value: 'DOCUMENT', label: 'Documents' },
];

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  selectedTypes,
  onTypeChange,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const clearFilters = () => {
    onTypeChange([]);
  };

  const hasActiveFilters = selectedTypes.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          <Filter className="h-5 w-5" />
          <span>Filter Activity</span>
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {selectedTypes.length}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Activity Types</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {activityTypes.map((type) => {
              const isSelected = selectedTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  onClick={() => toggleType(type.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                    }
                  `}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
