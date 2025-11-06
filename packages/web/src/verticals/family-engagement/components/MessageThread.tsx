/**
 * Message Thread Component
 *
 * Display conversation thread with messages
 */

import React, { useEffect, useRef } from 'react';
import type { Message } from '@care-commons/family-engagement';

interface MessageThreadProps {
  messages: Message[];
  loading?: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({ messages, loading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-md space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-20 rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-3xl mb-2">💬</p>
          <p>No messages yet</p>
          <p className="text-sm mt-1">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => {
        const isFromFamily = message.senderType === 'FAMILY';
        const timestamp = new Date(message.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

        return (
          <div
            key={message.id}
            className={`flex ${isFromFamily ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-md ${isFromFamily ? 'text-right' : 'text-left'}`}>
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                {!isFromFamily && <span className="font-medium">{message.senderName}</span>}
                <span>{timestamp}</span>
              </div>
              <div
                className={`rounded-lg px-4 py-3 shadow-sm ${
                  isFromFamily
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.messageText}
                </p>
                {message.attachmentUrls && message.attachmentUrls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachmentUrls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block text-xs underline ${
                          isFromFamily ? 'text-blue-100' : 'text-blue-600'
                        }`}
                      >
                        📎 Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {message.status === 'READ' && isFromFamily && (
                <div className="mt-1 text-xs text-gray-500">✓ Read</div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
