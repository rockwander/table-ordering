-- Add notification type to buzzer_notifications table
ALTER TABLE buzzer_notifications
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'service_call';

-- Add check constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'buzzer_notifications_notification_type_check'
    ) THEN
        ALTER TABLE buzzer_notifications
        ADD CONSTRAINT buzzer_notifications_notification_type_check
        CHECK (notification_type IN ('service_call', 'new_order', 'settle_bill'));
    END IF;
END $$;

-- Update existing records to have service_call type
UPDATE buzzer_notifications
SET notification_type = 'service_call'
WHERE notification_type IS NULL;
