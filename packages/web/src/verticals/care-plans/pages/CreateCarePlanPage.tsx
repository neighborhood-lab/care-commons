import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components';
import { useCreateCarePlan } from '../hooks';
import { CarePlanForm } from '../components';
import type { CreateCarePlanInput } from '../types';

export const CreateCarePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const createCarePlan = useCreateCarePlan();

  const handleSubmit = async (data: CreateCarePlanInput) => {
    try {
      await createCarePlan.mutateAsync(data);
      navigate('/care-plans');
    } catch {
      // Error is handled by the mutation
    }
  };

  if (createCarePlan.isError) {
    return (
      <ErrorMessage
        message={(createCarePlan.error as Error)?.message || 'Failed to create care plan'}
        retry={() => createCarePlan.reset()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/care-plans">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Care Plans
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Care Plan</h1>
        <p className="text-gray-600 mt-1">
          Create a new care plan with goals, interventions, and task templates
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <CarePlanForm onSubmit={handleSubmit} isLoading={createCarePlan.isPending} />
      </div>

      {/* Loading Overlay */}
      {createCarePlan.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-lg font-medium">Creating Care Plan...</span>
          </div>
        </div>
      )}
    </div>
  );
};
