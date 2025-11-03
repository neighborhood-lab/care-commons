import clsx, { ClassValue } from 'clsx';

/**
 * Utility function to merge class names
 * Wraps clsx for consistent className handling across components
 */
export const cn = (...inputs: ClassValue[]): string => {
  return clsx(inputs);
};
