-- Migration: Add preferences column to users table
-- Description: Add JSONB column to store user preferences (theme, language, timezone, etc.)
-- Created: 2025-11-06

-- Add preferences column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT NULL;

    COMMENT ON COLUMN users.preferences IS 'User UI preferences (theme, language, timezone, date/time formats, notifications)';

    RAISE NOTICE 'Added preferences column to users table';
  ELSE
    RAISE NOTICE 'Preferences column already exists in users table';
  END IF;
END $$;
