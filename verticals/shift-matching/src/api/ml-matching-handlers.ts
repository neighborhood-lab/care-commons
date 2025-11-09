/**
 * API Handlers for ML-Based Shift Matching
 *
 * HTTP request handlers for:
 * - Model training and deployment
 * - Schedule optimization
 * - A/B testing
 * - Performance monitoring
 * - ML configuration
 */

import { UserContext, PaginationParams, PaginatedResult } from '@care-commons/core';
import { Knex } from 'knex';
import { MLEnhancedMatchingService } from '../service/ml-enhanced-matching-service';
import { MLModelService } from '../service/ml-model-service';
import { ScheduleOptimizationService } from '../service/schedule-optimization-service';
import { MLABTestingService } from '../service/ml-ab-testing-service';
import { MLPerformanceMonitoringService } from '../service/ml-performance-monitoring-service';
import {
  MLModelMetadata,
  MLTrainingConfig,
  ScheduleOptimization,
  ScheduleOptimizationConstraints,
  ABTestConfig,
  MLPerformanceReport,
} from '../types/ml-matching';

export class MLMatchingHandlers {
  private enhancedMatchingService: MLEnhancedMatchingService;
  private modelService: MLModelService;
  private optimizationService: ScheduleOptimizationService;
  private abTestingService: MLABTestingService;
  private monitoringService: MLPerformanceMonitoringService;

  constructor(private db: Knex) {
    this.enhancedMatchingService = new MLEnhancedMatchingService(db);
    this.modelService = new MLModelService(db);
    this.optimizationService = new ScheduleOptimizationService(db);
    this.abTestingService = new MLABTestingService(db);
    this.monitoringService = new MLPerformanceMonitoringService(db);
  }

  /**
   * ==========================================================================
   * MODEL TRAINING & DEPLOYMENT
   * ==========================================================================
   */

  /**
   * POST /ml/models/train
   * Train a new ML model
   *
   * Request body:
   * {
   *   "organization_id": "uuid",  // optional, null = global model
   *   "target_variable": "match_success",
   *   "model_type": "GRADIENT_BOOSTING",
   *   "hyperparameters": { ... },
   *   "training_options": { ... }
   * }
   */
  async trainModel(config: MLTrainingConfig, context: UserContext): Promise<MLModelMetadata> {
    // Verify user has permission to train models
    this.verifyAdminAccess(context);

    return this.modelService.trainModel(config);
  }

  /**
   * POST /ml/models/:id/deploy
   * Deploy a trained model to production
   */
  async deployModel(modelId: string, context: UserContext): Promise<void> {
    this.verifyAdminAccess(context);
    await this.modelService.deployModel(modelId);
  }

  /**
   * GET /ml/models
   * List all ML models
   */
  async listModels(
    filters: {
      organization_id?: string;
      status?: string;
      is_active?: boolean;
    },
    _context: UserContext
  ): Promise<MLModelMetadata[]> {
    let query = this.db('ml_models').orderBy('created_at', 'desc');

    if (filters.organization_id) {
      query = query.where('organization_id', filters.organization_id);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.is_active !== undefined) {
      query = query.where('is_active', filters.is_active);
    }

    const rows = await query;

    return rows.map((row: any) => this.parseModelFromDB(row));
  }

  /**
   * GET /ml/models/:id
   * Get model details
   */
  async getModel(modelId: string, _context: UserContext): Promise<MLModelMetadata> {
    const model = await this.db('ml_models')
      .where({ id: modelId })
      .first();

    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    return this.parseModelFromDB(model);
  }

  /**
   * POST /ml/models/auto-train
   * Trigger automatic model retraining
   */
  async autoTrain(
    organizationId: string | undefined,
    context: UserContext
  ): Promise<{ model_id: string; deployed: boolean }> {
    this.verifyAdminAccess(context);

    const modelId = await this.enhancedMatchingService.trainNewModel(organizationId);
    const deployed = await this.enhancedMatchingService.autoDeployIfBetter(modelId);

    return { model_id: modelId, deployed };
  }

  /**
   * ==========================================================================
   * SCHEDULE OPTIMIZATION
   * ==========================================================================
   */

