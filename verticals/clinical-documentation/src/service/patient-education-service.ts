/**
 * Patient Education Service
 *
 * Manages patient/family education documentation for home health visits.
 * Tracks topics taught, teaching methods, learner response, and follow-up needs.
 */

import { Pool } from 'pg';
import { UUID } from '@folkcare/core';
import { format } from 'date-fns';

// Enums
export type EducationCategory =
  | 'DISEASE_MANAGEMENT'
  | 'MEDICATION'
  | 'SAFETY'
  | 'NUTRITION'
  | 'EXERCISE'
  | 'WOUND_CARE'
  | 'DME_EQUIPMENT'
  | 'FALL_PREVENTION'
  | 'INFECTION_CONTROL'
  | 'PAIN_MANAGEMENT'
  | 'RESPIRATORY'
  | 'CARDIAC'
  | 'DIABETES'
  | 'MENTAL_HEALTH'
  | 'END_OF_LIFE'
  | 'CAREGIVER_TRAINING'
  | 'EMERGENCY_PROCEDURES'
  | 'COMMUNITY_RESOURCES'
  | 'OTHER';

export type MaterialType =
  | 'HANDOUT'
  | 'BROCHURE'
  | 'BOOKLET'
  | 'POSTER'
  | 'VIDEO'
  | 'AUDIO'
  | 'WEBSITE'
  | 'APP'
  | 'DEMONSTRATION_GUIDE'
  | 'CHECKLIST'
  | 'OTHER';

export type LearnerType = 'PATIENT' | 'FAMILY_MEMBER' | 'CAREGIVER' | 'MULTIPLE' | 'OTHER';

export type TeachingMethod =
  | 'VERBAL_INSTRUCTION'
  | 'DEMONSTRATION'
  | 'RETURN_DEMONSTRATION'
  | 'WRITTEN_MATERIALS'
  | 'VIDEO'
  | 'HANDS_ON_PRACTICE'
  | 'DISCUSSION'
  | 'COMBINATION'
  | 'OTHER';

export type ComprehensionLevel =
  | 'FULLY_UNDERSTOOD'
  | 'MOSTLY_UNDERSTOOD'
  | 'PARTIALLY_UNDERSTOOD'
  | 'NEEDS_REINFORCEMENT'
  | 'UNABLE_TO_LEARN'
  | 'NOT_ASSESSED';

export type ReturnDemoResult = 'SUCCESSFUL' | 'PARTIALLY_SUCCESSFUL' | 'NEEDS_MORE_PRACTICE' | 'UNSUCCESSFUL';

export type LearningBarrier =
  | 'LANGUAGE'
  | 'COGNITIVE'
  | 'VISION'
  | 'HEARING'
  | 'LITERACY'
  | 'EMOTIONAL'
  | 'PHYSICAL'
  | 'CULTURAL'
  | 'MOTIVATION'
  | 'OTHER';

