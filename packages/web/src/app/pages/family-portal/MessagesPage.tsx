import React from 'react';
import { useParams } from 'react-router-dom';
import { MessageList } from './components/MessageList';
import { MessageThread } from './components/MessageThread';
import { Card } from '@/core/components';

// Temporary: In production, this would come from auth context
const FAMILY_MEMBER_ID = 'family-member-1';
const CURRENT_USER_ID = 'family-member-1';

export const MessagesPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();

  return (
    <div className="space-y-6">
      {!threadId ? (
        <>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="mt-2 text-lg text-gray-600">
              Communicate with your care coordinator
            </p>
          </div>

          <MessageList familyMemberId={FAMILY_MEMBER_ID} />
        </>
      ) : (
        <Card padding="none" className="h-[calc(100vh-12rem)]">
          <MessageThread
            threadId={threadId}
            currentUserId={CURRENT_USER_ID}
          />
        </Card>
      )}
    </div>
  );
};
