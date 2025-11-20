import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'care-commons-showcase-data';

export const DemoReset: React.FC = () => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // Reload to reinitialize with seed data
    window.location.reload();
  };

  if (showConfirm) {
    return (
      <div className="relative">
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border-2 border-red-200 bg-white p-4 shadow-xl z-50">
          <p className="text-sm text-gray-700 mb-3 font-medium">
            Reset all demo data?
          </p>
          <p className="text-xs text-gray-500 mb-4">
            This will clear all changes and reload the original demo data. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 bg-red-600 text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Reset Now
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors"
      title="Reset demo data to original state"
    >
      <RotateCcw className="w-4 h-4" />
      <span className="hidden sm:inline">Reset Data</span>
    </button>
  );
};
