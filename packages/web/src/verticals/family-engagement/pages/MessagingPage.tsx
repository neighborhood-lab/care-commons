import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'family' | 'coordinator' | 'caregiver';
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  participants: Array<{
    id: string;
    name: string;
    role: 'family' | 'coordinator' | 'caregiver';
  }>;
  lastMessage: Message | null;
  unreadCount: number;
}

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    clientId: 'client-1',
    clientName: 'Dorothy Chen',
    participants: [
      { id: 'fam-1', name: 'You (Sarah Chen)', role: 'family' },
      { id: 'coord-1', name: 'Linda Martinez (Coordinator)', role: 'coordinator' },
      { id: 'cg-1', name: 'Maria Garcia (Caregiver)', role: 'caregiver' },
    ],
    lastMessage: {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'cg-1',
      senderName: 'Maria Garcia',
      senderRole: 'caregiver',
      content: 'Just finished helping Dorothy with lunch. She ate well today!',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    },
    unreadCount: 1,
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'fam-1',
    senderName: 'You',
    senderRole: 'family',
    content: 'Hi, how is my mother doing today? Did she eat breakfast?',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'coord-1',
    senderName: 'Linda Martinez',
    senderRole: 'coordinator',
    content: 'Good morning Sarah! Yes, Maria reported that Dorothy had oatmeal and fruit for breakfast. She\'s doing well today.',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'cg-1',
    senderName: 'Maria Garcia',
    senderRole: 'caregiver',
    content: 'Just finished helping Dorothy with lunch. She ate well today!',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
  },
];

export default function MessagingPage() {
  const [conversations] = useState<Conversation[]>(DEMO_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    DEMO_CONVERSATIONS[0] ?? null
  );
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: 'fam-1',
      senderName: 'You',
      senderRole: 'family',
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: true,
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate response from coordinator after 2 seconds
    setTimeout(() => {
      const response: Message = {
        id: `msg-${Date.now()}`,
        conversationId: selectedConversation.id,
        senderId: 'coord-1',
        senderName: 'Linda Martinez',
        senderRole: 'coordinator',
        content: 'Thanks for reaching out! I\'ll check on that and get back to you shortly.',
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'coordinator':
        return '#3b82f6';
      case 'caregiver':
        return '#10b981';
      case 'family':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const filteredMessages = messages.filter(
    m => m.conversationId === selectedConversation?.id
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Messages</h1>
        <p style={styles.subtitle}>
          Chat with your care team about {selectedConversation?.clientName || 'your loved one'}
        </p>
      </div>

      <div style={styles.content}>
        {/* Conversations sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Conversations</h3>
          </div>
          <div style={styles.conversationList}>
            {conversations.map(conv => (
              <div
                key={conv.id}
                style={{
                  ...styles.conversationItem,
                  ...(selectedConversation?.id === conv.id ? styles.conversationItemActive : {}),
                }}
                onClick={() => setSelectedConversation(conv)}
              >
                <div style={styles.conversationInfo}>
                  <div style={styles.conversationName}>{conv.clientName}</div>
                  {conv.lastMessage && (
                    <div style={styles.conversationPreview}>
                      <span style={styles.conversationSender}>
                        {conv.lastMessage.senderName}:
                      </span>{' '}
                      {conv.lastMessage.content.substring(0, 50)}
                      {conv.lastMessage.content.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <div style={styles.unreadBadge}>{conv.unreadCount}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={styles.chatContainer}>
          {selectedConversation ? (
            <>
              <div style={styles.chatHeader}>
                <div>
                  <h2 style={styles.chatTitle}>{selectedConversation.clientName}</h2>
                  <div style={styles.participants}>
                    {selectedConversation.participants
                      .filter(p => p.role !== 'family')
                      .map((p, idx) => (
                        <span key={p.id}>
                          {idx > 0 && ', '}
                          <span style={{ color: getRoleColor(p.role) }}>{p.name}</span>
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div style={styles.messagesContainer}>
                {filteredMessages.map(message => {
                  const isOwnMessage = message.senderRole === 'family';
                  return (
                    <div
                      key={message.id}
                      style={{
                        ...styles.messageWrapper,
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          ...styles.message,
                          ...(isOwnMessage ? styles.messageOwn : styles.messageOther),
                          borderLeftColor: !isOwnMessage
                            ? getRoleColor(message.senderRole)
                            : undefined,
                        }}
                      >
                        {!isOwnMessage && (
                          <div style={styles.messageSender}>{message.senderName}</div>
                        )}
                        <div style={styles.messageContent}>{message.content}</div>
                        <div
                          style={{
                            ...styles.messageTimestamp,
                            textAlign: isOwnMessage ? 'right' : 'left',
                          }}
                        >
                          {formatTimestamp(message.timestamp)}
                          {isOwnMessage && message.read && ' · Read'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div style={styles.inputContainer}>
                <textarea
                  style={styles.input}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={3}
                />
                <button
                  style={{
                    ...styles.sendButton,
                    ...(newMessage.trim() ? {} : styles.sendButtonDisabled),
                  }}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateText}>
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div style={styles.infoBanner}>
        <div style={styles.infoBannerIcon}>💬</div>
        <div>
          <div style={styles.infoBannerTitle}>Real-time messaging with your care team</div>
          <div style={styles.infoBannerText}>
            Get quick answers to your questions. Typical response time: &lt; 30 minutes during
            business hours (8am-6pm).
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  content: {
    display: 'flex',
    gap: '24px',
    height: '600px',
  },
  sidebar: {
    width: '320px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto',
  },
  conversationItem: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'background-color 0.2s',
  },
  conversationItemActive: {
    backgroundColor: '#eff6ff',
    borderLeft: '4px solid #3b82f6',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  conversationPreview: {
    fontSize: '12px',
    color: '#6b7280',
  },
  conversationSender: {
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  chatHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  chatTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  participants: {
    fontSize: '12px',
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#f9fafb',
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '16px',
  },
  message: {
    maxWidth: '70%',
    padding: '12px',
    borderRadius: '8px',
  },
  messageOwn: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  messageOther: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderLeftWidth: '4px',
  },
  messageSender: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#374151',
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '4px',
  },
  messageTimestamp: {
    fontSize: '11px',
    opacity: 0.7,
  },
  inputContainer: {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'none',
  },
  sendButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  infoBanner: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  infoBannerIcon: {
    fontSize: '24px',
  },
  infoBannerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '4px',
  },
  infoBannerText: {
    fontSize: '12px',
    color: '#1e40af',
  },
};