// Types
export interface EducationTopic {
  id: UUID;
  organizationId: UUID;
  name: string;
  description?: string;
  category: EducationCategory;
  learningObjectives?: string;
  keyPoints?: string;
  suggestedMaterials?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EducationMaterial {
  id: UUID;
  organizationId: UUID;
  topicId?: UUID;
  name: string;
  description?: string;
  materialType: MaterialType;
  language: string;
  readingLevel?: string;
  fileUrl?: string;
  source?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientEducation {
  id: UUID;
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  visitId?: UUID;
  topicId?: UUID;
  topicName: string;
  category: EducationCategory;
  specificContent?: string;
  learningObjectives?: string;
  learnerType: LearnerType;
  learnerName?: string;
  learnerRelationship?: string;
  teachingMethod: TeachingMethod;
  methodDetails?: string;
  materialsProvided?: string[];
  materialsNotes?: string;
  comprehensionLevel: ComprehensionLevel;
  comprehensionNotes?: string;
  learningBarriers?: LearningBarrier[];
  barrierNotes?: string;
  returnDemoPerformed: boolean;
  returnDemoResult?: ReturnDemoResult;
  returnDemoNotes?: string;
  followUpNeeded: boolean;
  followUpPlan?: string;
  followUpDate?: Date;
  documentedBy: UUID;
  documentedByName: string;
  documentedByCredentials?: string;
  educationDate: Date;
  timeSpentMinutes?: number;
  clinicalNotes?: string;
  patientResponse?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// Input types
export interface CreateEducationTopicInput {
  organizationId: UUID;
  name: string;
  description?: string;
  category: EducationCategory;
  learningObjectives?: string;
  keyPoints?: string;
  suggestedMaterials?: string;
  displayOrder?: number;
}

export interface CreateEducationMaterialInput {
  organizationId: UUID;
  topicId?: UUID;
  name: string;
  description?: string;
  materialType: MaterialType;
  language?: string;
  readingLevel?: string;
  fileUrl?: string;
  source?: string;
  displayOrder?: number;
}

export interface CreatePatientEducationInput {
  organizationId: UUID;
  branchId?: UUID;
  clientId: UUID;
  visitId?: UUID;
  topicId?: UUID;
  topicName: string;
  category: EducationCategory;
  specificContent?: string;
  learningObjectives?: string;
  learnerType: LearnerType;
  learnerName?: string;
  learnerRelationship?: string;
  teachingMethod: TeachingMethod;
  methodDetails?: string;
  materialsProvided?: string[];
  materialsNotes?: string;
  comprehensionLevel: ComprehensionLevel;
  comprehensionNotes?: string;
  learningBarriers?: LearningBarrier[];
  barrierNotes?: string;
  returnDemoPerformed?: boolean;
  returnDemoResult?: ReturnDemoResult;
  returnDemoNotes?: string;
  followUpNeeded?: boolean;
  followUpPlan?: string;
  followUpDate?: string;
  documentedBy: UUID;
  documentedByName: string;
  documentedByCredentials?: string;
  educationDate: string;
  timeSpentMinutes?: number;
  clinicalNotes?: string;
  patientResponse?: string;
}

export interface UpdatePatientEducationInput {
  id: UUID;
  specificContent?: string;
  comprehensionLevel?: ComprehensionLevel;
  comprehensionNotes?: string;
  returnDemoPerformed?: boolean;
  returnDemoResult?: ReturnDemoResult;
  returnDemoNotes?: string;
  followUpNeeded?: boolean;
  followUpPlan?: string;
  followUpDate?: string;
  clinicalNotes?: string;
  patientResponse?: string;
}

export interface EducationSummary {
  totalEducationSessions: number;
  sessionsThisMonth: number;
  fullyUnderstood: number;
  needsReinforcement: number;
  pendingFollowUp: number;
  byCategory: Record<string, number>;
  byLearnerType: Record<string, number>;
  byComprehension: Record<string, number>;
  averageTimeMinutes: number;
}

// Row types
interface EducationTopicRow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: EducationCategory;
  learning_objectives: string | null;
  key_points: string | null;
  suggested_materials: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

interface EducationMaterialRow {
  id: string;
  organization_id: string;
  topic_id: string | null;
  name: string;
  description: string | null;
  material_type: MaterialType;
  language: string;
  reading_level: string | null;
  file_url: string | null;
  source: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

interface PatientEducationRow {
  id: string;
  organization_id: string;
  branch_id: string | null;
  client_id: string;
  visit_id: string | null;
  topic_id: string | null;
  topic_name: string;
  category: EducationCategory;
  specific_content: string | null;
  learning_objectives: string | null;
  learner_type: LearnerType;
  learner_name: string | null;
  learner_relationship: string | null;
  teaching_method: TeachingMethod;
  method_details: string | null;
  materials_provided: string[] | null;
  materials_notes: string | null;
  comprehension_level: ComprehensionLevel;
  comprehension_notes: string | null;
  learning_barriers: LearningBarrier[] | null;
  barrier_notes: string | null;
  return_demo_performed: boolean;
  return_demo_result: ReturnDemoResult | null;
  return_demo_notes: string | null;
  follow_up_needed: boolean;
  follow_up_plan: string | null;
  follow_up_date: Date | null;
  documented_by: string;
  documented_by_name: string;
  documented_by_credentials: string | null;
  education_date: Date;
  time_spent_minutes: number | null;
  clinical_notes: string | null;
  patient_response: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export class PatientEducationService {
  constructor(private pool: Pool) {}

  // ==================== EDUCATION TOPICS ====================

  /**
   * Get education topics
   */
  async getEducationTopics(
    organizationId: UUID,
    options?: {
      category?: EducationCategory;
      activeOnly?: boolean;
      search?: string;
    }
  ): Promise<EducationTopic[]> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let paramCount = 1;

    if (options?.category) {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      values.push(options.category);
    }

    if (options?.activeOnly !== false) {
      conditions.push('is_active = true');
    }

    if (options?.search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      values.push(`%${options.search}%`);
    }

    // Conditions are from hardcoded strings, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<EducationTopicRow>(
      `SELECT * FROM education_topics WHERE ${conditions.join(' AND ')} ORDER BY category, display_order, name`,
      values
    );

    return result.rows.map(this.mapEducationTopic);
  }

  /**
   * Get education topic by ID
   */
  async getEducationTopicById(id: UUID): Promise<EducationTopic | null> {
    const result = await this.pool.query<EducationTopicRow>(
      `SELECT * FROM education_topics WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapEducationTopic(result.rows[0]) : null;
  }

  /**
   * Create education topic
   */
  async createEducationTopic(input: CreateEducationTopicInput): Promise<EducationTopic> {
    const result = await this.pool.query<EducationTopicRow>(
      `INSERT INTO education_topics (
        organization_id, name, description, category,
        learning_objectives, key_points, suggested_materials, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.category,
        input.learningObjectives ?? null,
        input.keyPoints ?? null,
        input.suggestedMaterials ?? null,
        input.displayOrder ?? 0,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapEducationTopic(result.rows[0]!);
  }

  /**
   * Update education topic
   */
  async updateEducationTopic(
    id: UUID,
    updates: Partial<CreateEducationTopicInput>
  ): Promise<EducationTopic> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramCount = 0;

    const fieldMap: Record<string, string> = {
      name: 'name',
      description: 'description',
      category: 'category',
      learningObjectives: 'learning_objectives',
      keyPoints: 'key_points',
      suggestedMaterials: 'suggested_materials',
      displayOrder: 'display_order',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (updates[key as keyof typeof updates] !== undefined) {
        paramCount++;
        setClauses.push(`${column} = $${paramCount}`);
        values.push(updates[key as keyof typeof updates]);
      }
    }

    paramCount++;
    values.push(id);

    // Column names are from hardcoded field map, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<EducationTopicRow>(
      `UPDATE education_topics SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Education topic not found');
    }

    return this.mapEducationTopic(result.rows[0]);
  }

  /**
   * Deactivate education topic
   */
  async deactivateEducationTopic(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE education_topics SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // ==================== EDUCATION MATERIALS ====================

  /**
   * Get education materials
   */
  async getEducationMaterials(
    organizationId: UUID,
    options?: {
      topicId?: UUID;
      materialType?: MaterialType;
      language?: string;
      activeOnly?: boolean;
    }
  ): Promise<EducationMaterial[]> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let paramCount = 1;

    if (options?.topicId) {
      paramCount++;
      conditions.push(`topic_id = $${paramCount}`);
      values.push(options.topicId);
    }

    if (options?.materialType) {
      paramCount++;
      conditions.push(`material_type = $${paramCount}`);
      values.push(options.materialType);
    }

    if (options?.language) {
      paramCount++;
      conditions.push(`language = $${paramCount}`);
      values.push(options.language);
    }

    if (options?.activeOnly !== false) {
      conditions.push('is_active = true');
    }

    // Conditions are from hardcoded strings, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<EducationMaterialRow>(
      `SELECT * FROM education_materials WHERE ${conditions.join(' AND ')} ORDER BY display_order, name`,
      values
    );

    return result.rows.map(this.mapEducationMaterial);
  }

  /**
   * Create education material
   */
  async createEducationMaterial(input: CreateEducationMaterialInput): Promise<EducationMaterial> {
    const result = await this.pool.query<EducationMaterialRow>(
      `INSERT INTO education_materials (
        organization_id, topic_id, name, description, material_type,
        language, reading_level, file_url, source, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        input.organizationId,
        input.topicId ?? null,
        input.name,
        input.description ?? null,
        input.materialType,
        input.language ?? 'English',
        input.readingLevel ?? null,
        input.fileUrl ?? null,
        input.source ?? null,
        input.displayOrder ?? 0,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapEducationMaterial(result.rows[0]!);
  }

  // ==================== PATIENT EDUCATION ====================

  /**
   * Create patient education record
   */
  async createPatientEducation(input: CreatePatientEducationInput): Promise<PatientEducation> {
    const result = await this.pool.query<PatientEducationRow>(
      `INSERT INTO patient_education (
        organization_id, branch_id, client_id, visit_id,
        topic_id, topic_name, category, specific_content, learning_objectives,
        learner_type, learner_name, learner_relationship,
        teaching_method, method_details, materials_provided, materials_notes,
        comprehension_level, comprehension_notes, learning_barriers, barrier_notes,
        return_demo_performed, return_demo_result, return_demo_notes,
        follow_up_needed, follow_up_plan, follow_up_date,
        documented_by, documented_by_name, documented_by_credentials,
        education_date, time_spent_minutes, clinical_notes, patient_response
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
      RETURNING *`,
      [
        input.organizationId,
        input.branchId ?? null,
        input.clientId,
        input.visitId ?? null,
        input.topicId ?? null,
        input.topicName,
        input.category,
        input.specificContent ?? null,
        input.learningObjectives ?? null,
        input.learnerType,
        input.learnerName ?? null,
        input.learnerRelationship ?? null,
        input.teachingMethod,
        input.methodDetails ?? null,
        input.materialsProvided ? JSON.stringify(input.materialsProvided) : null,
        input.materialsNotes ?? null,
        input.comprehensionLevel,
        input.comprehensionNotes ?? null,
        input.learningBarriers ? JSON.stringify(input.learningBarriers) : null,
        input.barrierNotes ?? null,
        input.returnDemoPerformed ?? false,
        input.returnDemoResult ?? null,
        input.returnDemoNotes ?? null,
        input.followUpNeeded ?? false,
        input.followUpPlan ?? null,
        input.followUpDate ?? null,
        input.documentedBy,
        input.documentedByName,
        input.documentedByCredentials ?? null,
        input.educationDate,
        input.timeSpentMinutes ?? null,
        input.clinicalNotes ?? null,
        input.patientResponse ?? null,
      ]
    );
    // INSERT RETURNING always returns the inserted row
    return this.mapPatientEducation(result.rows[0]!);
  }

  /**
   * Get patient education by ID
   */
  async getPatientEducationById(id: UUID): Promise<PatientEducation | null> {
    const result = await this.pool.query<PatientEducationRow>(
      `SELECT * FROM patient_education WHERE id = $1 AND is_deleted = false`,
      [id]
    );
    return result.rows[0] ? this.mapPatientEducation(result.rows[0]) : null;
  }

  /**
   * Get patient education records for a client
   */
  async getClientEducation(
    clientId: UUID,
    options?: {
      category?: EducationCategory;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PatientEducation[]> {
    const conditions = ['client_id = $1', 'is_deleted = false'];
    const values: unknown[] = [clientId];
    let paramCount = 1;

    if (options?.category) {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      values.push(options.category);
    }

    if (options?.startDate) {
      paramCount++;
      conditions.push(`education_date >= $${paramCount}`);
      values.push(options.startDate);
    }

    if (options?.endDate) {
      paramCount++;
      conditions.push(`education_date <= $${paramCount}`);
      values.push(options.endDate);
    }

    let query = `SELECT * FROM patient_education WHERE ${conditions.join(' AND ')} ORDER BY education_date DESC`;

    if (options?.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(options.limit);
    }

    if (options?.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(options.offset);
    }

    const result = await this.pool.query<PatientEducationRow>(query, values);
    return result.rows.map(this.mapPatientEducation);
  }

  /**
   * Get education for a visit
   */
  async getVisitEducation(visitId: UUID): Promise<PatientEducation[]> {
    const result = await this.pool.query<PatientEducationRow>(
      `SELECT * FROM patient_education WHERE visit_id = $1 AND is_deleted = false ORDER BY education_date`,
      [visitId]
    );
    return result.rows.map(this.mapPatientEducation);
  }

  /**
   * Get education needing follow-up
   */
  async getEducationNeedingFollowUp(organizationId: UUID): Promise<PatientEducation[]> {
    const result = await this.pool.query<PatientEducationRow>(
      `SELECT * FROM patient_education
       WHERE organization_id = $1
         AND follow_up_needed = true
         AND is_deleted = false
         AND (follow_up_date IS NULL OR follow_up_date <= CURRENT_DATE + INTERVAL '7 days')
       ORDER BY follow_up_date NULLS FIRST, education_date`,
      [organizationId]
    );
    return result.rows.map(this.mapPatientEducation);
  }

  /**
   * Get education with low comprehension
   */
  async getLowComprehensionEducation(organizationId: UUID): Promise<PatientEducation[]> {
    const result = await this.pool.query<PatientEducationRow>(
      `SELECT * FROM patient_education
       WHERE organization_id = $1
         AND comprehension_level IN ('NEEDS_REINFORCEMENT', 'UNABLE_TO_LEARN', 'PARTIALLY_UNDERSTOOD')
         AND is_deleted = false
       ORDER BY education_date DESC
       LIMIT 50`,
      [organizationId]
    );
    return result.rows.map(this.mapPatientEducation);
  }

  /**
   * Update patient education
   */
  async updatePatientEducation(input: UpdatePatientEducationInput): Promise<PatientEducation> {
    const setClauses: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];
    let paramCount = 0;

    const fieldMap: Record<string, string> = {
      specificContent: 'specific_content',
      comprehensionLevel: 'comprehension_level',
      comprehensionNotes: 'comprehension_notes',
      returnDemoPerformed: 'return_demo_performed',
      returnDemoResult: 'return_demo_result',
      returnDemoNotes: 'return_demo_notes',
      followUpNeeded: 'follow_up_needed',
      followUpPlan: 'follow_up_plan',
      followUpDate: 'follow_up_date',
      clinicalNotes: 'clinical_notes',
      patientResponse: 'patient_response',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if (input[key as keyof typeof input] !== undefined) {
        paramCount++;
        setClauses.push(`${column} = $${paramCount}`);
        values.push(input[key as keyof typeof input]);
      }
    }

    paramCount++;
    values.push(input.id);

    // Column names are from hardcoded field map, safe for dynamic SQL
    // eslint-disable-next-line sonarjs/sql-queries
    const result = await this.pool.query<PatientEducationRow>(
      `UPDATE patient_education SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      throw new Error('Patient education record not found');
    }

    return this.mapPatientEducation(result.rows[0]);
  }

  /**
   * Mark follow-up complete
   */
  async markFollowUpComplete(
    id: UUID,
    notes: string
  ): Promise<PatientEducation> {
    const result = await this.pool.query<PatientEducationRow>(
      `UPDATE patient_education SET
        follow_up_needed = false,
        clinical_notes = COALESCE(clinical_notes || E'\n', '') || $2,
        updated_at = NOW()
      WHERE id = $1 RETURNING *`,
      [id, `[${format(new Date(), 'MMM d, yyyy')}] Follow-up completed: ${notes}`]
    );

    if (!result.rows[0]) {
      throw new Error('Patient education record not found');
    }

    return this.mapPatientEducation(result.rows[0]);
  }

  /**
   * Soft delete patient education
   */
  async deletePatientEducation(id: UUID): Promise<void> {
    await this.pool.query(
      `UPDATE patient_education SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  // ==================== SUMMARY ====================

  /**
   * Get education summary for organization
   */
  async getEducationSummary(organizationId: UUID): Promise<EducationSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total education sessions
    const totalResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM patient_education WHERE organization_id = $1 AND is_deleted = false`,
      [organizationId]
    );

    // Sessions this month
    const monthResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false AND education_date >= $2`,
      [organizationId, monthStart]
    );

    // Fully understood
    const understoodResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false AND comprehension_level = 'FULLY_UNDERSTOOD'`,
      [organizationId]
    );

    // Needs reinforcement
    const reinforceResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false
         AND comprehension_level IN ('NEEDS_REINFORCEMENT', 'PARTIALLY_UNDERSTOOD')`,
      [organizationId]
    );

    // Pending follow-up
    const followUpResult = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false AND follow_up_needed = true`,
      [organizationId]
    );

    // By category
    const categoryResult = await this.pool.query<{ category: string; count: string }>(
      `SELECT category, COUNT(*) as count FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY category`,
      [organizationId]
    );

    // By learner type
    const learnerResult = await this.pool.query<{ learner_type: string; count: string }>(
      `SELECT learner_type, COUNT(*) as count FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY learner_type`,
      [organizationId]
    );

    // By comprehension
    const comprehensionResult = await this.pool.query<{ comprehension_level: string; count: string }>(
      `SELECT comprehension_level, COUNT(*) as count FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false
       GROUP BY comprehension_level`,
      [organizationId]
    );

    // Average time
    const timeResult = await this.pool.query<{ avg: string | null }>(
      `SELECT AVG(time_spent_minutes) as avg FROM patient_education
       WHERE organization_id = $1 AND is_deleted = false AND time_spent_minutes IS NOT NULL`,
      [organizationId]
    );

    const byCategory: Record<string, number> = {};
    for (const row of categoryResult.rows) {
      byCategory[row.category] = parseInt(row.count, 10);
    }

    const byLearnerType: Record<string, number> = {};
    for (const row of learnerResult.rows) {
      byLearnerType[row.learner_type] = parseInt(row.count, 10);
    }

    const byComprehension: Record<string, number> = {};
    for (const row of comprehensionResult.rows) {
      byComprehension[row.comprehension_level] = parseInt(row.count, 10);
    }

    // COUNT(*) queries always return a row
    return {
      totalEducationSessions: parseInt(totalResult.rows[0]!.count, 10),
      sessionsThisMonth: parseInt(monthResult.rows[0]!.count, 10),
      fullyUnderstood: parseInt(understoodResult.rows[0]!.count, 10),
      needsReinforcement: parseInt(reinforceResult.rows[0]!.count, 10),
      pendingFollowUp: parseInt(followUpResult.rows[0]!.count, 10),
      byCategory,
      byLearnerType,
      byComprehension,
      averageTimeMinutes: timeResult.rows[0]?.avg ? parseFloat(timeResult.rows[0].avg) : 0,
    };
  }

  /**
   * Generate printable education summary for client
   */
  generateEducationReport(clientName: string, educationRecords: PatientEducation[]): string {
    const lines: string[] = [];
    lines.push('='.repeat(60));
    lines.push('PATIENT EDUCATION SUMMARY');
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Patient: ${clientName}`);
    lines.push(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`);
    lines.push('');

    if (educationRecords.length === 0) {
      lines.push('No education records on file.');
      return lines.join('\n');
    }

    lines.push(`Total Education Sessions: ${educationRecords.length}`);
    lines.push('');

    // Group by category
    const byCategory = new Map<EducationCategory, PatientEducation[]>();
    for (const record of educationRecords) {
      const existing = byCategory.get(record.category) ?? [];
      existing.push(record);
      byCategory.set(record.category, existing);
    }

    for (const [category, records] of byCategory) {
      lines.push('-'.repeat(60));
      lines.push(category.replace(/_/g, ' '));
      lines.push('-'.repeat(60));

      for (const record of records) {
        lines.push('');
        lines.push(`${format(record.educationDate, 'MMM d, yyyy')}: ${record.topicName}`);
        lines.push(`  Learner: ${record.learnerType.replace(/_/g, ' ')}`);
        lines.push(`  Method: ${record.teachingMethod.replace(/_/g, ' ')}`);
        lines.push(`  Comprehension: ${record.comprehensionLevel.replace(/_/g, ' ')}`);
        if (record.returnDemoPerformed && record.returnDemoResult) {
          lines.push(`  Return Demo: ${record.returnDemoResult.replace(/_/g, ' ')}`);
        }
        if (record.followUpNeeded) {
          const followUpText = record.followUpDate
            ? `Follow-up scheduled: ${format(record.followUpDate, 'MMM d, yyyy')}`
            : 'Follow-up needed';
          lines.push(`  ${followUpText}`);
        }
        if (record.documentedByName) {
          const credentials = record.documentedByCredentials ? `, ${record.documentedByCredentials}` : '';
          lines.push(`  Documented by: ${record.documentedByName}${credentials}`);
        }
      }
    }

    lines.push('');
    lines.push('='.repeat(60));
    lines.push('END OF REPORT');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  // ==================== MAPPING ====================

  private mapEducationTopic(row: EducationTopicRow): EducationTopic {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description ?? undefined,
      category: row.category,
      learningObjectives: row.learning_objectives ?? undefined,
      keyPoints: row.key_points ?? undefined,
      suggestedMaterials: row.suggested_materials ?? undefined,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapEducationMaterial(row: EducationMaterialRow): EducationMaterial {
    return {
      id: row.id,
      organizationId: row.organization_id,
      topicId: row.topic_id ?? undefined,
      name: row.name,
      description: row.description ?? undefined,
      materialType: row.material_type,
      language: row.language,
      readingLevel: row.reading_level ?? undefined,
      fileUrl: row.file_url ?? undefined,
      source: row.source ?? undefined,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPatientEducation(row: PatientEducationRow): PatientEducation {
    return {
      id: row.id,
      organizationId: row.organization_id,
      branchId: row.branch_id ?? undefined,
      clientId: row.client_id,
      visitId: row.visit_id ?? undefined,
      topicId: row.topic_id ?? undefined,
      topicName: row.topic_name,
      category: row.category,
      specificContent: row.specific_content ?? undefined,
      learningObjectives: row.learning_objectives ?? undefined,
      learnerType: row.learner_type,
      learnerName: row.learner_name ?? undefined,
      learnerRelationship: row.learner_relationship ?? undefined,
      teachingMethod: row.teaching_method,
      methodDetails: row.method_details ?? undefined,
      materialsProvided: row.materials_provided ?? undefined,
      materialsNotes: row.materials_notes ?? undefined,
      comprehensionLevel: row.comprehension_level,
      comprehensionNotes: row.comprehension_notes ?? undefined,
      learningBarriers: row.learning_barriers ?? undefined,
      barrierNotes: row.barrier_notes ?? undefined,
      returnDemoPerformed: row.return_demo_performed,
      returnDemoResult: row.return_demo_result ?? undefined,
      returnDemoNotes: row.return_demo_notes ?? undefined,
      followUpNeeded: row.follow_up_needed,
      followUpPlan: row.follow_up_plan ?? undefined,
      followUpDate: row.follow_up_date ?? undefined,
      documentedBy: row.documented_by,
      documentedByName: row.documented_by_name,
      documentedByCredentials: row.documented_by_credentials ?? undefined,
      educationDate: row.education_date,
      timeSpentMinutes: row.time_spent_minutes ?? undefined,
      clinicalNotes: row.clinical_notes ?? undefined,
      patientResponse: row.patient_response ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isDeleted: row.is_deleted,
    };
  }
}
