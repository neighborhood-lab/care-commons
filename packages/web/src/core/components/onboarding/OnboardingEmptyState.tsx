import React from 'react';
import { Database, Plus, Sparkles } from 'lucide-react';
import { EmptyState } from '../feedback/EmptyState';
import { Button } from '../Button';

export interface OnboardingEmptyStateProps {
  /**
   * The type of resource (e.g., "clients", "caregivers", "visits")
   */
  resourceType: string;
  
  /**
   * Singular form of the resource (e.g., "client", "caregiver", "visit")
   */
  resourceSingular: string;
  
  /**
   * Optional custom description
   */
  description?: string;
  
  /**
   * Whether to show the "Load Sample Data" option
   */
  showDemoDataOption?: boolean;
  
  /**
   * Callback when "Load Sample Data" is clicked
   */
  onLoadDemoData?: () => void;
  
  /**
   * Callback when "Add [Resource]" is clicked
   */
  onAddResource?: () => void;
  
  /**
   * Whether demo data is currently being loaded
   */
  isLoadingDemoData?: boolean;
  
  /**
   * Whether the user has permission to add resources
   */
  canAdd?: boolean;
  
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
}

export const OnboardingEmptyState: React.FC<OnboardingEmptyStateProps> = ({
  resourceType,
  resourceSingular,
  description,
  showDemoDataOption = true,
  onLoadDemoData,
  onAddResource,
  isLoadingDemoData = false,
  canAdd = true,
  icon,
}) => {
  const defaultDescription = 
    description || 
    `Get started by ${showDemoDataOption ? 'loading sample data to explore the platform, or by ' : ''}adding your first ${resourceSingular}.`;

  return (
    <EmptyState
      title={`No ${resourceType} yet`}
      description={defaultDescription}
      icon={icon}
      size="lg"
      action={
        showDemoDataOption && onLoadDemoData ? (
          <Button
            leftIcon={<Sparkles className="h-4 w-4" />}
            onClick={onLoadDemoData}
            isLoading={isLoadingDemoData}
            size="lg"
            variant="primary"
          >
            Load Sample Data
          </Button>
        ) : canAdd && onAddResource ? (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onAddResource}
            size="lg"
            disabled={!canAdd}
            title={!canAdd ? `You do not have permission to create ${resourceType}` : undefined}
          >
            Add {resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}
          </Button>
        ) : null
      }
      secondaryAction={
        showDemoDataOption && onLoadDemoData && canAdd && onAddResource ? (
          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onAddResource}
            disabled={!canAdd || isLoadingDemoData}
            title={!canAdd ? `You do not have permission to create ${resourceType}` : undefined}
          >
            Add {resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}
          </Button>
        ) : null
      }
      metadata={
        showDemoDataOption && onLoadDemoData ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 max-w-md">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <div className="text-left">
                <p className="font-medium mb-1">What's sample data?</p>
                <p className="text-blue-700">
                  Sample data includes realistic {resourceType}, allowing you to explore features
                  before adding your own. You can remove it anytime.
                </p>
              </div>
            </div>
          </div>
        ) : null
      }
    />
  );
};
