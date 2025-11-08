import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/core/components';
import { Input } from '@/core/components';
import { Avatar } from '@/core/components';
import { api } from '@/services/api';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'family' | 'coordinator' | 'caregiver';
  content: string;
  created_at: string;
  read_at?: string;
}

export const MessageThread: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/messages`),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/family/clients/${clientId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', clientId] });
      setMessageText('');
    },
  });

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_role === 'family' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="flex items-start space-x-2 max-w-md">
              {message.sender_role !== 'family' && (
                <Avatar name={message.sender_name} size="sm" />
              )}
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender_role === 'family'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm font-medium">{message.sender_name}</p>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-75">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
