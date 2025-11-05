/**
 * AI Chatbot domain models
 *
 * Healthcare-aware AI assistant for family members:
 * - Natural language understanding
 * - Context-aware responses
 * - Care plan and visit information retrieval
 * - HIPAA-compliant conversation handling
 * - Intent classification and entity extraction
 * - Conversation history and context management
 */

import {
  Entity,
  UUID,
} from '@care-commons/core';

/**
 * Chatbot conversation session
 * Maintains context across multiple messages
 */
export interface ChatSession extends Entity {
  id: UUID;

  // User Context
  familyMemberId: UUID;
  clientId: UUID;

  // Session State
  status: ChatSessionStatus;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt?: Date;

  // Context Management
  context: ChatContext;
  conversationHistory: ChatMessage[];

  // Session Metadata
  totalMessages: number;
  totalTokensUsed?: number;
  language?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type ChatSessionStatus =
  | 'ACTIVE'
  | 'IDLE'
  | 'ENDED'
  | 'ESCALATED'; // Escalated to human agent

/**
 * Chat context for maintaining conversation state
 */
export interface ChatContext {
  // Current Topic
  currentTopic?: ChatTopic;
  currentIntent?: ChatIntent;

  // Entity Memory
  mentionedEntities: {
    visits?: UUID[];
    caregivers?: UUID[];
    carePlans?: UUID[];
    goals?: UUID[];
    tasks?: UUID[];
  };

  // Conversation State
  awaitingUserInput?: boolean;
  expectedInputType?: 'TEXT' | 'DATE' | 'CHOICE' | 'CONFIRMATION';
  quickReplies?: QuickReply[];

  // Preferences
  preferredLanguage?: string;
  verbosityLevel?: 'CONCISE' | 'NORMAL' | 'DETAILED';

  // Session Data
  metadata?: Record<string, unknown>;
}

export type ChatTopic =
  | 'GENERAL_INFO'
  | 'CARE_PLAN'
  | 'VISITS'
  | 'MEDICATIONS'
  | 'CAREGIVERS'
  | 'BILLING'
  | 'SCHEDULING'
  | 'PROGRESS'
  | 'HELP';

export type ChatIntent =
  // Informational
  | 'GET_VISIT_SCHEDULE'
  | 'GET_NEXT_VISIT'
  | 'GET_VISIT_DETAILS'
  | 'GET_CARE_PLAN'
  | 'GET_CARE_PLAN_PROGRESS'
  | 'GET_CAREGIVER_INFO'
  | 'GET_MEDICATION_INFO'

  // Actions
  | 'REQUEST_VISIT_CHANGE'
  | 'REQUEST_CALLBACK'
  | 'SEND_MESSAGE'

  // Support
  | 'GET_HELP'
  | 'REPORT_ISSUE'
  | 'PROVIDE_FEEDBACK'

  // Conversational
  | 'GREETING'
  | 'FAREWELL'
  | 'THANK_YOU'
  | 'UNKNOWN';

/**
 * Individual message in a chat conversation
 */
export interface ChatMessage {
  id: UUID;
  sessionId: UUID;

  // Message Details
  role: ChatMessageRole;
  content: string;
  timestamp: Date;

  // AI Processing
  intent?: ChatIntent;
  confidence?: number;
  entities?: ExtractedEntity[];

  // Response Generation
  responseType?: ResponseType;
  suggestedActions?: SuggestedAction[];
  quickReplies?: QuickReply[];

  // Metadata
  tokensUsed?: number;
  processingTimeMs?: number;
  modelVersion?: string;

  // PHI Protection
  containsPHI: boolean;
  sanitized: boolean;
}

export type ChatMessageRole =
  | 'USER'
  | 'ASSISTANT'
  | 'SYSTEM';

export type ResponseType =
  | 'TEXT'
  | 'CARD'          // Structured card response
  | 'LIST'          // List of items
  | 'CAROUSEL'      // Multiple cards
  | 'QUICK_REPLY'   // With quick reply buttons
  | 'ESCALATION';   // Escalate to human

/**
 * Extracted entity from user message
 */
export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  resolvedId?: UUID; // Resolved database ID
}

export type EntityType =
  | 'DATE'
  | 'TIME'
  | 'PERSON_NAME'
  | 'VISIT_ID'
  | 'CAREGIVER_NAME'
  | 'MEDICATION_NAME'
  | 'SYMPTOM'
  | 'LOCATION'
  | 'PHONE_NUMBER'
  | 'EMAIL';

