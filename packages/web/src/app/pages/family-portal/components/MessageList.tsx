import React from 'react';
import { Card } from '@/core/components';
import { useMessageThreads } from '@/app/hooks/useFamilyMessages';
import { MessageCircle, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Link } from 'react-router-dom';

interface MessageListProps {
  familyMemberId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ familyMemberId }) => {
  const { data: threads, isLoading } = useMessageThreads(familyMemberId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No messages yet</p>
        <p className="text-sm text-gray-500 mt-2">Start a conversation with your care coordinator</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => {
        const hasUnread = thread.unreadCountFamily > 0;
        return (
          <Link key={thread.id} to={`/family-portal/messages/${thread.id}`}>
            <Card
              padding="md"
              className={`transition-all hover:shadow-md cursor-pointer ${
                hasUnread ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`text-base font-semibold ${
                      hasUnread ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {thread.subject}
                    </h3>
                    {hasUnread && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                        {thread.unreadCountFamily}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-gray-500">{formatDate(thread.lastMessageAt)}</p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                    thread.status === 'OPEN'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {thread.status}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};
