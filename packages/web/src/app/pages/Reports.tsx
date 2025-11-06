import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/core/components';
import {
  Users,
  DollarSign,
  Activity,
  CheckCircle
} from 'lucide-react';

// Mock data for charts
const visitMetricsData = [
  { month: 'Jan', completed: 245, scheduled: 280, missed: 15 },
  { month: 'Feb', completed: 268, scheduled: 290, missed: 12 },
  { month: 'Mar', completed: 295, scheduled: 320, missed: 10 },
  { month: 'Apr', completed: 312, scheduled: 340, missed: 14 },
  { month: 'May', completed: 328, scheduled: 360, missed: 11 },
  { month: 'Jun', completed: 345, scheduled: 375, missed: 13 },
];

const revenueData = [
  { month: 'Jan', billed: 125000, paid: 110000, outstanding: 15000 },
  { month: 'Feb', billed: 135000, paid: 125000, outstanding: 10000 },
  { month: 'Mar', billed: 145000, paid: 138000, outstanding: 7000 },
  { month: 'Apr', billed: 152000, paid: 145000, outstanding: 7000 },
  { month: 'May', billed: 160000, paid: 155000, outstanding: 5000 },
  { month: 'Jun', billed: 168000, paid: 162000, outstanding: 6000 },
];

const clientDistribution = [
  { name: 'Active', value: 124, color: '#10b981' },
  { name: 'Pending', value: 18, color: '#f59e0b' },
  { name: 'On Hold', value: 8, color: '#6b7280' },
  { name: 'Discharged', value: 12, color: '#ef4444' },
];

const caregiverHoursData = [
  { type: 'Regular', hours: 1250, color: '#3b82f6' },
  { type: 'Overtime', hours: 180, color: '#f59e0b' },
  { type: 'PTO', hours: 85, color: '#10b981' },
  { type: 'Holiday', hours: 42, color: '#8b5cf6' },
];

const evvComplianceData = [
  { week: 'Week 1', compliant: 95, total: 100 },
  { week: 'Week 2', compliant: 98, total: 102 },
  { week: 'Week 3', compliant: 94, total: 98 },
  { week: 'Week 4', compliant: 97, total: 99 },
];

const performanceMetrics = [
  { metric: 'Visit Completion Rate', value: '94.2%', change: '+2.1%', icon: CheckCircle, color: 'text-green-600' },
  { metric: 'EVV Compliance', value: '96.8%', change: '+1.4%', icon: Activity, color: 'text-blue-600' },
  { metric: 'Active Caregivers', value: '58', change: '+4', icon: Users, color: 'text-purple-600' },
  { metric: 'Monthly Revenue', value: '$168K', change: '+5.0%', icon: DollarSign, color: 'text-emerald-600' },
];

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your care operations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setSelectedPeriod('quarter')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === 'quarter'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Quarter
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.metric} padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{metric.metric}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{metric.value}</p>
                  <p className={`mt-1 text-sm font-medium ${metric.color}`}>
                    {metric.change} from last period
                  </p>
                </div>
                <div className="ml-4">
                  <Icon className={`h-8 w-8 ${metric.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Visit Metrics Chart */}
      <Card>
        <CardHeader
          title="Visit Metrics"
          subtitle="Monthly visit completion trends"
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={visitMetricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" />
              <Bar dataKey="missed" fill="#ef4444" name="Missed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue and Client Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <Card>
          <CardHeader
            title="Revenue Trends"
            subtitle="Monthly billing and payment trends"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `$${value.toLocaleString()}`
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="billed"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  name="Billed"
                />
                <Area
                  type="monotone"
                  dataKey="paid"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  name="Paid"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Client Distribution */}
        <Card>
          <CardHeader
            title="Client Distribution"
            subtitle="Current client status breakdown"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clientDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) =>
                    `${entry.name}: ${entry.value} (${(entry.percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clientDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Caregiver Hours and EVV Compliance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Caregiver Hours */}
        <Card>
          <CardHeader
            title="Caregiver Hours Breakdown"
            subtitle="Current period hours by type"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={caregiverHoursData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, hours }) => `${type}: ${hours}h`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {caregiverHoursData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* EVV Compliance */}
        <Card>
          <CardHeader
            title="EVV Compliance Rate"
            subtitle="Weekly compliance tracking"
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evvComplianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[90, 105]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="compliant"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Compliant Visits"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Visits"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
