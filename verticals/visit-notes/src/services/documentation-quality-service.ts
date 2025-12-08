/**
 * Documentation Quality Service
 *
 * AI-powered quality scoring for clinical visit notes.
 * Analyzes completeness, clarity, compliance, and clinical value.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface QualityScoreRequest {
  noteId: string;
}

export type QualityDimension = 'COMPLETENESS' | 'CLARITY' | 'COMPLIANCE' | 'CLINICAL_VALUE';

export interface DimensionScore {
  dimension: QualityDimension;
  score: number; // 0-100
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface DocumentationQualityResult {
  noteId: string;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensionScores: DimensionScore[];
  criticalIssues: string[];
  improvementPriorities: string[];
  complianceStatus: 'COMPLIANT' | 'MINOR_GAPS' | 'MAJOR_GAPS' | 'NON_COMPLIANT';
  analyzedAt: string;
  summary: string;
}

export class DocumentationQualityService {
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
   * Score documentation quality using Claude AI
   */
  async scoreDocumentationQuality(
    request: QualityScoreRequest,
  ): Promise<DocumentationQualityResult> {
    // Fetch visit note
    const note = await this.db('visit_notes')
      .select('*')
      .where({ id: request.noteId, is_deleted: false })
      .first();

    if (!note) {
      throw new Error('Visit note not found');
    }

    // Fetch related data for context
    const [visit, client] = await Promise.all([
      this.db('visits').select('*').where({ id: note.visit_id }).first(),
      this.db('clients').select('first_name', 'last_name', 'medical_history').where({ id: note.client_id }).first(),
    ]);

    // Build analysis prompt
    const prompt = this.buildQualityScoringPrompt(note, visit, client);

    // Call Claude AI
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      temperature: 0.2, // Low temperature for consistency
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

    let analysisResult: Partial<DocumentationQualityResult>;
    try {
      const textContent = content as { type: 'text'; text: string };
      analysisResult = JSON.parse(textContent.text);
    } catch (parseError) {
      // JSON parsing failed - log the error and rethrow with context
      const textContent = content as { type: 'text'; text: string };
      console.error('Failed to parse AI response:', textContent.text, parseError);
      throw new Error('Failed to parse documentation quality analysis');
    }

    // Build result
    const result: DocumentationQualityResult = {
      noteId: note.id,
      overallScore: analysisResult.overallScore || 0,
      grade: analysisResult.grade || 'F',
      dimensionScores: analysisResult.dimensionScores || [],
      criticalIssues: analysisResult.criticalIssues || [],
      improvementPriorities: analysisResult.improvementPriorities || [],
      complianceStatus: analysisResult.complianceStatus || 'NON_COMPLIANT',
      analyzedAt: new Date().toISOString(),
      summary: analysisResult.summary || 'No summary available.',
    };

    return result;
  }

  /**
   * Build quality scoring prompt for Claude
   */
  private buildQualityScoringPrompt(note: Record<string, unknown>, visit: Record<string, unknown> | null, client: Record<string, unknown> | null): string {
    const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown';
    const visitType = visit?.visit_type || 'Unknown';

    return `You are a clinical documentation quality expert analyzing a home health visit note. Your role is to assess the quality of clinical documentation across four dimensions: COMPLETENESS, CLARITY, COMPLIANCE, and CLINICAL_VALUE.

**VISIT CONTEXT:**
- Client: ${clientName}
- Visit Type: ${visitType}
- Visit Date: ${note.visit_date}
- Caregiver: ${note.caregiver_name || 'Unknown'}

**VISIT NOTE CONTENT:**

**Subjective (Patient Report):**
${note.subjective_notes || 'Not documented'}

**Objective (Observable Findings):**
${note.objective_notes || 'Not documented'}

**Assessment (Clinical Judgment):**
${note.assessment || 'Not documented'}

**Plan (Care Plan/Follow-up):**
${note.plan || 'Not documented'}

**Narrative Note:**
${note.narrative_note || 'Not documented'}

**Interventions Performed:**
${Array.isArray(note.interventions_performed) ? note.interventions_performed.join(', ') : 'Not documented'}

**Patient Response:**
${note.patient_response || 'Not documented'}

**Safety Incidents:**
${note.safety_incidents ? `Yes - ${note.incident_description}` : 'None reported'}

**QUALITY SCORING CRITERIA:**

1. **COMPLETENESS (0-100):**
   - All SOAP sections documented (Subjective, Objective, Assessment, Plan)
   - Interventions clearly listed
   - Patient response documented
   - Safety incidents addressed
   - Gaps identified

2. **CLARITY (0-100):**
   - Clear, concise language
   - Specific details (avoid vague terms like "tolerated well")
   - Proper medical terminology
   - Logical flow
   - Readability

3. **COMPLIANCE (0-100):**
   - Meets Medicare/Medicaid documentation requirements
   - SOAP format followed
   - Clinical judgment documented
   - Follow-up plan specified
   - Safety concerns addressed

4. **CLINICAL_VALUE (0-100):**
   - Actionable information for care team
   - Patient status changes documented
   - Progress toward goals noted
   - Clinical reasoning clear
   - Useful for continuity of care

**GRADING SCALE:**
- A (90-100): Excellent documentation
- B (80-89): Good documentation with minor improvements needed
- C (70-79): Adequate documentation with notable gaps
- D (60-69): Poor documentation with major gaps
- F (0-59): Unacceptable documentation

**COMPLIANCE STATUS:**
- COMPLIANT: Meets all regulatory requirements
- MINOR_GAPS: Minor issues that should be addressed
- MAJOR_GAPS: Significant issues requiring immediate attention
- NON_COMPLIANT: Does not meet minimum standards

**RESPONSE FORMAT (JSON):**
Return ONLY valid JSON with this exact structure:
{
  "overallScore": 85,
  "grade": "B",
  "dimensionScores": [
    {
      "dimension": "COMPLETENESS",
      "score": 90,
      "strengths": ["All SOAP sections documented", "Interventions clearly listed"],
      "gaps": ["Patient vital signs not recorded"],
      "recommendations": ["Document baseline vital signs for each visit"]
    },
    {
      "dimension": "CLARITY",
      "score": 85,
      "strengths": ["Clear language", "Specific interventions"],
      "gaps": ["Vague patient response description"],
      "recommendations": ["Use specific patient quotes or objective observations"]
    },
    {
      "dimension": "COMPLIANCE",
      "score": 80,
      "strengths": ["SOAP format followed", "Safety addressed"],
      "gaps": ["Follow-up plan incomplete"],
      "recommendations": ["Specify exact follow-up timeline and responsible party"]
    },
    {
      "dimension": "CLINICAL_VALUE",
      "score": 85,
      "strengths": ["Clear clinical reasoning", "Progress noted"],
      "gaps": ["Goal alignment not explicit"],
      "recommendations": ["Reference specific care plan goals in assessment"]
    }
  ],
  "criticalIssues": ["Missing follow-up plan", "Vague patient response"],
  "improvementPriorities": [
    "Add specific follow-up timeline",
    "Document patient vital signs",
    "Use objective patient response measures"
  ],
  "complianceStatus": "MINOR_GAPS",
  "summary": "This is a solid B-grade note with good SOAP structure and clear interventions. The main areas for improvement are adding vital signs documentation and making the follow-up plan more specific. The note meets basic compliance requirements but has minor gaps that should be addressed for optimal quality."
}

Provide your quality analysis now:`;
  }
}
