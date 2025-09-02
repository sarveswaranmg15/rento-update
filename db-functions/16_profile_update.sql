-- Update profile in a tenant schema
DROP FUNCTION IF EXISTS public.update_profile_in_schema(text, text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.update_profile_in_schema(
  p_schema text,
  p_user_id text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_avatar_url text
)
RETURNS integer
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
  has_users boolean;
  has_first_name boolean;
  has_last_name boolean;
  has_phone boolean;
  has_email boolean;
  has_avatar_url boolean;
  cnt integer := 0;
  c integer := 0;
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' OR p_user_id IS NULL THEN
    RETURN 0;
  END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'users') INTO has_users;
  IF NOT has_users THEN RETURN 0; END IF;

  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'first_name') INTO has_first_name;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'last_name') INTO has_last_name;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'phone') INTO has_phone;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'email') INTO has_email;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'avatar_url') INTO has_avatar_url;

  IF p_first_name IS NOT NULL AND has_first_name THEN
    EXECUTE format('UPDATE %I.users SET first_name = $1 WHERE id::text = $2', p_schema) USING p_first_name, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_last_name IS NOT NULL AND has_last_name THEN
    EXECUTE format('UPDATE %I.users SET last_name = $1 WHERE id::text = $2', p_schema) USING p_last_name, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_phone IS NOT NULL AND has_phone THEN
    EXECUTE format('UPDATE %I.users SET phone = $1 WHERE id::text = $2', p_schema) USING p_phone, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_email IS NOT NULL AND has_email THEN
    EXECUTE format('UPDATE %I.users SET email = $1 WHERE id::text = $2', p_schema) USING p_email, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_avatar_url IS NOT NULL AND has_avatar_url THEN
    EXECUTE format('UPDATE %I.users SET avatar_url = $1 WHERE id::text = $2', p_schema) USING p_avatar_url, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;

  RETURN cnt;
END;
$$;

-- Overload: also save avatar image bytes if provided (base64 string)
DROP FUNCTION IF EXISTS public.update_profile_in_schema(text, text, text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.update_profile_in_schema(
  p_schema text,
  p_user_id text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_avatar_url text,
  p_avatar_image_base64 text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
  has_users boolean;
  has_first_name boolean;
  has_last_name boolean;
  has_phone boolean;
  has_email boolean;
  has_avatar_url boolean;
  has_avatar_image boolean;
  has_photo boolean;
  cnt integer := 0;
  c integer := 0;
  v_b64 text;
  v_img bytea;
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' OR p_user_id IS NULL THEN
    RETURN 0;
  END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'users') INTO has_users;
  IF NOT has_users THEN RETURN 0; END IF;

  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'first_name') INTO has_first_name;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'last_name') INTO has_last_name;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'phone') INTO has_phone;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'email') INTO has_email;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'avatar_url') INTO has_avatar_url;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'avatar_image') INTO has_avatar_image;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'photo') INTO has_photo;

  IF p_first_name IS NOT NULL AND has_first_name THEN
    EXECUTE format('UPDATE %I.users SET first_name = $1 WHERE id::text = $2', p_schema) USING p_first_name, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_last_name IS NOT NULL AND has_last_name THEN
    EXECUTE format('UPDATE %I.users SET last_name = $1 WHERE id::text = $2', p_schema) USING p_last_name, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_phone IS NOT NULL AND has_phone THEN
    EXECUTE format('UPDATE %I.users SET phone = $1 WHERE id::text = $2', p_schema) USING p_phone, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_email IS NOT NULL AND has_email THEN
    EXECUTE format('UPDATE %I.users SET email = $1 WHERE id::text = $2', p_schema) USING p_email, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;
  IF p_avatar_url IS NOT NULL AND has_avatar_url THEN
    EXECUTE format('UPDATE %I.users SET avatar_url = $1 WHERE id::text = $2', p_schema) USING p_avatar_url, p_user_id;
    GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
  END IF;

  -- Try to decode image from base64 if provided or if avatar_url is a data URL
  v_b64 := NULL;
  IF p_avatar_image_base64 IS NOT NULL THEN
    v_b64 := p_avatar_image_base64;
  ELSIF p_avatar_url IS NOT NULL AND position('data:' in p_avatar_url) = 1 THEN
    v_b64 := p_avatar_url;
  END IF;

  IF v_b64 IS NOT NULL THEN
    IF position('base64,' IN v_b64) > 0 THEN
      v_b64 := split_part(v_b64, 'base64,', 2);
    END IF;
    BEGIN
      v_img := decode(v_b64, 'base64');
    EXCEPTION WHEN others THEN
      v_img := NULL;
    END;

    IF v_img IS NOT NULL THEN
      IF has_avatar_image THEN
        EXECUTE format('UPDATE %I.users SET avatar_image = $1 WHERE id::text = $2', p_schema) USING v_img, p_user_id;
        GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
      ELSIF has_photo THEN
        EXECUTE format('UPDATE %I.users SET photo = $1 WHERE id::text = $2', p_schema) USING v_img, p_user_id;
        GET DIAGNOSTICS c = ROW_COUNT; cnt := cnt + c;
      END IF;
    END IF;
  END IF;

  RETURN cnt;
END;
$$;

-- Ensure no ambiguity remains: drop the 7-arg version if it still exists
DROP FUNCTION IF EXISTS public.update_profile_in_schema(text, text, text, text, text, text, text);