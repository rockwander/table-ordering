-- Fix the notification triggers to use hardcoded URLs instead of config parameters
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  order_count INTEGER;
  table_num TEXT;
BEGIN
  -- Get table number from the order
  SELECT table_number INTO table_num FROM orders WHERE id = NEW.order_id;

  -- Count items in this order
  SELECT COUNT(*) INTO order_count
  FROM order_items
  WHERE order_id = NEW.order_id;

  -- Call Supabase Edge Function to send FCM notification
  PERFORM
    net.http_post(
      url := 'https://xjozstiklaqtgdmamfue.supabase.co/functions/v1/send-fcm-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb3pzdGlrbGFxdGdkbWFtZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTc2OTYsImV4cCI6MjA5OTE5MzY5Nn0.Rh3RC4uVl9qlod04iG8jQYnqUHbP1nJ7_jQ1duOkDIE'
      ),
      body := jsonb_build_object(
        'title', 'New Order - Table ' || table_num,
        'body', order_count || ' item(s) ordered',
        'data', jsonb_build_object(
          'type', 'order',
          'orderId', NEW.order_id::text,
          'tableNumber', table_num
        )
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send FCM notification for buzzer
CREATE OR REPLACE FUNCTION notify_buzzer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for active buzzer notifications
  IF NEW.status = 'active' THEN
    -- Call Supabase Edge Function to send FCM notification
    PERFORM
      net.http_post(
        url := 'https://xjozstiklaqtgdmamfue.supabase.co/functions/v1/send-fcm-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb3pzdGlrbGFxdGdkbWFtZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTc2OTYsImV4cCI6MjA5OTE5MzY5Nn0.Rh3RC4uVl9qlod04iG8jQYnqUHbP1nJ7_jQ1duOkDIE'
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
