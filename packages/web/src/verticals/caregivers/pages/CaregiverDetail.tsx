/**
 * Caregiver Detail Page
 */

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Calendar,
  Award, Briefcase, Clock, AlertCircle
} from 'lucide-react';
import { Button, Card, CardHeader, CardContent, LoadingSpinner, ErrorMessage, Badge } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { formatDate, formatPhone } from '@/core/utils';
import { useCaregiver } from '../hooks';

export const CaregiverDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data: caregiver, isLoading, error, refetch } = useCaregiver(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !caregiver) {
    return (
      <ErrorMessage
        message={(error as Error)?.message || 'Failed to load caregiver'}
        retry={refetch}
      />
    );
  }

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/caregivers">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {caregiver.preferredName || fullName}
          </h1>
          <p className="text-gray-600 mt-1">
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
          {can('caregivers:write') && (
            <Link to={`/caregivers/${caregiver.id}/edit`}>
              <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader title="Personal Information" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{fullName}</dd>
                </div>
                {caregiver.preferredName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Preferred Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{caregiver.preferredName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(caregiver.dateOfBirth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caregiver.email}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader title="Contact Information" />
            <CardContent>
              <div className="space-y-4">
                {caregiver.primaryPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPhone(caregiver.primaryPhone.number)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {caregiver.primaryPhone.type}
                        {caregiver.primaryPhone.canReceiveSMS && ' • SMS Enabled'}
                      </p>
                    </div>
                  </div>
                )}
                {caregiver.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-900">{caregiver.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader title="Employment Information" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employee Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caregiver.employeeNumber}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caregiver.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caregiver.employmentType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employment Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caregiver.employmentStatus}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(caregiver.hireDate)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Credentials */}
          {caregiver.credentials && caregiver.credentials.length > 0 && (
            <Card>
              <CardHeader title="Credentials & Certifications" />
              <CardContent>
                <div className="space-y-3">
                  {caregiver.credentials.map((credential) => (
                    <div key={credential.id} className="flex items-start justify-between border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-start gap-3">
                        <Award className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{credential.name}</p>
                          <p className="text-sm text-gray-600">{credential.type}</p>
                          {credential.number && (
                            <p className="text-xs text-gray-500 mt-1">#{credential.number}</p>
                          )}
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>Issued: {formatDate(credential.issueDate)}</span>
                            {credential.expirationDate && (
                              <span>Expires: {formatDate(credential.expirationDate)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant={credential.status === 'ACTIVE' ? 'success' : credential.status === 'EXPIRED' ? 'danger' : 'warning'}>
                        {credential.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training */}
          {caregiver.training && caregiver.training.length > 0 && (
            <Card>
              <CardHeader title="Training & Education" />
              <CardContent>
                <div className="space-y-3">
                  {caregiver.training.map((training) => (
                    <div key={training.id} className="flex items-start justify-between border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                      <div>
                        <p className="font-medium text-gray-900">{training.name}</p>
                        <p className="text-sm text-gray-600">{training.category}</p>
                        <div className="flex gap-4 mt-1 text-xs text-gray-500">
                          <span>Completed: {formatDate(training.completionDate)}</span>
                          {training.expirationDate && (
                            <span>Expires: {formatDate(training.expirationDate)}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant={training.status === 'COMPLETED' ? 'success' : training.status === 'EXPIRED' ? 'danger' : 'warning'}>
                        {training.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Schedule
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Assign to Client
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Caregiver
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  View Time Records
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Alerts */}
          {caregiver.complianceStatus !== 'COMPLIANT' && (
            <Card>
              <CardHeader title="Compliance Alerts" />
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {caregiver.complianceStatus === 'EXPIRING_SOON' && 'Credentials Expiring Soon'}
                        {caregiver.complianceStatus === 'EXPIRED' && 'Expired Credentials'}
                        {caregiver.complianceStatus === 'NON_COMPLIANT' && 'Non-Compliant Status'}
                        {caregiver.complianceStatus === 'PENDING_VERIFICATION' && 'Pending Verification'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Review and update credentials to maintain compliance.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader title="Timeline" />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hired</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(caregiver.hireDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Record Created</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(caregiver.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
