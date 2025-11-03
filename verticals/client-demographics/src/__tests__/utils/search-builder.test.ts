/**
 * Tests for ClientSearchBuilder and Search Templates
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClientSearchBuilder,
  createClientSearch,
  ClientSearchTemplates,
} from '../../utils/search-builder';

describe('ClientSearchBuilder', () => {
  let builder: ClientSearchBuilder;

  beforeEach(() => {
    builder = new ClientSearchBuilder();
  });

  describe('Basic Filters', () => {
    it('should build a query filter', () => {
      const result = builder.query('john').build();
      expect(result.query).toBe('john');
    });

    it('should build an organization filter', () => {
      const result = builder.inOrganization('org-1').build();
      expect(result.organizationId).toBe('org-1');
    });

    it('should build a branch filter', () => {
      const result = builder.inBranch('branch-1').build();
      expect(result.branchId).toBe('branch-1');
    });

    it('should build status filters', () => {
      const result = builder.withStatus('ACTIVE', 'PENDING_INTAKE').build();
      expect(result.status).toEqual(['ACTIVE', 'PENDING_INTAKE']);
    });

    it('should build an active-only filter', () => {
      const result = builder.activeOnly().build();
      expect(result.status).toEqual(['ACTIVE']);
    });

    it('should build a program filter', () => {
      const result = builder.enrolledIn('program-1').build();
      expect(result.programId).toBe('program-1');
    });

    it('should build risk flag filters', () => {
      const result = builder.withRiskFlags('FALL_RISK', 'WANDERING').build();
      expect(result.riskType).toEqual(['FALL_RISK', 'WANDERING']);
    });

    it('should build high-risk-only filter', () => {
      const result = builder.highRiskOnly().build();
      expect(result.riskType).toContain('FALL_RISK');
      expect(result.riskType).toContain('WANDERING');
      expect(result.riskType).toContain('AGGRESSIVE_BEHAVIOR');
    });
  });

  describe('Age Filters', () => {
    it('should build age range filter', () => {
      const result = builder.ageBetween(18, 65).build();
      expect(result.minAge).toBe(18);
      expect(result.maxAge).toBe(65);
    });

    it('should build minimum age filter', () => {
      const result = builder.ageAtLeast(65).build();
      expect(result.minAge).toBe(65);
    });

    it('should build maximum age filter', () => {
      const result = builder.ageAtMost(30).build();
      expect(result.maxAge).toBe(30);
    });
  });

  describe('Location Filters', () => {
    it('should build city filter', () => {
      const result = builder.inCity('Springfield').build();
      expect(result.city).toBe('Springfield');
    });

    it('should build state filter', () => {
      const result = builder.inState('IL').build();
      expect(result.state).toBe('IL');
    });
  });

  describe('Service Filters', () => {
    it('should build active services filter', () => {
      const result = builder.withActiveServices().build();
      expect(result.hasActiveServices).toBe(true);
    });
  });

  describe('Chaining', () => {
    it('should allow chaining filters', () => {
      const result = builder
        .activeOnly()
        .inCity('Springfield')
        .ageAtLeast(65)
        .withRiskFlags('FALL_RISK')
        .build();

      expect(result.status).toEqual(['ACTIVE']);
      expect(result.city).toBe('Springfield');
      expect(result.minAge).toBe(65);
      expect(result.riskType).toEqual(['FALL_RISK']);
    });
  });

  describe('Reset and Clone', () => {
    it('should reset filters', () => {
      const resultBefore = builder.activeOnly().inCity('Springfield').build();

      expect(resultBefore.status).toBeDefined();
      expect(resultBefore.city).toBeDefined();

      const resultAfter = builder.reset().build();

      expect(resultAfter).toEqual({});
    });

    it('should clone builder with current filters', () => {
      const original = builder.activeOnly().inCity('Springfield');
      const clone = original.clone();

      const originalResult = original.build();
      const cloneResult = clone.build();

      expect(originalResult).toEqual(cloneResult);

      // Modify clone and ensure original is not affected
      clone.inState('IL');
      expect(original.build().state).toBeUndefined();
      expect(clone.build().state).toBe('IL');
    });
  });

  describe('createClientSearch', () => {
    it('should create a new search builder instance', () => {
      const search = createClientSearch();
      expect(search).toBeInstanceOf(ClientSearchBuilder);

      const result = search.activeOnly().build();
      expect(result.status).toEqual(['ACTIVE']);
    });
  });
});

describe('ClientSearchTemplates', () => {
  describe('activeClients', () => {
    it('should create active clients template', () => {
      const search = ClientSearchTemplates.activeClients();
      const filters = search.build();

      expect(filters.status).toEqual(['ACTIVE']);
    });
  });

  describe('highRiskClients', () => {
    it('should create high-risk clients template', () => {
      const search = ClientSearchTemplates.highRiskClients();
      const filters = search.build();

      expect(filters.status).toEqual(['ACTIVE']);
      expect(filters.riskType).toContain('FALL_RISK');
      expect(filters.riskType).toContain('WANDERING');
      expect(filters.riskType).toContain('AGGRESSIVE_BEHAVIOR');
    });
  });

  describe('elderlyClients', () => {
    it('should create elderly clients template', () => {
      const search = ClientSearchTemplates.elderlyClients();
      const filters = search.build();

      expect(filters.status).toEqual(['ACTIVE']);
      expect(filters.minAge).toBe(80);
    });
  });

  describe('pendingIntake', () => {
    it('should create pending intake template', () => {
      const search = ClientSearchTemplates.pendingIntake();
      const filters = search.build();

      expect(filters.status).toEqual(['PENDING_INTAKE']);
    });
  });

  describe('newInquiries', () => {
    it('should create new inquiries template', () => {
      const search = ClientSearchTemplates.newInquiries();
      const filters = search.build();

      expect(filters.status).toEqual(['INQUIRY']);
    });
  });

  describe('onHold', () => {
    it('should create on hold template', () => {
      const search = ClientSearchTemplates.onHold();
      const filters = search.build();

      expect(filters.status).toEqual(['ON_HOLD']);
    });
  });

  describe('inCity', () => {
    it('should create city template', () => {
      const search = ClientSearchTemplates.inCity('Chicago');
      const filters = search.build();

      expect(filters.status).toEqual(['ACTIVE']);
      expect(filters.city).toBe('Chicago');
    });
  });

  describe('fallRisk', () => {
    it('should create fall risk template', () => {
      const search = ClientSearchTemplates.fallRisk();
      const filters = search.build();

      expect(filters.status).toEqual(['ACTIVE']);
      expect(filters.riskType).toContain('FALL_RISK');
    });
  });

  describe('wanderingRisk', () => {
    it('should create wandering risk template', () => {
      const search = ClientSearchTemplates.wanderingRisk();
      const filters = search.build();

      expect(filters.status).toEqual(['ACTIVE']);
      expect(filters.riskType).toContain('WANDERING');
    });
  });
});
