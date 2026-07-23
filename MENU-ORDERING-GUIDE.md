# Menu Item Ordering & Top Selling - Guide

## Overview

The menu management system now supports two powerful features:
1. **Custom Ordering**: Reorder menu items to control how they appear to customers
2. **Top Selling Items**: Mark items as "Top Selling" to highlight them in the "All Items" category

## Features

### 1. Menu Item Reordering

**Location**: Admin → Menu Management → Menu Items tab

**How to Reorder**:
- Use the ⬆️ (up arrow) and ⬇️ (down arrow) buttons on each menu item card
- Click the up arrow to move an item higher in the display order
- Click the down arrow to move an item lower in the display order
- The first item cannot move up, the last item cannot move down

**Effect**:
- Items are displayed to customers in the order you set
- This order applies to both "All Items" view and individual category views
- Reordering is instant and applies immediately

### 2. Top Selling Items

**Location**: Admin → Menu Management → Menu Items → Edit/Add Item

**How to Mark as Top Selling**:
1. Click "Edit" on an existing item or "Add Menu Item"
2. Toggle the "Top Selling" switch to ON
3. Click "Save"

**Effect**:
- In the **"All Items"** category only:
  - Top selling items appear **first**, before all other items
  - They have a golden **"Top Selling"** badge in the top-right corner
  - They have a **golden border** around the card
  - They stand out visually to encourage customer selection
- In **individual categories** (e.g., "Main Course", "Desserts"):
  - Top selling badge is **not shown**
  - Items follow the standard display order

**Admin View**:
- Top selling items show a ⭐ star icon next to the name
- They also have a "Top Selling" chip/badge for easy identification

## Display Logic

### All Items Category

**Sort Order**:
1. **Top Selling items first** (in their display_order)
2. **Regular items second** (in their display_order)

**Example**:
If your items are:
- Ghee Roast (display_order: 1, top_selling: true)
- Masala Dosa (display_order: 2, top_selling: false)
- Filter Coffee (display_order: 3, top_selling: true)
- Idli (display_order: 4, top_selling: false)

**Customers will see**:
1. Ghee Roast (⭐ Top Selling badge)
2. Filter Coffee (⭐ Top Selling badge)
3. Masala Dosa
4. Idli

### Individual Categories

**Sort Order**:
- Items appear in **display_order only**
- No special treatment for top selling items
- No "Top Selling" badges shown

**Example**:
In "South Indian" category with same items as above:
1. Ghee Roast
2. Masala Dosa
3. Filter Coffee (if in this category)
4. Idli

(Standard order, no badges)

## Use Cases

### Use Case 1: Highlighting Popular Items

**Scenario**: You want to promote your 3 most popular dishes

**Steps**:
1. Go to Admin → Menu Management → Menu Items
2. Edit "Ghee Roast" → Toggle "Top Selling" ON → Save
3. Edit "Masala Dosa" → Toggle "Top Selling" ON → Save
4. Edit "Filter Coffee" → Toggle "Top Selling" ON → Save

**Result**: When customers open the menu and select "All Items", these 3 items will appear at the top with golden badges and borders.

### Use Case 2: Organizing Menu by Importance

**Scenario**: You want main dishes before sides, desserts last

**Steps**:
1. Go to Admin → Menu Management → Menu Items
2. Click ⬆️ on all main dishes until they're at the top
3. Click ⬇️ on all desserts until they're at the bottom
4. Fine-tune with up/down arrows

**Result**: Customers see items in the order you prefer, making navigation easier.

### Use Case 3: Seasonal Promotions

**Scenario**: You have a special seasonal item you want to highlight

**Steps**:
1. Add the seasonal item normally
2. Toggle "Top Selling" ON
3. Use ⬆️ to move it to a high position

**Result**: The item appears prominently in "All Items" view with visual distinction.

## Database Schema

### Fields Added

**`menu_items` table**:
- `is_top_selling` (BOOLEAN, default: false) - Marks item as top selling
- `display_order` (INTEGER, required) - Controls display order

**Indexes**:
- `idx_menu_items_top_selling` - For fast filtering
- `idx_menu_items_display_order` - For efficient sorting

### Migration

Migration file: `migrations/add_is_top_selling_only.sql`

Safely adds `is_top_selling` field to existing menu_items table without affecting existing data.

## Admin Interface Details

### Menu Items Tab

**Card Display**:
```
┌─────────────────────────────────────┐
│ Ghee Roast ⭐    ⬆️ ⬇️ ✏️ 🗑️        │
│ Crispy dosa with ghee...            │
│ ₹80.00                              │
│ [Veg] [Available] [Top Selling]     │
└─────────────────────────────────────┘
```

