/**
 * Inventory & Supplies Tracking Vertical
 *
 * Public API exports for inventory management
 */

// Types
export * from './types/inventory.js';

// Repository
export {
  InventoryRepository,
  StockLevelRepository,
  InventoryTransactionRepository,
} from './repository/inventory-repository.js';

// Service
export { InventoryService } from './service/inventory-service.js';

// Validation
export {
  InventoryValidator,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  recordTransactionSchema,
  createVendorSchema,
  createPurchaseOrderSchema,
  storageRequirementsSchema,
} from './validation/inventory-validator.js';

// API Handlers
export {
  InventoryHandlers,
  createInventoryRouter,
} from './api/inventory-handlers.js';
