import React from 'react';
import { cn } from '../../utils/classnames';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4',
        'animate-in fade-in duration-500',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {icon && (
        <div className="mb-6 text-gray-300 animate-in zoom-in duration-300 delay-150">
          <div className="p-4 bg-gray-50 rounded-full">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-in slide-in-from-bottom-2 duration-300 delay-200">
        {title}
      </h3>
      {description && (
        <p className="text-base text-gray-600 text-center mb-8 max-w-md leading-relaxed animate-in slide-in-from-bottom-2 duration-300 delay-300">
          {description}
        </p>
      )}
      {action && (
        <div className="animate-in slide-in-from-bottom-2 duration-300 delay-400">
          {action}
        </div>
      )}
    </div>
  );
};
