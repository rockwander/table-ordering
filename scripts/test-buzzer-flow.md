# Testing the Buzzer Notification Fix

## What Was Fixed

The admin dashboard now fetches existing active notifications when it loads, not just new ones created after the page opens.

## Test Steps

### Test 1: Existing Notifications (Main Fix)

1. **Create a notification first** (while admin dashboard is closed):
   ```bash
   # In terminal, run:
   cat <<'EOF' | supabase db query --linked
   INSERT INTO buzzer_notifications (table_number, status, notification_type)
   VALUES (5, 'active', 'service_call')
   RETURNING *;
   EOF
   ```

2. **Open the admin dashboard**:
   - Go to: http://localhost:3000/admin/dashboard
   - Open browser console (F12)
   - You should see:
     - `🔍 Fetching active buzzer notifications...`
     - `✅ Found 1 active buzzer notifications` (or more if you have multiple)
   - A red notification should appear in the top-right corner
   - You should hear a buzzing sound

3. **Dismiss the notification**:
   - The notification auto-dismisses after 10 seconds
   - OR it will cycle through if multiple exist

### Test 2: Real-time Notifications (Already Working)

1. **Keep admin dashboard open**
2. **In another tab**, open: http://localhost:3000/menu?table=1
3. **Click the red "Call Waiter" button**
4. **Check the admin dashboard**:
   - Console should show: `🔔 Buzzer notification received:`
   - A notification should appear immediately
   - You should hear the buzzing sound

### Test 3: End-to-End Flow

1. **Open admin dashboard** in one browser window
2. **Open menu page** in another: http://localhost:3000/menu?table=3
3. **Click "Call Waiter"** on the menu page
4. **Verify on admin dashboard**:
   - Notification appears within 1-2 seconds
   - Sound plays
   - Notification shows "Table 3"
   - After 10 seconds, notification disappears
5. **Check database** (optional):
   ```bash
   cat <<'EOF' | supabase db query --linked
   SELECT * FROM buzzer_notifications
   WHERE table_number = 3
   ORDER BY created_at DESC
   LIMIT 1;
   EOF
   ```
   - Status should be 'dismissed'
   - dismissed_at should be set

## Expected Console Logs

### Admin Dashboard (on page load):
```
🚀 Dashboard mounted, setting up subscriptions...
🔔 Setting up buzzer notifications channel...
🔍 Fetching active buzzer notifications...
📡 Buzzer channel status: CHANNEL_SUBSCRIBED
✅ Successfully subscribed to buzzer notifications
✅ Found X active buzzer notifications
```

### Menu Page (when clicking "Call Waiter"):
```
📞 Calling waiter for table: 1
✅ Buzzer notification sent: [{...}]
```

### Admin Dashboard (when receiving new notification):
```
🔔 Buzzer notification received: {eventType: 'INSERT', new: {...}}
✅ Adding buzzer notification for table: 1
🔔 BuzzerNotification mounted for Table 1 Type: service_call
🔔 Ring 1 of 5
🔊 Buzzer played successfully
```

## Troubleshooting

### No notifications appear on page load:
- Check browser console for errors
- Verify notifications exist: `SELECT * FROM buzzer_notifications WHERE status = 'active';`
- Check RLS policies allow SELECT

### Notifications appear but no sound:
- Click anywhere on the page first (browsers block autoplay)
- Check browser console for: "⚠️ Audio blocked"
- Increase volume

### Real-time not working:
- Verify channel subscription: Look for "✅ Successfully subscribed"
- If you see "❌ Channel error", check Realtime is enabled in Supabase Dashboard

## Clean Up Test Data

After testing, clean up test notifications:

```bash
cat <<'EOF' | supabase db query --linked
DELETE FROM buzzer_notifications
WHERE table_number IN (5, 99)
OR status = 'dismissed';
EOF
```

Or keep dismissed ones for history:
```bash
cat <<'EOF' | supabase db query --linked
DELETE FROM buzzer_notifications
WHERE table_number IN (5, 99);
EOF
```
