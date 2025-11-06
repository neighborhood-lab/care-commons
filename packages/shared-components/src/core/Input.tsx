import React from 'react';
import { cn } from '../utils/classnames.js';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-200 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md bg-neutral-900 border-neutral-700 text-neutral-100 placeholder-neutral-400 shadow-sm',
            'focus:border-primary-500 focus:ring-primary-500 sm:text-sm',
            'disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500" id={`${inputId}-error`}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
