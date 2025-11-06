/**
 * Visit API service
 */

import type { ApiClient } from '@/core/services';
import type {
  Visit,
  VisitSearchFilters,
  PaginatedVisits,
  CreateVisitInput,
  AssignVisitInput,
  CaregiverAvailability,
} from '../types';

export interface VisitApiService {
  searchVisits(
    filters: VisitSearchFilters,
    page: number,
    limit: number
  ): Promise<PaginatedVisits>;
  getVisitById(id: string): Promise<Visit>;
  createVisit(input: CreateVisitInput): Promise<Visit>;
  assignVisit(input: AssignVisitInput): Promise<Visit>;
  unassignVisit(visitId: string): Promise<Visit>;
  updateVisitStatus(
    visitId: string,
    status: string,
    notes?: string
  ): Promise<Visit>;
  getUnassignedVisits(
    branchId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<Visit[]>;
  getCaregiverAvailability(
    caregiverId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<CaregiverAvailability>;
}

export function createVisitApiService(client: ApiClient): VisitApiService {
  return {
    async searchVisits(filters, page, limit) {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (filters.query) params.append('query', filters.query);
      if (filters.branchId) params.append('branchId', filters.branchId);
      if (filters.clientId) params.append('clientId', filters.clientId);
      if (filters.caregiverId) params.append('caregiverId', filters.caregiverId);
      if (filters.isUnassigned) params.append('isUnassigned', 'true');
      if (filters.isUrgent) params.append('isUrgent', 'true');
      if (filters.requiresSupervision) params.append('requiresSupervision', 'true');

      if (filters.status) {
        filters.status.forEach((s) => params.append('status', s));
      }
      if (filters.visitType) {
        filters.visitType.forEach((t) => params.append('visitType', t));
      }

      const response: { data: PaginatedVisits } = await client.get(`/api/visits?${params.toString()}`);
      return response.data;
    },

    async getVisitById(id) {
      const response: { data: Visit } = await client.get(`/api/visits/${id}`);
      return response.data;
    },

    async createVisit(input) {
      const response: { data: Visit } = await client.post('/api/visits', input);
      return response.data;
    },

    async assignVisit(input) {
      const response: { data: Visit } = await client.post(
        `/api/visits/${input.visitId}/assign`,
        input
      );
      return response.data;
    },

    async unassignVisit(visitId) {
      const response: { data: Visit } = await client.post(`/api/visits/${visitId}/unassign`);
      return response.data;
    },

    async updateVisitStatus(visitId, status, notes) {
      const response: { data: Visit } = await client.patch(`/api/visits/${visitId}/status`, {
        status,
        notes,
      });
      return response.data;
    },

    async getUnassignedVisits(branchId, dateFrom, dateTo) {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString());
      if (dateTo) params.append('dateTo', dateTo.toISOString());

      const response: { data: Visit[] } = await client.get(
        `/api/visits/unassigned?${params.toString()}`
      );
      return response.data;
    },

    async getCaregiverAvailability(caregiverId, date, startTime, endTime) {
      const params = new URLSearchParams({
        caregiverId,
        date: date.toISOString(),
        startTime,
        endTime,
      });

      const response: { data: CaregiverAvailability } = await client.get(
        `/api/visits/availability?${params.toString()}`
      );
      return response.data;
    },
  };
}
