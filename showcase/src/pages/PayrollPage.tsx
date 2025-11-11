import React from 'react';
import { DollarSign, FileText, CheckCircle, Clock } from 'lucide-react';

export const PayrollPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Payroll Processing</h1>
          <p className="mt-2 text-gray-600">Accurate caregiver compensation from time tracking to payment</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">This Period</p>
            <p className="text-2xl font-bold">$45,230</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Timesheets</p>
            <p className="text-2xl font-bold">156</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold">142</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Clock className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold">14</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Features</h3>
          <ul className="space-y-2 text-sm">
            <li>• Automated calculation of wages, overtime, and deductions</li>
            <li>• State-specific tax withholding (all 50 states)</li>
            <li>• Direct deposit and check generation</li>
            <li>• Federal and state tax form generation (W-2, 1099, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
