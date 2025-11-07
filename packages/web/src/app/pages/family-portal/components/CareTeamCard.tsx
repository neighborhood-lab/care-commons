import React from 'react';
import { Card } from '@/core/components';
import { User, Phone, Mail } from 'lucide-react';

interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
}

interface CareTeamCardProps {
  members: CareTeamMember[];
}

export const CareTeamCard: React.FC<CareTeamCardProps> = ({ members }) => {
  if (!members || members.length === 0) {
    return (
      <Card padding="lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Care Team</h2>
        <p className="text-gray-600">No care team members assigned yet</p>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Care Team</h2>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-blue-200">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-600">{member.role}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                {member.phone && (
                  <a href={`tel:${member.phone}`} className="flex items-center space-x-1 hover:text-blue-600">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </a>
                )}
                {member.email && (
                  <a href={`mailto:${member.email}`} className="flex items-center space-x-1 hover:text-blue-600">
                    <Mail className="h-4 w-4" />
                    <span>{member.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
