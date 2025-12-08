/**
 * Compliance Checking Service
 *
 * AI-powered automated compliance checking for home health documentation.
 * Validates against Medicare, Medicaid, and state regulatory requirements.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface ComplianceCheckRequest {
  visitId?: string; // Check compliance for a specific visit
  clientId?: string; // Check compliance for all recent client visits
  lookbackDays?: number; // Default 7 days
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

  constructor(private db: Knex) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Check compliance for visits using Claude AI
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
    const lookbackDays = request.lookbackDays || 7;
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

    // Group by visit
    const visitData = visits.map((visit) => ({
      ...visit,
      notes: visitNotes.filter((n) => n.visit_id === visit.id),
      evv: evvRecords.filter((e) => e.visit_id === visit.id),
      signatures: signatures.filter((s) => s.visit_id === visit.id),
    }));

    // Build prompt for Claude
    const prompt = this.buildComplianceCheckPrompt(visitData, lookbackDays);

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
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
    } catch (error) {
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text);
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
  private buildComplianceCheckPrompt(visitData: any[], lookbackDays: number): string {
    const visitsDetail = visitData
      .map(
        (visit, index) =>
          `
=== VISIT ${index + 1} ===
Visit ID: ${visit.id}
Date: ${visit.scheduled_start}
Client: ${visit.client_first_name} ${visit.client_last_name}
Caregiver: ${visit.caregiver_first_name || 'Unknown'} ${visit.caregiver_last_name || ''}
Status: ${visit.status}
Scheduled Duration: ${visit.scheduled_duration_minutes || 'N/A'} minutes
Actual Start: ${visit.actual_start || 'Not recorded'}
Actual End: ${visit.actual_end || 'Not recorded'}

VISIT NOTES (${visit.notes.length}):
${
  visit.notes.length > 0
    ? visit.notes
        .map(
          (note: any) => `
  - Date: ${note.visit_date}
  - Type: ${note.note_type || 'General'}
  - Subjective: ${note.subjective_notes || 'Not documented'}
  - Objective: ${note.objective_notes || 'Not documented'}
  - Assessment: ${note.assessment || 'Not documented'}
  - Plan: ${note.plan || 'Not documented'}
  - Narrative: ${note.narrative_note || 'Not documented'}
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
          (evv: any) => `
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
          (sig: any) => `
  - Signer: ${sig.signer_name || 'Unknown'}
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
