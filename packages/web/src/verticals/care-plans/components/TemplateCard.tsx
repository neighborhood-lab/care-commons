import React from 'react';
import { Clock, CheckSquare } from 'lucide-react';
import { Button } from '@/core/components';
import type { CarePlanTemplate } from '@care-commons/care-plans-tasks';

interface TemplateCardProps {
  template: CarePlanTemplate;
  onSelect: () => void;
}

const categoryColors: Record<string, string> = {
  personal_care: 'bg-blue-100 text-blue-800',
  skilled_nursing: 'bg-purple-100 text-purple-800',
  companionship: 'bg-green-100 text-green-800',
  memory_care: 'bg-orange-100 text-orange-800',
  post_hospital: 'bg-red-100 text-red-800',
};

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
}) => {
  const categoryColor =
    categoryColors[template.category] || 'bg-gray-100 text-gray-800';

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer bg-white">
      <div className="space-y-4">
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {template.name}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}
            >
              {template.category.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{template.description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-2" />
            <span className="font-medium mr-2">Duration:</span>
            {template.typical_duration_days} days
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <CheckSquare className="h-4 w-4 mr-2" />
            <span className="font-medium mr-2">Tasks:</span>
            {template.tasks.length} tasks
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={onSelect} className="w-full">
            Use Template
          </Button>
        </div>
      </div>
    </div>
  );
};
