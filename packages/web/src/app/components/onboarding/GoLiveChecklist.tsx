/**
 * Go-Live Checklist Component
 * 
 * Displays the complete go-live checklist organized by category.
 * Shows progress, allows marking items complete, and enables go-live approval.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Types matching the backend
type ChecklistItemStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

type GoLiveCategory = 
  | 'organization_setup'
  | 'compliance'
  | 'billing'
  | 'staff_setup'
  | 'client_setup'
  | 'operations';

interface GoLiveChecklistItem {
  id: string;
  category: GoLiveCategory;
  title: string;
  description: string;
  required: boolean;
  status: ChecklistItemStatus;
  completedAt?: string;
  autoVerifiable: boolean;
  actionUrl?: string;
  stateSpecific?: boolean;
}

interface CategorySummary {
  label: string;
  total: number;
  completed: number;
  percentage: number;
}

interface OnboardingProgress {
  organizationId: string;
  goLiveChecklist: GoLiveChecklistItem[];
  goLiveReadyAt?: string;
  goLiveApprovedAt?: string;
  overallProgress: number;
  requiredItemsComplete: number;
  requiredItemsTotal: number;
  optionalItemsComplete: number;
  optionalItemsTotal: number;
}

interface GoLiveChecklistProps {
  progress: OnboardingProgress;
  categorySummary: Record<GoLiveCategory, CategorySummary>;
  onUpdateItem: (itemId: string, status: ChecklistItemStatus) => Promise<void>;
  onRunVerification: () => Promise<void>;
  onApproveGoLive: () => Promise<void>;
  isLoading?: boolean;
}

const CATEGORY_ORDER: GoLiveCategory[] = [
  'organization_setup',
  'compliance',
  'billing',
  'staff_setup',
  'client_setup',
  'operations',
];

const CATEGORY_ICONS: Record<GoLiveCategory, React.ReactNode> = {
  organization_setup: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  compliance: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  billing: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  staff_setup: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  client_setup: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  operations: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
};

export function GoLiveChecklist({
  progress,
  categorySummary,
  onUpdateItem,
  onRunVerification,
  onApproveGoLive,
  isLoading = false,
}: GoLiveChecklistProps) {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Set<GoLiveCategory>>(
    new Set(CATEGORY_ORDER)
  );
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const toggleCategory = (category: GoLiveCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleItemToggle = async (item: GoLiveChecklistItem) => {
    if (updatingItems.has(item.id)) return;

    const newStatus: ChecklistItemStatus = 
      item.status === 'completed' ? 'not_started' : 'completed';

    setUpdatingItems((prev) => new Set(prev).add(item.id));
    try {
      await onUpdateItem(item.id, newStatus);
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    try {
      await onRunVerification();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApproveGoLive = async () => {
    setIsApproving(true);
    try {
      await onApproveGoLive();
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusIcon = (status: ChecklistItemStatus, required: boolean) => {
    if (status === 'completed') {
      return (
        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    if (status === 'in_progress') {
      return (
        <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      );
    }
    if (status === 'skipped') {
      return (
        <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </div>
      );
    }
    return (
      <div className={`flex-shrink-0 w-6 h-6 border-2 rounded-full ${
        required ? 'border-gray-300' : 'border-gray-200'
      }`} />
    );
  };

  const isGoLiveReady = progress.requiredItemsComplete === progress.requiredItemsTotal;
  const isAlreadyLive = !!progress.goLiveApprovedAt;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Go-Live Checklist</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete all required items before launching your agency
            </p>
          </div>
          {isAlreadyLive ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Live</span>
            </div>
          ) : (
            <button
              onClick={handleRunVerification}
              disabled={isVerifying || isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Verify Progress
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>{progress.overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                progress.overallProgress === 100 ? 'bg-green-500' : 'bg-green-400'
              }`}
              style={{ width: `${progress.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {progress.requiredItemsComplete}/{progress.requiredItemsTotal}
            </div>
            <div className="text-sm text-gray-600">Required Items</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {progress.optionalItemsComplete}/{progress.optionalItemsTotal}
            </div>
            <div className="text-sm text-gray-600">Optional Items</div>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      {CATEGORY_ORDER.map((category) => {
        const summary = categorySummary[category];
        const items = progress.goLiveChecklist.filter((i) => i.category === category);
        const isExpanded = expandedCategories.has(category);

        if (items.length === 0) return null;

        return (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  summary.percentage === 100 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {CATEGORY_ICONS[category]}
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{summary.label}</h3>
                  <p className="text-sm text-gray-500">
                    {summary.completed} of {summary.total} complete
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      summary.percentage === 100 ? 'bg-green-500' : 'bg-green-400'
                    }`}
                    style={{ width: `${summary.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-10">
                  {summary.percentage}%
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Category Items */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 p-4 border-b border-gray-100 last:border-0 ${
                      item.status === 'completed' ? 'bg-green-50/50' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleItemToggle(item)}
                      disabled={updatingItems.has(item.id) || isLoading || item.autoVerifiable}
                      className={`mt-0.5 ${
                        item.autoVerifiable ? 'cursor-default' : 'cursor-pointer hover:opacity-80'
                      }`}
                      title={item.autoVerifiable ? 'This item is verified automatically' : 'Click to toggle'}
                    >
                      {updatingItems.has(item.id) ? (
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        </div>
                      ) : (
                        getStatusIcon(item.status, item.required)
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          item.status === 'completed' ? 'text-gray-600 line-through' : 'text-gray-900'
                        }`}>
                          {item.title}
                        </span>
                        {item.required && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            Required
                          </span>
                        )}
                        {item.autoVerifiable && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            Auto-verified
                          </span>
                        )}
                        {item.stateSpecific && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            State-specific
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      {item.actionUrl && item.status !== 'completed' && (
                        <button
                          onClick={() => navigate(item.actionUrl!)}
                          className="mt-2 text-sm font-medium text-green-600 hover:text-green-700"
                        >
                          Complete this step &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Go Live Button */}
      {!isAlreadyLive && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Ready to Go Live?</h3>
              <p className="text-green-100 mt-1">
                {isGoLiveReady
                  ? 'All required items are complete. You can now launch your agency!'
                  : `Complete ${progress.requiredItemsTotal - progress.requiredItemsComplete} more required item(s) to go live.`}
              </p>
            </div>
            <button
              onClick={handleApproveGoLive}
              disabled={!isGoLiveReady || isApproving || isLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isGoLiveReady
                  ? 'bg-white text-green-700 hover:bg-green-50 shadow-lg'
                  : 'bg-green-500/50 text-green-200 cursor-not-allowed'
              }`}
            >
              {isApproving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Launching...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Launch Agency
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Already Live Message */}
      {isAlreadyLive && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Your Agency is Live!</h3>
              <p className="text-green-700 text-sm">
                You went live on {new Date(progress.goLiveApprovedAt!).toLocaleDateString()}.
                Continue completing optional items to optimize your agency.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoLiveChecklist;
