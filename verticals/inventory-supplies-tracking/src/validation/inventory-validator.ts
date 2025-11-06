/**
 * Inventory validation logic
 */

import { z } from 'zod';
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  RecordTransactionInput,
} from '../types/inventory.js';

// Storage requirements schema
const storageRequirementsSchema = z.object({
  temperatureMin: z.number().optional(),
  temperatureMax: z.number().optional(),
  humidityMin: z.number().min(0).max(100).optional(),
  humidityMax: z.number().min(0).max(100).optional(),
  requiresRefrigeration: z.boolean().optional(),
  requiresFreeze: z.boolean().optional(),
  lightSensitive: z.boolean().optional(),
  hazmatClass: z.string().optional(),
  specialInstructions: z.string().optional(),
});

// Physical measurement schema
const physicalMeasurementSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['LB', 'OZ', 'KG', 'G']),
});

// Dimensions schema
const dimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['IN', 'CM', 'FT', 'M']),
});

// Create inventory item schema
const createInventoryItemSchema = z.object({
  organizationId: z.string().uuid(),
  sku: z.string().min(1, 'SKU required').max(50),
  name: z.string().min(1, 'Item name required').max(200),
  description: z.string().max(1000).optional(),
  category: z.enum([
    'WOUND_CARE',
    'INCONTINENCE',
    'PERSONAL_CARE',
    'MEDICAL_EQUIPMENT',
    'MEDICAL_SUPPLIES',
    'MEDICATIONS',
    'PPE',
    'CLEANING_SUPPLIES',
    'OFFICE_SUPPLIES',
    'NUTRITION',
    'MOBILITY_AIDS',
    'RESPIRATORY',
    'OTHER',
  ]),
  subcategory: z.string().max(100).optional(),
  type: z.enum(['SUPPLY', 'EQUIPMENT', 'MEDICATION', 'PPE', 'CLEANING', 'OFFICE', 'OTHER']),
  isConsumable: z.boolean(),
  requiresLotTracking: z.boolean(),
  requiresExpirationTracking: z.boolean(),
  isControlledSubstance: z.boolean().optional(),
  fdaRegulated: z.boolean().optional(),
  unitOfMeasure: z.enum([
    'EA',
    'BOX',
    'CASE',
    'PKG',
    'BAG',
    'BOTTLE',
    'TUBE',
    'ROLL',
    'PAIR',
    'SET',
    'LB',
    'OZ',
    'L',
    'ML',
    'GAL',
    'FT',
    'M',
  ]),
  packSize: z.number().int().positive().optional(),
  currentStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0),
  reorderQuantity: z.number().int().positive(),
  minStockLevel: z.number().int().min(0),
  maxStockLevel: z.number().int().positive(),
  unitCost: z.number().positive(),
  unitPrice: z.number().positive().optional(),
  primaryVendorId: z.string().uuid().optional(),
  vendorSKU: z.string().max(50).optional(),
  weight: physicalMeasurementSchema.optional(),
  dimensions: dimensionsSchema.optional(),
  storageRequirements: storageRequirementsSchema.optional(),
  shelfLife: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED', 'PENDING_APPROVAL']),
}).refine(
  (data) => data.maxStockLevel >= data.minStockLevel,
  {
    message: 'Max stock level must be greater than or equal to min stock level',
    path: ['maxStockLevel'],
  }
).refine(
  (data) => data.reorderPoint >= data.minStockLevel,
  {
    message: 'Reorder point should be greater than or equal to min stock level',
    path: ['reorderPoint'],
  }
);

// Update inventory item schema
const updateInventoryItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum([
    'WOUND_CARE',
    'INCONTINENCE',
    'PERSONAL_CARE',
    'MEDICAL_EQUIPMENT',
    'MEDICAL_SUPPLIES',
    'MEDICATIONS',
    'PPE',
    'CLEANING_SUPPLIES',
    'OFFICE_SUPPLIES',
    'NUTRITION',
    'MOBILITY_AIDS',
    'RESPIRATORY',
    'OTHER',
  ]).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().positive().optional(),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().positive().optional(),
  unitCost: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  primaryVendorId: z.string().uuid().optional(),
  storageRequirements: storageRequirementsSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED', 'PENDING_APPROVAL']).optional(),
}).partial();

