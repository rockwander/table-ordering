# Firebase Cloud Messaging Setup - COMPLETE! ✅

## What's Been Set Up

### ✅ 1. Android App Configuration
- Firebase credentials added to Android project
- FCM dependencies configured in build.gradle
- Notification channels created with high priority
- Push notification handlers implemented

### ✅ 2. Database Setup
- `fcm_tokens` table created in Supabase
- Database triggers configured to auto-send notifications on:
  - New orders (when items added to `order_items` table)
  - Waiter calls (when rows added to `buzzer_notifications` table)

### ✅ 3. Backend Services
- Supabase Edge Function deployed: `send-fcm-notification`
- Firebase Admin credentials stored as Supabase secret
- API endpoint created to save FCM tokens: `/api/save-fcm-token`

### ✅ 4. Mobile App Integration
- FCM initialization added to admin dashboard
- Automatic token registration on app startup
- Notification handling for foreground and background

## How to Test

### 1. Download the Latest APK
Go to: https://github.com/rockwander/table-ordering/actions
- Click on the latest "Build Android APK" workflow run
- Download the `ramani-cafe-admin` artifact
- Extract and install the APK on your Android device

### 2. Open the App
- The app will request notification permissions → **Allow**
- The app will automatically:
  - Register for FCM push notifications
  - Save the FCM token to Supabase
  - Show in console: "✅ FCM push notifications initialized"

### 3. Test Notifications (App Closed)
**Important**: Close the app completely (swipe it away from recent apps)

#### Test New Order Notification:
1. On your computer, go to the menu page: https://table-ordering-teal.vercel.app/menu
2. Select a table and add items to cart
3. Place an order
4. **Your phone should receive a notification** with sound, even though the app is closed!
5. Tap the notification → App opens to dashboard

#### Test Buzzer Notification:
1. On the menu page, press the "Call Waiter" button
2. **Your phone should receive a notification** immediately
3. Sound plays even with screen locked

## How It Works

```
Customer places order
    ↓
Order saved to Supabase
    ↓
Database trigger fires
    ↓
Calls Edge Function (send-fcm-notification)
    ↓
Edge Function gets FCM tokens from database
    ↓
Sends push notification via Firebase
    ↓
Android receives notification (even if app closed)
    ↓
Plays notification.wav sound
    ↓
Admin gets alerted!
```

## Notification Behavior

- **App Closed/Killed**: ✅ Push notification with sound
- **Screen Locked**: ✅ Push notification with sound
- **App in Background**: ✅ Push notification with sound
- **App in Foreground**: ✅ Local notification with sound

## Troubleshooting

### Not receiving notifications?

1. **Check FCM token is saved**:
   - Open app and check browser console/logcat
   - Should see: "FCM token saved: ..."
   - Verify token exists in Supabase `fcm_tokens` table

2. **Check Edge Function logs**:
   - Go to: https://supabase.com/dashboard/project/xjozstiklaqtgdmamfue/functions
   - Check `send-fcm-notification` logs for errors

3. **Check notification permissions**:
   - Android Settings → Apps → Ramani's Cafe Admin → Notifications
   - Ensure "All Ramani's Cafe Admin notifications" is ON
   - Ensure "Order Notifications" channel is enabled

4. **Test Edge Function manually**:
   ```bash
   curl -X POST \
     https://xjozstiklaqtgdmamfue.supabase.co/functions/v1/send-fcm-notification \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb3pzdGlrbGFxdGdkbWFtZnVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTc2OTYsImV4cCI6MjA5OTE5MzY5Nn0.Rh3RC4uVl9qlod04iG8jQYnqUHbP1nJ7_jQ1duOkDIE" \
     -d '{
       "title": "Test Notification",
       "body": "Testing FCM from terminal",
       "data": {
         "type": "order",
         "tableNumber": "1"
       }
     }'
   ```

### Still having issues?

Check the following files for configuration:
- `lib/fcm-notifications.ts` - FCM initialization
- `app/admin/dashboard/page.tsx:115-122` - Where FCM is called
- `android/app/google-services.json` - Firebase config
- `supabase/functions/send-fcm-notification/index.ts` - Edge function code

## Files Modified

- `android/app/build.gradle` - Added FCM dependencies
- `android/app/google-services.json` - Firebase configuration
- `app/admin/dashboard/page.tsx` - Initialize FCM on app start
- `lib/fcm-notifications.ts` - FCM notification handlers
- `app/api/save-fcm-token/route.ts` - Save FCM tokens
- `supabase/functions/send-fcm-notification/index.ts` - Send notifications
- Database triggers in Supabase

## Next Steps

1. **Download and install the APK** from GitHub Actions
2. **Test notifications** by placing orders while app is closed
3. **Monitor Edge Function logs** to see notifications being sent
4. **Enjoy real-time alerts** even when the app is closed! 🎉

---

Your restaurant admin will now receive instant notifications for every order and waiter call, even with the app closed or screen locked!
