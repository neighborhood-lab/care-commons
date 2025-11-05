/**
 * AI Chatbot service - healthcare-aware conversational AI
 */

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  UserContext,
  ValidationError,
  NotFoundError,
} from '@care-commons/core';
import {
  ChatSession,
  ChatMessage,
  ChatIntent,
  ChatTopic,
  ExtractedEntity,
  ChatFeedback,
  ChatEscalation,
  AIModelConfig,
  QuickReply,
  SuggestedAction,
} from '../types/ai-chatbot.js';
import {
  ChatSessionRepository,
  ChatMessageRepository,
  ChatFeedbackRepository,
  ChatEscalationRepository,
  KnowledgeBaseRepository,
} from '../repository/chat-repository.js';

/**
 * Healthcare-aware AI chatbot service
 * Uses Anthropic's Claude for HIPAA-compliant conversations
 */
export class AIChatbotService {
  private sessionRepo: ChatSessionRepository;
  private messageRepo: ChatMessageRepository;
  private feedbackRepo: ChatFeedbackRepository;
  private escalationRepo: ChatEscalationRepository;
  private knowledgeBaseRepo: KnowledgeBaseRepository;
  private anthropic?: Anthropic;
  private modelConfig: AIModelConfig;

  constructor(
    sessionRepo: ChatSessionRepository,
    messageRepo: ChatMessageRepository,
    feedbackRepo: ChatFeedbackRepository,
    escalationRepo: ChatEscalationRepository,
    knowledgeBaseRepo: KnowledgeBaseRepository,
    anthropicApiKey?: string
  ) {
    this.sessionRepo = sessionRepo;
    this.messageRepo = messageRepo;
    this.feedbackRepo = feedbackRepo;
    this.escalationRepo = escalationRepo;
    this.knowledgeBaseRepo = knowledgeBaseRepo;

    // Initialize Anthropic client if API key provided
    if (anthropicApiKey) {
      this.anthropic = new Anthropic({
        apiKey: anthropicApiKey,
      });
    }

    // Default model configuration
    this.modelConfig = {
      provider: 'ANTHROPIC',
      modelName: 'claude-3-5-sonnet-20241022',
      maxTokens: 1024,
      temperature: 0.7,
      systemPrompt: this.getSystemPrompt(),
    };
  }

  /**
   * Get or create active chat session
   */
  async getOrCreateSession(
    familyMemberId: string,
    clientId: string,
    context: UserContext
  ): Promise<ChatSession> {
    // Try to find active session
    let session = await this.sessionRepo.findActiveSession(familyMemberId, clientId);

    if (!session) {
      // Create new session
      const newSession: Partial<ChatSession> = {
        familyMemberId,
        clientId,
        status: 'ACTIVE',
        startedAt: new Date(),
        lastActivityAt: new Date(),
        context: {
          mentionedEntities: {},
        },
        conversationHistory: [],
        totalMessages: 0,
      };

      session = await this.sessionRepo.create(newSession, context);
    }

    return session;
  }

  /**
   * Send message to chatbot and get response
   */
  async sendMessage(
    sessionId: string,
    userMessage: string,
    context: UserContext
  ): Promise<{
    message: ChatMessage;
    response: ChatMessage;
  }> {
    // Get session
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    // Validate message
    if (!userMessage || userMessage.trim().length === 0) {
      throw new ValidationError('Message cannot be empty');
    }

    // Save user message
    const userChatMessage = await this.saveUserMessage(session, userMessage, context);

    // Get conversation context
    const conversationHistory = await this.messageRepo.getConversationContext(sessionId);

    // Classify intent and extract entities
    const { intent, confidence, entities } = await this.classifyIntent(userMessage);

    // Update user message with intent and entities
    await this.messageRepo.update(
      userChatMessage.id,
      {
        intent,
        confidence,
        entities,
      } as any,
      context
    );

    // Generate response based on intent
    const response = await this.generateResponse(
      session,
      userMessage,
      intent,
      entities,
      conversationHistory
    );

    // Save assistant response
    const assistantMessage = await this.saveAssistantMessage(
      session,
      response.content,
      response,
      context
    );

    // Update session
    await this.sessionRepo.incrementMessageCount(sessionId, response.tokensUsed);
    await this.sessionRepo.updateLastActivity(sessionId);

    return {
      message: userChatMessage,
      response: assistantMessage,
    };
  }

