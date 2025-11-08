import React from 'react';

interface Message {
  id: string;
  sender_name: string;
  sender_role: 'family' | 'coordinator' | 'caregiver';
  content: string;
  created_at: string;
  read_at?: string;
}

interface MessageListProps {
  messages?: Message[];
  clientId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No messages yet</p>
        <p className="text-sm mt-1">Start a conversation with your care coordinator</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className="border-b border-gray-100 pb-3 last:border-b-0"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-medium text-sm text-gray-900">
              {message.sender_name}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
          {message.sender_role === 'family' && message.read_at && (
            <span className="text-xs text-green-600 mt-1 inline-block">
              ✓ Read
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
