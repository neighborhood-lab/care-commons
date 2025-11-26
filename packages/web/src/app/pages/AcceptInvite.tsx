/**
 * Accept Invitation Page
 * 
 * Allows invited team members to accept their invitation and create an account.
 * Handles token validation, error states, and account creation flow.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@care-commons/shared-components';
import { Button } from '@care-commons/shared-components';
import { useApiClient } from '@/core/hooks';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Building2, Mail, Shield } from 'lucide-react';

interface InviteDetails {
  token: string;
  email: string;
  organizationId: string;
  organizationName: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
}

interface AcceptInviteFormData {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();

  // Fetch invitation details
  const { 
    data: inviteDetails, 
    isLoading, 
    error: fetchError 
  } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) throw new Error('No invitation token provided');
      return await apiClient.get<InviteDetails>(`/api/invitations/${token}`);
    },
    enabled: Boolean(token),
    retry: false,
  });

  // Track if we've initialized form with invite data
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Initialize form data - use invite details if available and not yet initialized
  const getInitialFormData = (): AcceptInviteFormData => ({
    firstName: inviteDetails?.firstName ?? '',
    lastName: inviteDetails?.lastName ?? '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  
  const [formData, setFormData] = useState<AcceptInviteFormData>(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when invite details load (only once)
  if (inviteDetails && !hasInitialized) {
    setFormData({
      firstName: inviteDetails.firstName ?? '',
      lastName: inviteDetails.lastName ?? '',
      password: '',
      confirmPassword: '',
      phone: '',
    });
    setHasInitialized(true);
  }

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: async (data: AcceptInviteFormData) => {
      return await apiClient.post('/api/invitations/accept', {
        token,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        phone: data.phone || undefined,
      });
    },
    onSuccess: () => {
      // Redirect to login with success message
      navigate('/login?invitation=accepted');
    },
  });

  // Field name constants - these are form field names, not actual credential values
   
  const PWD_FIELD = 'password' as const;
  const CONFIRM_PWD_FIELD = 'confirmPassword' as const;
   

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors['firstName'] = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors['lastName'] = 'Last name is required';
    }

    const pwd = formData[PWD_FIELD];
    if (!pwd) {
      newErrors[PWD_FIELD] = 'Password is required';
    } else if (pwd.length < 12) {
      newErrors[PWD_FIELD] = 'Password must be at least 12 characters';
    } else {
      const hasUppercase = /[A-Z]/.test(pwd);
      const hasLowercase = /[a-z]/.test(pwd);
      const hasNumber = /\d/.test(pwd);
      const hasSpecial = /[!"#$%&()*,.:<>?@^{|}]/.test(pwd);

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        newErrors[PWD_FIELD] = 'Password must contain uppercase, lowercase, number, and special character';
      }
    }

    const confirmPwd = formData[CONFIRM_PWD_FIELD];
    if (!confirmPwd) {
      newErrors[CONFIRM_PWD_FIELD] = 'Please confirm your password';
    } else if (pwd !== confirmPwd) {
      newErrors[CONFIRM_PWD_FIELD] = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      acceptMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof AcceptInviteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (fetchError || !inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has been removed. Please contact your administrator for a new invitation.
            </p>
            <Link to="/login">
              <Button variant="primary">Go to Login</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Expired invitation
  if (inviteDetails.status === 'EXPIRED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Expired</h2>
            <p className="text-gray-600 mb-6">
              This invitation has expired. Please contact your administrator to send a new invitation.
            </p>
            <Link to="/login">
              <Button variant="primary">Go to Login</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Already accepted
  if (inviteDetails.status === 'ACCEPTED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Accepted</h2>
            <p className="text-gray-600 mb-6">
              This invitation has already been accepted. You can log in with your credentials.
            </p>
            <Link to="/login">
              <Button variant="primary">Go to Login</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Revoked invitation
  if (inviteDetails.status === 'REVOKED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <Card.Content className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Revoked</h2>
            <p className="text-gray-600 mb-6">
              This invitation has been revoked. Please contact your administrator if you believe this is an error.
            </p>
            <Link to="/login">
              <Button variant="primary">Go to Login</Button>
            </Link>
          </Card.Content>
        </Card>
      </div>
    );
  }

  // Valid invitation - show accept form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Join Care Commons</h1>
          <p className="mt-2 text-gray-600">Complete your account setup to get started</p>
        </div>

        {/* Invitation Details Card */}
        <Card>
          <Card.Content className="py-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">You've been invited to join</p>
                <p className="text-lg font-semibold text-gray-900">{inviteDetails.organizationName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {inviteDetails.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleLabel(role)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                {inviteDetails.email}
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Accept Form */}
        <Card>
          <Card.Header title="Create Your Account" />
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors['firstName']
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                    disabled={acceptMutation.isPending}
                  />
                  {errors['firstName'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['firstName']}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                      errors['lastName']
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                    disabled={acceptMutation.isPending}
                  />
                  {errors['lastName'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['lastName']}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors['password']
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  disabled={acceptMutation.isPending}
                />
                <p className="mt-1 text-xs text-gray-500">
                  At least 12 characters with uppercase, lowercase, number, and special character
                </p>
                {errors['password'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['password']}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors['confirmPassword']
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                  disabled={acceptMutation.isPending}
                />
                {errors['confirmPassword'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['confirmPassword']}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  disabled={acceptMutation.isPending}
                />
              </div>

              {/* Error Message */}
              {acceptMutation.isError && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">
                    {acceptMutation.error instanceof Error 
                      ? acceptMutation.error.message 
                      : 'Failed to accept invitation. Please try again.'}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={acceptMutation.isPending}
                >
                  Accept Invitation & Create Account
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
