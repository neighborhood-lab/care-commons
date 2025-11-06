/**
 * Settings Card Component
 *
 * Reusable card component for settings sections.
 */

import type { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const SettingsCard = ({
  title,
  description,
  children,
}: SettingsCardProps) => {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};
