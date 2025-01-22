-- Drop existing policies
DROP POLICY IF EXISTS "basic_read_access" ON users;
DROP POLICY IF EXISTS "basic_write_access" ON users;

-- Create simplified policies that avoid recursion
CREATE POLICY "allow_user_read"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_user_write"
  ON users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate admin user with proper auth setup
DO $$ 
DECLARE 
  admin_id uuid := gen_random_uuid();
BEGIN
  -- Remove existing admin user if exists
  DELETE FROM auth.users WHERE email = 'admin@weddinghub.com';
  DELETE FROM public.users WHERE email = 'admin@weddinghub.com';

  -- Create admin in auth.users first
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    is_super_admin
  )
  VALUES (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@weddinghub.com',
    crypt('WeddingHub2024!', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('role', 'admin'),
    now(),
    now(),
    now(),
    true
  );

  -- Then create in public.users
  INSERT INTO public.users (id, email, role)
  VALUES (admin_id, 'admin@weddinghub.com', 'admin');
END $$;