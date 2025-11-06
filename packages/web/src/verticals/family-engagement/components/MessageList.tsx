/**
 * Message List Component
 *
 * List of message threads
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { MessageThread } from '@care-commons/family-engagement';

interface MessageListProps {
  threads: MessageThread[];
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ threads, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </div>
                <div className="h-6 w-12 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-4xl">💬</p>
        <p className="mt-2 text-gray-600">No messages yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Start a conversation with your care coordinator
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const lastMessageTime = new Date(thread.lastMessageAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

        const hasUnread = thread.unreadCountFamily > 0;
        const statusColor =
          thread.status === 'OPEN'
            ? 'bg-green-100 text-green-800'
            : thread.status === 'CLOSED'
            ? 'bg-gray-100 text-gray-800'
            : 'bg-gray-100 text-gray-600';

        return (
          <Link
            key={thread.id}
            to={`/family-portal/messages/${thread.id}`}
            className={`block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all ${
              hasUnread ? 'bg-blue-50 border-blue-300' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-base font-semibold text-gray-900 ${hasUnread ? 'font-bold' : ''}`}>
                    {thread.subject}
                    {hasUnread && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{thread.messageCount} messages</span>
                  <span>•</span>
                  <span>{lastMessageTime}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor}`}>
                  {thread.status}
                </span>
                {hasUnread && (
                  <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                    {thread.unreadCountFamily}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
