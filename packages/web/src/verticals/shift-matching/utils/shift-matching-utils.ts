import type { ShiftPriority, MatchingStatus, ProposalStatus, MatchQuality } from '../types';

export const getShiftPriorityColor = (priority: ShiftPriority): string => {
  const colors: Record<ShiftPriority, string> = {
    LOW: 'bg-gray-100 text-gray-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export const getMatchingStatusColor = (status: MatchingStatus): string => {
  const colors: Record<MatchingStatus, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    MATCHING: 'bg-purple-100 text-purple-800',
    MATCHED: 'bg-green-100 text-green-800',
    PROPOSED: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-green-100 text-green-800',
    NO_MATCH: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getProposalStatusColor = (status: ProposalStatus): string => {
  const colors: Record<ProposalStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-blue-100 text-blue-800',
    VIEWED: 'bg-indigo-100 text-indigo-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    SUPERSEDED: 'bg-gray-100 text-gray-800',
    WITHDRAWN: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getMatchQualityColor = (quality: MatchQuality): string => {
  const colors: Record<MatchQuality, string> = {
    EXCELLENT: 'bg-green-100 text-green-800',
    GOOD: 'bg-blue-100 text-blue-800',
    FAIR: 'bg-yellow-100 text-yellow-800',
    POOR: 'bg-orange-100 text-orange-800',
    INELIGIBLE: 'bg-red-100 text-red-800',
  };
  return colors[quality] || 'bg-gray-100 text-gray-800';
};

export const getMatchScoreColor = (score: number): string => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export const formatDistance = (miles: number): string => {
  return `${miles.toFixed(1)} mi`;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};
