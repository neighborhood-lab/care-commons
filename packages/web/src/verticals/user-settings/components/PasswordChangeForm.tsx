/**
 * Password Change Form Component
 *
 * Form for changing user password.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/core/components';
import { FormField } from '@/core/components/forms';
import { useChangePassword } from '../hooks';
import type { ChangePasswordInput } from '../types';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const PasswordChangeForm = () => {
  const { mutate: changePassword, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success('Password changed successfully');
        reset();
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to change password');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        label="Current Password"
        error={errors.currentPassword?.message}
        required
      >
        <input
          type="password"
          {...register('currentPassword')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </FormField>

      <FormField
        label="New Password"
        error={errors.newPassword?.message}
        required
        helpText="Must be at least 8 characters with uppercase, lowercase, and numbers"
      >
        <input
          type="password"
          {...register('newPassword')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </FormField>

      <FormField
        label="Confirm New Password"
        error={errors.confirmPassword?.message}
        required
      >
        <input
          type="password"
          {...register('confirmPassword')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </FormField>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? 'Changing Password...' : 'Change Password'}
        </Button>
      </div>
    </form>
  );
};
