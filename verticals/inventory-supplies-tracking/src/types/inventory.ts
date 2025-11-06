/**
 * Inventory & Supplies domain model
 *
 * Comprehensive inventory management:
 * - Inventory items (supplies, equipment, medications)
 * - Stock levels across locations
 * - Inventory transactions (purchases, usage, transfers)
 * - Lot number and expiration tracking
 * - Reorder management
 * - Vendor management
 */

import {
  Entity,
  SoftDeletable,
  UUID,
} from '@care-commons/core';

/**
 * Main inventory item entity
 */
export interface InventoryItem extends Entity, SoftDeletable {
  // Organization context
  organizationId: UUID;

  // Identity
  sku: string; // Stock Keeping Unit
  name: string;
  description?: string;
  category: InventoryCategory;
  subcategory?: string;

  // Classification
  type: InventoryItemType;
  isConsumable: boolean;
  requiresLotTracking: boolean;
  requiresExpirationTracking: boolean;
  isControlledSubstance: boolean;
  fdaRegulated: boolean;

  // Inventory Management
  unitOfMeasure: UnitOfMeasure;
  packSize?: number; // e.g., 10 pads per box
  currentStock: number; // Total across all locations
  reorderPoint: number;
  reorderQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;

  // Pricing
  unitCost: number; // Cost per unit
  unitPrice?: number; // Selling price per unit
  currency: string; // Default 'USD'

  // Vendor information
  primaryVendorId?: UUID;
  vendorSKU?: string;
  vendorName?: string;
  lastPurchasePrice?: number;
  lastPurchaseDate?: Date;

  // Physical characteristics
  weight?: PhysicalMeasurement;
  dimensions?: Dimensions;
  storageRequirements?: StorageRequirements;
  shelfLife?: number; // Days from receipt to expiration

  // Images and documentation
  imageUrl?: string;
  documentUrls?: string[];
  msdsUrl?: string; // Material Safety Data Sheet

  // Status
  status: InventoryItemStatus;
  statusReason?: string;
  discontinuedDate?: Date;
  replacementItemId?: UUID;

  // Metadata
  tags?: string[];
  customFields?: Record<string, unknown>;
}

/**
 * Stock level at a specific location
 */
export interface StockLevel extends Entity {
  // References
  inventoryItemId: UUID;
  locationId: UUID;
  locationType: LocationType;
  locationName?: string;

  // Quantities
  quantity: number;
  reservedQuantity: number; // Allocated but not yet used
  availableQuantity: number; // quantity - reservedQuantity
  inTransitQuantity?: number; // Being transferred

  // Lot tracking
  lotNumber?: string;
  expirationDate?: Date;
  receivedDate?: Date;
  serialNumbers?: string[]; // For equipment tracking

  // Stock counting
  lastCountDate?: Date;
  lastCountBy?: UUID;
  nextCountDue?: Date;
  countFrequency?: number; // Days between counts
  discrepancyCount?: number; // Number of count discrepancies

  // Status
  status: StockStatus;
  onHold?: boolean;
  holdReason?: string;

  // Metadata
  binLocation?: string; // Physical location within warehouse/storage
  notes?: string;
}

/**
 * Inventory transaction record
 */
export interface InventoryTransaction extends Entity {
  // Organization context
  organizationId: UUID;

  // References
  inventoryItemId: UUID;
  itemName?: string; // Denormalized for reporting

  // Transaction details
  type: TransactionType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;

  // Locations
  fromLocationId?: UUID;
  fromLocationName?: string;
  toLocationId?: UUID;
  toLocationName?: string;

  // Lot tracking
  lotNumber?: string;
  expirationDate?: Date;
  serialNumbers?: string[];

  // Reference to source document
  referenceType?: ReferenceType;
  referenceId?: UUID;
  referenceNumber?: string;

  // Details
  reason?: string;
  notes?: string;
  attachments?: string[];

  // Transaction metadata
  transactionDate: Date;
  effectiveDate?: Date; // May differ from transaction date for backdated entries
  approvedBy?: UUID;
  approvalDate?: Date;

  // Audit
  createdBy: UUID;
  createdByName?: string; // Denormalized
  createdAt: Date;

  // Status
  status: TransactionStatus;
  voidedAt?: Date;
  voidedBy?: UUID;
  voidReason?: string;
}

/**
 * Vendor/Supplier entity
 */
export interface Vendor extends Entity, SoftDeletable {
  // Organization context
  organizationId: UUID;

  // Identity
  vendorNumber: string;
  name: string;
  type: VendorType;

  // Contact
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;

  // Address
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Business details
  taxId?: string;
  businessLicense?: string;
  certifications?: string[];

  // Terms
  paymentTerms?: string; // e.g., "Net 30"
  shippingTerms?: string;
  minimumOrderAmount?: number;
  leadTimeDays?: number;

  // Performance
  rating?: number; // 1-5 star rating
  totalPurchases?: number;
  lastPurchaseDate?: Date;

  // Status
  status: VendorStatus;
  preferredVendor?: boolean;

