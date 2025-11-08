import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/core/components';
import { api } from '@/services/api';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  photo_url?: string;
}

export const CareTeam: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: team, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['family', 'care-team', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/care-team`),
  });

  if (isLoading) {
    return <div className="text-gray-500">Loading care team...</div>;
  }

  if (!team || team.length === 0) {
    return <div className="text-gray-500">No care team members assigned</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Care Team</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="border border-gray-200 rounded-lg p-4 flex items-start space-x-4"
          >
            <Avatar name={member.name} src={member.photo_url} size="md" />
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{member.name}</h4>
              <p className="text-sm text-gray-600">{member.role}</p>
              {member.email && (
                <p className="text-sm text-gray-500 mt-2">{member.email}</p>
              )}
              {member.phone && (
                <p className="text-sm text-gray-500">{member.phone}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
