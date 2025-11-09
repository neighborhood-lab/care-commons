/**
 * Care Team Component
 *
 * Display the care team members assigned to a client
 */

import React from 'react';
import { Card } from '@/core/components';
import { Phone, Mail, User, Calendar } from 'lucide-react';

interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  availability?: string;
  specialties?: string[];
}

interface CareTeamProps {
  members?: CareTeamMember[];
  loading?: boolean;
}

const TeamMemberCard: React.FC<{ member: CareTeamMember }> = ({ member }) => {
  return (
    <Card padding="md" hover>
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <User className="h-8 w-8 text-primary-600" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">{member.name}</h4>
          <p className="text-sm text-primary-600 font-medium">{member.role}</p>

          {/* Specialties */}
          {member.specialties && member.specialties.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {member.specialties.map((specialty, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-3 space-y-1.5">
            {member.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400" />
                <a
                  href={`mailto:${member.email}`}
                  className="hover:text-primary-600 hover:underline"
                >
                  {member.email}
                </a>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" />
                <a
                  href={`tel:${member.phone}`}
                  className="hover:text-primary-600 hover:underline"
                >
                  {member.phone}
                </a>
              </div>
            )}
            {member.availability && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{member.availability}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export const CareTeam: React.FC<CareTeamProps> = ({ members, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-40 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-lg">No care team assigned yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Care team members will appear here once assigned
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Care Team ({members.length} {members.length === 1 ? 'member' : 'members'})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm text-gray-700">
          <strong>Need to reach someone?</strong> You can contact any member of the care team
          directly using the information above, or send a message through the family portal.
        </p>
      </div>
    </div>
  );
};
