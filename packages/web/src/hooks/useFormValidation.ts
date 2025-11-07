/**
 * Form Validation Hook for Web
 *
 * Provides a standardized way to use form validation with React Hook Form and Zod
 */

import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Hook for form validation using Zod schemas
 *
 * @param schema - Zod schema to validate against
 * @param options - Additional React Hook Form options
 * @returns React Hook Form methods
 *
 * @example
 * ```tsx
 * import { useFormValidation } from '@/hooks/useFormValidation';
 * import { clientSchema } from '@care-commons/core/validation';
 *
 * const ClientForm = () => {
 *   const { register, handleSubmit, formState: { errors } } = useFormValidation(clientSchema);
 *
 *   const onSubmit = (data) => {
 *     console.log('Valid data:', data);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <Input
 *         {...register('first_name')}
 *         label="First Name"
 *         error={errors.first_name?.message}
 *       />
 *     </form>
 *   );
 * };
 * ```
 */
export const useFormValidation = <T extends z.ZodType>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
): UseFormReturn<z.infer<T>> => {
  return useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after first submit
    ...options
  });
};
