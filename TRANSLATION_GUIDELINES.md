# Translation Guidelines for Ramani's Cafe

## IMPORTANT: Always Check Gujarati Translations

**⚠️ CRITICAL REMINDER FOR ALL FUTURE DEVELOPMENT:**

Whenever you make ANY changes to the admin interface or customer-facing UI, you MUST update translations in **BOTH** English and Gujarati.

## Translation File Location

**File:** `/contexts/LanguageContext.tsx`

This file contains all translations for the application in both languages:
- `translations.en` - English translations
- `translations.gu` - Gujarati (ગુજરાતી) translations

## When to Add Translations

You MUST add translations when:
- ✅ Adding new UI text, labels, or buttons
- ✅ Creating new pages or components
- ✅ Adding error messages or notifications
- ✅ Modifying existing text strings
- ✅ Adding new features to admin dashboard
- ✅ Adding new customer-facing features
- ✅ Creating new status messages or alerts

## How to Add Translations

### 1. Add Translation Keys to LanguageContext.tsx

```typescript
// In translations.en
'feature.newLabel': 'New Label Text',
'feature.description': 'Description text here',

// In translations.gu
'feature.newLabel': 'નવી લેબલ ટેક્સ્ટ',
'feature.description': 'વર્ણન ટેક્સ્ટ અહીં',
```

### 2. Use Translation Function in Components

```typescript
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();

  return (
    <Typography>{t('feature.newLabel')}</Typography>
  );
}
```

### 3. For Menu Item Names (Special Case)

Menu items have both English and Gujarati names stored in the database:
- `name` - English name
- `gujarati_name` - Gujarati name

Use the `getItemName()` helper function:

```typescript
const getItemName = (item: { name: string; gujarati_name?: string | null }) => {
  if (language === 'gu' && item.gujarati_name) {
    return item.gujarati_name;
  }
  return item.name;
};
```

## Translation Categories

Current translation namespaces:
- `dashboard.*` - Dashboard-related text
- `status.*` - Order status labels
- `actions.*` - Action buttons (delete, print, settle, etc.)
- `table.*` - Table-related labels
- `bill.*` - Bill and payment-related text
- `notif.*` - Notification messages
- `common.*` - Common UI elements
- `liveOrders.*` - Live Orders page specific text

## Testing Translations

After adding translations:
1. ✅ Test switching between English and ગુજરાતી using the language toggle
2. ✅ Verify all new text appears correctly in both languages
3. ✅ Check for missing translations (will show the key name if missing)
4. ✅ Ensure proper text rendering (Gujarati script displays correctly)

## Common Gujarati Phrases

For reference when adding new translations:

| English | Gujarati |
|---------|----------|
| Orders | ઓર્ડર્સ |
| Table | ટેબલ |
| Total | કુલ |
| Price | કિંમત |
| Item | વસ્તુ |
| Bill | બિલ |
| Pending | બાકી |
| Ready | તૈયાર |
| Confirmed | કન્ફર્મ |
| Paid | ચૂકવાયેલ |
| Print | છાપો |
| Delete | કાઢી નાખો |
| Settle | ચૂકવો |
| Discount | ડિસ્કાઉન્ટ |
| Subtotal | સબટોટલ |

## Files That Currently Use Translations

- `/app/admin/dashboard/page.tsx` - Main dashboard
- `/app/admin/live-orders/page.tsx` - Live orders management
- `/components/AdminLayout.tsx` - Admin navigation (language switcher)
- All admin pages should use translations

## Pre-Commit Checklist

Before committing any UI changes:
- [ ] Added English translations to `translations.en`
- [ ] Added Gujarati translations to `translations.gu`
- [ ] Updated components to use `t()` function
- [ ] Tested language switching
- [ ] Verified all text displays correctly in both languages

## Need Help with Gujarati Translation?

If you need Gujarati translations:
1. Check existing translations in LanguageContext.tsx for similar phrases
2. Use Google Translate as a starting point (but verify with native speaker if possible)
3. Maintain consistency with existing translation style

---

**🔴 REMEMBER: No hardcoded strings in UI components! Always use translation keys!**
