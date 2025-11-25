import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle, 
  FileCheck, 
  AlertTriangle,
  User,
  ChevronRight,
  XCircle,
  AlertCircle,
  Calendar,
  ClipboardCheck,
  Award,
  TrendingUp,
  Eye,
  FileText,
} from 'lucide-react';

// Mock data
const audits = [
  {
    id: 1,
    type: 'EVV Compliance',
    date: 'Nov 4, 2025',
    auditor: 'State Inspector',
    status: 'passed',
    score: 98,
    findings: 0,
  },
  {
    id: 2,
    type: 'Documentation Review',
    date: 'Nov 1, 2025',
    auditor: 'Internal QA',
    status: 'passed',
    score: 95,
    findings: 2,
  },
  {
    id: 3,
    type: 'HIPAA Compliance',
    date: 'Oct 28, 2025',
    auditor: 'Compliance Officer',
    status: 'passed',
    score: 100,
    findings: 0,
  },
  {
    id: 4,
    type: 'Caregiver Competency',
    date: 'Oct 25, 2025',
    auditor: 'Clinical Supervisor',
    status: 'action_required',
    score: 88,
    findings: 3,
  },
];

const actionItems = [
  {
    id: 1,
    title: 'Update medication administration training for 3 caregivers',
    audit: 'Caregiver Competency',
    priority: 'high',
    dueDate: 'Nov 10, 2025',
    assignee: 'Clinical Supervisor',
    status: 'in_progress',
  },
  {
    id: 2,
    title: 'Complete missing visit notes for Oct 28-30',
    audit: 'Documentation Review',
    priority: 'medium',
    dueDate: 'Nov 8, 2025',
    assignee: 'Care Coordinator',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Verify emergency contact info for 5 clients',
    audit: 'Documentation Review',
    priority: 'low',
    dueDate: 'Nov 15, 2025',
    assignee: 'Admin Staff',
    status: 'pending',
  },
];

const complianceChecks = [
  { id: 1, category: 'EVV Records', passed: 245, total: 250, percentage: 98 },
  { id: 2, category: 'Visit Documentation', passed: 238, total: 250, percentage: 95 },
  { id: 3, category: 'Caregiver Credentials', passed: 48, total: 48, percentage: 100 },
  { id: 4, category: 'Client Consents', passed: 340, total: 342, percentage: 99 },
  { id: 5, category: 'Care Plan Reviews', passed: 85, total: 90, percentage: 94 },
];

const certifications = [
  { id: 1, caregiver: 'Sarah M.', cert: 'CPR/First Aid', status: 'valid', expires: 'Mar 2026' },
  { id: 2, caregiver: 'James K.', cert: 'RN License', status: 'valid', expires: 'Dec 2025' },
  { id: 3, caregiver: 'Maria G.', cert: 'CPR/First Aid', status: 'expiring', expires: 'Nov 2025' },
  { id: 4, caregiver: 'David L.', cert: 'Medication Admin', status: 'valid', expires: 'Jun 2026' },
  { id: 5, caregiver: 'Lisa P.', cert: 'Background Check', status: 'expired', expires: 'Oct 2025' },
];

export const QualityAssurancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'audits' | 'actions' | 'certifications'>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quality Assurance & Audits</h1>
              <p className="mt-2 text-gray-600">Ensure compliance and maintain care quality standards</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Schedule Audit
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-4 border-b border-gray-200 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'audits', label: 'Audits', icon: ClipboardCheck },
              { id: 'actions', label: 'Action Items', icon: AlertCircle },
              { id: 'certifications', label: 'Certifications', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'actions' && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">3</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-gray-900">98.5%</p>
                <p className="text-xs text-green-600 mt-1">+0.5% from last month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Audits This Month</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500 mt-1">4 scheduled this week</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Passed Audits</p>
                <p className="text-2xl font-bold text-gray-900">11</p>
                <p className="text-xs text-green-600 mt-1">92% pass rate</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Action Items</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-yellow-600 mt-1">1 high priority</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Compliance Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Breakdown</h3>
                <div className="space-y-4">
                  {complianceChecks.map((check) => (
                    <div key={check.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{check.category}</span>
                        <span className="text-sm text-gray-500">{check.passed}/{check.total} ({check.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            check.percentage >= 98 ? 'bg-green-500' :
                            check.percentage >= 95 ? 'bg-blue-500' :
                            check.percentage >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${check.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Audits */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Audits</h3>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View all <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  {audits.slice(0, 3).map((audit) => (
                    <div key={audit.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        audit.status === 'passed' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {audit.status === 'passed' 
                          ? <CheckCircle className="w-5 h-5 text-green-600" />
                          : <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{audit.type}</p>
                        <p className="text-sm text-gray-500">{audit.auditor} - {audit.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{audit.score}%</p>
                        <p className="text-xs text-gray-500">{audit.findings} findings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Action Items Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Open Action Items</h3>
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          item.priority === 'high' ? 'bg-red-500' :
                          item.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">Due: {item.dueDate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all action items
                </button>
              </div>

              {/* Expiring Certifications */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Certification Alerts</h3>
                <div className="space-y-3">
                  {certifications.filter(c => c.status !== 'valid').map((cert) => (
                    <div key={cert.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        cert.status === 'expired' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {cert.status === 'expired' 
                          ? <XCircle className="w-4 h-4 text-red-600" />
                          : <AlertCircle className="w-4 h-4 text-yellow-600" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{cert.caregiver}</p>
                        <p className="text-xs text-gray-500">{cert.cert} - {cert.expires}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">All Audits</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Auditor</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Score</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Findings</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {audits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{audit.type}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{audit.date}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{audit.auditor}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-sm font-semibold ${
                          audit.score >= 95 ? 'text-green-600' :
                          audit.score >= 90 ? 'text-yellow-600' : 'text-red-600'
                        }`}>{audit.score}%</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{audit.findings}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          audit.status === 'passed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {audit.status === 'passed' ? 'Passed' : 'Action Required'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {actionItems.map((item) => (
                <div key={item.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                      item.priority === 'high' ? 'bg-red-500' :
                      item.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'in_progress' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">From: {item.audit}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {item.assignee}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {item.dueDate}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">Caregiver Certifications</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Caregiver</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Certification</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Expires</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {certifications.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                            {cert.caregiver.split(' ').map(n => n[0]).join('')}
                          </div>
                          <p className="text-sm font-medium text-gray-900">{cert.caregiver}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{cert.cert}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cert.status === 'valid' ? 'bg-green-100 text-green-700' :
                          cert.status === 'expiring' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {cert.status === 'valid' ? 'Valid' : 
                           cert.status === 'expiring' ? 'Expiring Soon' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{cert.expires}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-100">
          <h3 className="font-semibold text-gray-900 mb-4">QA Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Automated Compliance</h4>
                <p className="text-sm text-gray-600">Real-time HIPAA and state regulation checks</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Audit Workflows</h4>
                <p className="text-sm text-gray-600">Scheduled and ad-hoc audit management</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Credential Tracking</h4>
                <p className="text-sm text-gray-600">Automated expiration alerts and renewals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Incident Tracking</h4>
                <p className="text-sm text-gray-600">Corrective action plans and follow-ups</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Documentation Review</h4>
                <p className="text-sm text-gray-600">Approval workflows and version control</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Compliance Trends</h4>
                <p className="text-sm text-gray-600">Historical analysis and improvement tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
