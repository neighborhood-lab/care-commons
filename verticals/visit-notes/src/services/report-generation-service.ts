/**
 * Automated Report Generation Service
 *
 * AI-powered generation of narrative reports from structured care data.
 * Supports client summaries, caregiver summaries, and agency-wide reports.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export type ReportType =
  | 'CLIENT_SUMMARY'
  | 'CAREGIVER_SUMMARY'
  | 'AGENCY_WEEKLY'
  | 'AGENCY_MONTHLY'
  | 'COMPLIANCE_SUMMARY'
  | 'QUALITY_METRICS';

export type ReportFormat = 'NARRATIVE' | 'BULLET_POINTS' | 'EXECUTIVE_SUMMARY';

export interface ReportGenerationRequest {
  reportType: ReportType;
  format?: ReportFormat; // Default NARRATIVE
  clientId?: string; // Required for CLIENT_SUMMARY
  caregiverId?: string; // Required for CAREGIVER_SUMMARY
  organizationId?: string; // Required for agency reports
  startDate?: string; // YYYY-MM-DD, defaults to start of period based on report type
  endDate?: string; // YYYY-MM-DD, defaults to today
  includeRecommendations?: boolean; // Default true
  customPrompt?: string; // Additional context or focus areas
}

export interface ReportSection {
  title: string;
  content: string;
  metrics?: Record<string, string | number>;
  highlights?: string[];
  concerns?: string[];
}

export interface GeneratedReport {
  reportType: ReportType;
  format: ReportFormat;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };
  subject?: {
    id: string;
    name: string;
    type: 'CLIENT' | 'CAREGIVER' | 'ORGANIZATION';
  };
  title: string;
  executiveSummary: string;
  sections: ReportSection[];
  keyMetrics: Record<string, string | number>;
  recommendations?: string[];
  dataQuality: {
    recordsAnalyzed: number;
    dataCompleteness: number; // 0-100%
    gaps: string[];
  };
}

export class ReportGenerationService {
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
   * Generate a comprehensive report using Claude AI
   */
  async generateReport(request: ReportGenerationRequest): Promise<GeneratedReport> {
    const format = request.format || 'NARRATIVE';
    const { startDate, endDate } = this.calculateDateRange(request);

    // Fetch relevant data based on report type
    const data = await this.fetchReportData(request, startDate, endDate);

    // Build prompt with data
    const prompt = this.buildReportPrompt(request, data, startDate, endDate);

    // Call Claude for report generation
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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

    try {
      const parsed = JSON.parse(content.text);
      return {
        reportType: request.reportType,
        format,
        generatedAt: new Date().toISOString(),
        period: {
          startDate,
          endDate,
          description: this.getPeriodDescription(request.reportType, startDate, endDate),
        },
        subject: data.subject as GeneratedReport['subject'],
        ...parsed,
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.text, parseError);
      throw new Error('Failed to parse generated report');
    }
  }

  private getDateString(date: Date): string {
    // Extract YYYY-MM-DD from ISO string
    const iso = date.toISOString();
    return iso.substring(0, 10);
  }

  private calculateDateRange(request: ReportGenerationRequest): { startDate: string; endDate: string } {
    const endDateStr: string = request.endDate ?? this.getDateString(new Date());
    const startDateStr: string = request.startDate ?? '';

    if (startDateStr) {
      return { startDate: startDateStr, endDate: endDateStr };
    }

    const end = new Date(endDateStr);
    switch (request.reportType) {
      case 'AGENCY_WEEKLY':
        end.setDate(end.getDate() - 7);
        break;
      case 'AGENCY_MONTHLY':
        end.setMonth(end.getMonth() - 1);
        break;
      case 'CLIENT_SUMMARY':
      case 'CAREGIVER_SUMMARY':
        end.setDate(end.getDate() - 30);
        break;
      default:
        end.setDate(end.getDate() - 30);
    }

    return { startDate: this.getDateString(end), endDate: endDateStr };
  }

  private getPeriodDescription(reportType: ReportType, startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (reportType === 'AGENCY_WEEKLY') {
      return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (reportType === 'AGENCY_MONTHLY') {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return `${days}-day period ending ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  private async fetchReportData(
    request: ReportGenerationRequest,
    startDate: string,
    endDate: string,
  ): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {};

    if (request.reportType === 'CLIENT_SUMMARY' && request.clientId) {
      // Fetch client info
      const client = await this.db('clients')
        .where({ id: request.clientId, is_deleted: false })
        .first();
      data.subject = client ? { id: client.id, name: `${client.first_name} ${client.last_name}`, type: 'CLIENT' } : null;

      // Fetch visits
      const visits = await this.db('visits')
        .where({ client_id: request.clientId })
        .whereBetween('scheduled_start', [startDate, endDate])
        .orderBy('scheduled_start', 'desc');
      data.visits = visits;
      data.visitCount = visits.length;
      data.completedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'completed').length;

      // Fetch visit notes
      const visitIds = visits.map((v: Record<string, unknown>) => String(v.id));
      const notes = await this.db('visit_notes')
        .whereIn('visit_id', visitIds)
        .orderBy('created_at', 'desc');
      data.notes = notes;

      // Fetch vitals
      const vitals = await this.db('vital_signs')
        .where({ client_id: request.clientId })
        .whereBetween('recorded_at', [startDate, endDate])
        .orderBy('recorded_at', 'desc');
      data.vitals = vitals;

      // Fetch care plan tasks
      const carePlans = await this.db('care_plans')
        .where({ client_id: request.clientId, is_deleted: false })
        .orderBy('created_at', 'desc')
        .limit(1);
      if (carePlans.length > 0) {
        const tasks = await this.db('care_plan_tasks')
          .where({ care_plan_id: carePlans[0].id, is_deleted: false });
        data.carePlanTasks = tasks;
      }
    } else if (request.reportType === 'CAREGIVER_SUMMARY' && request.caregiverId) {
      // Fetch caregiver info
      const caregiver = await this.db('users')
        .where({ id: request.caregiverId, is_deleted: false })
        .first();
      data.subject = caregiver
        ? { id: caregiver.id, name: `${caregiver.first_name} ${caregiver.last_name}`, type: 'CAREGIVER' }
        : null;

      // Fetch assigned visits
      const visits = await this.db('visits')
        .where({ assigned_caregiver_id: request.caregiverId })
        .whereBetween('scheduled_start', [startDate, endDate])
        .orderBy('scheduled_start', 'desc');
      data.visits = visits;
      data.visitCount = visits.length;
      data.completedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'completed').length;
      data.onTimeVisits = visits.filter(
        (v: Record<string, unknown>) => v.check_in_time && v.status === 'completed',
      ).length;

      // Fetch notes written by this caregiver
      const notes = await this.db('visit_notes')
        .where({ created_by: request.caregiverId })
        .whereBetween('created_at', [startDate, endDate])
        .orderBy('created_at', 'desc');
      data.notes = notes;

      // Fetch unique clients served
      const clientIds = [...new Set(visits.map((v: Record<string, unknown>) => v.client_id))];
      data.uniqueClientsServed = clientIds.length;
    } else if (request.reportType === 'AGENCY_WEEKLY' || request.reportType === 'AGENCY_MONTHLY') {
      // Agency-wide metrics
      const visits = await this.db('visits')
        .whereBetween('scheduled_start', [startDate, endDate]);
      data.totalVisits = visits.length;
      data.completedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'completed').length;
      data.missedVisits = visits.filter((v: Record<string, unknown>) => v.status === 'missed').length;
      data.cancelledVisits = visits.filter((v: Record<string, unknown>) => v.status === 'cancelled').length;

      // Unique clients and caregivers
      const clientIds = [...new Set(visits.map((v: Record<string, unknown>) => v.client_id))];
      const caregiverIds = [...new Set(visits.map((v: Record<string, unknown>) => v.assigned_caregiver_id))];
      data.uniqueClients = clientIds.length;
      data.activeCaregivers = caregiverIds.length;

      // Calculate completion rate
      data.completionRate =
        visits.length > 0 ? Math.round((data.completedVisits as number) / visits.length * 100) : 0;

      // Visit notes summary
      const agencyVisitIds = visits.map((v: Record<string, unknown>) => String(v.id));
      const noteCount = await this.db('visit_notes')
        .whereIn('visit_id', agencyVisitIds)
        .count('id as count')
        .first();
      data.notesDocumented = noteCount?.count || 0;
    }

    return data;
  }

  private formatNotesSummary(notes: Record<string, unknown>[]): string {
    if (!notes || notes.length === 0) return '';
    const lines = notes.slice(0, 5).map((n) => {
      const date = n.created_at || 'Unknown date';
      const content = String(n.content || '').slice(0, 200);
      return `- ${date}: ${content}...`;
    });
    return '\nRECENT NOTES SUMMARY:\n' + lines.join('\n') + '\n';
  }

  private formatVitalsSummary(vitals: Record<string, unknown>[]): string {
    if (!vitals || vitals.length === 0) return '';
    const lines = vitals.slice(0, 5).map((v) => {
      const date = v.recorded_at || 'Unknown date';
      const systolic = v.blood_pressure_systolic || 'N/A';
      const diastolic = v.blood_pressure_diastolic || 'N/A';
      const hr = v.heart_rate || 'N/A';
      const o2 = v.oxygen_saturation || 'N/A';
      return `- ${date}: BP ${systolic}/${diastolic}, HR ${hr}, O2 ${o2}%`;
    });
    return '\nRECENT VITALS:\n' + lines.join('\n') + '\n';
  }

  private buildReportPrompt(
    request: ReportGenerationRequest,
    data: Record<string, unknown>,
    startDate: string,
    endDate: string,
  ): string {
    const formatInstructions = this.getFormatInstructions(request.format || 'NARRATIVE');

    let contextSection = '';
    if (request.reportType === 'CLIENT_SUMMARY') {
      const notesSection = Array.isArray(data.notes) ? this.formatNotesSummary(data.notes) : '';
      const vitalsSection = Array.isArray(data.vitals) ? this.formatVitalsSummary(data.vitals) : '';
      contextSection = `
CLIENT REPORT DATA:
- Subject: ${(data.subject as Record<string, unknown>)?.name || 'Unknown Client'}
- Period: ${startDate} to ${endDate}
- Total Visits: ${data.visitCount || 0}
- Completed Visits: ${data.completedVisits || 0}
- Visit Notes Available: ${Array.isArray(data.notes) ? data.notes.length : 0}
- Vital Signs Recorded: ${Array.isArray(data.vitals) ? data.vitals.length : 0}
- Active Care Plan Tasks: ${Array.isArray(data.carePlanTasks) ? data.carePlanTasks.length : 0}
${notesSection}${vitalsSection}`;
    } else if (request.reportType === 'CAREGIVER_SUMMARY') {
      contextSection = `
CAREGIVER REPORT DATA:
- Subject: ${(data.subject as Record<string, unknown>)?.name || 'Unknown Caregiver'}
- Period: ${startDate} to ${endDate}
- Total Visits Assigned: ${data.visitCount || 0}
- Visits Completed: ${data.completedVisits || 0}
- On-Time Arrivals: ${data.onTimeVisits || 0}
- Unique Clients Served: ${data.uniqueClientsServed || 0}
- Notes Documented: ${Array.isArray(data.notes) ? data.notes.length : 0}`;
    } else {
      contextSection = `
AGENCY REPORT DATA:
- Period: ${startDate} to ${endDate}
- Total Visits: ${data.totalVisits || 0}
- Completed: ${data.completedVisits || 0}
- Missed: ${data.missedVisits || 0}
- Cancelled: ${data.cancelledVisits || 0}
- Completion Rate: ${data.completionRate || 0}%
- Active Clients: ${data.uniqueClients || 0}
- Active Caregivers: ${data.activeCaregivers || 0}
- Notes Documented: ${data.notesDocumented || 0}`;
    }

    const customContext = request.customPrompt ? `\nADDITIONAL FOCUS: ${request.customPrompt}` : '';

    return `You are a healthcare documentation specialist generating professional reports for home care agencies.

Generate a ${request.reportType.replace(/_/g, ' ').toLowerCase()} report based on the following data:

${contextSection}
${customContext}

${formatInstructions}

${request.includeRecommendations !== false ? 'Include actionable recommendations based on the data.' : 'Do not include recommendations.'}

Return ONLY valid JSON in this exact structure:
{
  "title": "string - Professional report title",
  "executiveSummary": "string - 2-3 sentence overview",
  "sections": [
    {
      "title": "string - Section title",
      "content": "string - Section narrative",
      "metrics": {"key": "value"},
      "highlights": ["positive findings"],
      "concerns": ["areas needing attention"]
    }
  ],
  "keyMetrics": {"metric_name": "value or number"},
  "recommendations": ["actionable recommendations"],
  "dataQuality": {
    "recordsAnalyzed": number,
    "dataCompleteness": number,
    "gaps": ["data gaps identified"]
  }
}`;
  }

  private getFormatInstructions(format: ReportFormat): string {
    switch (format) {
      case 'BULLET_POINTS':
        return 'Format the content using concise bullet points. Keep each point brief and actionable.';
      case 'EXECUTIVE_SUMMARY':
        return 'Format as a brief executive summary. Focus on high-level insights and critical metrics only.';
      case 'NARRATIVE':
      default:
        return 'Format as professional narrative prose suitable for medical documentation. Use complete sentences and formal healthcare terminology.';
    }
  }
}
