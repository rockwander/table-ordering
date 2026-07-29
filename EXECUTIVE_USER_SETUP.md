# Executive User Setup Instructions

This document explains how to set up executive users who will have access only to the Live Orders tab in the admin panel.

## Overview

The admin panel now supports two user roles:
- **Admin**: Full access to all tabs (Dashboard, Live Orders, Orders, Menu Management, QR Codes & Tables, Settings)
- **Executive**: Access only to Live Orders tab (with all 3 sub-tabs: New Orders, Settle Bill, Past Bills)

## Current Configuration

- **Main Admin**: caferamani@gmail.com (existing user - already has admin role)
- **Executive Users**: executive1@caferamani.in, executive2@caferamani.in, executive3@caferamani.in
- **Executive Password**: password123

## Setup Steps

### Step 1: Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Copy and paste the entire contents of `migrations/add_user_roles.sql`
6. Click **"RUN"**

This will:
- Create the `user_roles` table
- Set up automatic role assignment for new users
- Assign the admin role to caferamani@gmail.com (if exists)
- Set up triggers to automatically assign roles based on email patterns

### Step 2: Create Executive Users in Supabase Auth

1. In your Supabase Dashboard, go to **Authentication → Users**
2. Click **"Add user"** (or "Invite user")
3. Create each executive user:

   **Executive 1:**
   - Email: executive1@caferamani.in
   - Password: password123
   - Auto Confirm User: Yes (check this box)

   **Executive 2:**
   - Email: executive2@caferamani.in
   - Password: password123
   - Auto Confirm User: Yes (check this box)

   **Executive 3:**
   - Email: executive3@caferamani.in
   - Password: password123
   - Auto Confirm User: Yes (check this box)

4. The trigger will automatically assign these users the 'executive' role based on their email pattern

### Step 3: Verify the Setup

1. Check that roles were assigned correctly:
   - In Supabase, go to **SQL Editor**
   - Run this query:
     ```sql
     SELECT email, role FROM user_roles ORDER BY email;
     ```
   - You should see:
     - caferamani@gmail.com → admin
     - executive1@caferamani.in → executive
     - executive2@caferamani.in → executive
     - executive3@caferamani.in → executive

2. Test executive login:
   - Open your admin panel: https://table-ordering-teal.vercel.app/admin/login
   - Log in with executive1@caferamani.in / password123
   - Verify:
     - Only "Live Orders" tab is visible in the sidebar
     - All 3 sub-tabs work: New Orders, Settle Bill, Past Bills
     - Toasts and notifications work correctly
     - Trying to access other routes (e.g., /admin/dashboard) redirects to /admin/live-orders

3. Test admin login:
   - Log out and log in with caferamani@gmail.com
   - Verify all tabs are visible and accessible

## How It Works

### Automatic Role Assignment

The migration includes a trigger function that automatically assigns roles when new users are created:

```sql
IF NEW.email LIKE 'executive%@caferamani.in' THEN
  -- Assign executive role
ELSIF NEW.email = 'caferamani@gmail.com' THEN
  -- Assign admin role
END IF
```

Any user with an email matching `executive*@caferamani.in` will automatically get the executive role.

### Route Protection

The following components enforce role-based access:

1. **AdminLayout** (`components/AdminLayout.tsx`):
   - Shows different menu items based on role
   - Redirects executives away from non-Live Orders pages

2. **AdminRouteGuard** (`components/AdminRouteGuard.tsx`):
   - Wraps admin-only pages (Dashboard, Orders, Menu, Tables, Settings)
   - Redirects executives to Live Orders if they try to access admin pages
   - Shows loading spinner while checking role

3. **useUserRole Hook** (`hooks/useUserRole.ts`):
   - Fetches user role from database
   - Provides `isAdmin` and `isExecutive` flags
   - Listens for auth state changes

### Row Level Security (RLS)

The `user_roles` table has RLS enabled with these policies:

1. **Users can view their own role**: Users can query their own role
2. **Admins can manage all roles**: Admins can view/edit all user roles

## Adding More Executive Users

To add more executive users in the future:

1. Simply create them in Supabase Auth with email pattern: `executive*@caferamani.in`
2. The trigger will automatically assign the executive role
3. No code changes needed!

Examples:
- executive4@caferamani.in → automatically gets executive role
- executive-john@caferamani.in → automatically gets executive role
- executivemanager@caferamani.in → automatically gets executive role

## Changing a User's Role

If you need to manually change a user's role:

```sql
-- Make a user an admin
UPDATE user_roles
SET role = 'admin', updated_at = NOW()
WHERE email = 'user@example.com';

-- Make a user an executive
UPDATE user_roles
SET role = 'executive', updated_at = NOW()
WHERE email = 'user@example.com';
```

## Troubleshooting

### Infinite recursion error (500 Internal Server Error)
If you see this error in browser console:
```
Error fetching user role: {code: '42P17', details: null, hint: null, message: 'infinite recursion detected in policy for relation "user_roles"'}
```

**Solution**: Run the RLS fix migration:

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the contents of `migrations/fix_user_roles_rls.sql`
4. Click **"RUN"**

This removes the problematic RLS policy that caused infinite recursion and replaces it with safer policies.

### Executive user sees all tabs
- Check the `user_roles` table to verify they have the 'executive' role
- Clear browser cache and log out/in again
- Check browser console for errors

### User role not assigned automatically
- Verify the migration ran successfully
- Check that the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_role';`
- Manually assign the role using SQL (see "Changing a User's Role" above)

### Toast notifications not working for executives
- Verify the Live Orders page is loading correctly
- Check browser console for permission errors
- Ensure the user has granted notification permissions in their browser

## Security Notes

- Executive users can only access the Live Orders functionality
- They cannot view or modify menu items, settings, or other admin features
- They cannot see the Dashboard with revenue analytics
- All database operations are protected by Supabase RLS policies
- Consider changing the default "password123" to something more secure for production use
