import React from 'react';

export const FamilyDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome Stein family,
          </h1>
          <p className="text-2xl text-gray-700">
            How can we take exceptional care of Gertrude today?
          </p>
        </div>
      </div>
    </div>
  );
};
