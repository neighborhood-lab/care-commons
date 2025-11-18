/**
 * Webhooks Routes
 * 
 * Handles incoming webhooks from external services (Stripe, etc.)
 */

import express, { Request, Response } from 'express';
import { getDatabase, BillingRepository, createEmailService, createStripeService } from '@care-commons/core';

const router = express.Router();

/**
 * Stripe webhook handler
 * 
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Handle Stripe webhook events
 *     description: Processes webhook events from Stripe for subscription management
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               type:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or payload
 *       500:
 *         description: Error processing webhook
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];
  
  if (typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    const payload = req.body.toString();
    
    // Verify webhook signature
    const stripeService = createStripeService();
    const isValid = stripeService.verifyWebhookSignature(payload, signature);
    
    if (!isValid) {
      console.error('[Webhook] Invalid Stripe signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Parse the JSON body
    const event = JSON.parse(payload);
    
    console.log(`[Webhook] Received Stripe event: ${event.type}`);

    const db = getDatabase();
    const billingRepo = new BillingRepository(db);
    const emailService = createEmailService();

    // Check if billing tables exist
    const tablesExist = await billingRepo.checkTableExists();
    if (!tablesExist) {
      console.log('[Webhook] Billing tables not yet created, skipping webhook processing');
      return res.status(200).json({ received: true, skipped: true });
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, billingRepo);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, billingRepo);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, billingRepo, emailService);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, billingRepo, emailService);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, billingRepo, emailService);
        break;
      
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object, billingRepo, emailService);
        break;
      
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing Stripe webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(
  subscription: Record<string, unknown>,
  billingRepo: BillingRepository
): Promise<void> {
  console.log('[Webhook] Processing subscription.created');
  
  // The subscription should already be created by the signup flow
  // This is just a confirmation
  const stripeSubId = subscription.id as string;
  const existing = await billingRepo.getSubscriptionByStripeId(stripeSubId);
  
  if (existing !== null) {
    console.log('[Webhook] Subscription already exists, skipping creation');
  } else {
    console.warn('[Webhook] Subscription created in Stripe but not in database');
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(
  subscription: Record<string, unknown>,
  billingRepo: BillingRepository
): Promise<void> {
  console.log('[Webhook] Processing subscription.updated');
  
  const stripeSubId = subscription.id as string;
  const status = subscription.status as string;
  const currentPeriodStart = new Date((subscription.current_period_start as number) * 1000);
  const currentPeriodEnd = new Date((subscription.current_period_end as number) * 1000);
  
  const existing = await billingRepo.getSubscriptionByStripeId(stripeSubId);
  if (existing === null) {
    console.warn('[Webhook] Subscription not found in database:', stripeSubId);
    return;
  }

  // Update subscription status and period
  await billingRepo.updateSubscriptionStatus(
    existing.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status as any,
    existing.updatedBy,
    'Stripe webhook: subscription.updated'
  );

  await billingRepo.updateSubscriptionPeriod(
    existing.id,
    currentPeriodStart,
    currentPeriodEnd,
    existing.updatedBy
  );

  console.log('[Webhook] Subscription updated:', { id: existing.id, status });
}

/**
 * Handle subscription deleted/cancelled event
 */
async function handleSubscriptionDeleted(
  subscription: Record<string, unknown>,
  billingRepo: BillingRepository,
  _emailService: ReturnType<typeof createEmailService>
): Promise<void> {
  console.log('[Webhook] Processing subscription.deleted');
  
  const stripeSubId = subscription.id as string;
  const existing = await billingRepo.getSubscriptionByStripeId(stripeSubId);
  
  if (existing === null) {
    console.warn('[Webhook] Subscription not found in database:', stripeSubId);
    return;
  }

  await billingRepo.cancelSubscription(
    existing.id,
    existing.updatedBy,
    'Stripe webhook: subscription.deleted'
  );

  console.log('[Webhook] Subscription cancelled:', existing.id);

  // Future: Send cancellation email to organization admin
}

/**
 * Handle invoice paid event
 */
async function handleInvoicePaid(
  invoice: Record<string, unknown>,
  billingRepo: BillingRepository,
  _emailService: ReturnType<typeof createEmailService>
): Promise<void> {
  console.log('[Webhook] Processing invoice.paid');
  
  const stripeSubId = invoice.subscription;
  if (typeof stripeSubId !== 'string' || stripeSubId === '') {
    console.log('[Webhook] Invoice not associated with subscription, skipping');
    return;
  }

  const existing = await billingRepo.getSubscriptionByStripeId(stripeSubId);
  if (existing === null) {
    console.warn('[Webhook] Subscription not found for paid invoice:', stripeSubId);
    return;
  }

  // Update last invoice information
  // Note: In a full implementation, you'd update additional fields on the subscription
  console.log('[Webhook] Invoice paid for subscription:', existing.id);

  // Future: Send payment confirmation email and record in billing history
}

/**
 * Handle invoice payment failed event
 */
async function handleInvoicePaymentFailed(
  invoice: Record<string, unknown>,
  billingRepo: BillingRepository,
  _emailService: ReturnType<typeof createEmailService>
): Promise<void> {
  console.log('[Webhook] Processing invoice.payment_failed');
  
  const stripeSubId = invoice.subscription;
  if (typeof stripeSubId !== 'string' || stripeSubId === '') {
    console.log('[Webhook] Invoice not associated with subscription, skipping');
    return;
  }

  const existing = await billingRepo.getSubscriptionByStripeId(stripeSubId);
  if (existing === null) {
    console.warn('[Webhook] Subscription not found for failed payment:', stripeSubId);
    return;
  }

  // Update subscription to past_due if not already
  if (existing.status !== 'past_due') {
    await billingRepo.updateSubscriptionStatus(
      existing.id,
      'past_due',
      existing.updatedBy,
      'Stripe webhook: invoice.payment_failed'
    );
  }

  console.log('[Webhook] Payment failed for subscription:', existing.id);

  // Future: Send payment failed email with retry information
}

/**
 * Handle trial will end event (3 days before trial ends)
 */
async function handleTrialWillEnd(
  subscription: Record<string, unknown>,
  billingRepo: BillingRepository,
  _emailService: ReturnType<typeof createEmailService>
): Promise<void> {
  console.log('[Webhook] Processing customer.subscription.trial_will_end');
  
  const stripeSubId = subscription.id as string;
  const existing = await billingRepo.getSubscriptionByStripeId(stripeSubId);
  
  if (existing === null) {
    console.warn('[Webhook] Subscription not found:', stripeSubId);
    return;
  }

  console.log('[Webhook] Trial ending soon for subscription:', existing.id);

  // Future: Send trial ending reminder email
}

export default router;
