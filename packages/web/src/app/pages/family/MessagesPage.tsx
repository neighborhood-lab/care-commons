import React from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/core/components';
import { MessageThread } from './components/MessageThread';

export const MessagesPage: React.FC = () => {
  const { clientId } = useParams<{ clientId?: string }>();

  // In a real implementation, this would come from auth context
  const defaultClientId = clientId || 'default-client-id';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <Card className="h-[600px]">
        <MessageThread clientId={defaultClientId} />
      </Card>
    </div>
  );
};
