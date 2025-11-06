/**
 * API Data Provider
 *
 * Adapter that wraps existing API services to conform to the DataProvider interface.
 * This allows backward compatibility while supporting the new provider abstraction.
 */

import type { ApiClient } from '../services/api-client';
import { createClientApiService } from '@/verticals/client-demographics/services/client-api';
import { createCarePlanApiService } from '@/verticals/care-plans/services/care-plan-api-service';
import { createCaregiverApiService } from '@/verticals/caregivers/services/caregiver-api';
import { createBillingApiService } from '@/verticals/billing-invoicing/services/billing-api';
import { createPayrollApiService } from '@/verticals/payroll-processing/services/payroll-api';
import { createShiftMatchingApiService } from '@/verticals/shift-matching/services/shift-matching-api';

import type { DataProvider } from './types';

/**
 * Creates an API-based data provider
 */
export const createApiProvider = (apiClient: ApiClient): DataProvider => {
  // Initialize all service clients
  const clientService = createClientApiService(apiClient);
  const carePlanService = createCarePlanApiService(apiClient);
  const caregiverService = createCaregiverApiService(apiClient);
  const billingService = createBillingApiService(apiClient);
  const payrollService = createPayrollApiService(apiClient);
  const shiftMatchingService = createShiftMatchingApiService(apiClient);

  return {
    name: 'API Provider',
    type: 'api',

    // Client operations
    getClients: clientService.getClients.bind(clientService),
    getClientById: clientService.getClientById.bind(clientService),
    createClient: clientService.createClient.bind(clientService),
    updateClient: clientService.updateClient.bind(clientService),
    deleteClient: clientService.deleteClient.bind(clientService),

    // Care Plan operations
    getCarePlans: carePlanService.getCarePlans.bind(carePlanService),
    getCarePlanById: carePlanService.getCarePlanById.bind(carePlanService),
    createCarePlan: carePlanService.createCarePlan.bind(carePlanService),
    updateCarePlan: carePlanService.updateCarePlan.bind(carePlanService),
    activateCarePlan: carePlanService.activateCarePlan.bind(carePlanService),
    getTasks: carePlanService.getTasks.bind(carePlanService),
    getTaskById: carePlanService.getTaskById.bind(carePlanService),
    completeTask: carePlanService.completeTask.bind(carePlanService),

    // Caregiver operations - adapter methods
    getCaregivers: async (filters) => {
      const result = await caregiverService.searchCaregivers(filters);
      return {
        items: result.items as any[], // CaregiverListItem is a subset of Caregiver
        total: result.total,
        page: result.page,
        pageSize: result.limit,
        hasMore: result.page < result.totalPages,
      };
    },
    getCaregiverById: caregiverService.getCaregiverById.bind(caregiverService),
    createCaregiver: caregiverService.createCaregiver.bind(caregiverService) as any, // Type mismatch between input types
    updateCaregiver: caregiverService.updateCaregiver.bind(caregiverService) as any,
    deleteCaregiver: caregiverService.deleteCaregiver.bind(caregiverService),

    // Billing operations - adapter methods
    getInvoices: async (filters) => {
      const result = await billingService.getInvoices(filters);
      return {
        items: result.items,
        total: result.total,
        page: 1,
        pageSize: result.items.length,
        hasMore: result.hasMore,
      };
    },
    getInvoiceById: billingService.getInvoiceById.bind(billingService),
    createInvoice: billingService.createInvoice.bind(billingService),
    updateInvoice: billingService.updateInvoice.bind(billingService),
    deleteInvoice: billingService.deleteInvoice.bind(billingService),

    // Payroll operations - adapter methods
    getPayrollPeriods: async (filters) => {
      const result = await payrollService.getPayPeriods(filters);
      return {
        items: result.items,
        total: result.total,
        page: 1,
        pageSize: result.items.length,
        hasMore: result.hasMore,
      };
    },
    getPayrollPeriodById: payrollService.getPayPeriodById.bind(payrollService),
    createPayrollPeriod: async () => {
      throw new Error('Not implemented - use createPayRun instead');
    },
    processPayroll: payrollService.processPayRun.bind(payrollService) as any, // Return type mismatch: PayRun vs PayPeriod

    // Shift Matching operations - adapter methods
    getShiftListings: async (filters) => {
      const result = await shiftMatchingService.getOpenShifts(filters);
      return {
        items: result.items,
        total: result.total,
        page: 1,
        pageSize: result.items.length,
        hasMore: result.hasMore,
      };
    },
    getShiftListingById: shiftMatchingService.getOpenShiftById.bind(shiftMatchingService),
    createShiftListing: async () => {
      throw new Error('Not implemented - shift listings are created from scheduled visits');
    },
    updateShiftListing: async () => {
      throw new Error('Not implemented - shift listings are updated through visit changes');
    },
    getApplicationsForShift: async (shiftId) => {
      const result = await shiftMatchingService.getProposals({ openShiftId: shiftId });
      return result.items;
    },
    applyToShift: async (shiftId, caregiverId) => {
      return shiftMatchingService.createProposal({ 
        openShiftId: shiftId, 
        caregiverId 
      });
    },
  };
};
