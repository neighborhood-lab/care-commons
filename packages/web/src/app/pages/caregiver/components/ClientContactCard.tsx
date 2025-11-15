/**
 * Client contact card component with tap-to-call functionality
 *
 * Features:
 * - Large touch targets for mobile
 * - Tap-to-call phone numbers
 * - Tap-to-navigate address
 * - Emergency contact display
 */

import React from 'react';
import { useIsMobile } from '@/core/hooks';
import { Card } from '@/core/components';
import {
  Phone,
  MapPin,
  Navigation,
  AlertCircle,
  Mail,
  User,
} from 'lucide-react';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface ClientContactInfo {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  address: string;
  emergencyContacts?: EmergencyContact[];
}

interface ClientContactCardProps {
  contact: ClientContactInfo;
  showEmergencyContacts?: boolean;
  className?: string;
}

export const ClientContactCard: React.FC<ClientContactCardProps> = ({
  contact,
  showEmergencyContacts = false,
  className = '',
}) => {
  const isMobile = useIsMobile();

  const formatPhoneForTel = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:+1${formatPhoneForTel(phone)}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleNavigate = (address: string) => {
    window.open(
      `https://maps.google.com/?q=${encodeURIComponent(address)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <Card padding="md" className={className}>
      <div className="space-y-4">
        {/* Client Name */}
        <div>
          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-base'}`}>
            {contact.clientName}
          </h3>
        </div>

        {/* Contact Methods */}
        <div className="space-y-3">
          {/* Phone */}
          {contact.clientPhone && (
            <button
              onClick={() => handleCall(contact.clientPhone!)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors ${
                isMobile ? 'min-h-[52px]' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <Phone className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-primary-600`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-gray-600">Phone</p>
                <p className={`font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>
                  {contact.clientPhone}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs font-medium text-primary-600">TAP TO CALL</span>
              </div>
            </button>
          )}

          {/* Email */}
          {contact.clientEmail && (
            <button
              onClick={() => handleEmail(contact.clientEmail!)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors ${
                isMobile ? 'min-h-[52px]' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <Mail className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-primary-600`} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-gray-600">Email</p>
                <p className={`font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>
                  {contact.clientEmail}
                </p>
              </div>
            </button>
          )}

          {/* Address */}
          <button
            onClick={() => handleNavigate(contact.address)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors ${
              isMobile ? 'min-h-[52px]' : ''
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <MapPin className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-primary-600`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-gray-600">Address</p>
              <p className={`font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>
                {contact.address}
              </p>
            </div>
            <div className="flex-shrink-0 mt-0.5">
              <Navigation className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-400`} />
            </div>
          </button>
        </div>

        {/* Emergency Contacts */}
        {showEmergencyContacts && contact.emergencyContacts && contact.emergencyContacts.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-red-600`} />
              <h4 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>
                Emergency Contacts
              </h4>
            </div>
            <div className="space-y-2">
              {contact.emergencyContacts.map((emergency, index) => (
                <button
                  key={index}
                  onClick={() => handleCall(emergency.phone)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors ${
                    isMobile ? 'min-h-[52px]' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    <User className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-red-600`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`font-medium text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>
                      {emergency.name}
                    </p>
                    <p className="text-xs text-gray-600">{emergency.relationship}</p>
                    <p className={`font-medium text-red-700 mt-1 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      {emergency.phone}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Phone className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-red-600`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