  // Metadata
  notes?: string;
  customFields?: Record<string, unknown>;
}

/**
 * Purchase order entity
 */
export interface PurchaseOrder extends Entity {
  // Organization context
  organizationId: UUID;

  // Identity
  poNumber: string;
  vendorId: UUID;
  vendorName?: string;

  // Order details
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;

  // Line items
  items: PurchaseOrderItem[];

  // Totals
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  currency: string;

  // Delivery
  deliverToLocationId: UUID;
  deliverToLocationName?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Tracking
  trackingNumber?: string;
  carrier?: string;

  // Status
  status: PurchaseOrderStatus;
  approvedBy?: UUID;
  approvalDate?: Date;
  receivedBy?: UUID;
  receivedDate?: Date;

  // Metadata
  notes?: string;
  attachments?: string[];
  createdBy: UUID;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: UUID;
  inventoryItemId: UUID;
  sku: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  quantityReceived?: number;
  lotNumber?: string;
  expirationDate?: Date;
}

/**
 * Reorder alert entity
 */
export interface ReorderAlert extends Entity {
  organizationId: UUID;
  inventoryItemId: UUID;
  itemName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;

  // Alert details
  alertDate: Date;
  severity: AlertSeverity;

  // Action taken
  acknowledged?: boolean;
  acknowledgedBy?: UUID;
  acknowledgedAt?: Date;
  purchaseOrderId?: UUID;

  status: AlertStatus;
}

// Type definitions

export type InventoryItemType =
  | 'SUPPLY' // Medical supplies (consumable)
  | 'EQUIPMENT' // Durable medical equipment
  | 'MEDICATION' // Medications (if tracked)
  | 'PPE' // Personal protective equipment
  | 'CLEANING' // Cleaning supplies
  | 'OFFICE' // Office supplies
  | 'OTHER';

export type InventoryCategory =
  | 'WOUND_CARE' // Bandages, gauze, wound dressings
  | 'INCONTINENCE' // Adult diapers, pads, wipes
  | 'PERSONAL_CARE' // Gloves, soap, sanitizer, shampoo
  | 'MEDICAL_EQUIPMENT' // Wheelchairs, walkers, hospital beds
  | 'MEDICAL_SUPPLIES' // Thermometers, BP monitors, pulse ox
  | 'MEDICATIONS' // Prescribed medications
  | 'PPE' // Masks, gloves, gowns, face shields
  | 'CLEANING_SUPPLIES' // Disinfectants, cleaning products
  | 'OFFICE_SUPPLIES' // Forms, clipboards, pens
  | 'NUTRITION' // Nutritional supplements, feeding supplies
  | 'MOBILITY_AIDS' // Canes, crutches, grab bars
  | 'RESPIRATORY' // Oxygen supplies, nebulizers
  | 'OTHER';

export type UnitOfMeasure =
  | 'EA' // Each
  | 'BOX'
  | 'CASE'
  | 'PKG' // Package
  | 'BAG'
  | 'BOTTLE'
  | 'TUBE'
  | 'ROLL'
  | 'PAIR'
  | 'SET'
  | 'LB' // Pound
  | 'OZ' // Ounce
  | 'L' // Liter
  | 'ML' // Milliliter
  | 'GAL' // Gallon
  | 'FT' // Feet
  | 'M'; // Meter

export type LocationType =
  | 'WAREHOUSE' // Central warehouse
  | 'BRANCH' // Branch office
  | 'VEHICLE' // Caregiver vehicle
  | 'CLIENT_HOME' // Supplies at client location
  | 'OTHER';

export type TransactionType =
  | 'PURCHASE' // Receiving from vendor
  | 'USAGE' // Used in client care
  | 'TRANSFER' // Transfer between locations
  | 'ADJUSTMENT' // Stock count adjustment
  | 'RETURN' // Return to vendor
  | 'DISPOSAL' // Disposal (expired/damaged)
  | 'ALLOCATION' // Reserve for specific use
  | 'DEALLOCATION' // Release reservation
  | 'LOSS' // Lost/stolen
  | 'DONATION'; // Donated to client/charity

export type ReferenceType =
  | 'VISIT' // Visit ID
  | 'CLIENT' // Client ID
  | 'CAREGIVER' // Caregiver ID
  | 'PURCHASE_ORDER' // Purchase Order ID
  | 'ADJUSTMENT' // Stock adjustment ID
  | 'TRANSFER' // Transfer ID
  | 'MAINTENANCE' // Equipment maintenance ID;

export type TransactionStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'COMPLETED'
  | 'VOIDED';

export type InventoryItemStatus =
  | 'ACTIVE' // Available for use
  | 'INACTIVE' // Temporarily inactive
  | 'DISCONTINUED' // No longer stocked
  | 'PENDING_APPROVAL'; // New item pending approval

export type StockStatus =
  | 'AVAILABLE' // Available for use
  | 'RESERVED' // Allocated but not used
  | 'EXPIRED' // Past expiration date
  | 'DAMAGED' // Damaged, awaiting disposal
  | 'QUARANTINE' // On hold for quality review
  | 'IN_TRANSIT'; // Being transferred

