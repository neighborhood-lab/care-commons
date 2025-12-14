/**
 * Order API Routes
 *
 * Endpoints for managing physician orders
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { OrderService } from '../service/order-service.js';

const orderTypes = [
  'MEDICATION',
  'LAB_TEST',
  'DIAGNOSTIC',
  'THERAPY',
  'DME',
  'SUPPLIES',
  'REFERRAL',
  'DIET',
  'ACTIVITY',
  'WOUND_CARE',
  'VITAL_SIGNS',
  'NURSING_INTERVENTION',
  'OTHER',
] as const;

const priorities = ['ROUTINE', 'URGENT', 'STAT'] as const;

const orderSources = [
  'PHYSICIAN_OFFICE',
  'HOSPITAL_DISCHARGE',
  'PHONE_ORDER',
  'FAX',
  'PORTAL',
  'FACE_TO_FACE',
  'VERBAL',
  'COMMUNICATION',
  'OTHER',
] as const;

const statuses = [
  'PENDING_VERIFICATION',
  'VERIFIED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'COMPLETED',
  'DISCONTINUED',
  'ON_HOLD',
  'CANCELLED',
  'EXPIRED',
] as const;

/**
 * Create order routes
 */
export function createOrderRoutes(pool: Pool): Router {
  const router = Router();
  const orderService = new OrderService(pool);

  // ==================== ORDERS ====================

  /**
   * Create a new order
   * POST /api/orders
   */
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          branchId: z.string().uuid().optional(),
          clientId: z.string().uuid(),
          physicianId: z.string().uuid().optional(),
          orderType: z.enum(orderTypes),
          priority: z.enum(priorities).optional(),
          orderNumber: z.string().max(50).optional(),
          orderDescription: z.string().min(1),
          orderDetails: z.string().optional(),
          icd10Codes: z.string().max(200).optional(),
          clinicalIndication: z.string().optional(),
          orderDate: z.string().refine((d) => !isNaN(Date.parse(d))),
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          frequency: z.string().max(100).optional(),
          duration: z.string().max(100).optional(),
          orderSource: z.enum(orderSources),
          communicationId: z.string().uuid().optional(),
          sourceDetails: z.string().optional(),
          orderingPhysicianName: z.string().min(1).max(200),
          orderingPhysicianNpi: z.string().max(10).optional(),
          orderingPhysicianPhone: z.string().max(20).optional(),
          requiresCosignature: z.boolean().optional(),
          requiresPhysicianSignature: z.boolean().optional(),
          enteredByName: z.string().min(1).max(200),
          clinicalNotes: z.string().optional(),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const order = await orderService.createOrder({
          organizationId,
          branchId: data.branchId,
          clientId: data.clientId,
          physicianId: data.physicianId,
          orderType: data.orderType,
          priority: data.priority,
          orderNumber: data.orderNumber,
          orderDescription: data.orderDescription,
          orderDetails: data.orderDetails,
          icd10Codes: data.icd10Codes,
          clinicalIndication: data.clinicalIndication,
          orderDate: data.orderDate,
          startDate: data.startDate,
          endDate: data.endDate,
          frequency: data.frequency,
          duration: data.duration,
          orderSource: data.orderSource,
          communicationId: data.communicationId,
          sourceDetails: data.sourceDetails,
          orderingPhysicianName: data.orderingPhysicianName,
          orderingPhysicianNpi: data.orderingPhysicianNpi,
          orderingPhysicianPhone: data.orderingPhysicianPhone,
          requiresCosignature: data.requiresCosignature,
          requiresPhysicianSignature: data.requiresPhysicianSignature,
          enteredBy: userId,
          enteredByName: data.enteredByName,
          clinicalNotes: data.clinicalNotes,
        });

        res.status(201).json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get order by ID
   * GET /api/orders/:orderId
   */
  router.get(
    '/:orderId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });

        const { orderId } = paramsSchema.parse(req.params);

        const order = await orderService.getOrderById(orderId);

        if (!order) {
          res.status(404).json({ error: 'Order not found' });
          return;
        }

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get orders for a client
   * GET /api/orders/client/:clientId
   */
  router.get(
    '/client/:clientId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          status: z.enum(statuses).optional(),
          orderType: z.enum(orderTypes).optional(),
          activeOnly: z.coerce.boolean().optional(),
          limit: z.coerce.number().min(1).max(100).optional(),
          offset: z.coerce.number().min(0).optional(),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { status, orderType, activeOnly, limit, offset } = querySchema.parse(req.query);

        const orders = await orderService.getClientOrders(clientId, {
          status,
          orderType,
          activeOnly,
          limit,
          offset,
        });

        res.json({ clientId, orders, count: orders.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get pending verification orders
   * GET /api/orders/pending-verification/organization
   */
  router.get(
    '/pending-verification/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const orders = await orderService.getPendingVerification(organizationId);

        res.json({ orders, count: orders.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get urgent orders
   * GET /api/orders/urgent/organization
   */
  router.get(
    '/urgent/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const orders = await orderService.getUrgentOrders(organizationId);

        res.json({ orders, count: orders.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Update order details
   * PATCH /api/orders/:orderId
   */
  router.patch(
    '/:orderId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          orderDetails: z.string().optional(),
          frequency: z.string().max(100).optional(),
          duration: z.string().max(100).optional(),
          startDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          endDate: z.string().refine((d) => !isNaN(Date.parse(d))).optional(),
          clinicalNotes: z.string().optional(),
          implementationNotes: z.string().optional(),
          updatedByName: z.string().min(1).max(200),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const data = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.updateOrder(
          {
            id: orderId,
            orderDetails: data.orderDetails,
            frequency: data.frequency,
            duration: data.duration,
            startDate: data.startDate,
            endDate: data.endDate,
            clinicalNotes: data.clinicalNotes,
            implementationNotes: data.implementationNotes,
          },
          userId,
          data.updatedByName
        );

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Delete an order
   * DELETE /api/orders/:orderId
   */
  router.delete(
    '/:orderId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });

        const { orderId } = paramsSchema.parse(req.params);

        await orderService.deleteOrder(orderId);

        res.json({ success: true, message: 'Order deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== ORDER LIFECYCLE ====================

  /**
   * Verify an order
   * POST /api/orders/:orderId/verify
   */
  router.post(
    '/:orderId/verify',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          verifiedByName: z.string().min(1).max(200),
          notes: z.string().optional(),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { verifiedByName, notes } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.verifyOrder(orderId, userId, verifiedByName, notes);

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Acknowledge an order
   * POST /api/orders/:orderId/acknowledge
   */
  router.post(
    '/:orderId/acknowledge',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          acknowledgedByName: z.string().min(1).max(200),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { acknowledgedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.acknowledgeOrder(orderId, userId, acknowledgedByName);

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Start order implementation
   * POST /api/orders/:orderId/start
   */
  router.post(
    '/:orderId/start',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          startedByName: z.string().min(1).max(200),
          notes: z.string().optional(),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { startedByName, notes } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.startOrder(orderId, userId, startedByName, notes);

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Complete an order
   * POST /api/orders/:orderId/complete
   */
  router.post(
    '/:orderId/complete',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          completedByName: z.string().min(1).max(200),
          notes: z.string().optional(),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { completedByName, notes } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.completeOrder(orderId, userId, completedByName, notes);

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Discontinue an order
   * POST /api/orders/:orderId/discontinue
   */
  router.post(
    '/:orderId/discontinue',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          discontinuedByName: z.string().min(1).max(200),
          reason: z.string().min(1),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { discontinuedByName, reason } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.discontinueOrder(orderId, userId, discontinuedByName, reason);

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Put order on hold
   * POST /api/orders/:orderId/hold
   */
  router.post(
    '/:orderId/hold',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          heldByName: z.string().min(1).max(200),
          reason: z.string().min(1),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { heldByName, reason } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.holdOrder(orderId, userId, heldByName, reason);

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Resume order from hold
   * POST /api/orders/:orderId/resume
   */
  router.post(
    '/:orderId/resume',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          resumedByName: z.string().min(1).max(200),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { resumedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.resumeOrder(orderId, userId, resumedByName);

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Assign order to staff
   * POST /api/orders/:orderId/assign
   */
  router.post(
    '/:orderId/assign',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          assignedTo: z.string().uuid(),
          assignedToName: z.string().min(1).max(200),
          assignedByName: z.string().min(1).max(200),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { assignedTo, assignedToName, assignedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.assignOrder(
          orderId,
          assignedTo,
          assignedToName,
          userId,
          assignedByName
        );

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Mark physician signature received
   * POST /api/orders/:orderId/physician-signed
   */
  router.post(
    '/:orderId/physician-signed',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });
        const bodySchema = z.object({
          signatureMethod: z.string().min(1).max(200),
          recordedByName: z.string().min(1).max(200),
        });

        const { orderId } = paramsSchema.parse(req.params);
        const { signatureMethod, recordedByName } = bodySchema.parse(req.body);
        const { userId } = req.user as { userId: string };

        const order = await orderService.markPhysicianSigned(
          orderId,
          signatureMethod,
          userId,
          recordedByName
        );

        res.json(order);
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== HISTORY ====================

  /**
   * Get order history
   * GET /api/orders/:orderId/history
   */
  router.get(
    '/:orderId/history',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          orderId: z.string().uuid(),
        });

        const { orderId } = paramsSchema.parse(req.params);

        const history = await orderService.getOrderHistory(orderId);

        res.json({ orderId, history, count: history.length });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== ORDER SETS ====================

  /**
   * Get order sets
   * GET /api/orders/sets/organization
   */
  router.get(
    '/sets/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const querySchema = z.object({
          category: z.string().max(100).optional(),
        });

        const { category } = querySchema.parse(req.query);
        const { organizationId } = req.user as { organizationId: string };

        const orderSets = await orderService.getOrderSets(organizationId, category);

        res.json({ orderSets, count: orderSets.length });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create an order set
   * POST /api/orders/sets
   */
  router.post(
    '/sets',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const orderTemplateSchema = z.object({
          orderType: z.enum(orderTypes),
          orderDescription: z.string().min(1),
          orderDetails: z.string().optional(),
          frequency: z.string().max(100).optional(),
          duration: z.string().max(100).optional(),
          priority: z.enum(priorities).optional(),
        });

        const bodySchema = z.object({
          name: z.string().min(1).max(200),
          description: z.string().optional(),
          category: z.string().max(100).optional(),
          orders: z.array(orderTemplateSchema).min(1),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const orderSet = await orderService.createOrderSet({
          organizationId,
          name: data.name,
          description: data.description,
          category: data.category,
          orders: data.orders,
          createdBy: userId,
        });

        res.status(201).json(orderSet);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Create orders from order set
   * POST /api/orders/from-set
   */
  router.post(
    '/from-set',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const bodySchema = z.object({
          orderSetId: z.string().uuid(),
          clientId: z.string().uuid(),
          branchId: z.string().uuid().optional(),
          physicianId: z.string().uuid().optional(),
          orderingPhysicianName: z.string().min(1).max(200),
          enteredByName: z.string().min(1).max(200),
        });

        const data = bodySchema.parse(req.body);
        const { organizationId, userId } = req.user as {
          organizationId: string;
          userId: string;
        };

        const orders = await orderService.createOrdersFromSet(
          data.orderSetId,
          data.clientId,
          data.physicianId,
          data.orderingPhysicianName,
          userId,
          data.enteredByName,
          organizationId,
          data.branchId
        );

        res.status(201).json({ orders, count: orders.length });
      } catch (error) {
        next(error);
      }
    }
  );

  // ==================== SUMMARY ====================

  /**
   * Get order summary
   * GET /api/orders/summary/organization
   */
  router.get(
    '/summary/organization',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { organizationId } = req.user as { organizationId: string };

        const summary = await orderService.getOrderSummary(organizationId);

        res.json(summary);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Generate printable order report for client
   * GET /api/orders/client/:clientId/report
   */
  router.get(
    '/client/:clientId/report',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const paramsSchema = z.object({
          clientId: z.string().uuid(),
        });
        const querySchema = z.object({
          clientName: z.string().min(1),
        });

        const { clientId } = paramsSchema.parse(req.params);
        const { clientName } = querySchema.parse(req.query);

        const orders = await orderService.getClientOrders(clientId);
        const report = orderService.generateOrderReport(clientName, orders);

        res.setHeader('Content-Type', 'text/plain');
        res.send(report);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
