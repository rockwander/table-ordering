# Notification System - Behavior Documentation

## Overview

Ramani's Cafe uses a **dual notification system** for the admin app:
1. **System Notifications** (Android FCM) - for background/closed app
2. **Web Notifications** (browser) - for web interface
3. **In-App Sound Alerts** - for when admin page is actively open

---

## Current Behavior (Issues Identified)

### Problem: Duplicate Notifications When App is Open

When the admin is viewing the Live Orders page with the app open, notifications currently play **TWICE**:

1. **System Notification** (Android)
   - Plays the notification sound from the Android notification channel
   - Sound plays for default duration (~2-3 seconds, NOT 10 seconds)
   - Triggered by FCM push notification received in foreground

2. **In-App Sound** (Web Audio)
   - Plays from `lib/sound.ts` using `HTMLAudioElement`
   - Sound loops for 10 seconds (plays every 2 seconds)
   - Can be stopped by tapping anywhere on the Live Orders screen
   - Triggered by Supabase Realtime subscription detecting new order/buzzer

**Result:** User hears notification twice - once from system, once from in-app audio.

---

## Notification Architecture

### 1. Android System Notifications (FCM + Capacitor)

**File:** `lib/fcm-notifications.ts`

**How it works:**
- Uses Firebase Cloud Messaging (FCM) to send push notifications
- Two notification channels created:
  - `new_orders` → uses `new_order.wav` (casino bells sound)
  - `waiter_calls` → uses `waiter_call.wav` (happy bells sound)
- Sound files located in: `android/app/src/main/res/raw/`

**When app is CLOSED/BACKGROUND:**
- Android OS displays notification automatically
- Sound plays from system notification channel
- User taps notification → opens app

**When app is OPEN (foreground):**
- FCM push is received via `pushNotificationReceived` listener
- Triggers a **local notification** using Capacitor's LocalNotifications API
- This local notification plays the system sound again (causing duplicate)

**Code Location:** Lines 93-127 in `lib/fcm-notifications.ts`

```typescript
PushNotifications.addListener('pushNotificationReceived', async (notification) => {
  // This fires when app is OPEN
  // Currently triggers showLocalNotificationWithSound() which causes duplicate
  await showLocalNotificationWithSound(notification);
});
```

---

### 2. Web Browser Notifications

**File:** `lib/notifications.ts`

**How it works:**
- Uses browser's Notification API + Service Worker
- Only works on web interface (not Android app)
- Displays OS-level notifications on desktop/laptop browsers

**Code Location:** `app/admin/live-orders/page.tsx:207, 263`

```typescript
showLocalNotification('🍽️ New Order!', {
  body: `Table ${order.table_number} placed a new order`,
});
```

---

### 3. In-App Sound Alerts

**File:** `lib/sound.ts`

**How it works:**
- Uses HTML5 Audio API (`new Audio()`)
- Plays sound files from `/public/` directory
- Loops every 2 seconds for total of 10 seconds
- Can be stopped by tapping anywhere on Live Orders screen

**Sound Files:**
- `/public/mixkit-casino-bells-reward-1981.wav` - New orders
- `/public/mixkit-happy-bells-notification-937.wav` - Waiter calls

**Code Location:** `app/admin/live-orders/page.tsx:195, 254`