  /**
   * POST /ml/optimize/schedule
   * Optimize schedule for a given date
   *
   * Request body:
   * {
   *   "organization_id": "uuid",
   *   "schedule_date": "2024-01-15",
   *   "primary_goal": "MINIMIZE_TRAVEL_TIME",
   *   "constraints": { ... },
   *   "branch_id": "uuid",         // optional
   *   "shift_ids": ["uuid", ...],  // optional
   *   "caregiver_ids": ["uuid", ...], // optional
   *   "algorithm": "GREEDY"        // optional
   * }
   */
  async optimizeSchedule(
    input: {
      organization_id: string;
      schedule_date: string;
      primary_goal: ScheduleOptimization['primary_goal'];
      constraints: ScheduleOptimizationConstraints;
      branch_id?: string;
      shift_ids?: string[];
      caregiver_ids?: string[];
      algorithm?: 'GREEDY' | 'CONSTRAINT_PROGRAMMING' | 'GENETIC_ALGORITHM';
    },
    context: UserContext
  ): Promise<ScheduleOptimization> {
    this.verifySchedulerAccess(context);

    return this.optimizationService.optimizeSchedule(
      input.organization_id,
      new Date(input.schedule_date),
      input.primary_goal,
      input.constraints,
      {
        branch_id: input.branch_id,
        shift_ids: input.shift_ids,
        caregiver_ids: input.caregiver_ids,
        algorithm: input.algorithm,
      }
    );
  }

  /**
   * POST /ml/optimize/:id/apply
   * Apply an optimized schedule (create proposals)
   */
  async applyOptimization(
    optimizationId: string,
    context: UserContext
  ): Promise<void> {
    this.verifySchedulerAccess(context);
    await this.optimizationService.applyOptimization(optimizationId, context.userId);
  }

  /**
   * GET /ml/optimize/:id
   * Get optimization details
   */
  async getOptimization(
    optimizationId: string,
    _context: UserContext
  ): Promise<ScheduleOptimization> {
    const optimization = await this.db('schedule_optimizations')
      .where({ id: optimizationId })
      .first();

    if (!optimization) {
      throw new Error(`Optimization ${optimizationId} not found`);
    }

    return this.parseOptimizationFromDB(optimization);
  }

  /**
   * GET /ml/optimize
   * List schedule optimizations
   */
  async listOptimizations(
    filters: {
      organization_id?: string;
      status?: string;
      schedule_date?: string;
    },
    pagination: PaginationParams,
    _context: UserContext
  ): Promise<PaginatedResult<ScheduleOptimization>> {
    let query = this.db('schedule_optimizations')
      .orderBy('created_at', 'desc');

    if (filters.organization_id) {
      query = query.where('organization_id', filters.organization_id);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.schedule_date) {
      query = query.where('schedule_date', filters.schedule_date);
    }

    const total = await query.clone().count('* as count').first();
    const offset = (pagination.page - 1) * pagination.limit;
    const rows = await query
      .limit(pagination.limit)
      .offset(offset);

    const totalCount = Number(total?.count || 0);
    const totalPages = Math.ceil(totalCount / pagination.limit);

    return {
      items: rows.map((row: any) => this.parseOptimizationFromDB(row)),
      total: totalCount,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
    };
  }

  /**
   * ==========================================================================
   * A/B TESTING
   * ==========================================================================
   */

  /**
   * GET /ml/ab-tests/:testName/results
   * Get A/B test results
   */
  async getABTestResults(
    testName: string,
    testVersion: number,
    organizationId: string | undefined,
    context: UserContext
  ): Promise<any> {
    this.verifyAdminAccess(context);

    return this.abTestingService.getTestResults(testName, testVersion, organizationId);
  }

  /**
   * POST /ml/ab-tests/configure
   * Configure A/B testing for an organization
   *
   * Request body:
   * {
   *   "organization_id": "uuid",
   *   "test_config": { ... }
   * }
   */
  async configureABTest(
    organizationId: string,
    testConfig: ABTestConfig,
    context: UserContext
  ): Promise<void> {
    this.verifyAdminAccess(context);

    const firstVariant = testConfig.variants[0];
    if (!firstVariant) {
      throw new Error('At least one variant must be provided');
    }

    // Update matching configuration with A/B test settings
    await this.db('matching_configurations')
      .where('organization_id', organizationId)
      .update({
        ab_testing_enabled: testConfig.enabled,
        ab_test_variant: firstVariant.name,
        updated_at: new Date(),
      });
  }

