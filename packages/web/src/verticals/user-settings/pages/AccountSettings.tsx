/**
 * Account Settings Page
 *
 * User account information and profile settings.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/core/components';
import { FormField } from '@/core/components/forms';
import { LoadingSpinner, ErrorMessage } from '@/core/components/feedback';
import { SettingsCard } from '../components';
import { useAccountSettings, useUpdateAccountSettings } from '../hooks';
import type { UpdateAccountSettingsInput } from '../types';

const accountSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export const AccountSettings = () => {
  const { data: settings, isLoading, error } = useAccountSettings();
  const { mutate: updateSettings, isPending } = useUpdateAccountSettings();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    values: settings
      ? {
          firstName: settings.firstName,
          lastName: settings.lastName,
          phone: settings.phone || '',
        }
      : undefined,
  });

  const onSubmit = (data: AccountFormData) => {
    const input: UpdateAccountSettingsInput = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
    };

    updateSettings(input, {
      onSuccess: () => {
        toast.success('Account settings updated successfully');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update account settings');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="Failed to load account settings"
        message={error.message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Profile Information"
        description="Update your personal information and contact details"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              label="First Name"
              error={errors.firstName?.message}
              required
            >
              <input
                type="text"
                {...register('firstName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </FormField>

            <FormField
              label="Last Name"
              error={errors.lastName?.message}
              required
            >
              <input
                type="text"
                {...register('lastName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </FormField>
          </div>

          <FormField label="Email Address" helpText="Email cannot be changed">
            <input
              type="email"
              value={settings?.email || ''}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
            />
          </FormField>

          <FormField label="Phone Number" error={errors.phone?.message}>
            <input
              type="tel"
              {...register('phone')}
              placeholder="(555) 123-4567"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </FormField>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={!isDirty || isPending}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SettingsCard>
    </div>
  );
};
