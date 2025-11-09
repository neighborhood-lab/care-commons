import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create email_templates table for customizable email templates
  await knex.schema.createTable('email_templates', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    // Organization reference (null means global/default template)
    table.uuid('organization_id').references('id').inTable('organizations').onDelete('CASCADE');

    // Template identification
    table.string('template_key', 100).notNullable(); // e.g., 'welcome', 'password_reset', 'visit_reminder'
    table.string('template_name', 200).notNullable(); // Human-readable name
    table.text('description'); // Template description

    // Email content
    table.string('subject', 500).notNullable(); // Email subject line (supports variables)
    table.text('body_text').notNullable(); // Plain text version
    table.text('body_html'); // HTML version (optional)
    table.text('preview_text'); // Email preview text (first line in inbox)

    // Template variables
    table.jsonb('available_variables'); // List of available variables with descriptions
    table.jsonb('default_values'); // Default values for variables

    // Sender configuration
    table.string('from_name', 200); // Sender name (overrides org default)
    table.string('from_email', 255); // Sender email (overrides org default)
    table.string('reply_to_email', 255); // Reply-to email

    // Attachments
    table.jsonb('attachments'); // Array of attachment configurations

    // Layout and styling
    table.text('custom_css'); // Custom CSS for HTML emails
    table.boolean('use_org_branding').notNullable().defaultTo(true); // Include org logo/colors

    // Localization
    table.string('language', 10).defaultTo('en'); // Language code (e.g., 'en', 'es')
    table.string('locale', 10).defaultTo('en-US'); // Full locale (e.g., 'en-US', 'es-MX')

    // Status and versioning
    table.string('status', 50).notNullable().defaultTo('DRAFT'); // DRAFT, ACTIVE, ARCHIVED
    table.integer('template_version').notNullable().defaultTo(1);
    table.boolean('is_default').notNullable().defaultTo(false); // Is this the default for this template_key?

    // Testing
    table.timestamp('last_tested_at');
    table.uuid('last_tested_by').references('id').inTable('users');
    table.text('test_notes');

    // Usage tracking
    table.integer('sent_count').notNullable().defaultTo(0); // How many times this template was used
    table.timestamp('last_sent_at'); // When it was last used

    // Audit fields
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.uuid('updated_by').notNullable().references('id').inTable('users');
    table.integer('version').notNullable().defaultTo(1);

    // Constraints
    table.check(`status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')`);
    // If organization_id is null (global template), must be marked as default
    // If organization_id is not null, can customize
  });

  // Indexes for performance
  await knex.raw('CREATE INDEX idx_email_templates_org_id ON email_templates(organization_id)');
  await knex.raw('CREATE INDEX idx_email_templates_template_key ON email_templates(template_key)');
  await knex.raw('CREATE INDEX idx_email_templates_status ON email_templates(status) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_email_templates_org_key ON email_templates(organization_id, template_key, status) WHERE status = \'ACTIVE\'');
  await knex.raw('CREATE INDEX idx_email_templates_default ON email_templates(template_key, is_default) WHERE is_default = true');

  // Trigger to automatically update updated_at
  await knex.raw(`
    CREATE TRIGGER update_email_templates_updated_at
      BEFORE UPDATE ON email_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()
  `);

  // Trigger to increment sent_count
  await knex.raw(`
    CREATE OR REPLACE FUNCTION increment_email_sent_count()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE email_templates
      SET sent_count = sent_count + 1,
          last_sent_at = NOW()
      WHERE id = NEW.template_id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  // Comments for documentation
  await knex.raw("COMMENT ON TABLE email_templates IS 'Customizable email templates for organization white-labeling'");
  await knex.raw("COMMENT ON COLUMN email_templates.template_key IS 'Unique identifier for template type (e.g., welcome, password_reset)'");
  await knex.raw("COMMENT ON COLUMN email_templates.available_variables IS 'JSON array of available template variables and their descriptions'");
  await knex.raw("COMMENT ON COLUMN email_templates.use_org_branding IS 'Whether to include organization logo and brand colors'");

  // Insert default templates for common scenarios
  await knex.raw(`
    INSERT INTO email_templates (
      organization_id, template_key, template_name, description, subject, body_text, body_html,
      available_variables, status, is_default, created_by, updated_by
    ) VALUES
    -- Welcome email
    (
      NULL,
      'welcome',
      'Welcome Email',
      'Sent when a new user joins the organization',
      'Welcome to {{organizationName}}!',
      'Hi {{firstName}},\n\nWelcome to {{organizationName}}! We''re excited to have you on board.\n\nYour username is: {{username}}\n\nGet started by logging in at: {{loginUrl}}\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nThe {{organizationName}} Team',
      '<h1>Welcome to {{organizationName}}!</h1><p>Hi {{firstName}},</p><p>We''re excited to have you on board.</p><p><strong>Username:</strong> {{username}}</p><p><a href="{{loginUrl}}">Login to your account</a></p>',
      '["organizationName", "firstName", "lastName", "username", "email", "loginUrl"]'::jsonb,
      'ACTIVE',
      true,
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000'
    ),
    -- Password reset
    (
      NULL,
      'password_reset',
      'Password Reset',
      'Sent when a user requests a password reset',
      'Reset your password for {{organizationName}}',
      'Hi {{firstName}},\n\nYou recently requested to reset your password for {{organizationName}}.\n\nClick the link below to reset it:\n{{resetUrl}}\n\nThis link will expire in {{expirationHours}} hours.\n\nIf you didn''t request this, please ignore this email.\n\nBest regards,\nThe {{organizationName}} Team',
      '<h1>Reset Your Password</h1><p>Hi {{firstName}},</p><p>Click the button below to reset your password:</p><p><a href="{{resetUrl}}" style="background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p><p>This link will expire in {{expirationHours}} hours.</p>',
      '["organizationName", "firstName", "lastName", "email", "resetUrl", "expirationHours"]'::jsonb,
      'ACTIVE',
      true,
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000'
    ),
    -- Visit reminder
    (
      NULL,
      'visit_reminder',
      'Visit Reminder',
      'Sent to remind caregivers about upcoming visits',
      'Upcoming Visit Reminder: {{clientName}}',
      'Hi {{caregiverName}},\n\nThis is a reminder about your upcoming visit:\n\nClient: {{clientName}}\nDate: {{visitDate}}\nTime: {{visitTime}}\nAddress: {{visitAddress}}\n\nPlease arrive on time and remember to clock in using the mobile app.\n\nBest regards,\n{{organizationName}}',
      '<h1>Upcoming Visit Reminder</h1><p>Hi {{caregiverName}},</p><p><strong>Client:</strong> {{clientName}}<br><strong>Date:</strong> {{visitDate}}<br><strong>Time:</strong> {{visitTime}}<br><strong>Address:</strong> {{visitAddress}}</p><p>Please arrive on time and clock in using the mobile app.</p>',
      '["organizationName", "caregiverName", "clientName", "visitDate", "visitTime", "visitAddress"]'::jsonb,
      'ACTIVE',
      true,
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000'
    ),
    -- Invite token
    (
      NULL,
      'team_invitation',
      'Team Member Invitation',
      'Sent when inviting new team members',
      'You''ve been invited to join {{organizationName}}',
      'Hi {{firstName}},\n\nYou''ve been invited to join {{organizationName}} as a team member.\n\nClick the link below to accept the invitation and set up your account:\n{{inviteUrl}}\n\nThis invitation will expire in {{expirationDays}} days.\n\nWe look forward to working with you!\n\nBest regards,\n{{inviterName}}\n{{organizationName}}',
      '<h1>Join {{organizationName}}</h1><p>Hi {{firstName}},</p><p>You''ve been invited to join our team!</p><p><a href="{{inviteUrl}}" style="background-color: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p><p>This invitation expires in {{expirationDays}} days.</p>',
      '["organizationName", "firstName", "lastName", "email", "inviteUrl", "inviterName", "expirationDays", "roles"]'::jsonb,
      'ACTIVE',
      true,
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000'
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP FUNCTION IF EXISTS increment_email_sent_count() CASCADE');
  await knex.raw('DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates');
  await knex.schema.dropTableIfExists('email_templates');
}
