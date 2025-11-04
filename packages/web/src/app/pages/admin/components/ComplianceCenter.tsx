import React, { useState } from 'react';
import { Card } from '@/core/components';
import { Shield, FileText, Eye, Download, AlertTriangle, CheckCircle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'success' | 'failure';
}

interface HIPAAAccessLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  phi_accessed: string;
  clientId: string;
  clientName: string;
  purpose: string;
}

interface ComplianceReport {
  id: string;
  name: string;
  category: 'evv' | 'hipaa' | 'state' | 'billing';
  description: string;
  lastGenerated: Date;
  frequency: 'daily' | 'weekly' | 'monthly';
}

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    userId: 'user-1',
    userName: 'Admin User',
    action: 'UPDATE',
    resource: 'client/123',
    ipAddress: '192.168.1.10',
    status: 'success',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    userId: 'user-2',
    userName: 'Coordinator Smith',
    action: 'DELETE',
    resource: 'visit/456',
    ipAddress: '192.168.1.25',
    status: 'failure',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    userId: 'user-3',
    userName: 'Supervisor Johnson',
    action: 'APPROVE',
    resource: 'vmur/789',
    ipAddress: '192.168.1.50',
    status: 'success',
  },
];

const MOCK_HIPAA_LOGS: HIPAAAccessLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    userId: 'user-1',
    userName: 'Admin User',
    phi_accessed: 'Medical History',
    clientId: 'client-123',
    clientName: 'John Doe',
    purpose: 'Care Plan Update',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    userId: 'user-4',
    userName: 'Caregiver Wilson',
    phi_accessed: 'Medication List',
    clientId: 'client-456',
    clientName: 'Jane Smith',
    purpose: 'Visit Documentation',
  },
];

const COMPLIANCE_REPORTS: ComplianceReport[] = [
  {
    id: '1',
    name: 'Texas EVV Aggregator Submissions',
    category: 'evv',
    description: 'Daily submission status to HHAeXchange for Texas Medicaid',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 2),
    frequency: 'daily',
  },
  {
    id: '2',
    name: 'Florida MCO Compliance Report',
    category: 'evv',
    description: 'Weekly EVV compliance metrics for Florida MCOs',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24),
    frequency: 'weekly',
  },
  {
    id: '3',
    name: 'HIPAA Access Audit Report',
    category: 'hipaa',
    description: 'Monthly PHI access audit for HIPAA compliance',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    frequency: 'monthly',
  },
  {
    id: '4',
    name: 'State Regulatory Filings',
    category: 'state',
    description: 'Quarterly state regulatory compliance submissions',
    lastGenerated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    frequency: 'monthly',
  },
];

const CATEGORY_COLORS = {
  evv: 'bg-green-50 text-green-700 border-green-200',
  hipaa: 'bg-blue-50 text-blue-700 border-blue-200',
  state: 'bg-purple-50 text-purple-700 border-purple-200',
  billing: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const ComplianceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'hipaa' | 'reports'>('audit');

  const formatDuration = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compliance Center</h2>
          <p className="text-sm text-gray-600 mt-1">
            Audit trails, HIPAA access logs, and regulatory reports
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {[
            { id: 'audit' as const, label: 'Audit Trail' },
            { id: 'hipaa' as const, label: 'HIPAA Access Logs' },
            { id: 'reports' as const, label: 'Compliance Reports' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Audit Trail</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {MOCK_AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {log.resource}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* HIPAA Access Logs Tab */}
      {activeTab === 'hipaa' && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">HIPAA PHI Access Logs</h3>
              <p className="text-sm text-gray-600 mt-1">
                Protected Health Information access tracking for HIPAA compliance
              </p>
            </div>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PHI Accessed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {MOCK_HIPAA_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        {log.phi_accessed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Compliance Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPLIANCE_REPORTS.map((report) => (
            <Card key={report.id} padding="md" hover>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">{report.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${
                      CATEGORY_COLORS[report.category]
                    }`}
                  >
                    {report.category.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Last generated: {formatDuration(report.lastGenerated)}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {report.frequency}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
