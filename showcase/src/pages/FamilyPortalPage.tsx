import React from 'react';
import { Users, MessageCircle, Calendar, Heart } from 'lucide-react';

export const FamilyPortalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Family Engagement Portal</h1>
          <p className="mt-2 text-gray-600">Keep families connected and informed</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Active Families</p>
            <p className="text-2xl font-bold">128</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <MessageCircle className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm text-gray-600">Messages Today</p>
            <p className="text-2xl font-bold">45</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Calendar className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-sm text-gray-600">Upcoming Visits</p>
            <p className="text-2xl font-bold">87</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Heart className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-sm text-gray-600">Satisfaction</p>
            <p className="text-2xl font-bold">4.8/5</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Family Portal Features</h3>
          <ul className="space-y-2 text-sm">
            <li>• Real-time visit notifications and updates</li>
            <li>• Secure messaging with caregivers and coordinators</li>
            <li>• View care plan and daily task completion</li>
            <li>• Schedule requests and manage appointments</li>
            <li>• Access billing statements and payment history</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
