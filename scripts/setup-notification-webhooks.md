# Setting up Notification Webhooks

Since database triggers with HTTP calls require additional setup, we'll use Supabase Database Webhooks instead.

## Steps to configure in Supabase Dashboard:

### 1. Go to Database Webhooks
Navigate to: https://supabase.com/dashboard/project/xjozstiklaqtgdmamfue/database/hooks

### 2. Create Webhook for New Orders
Click "Create a new hook"

**Configuration:**
- **Name**: `notify-new-order`
- **Table**: `order_items`
- **Events**: Check "Insert"
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://xjozstiklaqtgdmamfue.supabase.co/functions/v1/send-fcm-notification`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <YOUR_SUPABASE_ANON_KEY>
  ```
- **HTTP Params**: Leave empty
- **Body**: Custom
  ```json
  {
    "title": "New Order - Table {{ record.table_number }}",
    "body": "New items added to order",
    "data": {
      "type": "order",
      "orderId": "{{ record.order_id }}",
      "tableNumber": "{{ record.table_number }}"
    }
  }
  ```

### 3. Create Webhook for Buzzer Notifications
Click "Create a new hook"

**Configuration:**
- **Name**: `notify-buzzer`
- **Table**: `buzzer_notifications`
- **Events**: Check "Insert"
- **Type**: HTTP Request
- **Method**: POST
- **URL**: `https://xjozstiklaqtgdmamfue.supabase.co/functions/v1/send-fcm-notification`
- **HTTP Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer <YOUR_SUPABASE_ANON_KEY>
  ```
- **HTTP Params**: Leave empty
- **Body**: Custom
  ```json
  {
    "title": "Waiter Called - Table {{ record.table_number }}",
    "body": "Customer needs assistance",
    "data": {
      "type": "buzzer",
      "tableNumber": "{{ record.table_number }}"
    }
  }
  ```

## Alternative: Use Database Triggers (Advanced)

If you prefer database triggers, you need to:
1. Enable the `pg_net` extension
2. Configure app settings for Supabase URL and anon key
3. Run the SQL in `create-notification-triggers.sql`
