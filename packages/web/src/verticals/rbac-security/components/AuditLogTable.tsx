import React from 'react';
import type { SecurityAuditLog } from '../types';

interface AuditLogTableProps {
  logs: SecurityAuditLog[];
}

/**
 * Audit Log Table Component
 */
export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, string> = {
      LOGIN: 'bg-green-100 text-green-800',
      LOGOUT: 'bg-blue-100 text-blue-800',
      LOGIN_FAILED: 'bg-red-100 text-red-800',
      PASSWORD_RESET: 'bg-yellow-100 text-yellow-800',
      PASSWORD_CHANGED: 'bg-green-100 text-green-800',
      ROLE_ASSIGNED: 'bg-purple-100 text-purple-800',
      ROLE_REVOKED: 'bg-orange-100 text-orange-800',
      PERMISSION_GRANTED: 'bg-green-100 text-green-800',
      PERMISSION_REVOKED: 'bg-red-100 text-red-800',
      ACCESS_DENIED: 'bg-red-100 text-red-800',
      SUSPICIOUS_ACTIVITY: 'bg-red-200 text-red-900 font-bold',
      DATA_EXPORT: 'bg-yellow-100 text-yellow-800',
      SETTINGS_CHANGED: 'bg-blue-100 text-blue-800',
    };
    return badges[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Resource
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              IP Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatTimestamp(log.timestamp)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadge(log.action)}`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.resource.replace(/_/g, ' ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {log.success ? 'Success' : 'Failed'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {log.ipAddress || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {log.failureReason ? (
                  <span className="text-red-600">{log.failureReason}</span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <div className="text-center py-8 text-gray-500">No audit logs found</div>
      )}
    </div>
  );
};
