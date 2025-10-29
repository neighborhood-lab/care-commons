import clsx, { ClassValue } from 'clsx';

export const cn = (...inputs: ClassValue[]): string => {
  return clsx(inputs);
};