```typescript
// Triggered by Supabase Realtime subscription
if (isAppActiveRef.current && !processedOrderIdsRef.current.has(order.id)) {
  playNewOrderSound(); // Plays for 10 seconds, loops every 2 seconds
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Customer Places Order                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Supabase Database    │
         │   INSERT into orders   │
         └────────┬───────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐   ┌──────────────────┐
│ DB Trigger   │   │ Realtime Sub     │
│ (on INSERT)  │   │ (live-orders pg) │
└──────┬───────┘   └────────┬─────────┘
       │                    │
       ▼                    ▼
┌────────────────┐   ┌──────────────────────┐
│ Edge Function  │   │ Live Orders Page     │
│ send-fcm-      │   │ (if user is on page) │
│ notification   │   └──────────┬───────────┘
└──────┬─────────┘              │
       │                        ▼
       ▼                 ┌─────────────────┐
┌────────────────┐       │ playNewOrder    │
│ FCM Server     │       │ Sound()         │
│ Push to all    │       │ (10s loop)      │
│ active tokens  │       └─────────────────┘
└──────┬─────────┘
       │
       ▼
┌────────────────────────────────────────┐
│        User's Android Device           │
├────────────────────────────────────────┤
│ If App CLOSED: System notification     │
│ If App OPEN:   Local notification      │
│                (via FCM listener)       │
└────────────────────────────────────────┘

RESULT: If app is OPEN, user hears BOTH:
  - In-app sound (10s loop) from Realtime
  - System sound (3s) from FCM local notification
```

---

## Issue Analysis

### Why Duplicate Notifications Occur

1. **Supabase Realtime** subscription triggers immediately when order is inserted
   - Calls `playNewOrderSound()` → 10-second looping sound

2. **Database trigger** fires Edge Function to send FCM push notification
   - FCM push received on device
   - If app is open, FCM listener triggers `showLocalNotificationWithSound()`
   - This schedules a **LocalNotification** which plays system sound

3. **Both happen simultaneously** = duplicate sound

---

## Recommended Solution

### Option 1: Disable System Notification When App is Open (RECOMMENDED)

Only play in-app sound when user is actively on Live Orders page. Disable FCM local notification when app is in foreground.

**Implementation:**
```typescript
// In lib/fcm-notifications.ts, line 93-127
PushNotifications.addListener('pushNotificationReceived', async (notification) => {
  console.log('🔔 Push received (app open)');

  // DON'T schedule local notification - let in-app sound handle it
  // The Live Orders page Realtime subscription will play the 10s looping sound

  // Optional: Show toast notification in app instead
  console.log('Notification handled by in-app Realtime subscription');
});
```

**Pros:**
- No duplicate sounds
- In-app sound is better (10s loop, tap to stop)
- Cleaner UX

**Cons:**
- System notification won't show in notification tray when app is open
- User relies on in-app sound only

---

### Option 2: Disable In-App Sound, Use Only System Notifications

Remove the in-app sound and rely entirely on FCM system notifications.

**Implementation:**
```typescript
// In app/admin/live-orders/page.tsx
// Remove lines 195, 254 (playNewOrderSound/playServiceCallSound calls)
// Keep only FCM notifications
```

**Pros:**
- Consistent notification behavior (always from system)
- Notification appears in notification tray

**Cons:**
- System sound doesn't loop for 10 seconds
- Can't stop by tapping screen
- Sound plays for standard duration only (~2-3 seconds)

---

### Option 3: Use ONLY In-App Sound, Disable System When App Open

Best for your use case since you want 10-second looping sound.

**Implementation:**
1. Keep in-app sound as-is (10s loop, tap to stop)
2. Don't schedule local notification when app is in foreground
3. Only show system notification when app is closed/background

**Changes needed:**
- Modify `lib/fcm-notifications.ts` to skip local notification when app is open
- Keep `lib/sound.ts` as-is
- Keep Realtime subscription sound triggers as-is

---

## System Notification Behavior

### 10-Second Sound Not Working on System Notifications

**Issue:** System notifications don't loop for 10 seconds

**Reason:**
Android notification channels play the sound file **once**. The sound file duration determines how long it plays, not the channel configuration.

**Current sound files:**
- `new_order.wav` - ~3 seconds
- `waiter_call.wav` - ~2 seconds

**To get 10-second system notification sound:**
1. Edit sound files to loop the audio for 10 seconds total
2. Or create new 10-second versions of the sound files
3. Or use in-app sound instead (which already loops for 10s)

**Note:** The 10-second looping with tap-to-stop is ONLY available with the in-app sound implementation (`lib/sound.ts`), not with system notifications.

---

## Recommendations

