import React from 'react';

interface Client {
  first_name: string;
  last_name: string;
  care_start_date: string;
  care_coordinator?: string;
  primary_diagnosis?: string;
  emergency_contact?: string;
}

interface ClientOverviewProps {
  client: Client;
}

export const ClientOverview: React.FC<ClientOverviewProps> = ({ client }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Care Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Care Information</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Care Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(client.care_start_date).toLocaleDateString()}
              </dd>
            </div>
            {client.care_coordinator && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Care Coordinator</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.care_coordinator}</dd>
              </div>
            )}
            {client.primary_diagnosis && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Primary Diagnosis</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.primary_diagnosis}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Emergency Contact */}
        {client.emergency_contact && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            <p className="text-sm text-gray-900">{client.emergency_contact}</p>
          </div>
        )}
      </div>
    </div>
  );
};
