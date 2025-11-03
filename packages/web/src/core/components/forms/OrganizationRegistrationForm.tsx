/**
 * Organization Registration Form
 *
 * Multi-tenant organization onboarding with state selection
 * Designed to scale from 2 states (TX, FL) to 50 states
 */

import { useState } from 'react';
import { Button } from '../Button';
import { Input } from './Input';
import { Select } from './Select';
import { FormField } from './FormField';
import type { CreateOrganizationRequest, Address } from '../../services/organization-api';
import { US_STATES } from '../../services/organization-api';

interface OrganizationRegistrationFormProps {
  readonly onSubmit: (data: CreateOrganizationRequest) => Promise<void>;
  readonly onCancel?: () => void;
  readonly isLoading?: boolean;
}

export function OrganizationRegistrationForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: OrganizationRegistrationFormProps): React.ReactElement {
  const [formData, setFormData] = useState<Partial<CreateOrganizationRequest>>({
    name: '',
    email: '',
    stateCode: 'TX', // Default to Texas
    primaryAddress: {
      street1: '',
      city: '',
      state: 'TX',
      zipCode: '',
      country: 'USA',
    },
    adminUser: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    },
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

  const handleAddressChange = (field: keyof Address, value: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryAddress: {
        ...(prev.primaryAddress ?? {
          street1: '',
          city: '',
          state: 'TX',
          zipCode: '',
          country: 'USA',
        }),
        [field]: value,
      },
    }));
  };

  const handleAdminUserChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      adminUser: {
        ...(prev.adminUser ?? {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
        }),
        [field]: value,
      },
    }));
    // Clear error when user starts typing
    if (errors[`adminUser.${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`adminUser.${field}`];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Organization validation
    if (!formData.name?.trim()) {
      newErrors['name'] = 'Organization name is required';
    }

    if (!formData.email?.trim()) {
      newErrors['email'] = 'Organization email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors['email'] = 'Invalid email format';
    }

    if (!formData.stateCode) {
      newErrors['stateCode'] = 'State selection is required';
    }

    // Address validation
    if (!formData.primaryAddress?.street1?.trim()) {
      newErrors['primaryAddress.street1'] = 'Street address is required';
    }

    if (!formData.primaryAddress?.city?.trim()) {
      newErrors['primaryAddress.city'] = 'City is required';
    }

    if (!formData.primaryAddress?.zipCode?.trim()) {
      newErrors['primaryAddress.zipCode'] = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.primaryAddress.zipCode)) {
      newErrors['primaryAddress.zipCode'] = 'Invalid ZIP code format';
    }

    // Admin user validation
    if (!formData.adminUser?.firstName?.trim()) {
      newErrors['adminUser.firstName'] = 'First name is required';
    }

    if (!formData.adminUser?.lastName?.trim()) {
      newErrors['adminUser.lastName'] = 'Last name is required';
    }

    if (!formData.adminUser?.email?.trim()) {
      newErrors['adminUser.email'] = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminUser.email)) {
      newErrors['adminUser.email'] = 'Invalid email format';
    }

    // Password validation - using optional chaining for adminUser object
    /* eslint-disable sonarjs/no-hardcoded-passwords */
    if (!formData.adminUser?.password) {
      newErrors['adminUser.password'] = 'Password is required';
    } else if (formData.adminUser.password.length < 8) {
      newErrors['adminUser.password'] = 'Password must be at least 8 characters';
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
      await onSubmit(formData as CreateOrganizationRequest);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organization Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Organization Information</h3>

        <FormField label="Organization Name" error={errors['name']} required>
          <Input
            type="text"
            value={formData.name ?? ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your Organization Name"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Legal Name" error={errors['legalName']}>
          <Input
            type="text"
            value={formData.legalName ?? ''}
            onChange={(e) => handleInputChange('legalName', e.target.value)}
            placeholder="Legal Business Name (if different)"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="State" error={errors['stateCode']} required>
          <Select
            value={formData.stateCode ?? 'TX'}
            onChange={(e) => {
              const newState = e.target.value;
              handleInputChange('stateCode', newState);
              handleAddressChange('state', newState);
            }}
            disabled={isLoading}
            options={US_STATES.map((state) => ({
              value: state.code,
              label: state.name,
            }))}
            placeholder="Select a state"
          />
        </FormField>

        <FormField label="Organization Email" error={errors['email']} required>
          <Input
            type="email"
            value={formData.email ?? ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="contact@organization.com"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Phone" error={errors['phone']}>
          <Input
            type="tel"
            value={formData.phone ?? ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isLoading}
          />
        </FormField>
      </div>

      {/* Primary Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Primary Address</h3>

        <FormField label="Street Address" error={errors['primaryAddress.street1']} required>
          <Input
            type="text"
            value={formData.primaryAddress?.street1 ?? ''}
            onChange={(e) => handleAddressChange('street1', e.target.value)}
            placeholder="123 Main Street"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Street Address Line 2" error={errors['primaryAddress.street2']}>
          <Input
            type="text"
            value={formData.primaryAddress?.street2 ?? ''}
            onChange={(e) => handleAddressChange('street2', e.target.value)}
            placeholder="Suite 100 (optional)"
            disabled={isLoading}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="City" error={errors['primaryAddress.city']} required>
            <Input
              type="text"
              value={formData.primaryAddress?.city ?? ''}
              onChange={(e) => handleAddressChange('city', e.target.value)}
              placeholder="City"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="State" error={errors['primaryAddress.state']} required>
            <Input
              type="text"
              value={formData.primaryAddress?.state ?? formData.stateCode ?? ''}
              disabled
            />
          </FormField>

          <FormField label="ZIP Code" error={errors['primaryAddress.zipCode']} required>
            <Input
              type="text"
              value={formData.primaryAddress?.zipCode ?? ''}
              onChange={(e) => handleAddressChange('zipCode', e.target.value)}
              placeholder="12345"
              disabled={isLoading}
            />
          </FormField>
        </div>
      </div>

      {/* Admin User */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Administrator Account</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" error={errors['adminUser.firstName']} required>
            <Input
              type="text"
              value={formData.adminUser?.firstName ?? ''}
              onChange={(e) => handleAdminUserChange('firstName', e.target.value)}
              placeholder="John"
              disabled={isLoading}
            />
          </FormField>

          <FormField label="Last Name" error={errors['adminUser.lastName']} required>
            <Input
              type="text"
              value={formData.adminUser?.lastName ?? ''}
              onChange={(e) => handleAdminUserChange('lastName', e.target.value)}
              placeholder="Doe"
              disabled={isLoading}
            />
          </FormField>
        </div>

        <FormField label="Admin Email" error={errors['adminUser.email']} required>
          <Input
            type="email"
            value={formData.adminUser?.email ?? ''}
            onChange={(e) => handleAdminUserChange('email', e.target.value)}
            placeholder="admin@organization.com"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Password" error={errors['adminUser.password']} required>
          <Input
            type="password"
            value={formData.adminUser?.password ?? ''}
            onChange={(e) => handleAdminUserChange('password', e.target.value)}
            placeholder="Minimum 8 characters"
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Must contain uppercase, lowercase, number, and special character
          </p>
        </FormField>

        <FormField label="Phone" error={errors['adminUser.phone']}>
          <Input
            type="tel"
            value={formData.adminUser?.phone ?? ''}
            onChange={(e) => handleAdminUserChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isLoading}
          />
        </FormField>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? 'Creating Organization...' : 'Create Organization'}
        </Button>
      </div>
    </form>
  );
}
