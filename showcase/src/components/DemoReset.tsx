import { useState } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface DemoResetProps {
  onReset?: () => void;
}

export function DemoReset({ onReset }: DemoResetProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = () => {
    // Clear all localStorage data
    localStorage.clear();
    
    // Reload the page to re-seed data
    if (onReset) {
      onReset();
    }
    
    window.location.reload();
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <RotateCcw className="h-4 w-4" />
        Reset Demo Data
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Reset Demo Data?
            </h3>
            <p className="text-sm text-gray-600">
              This will clear all changes you've made and restore the original demo data. 
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-6">
          <p className="text-xs text-amber-800">
            <strong>Note:</strong> Any data you've created, modified, or deleted will be lost. 
            The showcase will reload with fresh seed data.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reset Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
