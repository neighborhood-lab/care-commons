/**
 * @care-commons/billing-invoicing
 * 
 * Revenue cycle management from service delivery to payment collection.
 * Transforms care delivery data into billable items, generates invoices,
 * submits claims, tracks payments, and provides revenue analytics.
 */

// Export types
export * from './types/billing';

// Export repository
export { BillingRepository } from './repository/billing-repository';

// Export validation
export * from './validation/billing-validator';

// Export utilities
export * from './utils/billing-calculations';
