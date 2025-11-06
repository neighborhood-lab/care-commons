import React, { useState } from 'react';
import { useAuditLogs } from '../hooks';
import { AuditLogTable } from '../components';
import type { SecurityAuditSearchFilters } from '../types';

/**
 * Audit Log List Page
 */
export const AuditLogList: React.FC = () => {
  const [filters, setFilters] = useState<SecurityAuditSearchFilters>({});
  const { data, isLoading, error } = useAuditLogs(filters);

  const handleDateFilter = (days: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    setFilters({ ...filters, startDate: startDate.toISOString() });
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">Error loading audit logs: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Security Audit Logs</h1>
        <p className="text-gray-600 mt-2">View security events and user activity</p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilters({})}
          className={`px-4 py-2 rounded ${
            !filters.startDate ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All Time
        </button>
        <button
          onClick={() => handleDateFilter(1)}
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Last 24 Hours
        </button>
        <button
          onClick={() => handleDateFilter(7)}
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Last 7 Days
        </button>
        <button
          onClick={() => handleDateFilter(30)}
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Last 30 Days
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilters({ ...filters, success: undefined })}
          className={`px-4 py-2 rounded ${
            filters.success === undefined ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          All Events
        </button>
        <button
          onClick={() => setFilters({ ...filters, success: true })}
          className={`px-4 py-2 rounded ${
            filters.success === true ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Successful
        </button>
        <button
          onClick={() => setFilters({ ...filters, success: false })}
          className={`px-4 py-2 rounded ${
            filters.success === false ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Failed
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading audit logs...</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <AuditLogTable logs={data?.items || []} />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setFilters({ ...filters, page })}
              className={`px-4 py-2 rounded ${
                page === (filters.page || 1) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
