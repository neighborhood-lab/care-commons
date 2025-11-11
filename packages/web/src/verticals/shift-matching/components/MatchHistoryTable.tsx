/**
 * Match History Table
 * 
 * Audit trail and history of all matching decisions:
 * - Filterable by date, caregiver, client, outcome
 * - Sortable columns
 * - Export to CSV
 * - View match details
 */

import React, { useState } from 'react';
import { Search, Download, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, X, Clock } from 'lucide-react';
import { Button } from '@/core/components';

interface MatchHistoryRecord {
  id: string;
  date: Date;
  shiftId: string;
  clientName: string;
  caregiverName: string;
  matchScore: number;
  outcome: 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'SUPERSEDED' | 'MANUAL_OVERRIDE';
  overrideReason?: string;
  responseTimeMinutes?: number;
}

interface MatchHistoryTableProps {
  records?: MatchHistoryRecord[];
  isLoading?: boolean;
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({
  records: initialRecords,
}) => {
  // Mock data for demonstration
  const mockRecords: MatchHistoryRecord[] = initialRecords || [
    {
      id: '1',
      date: new Date('2025-01-10T14:30:00'),
      shiftId: 'SH-001',
      clientName: 'Mary Johnson',
      caregiverName: 'Sarah Martinez',
      matchScore: 94,
      outcome: 'ACCEPTED',
      responseTimeMinutes: 15,
    },
    {
      id: '2',
      date: new Date('2025-01-10T13:15:00'),
      shiftId: 'SH-002',
      clientName: 'Robert Chen',
      caregiverName: 'Jennifer Lee',
      matchScore: 88,
      outcome: 'REJECTED',
      responseTimeMinutes: 45,
    },
    {
      id: '3',
      date: new Date('2025-01-10T12:00:00'),
      shiftId: 'SH-003',
      clientName: 'Patricia Davis',
      caregiverName: 'Emily Rodriguez',
      matchScore: 76,
      outcome: 'MANUAL_OVERRIDE',
      overrideReason: 'Client specifically requested this caregiver due to previous excellent experience',
      responseTimeMinutes: undefined,
    },
    {
      id: '4',
      date: new Date('2025-01-10T10:45:00'),
      shiftId: 'SH-004',
      clientName: 'James Wilson',
      caregiverName: 'Michael Taylor',
      matchScore: 82,
      outcome: 'EXPIRED',
      responseTimeMinutes: undefined,
    },
    {
      id: '5',
      date: new Date('2025-01-09T16:20:00'),
      shiftId: 'SH-005',
      clientName: 'Linda Brown',
      caregiverName: 'David Anderson',
      matchScore: 91,
      outcome: 'ACCEPTED',
      responseTimeMinutes: 8,
    },
  ];

  const [records] = useState(mockRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'date' | 'matchScore'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = (field: 'date' | 'matchScore') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedRecords = records
    .filter(record => {
      const matchesSearch = searchQuery === '' || 
        record.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.caregiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.shiftId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesOutcome = outcomeFilter === 'ALL' || record.outcome === outcomeFilter;

      return matchesSearch && matchesOutcome;
    })
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (sortField === 'date') {
        return direction * (a.date.getTime() - b.date.getTime());
      } else {
        return direction * (a.matchScore - b.matchScore);
      }
    });

  const handleExport = () => {
    // Export to CSV
    const csv = [
      ['Date', 'Shift ID', 'Client', 'Caregiver', 'Match Score', 'Outcome', 'Response Time (min)', 'Override Reason'].join(','),
      ...filteredAndSortedRecords.map(r => 
        [
          r.date.toISOString(),
          r.shiftId,
          r.clientName,
          r.caregiverName,
          r.matchScore,
          r.outcome,
          r.responseTimeMinutes || 'N/A',
          r.overrideReason || ''
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'ACCEPTED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <X className="h-5 w-5 text-red-600" />;
      case 'EXPIRED':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'MANUAL_OVERRIDE':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const styles = {
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      MANUAL_OVERRIDE: 'bg-yellow-100 text-yellow-800',
      SUPERSEDED: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[outcome as keyof typeof styles]}`}>
        {outcome.replace(/_/g, ' ')}
      </span>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Match History</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedRecords.length} records
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, caregiver, or shift ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Outcome filter */}
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">All Outcomes</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
          <option value="MANUAL_OVERRIDE">Manual Override</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Date
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caregiver
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('matchScore')}
                >
                  <div className="flex items-center gap-2">
                    Score
                    {sortField === 'matchScore' && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outcome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedRecords.map((record) => (
                <React.Fragment key={record.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.date.toLocaleDateString()}
                      <div className="text-xs text-gray-500">
                        {record.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {record.shiftId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.caregiverName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadge(record.matchScore)}`}>
                        {record.matchScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getOutcomeIcon(record.outcome)}
                        {getOutcomeBadge(record.outcome)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.responseTimeMinutes !== undefined
                        ? `${record.responseTimeMinutes} min`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {expandedRow === record.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === record.id && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Shift ID:</span>
                              <span className="ml-2 text-gray-900">{record.shiftId}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Match Score:</span>
                              <span className="ml-2 text-gray-900">{record.matchScore}/100</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Date/Time:</span>
                              <span className="ml-2 text-gray-900">{record.date.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Response Time:</span>
                              <span className="ml-2 text-gray-900">
                                {record.responseTimeMinutes !== undefined ? `${record.responseTimeMinutes} minutes` : 'N/A'}
                              </span>
                            </div>
                          </div>
                          {record.overrideReason && (
                            <div className="pt-3 border-t border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Override Reason:</h4>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                {record.overrideReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedRecords.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No matching records found
          </div>
        )}
      </div>
    </div>
  );
};
