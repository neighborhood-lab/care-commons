import { z } from 'zod';

// Message Role
export const messageRoleSchema = z.enum(['user', 'assistant', 'system']);

// Chat Context
export const chatContextSchema = z.object({
  clientInfo: z.boolean().optional(),
  carePlan: z.boolean().optional(),
  recentVisits: z.boolean().optional(),
  medications: z.boolean().optional(),
  documents: z.array(z.string().uuid()).optional(),
});

export type ChatContextSchema = z.infer<typeof chatContextSchema>;

// Send Message Input
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)'),
  includeContext: z
    .object({
      carePlan: z.boolean().optional(),
      recentVisits: z.boolean().optional(),
      medications: z.boolean().optional(),
    })
    .optional(),
});

export type SendMessageSchema = z.infer<typeof sendMessageSchema>;

// Create Conversation
export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export type CreateConversationSchema = z.infer<typeof createConversationSchema>;

// Update Conversation
export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateConversationSchema = z.infer<typeof updateConversationSchema>;

// Emergency Category
export const emergencyCategorySchema = z.enum([
  'MEDICAL_EMERGENCY',
  'SAFETY_CONCERN',
  'MEDICATION_ISSUE',
  'URGENT_QUESTION',
  'NONE',
]);

// Chatbot Provider Config
export const chatbotProviderSchema = z.enum(['anthropic', 'openai']);

export const chatbotConfigSchema = z.object({
  provider: chatbotProviderSchema,
  model: z.string(),
  maxTokens: z.number().int().min(100).max(4096),
  temperature: z.number().min(0).max(2),
  systemPrompt: z.string(),
  features: z.object({
    contextAwareness: z.boolean(),
    careplanAccess: z.boolean(),
    visitHistory: z.boolean(),
    medicationInfo: z.boolean(),
    documentSearch: z.boolean(),
    emergencyDetection: z.boolean(),
  }),
  rateLimit: z.object({
    messagesPerHour: z.number().int().min(1).max(100),
    messagesPerDay: z.number().int().min(1).max(500),
    maxConversationLength: z.number().int().min(10).max(200),
  }),
});

export type ChatbotConfigSchema = z.infer<typeof chatbotConfigSchema>;

// Message Query Params
export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional(),
});

export type GetMessagesQuerySchema = z.infer<typeof getMessagesQuerySchema>;

// Conversation Query Params
export const getConversationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().optional(),
});

export type GetConversationsQuerySchema = z.infer<typeof getConversationsQuerySchema>;