// Record transaction schema
const recordTransactionSchema = z.object({
  inventoryItemId: z.string().uuid(),
  type: z.enum([
    'PURCHASE',
    'USAGE',
    'TRANSFER',
    'ADJUSTMENT',
    'RETURN',
    'DISPOSAL',
    'ALLOCATION',
    'DEALLOCATION',
    'LOSS',
    'DONATION',
  ]),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitCost: z.number().positive().optional(),
  fromLocationId: z.string().uuid().optional(),
  toLocationId: z.string().uuid().optional(),
  lotNumber: z.string().max(50).optional(),
  expirationDate: z.date().optional(),
  referenceType: z.enum(['VISIT', 'CLIENT', 'CAREGIVER', 'PURCHASE_ORDER', 'ADJUSTMENT', 'TRANSFER', 'MAINTENANCE']).optional(),
  referenceId: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  transactionDate: z.date().optional(),
}).refine(
  (data) => {
    // Transfers must have both from and to locations
    if (data.type === 'TRANSFER') {
      return data.fromLocationId && data.toLocationId;
    }
    return true;
  },
  {
    message: 'Transfers require both fromLocationId and toLocationId',
    path: ['type'],
  }
).refine(
  (data) => {
    // Purchases should have a destination location
    if (data.type === 'PURCHASE') {
      return data.toLocationId;
    }
    return true;
  },
  {
    message: 'Purchases require toLocationId',
    path: ['toLocationId'],
  }
).refine(
  (data) => {
    // Usage should have a source location
    if (data.type === 'USAGE') {
      return data.fromLocationId;
    }
    return true;
  },
  {
    message: 'Usage transactions require fromLocationId',
    path: ['fromLocationId'],
  }
);

// Vendor schema
const createVendorSchema = z.object({
  organizationId: z.string().uuid(),
  vendorNumber: z.string().min(1).max(50),
  name: z.string().min(1, 'Vendor name required').max(200),
  type: z.enum([
    'MEDICAL_SUPPLIER',
    'EQUIPMENT_SUPPLIER',
    'PHARMACY',
    'DISTRIBUTOR',
    'MANUFACTURER',
    'SERVICE_PROVIDER',
    'OTHER',
  ]),
  contactName: z.string().max(100).optional(),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  paymentTerms: z.string().max(100).optional(),
  leadTimeDays: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL']),
});

// Purchase order item schema
const purchaseOrderItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
});

// Create purchase order schema
const createPurchaseOrderSchema = z.object({
  organizationId: z.string().uuid(),
  vendorId: z.string().uuid(),
  orderDate: z.date(),
  expectedDeliveryDate: z.date().optional(),
  deliverToLocationId: z.string().uuid(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item required'),
  subtotal: z.number().positive(),
  tax: z.number().min(0).optional(),
  shipping: z.number().min(0).optional(),
  total: z.number().positive(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => {
    // Validate that total = subtotal + tax + shipping
    const calculatedTotal = data.subtotal + (data.tax ?? 0) + (data.shipping ?? 0);
    return Math.abs(calculatedTotal - data.total) < 0.01; // Allow for rounding
  },
  {
    message: 'Total must equal subtotal + tax + shipping',
    path: ['total'],
  }
);

interface ValidationError {
  path: string;
  message: string;
}

interface ValidationResult {
  success: boolean;
  errors?: ValidationError[];
}

export class InventoryValidator {
  /**
   * Validate create inventory item input
   */
  validateCreate(input: CreateInventoryItemInput): ValidationResult {
    try {
      createInventoryItemSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate update inventory item input
   */
  validateUpdate(input: UpdateInventoryItemInput): ValidationResult {
    try {
      updateInventoryItemSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate transaction input
   */
  validateTransaction(input: RecordTransactionInput): ValidationResult {
    try {
      recordTransactionSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
      }
      return {
        success: false,
        errors: [{ path: 'unknown', message: 'Validation failed' }],
      };
    }
  }

  /**
   * Validate SKU format
   */
  validateSKU(sku: string): boolean {
    // SKU should be alphanumeric with hyphens/underscores
    return /^[A-Z0-9\-_]+$/i.test(sku);
  }

  /**
   * Validate lot number format
   */
  validateLotNumber(lotNumber: string): boolean {
    // Lot numbers are typically alphanumeric
    return /^[A-Z0-9\-]+$/i.test(lotNumber);
  }

  /**
   * Validate expiration date is in the future
   */
  validateExpirationDate(expirationDate: Date): boolean {
    return expirationDate > new Date();
  }

  /**
   * Validate stock quantity is non-negative
   */
  validateStockQuantity(quantity: number): boolean {
    return quantity >= 0 && Number.isInteger(quantity);
  }
}

// Export schemas for direct use
export {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  recordTransactionSchema,
  createVendorSchema,
  createPurchaseOrderSchema,
  storageRequirementsSchema,
};
