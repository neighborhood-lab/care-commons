/**
 * Incident List Page
 *
 * Display all incidents with filtering, searching, and quick actions.
 * Enables coordinators and admins to track compliance incidents.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

type IncidentType =
  | 'FALL'
  | 'MEDICATION_ERROR'
  | 'INJURY'
  | 'ABUSE_ALLEGATION'
  | 'NEGLECT_ALLEGATION'
  | 'EXPLOITATION_ALLEGATION'
  | 'EQUIPMENT_FAILURE'
  | 'EMERGENCY_HOSPITALIZATION'
  | 'DEATH'
  | 'ELOPEMENT'
  | 'BEHAVIORAL_INCIDENT'
  | 'INFECTION'
  | 'PRESSURE_INJURY'
  | 'CLIENT_REFUSAL'
  | 'OTHER';

type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type IncidentStatus = 'REPORTED' | 'UNDER_REVIEW' | 'INVESTIGATION_REQUIRED' | 'RESOLVED' | 'CLOSED';

interface Incident {
  id: string;
  clientId: string;
  clientName?: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  occurredAt: string;
  discoveredAt: string;
  location: string;
  description: string;
  reportedBy: string;
  reportedByName?: string;
  stateReportingRequired?: boolean;
  investigationRequired?: boolean;
  createdAt: string;
}

async function fetchIncidents(): Promise<Incident[]> {
  const response = await fetch('/api/incidents', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch incidents');
  return response.json();
}

export function IncidentListPage() {
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'ALL'>('ALL');

  const { data: incidents = [], isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: fetchIncidents,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredIncidents = incidents.filter((incident) => {
    if (filterStatus !== 'ALL' && incident.status !== filterStatus) return false;
    if (filterSeverity !== 'ALL' && incident.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'REPORTED':
        return 'bg-gray-100 text-gray-800';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'INVESTIGATION_REQUIRED':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: IncidentType) => {
    switch (type) {
      case 'FALL':
        return '🚨';
      case 'MEDICATION_ERROR':
        return '💊';
      case 'INJURY':
        return '🩹';
      case 'ABUSE_ALLEGATION':
      case 'NEGLECT_ALLEGATION':
      case 'EXPLOITATION_ALLEGATION':
        return '⚠️';
      case 'EMERGENCY_HOSPITALIZATION':
        return '🚑';
      case 'DEATH':
        return '💔';
      case 'INFECTION':
        return '🦠';
      default:
        return '📋';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load incidents. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incident Reports</h1>
          <p className="text-gray-600 mt-1">Track and manage compliance incidents</p>
        </div>
        <Link
          to="/incidents/new"
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          + Report Incident
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as IncidentStatus | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="INVESTIGATION_REQUIRED">Investigation Required</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as IncidentSeverity | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Incidents</p>
          <p className="text-2xl font-bold text-gray-900">{incidents.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Requiring Investigation</p>
          <p className="text-2xl font-bold text-yellow-600">
            {incidents.filter((i) => i.investigationRequired).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">State Reporting Required</p>
          <p className="text-2xl font-bold text-red-600">
            {incidents.filter((i) => i.stateReportingRequired).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Critical Severity</p>
          <p className="text-2xl font-bold text-red-600">
            {incidents.filter((i) => i.severity === 'CRITICAL').length}
          </p>
        </div>
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No incidents found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filterStatus !== 'ALL' || filterSeverity !== 'ALL'
              ? 'Try adjusting your filters'
              : 'No incidents have been reported'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="text-3xl">{getTypeIcon(incident.incidentType)}</div>

                    {/* Incident Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {incident.incidentType.replace(/_/g, ' ')}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                            incident.severity
                          )}`}
                        >
                          {incident.severity}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            incident.status
                          )}`}
                        >
                          {incident.status.replace(/_/g, ' ')}
                        </span>
                        {incident.stateReportingRequired && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            State Report Required
                          </span>
                        )}
                        {incident.investigationRequired && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Investigation Required
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{incident.description}</p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Client</p>
                          <p className="font-medium text-gray-900">{incident.clientName || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Location</p>
                          <p className="font-medium text-gray-900">{incident.location}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Occurred</p>
                          <p className="font-medium text-gray-900">
                            {new Date(incident.occurredAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Reported By</p>
                          <p className="font-medium text-gray-900">
                            {incident.reportedByName || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="ml-4">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
