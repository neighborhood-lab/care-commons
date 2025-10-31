import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button, LoadingSpinner, ErrorMessage } from '@/core/components';
import { usePermissions } from '@/core/hooks';
import { useOpenShift, useMatchCandidates, useMatchShift, useCreateProposal } from '../hooks';
import { MatchCandidateCard } from '../components';
import { getShiftPriorityColor, getMatchingStatusColor, formatDuration } from '../utils';

export const OpenShiftDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: shift, isLoading, error } = useOpenShift(id);
  const { data: candidatesData } = useMatchCandidates(id);
  const matchShift = useMatchShift();
  const createProposal = useCreateProposal();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !shift) {
    return (
      <ErrorMessage
        message="Failed to load open shift"
        retry={() => navigate('/shift-matching')}
      />
    );
  }

  const candidates = candidatesData?.items || [];
  const priorityColor = getShiftPriorityColor(shift.priority);
  const statusColor = getMatchingStatusColor(shift.matchingStatus);

  const handleMatchShift = () => {
    matchShift.mutate({ openShiftId: shift.id, autoPropose: false });
  };

  const handleCreateProposal = (caregiverId: string) => {
    createProposal.mutate({
      openShiftId: shift.id,
      caregiverId,
      sendNotification: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/shift-matching')}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Open Shift Details</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColor}`}>
                {shift.priority}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {shift.matchingStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {can('scheduling:write') && shift.matchingStatus !== 'ASSIGNED' && (
          <Button
            onClick={handleMatchShift}
            leftIcon={<Search className="h-4 w-4" />}
            disabled={matchShift.isPending}
          >
            Find Matches
          </Button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Client</h3>
            <p className="text-lg font-semibold">{shift.clientName || shift.clientId}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Service Type</h3>
            <p className="text-lg">{shift.serviceTypeName}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h3>
            <p className="text-lg">{new Date(shift.scheduledDate).toLocaleDateString()}</p>
            <p className="text-sm text-gray-600">
              {shift.startTime} - {shift.endTime} ({formatDuration(shift.duration)})
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Location</h3>
            <p className="text-lg">{shift.address.line1}</p>
            <p className="text-sm text-gray-600">
              {shift.address.city}, {shift.address.state} {shift.address.postalCode}
            </p>
          </div>

          {shift.requiredSkills && shift.requiredSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {shift.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {shift.requiredCertifications && shift.requiredCertifications.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Required Certifications</h3>
              <div className="flex flex-wrap gap-2">
                {shift.requiredCertifications.map((cert, idx) => (
                  <span key={idx} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {shift.clientInstructions && (
          <div className="pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Client Instructions</h3>
            <p className="text-gray-700">{shift.clientInstructions}</p>
          </div>
        )}

        {shift.internalNotes && (
          <div className="pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Internal Notes</h3>
            <p className="text-gray-700">{shift.internalNotes}</p>
          </div>
        )}

        <div className="pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Match Attempts</p>
              <p className="text-2xl font-bold text-gray-900">{shift.matchAttempts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Proposals</p>
              <p className="text-2xl font-bold text-gray-900">
                {shift.proposedAssignments?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {candidates.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Match Candidates ({candidates.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <MatchCandidateCard
                key={candidate.caregiverId}
                candidate={candidate}
                onCreateProposal={can('scheduling:write') ? handleCreateProposal : undefined}
                isCreatingProposal={createProposal.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
