import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useApiClient } from '@/core/hooks';
import { createEVVApiService } from '../services/evv-api';
import type { EVVSearchFilters } from '../types';

export const useEVVApi = () => {
  const apiClient = useApiClient();
  return useMemo(() => createEVVApiService(apiClient), [apiClient]);
};

export const useEVVRecords = (filters?: EVVSearchFilters) => {
  const evvApi = useEVVApi();

  return useQuery({
    queryKey: ['evv-records', filters],
    queryFn: () => evvApi.getEVVRecords(filters),
  });
};

export const useEVVRecord = (id: string | undefined) => {
  const evvApi = useEVVApi();

  return useQuery({
    queryKey: ['evv-records', id],
    queryFn: () => evvApi.getEVVRecordById(id!),
    enabled: !!id,
  });
};

export const useClockIn = () => {
  const evvApi = useEVVApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ visitId, data }: { 
      visitId: string; 
      data: { 
        gpsCoordinates?: { latitude: number; longitude: number }; 
        verificationMethod: string;
      } 
    }) => evvApi.clockIn(visitId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['evv-records'] });
      toast.success('Clocked in successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock in');
    },
  });
};

export const useClockOut = () => {
  const evvApi = useEVVApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: { 
        gpsCoordinates?: { latitude: number; longitude: number }; 
        notes?: string;
      } 
    }) => evvApi.clockOut(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['evv-records'] });
      toast.success('Clocked out successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clock out');
    },
  });
};
