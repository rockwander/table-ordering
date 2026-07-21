-- Complete Buzzer Setup Script
-- Run this in Supabase SQL Editor to ensure buzzer functionality works

-- 1. Create buzzer_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS buzzer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed')),
  notification_type TEXT DEFAULT 'service_call' CHECK (notification_type IN ('service_call', 'new_order')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ
);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_buzzer_notifications_status ON buzzer_notifications(status);
CREATE INDEX IF NOT EXISTS idx_buzzer_notifications_created_at ON buzzer_notifications(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE buzzer_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (allow all operations for now - adjust based on your auth setup)
DROP POLICY IF EXISTS "Enable read access for all users" ON buzzer_notifications;
CREATE POLICY "Enable read access for all users"
  ON buzzer_notifications FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON buzzer_notifications;
CREATE POLICY "Enable insert access for all users"
  ON buzzer_notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON buzzer_notifications;
CREATE POLICY "Enable update access for all users"
  ON buzzer_notifications FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Enable delete access for all users" ON buzzer_notifications;
CREATE POLICY "Enable delete access for all users"
  ON buzzer_notifications FOR DELETE
  USING (true);

-- 5. Enable Realtime for this table
-- Go to Supabase Dashboard > Database > Replication
-- And toggle ON the buzzer_notifications table
-- OR run this if you have the extension enabled:
-- ALTER PUBLICATION supabase_realtime ADD TABLE buzzer_notifications;

-- 6. Test: Insert a test notification
INSERT INTO buzzer_notifications (table_number, status, notification_type)
VALUES (99, 'active', 'service_call');

-- 7. Verify the test notification was created
SELECT * FROM buzzer_notifications WHERE table_number = 99;

-- You should see a test notification. If yes, the setup is complete!
-- Now delete the test notification:
DELETE FROM buzzer_notifications WHERE table_number = 99;
