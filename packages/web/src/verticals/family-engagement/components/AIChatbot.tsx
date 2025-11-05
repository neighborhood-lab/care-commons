import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ThumbsUp, ThumbsDown, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/core/components';

/**
 * AI Chatbot Component
 * Healthcare-aware conversational AI for family members
 */

interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  timestamp: Date;
  suggestedActions?: SuggestedAction[];
  quickReplies?: QuickReply[];
}

interface SuggestedAction {
  id: string;
  type: string;
  label: string;
  description?: string;
  url?: string;
}

interface QuickReply {
  id: string;
  label: string;
  value: string;
}

interface AIChatbotProps {
  clientId: string;
  sessionId?: string;
  onSessionStart?: (sessionId: string) => void;
  className?: string;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  clientId,
  sessionId: initialSessionId,
  onSessionStart,
  className = '',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Send welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'ASSISTANT',
        content: "Hello! I'm here to help you with information about care services. How can I assist you today?",
        timestamp: new Date(),
        quickReplies: [
          { id: '1', label: 'View next visit', value: 'When is the next visit?' },
          { id: '2', label: 'Care plan', value: 'Show me the care plan' },
          { id: '3', label: 'Contact coordinator', value: 'I need to speak with the coordinator' },
        ],
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend) return;

    // Clear input
    setInputMessage('');
    setError(null);

    // Add user message to UI
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: textToSend,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call API
      const response = await fetch('/api/family/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          clientId,
          message: textToSend,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update session ID if this is a new session
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
        onSessionStart?.(data.sessionId);
      }

      // Add assistant response to UI
      const assistantMessage: ChatMessage = {
        id: data.assistantResponse.id,
        role: 'ASSISTANT',
        content: data.assistantResponse.content,
        timestamp: new Date(data.assistantResponse.timestamp),
        suggestedActions: data.assistantResponse.suggestedActions,
        quickReplies: data.assistantResponse.quickReplies,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'SYSTEM',
        content: 'Sorry, I encountered an error. Please try again or contact support if the problem persists.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.value);
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    if (action.url) {
      window.location.href = action.url;
    } else {
      // Handle other action types
      console.log('Action clicked:', action);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const submitFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch(`/api/family/chat/sessions/${sessionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          rating: helpful ? 5 : 1,
          feedbackType: helpful ? 'HELPFUL' : 'NOT_HELPFUL',
        }),
      });
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">Care Assistant</h2>
          <p className="text-sm text-blue-100">Ask me anything about care services</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex gap-3 ${
                message.role === 'USER' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'ASSISTANT' && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'USER'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'SYSTEM'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Suggested Actions */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.suggestedActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleSuggestedAction(action)}
                        className="block w-full text-left px-3 py-2 text-sm bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-blue-600">{action.label}</div>
                        {action.description && (
                          <div className="text-xs text-gray-600 mt-1">{action.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Replies */}
                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.quickReplies.map((reply) => (
                      <button
                        key={reply.id}
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1.5 text-sm bg-white text-blue-600 rounded-full border border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Feedback buttons for assistant messages */}
                {message.role === 'ASSISTANT' && message.id !== 'welcome' && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Was this helpful?</span>
                    <button
                      onClick={() => submitFeedback(message.id, true)}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => submitFeedback(message.id, false)}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>

              {message.role === 'USER' && (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div
              className={`text-xs text-gray-500 mt-1 ${
                message.role === 'USER' ? 'text-right mr-11' : 'ml-11'
              }`}
            >
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          💡 I can help with visit schedules, care plans, and general questions about care services.
        </p>
      </div>
    </div>
  );
};
