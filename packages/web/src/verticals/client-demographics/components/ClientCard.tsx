import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { Card, StatusBadge } from '@/core/components';
import { formatDate, formatPhone } from '@/core/utils';
import type { Client } from '../types';

export interface ClientCardProps {
  client: Client;
  compact?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, compact = false }) => {
  const fullName = [client.firstName, client.middleName, client.lastName].filter(Boolean).join(' ');

  return (
    <Link to={`/clients/${client.id}`}>
      <Card padding="md" hover className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {client.preferredName || fullName}
            </h3>
            <p className="text-sm text-gray-600">{client.clientNumber}</p>
          </div>
          <StatusBadge status={client.status} />
        </div>

        {!compact && (
          <div className="mt-4 space-y-2">
            {client.primaryPhone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                {formatPhone(client.primaryPhone.number)}
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {client.email}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {client.primaryAddress.city}, {client.primaryAddress.state}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              DOB: {formatDate(client.dateOfBirth)}
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
};
