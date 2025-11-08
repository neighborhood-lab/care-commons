import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components';
import { useShiftMatchingApi } from '../hooks';
import { ScoreBadge } from './ScoreBadge';
import type { ProposalSearchFilters, ProposalStatus, MatchQuality } from '../types';

interface MatchHistoryTableProps {
  filters?: ProposalSearchFilters;
  showFilters?: boolean;
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({
  filters: initialFilters,
  showFilters = true,
}) => {
  const api = useShiftMatchingApi();
  const [filters, setFilters] = useState<ProposalSearchFilters>(initialFilters || {});
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['match-history', filters, page],
    queryFn: () => api.getProposals({ ...filters }),
  });

  const handleExportCSV = () => {
    // Placeholder for CSV export functionality
    console.log('Export to CSV functionality would be implemented here');
    alert('CSV export would generate a downloadable file with all match history data');
  };

  const handleFilterChange = (key: keyof ProposalSearchFilters, value: string) => {
    setFilters({ ...filters, [key]: value || undefined });
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load match history" />;
  }

  const history = data?.items || [];
  const hasMore = data?.hasMore || false;

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Match History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {data?.total || 0} total record{data?.total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              leftIcon={<Filter className="h-4 w-4" />}
            >
              Filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.proposalStatus || ''}
                onChange={(e) => handleFilterChange('proposalStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="VIEWED">Viewed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUPERSEDED">Superseded</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Match Quality
              </label>
              <select
                value={filters.matchQuality || ''}
                onChange={(e) => handleFilterChange('matchQuality', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Qualities</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Caregiver
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Client
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Score
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Override
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No match history found
                  </td>
                </tr>
              ) : (
                history.map((match) => (
                  <HistoryRow key={match.id} match={match} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing page {page}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface HistoryRowProps {
  match: {
    id: string;
    proposedAt: string;
    openShiftId: string;
    caregiverName?: string;
    matchScore: number;
    matchQuality: MatchQuality;
    proposalStatus: ProposalStatus;
    shiftDetails?: {
      scheduledDate: string;
      startTime: string;
      endTime: string;
      clientName: string;
      serviceTypeName: string;
    };
    notes?: string;
  };
}

const HistoryRow: React.FC<HistoryRowProps> = ({ match }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status: ProposalStatus) => {
    const statusColors: Record<ProposalStatus, string> = {
      PENDING: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      VIEWED: 'bg-purple-100 text-purple-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
      SUPERSEDED: 'bg-gray-100 text-gray-600',
      WITHDRAWN: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status}
      </span>
    );
  };

  const isOverride = match.notes?.includes('Manual override') || match.notes?.includes('override');

  return (
    <>
      <tr className="hover:bg-gray-50 transition">
        <td className="px-6 py-4 text-sm text-gray-900">
          {new Date(match.proposedAt).toLocaleDateString()}
          <p className="text-xs text-gray-500">
            {new Date(match.proposedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {match.shiftDetails ? (
            <>
              <div className="font-medium">#{match.openShiftId.substring(0, 8)}</div>
              <div className="text-xs text-gray-500">
                {new Date(match.shiftDetails.scheduledDate).toLocaleDateString()}
                {' • '}
                {match.shiftDetails.startTime} - {match.shiftDetails.endTime}
              </div>
            </>
          ) : (
            `#${match.openShiftId.substring(0, 8)}`
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {match.caregiverName || 'Unknown'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {match.shiftDetails?.clientName || 'N/A'}
          {match.shiftDetails?.serviceTypeName && (
            <p className="text-xs text-gray-500">{match.shiftDetails.serviceTypeName}</p>
          )}
        </td>
        <td className="px-6 py-4 text-center">
          <div className="flex justify-center">
            <ScoreBadge score={match.matchScore} quality={match.matchQuality} size="sm" />
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          {getStatusBadge(match.proposalStatus)}
        </td>
        <td className="px-6 py-4 text-center">
          {isOverride ? (
            <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
              ⚠️ Override
            </span>
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          )}
        </td>
        <td className="px-6 py-4 text-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Details
          </button>
        </td>
      </tr>
      {showDetails && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-6 py-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Proposal Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Proposal ID:</span>{' '}
                  <span className="font-mono text-gray-900">{match.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Match Quality:</span>{' '}
                  <span className="font-medium text-gray-900">{match.matchQuality}</span>
                </div>
                <div>
                  <span className="text-gray-600">Match Score:</span>{' '}
                  <span className="font-medium text-gray-900">{match.matchScore}/100</span>
                </div>
                {match.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Notes:</span>{' '}
                    <span className="text-gray-900">{match.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
