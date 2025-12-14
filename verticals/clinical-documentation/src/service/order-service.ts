/**
 * Order Service
 *
 * Manages physician orders for home health clients.
 * Supports order lifecycle from receipt through completion.
 */

import { Pool } from 'pg';
import { UUID } from '@folkcare/core';
import { format } from 'date-fns';

// Enums
export type OrderType =
  | 'MEDICATION'
  | 'LAB_TEST'
  | 'DIAGNOSTIC'
  | 'THERAPY'
  | 'DME'
  | 'SUPPLIES'
  | 'REFERRAL'
  | 'DIET'
  | 'ACTIVITY'
  | 'WOUND_CARE'
  | 'VITAL_SIGNS'
  | 'NURSING_INTERVENTION'
  | 'OTHER';

export type OrderPriority = 'ROUTINE' | 'URGENT' | 'STAT';

export type OrderSource =
  | 'PHYSICIAN_OFFICE'
  | 'HOSPITAL_DISCHARGE'
  | 'PHONE_ORDER'
  | 'FAX'
  | 'PORTAL'
  | 'FACE_TO_FACE'
  | 'VERBAL'
  | 'COMMUNICATION'
  | 'OTHER';

export type OrderStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISCONTINUED'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'EXPIRED';

export type OrderHistoryAction =
  | 'CREATED'
  | 'VERIFIED'
  | 'ACKNOWLEDGED'
  | 'STARTED'
  | 'UPDATED'
  | 'COMPLETED'
  | 'DISCONTINUED'
  | 'CANCELLED'
  | 'ON_HOLD'
  | 'RESUMED'
  | 'EXPIRED'
  | 'NOTE_ADDED';