  /**
   * Classify user intent from message
   */
  private async classifyIntent(message: string): Promise<{
    intent: ChatIntent;
    confidence: number;
    entities: ExtractedEntity[];
  }> {
    // Simple rule-based classification
    // In production, this could use a fine-tuned model or Claude's function calling
    const lowerMessage = message.toLowerCase();

    // Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMessage)) {
      return {
        intent: 'GREETING',
        confidence: 0.95,
        entities: [],
      };
    }

    // Farewell
    if (/(bye|goodbye|see you|thanks|thank you)$/i.test(lowerMessage)) {
      return {
        intent: 'FAREWELL',
        confidence: 0.95,
        entities: [],
      };
    }

    // Visit schedule queries
    if (/(next visit|upcoming visit|visit schedule|when is.*visit)/i.test(lowerMessage)) {
      return {
        intent: 'GET_NEXT_VISIT',
        confidence: 0.85,
        entities: this.extractDateEntities(message),
      };
    }

    // Care plan queries
    if (/(care plan|treatment plan|goals|progress)/i.test(lowerMessage)) {
      return {
        intent: 'GET_CARE_PLAN',
        confidence: 0.85,
        entities: [],
      };
    }

    // Caregiver info
    if (/(caregiver|aide|nurse|who is.*caregiver)/i.test(lowerMessage)) {
      return {
        intent: 'GET_CAREGIVER_INFO',
        confidence: 0.85,
        entities: [],
      };
    }

    // Help requests
    if (/(help|support|assistance|question)/i.test(lowerMessage)) {
      return {
        intent: 'GET_HELP',
        confidence: 0.80,
        entities: [],
      };
    }

