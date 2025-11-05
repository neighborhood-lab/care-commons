import { z } from 'zod';

// Base schemas
export const familyPermissionSchema = z.enum([
  'VIEW_PROFILE',
  'VIEW_CARE_PLAN',
  'VIEW_VISITS',
  'VIEW_NOTES',
  'VIEW_MEDICATIONS',
  'VIEW_DOCUMENTS',
  'RECEIVE_NOTIFICATIONS',
  'USE_CHATBOT',
  'REQUEST_UPDATES',
  'MESSAGE_STAFF',
]);

export const familyAccessLevelSchema = z.enum(['BASIC', 'STANDARD', 'FULL']);

export const familyMemberStatusSchema = z.enum([
  'INVITED',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'REVOKED',
]);

export const familyMemberPreferencesSchema = z.object({
  language: z.string().default('en'),
  timezone: z.string().default('America/New_York'),
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  dashboardLayout: z.string().optional(),
});

export const notificationSettingsSchema = z.object({
  email: z.object({
    enabled: z.boolean().default(true),
    careUpdates: z.boolean().default(true),
    visitReminders: z.boolean().default(true),
    emergencyAlerts: z.boolean().default(true),
    chatMessages: z.boolean().default(false),
  }),
  sms: z.object({
    enabled: z.boolean().default(false),
    emergencyOnly: z.boolean().default(true),
  }),
  push: z.object({
    enabled: z.boolean().default(false),
    careUpdates: z.boolean().default(false),
    chatMessages: z.boolean().default(false),
  }),
});

// Create Family Member
export const createFamilyMemberSchema = z.object({
  organizationId: z.string().uuid(),
  clientId: z.string().uuid(),
  authorizedContactId: z.string().uuid(),
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  relationship: z.string().min(1).max(100),
  phone: z.string().optional(),
  permissions: z.array(familyPermissionSchema).min(1),
  accessLevel: familyAccessLevelSchema,
});

export type CreateFamilyMemberSchema = z.infer<typeof createFamilyMemberSchema>;

// Update Family Member
export const updateFamilyMemberSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  preferences: familyMemberPreferencesSchema.partial().optional(),
  notificationSettings: notificationSettingsSchema.partial().optional(),
});

export type UpdateFamilyMemberSchema = z.infer<typeof updateFamilyMemberSchema>;

// Create Invitation
export const createInvitationSchema = z.object({
  organizationId: z.string().uuid(),
  clientId: z.string().uuid(),
  authorizedContactId: z.string().uuid(),
  email: z.string().email(),
  permissions: z.array(familyPermissionSchema).min(1),
  accessLevel: familyAccessLevelSchema,
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>;

// Accept Invitation
export const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  preferences: familyMemberPreferencesSchema.partial().optional(),
});

export type AcceptInvitationSchema = z.infer<typeof acceptInvitationSchema>;

// Login
export const familyLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type FamilyLoginSchema = z.infer<typeof familyLoginSchema>;

// Password Reset Request
export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export type PasswordResetRequestSchema = z.infer<typeof passwordResetRequestSchema>;

// Password Reset
export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type PasswordResetSchema = z.infer<typeof passwordResetSchema>;

// Change Password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

// Update Permissions
export const updatePermissionsSchema = z.object({
  permissions: z.array(familyPermissionSchema).min(1),
  accessLevel: familyAccessLevelSchema,
});

export type UpdatePermissionsSchema = z.infer<typeof updatePermissionsSchema>;
