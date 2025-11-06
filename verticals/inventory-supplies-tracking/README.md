# Inventory & Supplies Tracking

> Comprehensive inventory management system for medical supplies, equipment, and consumables — tracking stock levels, locations, usage, reorder points, expiration dates, lot numbers, and full audit trail.

## Features

### Core Capabilities

- **Inventory Item Management** - Track medical supplies, equipment, and consumables
- **Stock Level Monitoring** - Real-time stock levels with low stock alerts
- **Location Management** - Multi-location inventory tracking (warehouses, branches, vehicles)
- **Reorder Management** - Automatic reorder point alerts and purchase order creation
- **Expiration Tracking** - Monitor expiration dates with automated alerts
- **Lot/Batch Tracking** - Track lot numbers for recall management
- **Usage Tracking** - Record inventory usage by client, caregiver, or visit
- **Transfer Management** - Track inventory transfers between locations
- **Adjustment Recording** - Document inventory adjustments with audit trail
- **Vendor Management** - Track suppliers and purchase history

### Data Security

- **Role-Based Access** - Granular permissions based on user role and organizational scope
- **Audit Logging** - All access and modifications tracked for compliance
- **Soft Deletes** - Data never truly deleted, can be recovered if needed

### Compliance Features

- **Audit Trail** - Complete revision history for compliance reporting
- **Lot Number Tracking** - Required for medical supply recall management
- **Expiration Monitoring** - Ensures expired supplies are not used
- **Usage Documentation** - Track supply usage for billing and compliance

## Data Model

### InventoryItem Entity

```typescript
interface InventoryItem {
  // Identity
  id: UUID;
  organizationId: UUID;
  sku: string;
  name: string;
  description?: string;
  category: InventoryCategory;

  // Classification
  type: 'SUPPLY' | 'EQUIPMENT' | 'MEDICATION' | 'PPE' | 'OTHER';
  isConsumable: boolean;
  requiresLotTracking: boolean;
  requiresExpirationTracking: boolean;

  // Inventory Management
  unitOfMeasure: string; // 'EA', 'BOX', 'CASE', etc.
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;

  // Pricing
  unitCost: Decimal;
  unitPrice?: Decimal;

  // Vendor
  primaryVendorId?: UUID;
  vendorSKU?: string;

  // Physical
  storageRequirements?: string;
  shelfLife?: number; // days

  // Status
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

  // Audit
  createdAt: Timestamp;
  createdBy: UUID;
  updatedAt: Timestamp;
  updatedBy: UUID;
  version: number;
}
```

### StockLevel Entity

```typescript
interface StockLevel {
  id: UUID;
  inventoryItemId: UUID;
  locationId: UUID;
  locationType: 'WAREHOUSE' | 'BRANCH' | 'VEHICLE' | 'OTHER';

  quantity: number;
  reservedQuantity: number;
  availableQuantity: number; // quantity - reservedQuantity

  lotNumber?: string;
  expirationDate?: Date;

  lastCountDate: Date;
  lastCountBy: UUID;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### InventoryTransaction Entity

```typescript
interface InventoryTransaction {
  id: UUID;
  organizationId: UUID;
  inventoryItemId: UUID;

  type: TransactionType;
  quantity: number;
  unitCost?: Decimal;

  fromLocationId?: UUID;
  toLocationId?: UUID;

  lotNumber?: string;
  expirationDate?: Date;

  referenceType?: 'VISIT' | 'CLIENT' | 'PURCHASE_ORDER' | 'ADJUSTMENT';
  referenceId?: UUID;

  reason?: string;
  notes?: string;

  transactionDate: Timestamp;
  createdBy: UUID;
  createdAt: Timestamp;
}
```

### Transaction Types

- `PURCHASE` - Receiving new inventory from vendor
- `USAGE` - Consuming inventory for client care
- `TRANSFER` - Moving inventory between locations
- `ADJUSTMENT` - Stock count adjustments
- `RETURN` - Returning inventory to vendor
- `DISPOSAL` - Disposing of expired/damaged items
- `ALLOCATION` - Reserving inventory for specific use
- `DEALLOCATION` - Releasing reserved inventory

### Inventory Categories

- `WOUND_CARE` - Bandages, gauze, wound dressings
- `INCONTINENCE` - Adult diapers, pads, wipes
- `PERSONAL_CARE` - Gloves, soap, hand sanitizer
- `MEDICAL_EQUIPMENT` - Wheelchairs, walkers, hospital beds
- `MEDICAL_SUPPLIES` - Thermometers, blood pressure monitors
- `MEDICATIONS` - Prescribed medications (if tracked)
- `PPE` - Personal protective equipment
- `CLEANING_SUPPLIES` - Disinfectants, cleaning products
- `OFFICE_SUPPLIES` - Forms, clipboards, pens
- `OTHER` - Miscellaneous items

## Usage

### Creating an Inventory Item

```typescript
import { InventoryService, CreateInventoryItemInput } from '@care-commons/inventory-supplies-tracking';
import { UserContext } from '@care-commons/core';

