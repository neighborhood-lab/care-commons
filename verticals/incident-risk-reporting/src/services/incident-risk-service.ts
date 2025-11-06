/**
 * @care-commons/incident-risk-reporting - Service
 *
 * Business logic for incident and risk reporting
 */

import type { UUID, UserContext } from '@care-commons/core';
import type { IncidentRiskRepository } from '../repositories/incident-risk-repository.js';
import type {
  IncidentReport,
  RiskAssessment,
  Investigation,
  CorrectiveAction,
  RegulatoryReport,
  RiskDashboard,
  CreateIncidentReportInput,
  CreateRiskAssessmentInput,
  StartInvestigationInput,
  CreateCorrectiveActionInput,
  SubmitRegulatoryReportInput,
} from '../types/incident-risk.js';

/**
 * Service for incident and risk reporting business logic
 */
export class IncidentRiskService {
  constructor(private repository: IncidentRiskRepository) {}

  // ============================================================================
  // Incident Report Operations
  // ============================================================================

  /**
   * Report a new incident
   */
  async reportIncident(
    input: CreateIncidentReportInput,
    context: UserContext,
  ): Promise<IncidentReport> {
    // Validate input
    this.validateIncidentInput(input);

    // Create incident report
    const incident = await this.repository.createIncidentReport(input, context);

    // Determine if regulatory reporting is required
    const requiresRegulatory = this.determineRegulatoryRequirement(incident);
    if (requiresRegulatory) {
      await this.repository.updateIncidentReport(
        incident.id,
        { regulatoryReportingRequired: true },
        context,
      );
    }

    // Determine if investigation is required
    const requiresInvestigation = this.determineInvestigationRequirement(incident);
    if (requiresInvestigation) {
      await this.repository.updateIncidentReport(
        incident.id,
        { investigationRequired: true },
        context,
      );
    }

    // TODO: Trigger notifications (family, physician, management)

    return incident;
  }

  /**
   * Get incident report by ID
   */
  async getIncidentReport(
    id: UUID,
    context: UserContext,
  ): Promise<IncidentReport | null> {
    return this.repository.getIncidentReportById(id, context);
  }

  /**
   * Update incident report
   */
  async updateIncidentReport(
    id: UUID,
    updates: Partial<IncidentReport>,
    context: UserContext,
  ): Promise<IncidentReport> {
    // Validate state transitions
    this.validateIncidentStatusTransition(updates.status);

    return this.repository.updateIncidentReport(id, updates, context);
  }

  /**
   * Close incident report
   */
  async closeIncident(
    id: UUID,
    closureNotes: string,
    context: UserContext,
  ): Promise<IncidentReport> {
    // Verify all requirements are met for closure
    const incident = await this.repository.getIncidentReportById(id, context);
    if (!incident) {
      throw new Error('Incident not found');
    }

    this.validateIncidentCanBeClosed(incident);

    return this.repository.updateIncidentReport(
      id,
      {
        status: 'CLOSED',
        closedAt: new Date().toISOString() as any,
        closedBy: context.userId,
        closureNotes,
      },
      context,
    );
  }

  // ============================================================================
  // Risk Assessment Operations
  // ============================================================================

  /**
   * Create a new risk assessment
   */
  async createRiskAssessment(
    input: CreateRiskAssessmentInput,
    context: UserContext,
  ): Promise<RiskAssessment> {
    // Validate input
    this.validateRiskAssessmentInput(input);

    // Create assessment
    const assessment = await this.repository.createRiskAssessment(input, context);

    // If high or critical risk, may need immediate action
    if (assessment.riskLevel === 'HIGH' || assessment.riskLevel === 'CRITICAL') {
      // TODO: Trigger alerts to care coordinators
    }

    return assessment;
  }

  /**
   * Get active risk assessments for a client
   */
  async getClientActiveRisks(
    clientId: UUID,
    context: UserContext,
  ): Promise<RiskAssessment[]> {
    return this.repository.getActiveRiskAssessments(clientId, context);
  }

  // ============================================================================
  // Investigation Operations
  // ============================================================================

  /**
   * Start an investigation for an incident
   */
  async startInvestigation(
    input: StartInvestigationInput,
    context: UserContext,
  ): Promise<Investigation> {
    // Create investigation
    const investigation = await this.repository.createInvestigation(input, context);

    // Update incident report
    await this.repository.updateIncidentReport(
      input.incidentReportId,
      {
        status: 'UNDER_REVIEW',
        investigationAssignedTo: input.assignedTo,
        investigationStartedAt: new Date().toISOString() as any,
      },
      context,
    );

    // TODO: Notify assigned investigator

    return investigation;
  }

  /**
   * Complete investigation
   */
  async completeInvestigation(
    id: UUID,
    findings: string,
    outcome: any,
    recommendations: string[],
    context: UserContext,
  ): Promise<Investigation> {
    const investigation = await this.repository.updateInvestigation(
      id,
      {
        status: 'COMPLETED',
        findings,
        outcome,
        recommendations,
        completedAt: new Date().toISOString() as any,
      },
      context,
    );

    // Update related incident
    if (investigation.incidentReportId) {
      await this.repository.updateIncidentReport(
        investigation.incidentReportId,
        {
          investigationCompletedAt: new Date().toISOString() as any,
        },
        context,
      );
    }

    return investigation;
  }

