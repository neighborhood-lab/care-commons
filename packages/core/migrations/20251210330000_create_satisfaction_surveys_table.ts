import type { Knex } from 'knex';

/**
 * Family Satisfaction Surveys
 *
 * Creates tables for periodic satisfaction surveys to gather family feedback.
 * Designed to be "non-annoying" - respects survey frequency limits and preferences.
 *
 * Tables:
 * - survey_templates: Reusable survey definitions
 * - survey_questions: Questions within a survey template
 * - survey_invitations: Invitations sent to family members
 * - survey_responses: Family member survey responses
 * - survey_response_answers: Individual answers to questions
 *
 * Features:
 * - Multiple question types (rating, multiple choice, text, NPS)
 * - Survey frequency controls (prevent over-surveying)
 * - Anonymous response option
 * - Survey scheduling and expiration
 * - Aggregate analytics support
 */
export async function up(knex: Knex): Promise<void> {
  // ============================================================================
  // Survey Templates
  // ============================================================================

  await knex.schema.createTable('survey_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Template details
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('survey_type', 50).notNullable(); // SATISFACTION, NPS, CARE_QUALITY, CAREGIVER_FEEDBACK, CUSTOM
    table.string('status', 20).notNullable().defaultTo('DRAFT'); // DRAFT, ACTIVE, ARCHIVED

    // Configuration
    table.integer('estimated_minutes').notNullable().defaultTo(5); // Estimated time to complete
    table.boolean('allow_anonymous').notNullable().defaultTo(false); // Allow anonymous responses
    table.boolean('is_required').notNullable().defaultTo(false); // Required vs optional survey
    table.integer('min_days_between_surveys').notNullable().defaultTo(30); // Prevent over-surveying

    // Scheduling
    table.string('trigger_type', 50).notNullable().defaultTo('MANUAL'); // MANUAL, SCHEDULED, AFTER_VISIT, AFTER_MILESTONE
    table.integer('trigger_days_after_event'); // Days after event to send (for AFTER_* triggers)
    table.string('schedule_frequency', 20); // WEEKLY, MONTHLY, QUARTERLY (for SCHEDULED)
    table.integer('schedule_day_of_week'); // 0-6 for weekly
    table.integer('schedule_day_of_month'); // 1-31 for monthly

    // Display
    table.text('welcome_message');
    table.text('thank_you_message');
    table.string('logo_url', 500);

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`survey_type IN ('SATISFACTION', 'NPS', 'CARE_QUALITY', 'CAREGIVER_FEEDBACK', 'CUSTOM')`);
    table.check(`status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')`);
    table.check(`trigger_type IN ('MANUAL', 'SCHEDULED', 'AFTER_VISIT', 'AFTER_MILESTONE', 'AFTER_CARE_PLAN_UPDATE')`);
    table.check(`schedule_frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY') OR schedule_frequency IS NULL`);
  });

  // ============================================================================
  // Survey Questions
  // ============================================================================

  await knex.schema.createTable('survey_questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('survey_template_id').notNullable().references('id').inTable('survey_templates').onDelete('CASCADE');

    // Question details
    table.integer('order_index').notNullable(); // Question order in survey
    table.string('question_type', 50).notNullable(); // RATING, MULTIPLE_CHOICE, TEXT, NPS, YES_NO, SCALE
    table.text('question_text').notNullable();
    table.text('help_text'); // Optional help text for the question

    // Configuration
    table.boolean('is_required').notNullable().defaultTo(true);
    table.jsonb('options').defaultTo('[]'); // For MULTIPLE_CHOICE: ["Option 1", "Option 2", ...]
    table.integer('min_value'); // For RATING/SCALE: minimum value
    table.integer('max_value'); // For RATING/SCALE: maximum value
    table.string('min_label', 100); // Label for min value (e.g., "Very Dissatisfied")
    table.string('max_label', 100); // Label for max value (e.g., "Very Satisfied")

    // Conditional logic
    table.uuid('conditional_on_question_id').references('id').inTable('survey_questions');
    table.string('conditional_operator', 20); // EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN
    table.string('conditional_value', 255); // Value to compare against

    // Categorization
    table.string('category', 100); // For grouping questions (e.g., "Care Quality", "Communication")

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');

    // Constraints
    table.check(`question_type IN ('RATING', 'MULTIPLE_CHOICE', 'TEXT', 'NPS', 'YES_NO', 'SCALE')`);
    table.check(`conditional_operator IN ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN') OR conditional_operator IS NULL`);
  });

  // ============================================================================
  // Survey Invitations
  // ============================================================================

  await knex.schema.createTable('survey_invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('survey_template_id').notNullable().references('id').inTable('survey_templates').onDelete('CASCADE');
    table.uuid('family_member_id').notNullable().references('id').inTable('family_members').onDelete('CASCADE');
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Invitation details
    table.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING, SENT, OPENED, STARTED, COMPLETED, EXPIRED, DECLINED
    table.string('invitation_code', 100).notNullable().unique(); // Unique code for survey access

    // Scheduling
    table.timestamp('scheduled_send_at'); // When to send the invitation
    table.timestamp('sent_at'); // When actually sent
    table.timestamp('expires_at').notNullable(); // Expiration date

    // Trigger context
    table.string('trigger_type', 50).notNullable(); // What triggered this invitation
    table.uuid('trigger_entity_id'); // Related entity (e.g., visit_id)
    table.string('trigger_entity_type', 50); // Type of related entity

    // Response tracking
    table.timestamp('opened_at'); // When family member opened the survey
    table.timestamp('started_at'); // When they started answering
    table.timestamp('completed_at'); // When they completed
    table.timestamp('declined_at'); // If they declined
    table.text('decline_reason');

    // Reminders
    table.integer('reminder_count').notNullable().defaultTo(0);
    table.timestamp('last_reminder_at');

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');

    // Constraints
    table.check(`status IN ('PENDING', 'SENT', 'OPENED', 'STARTED', 'COMPLETED', 'EXPIRED', 'DECLINED')`);
    table.check(`trigger_type IN ('MANUAL', 'SCHEDULED', 'AFTER_VISIT', 'AFTER_MILESTONE', 'AFTER_CARE_PLAN_UPDATE')`);
  });

  // ============================================================================
  // Survey Responses
  // ============================================================================

  await knex.schema.createTable('survey_responses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('survey_invitation_id').notNullable().references('id').inTable('survey_invitations').onDelete('CASCADE');
    table.uuid('survey_template_id').notNullable().references('id').inTable('survey_templates').onDelete('CASCADE');
    table.uuid('family_member_id').references('id').inTable('family_members').onDelete('SET NULL'); // Null if anonymous
    table.uuid('client_id').notNullable().references('id').inTable('clients').onDelete('CASCADE');

    // Response details
    table.boolean('is_anonymous').notNullable().defaultTo(false);
    table.string('status', 20).notNullable().defaultTo('IN_PROGRESS'); // IN_PROGRESS, COMPLETED, ABANDONED
    table.integer('completion_percentage').notNullable().defaultTo(0); // 0-100

    // Timing
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at');
    table.integer('time_spent_seconds'); // Total time spent on survey

    // Calculated scores
    table.decimal('overall_satisfaction_score', 4, 2); // Calculated overall score (0-10 or percentage)
    table.integer('nps_score'); // Net Promoter Score (-100 to 100)
    table.jsonb('category_scores').defaultTo('{}'); // Scores by category

    // Device info (for analytics)
    table.string('device_type', 50); // DESKTOP, MOBILE, TABLET
    table.string('browser', 100);

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users'); // Null for anonymous
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')`);
    table.check(`device_type IN ('DESKTOP', 'MOBILE', 'TABLET') OR device_type IS NULL`);
  });

  // ============================================================================
  // Survey Response Answers
  // ============================================================================

  await knex.schema.createTable('survey_response_answers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('survey_response_id').notNullable().references('id').inTable('survey_responses').onDelete('CASCADE');
    table.uuid('survey_question_id').notNullable().references('id').inTable('survey_questions').onDelete('CASCADE');

    // Answer data
    table.integer('rating_value'); // For RATING, NPS, SCALE, YES_NO (1/0)
    table.text('text_value'); // For TEXT, or additional comments
    table.jsonb('selected_options').defaultTo('[]'); // For MULTIPLE_CHOICE (array of selected indices)

    // Timing
    table.integer('time_spent_seconds'); // Time spent on this question
    table.timestamp('answered_at').notNullable().defaultTo(knex.fn.now());

    // Flags
    table.boolean('was_skipped').notNullable().defaultTo(false);

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Unique constraint: one answer per question per response
    table.unique(['survey_response_id', 'survey_question_id']);
  });

  // ============================================================================
  // Survey Analytics (Aggregate View Support)
  // ============================================================================

  await knex.schema.createTable('survey_analytics', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('survey_template_id').notNullable().references('id').inTable('survey_templates').onDelete('CASCADE');

    // Time period
    table.date('period_date').notNullable(); // Date of the aggregation period
    table.string('period_type', 20).notNullable(); // DAILY, WEEKLY, MONTHLY

    // Response metrics
    table.integer('invitations_sent').notNullable().defaultTo(0);
    table.integer('invitations_opened').notNullable().defaultTo(0);
    table.integer('responses_started').notNullable().defaultTo(0);
    table.integer('responses_completed').notNullable().defaultTo(0);
    table.integer('responses_abandoned').notNullable().defaultTo(0);
    table.decimal('completion_rate', 5, 2); // Percentage

    // Score metrics
    table.decimal('avg_satisfaction_score', 4, 2);
    table.integer('avg_nps_score');
    table.jsonb('avg_category_scores').defaultTo('{}');

    // Timing metrics
    table.integer('avg_time_spent_seconds');

    // Organization context
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Unique constraint
    table.unique(['survey_template_id', 'period_date', 'period_type', 'organization_id']);

    // Constraints
    table.check(`period_type IN ('DAILY', 'WEEKLY', 'MONTHLY')`);
  });

  // ============================================================================
  // Indexes for Performance
  // ============================================================================

  // Survey templates indexes
  await knex.raw('CREATE INDEX idx_survey_templates_org_status ON survey_templates(organization_id, status)');
  await knex.raw('CREATE INDEX idx_survey_templates_type ON survey_templates(survey_type) WHERE status = \'ACTIVE\'');

  // Survey questions indexes
  await knex.raw('CREATE INDEX idx_survey_questions_template ON survey_questions(survey_template_id, order_index)');
  await knex.raw('CREATE INDEX idx_survey_questions_category ON survey_questions(category) WHERE category IS NOT NULL');

  // Survey invitations indexes
  await knex.raw('CREATE INDEX idx_survey_invitations_family_member ON survey_invitations(family_member_id, status)');
  await knex.raw('CREATE INDEX idx_survey_invitations_client ON survey_invitations(client_id)');
  await knex.raw('CREATE INDEX idx_survey_invitations_code ON survey_invitations(invitation_code)');
  await knex.raw('CREATE INDEX idx_survey_invitations_pending ON survey_invitations(scheduled_send_at) WHERE status = \'PENDING\'');
  await knex.raw('CREATE INDEX idx_survey_invitations_expires ON survey_invitations(expires_at) WHERE status NOT IN (\'COMPLETED\', \'DECLINED\', \'EXPIRED\')');

  // Survey responses indexes
  await knex.raw('CREATE INDEX idx_survey_responses_invitation ON survey_responses(survey_invitation_id)');
  await knex.raw('CREATE INDEX idx_survey_responses_template ON survey_responses(survey_template_id, status)');
  await knex.raw('CREATE INDEX idx_survey_responses_client ON survey_responses(client_id, completed_at DESC)');
  await knex.raw('CREATE INDEX idx_survey_responses_family_member ON survey_responses(family_member_id) WHERE family_member_id IS NOT NULL');
  await knex.raw('CREATE INDEX idx_survey_responses_completed ON survey_responses(completed_at DESC) WHERE status = \'COMPLETED\'');

  // Survey response answers indexes
  await knex.raw('CREATE INDEX idx_survey_response_answers_response ON survey_response_answers(survey_response_id)');
  await knex.raw('CREATE INDEX idx_survey_response_answers_question ON survey_response_answers(survey_question_id)');

  // Survey analytics indexes
  await knex.raw('CREATE INDEX idx_survey_analytics_template_period ON survey_analytics(survey_template_id, period_date DESC)');
  await knex.raw('CREATE INDEX idx_survey_analytics_org ON survey_analytics(organization_id, period_date DESC)');

  // ============================================================================
  // Triggers for updated_at
  // ============================================================================

  const tables = [
    'survey_templates',
    'survey_questions',
    'survey_invitations',
    'survey_responses',
    'survey_response_answers',
    'survey_analytics'
  ];

  for (const tableName of tables) {
    await knex.raw(`
      CREATE TRIGGER update_${tableName}_updated_at
        BEFORE UPDATE ON ${tableName}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);
  }

  // ============================================================================
  // Seed Default Survey Templates
  // ============================================================================

  // Get a sample organization and user for seeding (will be replaced in production)
  const orgResult = await knex('organizations').select('id').first();
  const userResult = await knex('users').select('id').first();

  if (orgResult && userResult) {
    const orgId = orgResult.id;
    const userId = userResult.id;

    // Insert default survey templates
    const templates = [
      {
        name: 'Monthly Care Satisfaction Survey',
        description: 'A brief monthly survey to gauge family satisfaction with care services.',
        survey_type: 'SATISFACTION',
        status: 'ACTIVE',
        estimated_minutes: 3,
        allow_anonymous: false,
        is_required: false,
        min_days_between_surveys: 30,
        trigger_type: 'SCHEDULED',
        schedule_frequency: 'MONTHLY',
        schedule_day_of_month: 1,
        welcome_message: 'Thank you for taking a few minutes to share your feedback. Your input helps us provide better care.',
        thank_you_message: 'Thank you for your feedback! We truly value your input and use it to continuously improve our services.',
        organization_id: orgId,
        created_by: userId,
        updated_by: userId
      },
      {
        name: 'Net Promoter Score Survey',
        description: 'Quick NPS survey to measure likelihood of recommending our services.',
        survey_type: 'NPS',
        status: 'ACTIVE',
        estimated_minutes: 1,
        allow_anonymous: true,
        is_required: false,
        min_days_between_surveys: 90,
        trigger_type: 'SCHEDULED',
        schedule_frequency: 'QUARTERLY',
        schedule_day_of_month: 15,
        welcome_message: 'We\'d love to hear how likely you are to recommend our services to others.',
        thank_you_message: 'Thank you for your feedback!',
        organization_id: orgId,
        created_by: userId,
        updated_by: userId
      },
      {
        name: 'Post-Visit Feedback',
        description: 'Brief survey sent after visits to gather immediate feedback.',
        survey_type: 'CARE_QUALITY',
        status: 'ACTIVE',
        estimated_minutes: 2,
        allow_anonymous: false,
        is_required: false,
        min_days_between_surveys: 7,
        trigger_type: 'AFTER_VISIT',
        trigger_days_after_event: 1,
        welcome_message: 'How was your recent visit? Your feedback helps us ensure quality care.',
        thank_you_message: 'Thank you for sharing your thoughts on the recent visit!',
        organization_id: orgId,
        created_by: userId,
        updated_by: userId
      },
      {
        name: 'Caregiver Feedback Survey',
        description: 'Survey to gather feedback about specific caregivers.',
        survey_type: 'CAREGIVER_FEEDBACK',
        status: 'ACTIVE',
        estimated_minutes: 4,
        allow_anonymous: false,
        is_required: false,
        min_days_between_surveys: 14,
        trigger_type: 'MANUAL',
        welcome_message: 'We\'d like to hear about your experience with our caregivers.',
        thank_you_message: 'Thank you for your feedback about our caregiving team!',
        organization_id: orgId,
        created_by: userId,
        updated_by: userId
      }
    ];

    const insertedTemplates = await knex('survey_templates')
      .insert(templates)
      .returning(['id', 'survey_type']);

    // Add questions for each template
    const satisfactionTemplateId = insertedTemplates.find((t: { survey_type: string }) => t.survey_type === 'SATISFACTION')?.id;
    const npsTemplateId = insertedTemplates.find((t: { survey_type: string }) => t.survey_type === 'NPS')?.id;
    const careQualityTemplateId = insertedTemplates.find((t: { survey_type: string }) => t.survey_type === 'CARE_QUALITY')?.id;
    const caregiverTemplateId = insertedTemplates.find((t: { survey_type: string }) => t.survey_type === 'CAREGIVER_FEEDBACK')?.id;

    const questions = [];

    // Satisfaction survey questions
    if (satisfactionTemplateId) {
      questions.push(
        {
          survey_template_id: satisfactionTemplateId,
          order_index: 1,
          question_type: 'RATING',
          question_text: 'How satisfied are you with the overall quality of care provided?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Very Dissatisfied',
          max_label: 'Very Satisfied',
          category: 'Overall Satisfaction',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: satisfactionTemplateId,
          order_index: 2,
          question_type: 'RATING',
          question_text: 'How well do our caregivers communicate with you about your loved one\'s care?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Very Poor',
          max_label: 'Excellent',
          category: 'Communication',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: satisfactionTemplateId,
          order_index: 3,
          question_type: 'RATING',
          question_text: 'How responsive is our team when you have questions or concerns?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Not Responsive',
          max_label: 'Very Responsive',
          category: 'Responsiveness',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: satisfactionTemplateId,
          order_index: 4,
          question_type: 'YES_NO',
          question_text: 'Do you feel informed about your loved one\'s care plan and progress?',
          is_required: true,
          category: 'Communication',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: satisfactionTemplateId,
          order_index: 5,
          question_type: 'TEXT',
          question_text: 'Is there anything we could do to improve our services?',
          is_required: false,
          category: 'Feedback',
          created_by: userId,
          updated_by: userId
        }
      );
    }

    // NPS survey questions
    if (npsTemplateId) {
      questions.push(
        {
          survey_template_id: npsTemplateId,
          order_index: 1,
          question_type: 'NPS',
          question_text: 'How likely are you to recommend our services to a friend or family member?',
          is_required: true,
          min_value: 0,
          max_value: 10,
          min_label: 'Not at all likely',
          max_label: 'Extremely likely',
          category: 'NPS',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: npsTemplateId,
          order_index: 2,
          question_type: 'TEXT',
          question_text: 'What is the primary reason for your score?',
          is_required: false,
          category: 'Feedback',
          created_by: userId,
          updated_by: userId
        }
      );
    }

    // Care quality survey questions
    if (careQualityTemplateId) {
      questions.push(
        {
          survey_template_id: careQualityTemplateId,
          order_index: 1,
          question_type: 'RATING',
          question_text: 'How would you rate the quality of the recent visit?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Poor',
          max_label: 'Excellent',
          category: 'Visit Quality',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: careQualityTemplateId,
          order_index: 2,
          question_type: 'YES_NO',
          question_text: 'Did the caregiver arrive on time?',
          is_required: true,
          category: 'Punctuality',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: careQualityTemplateId,
          order_index: 3,
          question_type: 'YES_NO',
          question_text: 'Were all planned tasks completed during the visit?',
          is_required: true,
          category: 'Task Completion',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: careQualityTemplateId,
          order_index: 4,
          question_type: 'TEXT',
          question_text: 'Any additional comments about the visit?',
          is_required: false,
          category: 'Feedback',
          created_by: userId,
          updated_by: userId
        }
      );
    }

    // Caregiver feedback survey questions
    if (caregiverTemplateId) {
      questions.push(
        {
          survey_template_id: caregiverTemplateId,
          order_index: 1,
          question_type: 'RATING',
          question_text: 'How would you rate the caregiver\'s professionalism?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Poor',
          max_label: 'Excellent',
          category: 'Professionalism',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: caregiverTemplateId,
          order_index: 2,
          question_type: 'RATING',
          question_text: 'How compassionate and caring is the caregiver?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Not at all',
          max_label: 'Extremely',
          category: 'Compassion',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: caregiverTemplateId,
          order_index: 3,
          question_type: 'RATING',
          question_text: 'How well does the caregiver communicate with your loved one?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Poor',
          max_label: 'Excellent',
          category: 'Communication',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: caregiverTemplateId,
          order_index: 4,
          question_type: 'RATING',
          question_text: 'How skilled is the caregiver in providing care?',
          is_required: true,
          min_value: 1,
          max_value: 5,
          min_label: 'Needs Improvement',
          max_label: 'Highly Skilled',
          category: 'Skills',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: caregiverTemplateId,
          order_index: 5,
          question_type: 'TEXT',
          question_text: 'What does this caregiver do particularly well?',
          is_required: false,
          category: 'Feedback',
          created_by: userId,
          updated_by: userId
        },
        {
          survey_template_id: caregiverTemplateId,
          order_index: 6,
          question_type: 'TEXT',
          question_text: 'Are there areas where this caregiver could improve?',
          is_required: false,
          category: 'Feedback',
          created_by: userId,
          updated_by: userId
        }
      );
    }

    if (questions.length > 0) {
      await knex('survey_questions').insert(questions);
    }
  }

  // ============================================================================
  // Table Comments
  // ============================================================================

  await knex.raw("COMMENT ON TABLE survey_templates IS 'Reusable survey template definitions with scheduling and configuration'");
  await knex.raw("COMMENT ON TABLE survey_questions IS 'Questions within survey templates with various question types'");
  await knex.raw("COMMENT ON TABLE survey_invitations IS 'Invitations sent to family members to complete surveys'");
  await knex.raw("COMMENT ON TABLE survey_responses IS 'Family member responses to surveys with calculated scores'");
  await knex.raw("COMMENT ON TABLE survey_response_answers IS 'Individual answers to survey questions'");
  await knex.raw("COMMENT ON TABLE survey_analytics IS 'Aggregated survey analytics for reporting and trends'");
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'survey_analytics',
    'survey_response_answers',
    'survey_responses',
    'survey_invitations',
    'survey_questions',
    'survey_templates'
  ];

  // Drop triggers
  for (const tableName of tables) {
    await knex.raw(`DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName}`);
  }

  // Drop tables in reverse order (respects foreign key constraints)
  for (const tableName of tables) {
    await knex.schema.dropTableIfExists(tableName);
  }
}
