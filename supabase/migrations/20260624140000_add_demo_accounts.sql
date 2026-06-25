-- Create demo owner accounts for all listed salons
-- Password for all accounts is 'Hackathon123!'

-- Helper function to insert users safely
CREATE OR REPLACE FUNCTION public.create_demo_user(
  _email text,
  _full_name text,
  _slug text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;

  IF v_user_id IS NULL THEN
    -- Generate ID and insert
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role
    )
    VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      _email,
      crypt('Hackathon123!', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', _full_name),
      now(),
      now(),
      'authenticated'
    );
  ELSE
    -- Update name if exists
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object('full_name', _full_name)
    WHERE id = v_user_id;
  END IF;

  -- 2. Add 'salon_owner' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'salon_owner')
  ON CONFLICT DO NOTHING;

  -- 3. Set as owner_id for the corresponding salon
  UPDATE public.salons
  SET owner_id = v_user_id
  WHERE slug = _slug;
END $$;

-- Call creator for each salon
SELECT public.create_demo_user('lumiere@bloom.in', 'Lumière Owner', 'lumiere-indiranagar');
SELECT public.create_demo_user('maison@bloom.in', 'Maison Owner', 'maison-koramangala');
SELECT public.create_demo_user('emerald@bloom.in', 'Emerald Owner', 'emerald-hsr');
SELECT public.create_demo_user('vermilion@bloom.in', 'Vermilion Owner', 'vermilion-jayanagar');
SELECT public.create_demo_user('forge@bloom.in', 'Forge Owner', 'forge-whitefield');
SELECT public.create_demo_user('aranya@bloom.in', 'Aranya Owner', 'aranya-jp-nagar');
SELECT public.create_demo_user('noir@bloom.in', 'Noir Owner', 'noir-mg-road');
SELECT public.create_demo_user('rose@bloom.in', 'Rose Owner', 'rose-kalyan-nagar');

-- Clean up helper function
DROP FUNCTION public.create_demo_user(text, text, text);
