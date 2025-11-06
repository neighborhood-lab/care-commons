/**
 * Caregiver Card Component
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Briefcase, Award } from 'lucide-react';
import { Card, Badge } from '@/core/components';
import { formatPhone } from '@/core/utils';
import type { Caregiver } from '../types';

export interface CaregiverCardProps {
  caregiver: Caregiver;
  compact?: boolean;
}

export const CaregiverCard: React.FC<CaregiverCardProps> = ({ caregiver, compact = false }) => {
  const fullName = [caregiver.firstName, caregiver.middleName, caregiver.lastName]
    .filter(Boolean)
    .join(' ');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'default';
      case 'SUSPENDED': return 'danger';
      case 'ON_LEAVE': return 'warning';
      default: return 'default';
    }
  };

  const getComplianceVariant = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'success';
      case 'EXPIRING_SOON': return 'warning';
      case 'EXPIRED': case 'NON_COMPLIANT': return 'danger';
      default: return 'default';
    }
  };

  return (
    <Link to={`/caregivers/${caregiver.id}`}>
      <Card padding="md" hover className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {caregiver.preferredName || fullName}
            </h3>
            <p className="text-sm text-gray-600">
              {caregiver.employeeNumber} • {caregiver.role}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusVariant(caregiver.status)}>
              {caregiver.status}
            </Badge>
            <Badge variant={getComplianceVariant(caregiver.complianceStatus)}>
              {caregiver.complianceStatus}
            </Badge>
          </div>
        </div>

        {!compact && (
          <div className="mt-4 space-y-2">
            {caregiver.primaryPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                {formatPhone(caregiver.primaryPhone.number)}
              </div>
            )}
            {caregiver.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {caregiver.email}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Briefcase className="h-4 w-4" />
              {caregiver.employmentType}
            </div>
            {caregiver.credentials && caregiver.credentials.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Award className="h-4 w-4" />
                {caregiver.credentials.length} credential{caregiver.credentials.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </Card>
    </Link>
  );
};
