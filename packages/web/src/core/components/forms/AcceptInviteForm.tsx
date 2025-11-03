/**
 * Accept Invitation Form
 *
 * Form for accepting team member invitation and creating account
 */

import React, { useState } from 'react';
import { Button } from '../Button';
import { Input } from './Input';
import { FormField } from './FormField';
import type { AcceptInviteRequest, InviteDetails } from '../../services/organization-api';

interface AcceptInviteFormProps {
  readonly inviteDetails: InviteDetails;
  readonly onSubmit: (data: AcceptInviteRequest) => Promise<void>;
  readonly isLoading?: boolean;
}

// Field name constants - these are form field names, not actual password values
/* eslint-disable sonarjs/no-hardcoded-passwords */
const PWD_FIELD = 'password';
const CONFIRM_PWD_FIELD = 'confirmPassword';
/* eslint-enable sonarjs/no-hardcoded-passwords */

export function AcceptInviteForm({
  inviteDetails,
  onSubmit,
  isLoading = false,
}: AcceptInviteFormProps): React.ReactElement {
  const [formData, setFormData] = useState({
    firstName: inviteDetails.firstName ?? '',
    lastName: inviteDetails.lastName ?? '',
    [PWD_FIELD]: '',
    [CONFIRM_PWD_FIELD]: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors['firstName'] = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors['lastName'] = 'Last name is required';
    }

    // Password validation
    /* eslint-disable sonarjs/no-hardcoded-passwords */
    const pwd = formData[PWD_FIELD];
    if (!pwd) {
      newErrors[PWD_FIELD] = 'Password is required';
    } else if (pwd.length < 8) {
      newErrors[PWD_FIELD] = 'Password must be at least 8 characters';
    } else {
      // Check password strength
      const hasUppercase = /[A-Z]/.test(pwd);
      const hasLowercase = /[a-z]/.test(pwd);
      const hasNumber = /\d/.test(pwd);
      const hasSpecial = /[!"#$%&()*,.:<>?@^{|}]/.test(pwd);

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        newErrors[PWD_FIELD] =
          'Password must contain uppercase, lowercase, number, and special character';
      }
    }

    const confirmPwd = formData[CONFIRM_PWD_FIELD];
    if (!confirmPwd) {
      newErrors[CONFIRM_PWD_FIELD] = 'Please confirm your password';
    } else if (pwd !== confirmPwd) {
      newErrors[CONFIRM_PWD_FIELD] = 'Passwords do not match';
    }
    /* eslint-enable sonarjs/no-hardcoded-passwords */

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        token: inviteDetails.token,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData[PWD_FIELD],
        phone: formData.phone || undefined,
      });
    } catch (error) {
      console.error('Accept invitation error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Invitation Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">You've been invited to join</h3>
        <p className="text-lg font-semibold text-blue-900">{inviteDetails.organizationName}</p>
        <p className="text-sm text-blue-700 mt-1">Role: {inviteDetails.roles.join(', ')}</p>
        <p className="text-sm text-blue-700">Email: {inviteDetails.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" error={errors['firstName']} required>
            <Input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="John"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Last Name" error={errors['lastName']} required>
            <Input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Doe"
              disabled={isLoading}
            />
          </FormField>
        </div>

        <FormField label="Password" error={errors[PWD_FIELD]} required>
          <Input
            type="password"
            value={formData[PWD_FIELD]}
            onChange={(e) => handleInputChange(PWD_FIELD, e.target.value)}
            placeholder="Minimum 8 characters"
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Must contain uppercase, lowercase, number, and special character
          </p>
        </FormField>

        <FormField label="Confirm Password" error={errors[CONFIRM_PWD_FIELD]} required>
          <Input
            type="password"
            value={formData[CONFIRM_PWD_FIELD]}
            onChange={(e) => handleInputChange(CONFIRM_PWD_FIELD, e.target.value)}
            placeholder="Re-enter password"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Phone" error={errors['phone']}>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isLoading}
          />
        </FormField>

        <div className="pt-4">
          <Button type="submit" variant="primary" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating Account...' : 'Accept Invitation & Create Account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
