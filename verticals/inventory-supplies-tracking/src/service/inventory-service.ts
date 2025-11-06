/**
 * Inventory Service
 *
 * Business logic for inventory management:
 * - Create, update, and manage inventory items
 * - Track stock levels across locations
 * - Record inventory transactions (purchases, usage, transfers)
 * - Generate low stock and expiration alerts
 * - Manage vendors and purchase orders
 */

import {
  UUID,
  UserContext,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from '@care-commons/core';
import {
  InventoryRepository,
  StockLevelRepository,
  InventoryTransactionRepository,
} from '../repository/inventory-repository.js';
import {
  InventoryItem,
  StockLevel,
  InventoryTransaction,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  RecordTransactionInput,
  InventorySearchFilters,
  PaginationParams,
  PaginatedResult,
  TransactionType,
  ReorderAlert,
} from '../types/inventory.js';
import { v4 as uuidv4 } from 'uuid';

export class InventoryService {
  constructor(
    private inventoryRepository: InventoryRepository,
    private stockLevelRepository: StockLevelRepository,
    private transactionRepository: InventoryTransactionRepository
  ) {}

  /**
   * Create a new inventory item
   */
  async createInventoryItem(
    input: CreateInventoryItemInput,
    context: UserContext
  ): Promise<InventoryItem> {
    // Validate permissions
    this.validatePermission(context, 'inventory:create');

    // Check if SKU already exists
    const existing = await this.inventoryRepository.findBySKU(
      input.organizationId,
      input.sku
    );

    if (existing) {
      throw new ConflictError(`Item with SKU ${input.sku} already exists`);
    }

    // Create item
    const item: Partial<InventoryItem> = {
      id: uuidv4(),
      ...input,
      currentStock: input.currentStock ?? 0,
      currency: 'USD',
      isControlledSubstance: input.isControlledSubstance ?? false,
      fdaRegulated: input.fdaRegulated ?? false,
      createdBy: context.userId,
      updatedBy: context.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    return this.inventoryRepository.create(item, context);
  }

  /**
   * Update an inventory item
   */
  async updateInventoryItem(
    itemId: UUID,
    updates: UpdateInventoryItemInput,
    context: UserContext
  ): Promise<InventoryItem> {
    // Validate permissions
    this.validatePermission(context, 'inventory:update');

    // Get existing item
    const existing = await this.inventoryRepository.findById(itemId);
    if (!existing) {
      throw new NotFoundError('Inventory item not found', { id: itemId });
    }

    // Validate organization access
    if (existing.organizationId !== context.organizationId) {
      throw new UnauthorizedError('Not authorized to update this item');
    }

    // Update item
    return this.inventoryRepository.update(itemId, updates, context);
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItem(itemId: UUID, context: UserContext): Promise<InventoryItem> {
    this.validatePermission(context, 'inventory:read');

    const item = await this.inventoryRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Inventory item not found', { id: itemId });
    }

    if (item.organizationId !== context.organizationId) {
      throw new UnauthorizedError('Not authorized to view this item');
    }

    return item;
  }

  /**
   * Search inventory items
   */
  async searchInventoryItems(
    filters: InventorySearchFilters,
    pagination: PaginationParams,
    context: UserContext
  ): Promise<PaginatedResult<InventoryItem>> {
    this.validatePermission(context, 'inventory:read');

    // Ensure user can only see items from their organization
    filters.organizationId = context.organizationId;

    return this.inventoryRepository.search(filters, pagination);
  }

  /**
   * Get low stock items
   */
  async getLowStockItems(context: UserContext): Promise<InventoryItem[]> {
    this.validatePermission(context, 'inventory:read');

    return this.inventoryRepository.getLowStockItems(context.organizationId);
  }

  /**
   * Get expiring items
   */
  async getExpiringItems(
    daysUntilExpiration: number,
    context: UserContext
  ): Promise<StockLevel[]> {
    this.validatePermission(context, 'inventory:read');

    return this.stockLevelRepository.getExpiringItems(
      context.organizationId,
      daysUntilExpiration
    );
  }

  /**
   * Record an inventory transaction
   */
  async recordTransaction(
    input: RecordTransactionInput,
    context: UserContext
  ): Promise<InventoryTransaction> {
    // Validate permissions based on transaction type
    if (input.type === 'USAGE') {
      this.validatePermission(context, 'inventory:usage');
    } else if (input.type === 'TRANSFER') {
      this.validatePermission(context, 'inventory:transfer');
    } else if (input.type === 'ADJUSTMENT') {
      this.validatePermission(context, 'inventory:adjust');
    } else {
      this.validatePermission(context, 'inventory:update');
    }

    // Get inventory item
    const item = await this.inventoryRepository.findById(input.inventoryItemId);
    if (!item) {
      throw new NotFoundError('Inventory item not found', { id: input.inventoryItemId });
    }

    if (item.organizationId !== context.organizationId) {
      throw new UnauthorizedError('Not authorized to record transaction for this item');
    }

    // Validate quantity
    if (input.quantity <= 0) {
      throw new ValidationError('Quantity must be positive');
    }

    // Create transaction
    const transaction: Partial<InventoryTransaction> = {
      id: uuidv4(),
      organizationId: context.organizationId,
      inventoryItemId: input.inventoryItemId,
      itemName: item.name,
      type: input.type,
      quantity: input.quantity,
      unitCost: input.unitCost,
      totalCost: input.unitCost ? input.unitCost * input.quantity : undefined,
      fromLocationId: input.fromLocationId,
      toLocationId: input.toLocationId,
      lotNumber: input.lotNumber,
      expirationDate: input.expirationDate,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      reason: input.reason,
      notes: input.notes,
      transactionDate: input.transactionDate ?? new Date(),
      createdBy: context.userId,
      status: 'COMPLETED',
    };

    const savedTransaction = await this.transactionRepository.create(transaction);

    // Update stock levels based on transaction type
    await this.updateStockLevelsForTransaction(
      item,
      savedTransaction,
      context
    );

    return savedTransaction;
  }

  /**
   * Record inventory usage (convenience method)
   */
  async recordUsage(
    itemId: UUID,
    quantity: number,
    locationId: UUID,
    options: {
      referenceType?: RecordTransactionInput['referenceType'];
      referenceId?: UUID;
      lotNumber?: string;
      notes?: string;
    },
    context: UserContext
  ): Promise<InventoryTransaction> {
    return this.recordTransaction(
      {
        inventoryItemId: itemId,
        type: 'USAGE',
        quantity,
        fromLocationId: locationId,
        ...options,
      },
      context
    );
  }

  /**
   * Transfer inventory between locations
   */
  async transferInventory(
    itemId: UUID,
    fromLocationId: UUID,
    toLocationId: UUID,
    quantity: number,
    options: {
      lotNumber?: string;
      reason?: string;
      notes?: string;
    },
    context: UserContext
  ): Promise<InventoryTransaction> {
    return this.recordTransaction(
      {
        inventoryItemId: itemId,
        type: 'TRANSFER',
        quantity,
        fromLocationId,
        toLocationId,
        ...options,
      },
      context
    );
  }

  /**
   * Record inventory receipt/purchase
   */
  async recordPurchase(
    itemId: UUID,
    quantity: number,
    locationId: UUID,
    unitCost: number,
    options: {
      lotNumber?: string;
      expirationDate?: Date;
      referenceId?: UUID; // Purchase order ID
      notes?: string;
    },
    context: UserContext
  ): Promise<InventoryTransaction> {
    return this.recordTransaction(
      {
        inventoryItemId: itemId,
        type: 'PURCHASE',
        quantity,
        unitCost,
        toLocationId: locationId,
        referenceType: 'PURCHASE_ORDER',
        ...options,
      },
      context
    );
  }

  /**
   * Record inventory adjustment
   */
  async recordAdjustment(
    itemId: UUID,
    quantity: number, // Can be positive or negative
    locationId: UUID,
    reason: string,
    context: UserContext
  ): Promise<InventoryTransaction> {
    return this.recordTransaction(
      {
        inventoryItemId: itemId,
        type: 'ADJUSTMENT',
        quantity: Math.abs(quantity),
        fromLocationId: quantity < 0 ? locationId : undefined,
        toLocationId: quantity > 0 ? locationId : undefined,
        reason,
      },
      context
    );
  }

  /**
   * Get transaction history for an item
   */
  async getTransactionHistory(
    itemId: UUID,
    limit: number,
    context: UserContext
  ): Promise<InventoryTransaction[]> {
    this.validatePermission(context, 'inventory:read');

    // Verify item exists and user has access
    const item = await this.inventoryRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Inventory item not found', { id: itemId });
    }

    if (item.organizationId !== context.organizationId) {
      throw new UnauthorizedError('Not authorized to view transactions for this item');
    }

    return this.transactionRepository.findByItem(itemId, limit);
  }

  /**
   * Get stock levels for an item
   */
  async getStockLevels(itemId: UUID, context: UserContext): Promise<StockLevel[]> {
    this.validatePermission(context, 'inventory:read');

    // Verify item exists and user has access
    const item = await this.inventoryRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Inventory item not found', { id: itemId });
    }

    if (item.organizationId !== context.organizationId) {
      throw new UnauthorizedError('Not authorized to view stock levels for this item');
    }

    return this.stockLevelRepository.findByItem(itemId);
  }

  /**
   * Delete an inventory item (soft delete)
   */
  async deleteInventoryItem(itemId: UUID, context: UserContext): Promise<void> {
    this.validatePermission(context, 'inventory:delete');

    const item = await this.inventoryRepository.findById(itemId);
    if (!item) {
      throw new NotFoundError('Inventory item not found', { id: itemId });
    }

    if (item.organizationId !== context.organizationId) {
      throw new UnauthorizedError('Not authorized to delete this item');
    }

    await this.inventoryRepository.delete(itemId, context);
  }

  /**
   * Update stock levels based on transaction
   */
  private async updateStockLevelsForTransaction(
    item: InventoryItem,
    transaction: InventoryTransaction,
    context: UserContext
  ): Promise<void> {
    const { type, quantity, fromLocationId, toLocationId } = transaction;

    // Calculate stock change
    let stockChange = 0;

    switch (type) {
      case 'PURCHASE':
      case 'ALLOCATION':
        stockChange = quantity;
        break;
      case 'USAGE':
      case 'DISPOSAL':
      case 'LOSS':
      case 'DONATION':
        stockChange = -quantity;
        break;
      case 'TRANSFER':
        // Transfer doesn't change total stock, only location
        stockChange = 0;
        break;
      case 'ADJUSTMENT':
        // Adjustment can be positive or negative
        stockChange = toLocationId ? quantity : -quantity;
        break;
      case 'RETURN':
        stockChange = quantity;
        break;
      default:
        break;
    }

    // Update overall stock level
    const newStock = item.currentStock + stockChange;
    await this.inventoryRepository.updateStock(
      item.id,
      newStock,
      context.userId
    );

    // Update location-specific stock levels
    if (fromLocationId) {
      await this.decrementLocationStock(item.id, fromLocationId, quantity);
    }

    if (toLocationId) {
      await this.incrementLocationStock(
        item.id,
        toLocationId,
        quantity,
        transaction.lotNumber,
        transaction.expirationDate
      );
    }
  }

  /**
   * Decrement stock at a location
   */
  private async decrementLocationStock(
    itemId: UUID,
    locationId: UUID,
    quantity: number
  ): Promise<void> {
    const stockLevel = await this.stockLevelRepository.findByItemAndLocation(
      itemId,
      locationId
    );

    if (stockLevel) {
      const newQuantity = Math.max(0, stockLevel.quantity - quantity);
      await this.stockLevelRepository.updateQuantity(
        stockLevel.id,
        newQuantity,
        stockLevel.reservedQuantity
      );
    }
  }

  /**
   * Increment stock at a location
   */
  private async incrementLocationStock(
    itemId: UUID,
    locationId: UUID,
    quantity: number,
    lotNumber?: string,
    expirationDate?: Date
  ): Promise<void> {
    const stockLevel = await this.stockLevelRepository.findByItemAndLocation(
      itemId,
      locationId
    );

    if (stockLevel) {
      // Update existing stock level
      const newQuantity = stockLevel.quantity + quantity;
      await this.stockLevelRepository.updateQuantity(
        stockLevel.id,
        newQuantity,
        stockLevel.reservedQuantity
      );
    } else {
      // Create new stock level
      await this.stockLevelRepository.create({
        id: uuidv4(),
        inventoryItemId: itemId,
        locationId,
        locationType: 'BRANCH', // Default, should be passed in
        quantity,
        reservedQuantity: 0,
        availableQuantity: quantity,
        lotNumber,
        expirationDate,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Validate user permission
   */
  private validatePermission(context: UserContext, permission: string): void {
    if (!context.permissions.includes(permission)) {
      throw new UnauthorizedError(`Missing required permission: ${permission}`);
    }
  }
}