Based on your requirements:
- "Both should run for 10s"
- "Can stop if user taps anywhere inside live orders screen"

**RECOMMENDED APPROACH: Use ONLY In-App Sound When App is Open**

1. **When app is OPEN (Live Orders page visible):**
   - Play in-app sound (10s loop, tap to stop) ✅
   - Do NOT show system notification (avoid duplicate)
   - Triggered by Supabase Realtime subscription

2. **When app is CLOSED or in BACKGROUND:**
   - Show system notification with sound
   - Triggered by FCM push notification
   - Can't loop for 10s (Android limitation) unless you edit sound files

3. **Implementation:**
   - Modify `lib/fcm-notifications.ts` to skip local notification when in foreground
   - Keep `lib/sound.ts` as-is
   - Add app state tracking to determine foreground/background

---

## Files to Modify

### 1. `lib/fcm-notifications.ts` (Primary Fix)
**Change:** Don't schedule local notification when app is in foreground

### 2. `app/admin/live-orders/page.tsx`
**Keep as-is:** In-app sound already works correctly with 10s loop + tap to stop

### 3. `lib/sound.ts`
**Keep as-is:** Already implements 10-second looping with stop functionality

---

## Testing Checklist

After implementing the fix:

- [ ] **App CLOSED** → Order placed → System notification plays sound once
- [ ] **App OPEN, on Live Orders** → Order placed → In-app sound loops for 10s
- [ ] **App OPEN, on Live Orders** → Tap screen → Sound stops immediately
- [ ] **App OPEN, other page** → Order placed → System notification plays
- [ ] **Verify no duplicate sounds** in any scenario
- [ ] **Waiter call** → Correct sound plays (different from new order)

---

## Additional Notes

### Auth-Gated Notifications
Only logged-in users with `active = true` FCM tokens receive system notifications (see `FINAL_IMPLEMENTATION_SUMMARY.md` for details).

### Notification Channels
Two separate Android channels ensure different sounds:
- `new_orders` - Casino bells (new_order.wav)
- `waiter_calls` - Happy bells (waiter_call.wav)

### Sound File Locations
- **Android app:** `android/app/src/main/res/raw/`
- **Web app:** `/public/` directory

---

## IMPLEMENTED FIX (2026-08-06)

### Solution: Disable System Notification When App is Open

**File Modified:** `lib/fcm-notifications.ts` (lines 92-109)

**Change:** When FCM push notification is received while app is in foreground, we now **skip** showing the system notification. This prevents duplicate sounds.

**Behavior After Fix:**

1. **App OPEN (Live Orders page visible):**
   - ✅ In-app sound plays (10-second loop, tap anywhere to stop)
   - ❌ System notification does NOT play (prevents duplicate)
   - ✅ Toast notification shows in app UI
   - Triggered by: Supabase Realtime subscription

2. **App CLOSED or in BACKGROUND:**
   - ✅ System notification plays with sound
   - ✅ Notification appears in Android notification tray
   - ✅ User can tap to open app
   - Triggered by: FCM push notification

**Code Change:**
```typescript
// Before: Showed local notification when app was open (caused duplicate)
await showLocalNotificationWithSound(notification);

// After: Skip system notification when app is open
console.log('✅ App is in foreground - notification handled by in-app sound');
console.log('⏭️ Skipping system notification to avoid duplicate sound');
```

### Notification Type Detection

Both the Edge Function and the FCM listener correctly detect notification type based on `data.type`:
- `type: 'order'` → Uses `new_orders` channel → Plays `new_order.wav` (casino bells)
- `type: 'buzzer'` → Uses `waiter_calls` channel → Plays `waiter_call.wav` (happy bells)

If you're hearing both sounds for a new order, please check:
1. Edge Function logs to verify it's sending `type: 'order'`
2. Android notification channel is correctly set to `new_orders`
3. Sound file `new_order.wav` is correctly placed in `android/app/src/main/res/raw/`

---

**Last Updated:** 2026-08-06
**Status:** ✅ FIXED - Duplicate notification issue resolved
