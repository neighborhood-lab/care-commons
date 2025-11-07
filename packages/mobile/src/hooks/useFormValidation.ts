/**
 * Form Validation Hook for Mobile
 *
 * Provides a standardized way to use form validation with Zod schemas
 * for React Native applications
 */

import { useState, useCallback } from 'react';
import type { z } from 'zod';

export interface FormValidationReturn<T> {
  errors: Record<string, string>;
  validate: (data: T) => boolean;
  validateField: (name: string, value: unknown) => string | undefined;
  clearErrors: () => void;
  clearFieldError: (name: string) => void;
}

/**
 * Hook for form validation using Zod schemas in React Native
 *
 * @param schema - Zod schema to validate against
 * @returns Validation methods and error state
 *
 * @example
 * ```tsx
 * import { useFormValidation } from '@/hooks/useFormValidation';
 * import { clientSchema } from '@care-commons/core/validation';
 *
 * const ClientForm = () => {
 *   const [formData, setFormData] = useState({});
 *   const { errors, validate, validateField } = useFormValidation(clientSchema);
 *
 *   const handleBlur = (field: string, value: any) => {
 *     validateField(field, value);
 *   };
 *
 *   const handleSubmit = () => {
 *     if (validate(formData)) {
 *       // Submit form
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       <TextInput
 *         placeholder="First Name"
 *         onChangeText={(value) => setFormData({ ...formData, first_name: value })}
 *         onBlur={() => handleBlur('first_name', formData.first_name)}
 *       />
 *       {errors.first_name && <Text style={styles.error}>{errors.first_name}</Text>}
 *     </View>
 *   );
 * };
 * ```
 */
export const useFormValidation = <TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema
): FormValidationReturn<z.output<TSchema>> => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate entire form data
   */
  const validate = useCallback((data: z.output<TSchema>): boolean => {
    const result = schema.safeParse(data);
    if (result.success) {
      setErrors({});
      return true;
    } else {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
  }, [schema]);

  /**
   * Validate a single field
   */
  const validateField = useCallback((name: string, value: unknown): string | undefined => {
    // For single field validation, create a partial schema
    // This is a simplified approach - for complex nested validation,
    // you may need to validate the entire form
    const result = schema.safeParse({ [name]: value });

    if (result.success) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      return undefined;
    } else {
      // Find error for this specific field
      const fieldError = result.error.issues.find((issue) =>
        issue.path.join('.') === name
      );

      if (fieldError) {
        const message = fieldError.message;
        setErrors((prev) => ({ ...prev, [name]: message }));
        return message;
      }

      return undefined;
    }
  }, [schema]);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError
  };
};