  // ============================================================================
  // Corrective Action Operations
  // ============================================================================

  /**
   * Create a corrective action
   */
  async createCorrectiveAction(
    input: CreateCorrectiveActionInput,
    context: UserContext,
  ): Promise<CorrectiveAction> {
    // Create corrective action
    const action = await this.repository.createCorrectiveAction(input, context);

    // TODO: Notify assigned person

    return action;
  }

  /**
   * Update corrective action progress
   */
  async updateCorrectiveActionProgress(
    id: UUID,
    progress: number,
    notes: string,
    context: UserContext,
  ): Promise<CorrectiveAction> {
    return this.repository.updateCorrectiveAction(
      id,
      { progress, status: progress === 100 ? 'COMPLETED' : 'IN_PROGRESS' },
      context,
    );
  }

  /**
   * Verify corrective action effectiveness
   */
  async verifyCorrectiveAction(
    id: UUID,
    effectivenessRating: 'INEFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'EFFECTIVE' | 'HIGHLY_EFFECTIVE',
    verificationNotes: string,
    context: UserContext,
  ): Promise<CorrectiveAction> {
    return this.repository.updateCorrectiveAction(
      id,
      {
        status: 'VERIFIED',
        effectivenessRating,
        verificationNotes,
        verifiedBy: context.userId,
        verifiedAt: new Date().toISOString() as any,
      },
      context,
    );
  }

  // ============================================================================
  // Regulatory Reporting Operations
  // ============================================================================

  /**
   * Submit a regulatory report
   */
  async submitRegulatoryReport(
    input: SubmitRegulatoryReportInput,
    context: UserContext,
  ): Promise<RegulatoryReport> {
    // Create regulatory report
    const report = await this.repository.createRegulatoryReport(input, context);

    // Update incident report
    await this.repository.updateIncidentReport(
      input.incidentReportId,
      {
        regulatoryAgencies: [input.agencyName],
      },
      context,
    );

    return report;
  }

  // ============================================================================
  // Analytics & Dashboard
  // ============================================================================

  /**
   * Get risk dashboard for organization
   */
  async getRiskDashboard(
    organizationId: UUID,
    branchId: UUID | undefined,
    context: UserContext,
  ): Promise<RiskDashboard> {
    // Implementation would aggregate data from multiple sources
    throw new Error('Not implemented');
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private validateIncidentInput(input: CreateIncidentReportInput): void {
    if (!input.description || input.description.trim().length === 0) {
      throw new Error('Incident description is required');
    }
    if (!input.immediateActions || input.immediateActions.trim().length === 0) {
      throw new Error('Immediate actions taken is required');
    }
    if (input.injuryOccurred && !input.injuryDescription) {
      throw new Error('Injury description is required when injury occurred');
    }
  }

  private validateRiskAssessmentInput(input: CreateRiskAssessmentInput): void {
    if (input.riskFactors.length === 0) {
      throw new Error('At least one risk factor must be identified');
    }
    if (input.recommendedInterventions.length === 0) {
      throw new Error('At least one intervention must be recommended');
    }
  }

  private validateIncidentStatusTransition(newStatus?: string): void {
    // Implement status transition rules
    // e.g., can't go from CLOSED back to DRAFT
  }

  private validateIncidentCanBeClosed(incident: IncidentReport): void {
    if (incident.investigationRequired && !incident.investigationCompletedAt) {
      throw new Error('Investigation must be completed before closing incident');
    }
    if (incident.regulatoryReportingRequired) {
      // Verify regulatory reports have been filed
      // This would check the regulatory reports table
    }
  }

  private determineRegulatoryRequirement(incident: IncidentReport): boolean {
    // Business rules for when regulatory reporting is required
    // e.g., all ABUSE_ALLEGATION incidents, serious injuries, deaths, etc.
    const alwaysReportTypes = ['ABUSE_ALLEGATION', 'ELOPEMENT'];
    const requiresSeriousInjury = ['FALL', 'INJURY', 'CAREGIVER_INJURY'];

    if (alwaysReportTypes.includes(incident.incidentType)) {
      return true;
    }

    if (
      requiresSeriousInjury.includes(incident.incidentType) &&
      (incident.severity === 'SERIOUS' ||
        incident.severity === 'CRITICAL' ||
        incident.severity === 'CATASTROPHIC')
    ) {
      return true;
    }

    if (incident.hospitalTransport) {
      return true;
    }

    return false;
  }

  private determineInvestigationRequirement(incident: IncidentReport): boolean {
    // Business rules for when investigation is required
    if (incident.severity === 'SERIOUS' || incident.severity === 'CRITICAL' || incident.severity === 'CATASTROPHIC') {
      return true;
    }

    if (incident.incidentType === 'ABUSE_ALLEGATION') {
      return true;
    }

    return false;
  }
}