**Button Functions**:
- ⬆️ - Move item up in display order
- ⬇️ - Move item down in display order
- ✏️ - Edit item (opens dialog)
- 🗑️ - Delete item

### Edit Item Dialog

**New Field**:
```
Top Selling
[Toggle Switch]
```

Located after "Available" switch in the edit form.

## Customer Interface Details

### All Items View

**Top Selling Item Card**:
```
┌─────────────────────────────────────┐
│ 🏅 Top Selling                      │ ← Badge (top-right)
│ ┌─────────────────┐                 │
│ │   [Item Image]   │                 │
│ └─────────────────┘                 │
│ Ghee Roast         [Veg]            │
│ Crispy dosa with ghee...            │
│ ₹80.00              [Add]           │
└─────────────────────────────────────┘
   ↑ Golden border (2px)
```

**Regular Item Card**:
```
┌─────────────────────────────────────┐
│ ┌─────────────────┐                 │
│ │   [Item Image]   │                 │
│ └─────────────────┘                 │
│ Masala Dosa       [Veg]             │
│ Classic masala dosa...              │
│ ₹70.00              [Add]           │
└─────────────────────────────────────┘
   ↑ Standard border
```

### Category-Specific Views

No visual distinction for top selling items - they appear as regular items in standard display order.

## Technical Implementation

### Backend (Database)

```sql
-- Check if item is top selling
SELECT * FROM menu_items WHERE is_top_selling = true;

-- Update display order
UPDATE menu_items SET display_order = 5 WHERE id = 'item-id';

-- Swap two items' display orders
BEGIN;
UPDATE menu_items SET display_order = temp WHERE id = 'item-1';
UPDATE menu_items SET display_order = order1 WHERE id = 'item-2';
UPDATE menu_items SET display_order = order2 WHERE id = 'item-1';
COMMIT;
```

### Frontend (React/Next.js)

**Admin - Move Item**:
```typescript
const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
  // Find current and target items
  // Swap their display_order values
  // Refresh data
};
```

**Customer - Sort Items**:
```typescript
const filteredItems =
  selectedCategory === 'all'
    ? menuItems.sort((a, b) => {
        // Top selling first
        if (a.is_top_selling && !b.is_top_selling) return -1;
        if (!a.is_top_selling && b.is_top_selling) return 1;
        // Then by display_order
        return a.display_order - b.display_order;
      })
    : menuItems.filter(item => item.category_id === selectedCategory);
```

## Best Practices

### 1. Limit Top Selling Items

**Recommendation**: Mark only 3-5 items as "Top Selling"

**Reason**: Too many "top selling" items dilutes the impact and makes everything seem common.

### 2. Use Display Order Strategically

**Recommendation**:
- Put complementary items near each other
- Group similar items together
- Place high-margin items early

### 3. Update Regularly

**Recommendation**: Review and update top selling status monthly

**Reason**: Customer preferences change seasonally.

### 4. Test Customer View

**Recommendation**: After reordering, view the customer menu yourself

**Action**: Click "View Menu" from admin or visit `/menu?table=counter`

## Troubleshooting

### Issue: Items not appearing in correct order

**Solution**:
1. Go to Admin → Menu Management → Menu Items
2. Check the display_order values are sequential
3. Use up/down arrows to fix order
4. Refresh customer page

### Issue: Top selling badge not showing

**Possible causes**:
1. Not viewing "All Items" category (badges only show there)
2. Item's `is_top_selling` is false
3. Browser cache (try hard refresh: Ctrl+Shift+R)

**Solution**:
1. Select "All Items" tab
2. Check admin panel - item should have ⭐ star icon
3. Hard refresh browser

### Issue: Cannot move item up/down

**Cause**: Item is already at the top (can't go up) or bottom (can't go down)

**Solution**: This is expected behavior - buttons are disabled at extremes.

## Performance Notes

- Reordering swaps only two database rows (very fast)
- Indexes on `display_order` and `is_top_selling` ensure quick sorting
- Customer page sorts in memory (no extra database calls)
- No performance impact for <1000 items

---

## Summary

✅ **Reorder menu items** with intuitive up/down arrows
✅ **Mark top selling items** with a simple toggle
✅ **Visual distinction** with badges and borders in "All Items" view
✅ **Flexible display** - top selling items only highlighted in "All Items"
✅ **Easy to use** - no technical knowledge required

Perfect for restaurants wanting to:
- Highlight popular dishes
- Promote seasonal specials
- Organize menu strategically
- Guide customer choices