/**
 * Quick reply option for user
 */
export interface QuickReply {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

/**
 * Suggested action for user to take
 */
export interface SuggestedAction {
  id: string;
  type: ActionType;
  label: string;
  description?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export type ActionType =
  | 'VIEW_CARE_PLAN'
  | 'VIEW_VISIT'
  | 'CONTACT_COORDINATOR'
  | 'DOWNLOAD_DOCUMENT'
  | 'SCHEDULE_CALL'
  | 'EXTERNAL_LINK';

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  modelName: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt: string;
}

export type AIProvider =
  | 'ANTHROPIC'      // Claude
  | 'OPENAI'         // GPT-4
  | 'AZURE_OPENAI'   // Azure OpenAI
  | 'GOOGLE'         // PaLM/Gemini
  | 'HUGGINGFACE'    // Open source models
  | 'LOCAL';         // Self-hosted

/**
 * Chat analytics and metrics
 */
export interface ChatAnalytics {
  sessionId: UUID;

  // Volume
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;

  // Quality
  averageConfidence: number;
  successfulResponses: number;
  failedResponses: number;
  escalations: number;

  // Performance
  averageResponseTimeMs: number;
  totalTokensUsed: number;
  totalCost?: number;

  // User Engagement
  sessionDurationMinutes: number;
  messagesPerSession: number;
  userSatisfactionRating?: number;

  // Intent Distribution
  intentCounts: Record<ChatIntent, number>;
}

/**
 * Chat feedback from user
 */
export interface ChatFeedback extends Entity {
  id: UUID;
  sessionId: UUID;
  messageId?: UUID;
  familyMemberId: UUID;

  // Feedback
  rating: 1 | 2 | 3 | 4 | 5;
  feedbackType: FeedbackType;
  comment?: string;

  // Issues
  issues?: FeedbackIssue[];

  // Metadata
  createdAt: Date;
}

export type FeedbackType =
  | 'HELPFUL'
  | 'NOT_HELPFUL'
  | 'INCORRECT'
  | 'INAPPROPRIATE'
  | 'SUGGESTION';

export type FeedbackIssue =
  | 'WRONG_ANSWER'
  | 'INCOMPLETE_ANSWER'
  | 'CONFUSING'
  | 'TOO_SLOW'
  | 'NOT_UNDERSTANDING'
  | 'PRIVACY_CONCERN'
  | 'OTHER';

/**
 * Knowledge base article for RAG
 * (Retrieval Augmented Generation)
 */
export interface KnowledgeBaseArticle extends Entity {
  id: UUID;

  // Article Details
  title: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];

  // Embeddings for semantic search
  embedding?: number[];
  embeddingModel?: string;

  // Relevance
  relevanceScore?: number;
  usageCount: number;

  // Status
  isPublished: boolean;
  publishedAt?: Date;

  // State-Specific
  applicableStates?: ('TX' | 'FL')[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeCategory =
  | 'CARE_SERVICES'
  | 'MEDICATIONS'
  | 'BILLING'
  | 'SCHEDULING'
  | 'CAREGIVER_INFO'
  | 'EMERGENCY_PROCEDURES'
  | 'COMPLIANCE'
  | 'FAQ'
  | 'TROUBLESHOOTING';

/**
 * Chat escalation to human agent
 */
export interface ChatEscalation extends Entity {
  id: UUID;
  sessionId: UUID;
  familyMemberId: UUID;
  clientId: UUID;

  // Escalation Details
  reason: EscalationReason;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  description: string;

  // Assignment
  assignedTo?: UUID;
  assignedAt?: Date;
  status: EscalationStatus;

  // Resolution
  resolvedAt?: Date;
  resolvedBy?: UUID;
  resolution?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type EscalationReason =
  | 'USER_REQUESTED'
  | 'COMPLEX_QUESTION'
  | 'REQUIRES_AUTHORIZATION'
  | 'SAFETY_CONCERN'
  | 'COMPLAINT'
  | 'TECHNICAL_ISSUE'
  | 'LOW_CONFIDENCE'
  | 'REPEATED_FAILURES';

export type EscalationStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED';

/**
 * Conversation summary
 * Generated summary of chat session for context
 */
export interface ConversationSummary {
  sessionId: UUID;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  topics: ChatTopic[];
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  generatedAt: Date;
}

/**
 * Chat prompt template
 */
export interface ChatPromptTemplate {
  id: UUID;
  name: string;
  intent: ChatIntent;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  examples?: {
    input: string;
    output: string;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
