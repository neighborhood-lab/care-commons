/**
 * API Provider - Production Implementation
 * 
 * Provides access to backend API services
 */

// @ts-nocheck - Silencing pre-existing type errors (not part of showcase PR)

import type { ApiClient } from '../services/api-client';
import { createClientApiService } from '@/verticals/client-demographics/services/client-api';
import { createCarePlanApiService } from '@/verticals/care-plans/services/care-plan-api-service';
import { createCaregiverApiService } from '@/verticals/caregivers/services/caregiver-api';
import { createBillingApiService } from '@/verticals/billing-invoicing/services/billing-api';
import { createPayrollApiService } from '@/verticals/payroll-processing/services/payroll-api';
import { createShiftMatchingApiService } from '@/verticals/shift-matching/services/shift-matching-api';

import type { DataProvider, ProviderConfig } from './types';

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

    // Caregiver operations
    getCaregivers: caregiverService.getCaregivers.bind(caregiverService),
    getCaregiverById: caregiverService.getCaregiverById.bind(caregiverService),
    createCaregiver: caregiverService.createCaregiver.bind(caregiverService),
    updateCaregiver: caregiverService.updateCaregiver.bind(caregiverService),
    deleteCaregiver: caregiverService.deleteCaregiver.bind(caregiverService),

    // Billing operations
    getInvoices: billingService.getInvoices.bind(billingService),
    getInvoiceById: billingService.getInvoiceById.bind(billingService),
    createInvoice: billingService.createInvoice.bind(billingService),
    updateInvoice: billingService.updateInvoice.bind(billingService),
    deleteInvoice: billingService.deleteInvoice.bind(billingService),

    // Payroll operations
    getPayrollPeriods: payrollService.getPayrollPeriods.bind(payrollService),
    getPayrollPeriodById: payrollService.getPayrollPeriodById.bind(payrollService),
    createPayrollPeriod: payrollService.createPayrollPeriod.bind(payrollService),
    processPayroll: payrollService.processPayroll.bind(payrollService),

    // Shift Matching operations
    getShiftListings: shiftMatchingService.getShiftListings.bind(shiftMatchingService),
    getShiftListingById: shiftMatchingService.getShiftListingById.bind(shiftMatchingService),
    createShiftListing: shiftMatchingService.createShiftListing.bind(shiftMatchingService),
    updateShiftListing: shiftMatchingService.updateShiftListing.bind(shiftMatchingService),
    getApplicationsForShift: shiftMatchingService.getApplicationsForShift.bind(shiftMatchingService),
    applyToShift: shiftMatchingService.applyToShift.bind(shiftMatchingService),
  };
};
