/**
 * Compliance Report Page
 *
 * Page for viewing compliance metrics, trend analysis, risk assessment,
 * and tracking action items across the organization
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Download
} from 'lucide-react';
import { Button, Card, LoadingSpinner, Badge } from '@/core/components';

interface ComplianceMetric {
  category: string;
  currentScore: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'needs-attention' | 'critical';
}

interface RiskArea {
  area: string;
  riskLevel: 'high' | 'medium' | 'low';
  openFindings: number;
  overdueActions: number;
}

interface ActionItem {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  status: string;
  priority: string;
}

export const ComplianceReportPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '1y'>('90d');
  const [isLoading] = useState(false);

  // Mock compliance metrics
  const complianceMetrics: ComplianceMetric[] = [
    {
      category: 'HIPAA Compliance',
      currentScore: 95,
      previousScore: 92,
      trend: 'up',
      status: 'excellent'
    },
    {
      category: 'EVV Compliance',
      currentScore: 98,
      previousScore: 97,
      trend: 'up',
      status: 'excellent'
    },
    {
      category: 'Documentation',
      currentScore: 87,
      previousScore: 85,
      trend: 'up',
      status: 'good'
    },
    {
      category: 'Training Compliance',
      currentScore: 72,
      previousScore: 78,
      trend: 'down',
      status: 'needs-attention'
    },
    {
      category: 'Infection Control',
      currentScore: 91,
      previousScore: 91,
      trend: 'stable',
      status: 'excellent'
    },
    {
      category: 'Medication Safety',
      currentScore: 65,
      previousScore: 70,
      trend: 'down',
      status: 'critical'
    }
  ];

  // Mock risk areas
  const riskAreas: RiskArea[] = [
    {
      area: 'Medication Administration',
      riskLevel: 'high',
      openFindings: 8,
      overdueActions: 3
    },
    {
      area: 'Staff Training',
      riskLevel: 'high',
      openFindings: 12,
      overdueActions: 5
    },
    {
      area: 'Documentation Quality',
      riskLevel: 'medium',
      openFindings: 6,
      overdueActions: 1
    },
    {
      area: 'Visit Compliance',
      riskLevel: 'low',
      openFindings: 2,
      overdueActions: 0
    }
  ];

  // Mock action items
  const actionItems: ActionItem[] = [
    {
      id: '1',
      title: 'Update medication administration protocols',
      category: 'Medication Safety',
      dueDate: '2024-02-15',
      status: 'IN_PROGRESS',
      priority: 'HIGH'
    },
    {
      id: '2',
      title: 'Complete HIPAA training for new hires',
      category: 'Training',
      dueDate: '2024-02-10',
      status: 'PLANNED',
      priority: 'CRITICAL'
    },
    {
      id: '3',
      title: 'Review and update care plan templates',
      category: 'Documentation',
      dueDate: '2024-02-20',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM'
    },
    {
      id: '4',
      title: 'Implement new infection control procedures',
      category: 'Infection Control',
      dueDate: '2024-02-25',
      status: 'PLANNED',
      priority: 'HIGH'
    },
    {
      id: '5',
      title: 'Conduct quarterly safety audit',
      category: 'Safety',
      dueDate: '2024-03-01',
      status: 'PLANNED',
      priority: 'MEDIUM'
    }
  ];

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50';
      case 'good':
        return 'text-blue-600 bg-blue-50';
      case 'needs-attention':
        return 'text-orange-600 bg-orange-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge variant="error">Critical</Badge>;
      case 'HIGH':
        return <Badge variant="warning">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="info">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const overallComplianceScore = Math.round(
    complianceMetrics.reduce((sum, metric) => sum + metric.currentScore, 0) /
      complianceMetrics.length
  );

  const totalOpenActions = actionItems.filter((item) => item.status !== 'COMPLETED').length;
  const overdueActions = actionItems.filter((item) => {
    const dueDate = new Date(item.dueDate);
    return dueDate < new Date() && item.status !== 'COMPLETED';
  }).length;

  const handleExportReport = () => {
    // TODO: Implement export functionality
    alert('Export functionality to be implemented');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track compliance metrics, trends, and action items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '30d' | '90d' | '1y')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Overall Compliance</p>
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{overallComplianceScore}%</p>
            <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span>+3% from last period</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Open Actions</p>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalOpenActions}</p>
            <p className="text-sm text-gray-600 mt-2">
              {overdueActions} overdue
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">High Risk Areas</p>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {riskAreas.filter((area) => area.riskLevel === 'high').length}
            </p>
            <p className="text-sm text-gray-600 mt-2">Require attention</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Audits Completed</p>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">24</p>
            <p className="text-sm text-gray-600 mt-2">This quarter</p>
          </div>
        </Card>
      </div>

      {/* Compliance Metrics by Category */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Metrics by Category
          </h2>
          <div className="space-y-4">
            {complianceMetrics.map((metric) => (
              <div key={metric.category} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900">{metric.category}</h3>
                    {metric.trend === 'up' && (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                    {metric.trend === 'down' && (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.currentScore}%
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        metric.status
                      )}`}
                    >
                      {metric.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.status === 'excellent' || metric.status === 'good'
                          ? 'bg-green-600'
                          : metric.status === 'needs-attention'
                          ? 'bg-orange-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${metric.currentScore}%` }}
                    />
                  </div>
                  <span className="ml-4 text-gray-600 whitespace-nowrap">
                    {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '' : ''}
                    {Math.abs(metric.currentScore - metric.previousScore)}% vs previous
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Risk Assessment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskAreas.map((area) => (
              <div
                key={area.area}
                className={`p-4 rounded-lg border-2 ${getRiskColor(area.riskLevel)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{area.area}</h3>
                  <Badge
                    variant={
                      area.riskLevel === 'high'
                        ? 'error'
                        : area.riskLevel === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {area.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Open Findings</p>
                    <p className="text-xl font-bold text-gray-900">{area.openFindings}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Overdue Actions</p>
                    <p className="text-xl font-bold text-gray-900">{area.overdueActions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Action Items Tracking */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Open Action Items ({totalOpenActions})
          </h2>
          <div className="space-y-3">
            {actionItems.map((item) => {
              const dueDate = new Date(item.dueDate);
              const isOverdue = dueDate < new Date() && item.status !== 'COMPLETED';
              const daysUntilDue = Math.ceil(
                (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      {getPriorityBadge(item.priority)}
                      {item.status === 'IN_PROGRESS' && (
                        <Badge variant="info">In Progress</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{item.category}</span>
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {isOverdue
                          ? 'Overdue'
                          : daysUntilDue === 0
                          ? 'Due today'
                          : daysUntilDue === 1
                          ? 'Due tomorrow'
                          : `Due in ${daysUntilDue} days`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trends</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Trend chart visualization would be displayed here</p>
              <p className="text-sm mt-1">Integration with charting library required</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