const inventoryService = new InventoryService(inventoryRepository);

const input: CreateInventoryItemInput = {
  organizationId: 'org-uuid',
  sku: 'WC-001',
  name: 'Sterile Gauze Pads 4x4',
  description: 'Non-adherent sterile gauze pads',
  category: 'WOUND_CARE',
  type: 'SUPPLY',
  isConsumable: true,
  requiresLotTracking: true,
  requiresExpirationTracking: true,
  unitOfMeasure: 'BOX',
  currentStock: 50,
  reorderPoint: 10,
  reorderQuantity: 25,
  minStockLevel: 5,
  maxStockLevel: 100,
  unitCost: 12.50,
  unitPrice: 15.00,
  status: 'ACTIVE',
};

const context: UserContext = {
  userId: 'user-uuid',
  roles: ['INVENTORY_MANAGER'],
  permissions: ['inventory:create'],
  organizationId: 'org-uuid',
  branchIds: ['branch-uuid'],
};

const item = await inventoryService.createInventoryItem(input, context);
```

### Recording Inventory Usage

```typescript
// Record usage for a client visit
await inventoryService.recordUsage(
  {
    inventoryItemId: 'item-uuid',
    quantity: 2,
    locationId: 'branch-uuid',
    referenceType: 'VISIT',
    referenceId: 'visit-uuid',
    lotNumber: 'LOT-2024-001',
    notes: 'Used for wound dressing change',
  },
  context
);
```

### Transferring Inventory

```typescript
// Transfer inventory between locations
await inventoryService.transferInventory(
  {
    inventoryItemId: 'item-uuid',
    quantity: 10,
    fromLocationId: 'warehouse-uuid',
    toLocationId: 'branch-uuid',
    lotNumber: 'LOT-2024-001',
    reason: 'Branch restocking',
  },
  context
);
```

### Checking Low Stock Items

```typescript
// Get items below reorder point
const lowStockItems = await inventoryService.getLowStockItems(
  { organizationId: 'org-uuid' },
  context
);

lowStockItems.forEach(item => {
  console.log(`${item.name} - Current: ${item.currentStock}, Reorder at: ${item.reorderPoint}`);
});
```

### Checking Expiring Items

```typescript
// Get items expiring within 30 days
const expiringItems = await inventoryService.getExpiringItems(
  {
    organizationId: 'org-uuid',
    daysUntilExpiration: 30,
  },
  context
);

expiringItems.forEach(item => {
  console.log(`${item.name} - Lot: ${item.lotNumber}, Expires: ${item.expirationDate}`);
});
```

## Permissions

### Required Permissions

- `inventory:create` - Create new inventory items
- `inventory:read` - View inventory information
- `inventory:update` - Modify inventory information
- `inventory:delete` - Soft delete inventory items
- `inventory:adjust` - Record inventory adjustments
- `inventory:transfer` - Transfer inventory between locations
- `inventory:usage` - Record inventory usage

### Role-Based Access

- **SUPER_ADMIN** - Full access to all inventory across all organizations
- **ORG_ADMIN** - Full access to inventory within their organization
- **INVENTORY_MANAGER** - Full inventory management capabilities
- **BRANCH_ADMIN** - Manage inventory within their branches
- **COORDINATOR** - View inventory and record usage
- **CAREGIVER** - Limited access to view supplies and record usage
- **BILLING** - Read access for billing purposes

## API Endpoints

### REST Endpoints

```
POST   /api/inventory/items                  Create inventory item
GET    /api/inventory/items/:id              Get item by ID
GET    /api/inventory/items/sku/:sku         Get item by SKU
PUT    /api/inventory/items/:id              Update item
DELETE /api/inventory/items/:id              Soft delete item
GET    /api/inventory/items/search           Search inventory items
GET    /api/inventory/items/category/:cat    Get items by category

POST   /api/inventory/transactions           Record transaction
GET    /api/inventory/transactions/:id       Get transaction
GET    /api/inventory/transactions/item/:id  Get transactions for item

GET    /api/inventory/stock-levels/:locationId    Get stock at location
POST   /api/inventory/stock-levels/count          Perform stock count

POST   /api/inventory/usage                  Record usage
POST   /api/inventory/transfer               Transfer inventory
POST   /api/inventory/adjustment             Record adjustment

GET    /api/inventory/alerts/low-stock       Get low stock alerts
GET    /api/inventory/alerts/expiring        Get expiring items
```

## Database Schema

See `packages/core/migrations/` for complete schema definitions.

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## Related Verticals

- **Client Demographics** - Track inventory usage by client
- **Caregiver & Staff Management** - Track inventory usage by caregiver
- **Scheduling & Visit Management** - Record supplies used during visits
- **Billing & Invoicing** - Bill for supplies used

## License

See [LICENSE](../../LICENSE) for details.
