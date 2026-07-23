# Buzzer Notification Troubleshooting Guide

## Problem
Call Waiter button doesn't send notifications to admin dashboard.

## Common Causes (in order of likelihood)

### 1. Realtime Not Enabled (MOST COMMON) ⚠️

The `buzzer_notifications` table needs to be enabled for Supabase Realtime.

**How to check:**
1. Run `scripts/diagnose-buzzer-issue.sql` in Supabase SQL Editor
2. Look for the "Realtime Check" row
3. If it says "❌ REALTIME NOT ENABLED", follow the fix below

**How to fix:**

**Method A: Via SQL (Preferred)**
1. Go to Supabase Dashboard → SQL Editor
2. Run `scripts/fix-buzzer-realtime.sql`
3. Verify it says "✅ REALTIME IS NOW ENABLED!"

**Method B: Via Dashboard (If SQL fails)**
1. Go to Supabase Dashboard
2. Navigate to: **Database → Replication**
3. Find the **supabase_realtime** publication
4. Scroll to find `buzzer_notifications` table
5. **Toggle it ON** ✅
6. Refresh the page to confirm it's enabled

### 2. Table Doesn't Exist

If the `buzzer_notifications` table doesn't exist in your database:

1. Run `scripts/complete-buzzer-setup.sql` in Supabase SQL Editor
2. This will create the table with proper schema, indexes, RLS policies, and test data

### 3. RLS Policies Blocking Access

If you have Row Level Security (RLS) enabled but policies aren't configured:

1. The setup script creates permissive policies for testing
2. For production, you should restrict these based on user roles
3. Run the diagnostic script to see current policies

### 4. Browser/Network Issues

**Check browser console:**
1. Open admin dashboard
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for errors related to:
   - WebSocket connection
   - Supabase realtime
   - Channel subscription errors

**What to look for:**
- ✅ Good: "✅ Successfully subscribed to buzzer notifications"
- ❌ Bad: "❌ Channel error" or "CHANNEL_ERROR"

**Network check:**
1. Make sure your Supabase project URL is correct in `.env.local`
2. Check if websockets are allowed (some corporate networks block them)

### 5. Test the Flow

**Test inserting a notification manually:**

```sql
-- Run this in Supabase SQL Editor
INSERT INTO buzzer_notifications (table_number, status, notification_type)
VALUES (1, 'active', 'service_call');
```

With the admin dashboard open, you should see a notification pop up immediately.

If it works when inserted manually but not from the app:
- Check browser console on the menu page when clicking "Call Waiter"
- Look for errors in the Network tab
- Verify the insert is actually happening in the database

## Quick Verification Checklist

- [ ] Table `buzzer_notifications` exists
- [ ] RLS policies are configured
- [ ] **Realtime is enabled** for the table ← MOST IMPORTANT
- [ ] Admin dashboard shows: "✅ Successfully subscribed to buzzer notifications" in console
- [ ] No errors in browser console
- [ ] Test notification from SQL works

## Still Not Working?

1. Clear browser cache and reload
2. Check Supabase project status/logs
3. Verify your API keys are correct in `.env.local`
4. Try in incognito mode to rule out browser extensions
5. Check if audio is blocked (click on the page to enable autoplay)

## Debug Logs

The application has extensive logging. Open browser console and look for:

**On Menu Page (Customer):**
- 📞 Calling waiter for table: X
- ✅ Buzzer notification sent: [data]
- ❌ Error inserting buzzer notification: [error]

**On Admin Dashboard:**
- 🔔 Buzzer notification received: [payload]
- ✅ Adding buzzer notification for table: X
- 🔊 Buzzer played successfully
- ⚠️ Audio blocked (click page to enable)

These logs will help identify exactly where the issue is occurring.
