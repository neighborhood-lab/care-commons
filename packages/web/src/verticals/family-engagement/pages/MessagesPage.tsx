/**
 * Messages Page
 *
 * Messaging interface for family members
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useMessageThreads,
  useMessagesInThread,
  useSendMessage,
  useCreateMessageThread,
  useFamilyMemberProfile,
} from '../hooks';
import { useAuth } from '@/core/hooks';
import { MessageList, MessageThread, MessageComposer } from '../components';
import type { UUID } from '@care-commons/core/browser';

export const MessagesPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const familyMemberId = user?.id as UUID | null;

  // Get family member profile to get clientId
  const { data: profile } = useFamilyMemberProfile(familyMemberId);
  const clientId = profile?.clientId ?? null;

  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [newThreadMessage, setNewThreadMessage] = useState('');

  const { data: threads, isLoading: threadsLoading } = useMessageThreads(familyMemberId);
  const { data: messages, isLoading: messagesLoading } = useMessagesInThread(threadId || null);
  const sendMessage = useSendMessage();
  const createThread = useCreateMessageThread();

  const handleSendMessage = (messageText: string) => {
    if (!threadId) return;
    sendMessage.mutate({ threadId, messageText });
  };

  const handleCreateThread = () => {
    if (!newThreadSubject || !newThreadMessage) {
      alert('Please fill in all fields');
      return;
    }

    if (!familyMemberId || !clientId) {
      alert('Unable to create message. Please try refreshing the page.');
      return;
    }

    createThread.mutate(
      {
        familyMemberId,
        clientId,
        subject: newThreadSubject,
        initialMessage: newThreadMessage,
      },
      {
        onSuccess: (thread) => {
          setShowNewThread(false);
          setNewThreadSubject('');
          setNewThreadMessage('');
          navigate(`/family-portal/messages/${thread.id}`);
        },
        onError: (error) => {
          alert('Failed to create message thread. Please try again.');
          console.error(error);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-gray-600">Communicate with your care team</p>
        </div>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {showNewThread ? 'Cancel' : 'New Message'}
        </button>
      </div>

      {/* New Thread Form */}
      {showNewThread && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Message</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={newThreadSubject}
                onChange={(e) => setNewThreadSubject(e.target.value)}
                placeholder="What is this about?"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={newThreadMessage}
                onChange={(e) => setNewThreadMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleCreateThread}
              disabled={createThread.isPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createThread.isPending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Thread List */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Conversations</h2>
            <MessageList threads={threads || []} loading={threadsLoading} />
          </div>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          {threadId ? (
            <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 p-4">
                <h2 className="text-base font-semibold text-gray-900">
                  {threads?.find((t) => t.id === threadId)?.subject || 'Conversation'}
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: '500px' }}>
                <MessageThread messages={messages || []} loading={messagesLoading} />
              </div>
              <MessageComposer
                onSend={handleSendMessage}
                disabled={sendMessage.isPending}
                placeholder="Type your message..."
              />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500">
              <div className="text-center">
                <p className="text-3xl mb-2">💬</p>
                <p>Select a conversation or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
