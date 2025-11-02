/**
 * Organization API Client
 * 
 * Handles API calls for organization registration and team invitations
 */

import type { ApiClient } from './api-client';

// Re-export types from core package (in a real scenario, these would be shared)
export interface USStateCode {
  code: string;
  name: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateOrganizationRequest {
  name: string;
  legalName?: string;
  stateCode: string;
  taxId?: string;
  licenseNumber?: string;
  phone?: string;
  email: string;
  website?: string;
  primaryAddress: Address;
  billingAddress?: Address;
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  legalName: string | null;
  stateCode: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface CreateInviteRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  branchIds?: string[];
  expiresInDays?: number;
}

export interface InviteToken {
  id: string;
  token: string;
  organizationId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  expiresAt: string;
  status: string;
}

export interface InviteDetails {
  token: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string;
  organizationId: string;
  roles: string[];
  expiresAt: string;
  isValid: boolean;
}

export interface AcceptInviteRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * US States list for state selector
 * Currently configured for TX and FL, designed to scale to all 50 states
 */
export const US_STATES: USStateCode[] = [
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  // Additional states can be added as the platform scales
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'GA', name: 'Georgia' },
  // ... (remaining states can be added as needed)
];

export class OrganizationApi {
  constructor(private apiClient: ApiClient) {}

  /**
   * Register a new organization
   */
  async registerOrganization(
    request: CreateOrganizationRequest
  ): Promise<{ organization: Organization; adminUserId: string }> {
    const response = await this.apiClient.post<
      ApiResponse<{ organization: Organization; adminUserId: string }>
    >('/api/organizations/register', request);

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to register organization');
    }

    return response.data;
  }

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization> {
    const response = await this.apiClient.get<ApiResponse<Organization>>(
      `/api/organizations/${id}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to fetch organization');
    }

    return response.data;
  }

  /**
   * Create a team member invitation
   */
  async createInvitation(
    organizationId: string,
    request: CreateInviteRequest
  ): Promise<InviteToken> {
    const response = await this.apiClient.post<ApiResponse<InviteToken>>(
      `/api/organizations/${organizationId}/invitations`,
      request
    );

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to create invitation');
    }

    return response.data;
  }

  /**
   * Get invitation details
   */
  async getInvitationDetails(token: string): Promise<InviteDetails> {
    const response = await this.apiClient.get<ApiResponse<InviteDetails>>(
      `/api/invitations/${token}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to fetch invitation details');
    }

    return response.data;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(
    request: AcceptInviteRequest
  ): Promise<{ userId: string; message: string }> {
    const response = await this.apiClient.post<
      ApiResponse<{ userId: string; message: string }>
    >('/api/invitations/accept', request);

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to accept invitation');
    }

    return response.data;
  }

  /**
   * List organization invitations
   */
  async getOrganizationInvitations(organizationId: string): Promise<InviteToken[]> {
    const response = await this.apiClient.get<ApiResponse<InviteToken[]>>(
      `/api/organizations/${organizationId}/invitations`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to fetch invitations');
    }

    return response.data;
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(token: string): Promise<void> {
    const response = await this.apiClient.delete<ApiResponse<void>>(
      `/api/invitations/${token}`
    );

    if (!response.success) {
      throw new Error(response.error ?? 'Failed to revoke invitation');
    }
  }
}