  /**
   * ==========================================================================
   * PERFORMANCE MONITORING
   * ==========================================================================
   */

  /**
   * GET /ml/models/:id/performance
   * Get performance report for a model
   *
   * Query params:
   * - period_start: ISO date
   * - period_end: ISO date
   */
  async getModelPerformance(
    modelId: string,
    periodStart: string,
    periodEnd: string,
    context: UserContext
  ): Promise<MLPerformanceReport> {
    this.verifyAdminAccess(context);

    return this.monitoringService.generatePerformanceReport(
      modelId,
      new Date(periodStart),
      new Date(periodEnd)
    );
  }

  /**
   * GET /ml/models/:id/monitoring
   * Get real-time monitoring metrics
   */
  async getRealtimeMonitoring(modelId: string, context: UserContext): Promise<any> {
    this.verifyAdminAccess(context);

    return this.monitoringService.monitorRealTimePerformance(modelId);
  }

  /**
   * POST /ml/monitoring/caregiver/:id/update
   * Update caregiver performance metrics
   */
  async updateCaregiverMetrics(
    caregiverId: string,
    periodType: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    context: UserContext
  ): Promise<void> {
    this.verifyAdminAccess(context);

    await this.monitoringService.updateCaregiverPerformanceMetrics(caregiverId, periodType);
  }

  /**
   * ==========================================================================
   * ML CONFIGURATION
   * ==========================================================================
   */

  /**
   * PUT /ml/config/:organizationId
   * Update ML configuration for organization
   *
   * Request body:
   * {
   *   "ml_enabled": true,
   *   "ml_weight": 0.5,
   *   "ml_model_preference": "ORG_SPECIFIC",
   *   "min_ml_confidence": 0.5
   * }
   */
  async updateMLConfig(
    organizationId: string,
    config: {
      ml_enabled?: boolean;
      ml_weight?: number;
      ml_model_preference?: string;
      min_ml_confidence?: number;
    },
    context: UserContext
  ): Promise<void> {
    this.verifyAdminAccess(context);

    const existingConfig = await this.db('matching_configurations')
      .where('organization_id', organizationId)
      .whereNull('branch_id')
      .first();

    if (existingConfig) {
      await this.db('matching_configurations')
        .where('organization_id', organizationId)
        .whereNull('branch_id')
        .update({
          ml_enabled: config.ml_enabled ?? existingConfig.ml_enabled,
          ml_weight: config.ml_weight ?? existingConfig.ml_weight,
          ml_model_preference: config.ml_model_preference ?? existingConfig.ml_model_preference,
          min_ml_confidence: config.min_ml_confidence ?? existingConfig.min_ml_confidence,
          updated_at: new Date(),
        });
    } else {
      // Create new config
      await this.db('matching_configurations').insert({
        organization_id: organizationId,
        ml_enabled: config.ml_enabled ?? false,
        ml_weight: config.ml_weight ?? 0.5,
        ml_model_preference: config.ml_model_preference ?? 'GLOBAL',
        min_ml_confidence: config.min_ml_confidence ?? 0.5,
      });
    }
  }

  /**
   * GET /ml/config/:organizationId
   * Get ML configuration
   */
  async getMLConfig(organizationId: string, _context: UserContext): Promise<any> {
    const config = await this.db('matching_configurations')
      .where('organization_id', organizationId)
      .whereNull('branch_id')
      .first(
        'ml_enabled',
        'ml_weight',
        'ml_model_preference',
        'min_ml_confidence',
        'ab_testing_enabled',
        'ab_test_variant'
      );

    return config || {
      ml_enabled: false,
      ml_weight: 0.5,
      ml_model_preference: 'GLOBAL',
      min_ml_confidence: 0.5,
      ab_testing_enabled: false,
      ab_test_variant: null,
    };
  }

  /**
   * ==========================================================================
   * TRAINING DATA MANAGEMENT
   * ==========================================================================
   */

