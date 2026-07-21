-- Add notification type to buzzer_notifications table
ALTER TABLE buzzer_notifications
ADD COLUMN notification_type TEXT DEFAULT 'service_call'
CHECK (notification_type IN ('service_call', 'new_order'));

-- Update existing records to have service_call type
UPDATE buzzer_notifications SET notification_type = 'service_call' WHERE notification_type IS NULL;
