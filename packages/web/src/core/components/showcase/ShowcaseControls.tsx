/**
 * Showcase Controls Component
 *
 * Control panel for showcase mode features.
 */

import React from 'react';
import { RotateCcw, Info } from 'lucide-react';
import { useApiProvider } from '../../providers';
import { ShowcaseApiProvider } from '../../providers/showcase-api-provider';
import { RoleSwitcher } from './RoleSwitcher';

export const ShowcaseControls: React.FC = () => {
  const provider = useApiProvider();
  const [showInfo, setShowInfo] = React.useState(false);

  if (!(provider instanceof ShowcaseApiProvider)) {
    return null; // Only show in showcase mode
  }

  const handleReset = () => {
    if (confirm('Reset all demo data? This will refresh the page and restore the initial demo data.')) {
      provider.resetData();
      window.location.reload();
    }
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setShowInfo(true)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          title="About"
        >
          <Info className="h-4 w-4" />
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          title="Reset Data"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-sm font-medium">Reset Data</span>
        </button>

        <RoleSwitcher />
      </div>

      {/* Demo Info Banner */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gray-900 text-white px-4 py-2 text-center text-sm">
        <span>Demo Mode • Changes saved locally</span>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowInfo(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">About</h2>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-gray-700">
                  <p>
                    Interactive demo of Care Commons care coordination software.
                  </p>

                  <p className="text-sm">
                    Changes are saved in your browser. Use Role Switcher to view different perspectives.
                  </p>

                  <div className="pt-4 border-t border-gray-200">
                    <a
                      href="https://github.com/neighborhood-lab/care-commons"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-gray-700 font-medium"
                    >
                      GitHub →
                    </a>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowInfo(false)}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
