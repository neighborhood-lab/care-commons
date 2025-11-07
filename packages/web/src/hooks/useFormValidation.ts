/**
 * Form Validation Hook for Web
 *
 * Provides a standardized way to use form validation with React Hook Form and Zod
 */

import { useForm, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

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
export const useFormValidation = <TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.output<TSchema>>, 'resolver'>
): UseFormReturn<z.output<TSchema>> => {
  return useForm<z.output<TSchema>>({
    resolver: zodResolver(schema) as any,
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after first submit
    ...options
  });
};
