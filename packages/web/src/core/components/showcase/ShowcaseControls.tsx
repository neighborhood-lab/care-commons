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
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="About This Demo"
        >
          <Info className="h-4 w-4" />
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          title="Reset Demo Data"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-sm font-medium">Reset Data</span>
        </button>

        <RoleSwitcher />
      </div>

      {/* Demo Info Banner */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-center text-sm shadow-lg">
        <span className="font-semibold">Demo Mode</span>
        <span className="mx-2">•</span>
        <span>All changes are saved locally in your browser</span>
        <span className="mx-2">•</span>
        <span>Try switching roles to see different perspectives</span>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowInfo(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">About This Demo</h2>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-gray-700">
                  <p>
                    Welcome to the <strong>Care Commons Platform</strong> interactive demo!
                    This showcase runs entirely in your browser and demonstrates the full
                    capabilities of our community-owned care coordination software.
                  </p>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Features You Can Explore:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Client Demographics & Management</li>
                      <li>Care Plan Creation & Tracking</li>
                      <li>Task Management & Assignments</li>
                      <li>Shift Matching & Scheduling</li>
                      <li>Electronic Visit Verification (EVV)</li>
                      <li>Billing & Invoicing</li>
                      <li>Payroll Processing</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Try Different Roles:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Admin:</strong> Full system access and configuration</li>
                      <li><strong>Care Coordinator:</strong> Manage clients, care plans, and assignments</li>
                      <li><strong>Caregiver:</strong> View shifts, log time, and complete tasks</li>
                      <li><strong>Family Member:</strong> View care updates and communicate</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">How It Works:</h3>
                    <p className="text-blue-800 text-sm">
                      This demo uses your browser's local storage to save changes. Each visitor
                      gets their own sandbox to experiment with. Your changes won't affect anyone
                      else, and you can reset the data anytime using the "Reset Data" button.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Demo Credentials:</h3>
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                      <div>Email: coordinator@demo.care-commons.org</div>
                      <div>Password: demo</div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      (Or use the Role Switcher to instantly switch perspectives)
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Want to learn more or contribute?{' '}
                      <a
                        href="https://github.com/neighborhood-lab/care-commons"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Visit our GitHub repository
                      </a>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowInfo(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Got it!
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
