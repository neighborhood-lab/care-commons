/**
 * Invite Team Member Form
 * 
 * Form for inviting new team members via email
 */

import React, { useState } from 'react';
import { Button } from '../Button';
import { Input } from './Input';
import { Select } from './Select';
import { FormField } from './FormField';
import type { CreateInviteRequest } from '../../services/organization-api';

interface InviteMemberFormProps {
  readonly onSubmit: (data: CreateInviteRequest) => Promise<void>;
  readonly onCancel?: () => void;
  readonly isLoading?: boolean;
}

const ROLE_OPTIONS = [
  { value: 'ORG_ADMIN', label: 'Organization Administrator' },
  { value: 'BRANCH_ADMIN', label: 'Branch Administrator' },
  { value: 'COORDINATOR', label: 'Coordinator' },
  { value: 'SCHEDULER', label: 'Scheduler' },
  { value: 'CAREGIVER', label: 'Caregiver' },
  { value: 'BILLING', label: 'Billing Staff' },
];

export function InviteMemberForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: InviteMemberFormProps): React.ReactElement {
  const [formData, setFormData] = useState<Partial<CreateInviteRequest>>({
    email: '',
    firstName: '',
    lastName: '',
    roles: [],
    expiresInDays: 7,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | string[]) => {
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

    if (!formData.email?.trim()) {
      newErrors['email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors['email'] = 'Invalid email format';
    }

    if (!formData.roles || formData.roles.length === 0) {
      newErrors['roles'] = 'At least one role must be selected';
    }

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
        email: formData.email!,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        roles: formData.roles!,
        expiresInDays: formData.expiresInDays,
      });
    } catch (error) {
      console.error('Invitation error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Email Address" error={errors['email']} required>
        <Input
          type="email"
          value={formData.email ?? ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="colleague@example.com"
          disabled={isLoading}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="First Name" error={errors['firstName']}>
          <Input
            type="text"
            value={formData.firstName ?? ''}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="John"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Last Name" error={errors['lastName']}>
          <Input
            type="text"
            value={formData.lastName ?? ''}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Doe"
            disabled={isLoading}
          />
        </FormField>
      </div>

      <FormField label="Role" error={errors['roles']} required>
        <Select
          value={formData.roles?.[0] ?? ''}
          onChange={(e) => handleInputChange('roles', [e.target.value])}
          disabled={isLoading}
          options={ROLE_OPTIONS}
          placeholder="Select a role"
        />
      </FormField>

      <FormField label="Invitation Expires In" error={errors['expiresInDays']}>
        <Select
          value={String(formData.expiresInDays ?? 7)}
          onChange={(e) => {
            const numValue = Number(e.target.value);
            setFormData((prev) => ({ ...prev, expiresInDays: numValue }));
          }}
          disabled={isLoading}
          options={[
            { value: '1', label: '1 day' },
            { value: '3', label: '3 days' },
            { value: '7', label: '7 days' },
            { value: '14', label: '14 days' },
            { value: '30', label: '30 days' },
          ]}
        />
      </FormField>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Sending Invitation...' : 'Send Invitation'}
        </Button>
      </div>
    </form>
  );
}