// Types
export interface Order {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  physicianId?: UUID;
  orderType: OrderType;
  priority: OrderPriority;
  orderNumber?: string;
  orderDescription: string;
  orderDetails?: string;
  icd10Codes?: string;
  clinicalIndication?: string;
  orderDate: Date;
  startDate?: Date;
  endDate?: Date;
  frequency?: string;
  duration?: string;
  orderSource: OrderSource;
  communicationId?: UUID;
  sourceDetails?: string;
  orderingPhysicianName: string;
  orderingPhysicianNpi?: string;
  orderingPhysicianPhone?: string;
  status: OrderStatus;
  statusReason?: string;
  requiresCosignature: boolean;
  isVerified: boolean;
  verifiedBy?: UUID;
  verifiedByName?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  requiresPhysicianSignature: boolean;
  physicianSigned: boolean;
  physicianSignedAt?: Date;
  signatureMethod?: string;
  enteredBy: UUID;
  enteredByName: string;
  enteredAt: Date;
  assignedTo?: UUID;
  assignedToName?: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: UUID;
  acknowledgedByName?: string;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: UUID;
  completedByName?: string;
  completionNotes?: string;
  discontinuedAt?: Date;
  discontinuedBy?: UUID;
  discontinuedByName?: string;
  discontinuationReason?: string;
  relatedVisitId?: UUID;
  medicationId?: UUID;
  carePlanTaskId?: UUID;
  clinicalNotes?: string;
  implementationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface OrderHistory {
  id: UUID;
  orderId: UUID;
  action: OrderHistoryAction;
  details?: string;
  changes?: Record<string, unknown>;
  performedBy: UUID;
  performedByName: string;
  performedAt: Date;
}

export interface OrderSet {
  id: UUID;
  organizationId: UUID;
  name: string;
  description?: string;
  category?: string;
  orders: OrderTemplate[];
  isActive: boolean;
  displayOrder: number;
  createdBy?: UUID;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderTemplate {
  orderType: OrderType;
  orderDescription: string;
  orderDetails?: string;
  frequency?: string;
  duration?: string;
  priority?: OrderPriority;
}

// Input types
export interface CreateOrderInput {
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  physicianId?: UUID;
  orderType: OrderType;
  priority?: OrderPriority;
  orderNumber?: string;
  orderDescription: string;
  orderDetails?: string;
  icd10Codes?: string;
  clinicalIndication?: string;
  orderDate: string;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  duration?: string;
  orderSource: OrderSource;
  communicationId?: UUID;
  sourceDetails?: string;
  orderingPhysicianName: string;
  orderingPhysicianNpi?: string;
  orderingPhysicianPhone?: string;
  requiresCosignature?: boolean;
  requiresPhysicianSignature?: boolean;
  enteredBy: UUID;
  enteredByName: string;
  clinicalNotes?: string;
}

export interface UpdateOrderInput {
  id: UUID;
  orderDetails?: string;
  frequency?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  clinicalNotes?: string;
  implementationNotes?: string;
}

export interface OrderSummary {
  totalOrders: number;
  pendingVerification: number;
  inProgress: number;
  completedThisMonth: number;
  statOrders: number;
  urgentOrders: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

// Row types
interface OrderRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  client_id: string;
  physician_id: string | null;
  order_type: OrderType;
  priority: OrderPriority;
  order_number: string | null;
  order_description: string;
  order_details: string | null;
  icd10_codes: string | null;
  clinical_indication: string | null;
  order_date: Date;
  start_date: Date | null;
  end_date: Date | null;
  frequency: string | null;
  duration: string | null;
  order_source: OrderSource;
  communication_id: string | null;
  source_details: string | null;
  ordering_physician_name: string;
  ordering_physician_npi: string | null;
  ordering_physician_phone: string | null;
  status: OrderStatus;
  status_reason: string | null;
  requires_cosignature: boolean;
  is_verified: boolean;
  verified_by: string | null;
  verified_by_name: string | null;
  verified_at: Date | null;
  verification_notes: string | null;
  requires_physician_signature: boolean;
  physician_signed: boolean;
  physician_signed_at: Date | null;
  signature_method: string | null;
  entered_by: string;
  entered_by_name: string;
  entered_at: Date;
  assigned_to: string | null;
  assigned_to_name: string | null;
  acknowledged_at: Date | null;
  acknowledged_by: string | null;
  acknowledged_by_name: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  completed_by: string | null;
  completed_by_name: string | null;
  completion_notes: string | null;
  discontinued_at: Date | null;
  discontinued_by: string | null;
  discontinued_by_name: string | null;
  discontinuation_reason: string | null;
  related_visit_id: string | null;
  medication_id: string | null;
  care_plan_task_id: string | null;
  clinical_notes: string | null;
  implementation_notes: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

interface OrderHistoryRow {
  id: string;
  order_id: string;
  action: OrderHistoryAction;
  details: string | null;
  changes: Record<string, unknown> | null;
  performed_by: string;
  performed_by_name: string;
  performed_at: Date;
}

interface OrderSetRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  orders: OrderTemplate[];
  is_active: boolean;
  display_order: number;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export class OrderService {
  constructor(private pool: Pool) {}

  // ==================== ORDERS ====================

  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    // Determine initial status based on source
    const requiresVerification =
      input.orderSource === 'VERBAL' || input.orderSource === 'PHONE_ORDER';
    const initialStatus: OrderStatus = requiresVerification
      ? 'PENDING_VERIFICATION'
      : 'VERIFIED';

    const result = await this.pool.query<OrderRow>(
      `INSERT INTO orders (
        organization_id, branch_id, client_id, physician_id,
        order_type, priority, order_number, order_description, order_details,
        icd10_codes, clinical_indication, order_date, start_date, end_date,
        frequency, duration, order_source, communication_id, source_details,
        ordering_physician_name, ordering_physician_npi, ordering_physician_phone,
        status, requires_cosignature, requires_physician_signature,
        entered_by, entered_by_name, clinical_notes, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        input.organizationId,
        input.branchId ?? null,
        input.clientId,
        input.physicianId ?? null,
        input.orderType,
        input.priority ?? 'ROUTINE',
        input.orderNumber ?? null,
        input.orderDescription,
        input.orderDetails ?? null,
        input.icd10Codes ?? null,
        input.clinicalIndication ?? null,
        input.orderDate,
        input.startDate ?? null,
        input.endDate ?? null,
        input.frequency ?? null,
        input.duration ?? null,
        input.orderSource,
        input.communicationId ?? null,
        input.sourceDetails ?? null,
        input.orderingPhysicianName,
        input.orderingPhysicianNpi ?? null,
        input.orderingPhysicianPhone ?? null,
        initialStatus,
        input.requiresCosignature ?? requiresVerification,
        input.requiresPhysicianSignature ?? requiresVerification,
        input.enteredBy,
        input.enteredByName,
        input.clinicalNotes ?? null,
        !requiresVerification,
      ]
    );

    const order = this.mapOrder(result.rows[0]!);

    // Log creation in history
    await this.addHistory(order.id, 'CREATED', input.enteredBy, input.enteredByName, 'Order created');

    return order;
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: UUID): Promise<Order | null> {
    const result = await this.pool.query<OrderRow>(
      `SELECT * FROM orders WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return result.rows[0] ? this.mapOrder(result.rows[0]) : null;
  }

  /**
   * Get orders for a client
   */
  async getClientOrders(
    clientId: UUID,
    options?: {
      status?: OrderStatus;
      orderType?: OrderType;
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Order[]> {
    const conditions = ['client_id = $1', 'is_deleted = false'];
    const values: unknown[] = [clientId];
    let paramCount = 1;

    if (options?.status) {
      paramCount++;
      conditions.push(`status = $${paramCount}`);
      values.push(options.status);
    }

    if (options?.orderType) {
      paramCount++;
      conditions.push(`order_type = $${paramCount}`);
      values.push(options.orderType);
    }

    if (options?.activeOnly) {
      conditions.push(`status NOT IN ('COMPLETED', 'DISCONTINUED', 'CANCELLED', 'EXPIRED')`);
    }

    let query = `SELECT * FROM orders WHERE ${conditions.join(' AND ')} ORDER BY priority DESC, order_date DESC`;

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
    }

    const result = await this.pool.query<OrderRow>(query, values);
    return result.rows.map(this.mapOrder);
  }

  /**
   * Get pending verification orders
   */
  async getPendingVerification(organizationId: UUID): Promise<Order[]> {
    const result = await this.pool.query<OrderRow>(
      `SELECT * FROM orders
       WHERE organization_id = $1
         AND status = 'PENDING_VERIFICATION'
         AND is_deleted = false
       ORDER BY priority DESC, order_date ASC`,
      [organizationId]
    );
    return result.rows.map(this.mapOrder);
  }

  /**
   * Get STAT/urgent orders
   */
  async getUrgentOrders(organizationId: UUID): Promise<Order[]> {
    const result = await this.pool.query<OrderRow>(
      `SELECT * FROM orders
       WHERE organization_id = $1
         AND priority IN ('STAT', 'URGENT')
         AND status NOT IN ('COMPLETED', 'DISCONTINUED', 'CANCELLED', 'EXPIRED')
         AND is_deleted = false
       ORDER BY
         CASE WHEN priority = 'STAT' THEN 0 ELSE 1 END,
         order_date ASC`,
      [organizationId]
    );
    return result.rows.map(this.mapOrder);
  }

  /**
   * Verify an order
   */
  async verifyOrder(
    id: UUID,
    verifiedBy: UUID,
    verifiedByName: string,
    notes?: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        status = 'VERIFIED',
        is_verified = true,
        verified_by = $2,
        verified_by_name = $3,
        verified_at = NOW(),
        verification_notes = $4,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, verifiedBy, verifiedByName, notes ?? null]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'VERIFIED', verifiedBy, verifiedByName, notes ?? 'Order verified');
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Acknowledge an order
   */
  async acknowledgeOrder(
    id: UUID,
    acknowledgedBy: UUID,
    acknowledgedByName: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        status = 'ACKNOWLEDGED',
        acknowledged_by = $2,
        acknowledged_by_name = $3,
        acknowledged_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, acknowledgedBy, acknowledgedByName]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'ACKNOWLEDGED', acknowledgedBy, acknowledgedByName, 'Order acknowledged');
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Start order implementation
   */
  async startOrder(
    id: UUID,
    startedBy: UUID,
    startedByName: string,
    notes?: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        status = 'IN_PROGRESS',
        started_at = NOW(),
        implementation_notes = COALESCE(implementation_notes || E'\n', '') || $4,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, startedBy, startedByName, notes ? `[${format(new Date(), 'MMM d, yyyy')}] Started: ${notes}` : '']
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'STARTED', startedBy, startedByName, notes ?? 'Order implementation started');
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Complete an order
   */
  async completeOrder(
    id: UUID,
    completedBy: UUID,
    completedByName: string,
    notes?: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        status = 'COMPLETED',
        completed_at = NOW(),
        completed_by = $2,
        completed_by_name = $3,
        completion_notes = $4,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, completedBy, completedByName, notes ?? null]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'COMPLETED', completedBy, completedByName, notes ?? 'Order completed');
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Discontinue an order
   */
  async discontinueOrder(
    id: UUID,
    discontinuedBy: UUID,
    discontinuedByName: string,
    reason: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        status = 'DISCONTINUED',
        discontinued_at = NOW(),
        discontinued_by = $2,
        discontinued_by_name = $3,
        discontinuation_reason = $4,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, discontinuedBy, discontinuedByName, reason]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'DISCONTINUED', discontinuedBy, discontinuedByName, reason);
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Put order on hold
   */
  async holdOrder(
    id: UUID,
    heldBy: UUID,
    heldByName: string,
    reason: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        status = 'ON_HOLD',
        status_reason = $4,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, heldBy, heldByName, reason]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'ON_HOLD', heldBy, heldByName, reason);
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Resume order from hold
   */
  async resumeOrder(
    id: UUID,
    resumedBy: UUID,
    resumedByName: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        status = 'IN_PROGRESS',
        status_reason = NULL,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, resumedBy, resumedByName]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'RESUMED', resumedBy, resumedByName, 'Order resumed from hold');
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Assign order to staff
   */
  async assignOrder(
    id: UUID,
    assignedTo: UUID,
    assignedToName: string,
    assignedBy: UUID,
    assignedByName: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        assigned_to = $2,
        assigned_to_name = $3,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, assignedTo, assignedToName]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'UPDATED', assignedBy, assignedByName, `Assigned to ${assignedToName}`);
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Update order details
   */
  async updateOrder(
    input: UpdateOrderInput,
    updatedBy: UUID,
    updatedByName: string
  ): Promise<Order> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramCount = 0;

    if (input.orderDetails !== undefined) {
      paramCount++;
      setClauses.push(`order_details = $${paramCount}`);
      values.push(input.orderDetails);
    }
    if (input.frequency !== undefined) {
      paramCount++;
      setClauses.push(`frequency = $${paramCount}`);
      values.push(input.frequency);
    }
    if (input.duration !== undefined) {
      paramCount++;
      setClauses.push(`duration = $${paramCount}`);
      values.push(input.duration);
    }
    if (input.startDate !== undefined) {
      paramCount++;
      setClauses.push(`start_date = $${paramCount}`);
      values.push(input.startDate);
    }
    if (input.endDate !== undefined) {
      paramCount++;
      setClauses.push(`end_date = $${paramCount}`);
      values.push(input.endDate);
    }
    if (input.clinicalNotes !== undefined) {
      paramCount++;
      setClauses.push(`clinical_notes = $${paramCount}`);
      values.push(input.clinicalNotes);
    }
    if (input.implementationNotes !== undefined) {
      paramCount++;
      setClauses.push(`implementation_notes = $${paramCount}`);
      values.push(input.implementationNotes);
    }

    paramCount++;
    values.push(input.id);

    // Field names are from hardcoded map, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(input.id, 'UPDATED', updatedBy, updatedByName, 'Order details updated');
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Mark physician signature received
   */
  async markPhysicianSigned(
    id: UUID,
    signatureMethod: string,
    recordedBy: UUID,
    recordedByName: string
  ): Promise<Order> {
    const result = await this.pool.query<OrderRow>(
      `UPDATE orders SET
        physician_signed = true,
        physician_signed_at = NOW(),
        signature_method = $2,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, signatureMethod]
    );

    if (!result.rows[0]) {
      throw new Error('Order not found');
    }

    await this.addHistory(id, 'UPDATED', recordedBy, recordedByName, `Physician signature received: ${signatureMethod}`);
    return this.mapOrder(result.rows[0]);
  }

  /**
   * Soft delete an order
   */
  async deleteOrder(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // ==================== HISTORY ====================

  /**
   * Add history entry
   */
  private async addHistory(
    orderId: UUID,
    action: OrderHistoryAction,
    performedBy: UUID,
    performedByName: string,
    details?: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO order_history (order_id, action, details, changes, performed_by, performed_by_name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, action, details ?? null, changes ? JSON.stringify(changes) : null, performedBy, performedByName]
    );
  }

  /**
   * Get order history
   */
  async getOrderHistory(orderId: UUID): Promise<OrderHistory[]> {
    const result = await this.pool.query<OrderHistoryRow>(
      `SELECT * FROM order_history WHERE order_id = $1 ORDER BY performed_at DESC`,
      [orderId]
    );
    return result.rows.map(this.mapOrderHistory);
  }

  // ==================== ORDER SETS ====================

  /**
   * Get order sets
   */
  async getOrderSets(
    organizationId: UUID,
    category?: string
  ): Promise<OrderSet[]> {
    if (category) {
      const result = await this.pool.query<OrderSetRow>(
        `SELECT * FROM order_sets
         WHERE organization_id = $1 AND category = $2 AND is_active = true
         ORDER BY display_order, name`,
        [organizationId, category]
      );
      return result.rows.map(this.mapOrderSet);
    }

    const result = await this.pool.query<OrderSetRow>(
      `SELECT * FROM order_sets
       WHERE organization_id = $1 AND is_active = true
       ORDER BY category, display_order, name`,
      [organizationId]
    );
    return result.rows.map(this.mapOrderSet);
  }

  /**
   * Create order set
   */
  async createOrderSet(input: {
    organizationId: UUID;
    name: string;
    description?: string;
    category?: string;
    orders: OrderTemplate[];
    createdBy?: UUID;
  }): Promise<OrderSet> {
    const result = await this.pool.query<OrderSetRow>(
      `INSERT INTO order_sets (organization_id, name, description, category, orders, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.category ?? null,
        JSON.stringify(input.orders),
        input.createdBy ?? null,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapOrderSet(result.rows[0]!);
  }

  /**
   * Create orders from order set
   */
  async createOrdersFromSet(
    orderSetId: UUID,
    clientId: UUID,
    physicianId: UUID | undefined,
    orderingPhysicianName: string,
    enteredBy: UUID,
    enteredByName: string,
    organizationId: UUID,
    branchId?: UUID
  ): Promise<Order[]> {
    const orderSet = await this.pool.query<OrderSetRow>(
      `SELECT * FROM order_sets WHERE id = $1`,
      [orderSetId]
    );

    if (!orderSet.rows[0]) {
      throw new Error('Order set not found');
    }

    const templates = orderSet.rows[0].orders;
    const orders: Order[] = [];

    for (const template of templates) {
      const order = await this.createOrder({
        organizationId,
        branchId,
        clientId,
        physicianId,
        orderType: template.orderType,
        priority: template.priority ?? 'ROUTINE',
        orderDescription: template.orderDescription,
        orderDetails: template.orderDetails,
        frequency: template.frequency,
        duration: template.duration,
        orderDate: format(new Date(), 'yyyy-MM-dd'),
        orderSource: 'PHYSICIAN_OFFICE',
        orderingPhysicianName,
        enteredBy,
        enteredByName,
      });
      orders.push(order);
    }

    return orders;
  }

  // ==================== SUMMARY ====================

  /**
   * Get order summary for organization
   */
  async getOrderSummary(organizationId: UUID): Promise<OrderSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total orders
    const totalResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    // Pending verification
    const pendingResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders
       WHERE organization_id = $1 AND is_deleted = false AND status = 'PENDING_VERIFICATION'`,
      [organizationId]
    );

    // In progress
    const inProgressResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders
       WHERE organization_id = $1 AND is_deleted = false AND status = 'IN_PROGRESS'`,
      [organizationId]
    );

    // Completed this month
    const completedResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders
       WHERE organization_id = $1 AND is_deleted = false
         AND status = 'COMPLETED' AND completed_at >= $2`,
      [organizationId, monthStart]
    );

    // STAT orders
    const statResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders
       WHERE organization_id = $1 AND is_deleted = false
         AND priority = 'STAT'
         AND status NOT IN ('COMPLETED', 'DISCONTINUED', 'CANCELLED', 'EXPIRED')`,
      [organizationId]
    );

    // Urgent orders
    const urgentResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders
       WHERE organization_id = $1 AND is_deleted = false
         AND priority = 'URGENT'
         AND status NOT IN ('COMPLETED', 'DISCONTINUED', 'CANCELLED', 'EXPIRED')`,
      [organizationId]
    );

    // By type
    const typeResult = await this.pool.query<{ order_type: string; count: string }>(
      `SELECT order_type, COUNT(*) as count FROM orders
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY order_type`,
      [organizationId]
    );

    // By status
    const statusResult = await this.pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM orders
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY status`,
      [organizationId]
    );

    const byType: Record<string, number> = {};
    for (const row of typeResult.rows) {
      byType[row.order_type] = parseInt(row.count, 10);
    }

    const byStatus: Record<string, number> = {};
    for (const row of statusResult.rows) {
      byStatus[row.status] = parseInt(row.count, 10);
    }

    // COUNT(*) queries always return a row
    return {
      totalOrders: parseInt(totalResult.rows[0]!.count, 10),
      pendingVerification: parseInt(pendingResult.rows[0]!.count, 10),
      inProgress: parseInt(inProgressResult.rows[0]!.count, 10),
      completedThisMonth: parseInt(completedResult.rows[0]!.count, 10),
      statOrders: parseInt(statResult.rows[0]!.count, 10),
      urgentOrders: parseInt(urgentResult.rows[0]!.count, 10),
      byType,
      byStatus,
    };
  }

  /**
   * Generate printable order list for client
   */
  generateOrderReport(clientName: string, orders: Order[]): string {
    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push('PHYSICIAN ORDERS');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Client: ${clientName}`);
    lines.push(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`);
    lines.push('');

    if (orders.length === 0) {
      lines.push('No orders on file.');
      return lines.join('\n');
    }

    // Group by status
    const active = orders.filter(
      (o) => !['COMPLETED', 'DISCONTINUED', 'CANCELLED', 'EXPIRED'].includes(o.status)
    );
    const completed = orders.filter((o) => o.status === 'COMPLETED');
    const discontinued = orders.filter(
      (o) => ['DISCONTINUED', 'CANCELLED', 'EXPIRED'].includes(o.status)
    );

    if (active.length > 0) {
      lines.push('-'.repeat(60));
      lines.push('ACTIVE ORDERS');
      lines.push('-'.repeat(60));
      for (const order of active) {
        this.formatOrderForReport(order, lines);
      }
    }

    if (completed.length > 0) {
      lines.push('');
      lines.push('-'.repeat(60));
      lines.push('COMPLETED ORDERS');
      lines.push('-'.repeat(60));
      for (const order of completed) {
        this.formatOrderForReport(order, lines);
      }
    }

    if (discontinued.length > 0) {
      lines.push('');
      lines.push('-'.repeat(60));
      lines.push('DISCONTINUED/CANCELLED ORDERS');
      lines.push('-'.repeat(60));
      for (const order of discontinued) {
        this.formatOrderForReport(order, lines);
      }
    }

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('END OF REPORT');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  private formatOrderForReport(order: Order, lines: string[]): void {
    lines.push('');
    const priorityMarker = order.priority === 'STAT' ? '[STAT] ' : order.priority === 'URGENT' ? '[URGENT] ' : '';
    lines.push(`${priorityMarker}${order.orderType.replace(/_/g, ' ')}: ${order.orderDescription}`);
    lines.push(`  Order Date: ${format(order.orderDate, 'MMM d, yyyy')}`);
    lines.push(`  Ordering Physician: ${order.orderingPhysicianName}`);
    lines.push(`  Status: ${order.status.replace(/_/g, ' ')}`);
    if (order.frequency) {
      lines.push(`  Frequency: ${order.frequency}`);
    }
    if (order.duration) {
      lines.push(`  Duration: ${order.duration}`);
    }
    if (order.orderDetails) {
      lines.push(`  Details: ${order.orderDetails}`);
    }
  }

  // ==================== MAPPING ====================

  private mapOrder(row: OrderRow): Order {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id ?? undefined,
      clientId: row.client_id,
      physicianId: row.physician_id ?? undefined,
      orderType: row.order_type,
      priority: row.priority,
      orderNumber: row.order_number ?? undefined,
      orderDescription: row.order_description,
      orderDetails: row.order_details ?? undefined,
      icd10Codes: row.icd10_codes ?? undefined,
      clinicalIndication: row.clinical_indication ?? undefined,
      orderDate: row.order_date,
      startDate: row.start_date ?? undefined,
      endDate: row.end_date ?? undefined,
      frequency: row.frequency ?? undefined,
      duration: row.duration ?? undefined,
      orderSource: row.order_source,
      communicationId: row.communication_id ?? undefined,
      sourceDetails: row.source_details ?? undefined,
      orderingPhysicianName: row.ordering_physician_name,
      orderingPhysicianNpi: row.ordering_physician_npi ?? undefined,
      orderingPhysicianPhone: row.ordering_physician_phone ?? undefined,
      status: row.status,
      statusReason: row.status_reason ?? undefined,
      requiresCosignature: row.requires_cosignature,
      isVerified: row.is_verified,
      verifiedBy: row.verified_by ?? undefined,
      verifiedByName: row.verified_by_name ?? undefined,
      verifiedAt: row.verified_at ?? undefined,
      verificationNotes: row.verification_notes ?? undefined,
      requiresPhysicianSignature: row.requires_physician_signature,
      physicianSigned: row.physician_signed,
      physicianSignedAt: row.physician_signed_at ?? undefined,
      signatureMethod: row.signature_method ?? undefined,
      enteredBy: row.entered_by,
      enteredByName: row.entered_by_name,
      enteredAt: row.entered_at,
      assignedTo: row.assigned_to ?? undefined,
      assignedToName: row.assigned_to_name ?? undefined,
      acknowledgedAt: row.acknowledged_at ?? undefined,
      acknowledgedBy: row.acknowledged_by ?? undefined,
      acknowledgedByName: row.acknowledged_by_name ?? undefined,
      startedAt: row.started_at ?? undefined,
      completedAt: row.completed_at ?? undefined,
      completedBy: row.completed_by ?? undefined,
      completedByName: row.completed_by_name ?? undefined,
      completionNotes: row.completion_notes ?? undefined,
      discontinuedAt: row.discontinued_at ?? undefined,
      discontinuedBy: row.discontinued_by ?? undefined,
      discontinuedByName: row.discontinued_by_name ?? undefined,
      discontinuationReason: row.discontinuation_reason ?? undefined,
      relatedVisitId: row.related_visit_id ?? undefined,
      medicationId: row.medication_id ?? undefined,
      carePlanTaskId: row.care_plan_task_id ?? undefined,
      clinicalNotes: row.clinical_notes ?? undefined,
      implementationNotes: row.implementation_notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted,
    };
  }

  private mapOrderHistory(row: OrderHistoryRow): OrderHistory {
    return {
      id: row.id,
      orderId: row.order_id,
      action: row.action,
      details: row.details ?? undefined,
      changes: row.changes ?? undefined,
      performedBy: row.performed_by,
      performedByName: row.performed_by_name,
      performedAt: row.performed_at,
    };
  }

  private mapOrderSet(row: OrderSetRow): OrderSet {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      orders: row.orders,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdBy: row.created_by ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
