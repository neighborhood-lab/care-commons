import React, { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  Card,
  CardContent,
  FormField,
} from '@/core/components';
import { useCarePlanTemplate, useCreateFromTemplate } from '../hooks';
import type { CarePlanTaskTemplate } from '@care-commons/care-plans-tasks/browser';

interface CustomTask extends CarePlanTaskTemplate {
  enabled: boolean;
}

export const CustomizeTemplatePage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();

  const { data: template, isLoading, error } = useCarePlanTemplate(templateId);
  const createFromTemplate = useCreateFromTemplate();

  // Form state
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);

  // Initialize custom tasks when template loads
  React.useEffect(() => {
    if (template && customTasks.length === 0) {
      setName(template.name);
      setGoals(template.goals);
      setCustomTasks(
        template.tasks.map((task) => ({
          ...task,
          enabled: true,
        }))
      );
    }
  }, [template, customTasks.length]);

  const handleTaskToggle = (taskIndex: number) => {
    setCustomTasks((prev) =>
      prev.map((task, i) =>
        i === taskIndex ? { ...task, enabled: !task.enabled } : task
      )
    );
  };

  const handleCreateCarePlan = async () => {
    if (!templateId || !clientId) {
      return;
    }

    const enabledTasks = customTasks.filter((t) => t.enabled);

    try {
      await createFromTemplate.mutateAsync({
        templateId,
        clientId,
        name,
        goals,
        notes,
        tasks: enabledTasks,
      });

      // Navigate to care plans list on success
      navigate('/care-plans');
    } catch {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <ErrorMessage
        message={(error as Error)?.message || 'Template not found'}
      />
    );
  }

  const enabledTasksCount = customTasks.filter((t) => t.enabled).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/care-plans/from-template">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Templates
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Customize Care Plan
        </h1>
        <p className="text-gray-600">
          Customize the template before creating your care plan.
        </p>
      </div>

      <div className="space-y-6">
        {/* Template Info */}
        <Card>
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Template: {template.name}</h3>
          </div>
          <CardContent>
            <p className="text-gray-600">{template.description}</p>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>
          <CardContent>
            <div className="space-y-4">
              <FormField label="Client ID" required>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter client ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>

              <FormField label="Care Plan Name" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter care plan name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>

              <FormField label="Goals">
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Enter care goals"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>

              <FormField label="Additional Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or instructions"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Task Selection */}
        <Card>
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Tasks</h3>
            <p className="text-sm text-gray-600 mt-1">{enabledTasksCount} of {customTasks.length} tasks selected</p>
          </div>
          <CardContent>
            <div className="space-y-3">
              {customTasks.map((task, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 flex items-start transition ${
                    task.enabled
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.enabled}
                    onChange={() => handleTaskToggle(index)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {task.description}
                    </h4>
                    {task.instructions && (
                      <p className="text-sm text-gray-600 mt-1">
                        {task.instructions}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="capitalize">{task.frequency}</span>
                      {task.scheduled_time && (
                        <span>⏰ {task.scheduled_time}</span>
                      )}
                      <span>
                        ⏱️ {task.estimated_duration_minutes} min
                      </span>
                      <span className="capitalize font-medium">
                        {task.priority} priority
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-white py-4 border-t">
          <Link to="/care-plans/from-template">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleCreateCarePlan}
            disabled={
              createFromTemplate.isPending || !clientId || enabledTasksCount === 0
            }
            leftIcon={
              createFromTemplate.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )
            }
          >
            Create Care Plan ({enabledTasksCount} tasks)
          </Button>
        </div>
      </div>
    </div>
  );
};
