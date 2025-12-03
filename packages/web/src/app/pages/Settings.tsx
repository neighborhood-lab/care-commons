import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@folkcare/shared-components';
import { Button } from '@folkcare/shared-components';
import { FormField } from '@/components/forms/FormField';
import { useApiClient } from '@/core/hooks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Bell, Users, UserPlus, Mail, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';

type SettingsTab = 'profile' | 'account' | 'preferences' | 'team';

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
    { id: 'team' as const, label: 'Team', icon: Users },
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
        {activeTab === 'team' && userProfile && (
          <TeamSettings
            organizationId={userProfile.organizationId}
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

// =============================================================================
// Team Settings Component
// =============================================================================

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  roles: string[];
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
}

interface TeamSettingsProps {
  readonly organizationId: string;
  readonly onSuccess: (message: string) => void;
  readonly onError: (message: string) => void;
}

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['ADMIN', 'COORDINATOR', 'CAREGIVER', 'BILLING_SPECIALIST', 'SCHEDULER']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

function TeamSettings({ organizationId, onSuccess, onError }: TeamSettingsProps) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch team members
  const { data: teamMembers, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['teamMembers', organizationId],
    queryFn: async () => {
      return await apiClient.get<TeamMember[]>(`/api/organizations/${organizationId}/users`);
    },
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['invitations', organizationId],
    queryFn: async () => {
      return await apiClient.get<Invitation[]>(`/api/organizations/${organizationId}/invitations`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'CAREGIVER',
    },
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      return await apiClient.post(`/api/organizations/${organizationId}/invitations`, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: [data.role],
      });
    },
    onSuccess: () => {
      onSuccess('Invitation sent successfully');
      setShowInviteModal(false);
      reset();
      void queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
    },
    onError: (error: Error) => {
      onError(error.message);
    },
  });

  // Revoke invitation mutation
  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiClient.delete(`/api/organizations/${organizationId}/invitations/${invitationId}`);
    },
    onSuccess: () => {
      onSuccess('Invitation revoked');
      void queryClient.invalidateQueries({ queryKey: ['invitations', organizationId] });
    },
    onError: (error: Error) => {
      onError(error.message);
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiClient.post(`/api/organizations/${organizationId}/invitations/${invitationId}/resend`, {});
    },
    onSuccess: () => {
      onSuccess('Invitation resent');
    },
    onError: (error: Error) => {
      onError(error.message);
    },
  });

  const onSubmitInvite = (data: InviteFormData) => {
    createInvitationMutation.mutate(data);
  };

  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      ADMIN: 'Administrator',
      COORDINATOR: 'Care Coordinator',
      CAREGIVER: 'Caregiver',
      BILLING_SPECIALIST: 'Billing Specialist',
      SCHEDULER: 'Scheduler',
    };
    return roleLabels[role] ?? role;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'EXPIRED':
      case 'REVOKED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const isLoading = isLoadingTeam || isLoadingInvitations;
  const pendingInvitations = invitations?.filter((inv) => inv.status === 'PENDING') ?? [];

  return (
    <div className="space-y-6">
      {/* Team Members Card */}
      <Card>
        <Card.Header
          title="Team Members"
          subtitle="Manage your organization's team"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowInviteModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          }
        />
        <Card.Content>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-700 font-medium">
                        {member.firstName[0]}{member.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-wrap gap-1">
                      {member.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {getRoleLabel(role)}
                        </span>
                      ))}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No team members yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Invite team members to start collaborating.
              </p>
              <div className="mt-6">
                <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite your first team member
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Pending Invitations Card */}
      {pendingInvitations.length > 0 && (
        <Card>
          <Card.Header
            title="Pending Invitations"
            subtitle={`${pendingInvitations.length} invitation${pendingInvitations.length === 1 ? '' : 's'} waiting for response`}
          />
          <Card.Content>
            <div className="divide-y divide-gray-200">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-500">
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(invitation.status)}
                      <span className="text-sm text-gray-500">{invitation.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {invitation.roles.map((role) => (
                        <span
                          key={role}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {getRoleLabel(role)}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resendInvitationMutation.mutate(invitation.id)}
                        disabled={resendInvitationMutation.isPending}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                        disabled={revokeInvitationMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowInviteModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
              <form onSubmit={(e) => { void handleSubmit(onSubmitInvite)(e); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  required
                  helperText="An invitation email will be sent to this address"
                />
                <FormField
                  name="role"
                  label="Role"
                  type="select"
                  register={register}
                  errors={errors}
                  options={[
                    { value: 'CAREGIVER', label: 'Caregiver' },
                    { value: 'COORDINATOR', label: 'Care Coordinator' },
                    { value: 'SCHEDULER', label: 'Scheduler' },
                    { value: 'BILLING_SPECIALIST', label: 'Billing Specialist' },
                    { value: 'ADMIN', label: 'Administrator' },
                  ]}
                  required
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInviteModal(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={createInvitationMutation.isPending}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
