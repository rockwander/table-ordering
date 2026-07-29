-- Fix infinite recursion in user_roles RLS policies
-- The issue: The "Admins can manage all roles" policy tries to query user_roles
-- to check if the user is an admin, which creates infinite recursion.

-- Solution: Drop the problematic policy and create simpler policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create new, safer policies

-- 1. Everyone can read their own role (simple, no recursion)
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Only allow inserts via the trigger function (SECURITY DEFINER)
-- This prevents manual insertions but allows the trigger to work
CREATE POLICY "Trigger can insert roles" ON user_roles
  FOR INSERT
  WITH CHECK (false);  -- No one can insert directly (only trigger with SECURITY DEFINER)

-- 3. Only allow updates via service role or specific function
-- For now, we'll restrict updates to prevent unauthorized role changes
CREATE POLICY "No direct updates" ON user_roles
  FOR UPDATE
  USING (false);

-- 4. No deletes allowed (roles are tied to auth.users via CASCADE)
CREATE POLICY "No direct deletes" ON user_roles
  FOR DELETE
  USING (false);

-- Note: The trigger function handle_new_user_role() has SECURITY DEFINER
-- which means it runs with the privileges of the function owner (bypassing RLS)
-- This allows it to insert/update user_roles even with the restrictive policies above
