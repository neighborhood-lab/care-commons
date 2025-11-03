/**
 * Shared UI type definitions for Care Commons components
 * These types ensure consistency across web and mobile platforms
 */

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

export type Status = 'success' | 'error' | 'warning' | 'info';

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface FormFieldMeta {
  touched?: boolean;
  error?: string;
  isDirty?: boolean;
}
