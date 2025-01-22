-- Drop existing admin user if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@weddinghub.com'
  ) THEN
    DELETE FROM auth.users WHERE email = 'admin@weddinghub.com';
    DELETE FROM public.users WHERE email = 'admin@weddinghub.com';
  END IF;
END $$;

-- Create admin user with secure password
DO $$ 
DECLARE 
  new_user_id uuid;
BEGIN
  -- Generate new UUID for admin user
  new_user_id := gen_random_uuid();

  -- Insert into auth.users first
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
    last_sign_in_at,
    confirmation_token
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@weddinghub.com',
    jsonb_build_object(
      'provider', 'email',
      'providers', array['email']
    ),
    jsonb_build_object('role', 'admin'),
    false,
    crypt('Admin123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    encode(gen_random_bytes(32), 'hex')
  );

  -- Insert into public.users
  INSERT INTO public.users (id, email, role)
  VALUES (new_user_id, 'admin@weddinghub.com', 'admin');

  -- Grant necessary permissions
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
END $$;