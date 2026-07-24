-- Create function to send FCM notification for new orders
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
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-fcm-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
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
  IF NEW.is_active THEN
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

-- Create trigger for new order items
DROP TRIGGER IF EXISTS trigger_new_order_item ON order_items;
CREATE TRIGGER trigger_new_order_item
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Create trigger for buzzer notifications
DROP TRIGGER IF EXISTS trigger_buzzer_notification ON buzzer_notifications;
CREATE TRIGGER trigger_buzzer_notification
  AFTER INSERT ON buzzer_notifications
  FOR EACH ROW
  EXECUTE FUNCTION notify_buzzer();
