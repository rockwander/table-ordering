# Bill ID Counter Migration Instructions

## Problem Fixed

Previously, bill IDs were being assigned based on array index in memory, which meant:
- Bill IDs would reset to #001 on every page refresh
- Bill IDs were not persistent across sessions
- Different tabs could show different bill IDs for the same bills

## Solution Implemented

The app now uses a **persistent database sequence** that:
- Auto-increments bill IDs from 1 to 999 and cycles
- Persists across page refreshes and app restarts
- Works consistently across all admin tabs (Dashboard, Live Orders)
- Works on both web app and Android app

## Required Database Migration

⚠️ **IMPORTANT**: You MUST run the following migration to enable the sequential bill ID counter.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of the file `/migrations/add_sequential_bill_id.sql`
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI set up locally:

```bash
cd /Users/raghav/table-ordering
npx supabase db query --file migrations/add_sequential_bill_id.sql --linked
```

Note: You need to be connected to your remote Supabase project for this to work.

### What the Migration Does

The migration:
1. Adds a `display_bill_id` column to the `bills` table
2. Creates a PostgreSQL sequence `bill_id_seq` that cycles from 1-999
3. Creates a function `generate_bill_id()` to get the next bill ID
4. Sets the default value for `display_bill_id` to use this sequence
5. Backfills existing bills with sequential IDs if any exist

### Verification

After running the migration, you can verify it worked:

1. In Supabase SQL Editor, run:
```sql
SELECT * FROM bills ORDER BY settled_at DESC LIMIT 5;
```

2. You should see a `display_bill_id` column with sequential numbers

3. Test by settling a bill in the admin app - you should see a proper bill ID like #001, #002, etc.

## How It Works Now

### For Unsettled (Draft) Bills
- Shows "Draft" label instead of a bill number
- These are temporary groupings of orders by table
- No bill record exists in the database yet

### When Settling a Bill
1. A new record is created in the `bills` table
2. The `display_bill_id` is automatically assigned by the sequence (e.g., 1, 2, 3, ..., 999, 1, 2, ...)
3. All orders in the bill are marked as `paid` and linked to the bill via `bill_id`
4. The bill now shows as `Bill #001`, `Bill #002`, etc.

### For Settled Bills
- Shows the persistent bill ID from the database (e.g., `Bill #042`)
- This ID never changes and is the same across all tabs and sessions
- Past bills retain their original bill IDs forever

## Code Changes Made

### Live Orders Page (`/app/admin/live-orders/page.tsx`)
- ✅ Now fetches actual bill records from the `bills` table
- ✅ Uses `display_bill_id` from the database for settled bills
- ✅ Shows "Draft" for unsettled bills
- ✅ Creates bill record in database when settling (with auto-generated ID)

### Dashboard Page (`/app/admin/dashboard/page.tsx`)
- ✅ Already creates bill records when settling
- ✅ Updated bill grouping logic to use database bill IDs
- ✅ Consistent bill handling across the app

### Customer Settle Page (`/app/settle/page.tsx`) - CRITICAL FIX
- ✅ **REMOVED random bill ID generator** - This was generating `Bill #237`, then `Bill #891` on refresh!
- ✅ Now shows clean "Settle Bill - Table X" without confusing random IDs
- ✅ Bill IDs are only shown in admin after actual settlement

### Toast Notifications (Bonus Fix)
- ✅ Added missing toast notifications to Live Orders page
- ✅ Red toasts for service calls now show properly
- ✅ Orange toasts for new orders now show properly

## Testing Checklist

After running the migration, test the following:

### Admin Panel Tests
- [ ] Settle a bill in Live Orders - should show Bill #001 (or next number)
- [ ] Settle another bill - should show Bill #002 (or next incremented number)
- [ ] Refresh the page - bill numbers should stay the same
- [ ] Check Dashboard tab - same bill IDs should appear
- [ ] Open in Android app - same bill IDs should appear
- [ ] Check Past Bills tab - all bills show their persistent IDs
- [ ] After 999 bills, the counter should cycle back to #001

### Customer-Facing Tests
- [ ] Open settle page (e.g., `/settle?table=5`)
- [ ] Should NOT show any bill ID chip
- [ ] Refresh the page - should stay the same (no random IDs!)
- [ ] Should only show "Settle Bill - Table X"

## Troubleshooting

### If bill IDs still show as #001 every time:
- The migration wasn't run successfully
- Go to Supabase SQL Editor and run the migration manually
- Check for error messages

### If you see "Draft" for settled bills:
- The `display_bill_id` column might not have been populated
- The sequence might not be set as the default value
- Re-run the migration

### If you get permission errors:
- Make sure you're logged in as an admin/owner in Supabase
- Check that RLS policies allow the authenticated user to insert bills

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check the Supabase logs in the dashboard
3. Verify the migration ran without errors in SQL Editor
4. Try manually running: `SELECT nextval('bill_id_seq');` to test the sequence
