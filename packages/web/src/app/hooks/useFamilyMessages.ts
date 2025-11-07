import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/core/hooks';

// Types from family-engagement vertical
interface MessageThread {
  id: string;
  familyMemberId: string;
  clientId: string;
  subject: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  participants: string[];
  assignedToUserId?: string;
  lastMessageAt: string;
  messageCount: number;
  unreadCountFamily: number;
  unreadCountStaff: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  threadId: string;
  familyMemberId: string;
  clientId: string;
  sentBy: string;
  senderType: 'FAMILY' | 'STAFF';
  senderName: string;
  messageText: string;
  attachmentUrls?: string[];
  status: 'SENT' | 'DELIVERED' | 'READ';
  readAt?: string;
  readBy?: string[];
  isInternal: boolean;
  flaggedForReview: boolean;
  flaggedReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateMessageThreadInput {
  familyMemberId: string;
  clientId: string;
  subject: string;
  initialMessage: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  assignedToUserId?: string;
}

interface SendMessageInput {
  threadId: string;
  messageText: string;
  attachmentUrls?: string[];
  isInternal?: boolean;
}

/**
 * Hook for fetching message threads
 */
export function useMessageThreads(familyMemberId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['message-threads', familyMemberId],
    queryFn: async () => {
      const response = await api.get<MessageThread[]>(
        `/family-engagement/messages/family-member/${familyMemberId}/threads`
      );
      return response.data;
    },
    enabled: !!familyMemberId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

/**
 * Hook for fetching a single thread
 */
export function useMessageThread(threadId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['message-thread', threadId],
    queryFn: async () => {
      const response = await api.get<MessageThread>(
        `/family-engagement/messages/threads/${threadId}`
      );
      return response.data;
    },
    enabled: !!threadId,
  });
}

/**
 * Hook for fetching messages in a thread
 */
export function useMessages(threadId: string) {
  const api = useApiClient();

  return useQuery({
    queryKey: ['messages', threadId],
    queryFn: async () => {
      const response = await api.get<Message[]>(
        `/family-engagement/messages/threads/${threadId}/messages`
      );
      return response.data;
    },
    enabled: !!threadId,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
  });
}

/**
 * Hook for creating a new message thread
 */
export function useCreateMessageThread() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMessageThreadInput) => {
      const response = await api.post<MessageThread>(
        '/family-engagement/messages/threads',
        input
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['message-threads', variables.familyMemberId] });
      queryClient.invalidateQueries({ queryKey: ['family-dashboard', variables.familyMemberId] });
    },
  });
}

/**
 * Hook for sending a message in a thread
 */
export function useSendMessage() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput) => {
      const response = await api.post<Message>(
        `/family-engagement/messages/threads/${input.threadId}/messages`,
        {
          messageText: input.messageText,
          attachmentUrls: input.attachmentUrls,
          isInternal: input.isInternal,
          senderType: 'FAMILY', // Always FAMILY for family portal
        }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['message-thread', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['family-dashboard'] });
    },
  });
}

/**
 * Hook for marking messages as read
 */
export function useMarkMessagesAsRead() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      await api.post(`/family-engagement/messages/threads/${threadId}/mark-read`);
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['message-thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['family-dashboard'] });
    },
  });
}

/**
 * Hook for closing a thread
 */
export function useCloseThread() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await api.patch<MessageThread>(
        `/family-engagement/messages/threads/${threadId}/close`
      );
      return response.data;
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['message-thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
    },
  });
}

/**
 * Hook for archiving a thread
 */
export function useArchiveThread() {
  const api = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await api.patch<MessageThread>(
        `/family-engagement/messages/threads/${threadId}/archive`
      );
      return response.data;
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: ['message-thread', threadId] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
    },
  });
}
