/**
 * Inventory repository - data access layer
 */

import { Repository, Database, PaginatedResult, UUID } from '@care-commons/core';
import {
  InventoryItem,
  StockLevel,
  InventoryTransaction,
  Vendor,
  PurchaseOrder,
  InventorySearchFilters,
  TransactionSearchFilters,
  StockLevelSearchFilters,
  PaginationParams,
  InventoryItemStatus,
  TransactionType,
  LocationType,
  StockStatus,
} from '../types/inventory.js';

export class InventoryRepository extends Repository<InventoryItem> {
  constructor(database: Database) {
    super({
      tableName: 'inventory_items',
      database,
      enableAudit: true,
      enableSoftDelete: true,
    });
  }

  /**
   * Map database row to InventoryItem entity
   */
  protected mapRowToEntity(row: Record<string, unknown>): InventoryItem {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      sku: row['sku'] as string,
      name: row['name'] as string,
      description: row['description'] as string | undefined,
      category: row['category'] as InventoryItem['category'],
      subcategory: row['subcategory'] as string | undefined,
      type: row['type'] as InventoryItem['type'],
      isConsumable: row['is_consumable'] as boolean,
      requiresLotTracking: row['requires_lot_tracking'] as boolean,
      requiresExpirationTracking: row['requires_expiration_tracking'] as boolean,
      isControlledSubstance: row['is_controlled_substance'] as boolean,
      fdaRegulated: row['fda_regulated'] as boolean,
      unitOfMeasure: row['unit_of_measure'] as InventoryItem['unitOfMeasure'],
      packSize: row['pack_size'] as number | undefined,
      currentStock: row['current_stock'] as number,
      reorderPoint: row['reorder_point'] as number,
      reorderQuantity: row['reorder_quantity'] as number,
      minStockLevel: row['min_stock_level'] as number,
      maxStockLevel: row['max_stock_level'] as number,
      unitCost: row['unit_cost'] as number,
      unitPrice: row['unit_price'] as number | undefined,
      currency: row['currency'] as string,
      primaryVendorId: row['primary_vendor_id'] as UUID | undefined,
      vendorSKU: row['vendor_sku'] as string | undefined,
      vendorName: row['vendor_name'] as string | undefined,
      lastPurchasePrice: row['last_purchase_price'] as number | undefined,
      lastPurchaseDate: row['last_purchase_date'] as Date | undefined,
      weight: row['weight'] ? JSON.parse(row['weight'] as string) : undefined,
      dimensions: row['dimensions'] ? JSON.parse(row['dimensions'] as string) : undefined,
      storageRequirements: row['storage_requirements'] ? JSON.parse(row['storage_requirements'] as string) : undefined,
      shelfLife: row['shelf_life'] as number | undefined,
      imageUrl: row['image_url'] as string | undefined,
      documentUrls: row['document_urls'] ? JSON.parse(row['document_urls'] as string) : undefined,
      msdsUrl: row['msds_url'] as string | undefined,
      status: row['status'] as InventoryItemStatus,
      statusReason: row['status_reason'] as string | undefined,
      discontinuedDate: row['discontinued_date'] as Date | undefined,
      replacementItemId: row['replacement_item_id'] as UUID | undefined,
      tags: row['tags'] ? JSON.parse(row['tags'] as string) : undefined,
      customFields: row['custom_fields'] ? JSON.parse(row['custom_fields'] as string) : undefined,
      createdAt: row['created_at'] as Date,
      createdBy: row['created_by'] as UUID,
      updatedAt: row['updated_at'] as Date,
      updatedBy: row['updated_by'] as UUID,
      version: row['version'] as number,
      deletedAt: row['deleted_at'] as Date | null,
      deletedBy: row['deleted_by'] as UUID | null,
    };
  }

  /**
   * Map InventoryItem entity to database row
   */
  protected mapEntityToRow(entity: Partial<InventoryItem>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.sku !== undefined) row['sku'] = entity.sku;
    if (entity.name !== undefined) row['name'] = entity.name;
    if (entity.description !== undefined) row['description'] = entity.description;
    if (entity.category !== undefined) row['category'] = entity.category;
    if (entity.subcategory !== undefined) row['subcategory'] = entity.subcategory;
    if (entity.type !== undefined) row['type'] = entity.type;
    if (entity.isConsumable !== undefined) row['is_consumable'] = entity.isConsumable;
    if (entity.requiresLotTracking !== undefined) row['requires_lot_tracking'] = entity.requiresLotTracking;
    if (entity.requiresExpirationTracking !== undefined) row['requires_expiration_tracking'] = entity.requiresExpirationTracking;
    if (entity.isControlledSubstance !== undefined) row['is_controlled_substance'] = entity.isControlledSubstance;
    if (entity.fdaRegulated !== undefined) row['fda_regulated'] = entity.fdaRegulated;
    if (entity.unitOfMeasure !== undefined) row['unit_of_measure'] = entity.unitOfMeasure;
    if (entity.packSize !== undefined) row['pack_size'] = entity.packSize;
    if (entity.currentStock !== undefined) row['current_stock'] = entity.currentStock;
    if (entity.reorderPoint !== undefined) row['reorder_point'] = entity.reorderPoint;
    if (entity.reorderQuantity !== undefined) row['reorder_quantity'] = entity.reorderQuantity;
    if (entity.minStockLevel !== undefined) row['min_stock_level'] = entity.minStockLevel;
    if (entity.maxStockLevel !== undefined) row['max_stock_level'] = entity.maxStockLevel;
    if (entity.unitCost !== undefined) row['unit_cost'] = entity.unitCost;
    if (entity.unitPrice !== undefined) row['unit_price'] = entity.unitPrice;
    if (entity.currency !== undefined) row['currency'] = entity.currency;
    if (entity.primaryVendorId !== undefined) row['primary_vendor_id'] = entity.primaryVendorId;
    if (entity.vendorSKU !== undefined) row['vendor_sku'] = entity.vendorSKU;
    if (entity.vendorName !== undefined) row['vendor_name'] = entity.vendorName;
    if (entity.lastPurchasePrice !== undefined) row['last_purchase_price'] = entity.lastPurchasePrice;
    if (entity.lastPurchaseDate !== undefined) row['last_purchase_date'] = entity.lastPurchaseDate;
    if (entity.weight !== undefined) row['weight'] = JSON.stringify(entity.weight);
    if (entity.dimensions !== undefined) row['dimensions'] = JSON.stringify(entity.dimensions);
    if (entity.storageRequirements !== undefined) row['storage_requirements'] = JSON.stringify(entity.storageRequirements);
    if (entity.shelfLife !== undefined) row['shelf_life'] = entity.shelfLife;
    if (entity.imageUrl !== undefined) row['image_url'] = entity.imageUrl;
    if (entity.documentUrls !== undefined) row['document_urls'] = JSON.stringify(entity.documentUrls);
    if (entity.msdsUrl !== undefined) row['msds_url'] = entity.msdsUrl;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.statusReason !== undefined) row['status_reason'] = entity.statusReason;
    if (entity.discontinuedDate !== undefined) row['discontinued_date'] = entity.discontinuedDate;
    if (entity.replacementItemId !== undefined) row['replacement_item_id'] = entity.replacementItemId;
    if (entity.tags !== undefined) row['tags'] = JSON.stringify(entity.tags);
    if (entity.customFields !== undefined) row['custom_fields'] = JSON.stringify(entity.customFields);

    return row;
  }

  /**
   * Search inventory items with filters
   */
  async search(
    filters: InventorySearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResult<InventoryItem>> {
    let query = this.db
      .select('*')
      .from(this.tableName)
      .where({ deleted_at: null });

    // Apply filters
    if (filters.organizationId) {
      query = query.where({ organization_id: filters.organizationId });
    }

    if (filters.category) {
      query = query.where({ category: filters.category });
    }

    if (filters.type) {
      query = query.where({ type: filters.type });
    }

    if (filters.status) {
      query = query.whereIn('status', filters.status);
    }

    if (filters.vendorId) {
      query = query.where({ primary_vendor_id: filters.vendorId });
    }

    if (filters.query) {
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${filters.query}%`)
          .orWhere('sku', 'ilike', `%${filters.query}%`)
          .orWhere('description', 'ilike', `%${filters.query}%`);
      });
    }

    if (filters.lowStock) {
      query = query.whereRaw('current_stock <= reorder_point');
    }

    if (filters.outOfStock) {
      query = query.where('current_stock', '<=', 0);
    }

    // Count total
    const countResult = await query.clone().count('* as count').first();
    const total = Number(countResult?.count ?? 0);

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.offset(offset).limit(pagination.limit);

    // Apply sorting
    const sortBy = pagination.sortBy ?? 'name';
    const sortOrder = pagination.sortOrder ?? 'asc';
    query = query.orderBy(sortBy, sortOrder);

    // Execute query
    const rows = await query;
    const items = rows.map((row) => this.mapRowToEntity(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Find by SKU
   */
  async findBySKU(organizationId: UUID, sku: string): Promise<InventoryItem | null> {
    const row = await this.db
      .select('*')
      .from(this.tableName)
      .where({
        organization_id: organizationId,
        sku,
        deleted_at: null,
      })
      .first();

    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Get items below reorder point
   */
  async getLowStockItems(organizationId: UUID): Promise<InventoryItem[]> {
    const rows = await this.db
      .select('*')
      .from(this.tableName)
      .where({
        organization_id: organizationId,
        status: 'ACTIVE',
        deleted_at: null,
      })
      .whereRaw('current_stock <= reorder_point')
      .orderBy('current_stock', 'asc');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Update stock level
   */
  async updateStock(itemId: UUID, newStock: number, updatedBy: UUID): Promise<void> {
    await this.db
      .update({
        current_stock: newStock,
        updated_at: new Date(),
        updated_by: updatedBy,
      })
      .from(this.tableName)
      .where({ id: itemId });
  }
}

/**
 * Stock Level Repository
 */
export class StockLevelRepository {
  constructor(private db: Database) {}

  /**
   * Create stock level record
   */
  async create(stockLevel: Partial<StockLevel>): Promise<StockLevel> {
    const row = this.mapEntityToRow(stockLevel);
    row['id'] = stockLevel.id;
    row['created_at'] = new Date();
    row['updated_at'] = new Date();

    const [insertedRow] = await this.db('stock_levels').insert(row).returning('*');
    return this.mapRowToEntity(insertedRow);
  }

  /**
   * Find stock levels by item
   */
  async findByItem(itemId: UUID): Promise<StockLevel[]> {
    const rows = await this.db
      .select('*')
      .from('stock_levels')
      .where({ inventory_item_id: itemId });

    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Find stock level by item and location
   */
  async findByItemAndLocation(itemId: UUID, locationId: UUID): Promise<StockLevel | null> {
    const row = await this.db
      .select('*')
      .from('stock_levels')
      .where({
        inventory_item_id: itemId,
        location_id: locationId,
      })
      .first();

    return row ? this.mapRowToEntity(row) : null;
  }

  /**
   * Update stock quantity
   */
  async updateQuantity(
    id: UUID,
    quantity: number,
    reservedQuantity: number
  ): Promise<void> {
    await this.db('stock_levels')
      .update({
        quantity,
        reserved_quantity: reservedQuantity,
        available_quantity: quantity - reservedQuantity,
        updated_at: new Date(),
      })
      .where({ id });
  }

  /**
   * Get expiring items
   */
  async getExpiringItems(organizationId: UUID, daysUntilExpiration: number): Promise<StockLevel[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysUntilExpiration);

    const rows = await this.db
      .select('stock_levels.*')
      .from('stock_levels')
      .join('inventory_items', 'stock_levels.inventory_item_id', 'inventory_items.id')
      .where('inventory_items.organization_id', organizationId)
      .where('stock_levels.expiration_date', '<=', expirationDate)
      .where('stock_levels.expiration_date', '>=', new Date())
      .orderBy('stock_levels.expiration_date', 'asc');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  private mapRowToEntity(row: Record<string, unknown>): StockLevel {
    return {
      id: row['id'] as UUID,
      inventoryItemId: row['inventory_item_id'] as UUID,
      locationId: row['location_id'] as UUID,
      locationType: row['location_type'] as LocationType,
      locationName: row['location_name'] as string | undefined,
      quantity: row['quantity'] as number,
      reservedQuantity: row['reserved_quantity'] as number,
      availableQuantity: row['available_quantity'] as number,
      inTransitQuantity: row['in_transit_quantity'] as number | undefined,
      lotNumber: row['lot_number'] as string | undefined,
      expirationDate: row['expiration_date'] as Date | undefined,
      receivedDate: row['received_date'] as Date | undefined,
      serialNumbers: row['serial_numbers'] ? JSON.parse(row['serial_numbers'] as string) : undefined,
      lastCountDate: row['last_count_date'] as Date | undefined,
      lastCountBy: row['last_count_by'] as UUID | undefined,
      nextCountDue: row['next_count_due'] as Date | undefined,
      countFrequency: row['count_frequency'] as number | undefined,
      discrepancyCount: row['discrepancy_count'] as number | undefined,
      status: row['status'] as StockStatus,
      onHold: row['on_hold'] as boolean | undefined,
      holdReason: row['hold_reason'] as string | undefined,
      binLocation: row['bin_location'] as string | undefined,
      notes: row['notes'] as string | undefined,
      createdAt: row['created_at'] as Date,
      updatedAt: row['updated_at'] as Date,
    };
  }

  private mapEntityToRow(entity: Partial<StockLevel>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.inventoryItemId !== undefined) row['inventory_item_id'] = entity.inventoryItemId;
    if (entity.locationId !== undefined) row['location_id'] = entity.locationId;
    if (entity.locationType !== undefined) row['location_type'] = entity.locationType;
    if (entity.locationName !== undefined) row['location_name'] = entity.locationName;
    if (entity.quantity !== undefined) row['quantity'] = entity.quantity;
    if (entity.reservedQuantity !== undefined) row['reserved_quantity'] = entity.reservedQuantity;
    if (entity.availableQuantity !== undefined) row['available_quantity'] = entity.availableQuantity;
    if (entity.inTransitQuantity !== undefined) row['in_transit_quantity'] = entity.inTransitQuantity;
    if (entity.lotNumber !== undefined) row['lot_number'] = entity.lotNumber;
    if (entity.expirationDate !== undefined) row['expiration_date'] = entity.expirationDate;
    if (entity.receivedDate !== undefined) row['received_date'] = entity.receivedDate;
    if (entity.serialNumbers !== undefined) row['serial_numbers'] = JSON.stringify(entity.serialNumbers);
    if (entity.lastCountDate !== undefined) row['last_count_date'] = entity.lastCountDate;
    if (entity.lastCountBy !== undefined) row['last_count_by'] = entity.lastCountBy;
    if (entity.nextCountDue !== undefined) row['next_count_due'] = entity.nextCountDue;
    if (entity.countFrequency !== undefined) row['count_frequency'] = entity.countFrequency;
    if (entity.discrepancyCount !== undefined) row['discrepancy_count'] = entity.discrepancyCount;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.onHold !== undefined) row['on_hold'] = entity.onHold;
    if (entity.holdReason !== undefined) row['hold_reason'] = entity.holdReason;
    if (entity.binLocation !== undefined) row['bin_location'] = entity.binLocation;
    if (entity.notes !== undefined) row['notes'] = entity.notes;

    return row;
  }
}

/**
 * Transaction Repository
 */
export class InventoryTransactionRepository {
  constructor(private db: Database) {}

  /**
   * Create transaction
   */
  async create(transaction: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
    const row = this.mapEntityToRow(transaction);
    row['id'] = transaction.id;
    row['created_at'] = new Date();

    const [insertedRow] = await this.db('inventory_transactions').insert(row).returning('*');
    return this.mapRowToEntity(insertedRow);
  }

  /**
   * Find transactions by item
   */
  async findByItem(itemId: UUID, limit: number = 100): Promise<InventoryTransaction[]> {
    const rows = await this.db
      .select('*')
      .from('inventory_transactions')
      .where({ inventory_item_id: itemId })
      .orderBy('transaction_date', 'desc')
      .limit(limit);

    return rows.map((row) => this.mapRowToEntity(row));
  }

  /**
   * Get transactions by date range
   */
  async findByDateRange(
    organizationId: UUID,
    startDate: Date,
    endDate: Date
  ): Promise<InventoryTransaction[]> {
    const rows = await this.db
      .select('*')
      .from('inventory_transactions')
      .where({ organization_id: organizationId })
      .whereBetween('transaction_date', [startDate, endDate])
      .orderBy('transaction_date', 'desc');

    return rows.map((row) => this.mapRowToEntity(row));
  }

  private mapRowToEntity(row: Record<string, unknown>): InventoryTransaction {
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      inventoryItemId: row['inventory_item_id'] as UUID,
      itemName: row['item_name'] as string | undefined,
      type: row['type'] as TransactionType,
      quantity: row['quantity'] as number,
      unitCost: row['unit_cost'] as number | undefined,
      totalCost: row['total_cost'] as number | undefined,
      fromLocationId: row['from_location_id'] as UUID | undefined,
      fromLocationName: row['from_location_name'] as string | undefined,
      toLocationId: row['to_location_id'] as UUID | undefined,
      toLocationName: row['to_location_name'] as string | undefined,
      lotNumber: row['lot_number'] as string | undefined,
      expirationDate: row['expiration_date'] as Date | undefined,
      serialNumbers: row['serial_numbers'] ? JSON.parse(row['serial_numbers'] as string) : undefined,
      referenceType: row['reference_type'] as InventoryTransaction['referenceType'],
      referenceId: row['reference_id'] as UUID | undefined,
      referenceNumber: row['reference_number'] as string | undefined,
      reason: row['reason'] as string | undefined,
      notes: row['notes'] as string | undefined,
      attachments: row['attachments'] ? JSON.parse(row['attachments'] as string) : undefined,
      transactionDate: row['transaction_date'] as Date,
      effectiveDate: row['effective_date'] as Date | undefined,
      approvedBy: row['approved_by'] as UUID | undefined,
      approvalDate: row['approval_date'] as Date | undefined,
      createdBy: row['created_by'] as UUID,
      createdByName: row['created_by_name'] as string | undefined,
      createdAt: row['created_at'] as Date,
      status: row['status'] as InventoryTransaction['status'],
      voidedAt: row['voided_at'] as Date | undefined,
      voidedBy: row['voided_by'] as UUID | undefined,
      voidReason: row['void_reason'] as string | undefined,
    };
  }

  private mapEntityToRow(entity: Partial<InventoryTransaction>): Record<string, unknown> {
    const row: Record<string, unknown> = {};

    if (entity.organizationId !== undefined) row['organization_id'] = entity.organizationId;
    if (entity.inventoryItemId !== undefined) row['inventory_item_id'] = entity.inventoryItemId;
    if (entity.itemName !== undefined) row['item_name'] = entity.itemName;
    if (entity.type !== undefined) row['type'] = entity.type;
    if (entity.quantity !== undefined) row['quantity'] = entity.quantity;
    if (entity.unitCost !== undefined) row['unit_cost'] = entity.unitCost;
    if (entity.totalCost !== undefined) row['total_cost'] = entity.totalCost;
    if (entity.fromLocationId !== undefined) row['from_location_id'] = entity.fromLocationId;
    if (entity.fromLocationName !== undefined) row['from_location_name'] = entity.fromLocationName;
    if (entity.toLocationId !== undefined) row['to_location_id'] = entity.toLocationId;
    if (entity.toLocationName !== undefined) row['to_location_name'] = entity.toLocationName;
    if (entity.lotNumber !== undefined) row['lot_number'] = entity.lotNumber;
    if (entity.expirationDate !== undefined) row['expiration_date'] = entity.expirationDate;
    if (entity.serialNumbers !== undefined) row['serial_numbers'] = JSON.stringify(entity.serialNumbers);
    if (entity.referenceType !== undefined) row['reference_type'] = entity.referenceType;
    if (entity.referenceId !== undefined) row['reference_id'] = entity.referenceId;
    if (entity.referenceNumber !== undefined) row['reference_number'] = entity.referenceNumber;
    if (entity.reason !== undefined) row['reason'] = entity.reason;
    if (entity.notes !== undefined) row['notes'] = entity.notes;
    if (entity.attachments !== undefined) row['attachments'] = JSON.stringify(entity.attachments);
    if (entity.transactionDate !== undefined) row['transaction_date'] = entity.transactionDate;
    if (entity.effectiveDate !== undefined) row['effective_date'] = entity.effectiveDate;
    if (entity.approvedBy !== undefined) row['approved_by'] = entity.approvedBy;
    if (entity.approvalDate !== undefined) row['approval_date'] = entity.approvalDate;
    if (entity.createdBy !== undefined) row['created_by'] = entity.createdBy;
    if (entity.createdByName !== undefined) row['created_by_name'] = entity.createdByName;
    if (entity.status !== undefined) row['status'] = entity.status;
    if (entity.voidedAt !== undefined) row['voided_at'] = entity.voidedAt;
    if (entity.voidedBy !== undefined) row['voided_by'] = entity.voidedBy;
    if (entity.voidReason !== undefined) row['void_reason'] = entity.voidReason;

    return row;
  }
}
