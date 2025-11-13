/**
 * Create Incident Page
 *
 * Form for reporting new incidents with validation and submission.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

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

interface CreateIncidentInput {
  clientId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  occurredAt: string;
  location: string;
  description: string;
  immediateAction?: string;
}

async function createIncident(data: CreateIncidentInput) {
  const response = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create incident');
  return response.json();
}

export function CreateIncidentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get('clientId') || '';

  const [formData, setFormData] = useState<CreateIncidentInput>({
    clientId: prefilledClientId,
    incidentType: 'FALL',
    severity: 'MEDIUM',
    occurredAt: new Date().toISOString().slice(0, 16),
    location: '',
    description: '',
    immediateAction: '',
  });

  const createMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident reported successfully');
      navigate(`/incidents/${data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to report incident');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Report Incident</h1>
        <p className="text-gray-600 mt-1">Document a new incident for compliance tracking</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Client ID */}
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
            Client ID <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            required
            value={formData.clientId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter client ID"
          />
        </div>

        {/* Incident Type */}
        <div>
          <label htmlFor="incidentType" className="block text-sm font-medium text-gray-700 mb-2">
            Incident Type <span className="text-red-600">*</span>
          </label>
          <select
            id="incidentType"
            name="incidentType"
            required
            value={formData.incidentType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="FALL">Fall</option>
            <option value="MEDICATION_ERROR">Medication Error</option>
            <option value="INJURY">Injury</option>
            <option value="ABUSE_ALLEGATION">Abuse Allegation</option>
            <option value="NEGLECT_ALLEGATION">Neglect Allegation</option>
            <option value="EXPLOITATION_ALLEGATION">Exploitation Allegation</option>
            <option value="EQUIPMENT_FAILURE">Equipment Failure</option>
            <option value="EMERGENCY_HOSPITALIZATION">Emergency Hospitalization</option>
            <option value="DEATH">Death</option>
            <option value="ELOPEMENT">Elopement</option>
            <option value="BEHAVIORAL_INCIDENT">Behavioral Incident</option>
            <option value="INFECTION">Infection</option>
            <option value="PRESSURE_INJURY">Pressure Injury</option>
            <option value="CLIENT_REFUSAL">Client Refusal</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-2">
            Severity <span className="text-red-600">*</span>
          </label>
          <select
            id="severity"
            name="severity"
            required
            value={formData.severity}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        {/* Date/Time Occurred */}
        <div>
          <label htmlFor="occurredAt" className="block text-sm font-medium text-gray-700 mb-2">
            Date & Time Occurred <span className="text-red-600">*</span>
          </label>
          <input
            type="datetime-local"
            id="occurredAt"
            name="occurredAt"
            required
            value={formData.occurredAt}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Client's home, bathroom"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-600">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe what happened in detail..."
          />
          <p className="text-sm text-gray-500 mt-1">
            Include who, what, when, where, and how. Be specific and factual.
          </p>
        </div>

        {/* Immediate Action */}
        <div>
          <label htmlFor="immediateAction" className="block text-sm font-medium text-gray-700 mb-2">
            Immediate Action Taken
          </label>
          <textarea
            id="immediateAction"
            name="immediateAction"
            value={formData.immediateAction}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What was done immediately after the incident?"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Reporting...' : 'Report Incident'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
