-- Migration: Notification Preferences and Delivery Logs
-- Description: Create tables for notification preferences and delivery tracking

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Channel preferences
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,

  -- Contact information
  email VARCHAR(255),
  phone_number VARCHAR(20),
  push_tokens JSONB DEFAULT '[]', -- Array of device tokens

  -- Notification type preferences for visits
  visit_updates_email BOOLEAN DEFAULT true,
  visit_updates_sms BOOLEAN DEFAULT false,
  visit_updates_push BOOLEAN DEFAULT true,

  -- Notification type preferences for messages
  messages_email BOOLEAN DEFAULT true,
  messages_sms BOOLEAN DEFAULT false,
  messages_push BOOLEAN DEFAULT true,

  -- Notification type preferences for care plans
  care_plan_updates_email BOOLEAN DEFAULT true,
  care_plan_updates_sms BOOLEAN DEFAULT false,
  care_plan_updates_push BOOLEAN DEFAULT false,

  -- Notification type preferences for emergencies
  emergency_alerts_email BOOLEAN DEFAULT true,
  emergency_alerts_sms BOOLEAN DEFAULT true,
  emergency_alerts_push BOOLEAN DEFAULT true,

  -- Digest preferences
  digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly', 'never'
  digest_time TIME DEFAULT '18:00:00', -- When to send daily digests
  digest_day_of_week INTEGER DEFAULT 1, -- Monday for weekly digests (0=Sunday, 6=Saturday)

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one preference record per user
  UNIQUE(user_id)
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);

-- Notification delivery log for tracking and analytics
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'

  -- Delivery details
  delivered_at TIMESTAMP,
  success BOOLEAN,
  error_message TEXT,
  provider_message_id VARCHAR(255),

  -- Content snapshot for debugging
  subject VARCHAR(255),
  preview TEXT,

  -- Engagement tracking (for future use with webhooks)
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX idx_notification_deliveries_type ON notification_deliveries(notification_type);
CREATE INDEX idx_notification_deliveries_created ON notification_deliveries(created_at DESC);
CREATE INDEX idx_notification_deliveries_channel ON notification_deliveries(channel);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Insert default preferences for existing users
INSERT INTO notification_preferences (user_id, email)
SELECT id, email FROM users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
