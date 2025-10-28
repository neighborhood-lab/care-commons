/**
 * Search query builder for advanced client filtering
 * 
 * Provides a fluent interface for building complex client searches
 */

import { ClientSearchFilters, ClientStatus, RiskType } from '../types/client';

/**
 * Fluent search builder for client queries
 */
export class ClientSearchBuilder {
  private filters: ClientSearchFilters = {};

  /**
   * Search by name or client number
   */
  query(searchTerm: string): this {
    this.filters.query = searchTerm;
    return this;
  }

  /**
   * Filter by organization
   */
  inOrganization(organizationId: string): this {
    this.filters.organizationId = organizationId;
    return this;
  }

  /**
   * Filter by branch
   */
  inBranch(branchId: string): this {
    this.filters.branchId = branchId;
    return this;
  }

  /**
   * Filter by status(es)
   */
  withStatus(...statuses: ClientStatus[]): this {
    this.filters.status = statuses;
    return this;
  }

  /**
   * Filter active clients only
   */
  activeOnly(): this {
    this.filters.status = ['ACTIVE'];
    return this;
  }

  /**
   * Filter by program enrollment
   */
  enrolledIn(programId: string): this {
    this.filters.programId = programId;
    return this;
  }

  /**
   * Filter by risk flag types
   */
  withRiskFlags(...riskTypes: RiskType[]): this {
    this.filters.riskType = riskTypes;
    return this;
  }

  /**
   * Filter clients with high or critical risk flags
   */
  highRiskOnly(): this {
    this.filters.riskType = [
      'FALL_RISK',
      'WANDERING',
      'AGGRESSIVE_BEHAVIOR',
      'SAFETY_CONCERN',
      'ABUSE_NEGLECT_CONCERN',
    ];
    return this;
  }

  /**
   * Filter by age range
   */
  ageBetween(minAge: number, maxAge: number): this {
    this.filters.minAge = minAge;
    this.filters.maxAge = maxAge;
    return this;
  }

  /**
   * Filter by minimum age
   */
  ageAtLeast(minAge: number): this {
    this.filters.minAge = minAge;
    return this;
  }

  /**
   * Filter by maximum age
   */
  ageAtMost(maxAge: number): this {
    this.filters.maxAge = maxAge;
    return this;
  }

  /**
   * Filter by city
   */
  inCity(city: string): this {
    this.filters.city = city;
    return this;
  }

  /**
   * Filter by state
   */
  inState(state: string): this {
    this.filters.state = state;
    return this;
  }

  /**
   * Filter clients with active services
   */
  withActiveServices(): this {
    this.filters.hasActiveServices = true;
    return this;
  }

  /**
   * Build and return the filters object
   */
  build(): ClientSearchFilters {
    return { ...this.filters };
  }

  /**
   * Reset all filters
   */
  reset(): this {
    this.filters = {};
    return this;
  }

  /**
   * Clone the builder with current filters
   */
  clone(): ClientSearchBuilder {
    const builder = new ClientSearchBuilder();
    builder.filters = { ...this.filters };
    return builder;
  }
}

/**
 * Create a new search builder instance
 */
export function createClientSearch(): ClientSearchBuilder {
  return new ClientSearchBuilder();
}

/**
 * Predefined search templates for common queries
 */
export const ClientSearchTemplates = {
  /**
   * All active clients
   */
  activeClients: () => createClientSearch().activeOnly(),

  /**
   * High-risk active clients
   */
  highRiskClients: () =>
    createClientSearch()
      .activeOnly()
      .highRiskOnly(),

  /**
   * Elderly clients (80+)
   */
  elderlyClients: () =>
    createClientSearch()
      .activeOnly()
      .ageAtLeast(80),

  /**
   * Clients pending intake
   */
  pendingIntake: () => createClientSearch().withStatus('PENDING_INTAKE'),

  /**
   * New inquiries
   */
  newInquiries: () => createClientSearch().withStatus('INQUIRY'),

  /**
   * Clients on hold
   */
  onHold: () => createClientSearch().withStatus('ON_HOLD'),

  /**
   * Clients in a specific city
   */
  inCity: (city: string) =>
    createClientSearch()
      .activeOnly()
      .inCity(city),

  /**
   * Clients with fall risk
   */
  fallRisk: () =>
    createClientSearch()
      .activeOnly()
      .withRiskFlags('FALL_RISK'),

  /**
   * Clients with wandering risk
   */
  wanderingRisk: () =>
    createClientSearch()
      .activeOnly()
      .withRiskFlags('WANDERING'),
};

/**
 * Usage examples:
 * 
 * // Basic search
 * const filters = createClientSearch()
 *   .activeOnly()
 *   .inCity('Springfield')
 *   .ageAtLeast(65)
 *   .build();
 * 
 * // Using templates
 * const filters = ClientSearchTemplates.highRiskClients().build();
 * 
 * // Complex search
 * const filters = createClientSearch()
 *   .inOrganization('org-123')
 *   .withStatus('ACTIVE', 'ON_HOLD')
 *   .ageBetween(60, 90)
 *   .withRiskFlags('FALL_RISK', 'MEDICATION_COMPLIANCE')
 *   .inState('IL')
 *   .build();
 */