    return {
      intent: 'UNKNOWN',
      confidence: 0.5,
      entities: [],
    };
  }

  /**
   * Extract date entities from message
   */
  private extractDateEntities(message: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Simple date patterns
    const patterns = [
      { regex: /today/i, type: 'DATE' as const },
      { regex: /tomorrow/i, type: 'DATE' as const },
      { regex: /this week/i, type: 'DATE' as const },
      { regex: /next week/i, type: 'DATE' as const },
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern.regex);
      if (match) {
        entities.push({
          type: pattern.type,
          value: match[0],
          confidence: 0.9,
          position: {
            start: match.index!,
            end: match.index! + match[0].length,
          },
        });
      }
    }

    return entities;
  }

  /**
   * Generate AI response using Claude
   */
  private async generateResponse(
    session: ChatSession,
    userMessage: string,
    intent: ChatIntent,
    entities: ExtractedEntity[],
    conversationHistory: ChatMessage[]
  ): Promise<{
    content: string;
    tokensUsed?: number;
    suggestedActions?: SuggestedAction[];
    quickReplies?: QuickReply[];
  }> {
    // If no Anthropic client, use fallback responses
    if (!this.anthropic) {
      return this.getFallbackResponse(intent, session);
    }

    try {
      // Build conversation messages for Claude
      const messages: Anthropic.MessageParam[] = conversationHistory.map(msg => ({
        role: msg.role === 'USER' ? 'user' : 'assistant',
        content: msg.content,
      }));

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: this.modelConfig.modelName,
        max_tokens: this.modelConfig.maxTokens,
        temperature: this.modelConfig.temperature,
        system: this.modelConfig.systemPrompt,
        messages,
      });

      // Extract text from response
      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : 'I apologize, but I encountered an issue generating a response.';

      // Get suggested actions and quick replies based on intent
      const suggestedActions = this.getSuggestedActions(intent, session);
      const quickReplies = this.getQuickReplies(intent);

      return {
        content,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        suggestedActions,
        quickReplies,
      };
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return this.getFallbackResponse(intent, session);
    }
  }

  /**
   * Get fallback responses when AI is unavailable
   */
  private getFallbackResponse(intent: ChatIntent, session: ChatSession): {
    content: string;
    suggestedActions?: SuggestedAction[];
    quickReplies?: QuickReply[];
  } {
    const responses: Record<ChatIntent, string> = {
      GREETING: `Hello! I'm here to help you with information about care services. How can I assist you today?`,
      FAREWELL: `You're welcome! Feel free to reach out anytime you have questions. Have a great day!`,
      GET_NEXT_VISIT: `I can help you find information about upcoming visits. Let me check the schedule for you...`,
      GET_VISIT_SCHEDULE: `I can show you the visit schedule. Would you like to see this week's visits or a specific date range?`,
      GET_VISIT_DETAILS: `I can provide details about specific visits. Which visit would you like to know more about?`,
      GET_CARE_PLAN: `I can provide information about the care plan, including current goals and progress. What would you like to know?`,
      GET_CARE_PLAN_PROGRESS: `I'd be happy to show you the progress on care plan goals. Let me gather that information...`,
      GET_CAREGIVER_INFO: `I can provide information about the assigned caregivers. What would you like to know?`,
      GET_MEDICATION_INFO: `For medication information, I recommend speaking with the care coordinator or nurse. Would you like me to help you contact them?`,
      REQUEST_VISIT_CHANGE: `I can help you request a visit change. Please note that changes need to be approved by the care coordinator. Would you like to proceed?`,
      REQUEST_CALLBACK: `I can arrange for a care coordinator to call you back. When would be a good time?`,
      SEND_MESSAGE: `I can help you send a message to the care team. What would you like to communicate?`,
      GET_HELP: `I'm here to help! I can assist with:\n- Visit schedules\n- Care plan information\n- Caregiver details\n- General questions about services\n\nWhat would you like to know?`,
      REPORT_ISSUE: `I'm sorry to hear there's an issue. For urgent matters, please contact the care coordinator directly. For non-urgent issues, I can help you file a report.`,
      PROVIDE_FEEDBACK: `We value your feedback! I can help you submit feedback about your experience. What would you like to share?`,
      THANK_YOU: `You're very welcome! I'm always here to help. Is there anything else you need?`,
      UNKNOWN: `I'm not sure I understood that correctly. I can help you with visit schedules, care plan information, caregiver details, and general questions about care services. Could you rephrase your question?`,
    };

    return {
      content: responses[intent] || responses.UNKNOWN,
      suggestedActions: this.getSuggestedActions(intent, session),
      quickReplies: this.getQuickReplies(intent),
    };
  }

  /**
   * Get suggested actions for user
   */
  private getSuggestedActions(intent: ChatIntent, session: ChatSession): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    if (intent === 'GET_CARE_PLAN' || intent === 'GET_CARE_PLAN_PROGRESS') {
      actions.push({
        id: 'view_care_plan',
        type: 'VIEW_CARE_PLAN',
        label: 'View Full Care Plan',
        description: 'See detailed care plan with goals and tasks',
        url: `/care-plan/${session.clientId}`,
      });
    }

    if (intent === 'GET_NEXT_VISIT' || intent === 'GET_VISIT_SCHEDULE') {
      actions.push({
        id: 'view_schedule',
        type: 'VIEW_VISIT',
        label: 'View Visit Schedule',
        description: 'See all upcoming visits',
        url: `/visits/${session.clientId}`,
      });
    }

    if (intent === 'UNKNOWN' || intent === 'GET_HELP') {
      actions.push({
        id: 'contact_coordinator',
        type: 'CONTACT_COORDINATOR',
        label: 'Contact Care Coordinator',
        description: 'Speak with a care coordinator for assistance',
      });
    }

    return actions;
  }

  /**
   * Get quick reply options
   */
  private getQuickReplies(intent: ChatIntent): QuickReply[] {
    const allReplies: Record<string, QuickReply[]> = {
      GREETING: [
        { id: '1', label: 'View next visit', value: 'When is the next visit?' },
        { id: '2', label: 'Care plan', value: 'Show me the care plan' },
        { id: '3', label: 'Contact coordinator', value: 'I need to speak with the coordinator' },
      ],
      GET_HELP: [
        { id: '1', label: 'Visit schedule', value: 'Show visit schedule' },
        { id: '2', label: 'Care plan', value: 'View care plan' },
        { id: '3', label: 'Caregiver info', value: 'Who is my caregiver?' },
      ],
      UNKNOWN: [
        { id: '1', label: 'Help', value: 'I need help' },
        { id: '2', label: 'Visits', value: 'Tell me about visits' },
        { id: '3', label: 'Contact support', value: 'I want to speak with someone' },
      ],
    };

    return allReplies[intent] || [];
  }

  /**
   * Get system prompt for healthcare context
   */
  private getSystemPrompt(): string {
    return `You are a helpful AI assistant for a home healthcare platform. Your role is to help family members and authorized contacts get information about care services, visit schedules, care plans, and caregiver information.

IMPORTANT GUIDELINES:
1. You have access to care information for this specific client only
2. Be empathetic and supportive - families are often concerned about their loved ones
3. Provide accurate information based on available data
4. For medical questions or emergencies, immediately direct users to contact healthcare professionals
5. Maintain HIPAA compliance - never share information with unauthorized users
6. If you're unsure about something, admit it and offer to connect them with a care coordinator
7. Be concise but friendly in your responses
8. Always prioritize patient safety and well-being

WHAT YOU CAN HELP WITH:
- Visit schedules and upcoming appointments
- Care plan goals and progress
- Caregiver assignments and information
- General questions about home care services
- Connecting family members with care coordinators

WHAT YOU CANNOT DO:
- Provide medical advice or diagnosis
- Make changes to care plans or schedules (but you can help them request changes)
- Access information for other clients
- Share information with unauthorized users
- Handle emergency situations (direct to 911 or care coordinator)

Always be helpful, professional, and caring in your interactions.`;
  }

  /**
   * Save user message
   */
  private async saveUserMessage(
    session: ChatSession,
    content: string,
    context: UserContext
  ): Promise<ChatMessage> {
    const message: Partial<ChatMessage> = {
      sessionId: session.id,
      role: 'USER',
      content,
      timestamp: new Date(),
      containsPHI: this.detectPHI(content),
      sanitized: false,
    };

    return this.messageRepo.create(message, context);
  }

  /**
   * Save assistant message
   */
  private async saveAssistantMessage(
    session: ChatSession,
    content: string,
    response: {
      tokensUsed?: number;
      suggestedActions?: SuggestedAction[];
      quickReplies?: QuickReply[];
    },
    context: UserContext
  ): Promise<ChatMessage> {
    const message: Partial<ChatMessage> = {
      sessionId: session.id,
      role: 'ASSISTANT',
      content,
      timestamp: new Date(),
      tokensUsed: response.tokensUsed,
      suggestedActions: response.suggestedActions,
      quickReplies: response.quickReplies,
      containsPHI: false,
      sanitized: false,
      modelVersion: this.modelConfig.modelName,
    };

    return this.messageRepo.create(message, context);
  }

  /**
   * Detect if message contains PHI
   */
  private detectPHI(content: string): boolean {
    // Simple PHI detection - in production, use more sophisticated methods
    const phiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{10}\b/, // Phone number
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{5}(-\d{4})?\b/, // ZIP code (when combined with other info)
    ];

    return phiPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Submit feedback
   */
  async submitFeedback(
    sessionId: string,
    messageId: string | undefined,
    rating: 1 | 2 | 3 | 4 | 5,
    feedbackType: string,
    comment: string | undefined,
    familyMemberId: string,
    context: UserContext
  ): Promise<ChatFeedback> {
    const feedback: Partial<ChatFeedback> = {
      sessionId,
      messageId,
      familyMemberId,
      rating,
      feedbackType: feedbackType as any,
      comment,
      createdAt: new Date(),
    };

    return this.feedbackRepo.create(feedback, context);
  }

  /**
   * Escalate to human agent
   */
  async escalate(
    sessionId: string,
    reason: string,
    description: string,
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    familyMemberId: string,
    clientId: string,
    context: UserContext
  ): Promise<ChatEscalation> {
    const escalation: Partial<ChatEscalation> = {
      sessionId,
      familyMemberId,
      clientId,
      reason: reason as any,
      priority,
      description,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mark session as escalated
    await this.sessionRepo.endSession(sessionId, 'ESCALATED');

    return this.escalationRepo.create(escalation, context);
  }

  /**
   * End chat session
   */
  async endSession(sessionId: string): Promise<void> {
    await this.sessionRepo.endSession(sessionId, 'ENDED');
  }

  /**
   * Get chat history
   */
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    return this.messageRepo.findBySession(sessionId);
  }
}
