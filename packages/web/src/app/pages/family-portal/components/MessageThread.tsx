import React, { useEffect, useRef } from 'react';
import { useMessages } from '@/app/hooks/useFamilyMessages';
import { MessageComposer } from './MessageComposer';
import { Loader2, User } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageThreadProps {
  threadId: string;
  currentUserId: string;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ threadId, currentUserId }) => {
  const { data: messages, isLoading } = useMessages(threadId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!messages || messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sentBy === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 max-w-xl ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    isOwnMessage ? 'bg-blue-100' : 'bg-gray-200'
                  }`}>
                    <User className={`h-5 w-5 ${isOwnMessage ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>

                  {/* Message Bubble */}
                  <div>
                    <div className={`px-4 py-3 rounded-2xl ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm font-medium mb-1">{message.senderName}</p>
                      <p className="text-base whitespace-pre-wrap">{message.messageText}</p>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      {formatMessageDate(message.createdAt)}
                      {message.status === 'READ' && isOwnMessage && (
                        <span className="ml-2">· Read</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer threadId={threadId} />
    </div>
  );
};
