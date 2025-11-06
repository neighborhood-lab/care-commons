import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  SearchableSelect,
  FormField,
  LoadingSpinner
} from '@/core/components';
import { formatDate } from '@/core/utils';
import { useClients } from '@/verticals/client-demographics/hooks';
import type { CreateCarePlanInput } from '../types';

const carePlanSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  branchId: z.string().optional(),
  name: z.string().min(1, 'Care plan name is required'),
  planType: z.enum(['PERSONAL_CARE', 'COMPANION', 'SKILLED_NURSING', 'THERAPY', 'HOSPICE', 'RESPITE', 'LIVE_IN', 'CUSTOM']),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  expirationDate: z.string().optional(),
  coordinatorId: z.string().optional(),
  notes: z.string().optional(),
});

type CarePlanFormData = z.infer<typeof carePlanSchema>;

export interface CarePlanFormProps {
  initialData?: Partial<CreateCarePlanInput>;
  onSubmit: (data: CreateCarePlanInput) => void;
  isLoading?: boolean;
}

const planTypeOptions = [
  { value: 'PERSONAL_CARE', label: 'Personal Care' },
  { value: 'COMPANION', label: 'Companion' },
  { value: 'SKILLED_NURSING', label: 'Skilled Nursing' },
  { value: 'THERAPY', label: 'Therapy' },
  { value: 'HOSPICE', label: 'Hospice' },
  { value: 'RESPITE', label: 'Respite' },
  { value: 'LIVE_IN', label: 'Live In' },
  { value: 'CUSTOM', label: 'Custom' },
];

export const CarePlanForm: React.FC<CarePlanFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch clients for searchable select
  const { data: clientsData, isLoading: isLoadingClients } = useClients();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<CarePlanFormData>({
    resolver: zodResolver(carePlanSchema),
    defaultValues: {
      clientId: initialData?.clientId || '',
      organizationId: initialData?.organizationId || '',
      branchId: initialData?.branchId || '',
      name: initialData?.name || '',
      planType: initialData?.planType || 'PERSONAL_CARE',
      effectiveDate: initialData?.effectiveDate || formatDate(new Date()),
      expirationDate: initialData?.expirationDate || '',
      coordinatorId: initialData?.coordinatorId || '',
      notes: initialData?.notes || '',
    },
  });

  // Transform clients data for SearchableSelect
  const clientOptions = useMemo(() => {
    if (!clientsData?.data) return [];
    return clientsData.data.map((client) => ({
      value: client.id,
      label: `${client.firstName} ${client.lastName}`,
      description: `${client.clientNumber} - ${client.status}`,
    }));
  }, [clientsData]);

  // Placeholder options for organization and coordinator (to be replaced with real API calls)
  const organizationOptions = [
    { value: 'org-1', label: 'Main Organization', description: 'Primary care organization' },
    { value: 'org-2', label: 'Branch Office', description: 'Regional branch' },
  ];

  const coordinatorOptions = [
    { value: 'coord-1', label: 'John Smith', description: 'Senior Care Coordinator' },
    { value: 'coord-2', label: 'Jane Doe', description: 'Care Coordinator' },
    { value: 'coord-3', label: 'Bob Wilson', description: 'Lead Coordinator' },
  ];

  const branchOptions = [
    { value: 'branch-1', label: 'North Branch', description: 'Northern region' },
    { value: 'branch-2', label: 'South Branch', description: 'Southern region' },
    { value: 'branch-3', label: 'East Branch', description: 'Eastern region' },
  ];

  const steps = [
    { title: 'Basic Information', description: 'Care plan details' },
    { title: 'Goals', description: 'Define care goals' },
    { title: 'Interventions', description: 'Plan interventions' },
    { title: 'Review', description: 'Review and submit' },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onFormSubmit = (data: CarePlanFormData) => {
    onSubmit({
      ...data,
      goals: [],
      interventions: [],
    });
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SearchableSelect
          label="Client"
          value={watch('clientId')}
          onChange={(value) => setValue('clientId', value, { shouldValidate: true })}
          options={clientOptions}
          placeholder="Search and select a client..."
          error={errors.clientId?.message}
          required
          isLoading={isLoadingClients}
          emptyMessage="No clients found. Create a client first."
        />

        <SearchableSelect
          label="Organization"
          value={watch('organizationId')}
          onChange={(value) => setValue('organizationId', value, { shouldValidate: true })}
          options={organizationOptions}
          placeholder="Search and select an organization..."
          error={errors.organizationId?.message}
          required
        />

        <SearchableSelect
          label="Branch (Optional)"
          value={watch('branchId') || ''}
          onChange={(value) => setValue('branchId', value)}
          options={branchOptions}
          placeholder="Search and select a branch..."
          error={errors.branchId?.message}
          clearable
        />

        <SearchableSelect
          label="Coordinator (Optional)"
          value={watch('coordinatorId') || ''}
          onChange={(value) => setValue('coordinatorId', value)}
          options={coordinatorOptions}
          placeholder="Search and select a coordinator..."
          error={errors.coordinatorId?.message}
          clearable
        />
      </div>

      <FormField
        label="Care Plan Name"
        error={errors.name?.message}
        required
      >
        <Input
          {...register('name')}
          placeholder="Enter care plan name"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Plan Type"
          error={errors.planType?.message}
          required
        >
          <Select
            options={planTypeOptions}
            value={getValues('planType')}
            onChange={(e) => setValue('planType', e.target.value as CarePlanFormData['planType'])}
          />
        </FormField>

        <FormField
          label="Effective Date"
          error={errors.effectiveDate?.message}
          required
        >
          <Input
            {...register('effectiveDate')}
            type="date"
          />
        </FormField>
      </div>

      <FormField
        label="Expiration Date (Optional)"
        error={errors.expirationDate?.message}
      >
        <Input
          {...register('expirationDate')}
          type="date"
        />
      </FormField>

      <FormField
        label="Notes (Optional)"
        error={errors.notes?.message}
      >
        <textarea
          {...register('notes')}
          placeholder="Enter any additional notes"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </FormField>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">Goals will be implemented in a future update</p>
        <p className="text-sm text-gray-400 mt-2">This will include goal creation, categories, priorities, and progress tracking</p>
      </div>
    </div>
  );

  const renderInterventions = () => (
    <div className="space-y-6">
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-md">
        <p className="text-gray-500">Interventions will be implemented in a future update</p>
        <p className="text-sm text-gray-400 mt-2">This will include intervention planning, scheduling, and instructions</p>
      </div>
    </div>
  );

  const renderReview = () => {
    const watchedValues = getValues();
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Review Care Plan</h3>
        
        <Card>
          <CardHeader title="Basic Information" />
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.planType?.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Client ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.clientId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.organizationId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Effective Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{watchedValues.effectiveDate}</dd>
              </div>
              {watchedValues.expirationDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expiration Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{watchedValues.expirationDate}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Next Steps" />
          <CardContent>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium">Goals and Interventions</h4>
                <p className="text-sm text-gray-600">After creating the care plan, you can add specific goals and interventions</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-medium">Task Templates</h4>
                <p className="text-sm text-gray-600">Create task templates for recurring care activities</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-medium">Assign Caregivers</h4>
                <p className="text-sm text-gray-600">Assign primary caregivers and backup staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {index + 1}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-px mx-4 ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onFormSubmit)}>
        {currentStep === 0 && renderBasicInfo()}
        {currentStep === 1 && renderGoals()}
        {currentStep === 2 && renderInterventions()}
        {currentStep === 3 && renderReview()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Create Care Plan
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};