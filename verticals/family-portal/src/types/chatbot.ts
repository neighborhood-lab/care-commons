import type { UUID, Timestamp } from '@care-commons/core';

/**
 * Chat Message
 * Represents a message in the AI chatbot conversation
 */
export interface ChatMessage {
  id: UUID;
  conversationId: UUID;
  familyMemberId: UUID;

  // Message content
  role: MessageRole;
  content: string;

  // Metadata
  tokens?: number;
  model?: string;

  // Context used
  contextUsed?: ChatContext;

  // Audit
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatContext {
  clientInfo?: boolean;
  carePlan?: boolean;
  recentVisits?: boolean;
  medications?: boolean;
  documents?: string[];
}

/**
 * Chat Conversation
 * Represents an ongoing conversation thread
 */
export interface ChatConversation {
  id: UUID;
  familyMemberId: UUID;
  clientId: UUID;

  // Conversation details
  title?: string;
  summary?: string;

  // Message tracking
  messageCount: number;
  lastMessageAt: Timestamp;

  // Status
  isActive: boolean;
  archivedAt?: Timestamp;

  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Chatbot Configuration
 */
export interface ChatbotConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;

  // Feature flags
  features: {
    contextAwareness: boolean;
    careplanAccess: boolean;
    visitHistory: boolean;
    medicationInfo: boolean;
    documentSearch: boolean;
    emergencyDetection: boolean;
  };

  // Rate limiting
  rateLimit: {
    messagesPerHour: number;
    messagesPerDay: number;
    maxConversationLength: number;
  };
}

/**
 * Chatbot Request/Response types
 */
export interface SendMessageInput {
  conversationId?: UUID;
  message: string;
  includeContext?: {
    carePlan?: boolean;
    recentVisits?: boolean;
    medications?: boolean;
  };
}

export interface ChatbotResponse {
  conversationId: UUID;
  message: ChatMessage;
  suggestedFollowUps?: string[];
  contextUsed: ChatContext;
  metadata: {
    tokensUsed: number;
    responseTime: number;
    model: string;
  };
}

/**
 * Emergency Detection
 */
export interface EmergencyDetection {
  isEmergency: boolean;
  confidence: number;
  category?: EmergencyCategory;
  suggestedAction?: string;
  escalationRequired: boolean;
}

export type EmergencyCategory =
  | 'MEDICAL_EMERGENCY'
  | 'SAFETY_CONCERN'
  | 'MEDICATION_ISSUE'
  | 'URGENT_QUESTION'
  | 'NONE';

/**
 * Chat Analytics
 */
export interface ChatAnalytics {
  conversationId: UUID;

  // Usage metrics
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalTokens: number;

  // Topics discussed
  topics: string[];

  // Sentiment
  overallSentiment?: 'positive' | 'neutral' | 'negative';

  // Quality metrics
  averageResponseTime: number;
  userSatisfaction?: number;

  // Timestamps
  firstMessageAt: Timestamp;
  lastMessageAt: Timestamp;
  duration: number; // in minutes
}
