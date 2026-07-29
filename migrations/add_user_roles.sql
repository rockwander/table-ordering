-- Create user_roles table to store admin user roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'executive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Set the main admin (caferamani@gmail.com)
-- Note: You'll need to get the actual user_id from Supabase Auth dashboard
-- This is a template - the actual user_id will be inserted later
-- INSERT INTO user_roles (user_id, email, role)
-- VALUES ('USER_ID_HERE', 'caferamani@gmail.com', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Function to automatically create user_role entry for new users
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email is an executive email
  IF NEW.email LIKE 'executive%@caferamani.in' THEN
    INSERT INTO user_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'executive')
    ON CONFLICT (user_id) DO NOTHING;
  -- Check if it's the main admin email
  ELSIF NEW.email = 'caferamani@gmail.com' THEN
    INSERT INTO user_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

-- Backfill existing users
-- This will automatically set roles for existing users based on their email
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, email FROM auth.users
  LOOP
    IF user_record.email = 'caferamani@gmail.com' THEN
      INSERT INTO user_roles (user_id, email, role)
      VALUES (user_record.id, user_record.email, 'admin')
      ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
    ELSIF user_record.email LIKE 'executive%@caferamani.in' THEN
      INSERT INTO user_roles (user_id, email, role)
      VALUES (user_record.id, user_record.email, 'executive')
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
