import React from 'react';

export const FamilyDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome family members of Gertrude Stein
          </h1>
          <p className="text-xl text-gray-700">
            How can we provide exceptional care for Gertrude today?
          </p>
          <div className="mt-12 pt-12 border-t border-gray-200">
            <p className="text-2xl font-semibold text-gray-600">
              Coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
