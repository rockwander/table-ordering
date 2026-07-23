# Alphanumeric Table Numbers - Implementation Guide

## Overview

The table ordering system now supports **alphanumeric table numbers** including the special "counter" table for walk-in customers.

## Changes Made

### Database Migration

**File:** `migrations/change_table_number_to_text.sql`

- Changed `table_number` column from `INTEGER` to `TEXT` in all tables:
  - `tables`
  - `orders`
  - `buzzer_notifications`
- Converted all existing numeric tables ("1", "2", "3", etc.)
- Created default "counter" table
- Updated indexes for TEXT type
- Maintains referential integrity

**Execution:**
```bash
supabase db query --linked --file migrations/change_table_number_to_text.sql
```

### TypeScript Types Updated

**File:** `types/index.ts`

Changed from:
```typescript
table_number: number
```

To:
```typescript
table_number: string
```

Affected types:
- `Table`
- `Order`
- `BuzzerNotification`

### Components Updated

#### 1. Header Component
- **Prop type:** `tableNumber?: string`
- Displays table numbers as-is (no parsing needed)

#### 2. BuzzerNotification Component
- **Prop type:** `tableNumber: string`
- Shows table number in notifications

#### 3. All Page Components
- Removed all `parseInt(tableNumber)` calls
- Direct string comparison in queries
- Natural sorting implemented

### Sorting Logic

**Smart Natural Sorting:**
```typescript
// Example from admin dashboard
.sort((a, b) => {
  // "counter" always first
  if (a.table_number === 'counter') return -1;
  if (b.table_number === 'counter') return 1;

  // Numeric tables sorted numerically
  const aNum = parseInt(a.table_number);
  const bNum = parseInt(b.table_number);
  if (!isNaN(aNum) && !isNaN(bNum)) {
    return aNum - bNum;
  }

  // Alphabetic fallback
  return a.table_number.localeCompare(b.table_number);
})
```

**Sort Order Examples:**
1. counter
2. 1
3. 2
4. 10
5. 11
6. VIP-A
7. VIP-B

## Usage Examples

### URL Parameters

**Counter table (walk-in customers):**
```
http://localhost:3000/menu?table=counter
```

**Numeric tables:**
```
http://localhost:3000/menu?table=1
http://localhost:3000/menu?table=2
http://localhost:3000/menu?table=10
```

**Alphanumeric tables:**
```
http://localhost:3000/menu?table=VIP-A
http://localhost:3000/menu?table=outdoor-1
http://localhost:3000/menu?table=terrace
```

### Creating Tables in Admin

**Admin → Tables → Add Table**

Table Number examples:
- `1` - Regular numeric table
- `counter` - Walk-in counter
- `VIP-A` - VIP section table A
- `patio-1` - Patio table 1
- `bar-seat-5` - Bar seating

### Default Behavior

**Home page (`/`) now redirects to:**
```
/menu?table=counter
```

This provides immediate access for walk-in customers without scanning QR codes.

## Database Verification

**Check current tables:**
```sql
SELECT * FROM tables
ORDER BY
  CASE WHEN table_number = 'counter' THEN 0 ELSE 1 END,
  table_number;
```

**Check orders by table:**
```sql
SELECT table_number, COUNT(*) as order_count
FROM orders
GROUP BY table_number
ORDER BY table_number;
```

**Verify buzzer notifications:**
```sql
SELECT table_number, notification_type, status
FROM buzzer_notifications
WHERE status = 'active';
```

## QR Code Generation

QR codes work seamlessly with alphanumeric tables:

```typescript
const menuUrl = `${baseUrl}/menu?table=${table.table_number}`;
// Examples:
// https://yoursite.com/menu?table=counter
// https://yoursite.com/menu?table=1
// https://yoursite.com/menu?table=VIP-A
```

## Backward Compatibility

✅ **Fully backward compatible**
- Existing QR codes with numeric tables still work
- All existing orders preserved
- URLs with `?table=1` still functional

## Testing Checklist

- [x] Database migration successful
- [x] "counter" table created
- [x] Home page redirects to counter
- [x] Menu page loads with `?table=counter`
- [x] Can place order from counter table
- [x] Buzzer notification works with alphanumeric tables
- [x] Admin dashboard displays mixed table types correctly
- [x] Table sorting works (counter first, then natural order)
- [x] QR codes generate for alphanumeric tables
- [x] Can create/edit tables with text names in admin

## Common Use Cases

### Walk-in Customers
1. Customer arrives at counter
2. Opens app → automatically at `/menu?table=counter`
3. Places order
4. Admin sees "counter" in orders

### Regular Tables
1. Customer scans QR code at table
2. Opens `/menu?table=5`
3. Places order
4. Admin sees "Table 5" in orders

### VIP/Special Areas
1. Create table "VIP-A" in admin
2. Generate QR code
3. Customer scans → `/menu?table=VIP-A`
4. Admin sees "VIP-A" in orders

## API Changes

**Before:**
```typescript
.eq('table_number', parseInt(tableNumber))
```

**After:**
```typescript
.eq('table_number', tableNumber)
```

**No changes needed to Supabase queries** - just removed parseInt!

## Admin Panel Features

### Tables Management
- Create tables with any alphanumeric name
- Helper text explains format options
- Automatic next number suggestion for numeric tables
- Edit existing table numbers

### Dashboard
- Smart sorting with "counter" first
- Groups orders by table correctly
- Handles mixed numeric/alphanumeric tables

### Orders History
- Filter by table (dropdown includes all types)
- Natural sorting in filter dropdown
- Search works with alphanumeric tables

## Performance Notes

- **No performance impact** - TEXT vs INTEGER is negligible
- **Indexes updated** for efficient queries
- **Sorting optimized** with smart comparison logic

## Future Enhancements

Possible additions:
- Table categories (VIP, Regular, Outdoor, etc.)
- Color coding by table prefix
- Table floor/section mapping
- Reserved table status
- Table capacity tracking

## Migration Rollback

If needed, you can rollback by:
```sql
-- Convert back to INTEGER (ONLY if no alphanumeric tables exist)
ALTER TABLE tables
  ALTER COLUMN table_number TYPE INTEGER
  USING table_number::INTEGER;

-- Similar for other tables
```

⚠️ **Warning:** This only works if ALL table numbers are numeric!

## Support

**Database structure:**
- All `table_number` columns are now TEXT
- Allows any alphanumeric string
- Case-sensitive comparison

**Validation:**
- No validation on table number format
- Admin can create any string as table number
- Recommended: Use consistent naming convention

**Best Practices:**
- Keep names short and memorable
- Use hyphens, not spaces
- Consider using prefixes (VIP-, BAR-, OUT-)
- Document your naming scheme

---

✅ **Implementation Complete**
🚀 **Pushed to GitHub:** Commit f134e10

The system now supports flexible table naming while maintaining full backward compatibility!
