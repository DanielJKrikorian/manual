-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable write access for admins" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create a single, simple policy for admin access
CREATE POLICY "admin_access_policy"
  ON users
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled but with simplified access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Recreate admin user with simplified approach
DO $$ 
DECLARE 
  new_admin_id uuid;
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM auth.users WHERE email = 'admin@weddinghub.com';
  DELETE FROM public.users WHERE email = 'admin@weddinghub.com';

  -- Generate new UUID
  new_admin_id := gen_random_uuid();

  -- Create new admin user with a fresh UUID
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
    updated_at
  )
  VALUES (
    new_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@weddinghub.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "admin"}',
    now(),
    now()
  );

  -- Insert into public.users using the same UUID
  INSERT INTO public.users (id, email, role)
  VALUES (new_admin_id, 'admin@weddinghub.com', 'admin');
END $$;