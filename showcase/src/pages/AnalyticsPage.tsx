import React from 'react';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="mt-2 text-gray-600">Data-driven insights for better decision making</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Revenue Growth</p>
            <p className="text-2xl font-bold">+15.3%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Activity className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Active Clients</p>
            <p className="text-2xl font-bold">342</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600">Avg Visit Duration</p>
            <p className="text-2xl font-bold">2.4 hrs</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <PieChart className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-sm text-gray-600">Utilization</p>
            <p className="text-2xl font-bold">87%</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Analytics Features</h3>
          <ul className="space-y-2 text-sm">
            <li>• Real-time dashboards with customizable widgets</li>
            <li>• Financial performance tracking and forecasting</li>
            <li>• Caregiver productivity and utilization metrics</li>
            <li>• Client satisfaction and retention analysis</li>
            <li>• Compliance and audit readiness reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
