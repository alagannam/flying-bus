DO $$
DECLARE
  v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'admin1@test.com';
  
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Auth user not found — create it in Studio first';
  END IF;

  INSERT INTO public.users (id, email, account_type, account_status)
  VALUES (v_uid, 'admin1@test.com', 'admin', 'active')
  ON CONFLICT (id) DO UPDATE SET 
    account_type = 'admin',
    account_status = 'active';
END $$;