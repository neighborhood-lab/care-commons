import type { Entity, UUID, Timestamp } from '@care-commons/core';

/**
 * Mileage rate types
 */
export type MileageRateType =
  | 'BUSINESS'
  | 'MEDICAL'
  | 'MOVING'
  | 'CHARITY';

/**
 * Distance unit types
 */
export type DistanceUnit = 'MILES' | 'KILOMETERS';

/**
 * Mileage entry entity representing a single mileage claim
 */
export interface MileageEntry extends Entity {
  // Employee information
  employeeId: UUID;

  // Trip details
  tripDate: Timestamp;
  startLocation: string;
  endLocation: string;
  distance: number;
  distanceUnit: DistanceUnit;

  // Purpose and category
  purpose: string;
  rateType: MileageRateType;
  clientId?: UUID; // If related to a specific client visit

  // Rate and calculation
  ratePerUnit: number; // Rate per mile/km in cents
  calculatedAmount: number; // distance * ratePerUnit in cents

  // Vehicle information
  vehicleDescription?: string;
  licensePlate?: string;

  // Route details
  routeNotes?: string;
  odometerStart?: number;
  odometerEnd?: number;

  // Status tracking
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  submittedAt?: Timestamp;
  approvedBy?: UUID;
  approvedAt?: Timestamp;
  rejectionReason?: string;

  // Payment information
  paidAt?: Timestamp;
  paymentReference?: string;

  // Metadata
  organizationId: UUID;
  branchId: UUID;
  notes?: string;
  tags?: string[];
}

/**
 * Input for creating a new mileage entry
 */
export interface CreateMileageEntryInput {
  employeeId: UUID;
  tripDate: Timestamp;
  startLocation: string;
  endLocation: string;
  distance: number;
  distanceUnit?: DistanceUnit;
  purpose: string;
  rateType?: MileageRateType;
  clientId?: UUID;
  vehicleDescription?: string;
  licensePlate?: string;
  odometerStart?: number;
  odometerEnd?: number;
  routeNotes?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Input for updating a mileage entry
 */
export interface UpdateMileageEntryInput {
  tripDate?: Timestamp;
  startLocation?: string;
  endLocation?: string;
  distance?: number;
  distanceUnit?: DistanceUnit;
  purpose?: string;
  rateType?: MileageRateType;
  clientId?: UUID;
  vehicleDescription?: string;
  licensePlate?: string;
  odometerStart?: number;
  odometerEnd?: number;
  routeNotes?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Mileage rate configuration
 */
export interface MileageRate extends Entity {
  rateType: MileageRateType;
  ratePerMile: number; // In cents
  ratePerKilometer: number; // In cents
  effectiveDate: Timestamp;
  endDate?: Timestamp;
  organizationId: UUID;
  isDefault: boolean;
  description?: string;
}

/**
 * Input for creating a new mileage rate
 */
export interface CreateMileageRateInput {
  rateType: MileageRateType;
  ratePerMile: number;
  ratePerKilometer: number;
  effectiveDate: Timestamp;
  endDate?: Timestamp;
  isDefault?: boolean;
  description?: string;
}

/**
 * Filter criteria for querying mileage entries
 */
export interface MileageQueryFilter {
  employeeId?: UUID;
  clientId?: UUID;
  rateType?: MileageRateType;
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  startDate?: Timestamp;
  endDate?: Timestamp;
  minDistance?: number;
  maxDistance?: number;
  organizationId?: UUID;
  branchId?: UUID;
}

/**
 * Summary statistics for mileage entries
 */
export interface MileageSummary {
  totalDistance: number;
  totalAmount: number;
  totalCount: number;
  byRateType: Record<MileageRateType, { count: number; distance: number; amount: number }>;
  byStatus: Record<string, { count: number; distance: number; amount: number }>;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
}
