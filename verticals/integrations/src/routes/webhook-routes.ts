import type { Router, Request, Response, NextFunction } from 'express';
import type { WebhookService } from '../services/webhook-service.js';
import { CreateWebhookSchema, UpdateWebhookSchema } from '../types/webhook.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

type AsyncHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Wrapper for async route handlers
const asyncHandler =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req as AuthenticatedRequest, res, next).catch((error: unknown) => {
      next(error);
    });
  };

export function createWebhookRoutes(
  router: Router,
  webhookService: WebhookService
): Router {
  // List webhooks
  router.get(
    '/webhooks',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string | undefined;
      const event = req.query.event as string | undefined;

      const webhooks = await webhookService.listWebhooks(organizationId, {
        status,
        event,
      });

      // Don't expose secrets in list response
      const sanitizedWebhooks = webhooks.map((w) => ({
        ...w,
        secret: undefined,
      }));

      res.json({ webhooks: sanitizedWebhooks });
    })
  );

  // Create webhook
  router.post(
    '/webhooks',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      const userId = req.user?.id;
      if (!organizationId || !userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parseResult = CreateWebhookSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.issues,
        });
        return;
      }

      const webhook = await webhookService.createWebhook(
        organizationId,
        userId,
        parseResult.data
      );

      // Return full webhook including secret on creation
      res.status(201).json({ webhook });
    })
  );

  // Get webhook by ID
  router.get(
    '/webhooks/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const webhookId = req.params.id as string;

      const webhook = await webhookService.getWebhookById(
        webhookId,
        organizationId
      );

      if (!webhook) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      // Don't expose secret in get response
      res.json({ webhook: { ...webhook, secret: undefined } });
    })
  );

  // Update webhook
  router.patch(
    '/webhooks/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const webhookId = req.params.id as string;

      const parseResult = UpdateWebhookSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.issues,
        });
        return;
      }

      const webhook = await webhookService.updateWebhook(
        webhookId,
        organizationId,
        parseResult.data
      );

      if (!webhook) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.json({ webhook: { ...webhook, secret: undefined } });
    })
  );

  // Delete webhook
  router.delete(
    '/webhooks/:id',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const webhookId = req.params.id as string;

      const deleted = await webhookService.deleteWebhook(
        webhookId,
        organizationId
      );

      if (!deleted) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.status(204).send();
    })
  );

  // Regenerate webhook secret
  router.post(
    '/webhooks/:id/regenerate-secret',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const webhookId = req.params.id as string;

      const secret = await webhookService.regenerateSecret(
        webhookId,
        organizationId
      );

      if (!secret) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.json({ secret });
    })
  );

  // Get webhook delivery history
  router.get(
    '/webhooks/:id/deliveries',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const webhookId = req.params.id as string;

      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const status = req.query.status as string | undefined;

      const deliveries = await webhookService.getDeliveryHistory(
        webhookId,
        organizationId,
        {
          limit,
          offset,
          status: status as 'pending' | 'delivered' | 'failed' | 'retrying' | undefined,
        }
      );

      res.json({ deliveries });
    })
  );

  // Get specific delivery
  router.get(
    '/webhooks/:webhookId/deliveries/:deliveryId',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const deliveryId = req.params.deliveryId as string;

      const delivery = await webhookService.getDeliveryById(
        deliveryId,
        organizationId
      );

      if (!delivery) {
        res.status(404).json({ error: 'Delivery not found' });
        return;
      }

      res.json({ delivery });
    })
  );

  // Retry failed delivery
  router.post(
    '/webhooks/:webhookId/deliveries/:deliveryId/retry',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const deliveryId = req.params.deliveryId as string;

      const success = await webhookService.retryDelivery(
        deliveryId,
        organizationId
      );

      if (!success) {
        res.status(400).json({
          error: 'Cannot retry delivery. It may not exist or is already in progress.',
        });
        return;
      }

      res.json({ message: 'Retry initiated' });
    })
  );

  // Get webhook statistics
  router.get(
    '/webhooks/:id/stats',
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const webhookId = req.params.id as string;

      const stats = await webhookService.getWebhookStats(
        webhookId,
        organizationId
      );

      if (!stats) {
        res.status(404).json({ error: 'Webhook not found' });
        return;
      }

      res.json({ stats });
    })
  );

  return router;
}
