-- Run this in Supabase SQL Editor to check buzzer setup

-- Check if buzzer_notifications table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'buzzer_notifications'
) as table_exists;

-- Check table structure (if table exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'buzzer_notifications'
ORDER BY ordinal_position;

-- Check if realtime is enabled for the table
SELECT schemaname, tablename,
       CASE WHEN publication_id IS NOT NULL THEN 'enabled' ELSE 'disabled' END as realtime_status
FROM pg_tables
LEFT JOIN pg_publication_tables ON pg_tables.tablename = pg_publication_tables.tablename
WHERE pg_tables.tablename = 'buzzer_notifications';

-- Check recent buzzer notifications
SELECT * FROM buzzer_notifications
ORDER BY created_at DESC
LIMIT 5;
