# Database Migrations

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the migration file
4. Paste and run the SQL

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## Buzzer Notifications Migration

To enable the buzzer feature, run the migration in:
`migrations/add_buzzer_notifications.sql`

This will create:
- `buzzer_notifications` table
- Necessary indexes for performance
- Row Level Security policies
