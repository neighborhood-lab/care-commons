import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/classnames';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  retry,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-md bg-red-50 p-4 border border-red-200',
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">{message}</div>
          {retry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={retry}
                className="text-sm font-medium text-red-800 hover:text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