export type VendorType =
  | 'MEDICAL_SUPPLIER'
  | 'EQUIPMENT_SUPPLIER'
  | 'PHARMACY'
  | 'DISTRIBUTOR'
  | 'MANUFACTURER'
  | 'SERVICE_PROVIDER'
  | 'OTHER';

export type VendorStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'PENDING_APPROVAL';

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ORDERED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export type AlertSeverity =
  | 'LOW' // Above min but below reorder point
  | 'MEDIUM' // Below reorder point
  | 'HIGH' // Below minimum stock level
  | 'CRITICAL'; // Out of stock

export type AlertStatus =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'IGNORED';

// Supporting interfaces

export interface PhysicalMeasurement {
  value: number;
  unit: 'LB' | 'OZ' | 'KG' | 'G';
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'IN' | 'CM' | 'FT' | 'M';
}

export interface StorageRequirements {
  temperatureMin?: number; // Celsius
  temperatureMax?: number; // Celsius
  humidityMin?: number; // Percentage
  humidityMax?: number; // Percentage
  requiresRefrigeration?: boolean;
  requiresFreeze?: boolean;
  lightSensitive?: boolean;
  hazmatClass?: string;
  specialInstructions?: string;
}

// Input types for API

export interface CreateInventoryItemInput {
  organizationId: UUID;
  sku: string;
  name: string;
  description?: string;
  category: InventoryCategory;
  subcategory?: string;
  type: InventoryItemType;
  isConsumable: boolean;
  requiresLotTracking: boolean;
  requiresExpirationTracking: boolean;
  isControlledSubstance?: boolean;
  fdaRegulated?: boolean;
  unitOfMeasure: UnitOfMeasure;
  packSize?: number;
  currentStock?: number;
  reorderPoint: number;
  reorderQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  unitCost: number;
  unitPrice?: number;
  primaryVendorId?: UUID;
  vendorSKU?: string;
  storageRequirements?: StorageRequirements;
  shelfLife?: number;
  status: InventoryItemStatus;
}

export interface UpdateInventoryItemInput {
  name?: string;
  description?: string;
  category?: InventoryCategory;
  reorderPoint?: number;
  reorderQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unitCost?: number;
  unitPrice?: number;
  primaryVendorId?: UUID;
  storageRequirements?: StorageRequirements;
  status?: InventoryItemStatus;
}

export interface RecordTransactionInput {
  inventoryItemId: UUID;
  type: TransactionType;
  quantity: number;
  unitCost?: number;
  fromLocationId?: UUID;
  toLocationId?: UUID;
  lotNumber?: string;
  expirationDate?: Date;
  referenceType?: ReferenceType;
  referenceId?: UUID;
  reason?: string;
  notes?: string;
  transactionDate?: Date;
}

export interface CreateVendorInput {
  organizationId: UUID;
  vendorNumber: string;
  name: string;
  type: VendorType;
  contactName?: string;
  phone?: string;
  email?: string;
  website?: string;
  paymentTerms?: string;
  leadTimeDays?: number;
  status: VendorStatus;
}

export interface CreatePurchaseOrderInput {
  organizationId: UUID;
  vendorId: UUID;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  deliverToLocationId: UUID;
  items: PurchaseOrderItemInput[];
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  notes?: string;
}

export interface PurchaseOrderItemInput {
  inventoryItemId: UUID;
  quantity: number;
  unitCost: number;
}

// Search and filter types

export interface InventorySearchFilters {
  organizationId?: UUID;
  query?: string; // Search name, SKU, description
  category?: InventoryCategory;
  type?: InventoryItemType;
  status?: InventoryItemStatus[];
  vendorId?: UUID;
  lowStock?: boolean; // Below reorder point
  outOfStock?: boolean; // Zero or negative stock
  expiringSoon?: boolean; // Expiring within X days
  locationId?: UUID;
}

export interface TransactionSearchFilters {
  organizationId?: UUID;
  inventoryItemId?: UUID;
  type?: TransactionType[];
  fromLocationId?: UUID;
  toLocationId?: UUID;
  referenceType?: ReferenceType;
  referenceId?: UUID;
  dateFrom?: Date;
  dateTo?: Date;
  createdBy?: UUID;
}

export interface StockLevelSearchFilters {
  organizationId?: UUID;
  inventoryItemId?: UUID;
  locationId?: UUID;
  locationType?: LocationType;
  status?: StockStatus[];
  expiringSoon?: boolean;
  expiringDays?: number;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Reporting types

export interface InventoryUsageReport {
  itemId: UUID;
  itemName: string;
  sku: string;
  totalUsage: number;
  usageByLocation: Record<UUID, number>;
  usageByClient?: Record<UUID, number>;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface StockValuationReport {
  totalItems: number;
  totalValue: number;
  valueByCategory: Record<InventoryCategory, number>;
  valueByLocation: Record<UUID, number>;
  reportDate: Date;
}
