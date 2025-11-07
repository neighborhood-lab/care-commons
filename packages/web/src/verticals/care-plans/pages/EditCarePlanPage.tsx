import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components';
import { useCarePlan, useUpdateCarePlan } from '../hooks';
import { CarePlanForm } from '../components';
import type { UpdateCarePlanInput } from '../types';

export const EditCarePlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: carePlan, isLoading, error, refetch } = useCarePlan(id);
  const updateCarePlan = useUpdateCarePlan();

  const handleSubmit = async (data: UpdateCarePlanInput) => {
    if (!id) return;

    try {
      await updateCarePlan.mutateAsync({ id, input: data });
      navigate(`/care-plans/${id}`);
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

  if (error || !carePlan) {
    return (
      <ErrorMessage
        message={(error as Error)?.message || 'Failed to load care plan'}
        retry={refetch}
      />
    );
  }

  if (updateCarePlan.isError) {
    return (
      <ErrorMessage
        message={(updateCarePlan.error as Error)?.message || 'Failed to update care plan'}
        retry={() => updateCarePlan.reset()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/care-plans/${id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Care Plan
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Care Plan</h1>
        <p className="text-gray-600 mt-1">
          Update goals, interventions, and task templates for {carePlan.name}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <CarePlanForm
          initialData={carePlan}
          onSubmit={handleSubmit}
          isLoading={updateCarePlan.isPending}
          isEdit
        />
      </div>

      {/* Loading Overlay */}
      {updateCarePlan.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-lg font-medium">Updating Care Plan...</span>
          </div>
        </div>
      )}
    </div>
  );
};
