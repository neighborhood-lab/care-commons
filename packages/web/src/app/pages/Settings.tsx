import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@care-commons/shared-components';
import { Button } from '@care-commons/shared-components';
import { FormField } from '@/components/forms/FormField';
import { useApiClient } from '@/core/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { User, Lock, Bell } from 'lucide-react';

type SettingsTab = 'profile' | 'account' | 'preferences';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  roles: string[];
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type PreferencesFormData = z.infer<typeof preferencesSchema>;

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const apiClient = useApiClient();

  // Fetch current user profile
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      return await apiClient.get<UserProfile>('/api/users/profile');
    },
  });

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'account' as const, label: 'Account', icon: Lock },
    { id: 'preferences' as const, label: 'Preferences', icon: Bell },
  ];

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage(null);
    } else {
      setErrorMessage(message);
      setSuccessMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'profile' && (
          <ProfileSettings
            userProfile={userProfile}
            isLoading={isLoadingProfile}
            onSuccess={(message) => showMessage('success', message)}
            onError={(message) => showMessage('error', message)}
          />
        )}
        {activeTab === 'account' && (
          <AccountSettings
            onSuccess={(message) => showMessage('success', message)}
            onError={(message) => showMessage('error', message)}
          />
        )}
        {activeTab === 'preferences' && (
          <PreferencesSettings
            onSuccess={(message) => showMessage('success', message)}
            onError={(message) => showMessage('error', message)}
          />
        )}
      </div>
    </div>
  );
}

interface SettingsSectionProps {
  readonly userProfile?: UserProfile;
  readonly isLoading?: boolean;
  readonly onSuccess: (message: string) => void;
  readonly onError: (message: string) => void;
}

function ProfileSettings({ userProfile, isLoading, onSuccess, onError }: SettingsSectionProps) {
  const apiClient = useApiClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userProfile?.firstName ?? '',
      lastName: userProfile?.lastName ?? '',
      email: userProfile?.email ?? '',
    },
  });

  React.useEffect(() => {
    if (userProfile) {
      reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
      });
    }
  }, [userProfile, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiClient.put('/api/users/profile', data);
    },
    onSuccess: () => {
      onSuccess('Profile updated successfully');
    },
    onError: (error: Error) => {
      onError(error.message);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Content>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header
        title="Profile Information"
        subtitle="Update your personal information"
      />
      <Card.Content>
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              name="firstName"
              label="First Name"
              type="text"
              register={register}
              errors={errors}
              required
            />
            <FormField
              name="lastName"
              label="Last Name"
              type="text"
              register={register}
              errors={errors}
              required
            />
          </div>

          <FormField
            name="email"
            label="Email Address"
            type="email"
            register={register}
            errors={errors}
            helperText="Your email address is used for login and notifications"
            required
            disabled
          />

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={updateProfileMutation.isPending}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}

function AccountSettings({ onSuccess, onError }: Readonly<Omit<SettingsSectionProps, 'userProfile' | 'isLoading'>>) {
  const apiClient = useApiClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      return await apiClient.put('/api/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      onSuccess('Password changed successfully');
      reset();
    },
    onError: (error: Error) => {
      onError(error.message);
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <Card>
      <Card.Header
        title="Change Password"
        subtitle="Update your password to keep your account secure"
      />
      <Card.Content>
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6">
          <FormField
            name="currentPassword"
            label="Current Password"
            type="password"
            register={register}
            errors={errors}
            required
          />

          <FormField
            name="newPassword"
            label="New Password"
            type="password"
            register={register}
            errors={errors}
            helperText="Password must be at least 8 characters"
            required
          />

          <FormField
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            register={register}
            errors={errors}
            required
          />

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={changePasswordMutation.isPending}
            >
              Change Password
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}

function PreferencesSettings({ onSuccess, onError }: Readonly<Omit<SettingsSectionProps, 'userProfile' | 'isLoading'>>) {
  const apiClient = useApiClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: false,
      theme: 'system',
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormData) => {
      return await apiClient.put('/api/users/preferences', data);
    },
    onSuccess: () => {
      onSuccess('Preferences updated successfully');
    },
    onError: (error: Error) => {
      onError(error.message);
    },
  });

  const onSubmit = (data: PreferencesFormData) => {
    updatePreferencesMutation.mutate(data);
  };

  return (
    <Card>
      <Card.Header
        title="Preferences"
        subtitle="Customize your experience"
      />
      <Card.Content>
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailNotifications"
                {...register('emailNotifications')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="emailNotifications" className="text-sm text-gray-700">
                Email notifications
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="pushNotifications"
                {...register('pushNotifications')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="pushNotifications" className="text-sm text-gray-700">
                Push notifications
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Appearance</h3>
            <FormField
              name="theme"
              label="Theme"
              type="select"
              register={register}
              errors={errors}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={updatePreferencesMutation.isPending}
            >
              Save Preferences
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={updatePreferencesMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
