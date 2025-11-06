/**
 * Family Messages Hooks
 *
 * React Query hooks for family messaging functionality
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { UUID } from '@care-commons/family-engagement';
import { useFamilyPortalApi } from './useFamilyPortal';

/**
 * Hook to get message threads for family member
 */
export function useMessageThreads(familyMemberId: UUID | null) {
  const familyPortalApi = useFamilyPortalApi();

  return useQuery({
    queryKey: ['messageThreads', familyMemberId],
    queryFn: () => familyPortalApi.getMessageThreads(familyMemberId!),
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}

/**
 * Hook to get messages in a thread
 */
export function useMessagesInThread(threadId: UUID | null) {
  const familyPortalApi = useFamilyPortalApi();

  return useQuery({
    queryKey: ['messages', threadId],
    queryFn: () => familyPortalApi.getMessagesInThread(threadId!),
    enabled: !!threadId,
    refetchInterval: 10000, // Poll every 10 seconds for active conversations
  });
}

/**
 * Hook to send a message
 */
export function useSendMessage() {
  const familyPortalApi = useFamilyPortalApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, messageText }: { threadId: UUID; messageText: string }) =>
      familyPortalApi.sendMessage(threadId, messageText),
    onSuccess: (_, variables) => {
      // Invalidate and refetch messages in this thread
      void queryClient.invalidateQueries({ queryKey: ['messages', variables.threadId] });
      void queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      void queryClient.invalidateQueries({ queryKey: ['familyDashboard'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
}

/**
 * Hook to create a new message thread
 */
export function useCreateMessageThread() {
  const familyPortalApi = useFamilyPortalApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      familyMemberId,
      clientId,
      subject,
      initialMessage,
    }: {
      familyMemberId: UUID;
      clientId: UUID;
      subject: string;
      initialMessage: string;
    }) => familyPortalApi.createMessageThread(familyMemberId, clientId, subject, initialMessage),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      toast.success('Message sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });
}
