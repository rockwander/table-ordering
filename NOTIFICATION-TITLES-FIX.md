# Notification Titles Fix

## Issue
User reported that when screen is turned off, notifications always say "Waiter called" instead of showing the correct message based on notification type.

## Expected Behavior
- **Buzzer notifications** should show: "Waiter Called - Table X"
- **Order notifications** should show: "New Order - Table X"

## Investigation Summary

I verified the notification flow and found that the database triggers are correctly configured:

### Database Triggers (PostgreSQL Functions)

1. **notify_buzzer()** - Sends for waiter calls
   - Title: `'Waiter Called - Table ' || NEW.table_number`
   - Body: `'Customer needs assistance'`
   - Type: `'buzzer'`

2. **notify_new_order()** - Sends for new orders
   - Title: `'New Order - Table ' || table_num`
   - Body: `order_count || ' item(s) ordered'`
   - Type: `'order'`

### Changes Made

1. **Updated Edge Function** (`supabase/functions/send-fcm-notification/index.ts`)
   - Changed sound from `"default"` to `"alarm.ogg"` to match our custom sound
   - Added detailed logging to track what titles are being sent:
     ```typescript
     console.log("=== SENDING FCM NOTIFICATION ===");
     console.log("Title:", payload.title);
     console.log("Body:", payload.body);
     console.log("Type:", payload.data?.type);
     console.log("Table:", payload.data?.tableNumber);
     ```
   - **Deployed to Supabase** ✓

2. **Created Verification Scripts**
   - `scripts/verify-and-fix-notification-titles.sql` - SQL script to verify and update database triggers
   - `scripts/test-notification-titles.js` - Node script to test both notification types

## How to Verify

### Option 1: Run Test Script
```bash
node scripts/test-notification-titles.js
```

This will:
1. Create a buzzer notification for Table 99
2. Create an order for Table 88
3. Both should trigger push notifications with correct titles

### Option 2: Check Edge Function Logs
1. Go to Supabase Dashboard → Edge Functions → send-fcm-notification → Logs
2. Trigger a notification (call waiter or place order)
3. You should see logs like:
   ```
   === SENDING FCM NOTIFICATION ===
   Title: Waiter Called - Table 5
   Body: Customer needs assistance
   Type: buzzer
   Table: 5
   ```

### Option 3: Test Manually
1. From customer app, call waiter on any table
2. Lock your phone screen
3. Notification should say "Waiter Called - Table X"
4. Then place an order from customer app
5. Notification should say "New Order - Table X"

## If Still Showing Wrong Titles

If after these changes you still see "Waiter called" for all notifications, run this SQL script in Supabase SQL Editor:

```sql
-- Run: scripts/verify-and-fix-notification-titles.sql
```

This will recreate the database functions with the correct titles.

## Technical Details

### Notification Flow
1. **Screen OFF (background)**:
   - Database trigger → Edge Function → FCM → Android system notification
   - Uses `notification.title` and `notification.body` from FCM payload

2. **Screen ON (foreground)**:
   - Database trigger → Edge Function → FCM → `pushNotificationReceived` listener → LocalNotifications
   - Uses same title/body, plays alarm.ogg

### Why the title should be correct
- Database triggers are sending the correct title based on notification type
- Edge Function (just deployed) logs and passes through the exact title from database
- FCM payload includes full notification object with title and body
- No code is modifying or overriding the title

## Next Steps

1. Test notifications with screen locked
2. Check if titles are now correct
3. If still wrong, check Edge Function logs to see what title is being sent
4. Report back which titles you see in the logs vs. on the notification
