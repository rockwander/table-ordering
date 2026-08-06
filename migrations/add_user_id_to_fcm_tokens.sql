-- Migration: Add user authentication to FCM tokens
-- This allows us to only send notifications to logged-in users
-- and stop notifications when users log out

-- Add user_id column (nullable for backward compatibility)
ALTER TABLE fcm_tokens
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add active flag (default true for existing tokens)
ALTER TABLE fcm_tokens
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add created_at if it doesn't exist
ALTER TABLE fcm_tokens
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add last_used_at to track token freshness
ALTER TABLE fcm_tokens
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);

-- Create index on active tokens
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(active) WHERE active = true;

-- Update existing tokens to be active
UPDATE fcm_tokens SET active = true WHERE active IS NULL;

-- Add comment
COMMENT ON COLUMN fcm_tokens.user_id IS 'User who owns this FCM token. NULL for legacy/anonymous tokens.';
COMMENT ON COLUMN fcm_tokens.active IS 'Whether this token should receive notifications. Set to false on logout.';
COMMENT ON COLUMN fcm_tokens.last_used_at IS 'Last time this token was used to send a notification or updated on login.';
