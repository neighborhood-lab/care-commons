import Anthropic from '@anthropic-ai/sdk';
import type { UserContext } from '@care-commons/core';
import { AIConversationRepository } from '../repository/ai-conversation-repository.js';
import { FamilyMemberRepository } from '../repository/family-member-repository.js';
import { MessageRepository } from '../repository/message-repository.js';
import type {
  FamilyMember,
  ChatbotContext,
  IntentClassification,
  VisitContext,
  CarePlanContext,
  ClientContext,
} from '../types/family.js';
import { INTENT_TYPES } from '../types/family.js';

export interface ChatbotConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export class FamilyChatbotService {
  private claude: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(
    private config: ChatbotConfig,
    private aiConversationRepository: AIConversationRepository,
    private familyMemberRepository: FamilyMemberRepository,
    private messageRepository: MessageRepository
  ) {
    this.claude = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 500;
  }

  /**
   * Handle incoming message from family member
   */
  async handleMessage(
    familyMember: FamilyMember,
    message: string,
    sessionId: string,
    context: UserContext
  ): Promise<string> {
    // 1. Fetch relevant context
    const chatbotContext = await this.getContextForFamily(familyMember, context);

    // 2. Classify intent
    const intent = this.classifyIntent(message);

    // 3. Check if we should escalate to human
    if (this.shouldEscalate(intent, message)) {
      await this.escalateToHuman(familyMember, message, intent, context);
      return "I'm connecting you with a care coordinator who can help with that. They'll respond shortly.";
    }

    // 4. Generate AI response
    const response = await this.generateResponse(familyMember, message, chatbotContext);

    // 5. Log conversation
    await this.aiConversationRepository.create(
      {
        organizationId: familyMember.organizationId,
        familyMemberId: familyMember.id,
        clientId: familyMember.clientId,
        sessionId,
        userMessage: message,
        aiResponse: response,
        contextData: chatbotContext,
        detectedIntent: intent.type,
        confidenceScore: intent.confidence,
        escalatedToHuman: false,
      },
      context
    );

    return response;
  }

  /**
   * Generate AI response using Claude
   */
  private async generateResponse(
    familyMember: FamilyMember,
    message: string,
    context: ChatbotContext
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(familyMember, context);

    try {
      const response = await this.claude.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      const textBlock = response.content.find((block) => block.type === 'text');
      return textBlock && 'text' in textBlock ? textBlock.text : 'I apologize, but I had trouble generating a response. Please try again.';
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble responding right now. Please contact your care coordinator directly.";
    }
  }

  /**
   * Build system prompt for Claude
   */
  private buildSystemPrompt(
    familyMember: FamilyMember,
    context: ChatbotContext
  ): string {
    const recentVisitsText = context.recentVisits.length > 0
      ? context.recentVisits
          .map(
            (v) =>
              `- ${this.formatDate(v.scheduledStartTime)}: ${v.caregiverName} (${v.status}${
                v.duration ? `, ${v.duration} min` : ''
              })`
          )
          .join('\n')
      : 'No recent visits';

    const todayVisitsText = context.todayVisits.length > 0
      ? context.todayVisits
          .map(
            (v) =>
              `- ${this.formatTime(v.scheduledStartTime)}: ${v.caregiverName} (${v.status})`
          )
          .join('\n')
      : 'No visits scheduled for today';

    const carePlanText = context.carePlan
      ? `Goals: ${context.carePlan.goals.join(', ')}\nInterventions: ${context.carePlan.interventions.join(', ')}`
      : 'No active care plan available';

    return `You are a helpful care coordination assistant for a home healthcare agency.

CURRENT CONTEXT:
- Family Member: ${familyMember.firstName} ${familyMember.lastName}
- Relationship: ${familyMember.relationship}
- Client: ${context.client.name}
- Client Age: ${context.client.age}
- Client Conditions: ${context.client.conditions.join(', ')}

RECENT VISITS (Last 7 days):
${recentVisitsText}

TODAY'S SCHEDULE:
${todayVisitsText}

ACTIVE CARE PLAN:
${carePlanText}

GUIDELINES:
1. Be warm, empathetic, and professional
2. Answer questions about recent visits, upcoming schedule, and care plan
3. Provide factual information only - don't speculate
4. If asked about medical decisions, recommend contacting the care coordinator
5. If asked to make scheduling changes, confirm details before offering to submit request
6. Never share information the family member isn't authorized to see
7. Keep responses concise (2-3 sentences when possible)

AUTHORIZED INFORMATION:
- Can view visit history: ${familyMember.permissions.viewVisitHistory}
- Can view care plan: ${familyMember.permissions.viewCarePlan}
- Can view medications: ${familyMember.permissions.viewMedications}
- Can view medical notes: ${familyMember.permissions.viewMedicalNotes}
- Can view caregiver info: ${familyMember.permissions.viewCaregiverInfo}

If asked about information they're not authorized to see, politely explain that you need to respect privacy settings and suggest contacting the care coordinator.`;
  }