  /**
   * GET /ml/training-data/stats
   * Get training data statistics
   */
  async getTrainingDataStats(
    organizationId: string | undefined,
    _context: UserContext
  ): Promise<{
    total_samples: number;
    samples_with_outcomes: number;
    date_range: { min: string; max: string };
    label_distribution: Record<string, number>;
  }> {
    let query = this.db('ml_training_data')
      .whereNull('deleted_at');

    if (organizationId) {
      query = query.where('organization_id', organizationId);
    }

    const total = await query.clone().count('* as count').first();
    const withOutcomes = await query
      .clone()
      .whereNotNull('was_completed')
      .count('* as count')
      .first();

    const dateRange = await query
      .clone()
      .select(
        this.db.raw('MIN(matched_at) as min_date'),
        this.db.raw('MAX(matched_at) as max_date')
      )
      .first();

    const labelDist = await query
      .clone()
      .whereNotNull('was_completed')
      .select(
        this.db.raw('SUM(CASE WHEN was_accepted AND was_completed AND NOT was_no_show THEN 1 ELSE 0 END) as positive'),
        this.db.raw('SUM(CASE WHEN NOT (was_accepted AND was_completed AND NOT was_no_show) THEN 1 ELSE 0 END) as negative')
      )
      .first();

    return {
      total_samples: Number(total?.count || 0),
      samples_with_outcomes: Number(withOutcomes?.count || 0),
      date_range: {
        min: dateRange?.min_date || '',
        max: dateRange?.max_date || '',
      },
      label_distribution: {
        positive: Number(labelDist?.positive || 0),
        negative: Number(labelDist?.negative || 0),
      },
    };
  }

  // ========== Helper Methods ==========

  private verifyAdminAccess(context: UserContext): void {
    // In production, check if user has admin role
    if (!context.userId) {
      throw new Error('Unauthorized');
    }
  }

  // eslint-disable-next-line sonarjs/no-identical-functions
  private verifySchedulerAccess(context: UserContext): void {
    // In production, check if user has scheduler role
    if (!context.userId) {
      throw new Error('Unauthorized');
    }
  }

  private parseModelFromDB(row: any): MLModelMetadata {
    return {
      id: row.id,
      organization_id: row.organization_id,
      model_type: row.model_type,
      model_version: row.model_version,
      target_variable: row.target_variable,
      model_artifact: row.model_artifact,
      feature_importance: typeof row.feature_importance === 'string'
        ? JSON.parse(row.feature_importance)
        : row.feature_importance,
      hyperparameters: typeof row.hyperparameters === 'string'
        ? JSON.parse(row.hyperparameters)
        : row.hyperparameters,
      training_samples: row.training_samples,
      training_started_at: row.training_started_at,
      training_completed_at: row.training_completed_at,
      training_metrics: typeof row.training_metrics === 'string'
        ? JSON.parse(row.training_metrics)
        : row.training_metrics,
      validation_metrics: typeof row.validation_metrics === 'string'
        ? JSON.parse(row.validation_metrics)
        : row.validation_metrics,
      status: row.status,
      deployed_at: row.deployed_at,
      archived_at: row.archived_at,
      is_active: row.is_active,
      replaces_model_id: row.replaces_model_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private parseJsonField(value: any): any {
    if (!value) return null;
    return typeof value === 'string' ? JSON.parse(value) : value;
  }

  private parseOptimizationFromDB(row: any): ScheduleOptimization {
    const shiftIds = typeof row.shift_ids === 'string' ? JSON.parse(row.shift_ids) : row.shift_ids;
    const caregiverIds = this.parseJsonField(row.caregiver_ids);
    const constraints = typeof row.constraints === 'string' ? JSON.parse(row.constraints) : row.constraints;
    const assignments = this.parseJsonField(row.assignments);
    const metrics = this.parseJsonField(row.metrics);

    return {
      id: row.id,
      organization_id: row.organization_id,
      branch_id: row.branch_id,
      schedule_date: row.schedule_date,
      shift_ids: shiftIds,
      caregiver_ids: caregiverIds,
      primary_goal: row.primary_goal,
      constraints,
      status: row.status,
      assignments,
      metrics,
      optimization_score: row.optimization_score,
      computation_time_ms: row.computation_time_ms,
      iterations: row.iterations,
      algorithm_used: row.algorithm_used,
      applied: row.applied,
      applied_at: row.applied_at,
      applied_by_user_id: row.applied_by_user_id,
      created_at: row.created_at,
      completed_at: row.completed_at,
    };
  }
}
