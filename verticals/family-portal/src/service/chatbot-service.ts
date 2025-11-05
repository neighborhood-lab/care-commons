/**
 * Chatbot Service
 *
 * AI-powered chatbot for family member support using Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import { UUID } from '@care-commons/core';
import type {
  ChatConversation,
  ChatMessage,
  SendMessageInput,
  ChatbotResponse,
  ChatbotConfig,
  EmergencyDetection,
  FamilyMember,
} from '../types/index.js';
import { ChatConversationRepository, ChatMessageRepository } from '../repository/index.js';

const DEFAULT_CONFIG: ChatbotConfig = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1024,
  temperature: 0.7,
  systemPrompt: `You are a helpful and compassionate AI assistant for family members of care recipients.

Your role is to:
- Answer questions about care plans, visit schedules, and care updates
- Provide emotional support and reassurance
- Help family members understand medical information and care procedures
- Direct urgent concerns to appropriate staff or emergency services
- Maintain privacy and confidentiality

Guidelines:
- Be warm, empathetic, and professional
- Use clear, simple language
- Respect privacy - only discuss information the family member is authorized to view
- For medical emergencies, always direct to emergency services (911)
- For urgent care concerns, recommend contacting the care coordinator or on-call staff
- Never provide medical advice or diagnosis
- If unsure, acknowledge limitations and offer to connect with staff

Tone: Supportive, informative, and reassuring`,
  features: {
    contextAwareness: true,
    careplanAccess: true,
    visitHistory: true,
    medicationInfo: true,
    documentSearch: false,
    emergencyDetection: true,
  },
  rateLimit: {
    messagesPerHour: 30,
    messagesPerDay: 100,
    maxConversationLength: 100,
  },
};

export class ChatbotService {
  private anthropic: Anthropic;
  private config: ChatbotConfig;

  constructor(
    private conversationRepository: ChatConversationRepository,
    private messageRepository: ChatMessageRepository,
    private apiKey: string,
    config?: Partial<ChatbotConfig>
  ) {
    this.anthropic = new Anthropic({ apiKey });
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    familyMember: FamilyMember,
    input: SendMessageInput
  ): Promise<ChatbotResponse> {
    const startTime = Date.now();

    // Check rate limits
    await this.checkRateLimits(familyMember.id);

    // Get or create conversation
    let conversation: ChatConversation;
    if (input.conversationId) {
      const existing = await this.conversationRepository.findById(input.conversationId);
      if (!existing || existing.familyMemberId !== familyMember.id) {
        throw new Error('Conversation not found');
      }
      conversation = existing;
    } else {
      conversation = await this.createConversation(familyMember);
    }

    // Check conversation length
    if (conversation.messageCount >= this.config.rateLimit.maxConversationLength) {
      throw new Error('Conversation has reached maximum length. Please start a new conversation.');
    }

    // Save user message
    const userMessage = await this.saveMessage(conversation.id, familyMember.id, 'user', input.message);

    // Check for emergency
    if (this.config.features.emergencyDetection) {
      const emergency = await this.detectEmergency(input.message);
      if (emergency.isEmergency) {
        const emergencyResponse = this.generateEmergencyResponse(emergency);
        const assistantMessage = await this.saveMessage(
          conversation.id,
          familyMember.id,
          'assistant',
          emergencyResponse
        );

        return {
          conversationId: conversation.id,
          message: assistantMessage,
          suggestedFollowUps: [],
          contextUsed: {},
          metadata: {
            tokensUsed: 0,
            responseTime: Date.now() - startTime,
            model: this.config.model,
          },
        };
      }
    }

    // Build context (can be enhanced to fetch actual care plan data, visits, etc.)
    const contextMessages = await this.buildContext(
      conversation.id,
      familyMember,
      input.includeContext
    );

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.config.systemPrompt,
      messages: [
        ...contextMessages,
        {
          role: 'user',
          content: input.message,
        },
      ],
    });

    // Extract response
    const assistantContent = response.content[0];
    const responseText =
      assistantContent.type === 'text' ? assistantContent.text : 'Unable to generate response';

    // Save assistant message
    const assistantMessage = await this.saveMessage(
      conversation.id,
      familyMember.id,
      'assistant',
      responseText,
      {
        tokens: response.usage.output_tokens,
        model: this.config.model,
        contextUsed: input.includeContext || {},
      }
    );

    // Generate suggested follow-ups
    const suggestedFollowUps = this.generateFollowUps(responseText);

    return {
      conversationId: conversation.id,
      message: assistantMessage,
      suggestedFollowUps,
      contextUsed: input.includeContext || {},
      metadata: {
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        responseTime: Date.now() - startTime,
        model: this.config.model,
      },
    };
  }

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: UUID, limit: number = 50): Promise<ChatMessage[]> {
    return await this.messageRepository.findRecentMessages(conversationId, limit);
  }

  /**
   * Get all conversations for a family member
   */
  async getConversations(familyMemberId: UUID, activeOnly: boolean = true): Promise<ChatConversation[]> {
    return await this.conversationRepository.findByFamilyMember(familyMemberId, activeOnly);
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: UUID, familyMemberId: UUID): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || conversation.familyMemberId !== familyMemberId) {
      throw new Error('Conversation not found');
    }

    await this.conversationRepository.archive(conversationId);
  }

  /**
   * Create a new conversation
   */
  private async createConversation(familyMember: FamilyMember): Promise<ChatConversation> {
    const conversation: Partial<ChatConversation> = {
      familyMemberId: familyMember.id,
      clientId: familyMember.clientId,
      title: 'New Conversation',
      messageCount: 0,
      isActive: true,
    };

    return await this.conversationRepository.create(conversation, {
      userId: familyMember.id,
      roles: ['FAMILY'],
      permissions: [],
      organizationId: familyMember.organizationId,
      branchIds: [],
    });
  }

  /**
   * Save a message
   */
  private async saveMessage(
    conversationId: UUID,
    familyMemberId: UUID,
    role: 'user' | 'assistant',
    content: string,
    metadata?: { tokens?: number; model?: string; contextUsed?: any }
  ): Promise<ChatMessage> {
    const message: Partial<ChatMessage> = {
      conversationId,
      familyMemberId,
      role,
      content,
      tokens: metadata?.tokens,
      model: metadata?.model,
      contextUsed: metadata?.contextUsed,
    };

    const saved = await this.messageRepository.create(message, {
      userId: familyMemberId,
      roles: ['FAMILY'],
      permissions: [],
      organizationId: '',
      branchIds: [],
    });

    // Update conversation message count
    await this.conversationRepository.incrementMessageCount(conversationId);

    return saved;
  }

  /**
   * Build conversation context from message history
   */
  private async buildContext(
    conversationId: UUID,
    familyMember: FamilyMember,
    includeContext?: { carePlan?: boolean; recentVisits?: boolean; medications?: boolean }
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    // Get recent messages for context
    const recentMessages = await this.messageRepository.findRecentMessages(conversationId, 10);

    const contextMessages = recentMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // TODO: Add actual care plan, visits, medications data when those repositories are available
    // This is a placeholder for context enrichment
    if (includeContext?.carePlan && this.config.features.careplanAccess) {
      // contextMessages.unshift({
      //   role: 'assistant',
      //   content: 'I have access to the current care plan...',
      // });
    }

    return contextMessages;
  }

  /**
   * Detect emergency in message
   */
  private async detectEmergency(message: string): Promise<EmergencyDetection> {
    const emergencyKeywords = [
      'emergency',
      '911',
      'ambulance',
      'heart attack',
      'stroke',
      'bleeding',
      'unconscious',
      'not breathing',
      'chest pain',
      'suicide',
      'overdose',
      'fell',
      'injury',
    ];

    const lowerMessage = message.toLowerCase();
    const hasEmergencyKeyword = emergencyKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (hasEmergencyKeyword) {
      return {
        isEmergency: true,
        confidence: 0.8,
        category: 'MEDICAL_EMERGENCY',
        suggestedAction: 'Call 911 immediately',
        escalationRequired: true,
      };
    }

    return {
      isEmergency: false,
      confidence: 0,
      escalationRequired: false,
    };
  }

  /**
   * Generate emergency response
   */
  private generateEmergencyResponse(emergency: EmergencyDetection): string {
    return `🚨 **This appears to be an emergency situation.**

If this is a life-threatening emergency, please:
1. **Call 911 immediately** for emergency medical services
2. Stay with the person until help arrives
3. Follow any instructions from the 911 operator

For urgent but non-emergency situations, please contact:
- Care Coordinator: [Contact info would be here]
- On-call nurse: [Contact info would be here]

I'm here to provide information and support, but I cannot provide medical advice or emergency services. Please seek immediate professional help if needed.

Is there anything else I can help you with while you wait for emergency services?`;
  }

  /**
   * Generate follow-up suggestions
   */
  private generateFollowUps(response: string): string[] {
    const suggestions = [
      'Can you tell me more about the care plan?',
      'What visits are scheduled this week?',
      'How can I contact the care coordinator?',
    ];

    return suggestions.slice(0, 3);
  }

  /**
   * Check rate limits
   */
  private async checkRateLimits(familyMemberId: UUID): Promise<void> {
    // TODO: Implement actual rate limiting with Redis or database
    // For now, this is a placeholder
    // In production, track message counts per hour/day and throw error if exceeded
  }
}
