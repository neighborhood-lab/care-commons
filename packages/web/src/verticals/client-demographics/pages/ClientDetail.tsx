import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, User, Pill, AlertTriangle } from 'lucide-react';
import { Button, Card, CardHeader, CardContent, LoadingSpinner, ErrorMessage, StatusBadge } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { formatDate, formatPhone } from '@/core/utils';
import { useClient, useDeleteClient } from '../hooks';

export const ClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data: client, isLoading, error, refetch } = useClient(id);
  const deleteClient = useDeleteClient();

  const handleDelete = async () => {
    if (!client || !window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      await deleteClient.mutateAsync(client.id);
      navigate('/clients');
    } catch {
      // Error is handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <ErrorMessage
        message={(error as Error)?.message || 'Failed to load client'}
        retry={refetch}
      />
    );
  }

  const fullName = [client.firstName, client.middleName, client.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {client.preferredName || fullName}
          </h1>
          <p className="text-gray-600 mt-1">{client.clientNumber}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={client.status} />
          {can('clients:write') && (
            <>
              <Link to={`/clients/${client.id}/edit`}>
                <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
                  Edit
                </Button>
              </Link>
              <Button
                variant="danger"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                isLoading={deleteClient.isPending}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Personal Information" />
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{fullName}</dd>
                </div>
                {client.preferredName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Preferred Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.preferredName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(client.dateOfBirth)}
                  </dd>
                </div>
                {client.gender && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.gender}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Contact Information" />
            <CardContent>
              <div className="space-y-4">
                {client.primaryPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPhone(client.primaryPhone.number)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {client.primaryPhone.type}
                        {client.primaryPhone.canReceiveSMS && ' • SMS Enabled'}
                      </p>
                    </div>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <p className="text-sm text-gray-900">{client.email}</p>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">{client.primaryAddress.line1}</p>
                    {client.primaryAddress.line2 && (
                      <p className="text-sm text-gray-900">{client.primaryAddress.line2}</p>
                    )}
                    <p className="text-sm text-gray-900">
                      {client.primaryAddress.city}, {client.primaryAddress.state}{' '}
                      {client.primaryAddress.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {client.emergencyContacts.length > 0 && (
            <Card>
              <CardHeader title="Emergency Contacts" />
              <CardContent>
                <div className="space-y-4">
                  {client.emergencyContacts.map((contact) => (
                    <div key={contact.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.relationship}</p>
                        </div>
                        {contact.isPrimary && (
                          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          {formatPhone(contact.phone.number)}
                        </p>
                        {contact.email && (
                          <p className="text-sm text-gray-600">{contact.email}</p>
                        )}
                        {contact.canMakeHealthcareDecisions && (
                          <p className="text-xs text-gray-500">
                            Authorized for healthcare decisions
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <div className="space-y-2">
                <Link to={`/clients/${client.id}/medications`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Pill className="h-4 w-4 mr-2" />
                    View Medications
                  </Button>
                </Link>
                <Link to={`/incidents/new?clientId=${client.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Incident
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Visit
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Assign Caregiver
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Client
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Client Created</p>
                    <p className="text-xs text-gray-600">
                      {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>
                {client.intakeDate && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Intake Completed</p>
                      <p className="text-xs text-gray-600">
                        {formatDate(client.intakeDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
