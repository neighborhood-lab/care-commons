import crypto from 'node:crypto';
import type { Knex } from 'knex';
import type {
  Webhook,
  WebhookDelivery,
  WebhookEventPayload,
  WebhookStats,
  CreateWebhookInput,
  UpdateWebhookInput,
  DeliveryStatus,
} from '../types/webhook.js';

interface WebhookServiceDependencies {
  db: Knex;
}

export class WebhookService {
  private db: Knex;

  constructor({ db }: WebhookServiceDependencies) {
    this.db = db;
  }

  // ============================================================================
  // Webhook CRUD Operations
  // ============================================================================

  async createWebhook(
    organizationId: string,
    userId: string,
    input: CreateWebhookInput
  ): Promise<Webhook> {
    const secret = this.generateSecret();
    const id = crypto.randomUUID();

    const webhook: Partial<Webhook> = {
      id,
      organizationId,
      name: input.name,
      url: input.url,
      secret,
      events: input.events,
      description: input.description,
      headers: input.headers,
      status: 'active',
      retryPolicy: input.retryPolicy ?? {
        maxRetries: 3,
        retryDelayMs: 5000,
        exponentialBackoff: true,
      },
      createdBy: userId,
      successCount: 0,
      failureCount: 0,
    };

    await this.db('webhooks').insert({
      id: webhook.id,
      organization_id: webhook.organizationId,
      name: webhook.name,
      url: webhook.url,
      secret: webhook.secret,
      events: JSON.stringify(webhook.events),
      description: webhook.description,
      headers: webhook.headers ? JSON.stringify(webhook.headers) : null,
      status: webhook.status,
      retry_policy: JSON.stringify(webhook.retryPolicy),
      created_by: webhook.createdBy,
      success_count: webhook.successCount,
      failure_count: webhook.failureCount,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.getWebhookById(id, organizationId) as Promise<Webhook>;
  }

  async getWebhookById(
    id: string,
    organizationId: string
  ): Promise<Webhook | null> {
    const row = await this.db('webhooks')
      .where({ id, organization_id: organizationId, is_deleted: false })
      .first();

    return row ? this.mapRowToWebhook(row) : null;
  }

  async listWebhooks(
    organizationId: string,
    options?: { status?: string; event?: string }
  ): Promise<Webhook[]> {
    let query = this.db('webhooks')
      .where({ organization_id: organizationId, is_deleted: false })
      .orderBy('created_at', 'desc');

    if (options?.status) {
      query = query.where('status', options.status);
    }

    const rows = await query;

    // Filter by event if specified
    let webhooks = rows.map((row: Record<string, unknown>) => this.mapRowToWebhook(row));
    if (options?.event) {
      webhooks = webhooks.filter((w: Webhook) => w.events.includes(options.event!));
    }

    return webhooks;
  }

  async updateWebhook(
    id: string,
    organizationId: string,
    input: UpdateWebhookInput
  ): Promise<Webhook | null> {
    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (input.name !== undefined) updates.name = input.name;
    if (input.url !== undefined) updates.url = input.url;
    if (input.events !== undefined) updates.events = JSON.stringify(input.events);
    if (input.description !== undefined) updates.description = input.description;
    if (input.headers !== undefined)
      updates.headers = JSON.stringify(input.headers);
    if (input.status !== undefined) updates.status = input.status;
    if (input.retryPolicy !== undefined)
      updates.retry_policy = JSON.stringify(input.retryPolicy);

    await this.db('webhooks')
      .where({ id, organization_id: organizationId, is_deleted: false })
      .update(updates);

    return this.getWebhookById(id, organizationId);
  }

  async deleteWebhook(id: string, organizationId: string): Promise<boolean> {
    const result = await this.db('webhooks')
      .where({ id, organization_id: organizationId })
      .update({ is_deleted: true, updated_at: new Date() });

    return result > 0;
  }

  async regenerateSecret(
    id: string,
    organizationId: string
  ): Promise<string | null> {
    const newSecret = this.generateSecret();

    const result = await this.db('webhooks')
      .where({ id, organization_id: organizationId, is_deleted: false })
      .update({ secret: newSecret, updated_at: new Date() });

    return result > 0 ? newSecret : null;
  }

  // ============================================================================
  // Event Triggering
  // ============================================================================

  async triggerEvent<T extends Record<string, unknown>>(
    organizationId: string,
    eventType: string,
    data: T,
    metadata?: { triggeredBy?: string; correlationId?: string; source?: string }
  ): Promise<string[]> {
    // Find all active webhooks subscribed to this event
    const webhooks = await this.listWebhooks(organizationId, {
      status: 'active',
      event: eventType,
    });

    if (webhooks.length === 0) {
      return [];
    }

    const eventId = crypto.randomUUID();
    const deliveryIds: string[] = [];

    // Create delivery records for each webhook
    for (const webhook of webhooks) {
      const payload: WebhookEventPayload = {
        id: eventId,
        type: eventType as WebhookEventPayload['type'],
        timestamp: new Date().toISOString(),
        organizationId,
        data,
        metadata,
      };

      const deliveryId = await this.createDelivery(webhook.id, eventType, eventId, payload);
      deliveryIds.push(deliveryId);

      // Queue for async delivery (in production, use a job queue)
      // For now, we'll deliver synchronously but not block on response
      this.deliverWebhook(webhook, deliveryId, payload).catch((error) => {
        console.error(`Failed to deliver webhook ${webhook.id}:`, error);
      });
    }

    return deliveryIds;
  }

  // ============================================================================
  // Webhook Delivery
  // ============================================================================

  private async createDelivery(
    webhookId: string,
    eventType: string,
    eventId: string,
    payload: WebhookEventPayload
  ): Promise<string> {
    const id = crypto.randomUUID();

    await this.db('webhook_deliveries').insert({
      id,
      webhook_id: webhookId,
      event_type: eventType,
      event_id: eventId,
      payload: JSON.stringify(payload),
      status: 'pending',
      attempts: 0,
      created_at: new Date(),
    });

    return id;
  }

  private async deliverWebhook(
    webhook: Webhook,
    deliveryId: string,
    payload: WebhookEventPayload
  ): Promise<void> {
    const startTime = Date.now();
    let attempts = 1;
    let lastError: Error | null = null;

    const maxRetries = webhook.retryPolicy.maxRetries;
    const baseDelay = webhook.retryPolicy.retryDelayMs;
    const useExponentialBackoff = webhook.retryPolicy.exponentialBackoff;

    while (attempts <= maxRetries + 1) {
      try {
        // Update delivery status to retrying if not first attempt
        if (attempts > 1) {
          await this.updateDeliveryStatus(deliveryId, 'retrying', {
            attempts,
            lastAttemptAt: new Date(),
          });
        }

        const signature = this.signPayload(payload, webhook.secret);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature.signature,
          'X-Webhook-Timestamp': signature.timestamp.toString(),
          'X-Webhook-Event': payload.type,
          'X-Webhook-Delivery-Id': deliveryId,
          ...webhook.headers,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const fetchOptions = {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await fetch(webhook.url, fetchOptions as any);

        clearTimeout(timeoutId);

        const responseTimeMs = Date.now() - startTime;
        const responseBody = await response.text();

        if (response.ok) {
          // Success!
          await this.updateDeliveryStatus(deliveryId, 'delivered', {
            attempts,
            responseStatus: response.status,
            responseBody: responseBody.slice(0, 1000), // Truncate long responses
            responseTimeMs,
            deliveredAt: new Date(),
            lastAttemptAt: new Date(),
          });

          // Update webhook success count
          await this.incrementWebhookCounter(webhook.id, 'success');
          return;
        }

        // Non-2xx response - treat as failure
        lastError = new Error(`HTTP ${response.status}: ${responseBody}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }

      // Should we retry?
      if (attempts <= maxRetries) {
        const delay = useExponentialBackoff
          ? baseDelay * Math.pow(2, attempts - 1)
          : baseDelay;

        await this.updateDeliveryStatus(deliveryId, 'retrying', {
          attempts,
          nextRetryAt: new Date(Date.now() + delay),
          errorMessage: lastError?.message,
          lastAttemptAt: new Date(),
        });

        await this.sleep(delay);
        attempts++;
      } else {
        break;
      }
    }

    // All retries exhausted - mark as failed
    await this.updateDeliveryStatus(deliveryId, 'failed', {
      attempts,
      errorMessage: lastError?.message,
      responseTimeMs: Date.now() - startTime,
      lastAttemptAt: new Date(),
    });

    // Update webhook failure count
    await this.incrementWebhookCounter(webhook.id, 'failure');
  }

  private async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    updates: Partial<{
      attempts: number;
      lastAttemptAt: Date;
      nextRetryAt: Date;
      responseStatus: number;
      responseBody: string;
      responseTimeMs: number;
      errorMessage: string;
      deliveredAt: Date;
    }>
  ): Promise<void> {
    const dbUpdates: Record<string, unknown> = { status };

    if (updates.attempts !== undefined) dbUpdates.attempts = updates.attempts;
    if (updates.lastAttemptAt) dbUpdates.last_attempt_at = updates.lastAttemptAt;
    if (updates.nextRetryAt) dbUpdates.next_retry_at = updates.nextRetryAt;
    if (updates.responseStatus !== undefined)
      dbUpdates.response_status = updates.responseStatus;
    if (updates.responseBody !== undefined)
      dbUpdates.response_body = updates.responseBody;
    if (updates.responseTimeMs !== undefined)
      dbUpdates.response_time_ms = updates.responseTimeMs;
    if (updates.errorMessage !== undefined)
      dbUpdates.error_message = updates.errorMessage;
    if (updates.deliveredAt) dbUpdates.delivered_at = updates.deliveredAt;

    await this.db('webhook_deliveries').where({ id: deliveryId }).update(dbUpdates);
  }

  private async incrementWebhookCounter(
    webhookId: string,
    type: 'success' | 'failure'
  ): Promise<void> {
    const column = type === 'success' ? 'success_count' : 'failure_count';
    await this.db('webhooks')
      .where({ id: webhookId })
      .increment(column, 1)
      .update({ last_triggered_at: new Date() });
  }

  // ============================================================================
  // Delivery History
  // ============================================================================

  async getDeliveryHistory(
    webhookId: string,
    organizationId: string,
    options?: { limit?: number; offset?: number; status?: DeliveryStatus }
  ): Promise<WebhookDelivery[]> {
    // Verify webhook belongs to organization
    const webhook = await this.getWebhookById(webhookId, organizationId);
    if (!webhook) {
      return [];
    }

    let query = this.db('webhook_deliveries')
      .where({ webhook_id: webhookId })
      .orderBy('created_at', 'desc')
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    if (options?.status) {
      query = query.where('status', options.status);
    }

    const rows = await query;
    return rows.map((row: Record<string, unknown>) => this.mapRowToDelivery(row));
  }

  async getDeliveryById(
    deliveryId: string,
    organizationId: string
  ): Promise<WebhookDelivery | null> {
    const row = await this.db('webhook_deliveries as wd')
      .join('webhooks as w', 'wd.webhook_id', 'w.id')
      .where({ 'wd.id': deliveryId, 'w.organization_id': organizationId })
      .select('wd.*')
      .first();

    return row ? this.mapRowToDelivery(row) : null;
  }

  async retryDelivery(
    deliveryId: string,
    organizationId: string
  ): Promise<boolean> {
    const delivery = await this.getDeliveryById(deliveryId, organizationId);
    if (!delivery || delivery.status === 'pending' || delivery.status === 'retrying') {
      return false;
    }

    const webhook = await this.db('webhooks')
      .where({ id: delivery.webhookId, organization_id: organizationId, is_deleted: false })
      .first();

    if (!webhook) {
      return false;
    }

    // Reset delivery status and re-deliver
    await this.updateDeliveryStatus(deliveryId, 'pending', {});

    const webhookObj = this.mapRowToWebhook(webhook);
    this.deliverWebhook(
      webhookObj,
      deliveryId,
      delivery.payload as unknown as WebhookEventPayload
    ).catch((error) => {
      console.error(`Failed to retry delivery ${deliveryId}:`, error);
    });

    return true;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  async getWebhookStats(
    webhookId: string,
    organizationId: string
  ): Promise<WebhookStats | null> {
    const webhook = await this.getWebhookById(webhookId, organizationId);
    if (!webhook) {
      return null;
    }

    const stats = await this.db('webhook_deliveries')
      .where({ webhook_id: webhookId })
      .select(
        this.db.raw('COUNT(*) as total_deliveries'),
        this.db.raw("COUNT(*) FILTER (WHERE status = 'delivered') as successful_deliveries"),
        this.db.raw("COUNT(*) FILTER (WHERE status = 'failed') as failed_deliveries"),
        this.db.raw('AVG(response_time_ms) as avg_response_time_ms'),
        this.db.raw('MAX(delivered_at) as last_success_at'),
        this.db.raw("MAX(last_attempt_at) FILTER (WHERE status = 'failed') as last_failure_at")
      )
      .first();

    return {
      webhookId,
      totalDeliveries: Number(stats?.total_deliveries) || 0,
      successfulDeliveries: Number(stats?.successful_deliveries) || 0,
      failedDeliveries: Number(stats?.failed_deliveries) || 0,
      averageResponseTimeMs: Number(stats?.avg_response_time_ms) || 0,
      lastDeliveryAt: webhook.lastTriggeredAt,
      lastSuccessAt: stats?.last_success_at ? new Date(stats.last_success_at) : undefined,
      lastFailureAt: stats?.last_failure_at ? new Date(stats.last_failure_at) : undefined,
    };
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private generateSecret(): string {
    return `whsec_${crypto.randomBytes(32).toString('hex')}`;
  }

  signPayload(
    payload: WebhookEventPayload,
    secret: string
  ): { timestamp: number; signature: string } {
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signaturePayload = `${timestamp}.${payloadString}`;

    const signature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload)
      .digest('hex');

    return { timestamp, signature: `v1=${signature}` };
  }

  verifySignature(
    payload: string,
    signature: string,
    timestamp: number,
    secret: string,
    toleranceSeconds = 300
  ): boolean {
    // Check timestamp is within tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    // Verify signature
    const signaturePayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signaturePayload)
      .digest('hex');

    const expectedFull = `v1=${expectedSignature}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedFull)
    );
  }

  private mapRowToWebhook(row: Record<string, unknown>): Webhook {
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      name: row.name as string,
      url: row.url as string,
      secret: row.secret as string,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events as string[],
      description: row.description as string | undefined,
      headers: row.headers
        ? typeof row.headers === 'string'
          ? JSON.parse(row.headers)
          : row.headers
        : undefined,
      status: row.status as Webhook['status'],
      retryPolicy:
        typeof row.retry_policy === 'string'
          ? JSON.parse(row.retry_policy)
          : (row.retry_policy as Webhook['retryPolicy']),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      createdBy: row.created_by as string,
      lastTriggeredAt: row.last_triggered_at
        ? new Date(row.last_triggered_at as string)
        : undefined,
      successCount: Number(row.success_count) || 0,
      failureCount: Number(row.failure_count) || 0,
    };
  }

  private mapRowToDelivery(row: Record<string, unknown>): WebhookDelivery {
    return {
      id: row.id as string,
      webhookId: row.webhook_id as string,
      eventType: row.event_type as string,
      eventId: row.event_id as string,
      payload:
        typeof row.payload === 'string'
          ? JSON.parse(row.payload)
          : (row.payload as Record<string, unknown>),
      status: row.status as DeliveryStatus,
      attempts: Number(row.attempts) || 0,
      lastAttemptAt: row.last_attempt_at
        ? new Date(row.last_attempt_at as string)
        : undefined,
      nextRetryAt: row.next_retry_at
        ? new Date(row.next_retry_at as string)
        : undefined,
      responseStatus: row.response_status
        ? Number(row.response_status)
        : undefined,
      responseBody: row.response_body as string | undefined,
      responseTimeMs: row.response_time_ms
        ? Number(row.response_time_ms)
        : undefined,
      errorMessage: row.error_message as string | undefined,
      createdAt: new Date(row.created_at as string),
      deliveredAt: row.delivered_at
        ? new Date(row.delivered_at as string)
        : undefined,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
