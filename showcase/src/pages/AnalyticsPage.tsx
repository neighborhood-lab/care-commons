import React from 'react';
import { TrendingUp, BarChart3, PieChart, Activity, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data for charts
const revenueData = [
  { month: 'Jan', revenue: 45000, visits: 320, clients: 280 },
  { month: 'Feb', revenue: 52000, visits: 380, clients: 295 },
  { month: 'Mar', revenue: 48000, visits: 350, clients: 290 },
  { month: 'Apr', revenue: 61000, visits: 420, clients: 310 },
  { month: 'May', revenue: 55000, visits: 390, clients: 305 },
  { month: 'Jun', revenue: 67000, visits: 450, clients: 325 },
  { month: 'Jul', revenue: 72000, visits: 480, clients: 338 },
  { month: 'Aug', revenue: 69000, visits: 460, clients: 335 },
  { month: 'Sep', revenue: 75000, visits: 490, clients: 340 },
  { month: 'Oct', revenue: 80000, visits: 520, clients: 345 },
  { month: 'Nov', revenue: 78000, visits: 510, clients: 342 },
  { month: 'Dec', revenue: 85000, visits: 540, clients: 350 },
];

const serviceTypeData = [
  { name: 'Personal Care', value: 35, color: '#3B82F6' },
  { name: 'Skilled Nursing', value: 25, color: '#8B5CF6' },
  { name: 'Companion Care', value: 20, color: '#10B981' },
  { name: 'Respite Care', value: 12, color: '#F59E0B' },
  { name: 'Homemaker', value: 8, color: '#EF4444' },
];

const caregiverUtilizationData = [
  { name: 'Sarah M.', utilization: 92, hours: 38 },
  { name: 'James K.', utilization: 88, hours: 35 },
  { name: 'Maria G.', utilization: 85, hours: 34 },
  { name: 'David L.', utilization: 82, hours: 33 },
  { name: 'Lisa P.', utilization: 79, hours: 32 },
  { name: 'Robert S.', utilization: 76, hours: 30 },
  { name: 'Anna T.', utilization: 74, hours: 29 },
  { name: 'Michael R.', utilization: 71, hours: 28 },
];

const weeklyVisitsData = [
  { day: 'Mon', completed: 85, scheduled: 90, cancelled: 5 },
  { day: 'Tue', completed: 92, scheduled: 95, cancelled: 3 },
  { day: 'Wed', completed: 88, scheduled: 92, cancelled: 4 },
  { day: 'Thu', completed: 78, scheduled: 85, cancelled: 7 },
  { day: 'Fri', completed: 95, scheduled: 98, cancelled: 3 },
  { day: 'Sat', completed: 45, scheduled: 48, cancelled: 3 },
  { day: 'Sun', completed: 32, scheduled: 35, cancelled: 3 },
];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-2 text-gray-600">Data-driven insights for better decision making</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Growth</p>
                <p className="text-2xl font-bold text-gray-900">+15.3%</p>
                <p className="text-xs text-green-600 mt-1">↑ 3.2% vs last month</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">342</p>
                <p className="text-xs text-green-600 mt-1">↑ 12 new this month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Visit Duration</p>
                <p className="text-2xl font-bold text-gray-900">2.4 hrs</p>
                <p className="text-xs text-gray-500 mt-1">Within target range</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilization Rate</p>
                <p className="text-2xl font-bold text-gray-900">87%</p>
                <p className="text-xs text-green-600 mt-1">↑ 2% vs last month</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue & Visits Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue & Visits Trend</h3>
              <p className="text-sm text-gray-500">12-month performance overview</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Visits</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `$${value.toLocaleString()}` : value,
                  name === 'revenue' ? 'Revenue' : 'Visits',
                ]}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="visits"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorVisits)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Two Column Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service Type Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Service Type Distribution</h3>
              <p className="text-sm text-gray-500">Breakdown by care category</p>
            </div>
            <div className="flex items-center">
              <ResponsiveContainer width="50%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {serviceTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {serviceTypeData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Visits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Visit Performance</h3>
              <p className="text-sm text-gray-500">Completed vs scheduled visits</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyVisitsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scheduled" name="Scheduled" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Caregiver Utilization */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Caregiver Utilization</h3>
              <p className="text-sm text-gray-500">Weekly hours and utilization rate by caregiver</p>
            </div>
            <div className="text-sm text-gray-500">
              Target: 80% utilization
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caregiverUtilizationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#6B7280" fontSize={12} tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey="name" type="category" width={80} stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [
                  name === 'utilization' ? `${value}%` : `${value} hrs`,
                  name === 'utilization' ? 'Utilization' : 'Hours',
                ]}
              />
              <Bar dataKey="utilization" name="Utilization" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              {/* Reference line for 80% target */}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Highlights */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-4">Analytics Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Real-time Dashboards</h4>
                <p className="text-sm text-gray-600">Customizable widgets with live data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Financial Tracking</h4>
                <p className="text-sm text-gray-600">Revenue forecasting and trends</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Workforce Analytics</h4>
                <p className="text-sm text-gray-600">Productivity and utilization metrics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Activity className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Client Insights</h4>
                <p className="text-sm text-gray-600">Satisfaction and retention analysis</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <PieChart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Service Mix</h4>
                <p className="text-sm text-gray-600">Breakdown by care type</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Compliance Reports</h4>
                <p className="text-sm text-gray-600">Audit readiness and EVV compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
