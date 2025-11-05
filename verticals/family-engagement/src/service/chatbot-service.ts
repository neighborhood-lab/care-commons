/**
 * AI Chatbot Service - Claude integration for family engagement
 *
 * Provides intelligent chat responses for family members asking questions
 * about care, schedules, medications, and general information.
 */

import Anthropic from '@anthropic-ai/sdk';
import { Database } from '@care-commons/core';
import {
  ChatRequest,
  ChatResponse,
  SuggestedAction,
  ChatbotSession,
} from '../types/family-portal.js';
import {
  ConversationRepository,
  MessageRepository,
  ChatbotSessionRepository,
  CareActivityFeedRepository,
} from '../repository/family-portal-repository.js';

export interface ChatbotConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class ChatbotService {
  private anthropic: Anthropic;
  private conversationRepo: ConversationRepository;
  private messageRepo: MessageRepository;
  private sessionRepo: ChatbotSessionRepository;
  private activityRepo: CareActivityFeedRepository;
  private config: Required<ChatbotConfig>;

  constructor(database: Database, config: ChatbotConfig) {
    this.anthropic = new Anthropic({ apiKey: config.apiKey });
    this.conversationRepo = new ConversationRepository(database);
    this.messageRepo = new MessageRepository(database);
    this.sessionRepo = new ChatbotSessionRepository(database);
    this.activityRepo = new CareActivityFeedRepository(database);

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-3-5-sonnet-20241022',
      maxTokens: config.maxTokens || 1024,
      temperature: config.temperature || 0.7,
    };
  }

  /**
   * Handle a chat request from a family member
   */
  async chat(request: ChatRequest, userId: string, organizationId: string): Promise<ChatResponse> {
    const startTime = Date.now();

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(request, userId, organizationId);

    // Get or create chatbot session
    let session = await this.getActiveSession(conversation.id, request.context.familyMemberId);
    if (!session) {
      session = await this.createSession(conversation.id, request.context);
    }

    // Save user message
    const userMessage = await this.messageRepo.create({
      conversationId: conversation.id,
      organizationId,
      senderType: 'FAMILY_MEMBER',
      senderId: request.context.familyMemberId,
      senderName: 'Family Member', // TODO: Get actual name
      content: request.message,
      contentType: 'TEXT',
      isAiGenerated: false,
      isRead: true,
      readBy: [request.context.familyMemberId],
      isFlagged: false,
      isHidden: false,
    }, userId);

    // Build context for AI
    const context = await this.buildContext(request);

    // Get conversation history
    const history = await this.messageRepo.findByConversationId(conversation.id, { limit: 10 });

    // Generate AI response
    const aiResponse = await this.generateResponse(request.message, context, history);

    // Save AI message
    const aiMessage = await this.messageRepo.create({
      conversationId: conversation.id,
      organizationId,
      senderType: 'AI_BOT',
      senderName: 'Care Assistant',
      content: aiResponse.content,
      contentType: 'TEXT',
      isAiGenerated: true,
      aiPrompt: request.message,
      aiContext: context,
      aiTokenCount: aiResponse.tokenCount,
      isRead: false,
      readBy: [],
      isFlagged: false,
      isHidden: false,
    }, userId);

    // Update conversation
    await this.conversationRepo.incrementMessageCount(conversation.id);

    // Update session metrics
    await this.sessionRepo.updateMetrics(session.id, {
      messageCount: 2, // User message + AI response
      tokenCount: aiResponse.tokenCount,
      cost: this.estimateCost(aiResponse.tokenCount),
    });

    // Determine if human handoff is needed
    const requiresHandoff = this.shouldHandoffToHuman(aiResponse.content, request.message);

    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(request.message, aiResponse.content);

    const processingTime = Date.now() - startTime;

    return {
      message: aiResponse.content,
      conversationId: conversation.id,
      messageId: aiMessage.id,
      requiresHumanHandoff: requiresHandoff,
      suggestedActions,
      metadata: {
        model: this.config.model,
        tokenCount: aiResponse.tokenCount,
        processingTime,
      },
    };
  }

  /**
   * Generate AI response using Claude
   */
  private async generateResponse(
    message: string,
    context: Record<string, unknown>,
    history: Array<{ senderType: string; content: string }>
  ): Promise<{ content: string; tokenCount: number }> {
    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(context);

    // Build message history for Claude
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history
    for (const msg of history.slice(-6)) { // Last 3 exchanges
      messages.push({
        role: msg.senderType === 'FAMILY_MEMBER' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Call Claude API
    const response = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokenCount = response.usage.input_tokens + response.usage.output_tokens;

    return { content, tokenCount };
  }

  /**
   * Build system prompt with context about the care situation
   */
  private buildSystemPrompt(context: Record<string, unknown>): string {
    let prompt = `You are a helpful care assistant helping family members stay informed about their loved one's care.

Your role is to:
- Answer questions about care activities, schedules, and general care information
- Provide reassurance and emotional support
- Explain medical and care terminology in simple terms
- Suggest when a family member should contact the care coordinator directly

Important guidelines:
- Be warm, empathetic, and professional
- Protect patient privacy - never share specific medical details
- If you don't know something, be honest and suggest contacting the care coordinator
- For urgent matters (health emergencies, safety concerns), immediately advise contacting emergency services or the care coordinator
- Keep responses concise and easy to understand

`;

    // Add context information
    if (context.recentActivity) {
      prompt += `\nRecent Care Activities:\n${JSON.stringify(context.recentActivity, null, 2)}\n`;
    }

    if (context.upcomingSchedule) {
      prompt += `\nUpcoming Schedule:\n${JSON.stringify(context.upcomingSchedule, null, 2)}\n`;
    }

    if (context.carePlan) {
      prompt += `\nCare Plan Summary:\n${JSON.stringify(context.carePlan, null, 2)}\n`;
    }

    return prompt;
  }

  /**
   * Build context for AI based on request options
   */
  private async buildContext(request: ChatRequest): Promise<Record<string, unknown>> {
    const context: Record<string, unknown> = {};

    // Get recent activity if requested
    if (request.context.includeRecentActivity) {
      const activities = await this.activityRepo.findByClientId(request.context.clientId, {
        visibleToFamily: true,
        limit: 5,
      });

      context.recentActivity = activities.data.map((activity) => ({
        type: activity.activityType,
        title: activity.title,
        description: activity.description,
        occurredAt: activity.occurredAt,
        actorName: activity.actorName,
      }));
    }

    // TODO: Add schedule context if requested
    // TODO: Add care plan context if requested

    return context;
  }

  /**
   * Get or create conversation for the chat
   */
  private async getOrCreateConversation(
    request: ChatRequest,
    userId: string,
    organizationId: string
  ) {
    if (request.conversationId) {
      const existing = await this.conversationRepo.findById(request.conversationId);
      if (existing) return existing;
    }

    // Create new AI conversation
    return await this.conversationRepo.create({
      organizationId,
      clientId: request.context.clientId,
      type: 'AI_CHAT',
      subject: 'Chat with Care Assistant',
      status: 'ACTIVE',
      familyMemberIds: [request.context.familyMemberId],
      caregiverIds: [],
      coordinatorIds: [],
      isAiConversation: true,
      messageCount: 0,
      unreadCount: 0,
      createdBy: userId,
    }, userId);
  }

  /**
   * Get active chatbot session for conversation
   */
  private async getActiveSession(
    conversationId: string,
    familyMemberId: string
  ): Promise<ChatbotSession | null> {
    const sessions = await this.sessionRepo.query({
      filters: {
        conversation_id: conversationId,
        family_member_id: familyMemberId,
        ended_at: null,
      },
      limit: 1,
    });

    return sessions.data.length > 0 ? sessions.data[0] : null;
  }

  /**
   * Create new chatbot session
   */
  private async createSession(
    conversationId: string,
    context: ChatRequest['context']
  ): Promise<ChatbotSession> {
    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return await this.sessionRepo.create({
      organizationId: conversation.organizationId,
      conversationId,
      familyMemberId: context.familyMemberId,
      clientId: context.clientId,
      sessionType: 'GENERAL_INQUIRY',
      startedAt: new Date(),
      aiModel: this.config.model,
      totalMessages: 0,
      totalTokens: 0,
      estimatedCost: 0,
      initialContext: context,
      requiredHumanHandoff: false,
    }, context.familyMemberId);
  }

  /**
   * Determine if conversation should be handed off to human
   */
  private shouldHandoffToHuman(aiResponse: string, userMessage: string): boolean {
    const handoffKeywords = [
      'emergency',
      'urgent',
      'crisis',
      'pain',
      'bleeding',
      'fell',
      'fall',
      'not breathing',
      'chest pain',
      'confused',
      'unresponsive',
    ];

    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Check if user message contains urgent keywords
    const hasUrgentKeyword = handoffKeywords.some((keyword) => lowerMessage.includes(keyword));

    // Check if AI response suggests contacting someone
    const aiSuggestsContact = lowerResponse.includes('contact') ||
                              lowerResponse.includes('call') ||
                              lowerResponse.includes('speak with');

    return hasUrgentKeyword || aiSuggestsContact;
  }

  /**
   * Generate suggested actions based on conversation
   */
  private generateSuggestedActions(userMessage: string, aiResponse: string): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('schedule') || lowerMessage.includes('visit')) {
      actions.push({
        type: 'VIEW_SCHEDULE',
        label: 'View Schedule',
        url: '/family/schedule',
      });
    }

    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
      actions.push({
        type: 'VIEW_MEDICATIONS',
        label: 'View Medications',
        url: '/family/medications',
      });
    }

    if (lowerMessage.includes('care plan') || lowerMessage.includes('goals')) {
      actions.push({
        type: 'VIEW_CARE_PLAN',
        label: 'View Care Plan',
        url: '/family/care-plan',
      });
    }

    // If AI suggests contacting coordinator, add that action
    if (aiResponse.toLowerCase().includes('contact') || aiResponse.toLowerCase().includes('coordinator')) {
      actions.push({
        type: 'CONTACT_COORDINATOR',
        label: 'Contact Care Coordinator',
        url: '/family/contact',
      });
    }

    return actions;
  }

  /**
   * Estimate cost based on token count
   * Claude 3.5 Sonnet pricing (as of 2024):
   * Input: $3 per million tokens
   * Output: $15 per million tokens
   */
  private estimateCost(totalTokens: number): number {
    // Assuming roughly 60% input, 40% output for conversational AI
    const inputTokens = totalTokens * 0.6;
    const outputTokens = totalTokens * 0.4;

    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;

    return inputCost + outputCost;
  }

  /**
   * End a chatbot session
   */
  async endSession(sessionId: string, feedback?: { wasHelpful?: boolean; rating?: number; comment?: string }): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.endedAt) {
      return;
    }

    const durationSeconds = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    await this.sessionRepo.update(sessionId, {
      endedAt: new Date(),
      durationSeconds,
      wasHelpful: feedback?.wasHelpful,
      helpfulnessRating: feedback?.rating,
      userFeedback: feedback?.comment,
    }, session.familyMemberId);
  }

  /**
   * Request human handoff
   */
  async requestHandoff(sessionId: string, reason: string, handoffTo?: string): Promise<void> {
    await this.sessionRepo.update(sessionId, {
      requiredHumanHandoff: true,
      handoffReason: reason,
      handedOffTo: handoffTo,
      handoffAt: new Date(),
    }, 'system');
  }
}
