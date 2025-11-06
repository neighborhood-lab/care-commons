import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Users,
  Calendar,
  ClipboardList,
  Clock,
  DollarSign,
  Wallet,
  UserCheck,
  BarChart3,
  Heart,
  FileCheck,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { usePermissions } from '@/core/hooks';

export interface Vertical {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  implemented: boolean;
  permission?: string;
}

const verticals: Vertical[] = [
  {
    id: 'client-demographics',
    name: 'Client Demographics',
    description: 'Manage client profiles, medical history, and contact information',
    icon: Users,
    path: '/clients',
    implemented: true,
    permission: 'clients:read',
  },
  {
    id: 'caregivers',
    name: 'Caregiver Management',
    description: 'Manage caregiver profiles, certifications, and availability',
    icon: UserCheck,
    path: '/caregivers',
    implemented: true,
    permission: 'caregivers:read',
  },
  {
    id: 'scheduling',
    name: 'Scheduling & Visits',
    description: 'Schedule visits, manage calendars, and coordinate care delivery',
    icon: Calendar,
    path: '/scheduling',
    implemented: true,
    permission: 'visits:read',
  },
  {
    id: 'care-plans',
    name: 'Care Plans',
    description: 'Create and manage personalized care plans and goals',
    icon: ClipboardList,
    path: '/care-plans',
    implemented: true,
    permission: 'care_plans:read',
  },
  {
    id: 'time-tracking',
    name: 'Time Tracking & EVV',
    description: 'Electronic visit verification and caregiver time tracking',
    icon: Clock,
    path: '/time-tracking',
    implemented: true,
    permission: 'evv:read',
  },
  {
    id: 'billing',
    name: 'Billing & Invoicing',
    description: 'Generate invoices, process payments, and manage billing cycles',
    icon: DollarSign,
    path: '/billing',
    implemented: true,
    permission: 'billing:read',
  },
  {
    id: 'payroll',
    name: 'Payroll Processing',
    description: 'Process caregiver payroll, manage rates, and generate pay runs',
    icon: Wallet,
    path: '/payroll',
    implemented: true,
    permission: 'payroll:read',
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Generate insights, reports, and analytics on care delivery',
    icon: BarChart3,
    implemented: false,
  },
  {
    id: 'family-engagement',
    name: 'Family Engagement',
    description: 'Facilitate communication and collaboration with family members',
    icon: Heart,
    implemented: false,
  },
  {
    id: 'quality-assurance',
    name: 'Quality Assurance',
    description: 'Monitor care quality, conduct audits, and ensure compliance',
    icon: FileCheck,
    implemented: false,
  },
  {
    id: 'hr-onboarding',
    name: 'HR & Onboarding',
    description: 'Streamline hiring, onboarding, and human resources management',
    icon: Building2,
    implemented: false,
  },
];

interface ComingSoonModalProps {
  vertical: Vertical;
  onClose: () => void;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  vertical,
  onClose,
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <vertical.icon className="h-8 w-8 text-primary-600" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {vertical.name}
          </h3>

          <p className="text-gray-600 mb-4">{vertical.description}</p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 w-full">
            <p className="text-sm text-yellow-800 font-medium">
              🚀 Coming Soon
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              This vertical is currently under development and will be available
              in a future release.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const VerticalsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVertical, setSelectedVertical] = useState<Vertical | null>(
    null,
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { can } = usePermissions();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleVerticalClick = (vertical: Vertical) => {
    if (!vertical.implemented) {
      setSelectedVertical(vertical);
      setIsOpen(false);
    } else {
      setIsOpen(false);
    }
  };

  const visibleVerticals = verticals.filter((vertical) => {
    if (!vertical.permission) return true;
    return can(vertical.permission);
  });

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Verticals</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Care Commons Verticals
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {visibleVerticals.map((vertical) => (
                <div key={vertical.id}>
                  {vertical.implemented && vertical.path ? (
                    <Link
                      to={vertical.path}
                      onClick={() => handleVerticalClick(vertical)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <vertical.icon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {vertical.name}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {vertical.description}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleVerticalClick(vertical)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <vertical.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-700">
                            {vertical.name}
                          </p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Coming Soon
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {vertical.description}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedVertical && (
        <ComingSoonModal
          vertical={selectedVertical}
          onClose={() => setSelectedVertical(null)}
        />
      )}
    </>
  );
};
