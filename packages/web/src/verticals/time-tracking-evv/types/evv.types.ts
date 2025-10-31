export interface EVVRecord {
  id: string;
  visitId: string;
  caregiverId: string;
  clientId: string;
  clockInTime: string;
  clockOutTime?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'VERIFIED';
  verificationMethod: 'GPS' | 'PHONE' | 'BIOMETRIC' | 'MANUAL';
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  totalMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EVVSearchFilters {
  caregiverId?: string;
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  verificationMethod?: string;
}

export interface EVVListResponse {
  items: EVVRecord[];
  total: number;
  hasMore: boolean;
}
