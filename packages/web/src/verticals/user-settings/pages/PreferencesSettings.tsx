/**
 * Preferences Settings Page
 *
 * User interface preferences and notification settings.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/core/components';
import { FormField } from '@/core/components/forms';
import { LoadingSpinner, ErrorMessage } from '@/core/components/feedback';
import { SettingsCard } from '../components';
import { usePreferences, useUpdatePreferences } from '../hooks';
import type { UpdatePreferencesInput } from '../types';

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h']),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export const PreferencesSettings = () => {
  const { data: preferences, isLoading, error } = usePreferences();
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    values: preferences
      ? {
          theme: preferences.theme,
          language: preferences.language,
          timezone: preferences.timezone,
          dateFormat: preferences.dateFormat,
          timeFormat: preferences.timeFormat,
          emailNotifications: preferences.notifications.email,
          pushNotifications: preferences.notifications.push,
          smsNotifications: preferences.notifications.sms,
        }
      : undefined,
  });

  const onSubmit = (data: PreferencesFormData) => {
    const input: UpdatePreferencesInput = {
      theme: data.theme,
      language: data.language,
      timezone: data.timezone,
      dateFormat: data.dateFormat,
      timeFormat: data.timeFormat,
      notifications: {
        email: data.emailNotifications,
        push: data.pushNotifications,
        sms: data.smsNotifications,
      },
    };

    updatePreferences(input, {
      onSuccess: () => {
        toast.success('Preferences updated successfully');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update preferences');
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
        title="Failed to load preferences"
        message={error.message}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Display Settings"
        description="Customize how the application looks and feels"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField label="Theme" error={errors.theme?.message}>
            <select
              {...register('theme')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </FormField>

          <FormField label="Language" error={errors.language?.message}>
            <select
              {...register('language')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </FormField>

          <FormField label="Timezone" error={errors.timezone?.message}>
            <select
              {...register('timezone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="UTC">UTC</option>
            </select>
          </FormField>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField label="Date Format" error={errors.dateFormat?.message}>
              <select
                {...register('dateFormat')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </FormField>

            <FormField label="Time Format" error={errors.timeFormat?.message}>
              <select
                {...register('timeFormat')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="12h">12-hour</option>
                <option value="24h">24-hour</option>
              </select>
            </FormField>
          </div>

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

      <SettingsCard
        title="Notification Preferences"
        description="Choose how you want to be notified"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="emailNotifications"
                className="font-medium text-gray-700"
              >
                Email Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive notifications via email
              </p>
            </div>
            <input
              id="emailNotifications"
              type="checkbox"
              {...register('emailNotifications')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="pushNotifications"
                className="font-medium text-gray-700"
              >
                Push Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive push notifications in your browser
              </p>
            </div>
            <input
              id="pushNotifications"
              type="checkbox"
              {...register('pushNotifications')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label
                htmlFor="smsNotifications"
                className="font-medium text-gray-700"
              >
                SMS Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive notifications via text message
              </p>
            </div>
            <input
              id="smsNotifications"
              type="checkbox"
              {...register('smsNotifications')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};
