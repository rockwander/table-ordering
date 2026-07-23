# Auto-Refresh Setup for Admin Dashboard

## What Was Done

Enabled automatic refreshing of the Unsettled Orders section when new orders arrive in real-time.

## Changes Made

### 1. Database Configuration
**Enabled Realtime for orders tables:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
```

### 2. Code Improvements (app/admin/dashboard/page.tsx)

**Added:**
- `refreshing` state to track when data is being refreshed
- Debounced refresh mechanism (500ms delay) to prevent multiple rapid calls
- Visual "Refreshing..." indicator with pulsing animation
- Subscription to both `orders` and `order_items` tables in one channel
- Better logging for debugging

**Subscriptions:**
- **Orders table**: Listens to all changes (INSERT, UPDATE, DELETE)
- **Order_items table**: Listens to all changes (INSERT, UPDATE, DELETE)
- **Debounced refresh**: Prevents UI thrashing when multiple items are added quickly

## How It Works

1. **Customer places order** → Data inserted into `orders` and `order_items` tables
2. **Supabase Realtime** broadcasts the change via WebSocket
3. **Admin dashboard** receives the event
4. **Debounced refresh** waits 500ms for any additional changes
5. **Dashboard fetches** updated data
6. **UI updates** with new orders, showing "Refreshing..." badge
7. **Refresh completes** and badge disappears

## Visual Feedback

When new orders arrive, users will see:
- A blue "Refreshing..." chip next to the "Unsettled Orders" heading
- Pulsing animation on the chip
- Automatic disappearance when refresh completes

## Console Logs

When functioning correctly, you'll see:
```
🚀 Dashboard mounted, setting up subscriptions...
✅ Successfully subscribed to orders updates
✅ Successfully subscribed to buzzer notifications
📦 Order change detected: INSERT {new order data}
📝 Order item change detected: INSERT
🔄 Auto-refreshing dashboard data...
```

## Testing

1. **Open admin dashboard**: http://localhost:3000/admin/dashboard
2. **In another tab, place an order**: http://localhost:3000/menu?table=1
3. **Watch the admin dashboard**:
   - "Refreshing..." badge should appear
   - New order should show up within 1-2 seconds
   - Badge should disappear

## Troubleshooting

### Orders not auto-refreshing?

1. **Check Realtime is enabled:**
```sql
SELECT
    t.tablename,
    CASE WHEN p.pubname IS NOT NULL THEN 'ENABLED' ELSE 'NOT ENABLED' END as status
FROM pg_tables t
LEFT JOIN pg_publication_tables p ON t.tablename = p.tablename AND p.pubname = 'supabase_realtime'
WHERE t.tablename IN ('orders', 'order_items');
```

2. **Check browser console:**
- Should see: "✅ Successfully subscribed to orders updates"
- Should NOT see: "❌ Orders channel error"

3. **Check network tab:**
- Look for WebSocket connection to Supabase
- Should stay connected (green indicator)

### If Realtime is disabled:

Run in Supabase SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
```

Or use the dashboard:
1. Go to **Database → Replication**
2. Find **supabase_realtime** publication
3. Toggle ON both `orders` and `order_items`

## Performance Notes

- **Debouncing**: Prevents excessive refreshes when multiple items are added
- **Efficient queries**: Only fetches today's orders
- **Smart updates**: Only refreshes when actual data changes
- **No polling**: Uses WebSocket, not HTTP polling (more efficient)

## Related Features

- Buzzer notifications use the same Realtime mechanism
- Order status updates also trigger auto-refresh
- Works across all order statuses (pending, confirmed, preparing, etc.)
