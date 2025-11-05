/**
 * Role Context
 *
 * Manages the current user role/perspective for the showcase.
 * Allows switching between different roles to demonstrate how
 * different users interact with the system.
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'patient' | 'family' | 'caregiver' | 'coordinator' | 'admin';

export interface RolePersona {
  role: UserRole;
  name: string;
  description: string;
  primaryFeatures: string[];
  relatedDataId?: string; // Links to a specific client or caregiver
}

export const rolePersonas: Record<UserRole, RolePersona> = {
  patient: {
    role: 'patient',
    name: 'Margaret Thompson',
    description: 'Patient receiving care services',
    primaryFeatures: ['View my care plan', 'Track upcoming tasks', 'See caregiver schedule', 'View my profile'],
    relatedDataId: 'client-001',
  },
  family: {
    role: 'family',
    name: 'Sarah Thompson',
    description: "Family member of patient (Margaret's daughter)",
    primaryFeatures: ['View care status', 'Monitor tasks', 'Communication', 'View invoices'],
    relatedDataId: 'client-001', // Same client as patient
  },
  caregiver: {
    role: 'caregiver',
    name: 'Emily Rodriguez',
    description: 'Certified Nursing Assistant providing care',
    primaryFeatures: ['My schedule', 'Complete tasks', 'Apply to shifts', 'View clients'],
    relatedDataId: 'caregiver-001',
  },
  coordinator: {
    role: 'coordinator',
    name: 'Care Coordinator',
    description: 'Manages care plans and coordinates services',
    primaryFeatures: ['Manage care plans', 'Assign caregivers', 'Monitor compliance', 'Generate reports'],
    relatedDataId: 'coordinator-001',
  },
  admin: {
    role: 'admin',
    name: 'System Administrator',
    description: 'Full system access and management',
    primaryFeatures: ['All features', 'Billing & payroll', 'User management', 'Analytics'],
  },
};

interface RoleContextValue {
  currentRole: UserRole;
  currentPersona: RolePersona;
  setRole: (role: UserRole) => void;
  isRoleAllowed: (allowedRoles: UserRole[]) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

interface RoleProviderProps {
  children: ReactNode;
  defaultRole?: UserRole;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({
  children,
  defaultRole = 'coordinator',
}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(defaultRole);

  const currentPersona = rolePersonas[currentRole];

  const isRoleAllowed = (allowedRoles: UserRole[]): boolean => {
    // Admin can access everything
    if (currentRole === 'admin') return true;
    return allowedRoles.includes(currentRole);
  };

  const value: RoleContextValue = {
    currentRole,
    currentPersona,
    setRole: setCurrentRole,
    isRoleAllowed,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = (): RoleContextValue => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};
