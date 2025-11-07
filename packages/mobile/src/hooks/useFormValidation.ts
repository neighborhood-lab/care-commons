/**
 * Form Validation Hook for Mobile
 *
 * Provides a standardized way to use form validation with Zod schemas
 * for React Native applications
 */

import { useState, useCallback } from 'react';
import { z } from 'zod';

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
export const useFormValidation = <T extends z.ZodType>(
  schema: T
): FormValidationReturn<z.infer<T>> => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate entire form data
   */
  const validate = useCallback((data: z.infer<T>): boolean => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const err of error.errors) {
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        }
        setErrors(fieldErrors);
      }
      return false;
    }
  }, [schema]);

  /**
   * Validate a single field
   */
  const validateField = useCallback((name: string, value: unknown): string | undefined => {
    try {
      // For nested object schemas, we need to validate the entire form
      // but only return the error for this specific field
      const schemaShape = (schema as z.ZodObject<z.ZodRawShape>).shape;

      if (schemaShape && schemaShape[name]) {
        schemaShape[name].parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
        return undefined;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors[0]?.message;
        setErrors((prev) => ({ ...prev, [name]: message }));
        return message;
      }
    }
    return undefined;
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
