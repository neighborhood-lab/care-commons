import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useFamilyClients = () => {
  return useQuery({
    queryKey: ['family', 'clients'],
    queryFn: () => api.get('/api/family/clients'),
  });
};

export const useClientVisits = (clientId: string, filters?: any) => {
  return useQuery({
    queryKey: ['family', 'visits', clientId, filters],
    queryFn: () => api.get(`/api/family/clients/${clientId}/visits`, { params: filters }),
    enabled: !!clientId,
  });
};

export const useClientMessages = (clientId: string) => {
  return useQuery({
    queryKey: ['family', 'messages', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/messages`),
    refetchInterval: 10000, // Poll for new messages
  });
};

export const useSendMessage = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/family/clients/${clientId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'messages', clientId] });
    },
  });
};
