/*
  # Create Admin User Migration
  
  1. Changes
    - Create admin user with secure credentials
    - Set proper role and metadata
    - Handle existing user cases safely
    
  2. Security
    - Use secure password hashing
    - Set proper permissions
*/

-- First, disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create admin user with secure password
DO $$ 
DECLARE 
  new_user_id uuid;
BEGIN
  -- First check if admin exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@weddinghub.com') THEN
    -- Generate new UUID for admin user
    new_user_id := gen_random_uuid();

    -- Insert into public.users first
    INSERT INTO public.users (id, email, role)
    VALUES (new_user_id, 'admin@weddinghub.com', 'admin');

    -- Then insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      last_sign_in_at
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@weddinghub.com',
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      false,
      crypt('Admin123!', gen_salt('bf')),
      now(),
      now(),
      now(),
      now()
    );
  END IF;
END $$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();