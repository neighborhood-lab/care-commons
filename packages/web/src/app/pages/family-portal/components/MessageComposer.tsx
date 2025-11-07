import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useSendMessage } from '@/app/hooks/useFamilyMessages';

interface MessageComposerProps {
  threadId: string;
  onMessageSent?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ threadId, onMessageSent }) => {
  const [messageText, setMessageText] = useState('');
  const sendMessage = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    try {
      await sendMessage.mutateAsync({
        threadId,
        messageText: messageText.trim(),
      });
      setMessageText('');
      onMessageSent?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end space-x-3">
        <div className="flex-1">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message here..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
            disabled={sendMessage.isPending}
          />
        </div>
        <button
          type="submit"
          disabled={!messageText.trim() || sendMessage.isPending}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all h-[52px]"
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Your care coordinator will respond as soon as possible
      </p>
    </form>
  );
};