  /**
   * Classify intent of user message
   */
  private classifyIntent(message: string): IntentClassification {
    const lowerMessage = message.toLowerCase();

    // Emergency keywords
    if (
      lowerMessage.includes('emergency') ||
      lowerMessage.includes('urgent') ||
      lowerMessage.includes('911') ||
      lowerMessage.includes('ambulance')
    ) {
      return { type: INTENT_TYPES.EMERGENCY, confidence: 0.95 };
    }

    // Visit status
    if (lowerMessage.includes('visit') && lowerMessage.includes('today')) {
      return { type: INTENT_TYPES.ASK_TODAY_VISIT, confidence: 0.9 };
    }

    if (lowerMessage.includes('how was') || lowerMessage.includes('how did')) {
      return { type: INTENT_TYPES.ASK_VISIT_STATUS, confidence: 0.85 };
    }

    // Schedule changes
    if (
      lowerMessage.includes('change') ||
      lowerMessage.includes('reschedule') ||
      lowerMessage.includes('cancel')
    ) {
      return { type: INTENT_TYPES.REQUEST_SCHEDULE_CHANGE, confidence: 0.8 };
    }

    // Medication questions
    if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
      return { type: INTENT_TYPES.ASK_MEDICATION, confidence: 0.85 };
    }

    // Care plan questions
    if (lowerMessage.includes('care plan') || lowerMessage.includes('treatment')) {
      return { type: INTENT_TYPES.ASK_CARE_PLAN, confidence: 0.85 };
    }

    // Feedback
    if (
      lowerMessage.includes('feedback') ||
      lowerMessage.includes('rating') ||
      lowerMessage.includes('complaint')
    ) {
      return { type: INTENT_TYPES.PROVIDE_FEEDBACK, confidence: 0.8 };
    }

    return { type: INTENT_TYPES.GENERAL_QUESTION, confidence: 0.5 };
  }

  /**
   * Determine if message should be escalated to human
   */
  private shouldEscalate(intent: IntentClassification, message: string): boolean {
    // Always escalate emergencies
    if (intent.type === INTENT_TYPES.EMERGENCY) return true;

    // Escalate low-confidence responses
    if (intent.confidence < 0.6) return true;

    // Escalate complaints or negative sentiment
    const negativeKeywords = [
      'complaint',
      'unhappy',
      'terrible',
      'awful',
      'unacceptable',
      'angry',
      'frustrated',
    ];
    if (negativeKeywords.some((kw) => message.toLowerCase().includes(kw))) return true;

    return false;
  }

  /**
   * Escalate to human coordinator
   */
  private async escalateToHuman(
    familyMember: FamilyMember,
    message: string,
    intent: IntentClassification,
    context: UserContext
  ): Promise<void> {
    // Create a message for coordinators to see
    await this.messageRepository.create(
      {
        organizationId: familyMember.organizationId,
        clientId: familyMember.clientId,
        senderType: 'FAMILY',
        senderId: familyMember.id,
        messageText: message,
        messageType: 'TEXT',
        requiresResponse: true,
        priority: intent.type === INTENT_TYPES.EMERGENCY ? 'URGENT' : 'HIGH',
      },
      context
    );

    // Log the escalation
    await this.aiConversationRepository.create(
      {
        organizationId: familyMember.organizationId,
        familyMemberId: familyMember.id,
        clientId: familyMember.clientId,
        sessionId: '', // Will be set by caller
        userMessage: message,
        aiResponse: 'Escalated to human coordinator',
        detectedIntent: intent.type,
        confidenceScore: intent.confidence,
        escalatedToHuman: true,
        escalationReason: `Intent: ${intent.type}, Confidence: ${intent.confidence}`,
      },
      context
    );
  }

  /**
   * Get context for family member (stub - would integrate with other verticals)
   */
  private async getContextForFamily(
    familyMember: FamilyMember,
    context: UserContext
  ): Promise<ChatbotContext> {
    // TODO: Integrate with other verticals to fetch real data
    // For now, return mock data structure

    const clientContext: ClientContext = {
      clientId: familyMember.clientId,
      name: 'Client Name', // Would fetch from client-demographics vertical
      age: 75,
      conditions: ['Diabetes', 'Hypertension'],
    };

    const recentVisits: VisitContext[] = [];
    const todayVisits: VisitContext[] = [];
    const carePlan: CarePlanContext | undefined = undefined;

    return {
      client: clientContext,
      recentVisits,
      todayVisits,
      carePlan,
    };
  }

  /**
   * Format date helper
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format time helper
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    sessionId: string,
    limit = 50
  ): Promise<Array<{ userMessage: string; aiResponse: string; createdAt: Date }>> {
    const conversations = await this.aiConversationRepository.findBySessionId(
      sessionId,
      limit
    );

    return conversations.map((c) => ({
      userMessage: c.userMessage,
      aiResponse: c.aiResponse,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Get analytics: intent distribution
   */
  async getIntentStats(dateFrom?: Date, dateTo?: Date) {
    return this.aiConversationRepository.getIntentStats(dateFrom, dateTo);
  }
}
