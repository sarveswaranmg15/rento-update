-- Returns a single user profile by id, checking common schemas (public, auth)
CREATE OR REPLACE FUNCTION public.get_profile_by_id(p_id uuid)
RETURNS TABLE(
  id uuid,
  first_name varchar,
  last_name varchar,
  phone varchar,
  email varchar,
  role varchar,
  rides_count bigint,
  avatar_url text
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  -- prefer public.users
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RETURN QUERY
    SELECT id::uuid, first_name::varchar, last_name::varchar, phone::varchar, email::varchar, role::varchar, COALESCE(rides_count,0)::bigint, avatar_url::text
    FROM public.users WHERE id = p_id LIMIT 1;
    RETURN;
  END IF;

  -- fallback to auth.users
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    RETURN QUERY
    SELECT id::uuid, first_name::varchar, last_name::varchar, phone::varchar, email::varchar, role::varchar, COALESCE(rides_count,0)::bigint, avatar_url::text
    FROM auth.users WHERE id = p_id LIMIT 1;
    RETURN;
  END IF;

  -- no users table found: return empty result
  RAISE NOTICE 'get_profile_by_id: no users table found in public or auth schema';
  RETURN;
END;
$$;