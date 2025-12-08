/**
 * Natural Language Query Service
 *
 * Allows users to ask questions about data in natural language,
 * using AI to interpret queries and retrieve relevant information.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Knex } from 'knex';

export interface NaturalLanguageQueryRequest {
  question: string;
  organizationId?: string;
  userId?: string;
  context?: {
    clientId?: string;
    caregiverId?: string;
    dateRange?: {
      startDate: string;
      endDate: string;
    };
  };
}

export type QueryCategory =
  | 'VISITS'
  | 'CLIENTS'
  | 'CAREGIVERS'
  | 'BILLING'
  | 'COMPLIANCE'
  | 'PERFORMANCE'
  | 'GENERAL';

export interface QueryInterpretation {
  category: QueryCategory;
  intent: string;
  entities: {
    timeframe?: string;
    metric?: string;
    subject?: string;
    filter?: string;
  };
  confidence: number;
}

export interface QueryResult {
  success: boolean;
  question: string;
  interpretation: QueryInterpretation;
  answer: string;
  data?: {
    type: 'number' | 'list' | 'table' | 'comparison' | 'trend';
    value: unknown;
    unit?: string;
  };
  relatedQuestions?: string[];
  dataSource: string;
  queryTimestamp: string;
}


export class NaturalLanguageQueryService {
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
   * Process a natural language query and return results
   */
  async query(request: NaturalLanguageQueryRequest): Promise<QueryResult> {
    const { question, organizationId, context } = request;

    // Step 1: Interpret the question using AI
    const interpretation = await this.interpretQuestion(question, context);

    // Step 2: Execute the appropriate query based on interpretation
    const queryResult = await this.executeQuery(interpretation, organizationId, context);

    // Step 3: Generate a natural language answer
    const answer = await this.generateAnswer(question, interpretation, queryResult);

    // Step 4: Suggest related questions
    const relatedQuestions = await this.suggestRelatedQuestions(question, interpretation);

    return {
      success: true,
      question,
      interpretation,
      answer,
      data: queryResult,
      relatedQuestions,
      dataSource: this.getDataSource(interpretation.category),
      queryTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Interpret the natural language question using AI
   */
  private async interpretQuestion(
    question: string,
    context?: NaturalLanguageQueryRequest['context'],
  ): Promise<QueryInterpretation> {
    const contextInfo = context
      ? `Context: ${JSON.stringify(context)}`
      : 'No specific context provided.';

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: `You are a data analyst for a home care agency. Interpret this natural language question and determine what data is being requested.

QUESTION: "${question}"

${contextInfo}

AVAILABLE DATA CATEGORIES:
- VISITS: Visit schedules, completion status, durations, EVV compliance
- CLIENTS: Client demographics, status, care plans, risk levels
- CAREGIVERS: Staff information, credentials, performance, availability
- BILLING: Invoices, payments, outstanding balances, revenue
- COMPLIANCE: Regulatory compliance, documentation status, audits
- PERFORMANCE: KPIs, productivity metrics, efficiency
- GENERAL: General questions that span multiple categories

Return ONLY valid JSON:
{
  "category": "VISITS|CLIENTS|CAREGIVERS|BILLING|COMPLIANCE|PERFORMANCE|GENERAL",
  "intent": "Brief description of what data is being requested",
  "entities": {
    "timeframe": "today|this week|this month|last 30 days|custom|null",
    "metric": "count|sum|average|percentage|list|null",
    "subject": "specific entity being asked about or null",
    "filter": "any specific filters mentioned or null"
  },
  "confidence": 0.0-1.0
}`,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Failed to interpret question');
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return {
        category: 'GENERAL',
        intent: 'Unable to clearly interpret the question',
        entities: {},
        confidence: 0.3,
      };
    }
  }

  /**
   * Execute database query based on interpretation
   */
  private async executeQuery(
    interpretation: QueryInterpretation,
    organizationId?: string,
    context?: NaturalLanguageQueryRequest['context'],
  ): Promise<QueryResult['data']> {
    const dateRange = this.getDateRange(interpretation.entities.timeframe, context?.dateRange);

    switch (interpretation.category) {
      case 'VISITS':
        return this.queryVisits(interpretation, organizationId, dateRange);
      case 'CLIENTS':
        return this.queryClients(interpretation, organizationId);
      case 'CAREGIVERS':
        return this.queryCaregivers(interpretation, organizationId);
      case 'BILLING':
        return this.queryBilling(interpretation, organizationId, dateRange);
      case 'COMPLIANCE':
        return this.queryCompliance(interpretation, organizationId);
      case 'PERFORMANCE':
        return this.queryPerformance(interpretation, organizationId, dateRange);
      default:
        return this.queryGeneral(interpretation, organizationId, dateRange);
    }
  }

  private getDateRange(
    timeframe?: string,
    customRange?: { startDate: string; endDate: string },
  ): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    if (customRange) {
      return {
        startDate: new Date(customRange.startDate),
        endDate: new Date(customRange.endDate),
      };
    }

    switch (timeframe) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'this week':
        startDate.setDate(startDate.getDate() - startDate.getDay());
        break;
      case 'this month':
        startDate.setDate(1);
        break;
      case 'last 30 days':
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private async queryVisits(
    interpretation: QueryInterpretation,
    organizationId?: string,
    dateRange?: { startDate: Date; endDate: Date },
  ): Promise<QueryResult['data']> {
    let query = this.db('visits').where('is_deleted', false);

    if (organizationId) {
      query = query.where('organization_id', organizationId);
    }

    if (dateRange) {
      query = query.whereBetween('scheduled_start', [dateRange.startDate, dateRange.endDate]);
    }

    const metric = interpretation.entities.metric || 'count';

    if (metric === 'count') {
      const result = await query.count('id as count').first();
      return {
        type: 'number',
        value: Number(result?.count || 0),
        unit: 'visits',
      };
    }

    if (metric === 'list') {
      const visits = await query.select('*').limit(20);
      return {
        type: 'list',
        value: visits,
      };
    }

    // Default: return summary
    const [total, completed, missed, inProgress] = await Promise.all([
      query.clone().count('id as count').first(),
      query.clone().where('status', 'completed').count('id as count').first(),
      query.clone().where('status', 'missed').count('id as count').first(),
      query.clone().where('status', 'in_progress').count('id as count').first(),
    ]);

    return {
      type: 'table',
      value: {
        total: Number(total?.count || 0),
        completed: Number(completed?.count || 0),
        missed: Number(missed?.count || 0),
        inProgress: Number(inProgress?.count || 0),
        completionRate:
          Number(total?.count) > 0
            ? Math.round((Number(completed?.count || 0) / Number(total?.count)) * 100)
            : 0,
      },
    };
  }

  private async queryClients(
    interpretation: QueryInterpretation,
    organizationId?: string,
  ): Promise<QueryResult['data']> {
    let query = this.db('clients').where('is_deleted', false);

    if (organizationId) {
      query = query.where('organization_id', organizationId);
    }

    const metric = interpretation.entities.metric || 'count';

    if (metric === 'count') {
      const result = await query.count('id as count').first();
      return {
        type: 'number',
        value: Number(result?.count || 0),
        unit: 'clients',
      };
    }

    if (metric === 'list') {
      const clients = await query.select('id', 'first_name', 'last_name', 'status').limit(20);
      return {
        type: 'list',
        value: clients,
      };
    }

    // Default: return summary by status
    const statusCounts = await query
      .select('status')
      .count('id as count')
      .groupBy('status');

    const summary: Record<string, number> = {};
    for (const row of statusCounts) {
      summary[String(row.status || 'unknown')] = Number(row.count);
    }

    return {
      type: 'table',
      value: summary,
    };
  }

  private async queryCaregivers(
    interpretation: QueryInterpretation,
    organizationId?: string,
  ): Promise<QueryResult['data']> {
    let query = this.db('users').where('is_deleted', false).where('role', 'caregiver');

    if (organizationId) {
      query = query.where('organization_id', organizationId);
    }

    const metric = interpretation.entities.metric || 'count';

    if (metric === 'count') {
      const result = await query.count('id as count').first();
      return {
        type: 'number',
        value: Number(result?.count || 0),
        unit: 'caregivers',
      };
    }

    if (metric === 'list') {
      const caregivers = await query.select('id', 'first_name', 'last_name', 'email').limit(20);
      return {
        type: 'list',
        value: caregivers,
      };
    }

    const result = await query.count('id as count').first();
    return {
      type: 'number',
      value: Number(result?.count || 0),
      unit: 'caregivers',
    };
  }

  private async queryBilling(
    _interpretation: QueryInterpretation,
    organizationId?: string,
    dateRange?: { startDate: Date; endDate: Date },
  ): Promise<QueryResult['data']> {
    let query = this.db('invoices').where('is_deleted', false);

    if (organizationId) {
      query = query.where('organization_id', organizationId);
    }

    if (dateRange) {
      query = query.whereBetween('created_at', [dateRange.startDate, dateRange.endDate]);
    }

    const [total, paid, outstanding] = await Promise.all([
      query.clone().sum('total_amount as sum').first(),
      query.clone().where('status', 'paid').sum('total_amount as sum').first(),
      query.clone().whereIn('status', ['sent', 'overdue']).sum('total_amount as sum').first(),
    ]);

    return {
      type: 'table',
      value: {
        totalBilled: Number(total?.sum || 0),
        paid: Number(paid?.sum || 0),
        outstanding: Number(outstanding?.sum || 0),
      },
      unit: 'USD',
    };
  }

  private async queryCompliance(
    _interpretation: QueryInterpretation,
    organizationId?: string,
  ): Promise<QueryResult['data']> {
    // Query EVV compliance
    let visitQuery = this.db('visits').where('is_deleted', false);

    if (organizationId) {
      visitQuery = visitQuery.where('organization_id', organizationId);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    visitQuery = visitQuery.where('scheduled_start', '>=', thirtyDaysAgo);

    const [total, withEvv] = await Promise.all([
      visitQuery.clone().where('status', 'completed').count('id as count').first(),
      visitQuery
        .clone()
        .where('status', 'completed')
        .whereNotNull('check_in_time')
        .whereNotNull('check_out_time')
        .count('id as count')
        .first(),
    ]);

    const totalCount = Number(total?.count || 0);
    const evvCount = Number(withEvv?.count || 0);

    return {
      type: 'table',
      value: {
        totalCompletedVisits: totalCount,
        evvCompliantVisits: evvCount,
        complianceRate: totalCount > 0 ? Math.round((evvCount / totalCount) * 100) : 0,
      },
      unit: 'percent',
    };
  }

  private async queryPerformance(
    _interpretation: QueryInterpretation,
    organizationId?: string,
    dateRange?: { startDate: Date; endDate: Date },
  ): Promise<QueryResult['data']> {
    let query = this.db('visits')
      .where('is_deleted', false)
      .where('status', 'completed');

    if (organizationId) {
      query = query.where('organization_id', organizationId);
    }

    if (dateRange) {
      query = query.whereBetween('scheduled_start', [dateRange.startDate, dateRange.endDate]);
    }

    // Get basic performance metrics
    const [completed, avgDuration] = await Promise.all([
      query.clone().count('id as count').first(),
      query.clone().avg('actual_duration_minutes as avg').first(),
    ]);

    return {
      type: 'table',
      value: {
        completedVisits: Number(completed?.count || 0),
        averageDurationMinutes: Math.round(Number(avgDuration?.avg || 0)),
      },
    };
  }

  private async queryGeneral(
    interpretation: QueryInterpretation,
    organizationId?: string,
    dateRange?: { startDate: Date; endDate: Date },
  ): Promise<QueryResult['data']> {
    // For general queries, return an overview of key metrics
    const [clients, caregivers, visits] = await Promise.all([
      this.queryClients(
        { ...interpretation, entities: { ...interpretation.entities, metric: 'count' } },
        organizationId,
      ),
      this.queryCaregivers(
        { ...interpretation, entities: { ...interpretation.entities, metric: 'count' } },
        organizationId,
      ),
      this.queryVisits(
        { ...interpretation, entities: { ...interpretation.entities, metric: 'count' } },
        organizationId,
        dateRange,
      ),
    ]);

    return {
      type: 'table',
      value: {
        activeClients: clients?.value,
        activeCaregivers: caregivers?.value,
        recentVisits: visits?.value,
      },
    };
  }

  /**
   * Generate a natural language answer from the query results
   */
  private async generateAnswer(
    question: string,
    interpretation: QueryInterpretation,
    data: QueryResult['data'],
  ): Promise<string> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 512,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `Generate a concise, friendly answer to this question based on the data.

QUESTION: "${question}"

INTERPRETATION: ${interpretation.intent}

DATA: ${JSON.stringify(data, null, 2)}

Guidelines:
- Be direct and specific
- Include the key numbers
- Use natural conversational language
- Keep it to 1-2 sentences
- Don't mention technical details about how data was retrieved

Return only the answer text, no quotes or formatting.`,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== 'text') {
      return 'I found the data you requested.';
    }

    return content.text;
  }

  /**
   * Suggest related questions the user might want to ask
   */
  private async suggestRelatedQuestions(
    question: string,
    interpretation: QueryInterpretation,
  ): Promise<string[]> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      temperature: 0.5,
      messages: [
        {
          role: 'user',
          content: `Based on this question about home care data, suggest 3 related follow-up questions.

ORIGINAL QUESTION: "${question}"
CATEGORY: ${interpretation.category}

Return only a JSON array of 3 question strings:
["question 1", "question 2", "question 3"]`,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== 'text') {
      return [];
    }

    try {
      return JSON.parse(content.text);
    } catch {
      return [];
    }
  }

  private getDataSource(category: QueryCategory): string {
    const sources: Record<QueryCategory, string> = {
      VISITS: 'visits table',
      CLIENTS: 'clients table',
      CAREGIVERS: 'users table (caregivers)',
      BILLING: 'invoices table',
      COMPLIANCE: 'visits table (EVV data)',
      PERFORMANCE: 'visits table (performance metrics)',
      GENERAL: 'multiple tables',
    };
    return sources[category];
  }
}
