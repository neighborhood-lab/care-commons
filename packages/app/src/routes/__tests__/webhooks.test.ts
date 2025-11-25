/**
 * Webhooks Routes Tests
 *
 * Tests for Stripe webhook handling endpoints.
 */

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/redundant-type-aliases */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Type for Express Router stack layer
type RouterLayer = any;

// Mock services
const mockVerifyWebhookSignature = vi.fn();
const mockCheckTableExists = vi.fn();
const mockGetSubscriptionByStripeId = vi.fn();
const mockUpdateSubscriptionStatus = vi.fn();
const mockUpdateSubscriptionPeriod = vi.fn();
const mockCancelSubscription = vi.fn();

vi.mock('@care-commons/core', () => ({
  getDatabase: vi.fn(() => ({})),
  BillingRepository: vi.fn().mockImplementation(function () {
    return {
      checkTableExists: mockCheckTableExists,
      getSubscriptionByStripeId: mockGetSubscriptionByStripeId,
      updateSubscriptionStatus: mockUpdateSubscriptionStatus,
      updateSubscriptionPeriod: mockUpdateSubscriptionPeriod,
      cancelSubscription: mockCancelSubscription,
    };
  }),
  createEmailService: vi.fn(() => ({
    sendEmail: vi.fn(),
  })),
  createStripeService: vi.fn(() => ({
    verifyWebhookSignature: mockVerifyWebhookSignature,
  })),
}));

// Import after mocking
import webhooksRouter from '../webhooks.js';

// Helper to call Express route handlers
async function callHandler(handler: any, req: any, res: any) {
  const next = vi.fn();
  await handler(req, res, next);
}

// Shared helper to get Stripe handler from router
function getStripeHandler() {
  const route = (webhooksRouter.stack as RouterLayer[]).find(
    (layer: RouterLayer) => layer.route?.path === '/stripe'
  )!;
  // Get the last handler (after express.raw middleware)
  return route.route.stack[route.route.stack.length - 1].handle;
}

