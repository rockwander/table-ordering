-- Diagnostic script to identify buzzer notification issues
-- Run this in Supabase SQL Editor

-- 1. Check if buzzer_notifications table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'buzzer_notifications'
    ) THEN
        RAISE NOTICE '✅ Table exists: buzzer_notifications';
    ELSE
        RAISE NOTICE '❌ Table does NOT exist: buzzer_notifications';
        RAISE NOTICE 'Run scripts/complete-buzzer-setup.sql to create it';
    END IF;
END $$;

-- 2. Check table structure
SELECT
    'Column Check' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'buzzer_notifications'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT
    'RLS Check' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'buzzer_notifications';

-- 4. Check RLS policies
SELECT
    'Policy Check' as check_type,
    policyname as policy_name,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'buzzer_notifications';

-- 5. Check realtime publication status
SELECT
    'Realtime Check' as check_type,
    t.schemaname,
    t.tablename,
    CASE
        WHEN p.pubname IS NOT NULL THEN '✅ REALTIME ENABLED'
        ELSE '❌ REALTIME NOT ENABLED - THIS IS LIKELY THE ISSUE!'
    END as realtime_status,
    p.pubname as publication_name
FROM pg_tables t
LEFT JOIN pg_publication_tables p ON t.tablename = p.tablename
WHERE t.tablename = 'buzzer_notifications';

-- 6. Check recent buzzer notifications (last 10)
SELECT
    'Data Check' as check_type,
    id,
    table_number,
    status,
    notification_type,
    created_at,
    dismissed_at
FROM buzzer_notifications
ORDER BY created_at DESC
LIMIT 10;

-- 7. Count active vs dismissed notifications
SELECT
    'Status Count' as check_type,
    status,
    COUNT(*) as count
FROM buzzer_notifications
GROUP BY status;
