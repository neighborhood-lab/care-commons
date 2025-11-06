/**
 * HTTP/API handlers for Inventory & Supplies Tracking
 *
 * RESTful endpoints for inventory management operations
 */

import { Request, Response, NextFunction, Router } from 'express';
import { UserContext } from '@care-commons/core';
import { InventoryService } from '../service/inventory-service.js';
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  RecordTransactionInput,
  InventorySearchFilters,
  InventoryItemStatus,
  InventoryCategory,
  TransactionType,
} from '../types/inventory.js';
import { InventoryValidator } from '../validation/inventory-validator.js';

/**
 * Extract user context from authenticated request
 */
function getUserContext(req: Request): UserContext {
  // In production, this would be populated by auth middleware
  return (req as Request & { userContext: UserContext }).userContext;
}

/**
 * Handle async route errors
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line promise/no-callback-in-promise
    void Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Inventory API handlers
 */
export class InventoryHandlers {
  private validator: InventoryValidator;

  constructor(private inventoryService: InventoryService) {
    this.validator = new InventoryValidator();
  }

  /**
   * GET /api/inventory/items
   * Search/list inventory items with pagination and filters
   */
  listItems = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const filters = this.buildSearchFilters(req);
    const pagination = this.buildPagination(req);

    const result = await this.inventoryService.searchInventoryItems(
      filters,
      pagination,
      context
    );

    res.json({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/inventory/items/:id
   * Get single inventory item by ID
   */
  getItem = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    const item = await this.inventoryService.getInventoryItem(id, context);

    return res.json({
      success: true,
      data: item,
    });
  });

  /**
   * POST /api/inventory/items
   * Create new inventory item
   */
  createItem = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: CreateInventoryItemInput = req.body;

    // Validate input
    const validation = this.validator.validateCreate(input);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    const item = await this.inventoryService.createInventoryItem(input, context);

