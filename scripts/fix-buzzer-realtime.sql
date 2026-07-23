-- Fix script to enable Realtime for buzzer_notifications
-- Run this in Supabase SQL Editor if the diagnostic shows realtime is disabled

-- Option 1: Enable realtime using ALTER PUBLICATION (preferred method)
-- This works if you have the necessary permissions
BEGIN;

-- Add the buzzer_notifications table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE buzzer_notifications;

COMMIT;

-- Option 2: If Option 1 fails, you need to enable it via the Supabase Dashboard
-- Go to: Database > Replication > supabase_realtime publication
-- Find "buzzer_notifications" in the list and toggle it ON

-- Verify realtime is now enabled
SELECT
    t.tablename,
    CASE
        WHEN p.pubname IS NOT NULL THEN '✅ REALTIME IS NOW ENABLED!'
        ELSE '❌ REALTIME STILL DISABLED - Use Dashboard method'
    END as realtime_status
FROM pg_tables t
LEFT JOIN pg_publication_tables p ON t.tablename = p.tablename
WHERE t.tablename = 'buzzer_notifications';
