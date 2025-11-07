/**
 * Reusable form field component
 * Consolidates common form field patterns with react-hook-form
 */

import { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'datetime-local' | 'number' | 'password' | 'select' | 'textarea';
  options?: Array<{ value: string; label: string }>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  rows?: number; // For textarea
  helperText?: string;
  className?: string;
}

/**
 * Generic form field component that handles common input types
 * Integrates with react-hook-form for validation and error display
 */
export function FormField<T extends FieldValues>({
  name,
  label,
  type = 'text',
  options,
  register,
  errors,
  required,
  disabled,
  placeholder,
  rows = 4,
  helperText,
  className = '',
}: FormFieldProps<T>) {
  const error = errors?.[name];
  const errorMessage = error?.message as string | undefined;

  const baseInputClass = `
    w-full px-3 py-2 border rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-gray-300'}
  `.trim();

  return (
    <div className={`mb-4 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'select' ? (
        <select
          id={name}
          {...register(name)}
          disabled={disabled}
          className={baseInputClass}
        >
          <option value="">Select...</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          {...register(name)}
          disabled={disabled}
          rows={rows}
          placeholder={placeholder}
          className={baseInputClass}
        />
      ) : (
        <input
          id={name}
          type={type}
          {...register(name)}
          disabled={disabled}
          placeholder={placeholder}
          className={baseInputClass}
        />
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}

      {errorMessage && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Checkbox field component
 */
export interface CheckboxFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

export function CheckboxField<T extends FieldValues>({
  name,
  label,
  register,
  errors,
  disabled,
  helperText,
  className = '',
}: CheckboxFieldProps<T>) {
  const error = errors?.[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-start">
        <input
          id={name}
          type="checkbox"
          {...register(name)}
          disabled={disabled}
          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor={name} className="ml-2 block text-sm text-gray-700">
          {label}
        </label>
      </div>

      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1 ml-6">{helperText}</p>
      )}

      {errorMessage && (
        <p className="text-sm text-red-600 mt-1 ml-6" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Radio group field component
 */
export interface RadioFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: Array<{ value: string; label: string; description?: string }>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RadioField<T extends FieldValues>({
  name,
  label,
  options,
  register,
  errors,
  required,
  disabled,
  className = '',
}: RadioFieldProps<T>) {
  const error = errors?.[name];
  const errorMessage = error?.message as string | undefined;

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <input
              id={`${name}-${option.value}`}
              type="radio"
              value={option.value}
              {...register(name)}
              disabled={disabled}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className="ml-2 block text-sm"
            >
              <span className="text-gray-700">{option.label}</span>
              {option.description && (
                <span className="block text-gray-500 text-xs mt-0.5">
                  {option.description}
                </span>
              )}
            </label>
          </div>
        ))}
      </div>

      {errorMessage && (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
