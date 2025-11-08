/**
 * Family Dashboard Page
 *
 * Main landing page for family members
 */

import React from 'react';

export const FamilyDashboard: React.FC = () => {
  // For demo purposes, hardcode Gertrude Stein's name
  const patientName = 'Gertrude Stein';

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="text-center space-y-6 max-w-2xl px-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome family members of {patientName}
        </h1>
        <p className="text-xl text-gray-700">
          How can we provide exceptional care for {patientName} today?
        </p>
        <div className="mt-12">
          <p className="text-4xl font-semibold text-gray-400">Coming soon...</p>
        </div>
      </div>
    </div>
  );
};
