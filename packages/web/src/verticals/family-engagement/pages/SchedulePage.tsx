/**
 * Family Schedule Page
 *
 * Shows upcoming care visits and appointments
 */

import React from 'react';

export const SchedulePage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)]">
      <div className="text-center space-y-6 max-w-2xl px-6">
        <h1 className="text-4xl font-bold text-gray-900">
          View Care Schedule
        </h1>
        <p className="text-4xl font-semibold text-gray-400">Coming soon...</p>
      </div>
    </div>
  );
};
