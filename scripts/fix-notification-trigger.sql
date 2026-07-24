-- Fix the buzzer notification trigger to use correct field name
CREATE OR REPLACE FUNCTION notify_buzzer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for active buzzer notifications
  IF NEW.status = 'active' THEN
    -- Call Supabase Edge Function to send FCM notification
    PERFORM
      net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-fcm-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
        ),
        body := jsonb_build_object(
          'title', 'Waiter Called - Table ' || NEW.table_number,
          'body', 'Customer needs assistance',
          'data', jsonb_build_object(
            'type', 'buzzer',
            'tableNumber', NEW.table_number
          )
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
