/**
 * Data Provider Context
 *
 * React Context for dependency injection of data providers.
 * This allows the application to switch between different data sources
 * (API, mock, hybrid) without changing component code.
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import type { DataProvider } from './types';

interface DataProviderContextValue {
  provider: DataProvider;
}

const DataProviderContext = createContext<DataProviderContextValue | null>(null);

interface DataProviderProps {
  provider: DataProvider;
  children: ReactNode;
}

/**
 * Provider component that injects a data provider into the React tree
 */
export const DataProviderContextProvider: React.FC<DataProviderProps> = ({
  provider,
  children,
}) => {
  return (
    <DataProviderContext.Provider value={{ provider }}>
      {children}
    </DataProviderContext.Provider>
  );
};

/**
 * Hook to access the current data provider
 * Throws an error if used outside of DataProviderContextProvider
 */
export const useDataProvider = (): DataProvider => {
  const context = useContext(DataProviderContext);

  if (!context) {
    throw new Error('useDataProvider must be used within DataProviderContextProvider');
  }

  return context.provider;
};

/**
 * Convenience hooks for specific provider capabilities
 */
export const useClientProvider = () => {
  const provider = useDataProvider();
  return {
    getClients: provider.getClients.bind(provider),
    getClientById: provider.getClientById.bind(provider),
    createClient: provider.createClient.bind(provider),
    updateClient: provider.updateClient.bind(provider),
    deleteClient: provider.deleteClient.bind(provider),
  };
};

export const useCarePlanProvider = () => {
  const provider = useDataProvider();
  return {
    getCarePlans: provider.getCarePlans.bind(provider),
    getCarePlanById: provider.getCarePlanById.bind(provider),
    createCarePlan: provider.createCarePlan.bind(provider),
    updateCarePlan: provider.updateCarePlan.bind(provider),
    activateCarePlan: provider.activateCarePlan.bind(provider),
    getTasks: provider.getTasks.bind(provider),
    getTaskById: provider.getTaskById.bind(provider),
    completeTask: provider.completeTask.bind(provider),
  };
};

export const useCaregiverProvider = () => {
  const provider = useDataProvider();
  return {
    getCaregivers: provider.getCaregivers.bind(provider),
    getCaregiverById: provider.getCaregiverById.bind(provider),
    createCaregiver: provider.createCaregiver.bind(provider),
    updateCaregiver: provider.updateCaregiver.bind(provider),
    deleteCaregiver: provider.deleteCaregiver.bind(provider),
  };
};

export const useBillingProvider = () => {
  const provider = useDataProvider();
  return {
    getInvoices: provider.getInvoices.bind(provider),
    getInvoiceById: provider.getInvoiceById.bind(provider),
    createInvoice: provider.createInvoice.bind(provider),
    updateInvoice: provider.updateInvoice.bind(provider),
    deleteInvoice: provider.deleteInvoice.bind(provider),
  };
};

export const usePayrollProvider = () => {
  const provider = useDataProvider();
  return {
    getPayrollPeriods: provider.getPayrollPeriods.bind(provider),
    getPayrollPeriodById: provider.getPayrollPeriodById.bind(provider),
    createPayrollPeriod: provider.createPayrollPeriod.bind(provider),
    processPayroll: provider.processPayroll.bind(provider),
  };
};

export const useShiftMatchingProvider = () => {
  const provider = useDataProvider();
  return {
    getShiftListings: provider.getShiftListings.bind(provider),
    getShiftListingById: provider.getShiftListingById.bind(provider),
    createShiftListing: provider.createShiftListing.bind(provider),
    updateShiftListing: provider.updateShiftListing.bind(provider),
    getApplicationsForShift: provider.getApplicationsForShift.bind(provider),
    applyToShift: provider.applyToShift.bind(provider),
  };
};
