import React from 'react';
import { cn } from '../../utils/classnames';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  illustration?: React.ReactNode;
  metadata?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  illustration,
  metadata,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'py-8 px-4',
    md: 'py-12 px-4',
    lg: 'py-16 px-6',
  };

  const iconSizeClasses = {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-6xl',
  };

  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {illustration && <div className="mb-6">{illustration}</div>}
      {!illustration && icon && (
        <div className={cn('mb-4 text-gray-400', iconSizeClasses[size])}>
          {icon}
        </div>
      )}
      <h3 className={cn('font-medium text-gray-900 mb-2', titleSizeClasses[size])}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-600 text-center mb-6 max-w-md">
          {description}
        </p>
      )}
      {metadata && (
        <div className="mb-6 text-center">{metadata}</div>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {action && <div>{action}</div>}
          {secondaryAction && <div>{secondaryAction}</div>}
        </div>
      )}
    </div>
  );
};
