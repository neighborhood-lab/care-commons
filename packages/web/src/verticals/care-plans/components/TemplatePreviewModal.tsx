import React from 'react';
import { X, Clock, CheckSquare, Target } from 'lucide-react';
import { Button, Card, CardHeader, CardContent } from '@/core/components';
import type { CarePlanTemplate } from '@care-commons/care-plans-tasks';
import { useNavigate } from 'react-router-dom';

export interface TemplatePreviewModalProps {
  template: CarePlanTemplate;
  isOpen: boolean;
  onClose: () => void;
}

const priorityColors: Record<string, string> = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  critical: 'text-red-600',
};

const categoryColors: Record<string, string> = {
  personal_care: 'bg-blue-100 text-blue-800',
  skilled_nursing: 'bg-purple-100 text-purple-800',
  companionship: 'bg-green-100 text-green-800',
  memory_care: 'bg-orange-100 text-orange-800',
  post_hospital: 'bg-red-100 text-red-800',
};

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const categoryColor =
    categoryColors[template.category] || 'bg-gray-100 text-gray-800';

  const handleUseTemplate = () => {
    navigate(`/care-plans/from-template/${template.id}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {template.name}
            </h2>
            <span
              className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}
            >
              {template.category.replace('_', ' ')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            leftIcon={<X className="h-4 w-4" />}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Template Information */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{template.description}</p>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  <span className="font-medium">Duration:</span>{' '}
                  {template.typical_duration_days} days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                <span>
                  <span className="font-medium">Tasks:</span>{' '}
                  {template.tasks.length} tasks
                </span>
              </div>
            </div>
          </div>

          {/* Goals */}
          <Card>
            <div className="border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Care Goals</h3>
              </div>
            </div>
            <CardContent>
              <p className="text-gray-700">{template.goals}</p>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Templates</h3>
              <p className="text-sm text-gray-600 mt-1">{template.tasks.length} tasks included</p>
            </div>
            <CardContent>
              <div className="space-y-3">
                {template.tasks.map((task, index) => {
                  const priorityColor = priorityColors[task.priority];
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-md p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {task.description}
                          </h4>
                          {task.instructions && (
                            <p className="text-sm text-gray-600 mt-1">
                              {task.instructions}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="capitalize">{task.frequency}</span>
                            {task.scheduled_time && (
                              <span>⏰ {task.scheduled_time}</span>
                            )}
                            <span>⏱️ {task.estimated_duration_minutes} min</span>
                            <span
                              className={`font-medium capitalize ${priorityColor}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleUseTemplate}>Use This Template</Button>
        </div>
      </div>
    </div>
  );
};