describe('Webhooks Routes', () => {
  beforeEach(() => {
    // Reset all mocks
    mockVerifyWebhookSignature.mockReset();
    mockCheckTableExists.mockReset();
    mockGetSubscriptionByStripeId.mockReset();
    mockUpdateSubscriptionStatus.mockReset();
    mockUpdateSubscriptionPeriod.mockReset();
    mockCancelSubscription.mockReset();
  });

  describe('Router Configuration', () => {
    it('should create router with expected routes', () => {
      expect(webhooksRouter).toBeDefined();

      const routes = (webhooksRouter.stack as RouterLayer[])
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      expect(routes.length).toBeGreaterThan(0);
    });

    it('should have POST /stripe endpoint', () => {
      const routes = (webhooksRouter.stack as RouterLayer[])
        .filter((layer: RouterLayer) => layer.route)
        .map((layer: RouterLayer) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const stripeRoute = routes.find(
        (r: any) => r.path === '/stripe' && r.methods.includes('post')
      );
      expect(stripeRoute).toBeDefined();
    });
  });

  describe('POST /stripe', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      const req = {
        headers: {},
        body: Buffer.from('{}'),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing stripe-signature header' });
    });

    it('should return 401 when signature is invalid', async () => {
      mockVerifyWebhookSignature.mockReturnValue(false);

      const req = {
        headers: { 'stripe-signature': 'invalid_sig' },
        body: Buffer.from('{}'),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockVerifyWebhookSignature).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });

    it('should skip processing when billing tables do not exist', async () => {
      mockVerifyWebhookSignature.mockReturnValue(true);
      mockCheckTableExists.mockResolvedValue(false);

      const event = { type: 'customer.subscription.created', data: { object: {} } };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true, skipped: true });
    });

    it('should handle unrecognized event types', async () => {
      mockVerifyWebhookSignature.mockReturnValue(true);
      mockCheckTableExists.mockResolvedValue(true);

      const event = { type: 'unknown.event.type', data: { object: {} } };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should return 500 on processing error', async () => {
      mockVerifyWebhookSignature.mockReturnValue(true);
      mockCheckTableExists.mockRejectedValue(new Error('Database error'));

      const event = { type: 'customer.subscription.created', data: { object: {} } };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Webhook processing failed' });
    });
  });

  describe('Subscription Events', () => {
    beforeEach(() => {
      mockVerifyWebhookSignature.mockReturnValue(true);
      mockCheckTableExists.mockResolvedValue(true);
    });

    it('should handle customer.subscription.created event', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue({ id: 'sub-123' });

      const event = {
        type: 'customer.subscription.created',
        data: { object: { id: 'stripe_sub_123' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockGetSubscriptionByStripeId).toHaveBeenCalledWith('stripe_sub_123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle customer.subscription.updated event', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue({
        id: 'sub-123',
        updatedBy: 'user-1',
      });
      mockUpdateSubscriptionStatus.mockResolvedValue(null);
      mockUpdateSubscriptionPeriod.mockResolvedValue(null);

      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'stripe_sub_123',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          },
        },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockGetSubscriptionByStripeId).toHaveBeenCalledWith('stripe_sub_123');
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalled();
      expect(mockUpdateSubscriptionPeriod).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle customer.subscription.deleted event', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue({
        id: 'sub-123',
        updatedBy: 'user-1',
      });
      mockCancelSubscription.mockResolvedValue(null);

      const event = {
        type: 'customer.subscription.deleted',
        data: { object: { id: 'stripe_sub_123' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockCancelSubscription).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Invoice Events', () => {
    beforeEach(() => {
      mockVerifyWebhookSignature.mockReturnValue(true);
      mockCheckTableExists.mockResolvedValue(true);
    });

    it('should handle invoice.paid event', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue({ id: 'sub-123' });

      const event = {
        type: 'invoice.paid',
        data: { object: { subscription: 'stripe_sub_123' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockGetSubscriptionByStripeId).toHaveBeenCalledWith('stripe_sub_123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should skip invoice.paid without subscription', async () => {
      const event = {
        type: 'invoice.paid',
        data: { object: { subscription: '' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockGetSubscriptionByStripeId).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle invoice.payment_failed event', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue({
        id: 'sub-123',
        status: 'active',
        updatedBy: 'user-1',
      });
      mockUpdateSubscriptionStatus.mockResolvedValue(null);

      const event = {
        type: 'invoice.payment_failed',
        data: { object: { subscription: 'stripe_sub_123' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(
        'sub-123',
        'past_due',
        'user-1',
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should not update status if already past_due', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue({
        id: 'sub-123',
        status: 'past_due',
        updatedBy: 'user-1',
      });

      const event = {
        type: 'invoice.payment_failed',
        data: { object: { subscription: 'stripe_sub_123' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockUpdateSubscriptionStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Trial Events', () => {
    beforeEach(() => {
      mockVerifyWebhookSignature.mockReturnValue(true);
      mockCheckTableExists.mockResolvedValue(true);
    });

    it('should handle customer.subscription.trial_will_end event', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue({ id: 'sub-123' });

      const event = {
        type: 'customer.subscription.trial_will_end',
        data: { object: { id: 'stripe_sub_123' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockGetSubscriptionByStripeId).toHaveBeenCalledWith('stripe_sub_123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Missing Subscription Handling', () => {
    beforeEach(() => {
      mockVerifyWebhookSignature.mockReturnValue(true);
      mockCheckTableExists.mockResolvedValue(true);
    });

    it('should handle subscription.updated when subscription not found', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue(null);

      const event = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'unknown_sub',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          },
        },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockUpdateSubscriptionStatus).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle subscription.deleted when subscription not found', async () => {
      mockGetSubscriptionByStripeId.mockResolvedValue(null);

      const event = {
        type: 'customer.subscription.deleted',
        data: { object: { id: 'unknown_sub' } },
      };
      const req = {
        headers: { 'stripe-signature': 'valid_sig' },
        body: Buffer.from(JSON.stringify(event)),
      } as any;
      const res = { 
        json: vi.fn().mockReturnThis(), 
        status: vi.fn().mockReturnThis() 
      } as any;

      await callHandler(getStripeHandler(), req, res);

      expect(mockCancelSubscription).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