    return res.status(201).json({
      success: true,
      data: item,
    });
  });

  /**
   * PUT /api/inventory/items/:id
   * Update inventory item
   */
  updateItem = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const updates: UpdateInventoryItemInput = req.body;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    // Validate input
    const validation = this.validator.validateUpdate(updates);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    const item = await this.inventoryService.updateInventoryItem(
      id,
      updates,
      context
    );

    return res.json({
      success: true,
      data: item,
    });
  });

  /**
   * DELETE /api/inventory/items/:id
   * Soft delete inventory item
   */
  deleteItem = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    await this.inventoryService.deleteInventoryItem(id, context);

    return res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  });

  /**
   * GET /api/inventory/items/:id/stock-levels
   * Get stock levels for an item
   */
  getStockLevels = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    const stockLevels = await this.inventoryService.getStockLevels(id, context);

    return res.json({
      success: true,
      data: stockLevels,
    });
  });

  /**
   * GET /api/inventory/items/:id/transactions
   * Get transaction history for an item
   */
  getTransactionHistory = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { id } = req.params;
    const { limit: limitParam } = req.query;

    if (typeof id !== 'string' || id === '') {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    const limit =
      typeof limitParam === 'string'
        ? parseInt(limitParam, 10)
        : 100;

    const transactions = await this.inventoryService.getTransactionHistory(
      id,
      limit,
      context
    );

    return res.json({
      success: true,
      data: transactions,
    });
  });

  /**
   * POST /api/inventory/transactions
   * Record inventory transaction
   */
  recordTransaction = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const input: RecordTransactionInput = req.body;

    // Validate input
    const validation = this.validator.validateTransaction(input);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors,
      });
    }

    const transaction = await this.inventoryService.recordTransaction(
      input,
      context
    );

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  /**
   * POST /api/inventory/usage
   * Record inventory usage (convenience endpoint)
   */
  recordUsage = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const {
      itemId,
      quantity,
      locationId,
      referenceType,
      referenceId,
      lotNumber,
      notes,
    } = req.body;

    if (!itemId || !quantity || !locationId) {
      return res.status(400).json({
        success: false,
        error: 'itemId, quantity, and locationId are required',
      });
    }

    const transaction = await this.inventoryService.recordUsage(
      itemId,
      quantity,
      locationId,
      { referenceType, referenceId, lotNumber, notes },
      context
    );

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  /**
   * POST /api/inventory/transfer
   * Transfer inventory between locations
   */
  transferInventory = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const {
      itemId,
      fromLocationId,
      toLocationId,
      quantity,
      lotNumber,
      reason,
      notes,
    } = req.body;

    if (!itemId || !fromLocationId || !toLocationId || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'itemId, fromLocationId, toLocationId, and quantity are required',
      });
    }

    const transaction = await this.inventoryService.transferInventory(
      itemId,
      fromLocationId,
      toLocationId,
      quantity,
      { lotNumber, reason, notes },
      context
    );

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  /**
   * POST /api/inventory/purchase
   * Record inventory purchase/receipt
   */
  recordPurchase = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const {
      itemId,
      quantity,
      locationId,
      unitCost,
      lotNumber,
      expirationDate,
      referenceId,
      notes,
    } = req.body;

    if (!itemId || !quantity || !locationId || !unitCost) {
      return res.status(400).json({
        success: false,
        error: 'itemId, quantity, locationId, and unitCost are required',
      });
    }

    const transaction = await this.inventoryService.recordPurchase(
      itemId,
      quantity,
      locationId,
      unitCost,
      {
        lotNumber,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        referenceId,
        notes,
      },
      context
    );

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  /**
   * POST /api/inventory/adjustment
   * Record inventory adjustment
   */
  recordAdjustment = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { itemId, quantity, locationId, reason } = req.body;

    if (!itemId || quantity === undefined || !locationId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'itemId, quantity, locationId, and reason are required',
      });
    }

    const transaction = await this.inventoryService.recordAdjustment(
      itemId,
      quantity,
      locationId,
      reason,
      context
    );

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  });

  /**
   * GET /api/inventory/alerts/low-stock
   * Get items below reorder point
   */
  getLowStockAlerts = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);

    const items = await this.inventoryService.getLowStockItems(context);

    return res.json({
      success: true,
      data: items,
    });
  });

  /**
   * GET /api/inventory/alerts/expiring
   * Get items expiring soon
   */
  getExpiringAlerts = asyncHandler(async (req: Request, res: Response) => {
    const context = getUserContext(req);
    const { days: daysParam } = req.query;

    const days =
      typeof daysParam === 'string'
        ? parseInt(daysParam, 10)
        : 30;

    const items = await this.inventoryService.getExpiringItems(days, context);

    return res.json({
      success: true,
      data: items,
    });
  });

  /**
   * Build search filters from request query parameters
   */
  private buildSearchFilters(req: Request): InventorySearchFilters {
    const {
      q,
      category: categoryParam,
      type: typeParam,
      status: statusParam,
      vendorId: vendorIdParam,
      lowStock: lowStockParam,
      outOfStock: outOfStockParam,
      locationId: locationIdParam,
    } = req.query;

    const filters: InventorySearchFilters = {
      query: q as string,
    };

    if (typeof categoryParam === 'string') {
      filters.category = categoryParam as InventoryCategory;
    }

    if (typeof typeParam === 'string') {
      filters.type = typeParam as any;
    }

    if (typeof statusParam === 'string') {
      const validStatuses: InventoryItemStatus[] = [
        'ACTIVE',
        'INACTIVE',
        'DISCONTINUED',
        'PENDING_APPROVAL',
      ];
      const filtered = statusParam
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => validStatuses.includes(s as InventoryItemStatus)) as InventoryItemStatus[];

      if (filtered.length > 0) {
        filters.status = filtered;
      }
    }

    if (typeof vendorIdParam === 'string') {
      filters.vendorId = vendorIdParam;
    }

    filters.lowStock = lowStockParam === 'true';
    filters.outOfStock = outOfStockParam === 'true';

    if (typeof locationIdParam === 'string') {
      filters.locationId = locationIdParam;
    }

    return filters;
  }

  /**
   * Build pagination parameters from request query
   */
  private buildPagination(req: Request): {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } {
    const {
      page: pageParam,
      limit: limitParam,
      sortBy: sortByParam,
      sortOrder: sortOrderParam,
    } = req.query;

    const parsedPage =
      typeof pageParam === 'string' ? parseInt(pageParam, 10) : NaN;
    const parsedLimit =
      typeof limitParam === 'string' ? parseInt(limitParam, 10) : NaN;

    return {
      page: !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1,
      limit: !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20,
      sortBy: typeof sortByParam === 'string' ? sortByParam : 'name',
      sortOrder:
        sortOrderParam === 'desc' ? 'desc' : 'asc',
    };
  }
}

/**
 * Create Express router with inventory endpoints
 */
export function createInventoryRouter(
  inventoryService: InventoryService
): Router {
  const router = Router();
  const handlers = new InventoryHandlers(inventoryService);

  // Inventory items
  router.get('/inventory/items', handlers.listItems);
  router.get('/inventory/items/:id', handlers.getItem);
  router.post('/inventory/items', handlers.createItem);
  router.put('/inventory/items/:id', handlers.updateItem);
  router.delete('/inventory/items/:id', handlers.deleteItem);

  // Stock levels and transactions
  router.get('/inventory/items/:id/stock-levels', handlers.getStockLevels);
  router.get('/inventory/items/:id/transactions', handlers.getTransactionHistory);

  // Transactions
  router.post('/inventory/transactions', handlers.recordTransaction);
  router.post('/inventory/usage', handlers.recordUsage);
  router.post('/inventory/transfer', handlers.transferInventory);
  router.post('/inventory/purchase', handlers.recordPurchase);
  router.post('/inventory/adjustment', handlers.recordAdjustment);

  // Alerts
  router.get('/inventory/alerts/low-stock', handlers.getLowStockAlerts);
  router.get('/inventory/alerts/expiring', handlers.getExpiringAlerts);

  return router;
}
