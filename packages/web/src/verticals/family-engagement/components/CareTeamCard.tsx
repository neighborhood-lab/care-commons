/**
 * Care Team Card Component
 *
 * Display assigned caregivers
 */

import React from 'react';

interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  phone?: string;
}

interface CareTeamCardProps {
  careTeam: CareTeamMember[];
}

export const CareTeamCard: React.FC<CareTeamCardProps> = ({ careTeam }) => {
  if (careTeam.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Care Team</h2>
        <p className="text-sm text-gray-600">No care team members assigned yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Care Team</h2>
      <div className="space-y-4">
        {careTeam.map((member) => (
          <div key={member.id} className="flex items-center gap-4 rounded-lg bg-gray-50 p-3">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-200 text-lg font-semibold text-blue-700">
                {member.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
              <p className="text-xs text-gray-600">{member.role}</p>
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {member.phone}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
