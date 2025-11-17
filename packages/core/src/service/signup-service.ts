/**
 * Signup Service
 * 
 * Handles public organization registration with:
 * - Organization creation
 * - Admin user creation
 * - Subscription initialization (trial period)
 * - Email verification workflow
 * - Welcome email sending
 */

import { randomBytes } from 'crypto';
import { Database } from '../db/connection.js';
import { OrganizationService } from './organization-service.js';
import { BillingRepository } from '../repository/billing-repository.js';
import { createEmailService } from './email-service.js';
import { UUID, ValidationError } from '../types/base.js';
import { CreateOrganizationRequest, USStateCode } from '../types/organization.js';

export interface SignupRequest {
  // Organization details
  organizationName: string;
  organizationEmail: string;
  organizationPhone?: string;
  stateCode: string;
  
  // Admin user details
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string;
  
  // Subscription plan
  planName?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  
  // Optional Stripe payment method (can be added later)
  stripePaymentMethodId?: string;
}

export interface SignupResult {
  organizationId: UUID;
  adminUserId: UUID;
  subscriptionId: UUID;
  verificationToken: string;
  message: string;
}

/**
 * Default plan limits for trial subscriptions
 */
const PLAN_LIMITS = {
  STARTER: {
    clientLimit: 25,
    caregiverLimit: 10,
    visitLimit: 500,
    amount: 99.00,
  },
  PROFESSIONAL: {
    clientLimit: 100,
    caregiverLimit: 50,
    visitLimit: 2000,
    amount: 299.00,
  },
  ENTERPRISE: {
    clientLimit: 500,
    caregiverLimit: 250,
    visitLimit: null, // Unlimited
    amount: 999.00,
  },
};

/**
 * Signup Service
 * 
 * Orchestrates the complete signup workflow including organization creation,
 * subscription initialization, and email verification.
 */
export class SignupService {
  private orgService: OrganizationService;
  private billingRepo: BillingRepository;
  private emailService: ReturnType<typeof createEmailService>;
  
  constructor(private db: Database) {
    this.orgService = new OrganizationService(db);
    this.billingRepo = new BillingRepository(db);
    this.emailService = createEmailService();
  }
  
  /**
   * Register a new organization with trial subscription
   * 
   * This is a transactional operation that:
   * 1. Creates organization and admin user
   * 2. Creates trial subscription
   * 3. Generates email verification token
   * 4. Sends welcome email
   */
  async registerOrganization(request: SignupRequest): Promise<SignupResult> {
    // Validate input
    this.validateSignupRequest(request);
    
    // Default to STARTER plan if not specified
    const planName = request.planName ?? 'STARTER';
    const planLimits = PLAN_LIMITS[planName];
    
    // Execute within transaction
    return await this.db.transaction(async () => {
      // Step 1: Create organization and admin user
      const orgRequest: CreateOrganizationRequest = {
        name: request.organizationName,
        email: request.organizationEmail,
        phone: request.organizationPhone,
        stateCode: request.stateCode as USStateCode,
        primaryAddress: {
          street1: '',
          city: '',
          state: request.stateCode as USStateCode,
          zipCode: '',
          country: 'USA',
        },
        adminUser: {
          firstName: request.adminFirstName,
          lastName: request.adminLastName,
          email: request.adminEmail,
          password: request.adminPassword,
          phone: request.adminPhone,
        },
      };
      
      const orgResult = await this.orgService.registerOrganization(orgRequest);
      
      // Step 2: Check if subscription tables exist
      const tablesExist = await this.billingRepo.checkTableExists();
      
      let subscriptionId: UUID;
      
      if (tablesExist) {
        // Step 3: Create trial subscription
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial
        
        const subscription = await this.billingRepo.createSubscription({
          organizationId: orgResult.organization.id,
          stripeCustomerId: `temp_customer_${orgResult.organization.id}`, // Temporary, will be replaced when Stripe customer is created
          stripeSubscriptionId: `temp_sub_${orgResult.organization.id}`, // Temporary
          stripePriceId: '', // Will be set when Stripe price is created
          planName,
          billingInterval: 'month',
          planAmount: planLimits.amount,
          clientLimit: planLimits.clientLimit,
          caregiverLimit: planLimits.caregiverLimit,
          visitLimit: planLimits.visitLimit ?? undefined,
          trialEnd,
          createdBy: orgResult.adminUserId,
        });
        
        subscriptionId = subscription.id;
      } else {
        // Subscriptions not yet implemented, use placeholder
        subscriptionId = '00000000-0000-0000-0000-000000000000' as UUID;
        console.warn('[SignupService] Subscription tables do not exist yet, skipping subscription creation');
      }
      
      // Step 4: Generate email verification token
      const verificationToken = this.generateVerificationToken();
      
      // Store verification token in user metadata (we'll add this field in a future migration)
      // For now, we'll return it to the caller to handle
      
      // Step 5: Send welcome email
      try {
        await this.emailService.sendWelcome({
          recipientEmail: request.adminEmail,
          recipientName: request.adminFirstName,
          organizationName: request.organizationName,
        });
      } catch (error) {
        console.error('[SignupService] Failed to send welcome email:', error);
        // Don't fail the signup if email fails
      }
      
      return {
        organizationId: orgResult.organization.id,
        adminUserId: orgResult.adminUserId,
        subscriptionId,
        verificationToken,
        message: 'Organization registered successfully. Please check your email to verify your account.',
      };
    });
  }
  
  /**
   * Validate signup request
   */
  private validateSignupRequest(request: SignupRequest): void {
    const errors: string[] = [];
    
    if (!request.organizationName || request.organizationName.trim().length === 0) {
      errors.push('Organization name is required');
    }
    
    if (!request.organizationEmail || !this.isValidEmail(request.organizationEmail)) {
      errors.push('Valid organization email is required');
    }
    
    if (!request.stateCode || request.stateCode.length !== 2) {
      errors.push('Valid 2-letter state code is required');
    }
    
    if (!request.adminFirstName || request.adminFirstName.trim().length === 0) {
      errors.push('Admin first name is required');
    }
    
    if (!request.adminLastName || request.adminLastName.trim().length === 0) {
      errors.push('Admin last name is required');
    }
    
    if (!request.adminEmail || !this.isValidEmail(request.adminEmail)) {
      errors.push('Valid admin email is required');
    }
    
    if (!request.adminPassword || request.adminPassword.length < 8) {
      errors.push('Admin password must be at least 8 characters');
    }
    
    if (errors.length > 0) {
      throw new ValidationError('Invalid signup request', { errors });
    }
  }
  
  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Generate secure verification token
   */
  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }
}
