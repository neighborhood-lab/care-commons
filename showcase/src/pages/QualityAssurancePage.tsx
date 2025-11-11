import React from 'react';
import { Shield, CheckCircle, FileCheck, AlertTriangle } from 'lucide-react';

export const QualityAssurancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Quality Assurance & Audits</h1>
          <p className="mt-2 text-gray-600">Ensure compliance and maintain care quality standards</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Shield className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Compliance Score</p>
            <p className="text-2xl font-bold">98.5%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <FileCheck className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Audits This Month</p>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Passed</p>
            <p className="text-2xl font-bold">11</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mb-2" />
            <p className="text-sm text-gray-600">Action Items</p>
            <p className="text-2xl font-bold">3</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">QA Features</h3>
          <ul className="space-y-2 text-sm">
            <li>• Automated compliance checks for HIPAA, state regulations</li>
            <li>• Scheduled and ad-hoc audit workflows</li>
            <li>• Caregiver competency evaluations and certifications</li>
            <li>• Incident tracking and corrective action plans</li>
            <li>• Documentation review and approval workflows</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
