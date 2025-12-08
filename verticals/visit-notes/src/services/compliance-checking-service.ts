/**
 * Compliance Checking Service
 *
 * AI-powered automated compliance checking for home health documentation.
 * Validates against Medicare, Medicaid, and state regulatory requirements.
 *
 * Security: Includes prompt injection protection, cost controls, and safe logging.
 * Performance: Uses lookup maps instead of O(n²) filter operations.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

// Cost control constants
const MAX_VISITS_PER_CHECK = 50;
const MAX_LOOKBACK_DAYS = 30;
const MAX_TEXT_LENGTH = 1000; // Per field in prompt

export interface ComplianceCheckRequest {
  visitId?: string; // Check compliance for a specific visit
  clientId?: string; // Check compliance for all recent client visits
  lookbackDays?: number; // Default 7 days, max 30
}

export type ComplianceCategory =
  | 'DOCUMENTATION'
  | 'EVV'
  | 'SIGNATURES'
  | 'CARE_PLAN'
  | 'TIMING'
  | 'SUPERVISION'
  | 'BILLING';

export type ComplianceStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'CRITICAL';

export interface ComplianceViolation {
  category: ComplianceCategory;
  requirement: string;
  status: ComplianceStatus;
  description: string;
  evidence: string;
  regulation: string; // e.g., "42 CFR 484.55(a)"
  remediation: string;
  deadline?: string; // When it must be fixed by
}

export interface VisitComplianceResult {
  visitId: string;
  visitDate: string;
  clientName: string;
  caregiverName: string;
  overallStatus: ComplianceStatus;
  violations: ComplianceViolation[];
  compliantAreas: string[];
  riskScore: number; // 0-100 (0 = fully compliant)
}

export interface ComplianceCheckResult {
  analyzedAt: string;
  lookbackPeriod: {
    startDate: string;
    endDate: string;
    daysAnalyzed: number;
  };
  overallComplianceRate: number; // Percentage
  overallStatus: ComplianceStatus;
  visitResults: VisitComplianceResult[];
  criticalIssues: Array<{
    visitId: string;
    issue: string;
    deadline: string;
  }>;
  categoryBreakdown: Array<{
    category: ComplianceCategory;
    complianceRate: number;
    issueCount: number;
  }>;
  recommendations: Array<{
    priority: number;
    action: string;
    impact: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  summary: string;
}

export class ComplianceCheckingService {
  private anthropic: Anthropic;
  private readonly MODEL =
    process.env.COMPLIANCE_CHECK_MODEL || 'claude-3-5-haiku-20241022';

  constructor(private db: Knex) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Sanitize text for safe inclusion in prompts.
   * Prevents prompt injection attacks by removing dangerous patterns.
   */
  private sanitizeForPrompt(text: string | null | undefined): string {
    if (!text) return 'Not documented';

    return (
      text
        // Remove prompt injection patterns
        .replace(/IGNORE (ALL )?PREVIOUS INSTRUCTIONS/gi, '[REDACTED]')
        .replace(/SYSTEM:|ASSISTANT:|USER:|HUMAN:/gi, '[REDACTED]')
        .replace(/<\/?system>|<\/?user>|<\/?assistant>/gi, '[REDACTED]')
        .replace(/```[\s\S]*?```/g, '[CODE BLOCK REDACTED]')
        // Limit length
        .substring(0, MAX_TEXT_LENGTH)
    );
  }

  /**
   * Check compliance for visits using Claude AI
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
    // Apply cost controls
    const lookbackDays = Math.min(request.lookbackDays || 7, MAX_LOOKBACK_DAYS);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    // Build query for visits
    let visitsQuery = this.db('visits')
      .select(
        'visits.*',
        'clients.first_name as client_first_name',
        'clients.last_name as client_last_name',
        'caregivers.first_name as caregiver_first_name',
        'caregivers.last_name as caregiver_last_name',
      )
      .leftJoin('clients', 'visits.client_id', 'clients.id')
      .leftJoin('caregivers', 'visits.caregiver_id', 'caregivers.id')
      .where('visits.is_deleted', false)
      .where('visits.scheduled_start', '>=', startDate.toISOString())
      .where('visits.scheduled_start', '<=', endDate.toISOString())
      .orderBy('visits.scheduled_start', 'desc');

    if (request.visitId) {
      visitsQuery = visitsQuery.where('visits.id', request.visitId);
    }
    if (request.clientId) {
      visitsQuery = visitsQuery.where('visits.client_id', request.clientId);
    }

    // Apply visit limit
    visitsQuery = visitsQuery.limit(MAX_VISITS_PER_CHECK);

    const visits = await visitsQuery;

    if (visits.length === 0) {
      return {
        analyzedAt: new Date().toISOString(),
        lookbackPeriod: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          daysAnalyzed: lookbackDays,
        },
        overallComplianceRate: 100,
        overallStatus: 'COMPLIANT',
        visitResults: [],
        criticalIssues: [],
        categoryBreakdown: [],
        recommendations: [],
        summary: 'No visits found in the specified period.',
      };
    }

    // Check if limit was hit
    if (visits.length >= MAX_VISITS_PER_CHECK) {
      // Log warning (without exposing sensitive data)
      console.warn(
        `Compliance check hit visit limit. Analyzing ${MAX_VISITS_PER_CHECK} of potentially more visits.`,
      );
    }

    // Fetch related data for each visit
    const visitIds = visits.map((v) => v.id);

    const [visitNotes, evvRecords, signatures] = await Promise.all([
      this.db('visit_notes')
        .select('*')
        .whereIn('visit_id', visitIds)
        .where('is_deleted', false),
      this.db('evv_records')
        .select('*')
        .whereIn('visit_id', visitIds)
        .where('is_deleted', false)
        .catch(() => []), // Table might not exist
      this.db('signatures')
        .select('*')
        .whereIn('visit_id', visitIds)
        .where('is_deleted', false)
        .catch(() => []), // Table might not exist
    ]);

    // Use lookup maps for O(n) complexity instead of O(n²) filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notesByVisit: Record<string, any[]> = {};
    for (const note of visitNotes) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const visitId = (note as any).visit_id as string;
      if (!notesByVisit[visitId]) notesByVisit[visitId] = [];
      notesByVisit[visitId]!.push(note);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evvByVisit: Record<string, any[]> = {};
    for (const evv of evvRecords) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const visitId = (evv as any).visit_id as string;
      if (!evvByVisit[visitId]) evvByVisit[visitId] = [];
      evvByVisit[visitId]!.push(evv);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signaturesByVisit: Record<string, any[]> = {};
    for (const sig of signatures) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const visitId = (sig as any).visit_id as string;
      if (!signaturesByVisit[visitId]) signaturesByVisit[visitId] = [];
      signaturesByVisit[visitId]!.push(sig);
    }

    // Group by visit using lookup maps
    const visitData = visits.map((visit) => ({
      ...visit,
      notes: notesByVisit[visit.id] || [],
      evv: evvByVisit[visit.id] || [],
      signatures: signaturesByVisit[visit.id] || [],
    }));

    // Build prompt for Claude
    const prompt = this.buildComplianceCheckPrompt(visitData, lookbackDays);

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: this.MODEL,
      max_tokens: 8192,
      temperature: 0.1, // Very low for regulatory accuracy
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse AI response
    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    let analysisResult: Partial<ComplianceCheckResult>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch {
      // Log error safely without exposing AI response content
      console.error('Failed to parse AI compliance check response as JSON');
      throw new Error('Failed to parse compliance check results');
    }

    // Build result
    const result: ComplianceCheckResult = {
      analyzedAt: new Date().toISOString(),
      lookbackPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysAnalyzed: lookbackDays,
      },
      overallComplianceRate: analysisResult.overallComplianceRate || 0,
      overallStatus: analysisResult.overallStatus || 'NON_COMPLIANT',
      visitResults: analysisResult.visitResults || [],
      criticalIssues: analysisResult.criticalIssues || [],
      categoryBreakdown: analysisResult.categoryBreakdown || [],
      recommendations: analysisResult.recommendations || [],
      summary: analysisResult.summary || 'No summary available.',
    };

    return result;
  }

  /**
   * Build compliance check prompt for Claude
   */
  private buildComplianceCheckPrompt(
    visitData: Array<{
      id: string;
      scheduled_start: string;
      client_first_name?: string;
      client_last_name?: string;
      caregiver_first_name?: string;
      caregiver_last_name?: string;
      status?: string;
      scheduled_duration_minutes?: number;
      actual_start?: string;
      actual_end?: string;
      notes: Array<{
        visit_date?: string;
        note_type?: string;
        subjective_notes?: string;
        objective_notes?: string;
        assessment?: string;
        plan?: string;
        narrative_note?: string;
        safety_incidents?: boolean;
      }>;
      evv: Array<{
        clock_in_time?: string;
        clock_out_time?: string;
        location_verified?: boolean;
        verification_method?: string;
      }>;
      signatures: Array<{
        signer_name?: string;
        signer_relationship?: string;
        signed_at?: string;
      }>;
    }>,
    lookbackDays: number,
  ): string {
    const visitsDetail = visitData
      .map(
        (visit, index) =>
          `
=== VISIT ${index + 1} ===
Visit ID: ${visit.id}
Date: ${visit.scheduled_start}
Client: ${this.sanitizeForPrompt(visit.client_first_name)} ${this.sanitizeForPrompt(visit.client_last_name)}
Caregiver: ${this.sanitizeForPrompt(visit.caregiver_first_name) || 'Unknown'} ${this.sanitizeForPrompt(visit.caregiver_last_name) || ''}
Status: ${visit.status}
Scheduled Duration: ${visit.scheduled_duration_minutes || 'N/A'} minutes
Actual Start: ${visit.actual_start || 'Not recorded'}
Actual End: ${visit.actual_end || 'Not recorded'}

VISIT NOTES (${visit.notes.length}):
${
  visit.notes.length > 0
    ? visit.notes
        .map(
          (note) => `
  - Date: ${note.visit_date}
  - Type: ${note.note_type || 'General'}
  - Subjective: ${this.sanitizeForPrompt(note.subjective_notes)}
  - Objective: ${this.sanitizeForPrompt(note.objective_notes)}
  - Assessment: ${this.sanitizeForPrompt(note.assessment)}
  - Plan: ${this.sanitizeForPrompt(note.plan)}
  - Narrative: ${this.sanitizeForPrompt(note.narrative_note)}
  - Safety Incidents: ${note.safety_incidents ? 'YES' : 'No'}`,
        )
        .join('\n')
    : '  No notes documented'
}

EVV RECORDS (${visit.evv.length}):
${
  visit.evv.length > 0
    ? visit.evv
        .map(
          (evv) => `
  - Clock In: ${evv.clock_in_time || 'Not recorded'}
  - Clock Out: ${evv.clock_out_time || 'Not recorded'}
  - Location Verified: ${evv.location_verified ? 'Yes' : 'No'}
  - Method: ${evv.verification_method || 'Unknown'}`,
        )
        .join('\n')
    : '  No EVV records'
}

SIGNATURES (${visit.signatures.length}):
${
  visit.signatures.length > 0
    ? visit.signatures
        .map(
          (sig) => `
  - Signer: ${this.sanitizeForPrompt(sig.signer_name) || 'Unknown'}
  - Relationship: ${sig.signer_relationship || 'Unknown'}
  - Date: ${sig.signed_at || 'Not recorded'}`,
        )
        .join('\n')
    : '  No signatures'
}
`,
      )
      .join('\n');

    return `You are a home health compliance expert analyzing visit documentation for regulatory compliance. Your role is to identify compliance gaps and provide actionable remediation guidance.

**ANALYSIS PERIOD:** Last ${lookbackDays} days
**TOTAL VISITS:** ${visitData.length}

**VISITS TO ANALYZE:**
${visitsDetail}

**COMPLIANCE REQUIREMENTS TO CHECK:**

**1. DOCUMENTATION Requirements:**
- SOAP notes complete (Subjective, Objective, Assessment, Plan)
- Visit notes within 24 hours of visit
- Clear, specific language (no vague terms)
- Interventions documented
- Patient response documented
- Reference: 42 CFR 484.55

**2. EVV (Electronic Visit Verification) Requirements:**
- Clock in/out times recorded
- GPS location verification at client home
- Times match scheduled duration (±15 min variance allowed)
- Reference: 21st Century Cures Act, State EVV mandates

**3. SIGNATURE Requirements:**
- Client/responsible party signature
- Caregiver signature
- Signatures within 24 hours of visit
- Reference: State regulations vary

**4. CARE PLAN Requirements:**
- Services match authorized care plan
- Goals documented
- Progress toward goals noted
- Reference: 42 CFR 484.60

**5. TIMING Requirements:**
- Visit completed within scheduled window (±30 min)
- Duration matches authorized time
- No overlapping visits for caregiver
- Reference: State regulations, payer contracts

**6. SUPERVISION Requirements:**
- RN supervision per state requirements
- Supervisory notes if applicable
- Reference: State licensure requirements

**7. BILLING Compliance:**
- Services documented support billing codes
- No upcoding indicators
- Reference: Medicare/Medicaid billing guidelines

**COMPLIANCE STATUS LEVELS:**
- **COMPLIANT:** Meets all requirements
- **WARNING:** Minor issues, easy to fix
- **NON_COMPLIANT:** Significant gaps requiring attention
- **CRITICAL:** Audit risk, immediate action required

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON:
{
  "overallComplianceRate": 85,
  "overallStatus": "WARNING",
  "visitResults": [
    {
      "visitId": "uuid",
      "visitDate": "2025-01-15T10:00:00Z",
      "clientName": "John Doe",
      "caregiverName": "Jane Smith",
      "overallStatus": "WARNING",
      "violations": [
        {
          "category": "DOCUMENTATION|EVV|SIGNATURES|CARE_PLAN|TIMING|SUPERVISION|BILLING",
          "requirement": "SOAP notes must be complete",
          "status": "NON_COMPLIANT",
          "description": "Assessment section missing",
          "evidence": "Assessment field is empty",
          "regulation": "42 CFR 484.55(a)",
          "remediation": "Add clinical assessment to visit note",
          "deadline": "2025-01-17"
        }
      ],
      "compliantAreas": ["EVV verified", "Signatures present"],
      "riskScore": 35
    }
  ],
  "criticalIssues": [
    {
      "visitId": "uuid",
      "issue": "Missing EVV clock-out",
      "deadline": "2025-01-16"
    }
  ],
  "categoryBreakdown": [
    {
      "category": "DOCUMENTATION",
      "complianceRate": 80,
      "issueCount": 5
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "action": "Complete all SOAP note sections within 24 hours",
      "impact": "Prevents Medicare audit findings",
      "effort": "LOW"
    }
  ],
  "summary": "Overall compliance is at 85%. Main gaps are in documentation completeness. 2 critical EVV issues require immediate attention. Recommend implementing documentation checklists and EVV monitoring alerts."
}

**CRITICAL RULES:**
- Be thorough but fair - note both issues AND compliant areas
- Provide specific, actionable remediation steps
- Include regulatory references where applicable
- Prioritize issues by audit risk (CRITICAL > NON_COMPLIANT > WARNING)
- Consider deadlines (documentation typically 24-48 hours)
- EVV gaps are often CRITICAL for state audits
- Missing signatures can lead to payment denials

Provide your compliance analysis now:`;
  }
}
