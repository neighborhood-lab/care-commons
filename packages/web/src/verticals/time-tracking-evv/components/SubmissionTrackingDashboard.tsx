/**
 * EVV Aggregator Submission Tracking Dashboard
 *
 * Displays submission status and allows manual resubmission of failed submissions.
 */

import React, { useState, useEffect } from 'react';

interface StateAggregatorSubmission {
  id: string;
  state: string;
  evvRecordId: string;
  aggregatorId: string;
  aggregatorType: string;
  submittedAt: string;
  submissionStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PARTIAL' | 'RETRY';
  aggregatorConfirmationId?: string;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
}

interface SubmissionStats {
  totalPending: number;
  byState: Record<string, number>;
  byAggregator: Record<string, number>;
  byStatus: Record<string, number>;
  retryingSoon: number;
}

export const SubmissionTrackingDashboard: React.FC = () => {
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<StateAggregatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Fetch submission stats and pending submissions
  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, pendingRes] = await Promise.all([
        fetch('/api/evv/aggregator/submissions/stats'),
        fetch('/api/evv/aggregator/submissions/pending'),
      ]);

      if (statsRes.ok && pendingRes.ok) {
        const statsData = await statsRes.json();
        const pendingData = await pendingRes.json();

        setStats(statsData.data);
        setPendingSubmissions(pendingData.data.submissions);
      }
    } catch (error) {
      console.error('Error loading submission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (submissionId: string) => {
    setRetrying(submissionId);
    try {
      const response = await fetch(
        `/api/evv/aggregator/submissions/${submissionId}/retry`,
        { method: 'POST' }
      );

      if (response.ok) {
        // Reload data to reflect changes
        await loadData();
      } else {
        const error = await response.json();
        alert(`Retry failed: ${error.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error retrying submission:', error);
      alert('Failed to retry submission');
    } finally {
      setRetrying(null);
    }
  };

  const handleRetryAll = async () => {
    if (!confirm('Retry all pending submissions?')) return;

    setRetrying('all');
    try {
      const response = await fetch('/api/evv/aggregator/submissions/retry-all', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Retry process triggered for all pending submissions');
        await loadData();
      } else {
        alert('Failed to trigger retry process');
      }
    } catch (error) {
      console.error('Error triggering retry all:', error);
      alert('Failed to trigger retry process');
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded text-sm font-medium';
    switch (status) {
      case 'ACCEPTED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'RETRY':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          EVV Aggregator Submissions
        </h2>
        <button
          onClick={handleRetryAll}
          disabled={retrying === 'all' || pendingSubmissions.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {retrying === 'all' ? 'Retrying...' : 'Retry All Pending'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Pending</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalPending}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Retrying Soon</div>
            <div className="text-2xl font-bold text-orange-600">{stats.retryingSoon}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">By Status</div>
            <div className="text-sm text-gray-700 mt-1">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status}>
                  {status}: {count}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">By State</div>
            <div className="text-sm text-gray-700 mt-1">
              {Object.entries(stats.byState).map(([state, count]) => (
                <div key={state}>
                  {state}: {count}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Pending Submissions ({pendingSubmissions.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aggregator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No pending submissions
                  </td>
                </tr>
              ) : (
                pendingSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.aggregatorType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadgeClass(submission.submissionStatus)}>
                        {submission.submissionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.retryCount} / {submission.maxRetries}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 max-w-xs truncate">
                      {submission.errorMessage || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRetry(submission.id)}
                        disabled={
                          retrying === submission.id ||
                          submission.retryCount >= submission.maxRetries
                        }
                        className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {retrying === submission.id ? 'Retrying...' : 'Retry'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
