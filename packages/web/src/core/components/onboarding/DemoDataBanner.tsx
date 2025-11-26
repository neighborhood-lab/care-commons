import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '../Button';

export interface DemoDataBannerProps {
  onRemoveDemoData: () => void;
  onDismiss?: () => void;
  isRemoving?: boolean;
}

export const DemoDataBanner: React.FC<DemoDataBannerProps> = ({
  onRemoveDemoData,
  onDismiss,
  isRemoving = false,
}) => {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            You're viewing sample data
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              This is demo data to help you explore the platform. When you're ready to add your
              own clients, caregivers, and visits, you can remove this sample data.
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveDemoData}
              isLoading={isRemoving}
              className="text-amber-800 border-amber-300 hover:bg-amber-100"
            >
              Remove Sample Data
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-amber-700"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="inline-flex text-amber-400 hover:text-amber-500 focus:outline-none"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
