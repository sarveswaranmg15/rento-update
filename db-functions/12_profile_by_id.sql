-- Returns a single user profile by id, checking common schemas (public, auth)
DROP FUNCTION IF EXISTS public.get_profile_by_id(p_id uuid);

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

  -- no auth schema available in this deployment; only public.users is supported

  -- no users table found: return empty result
  RAISE NOTICE 'get_profile_by_id: no users table found in public schema';
  RETURN;
END;
$$;

-- New: return a user by id from a specific tenant schema (simplified)
DROP FUNCTION IF EXISTS public.get_profile_by_id_in_schema(text, uuid);
DROP FUNCTION IF EXISTS public.get_profile_by_id_in_schema(text, text);
CREATE OR REPLACE FUNCTION public.get_profile_by_id_in_schema(p_schema text, p_id text)
RETURNS TABLE(
  id uuid,
  first_name varchar,
  last_name varchar,
  phone varchar,
  email varchar,
  role_id uuid,
  avatar_url text
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  IF p_schema IS NULL OR length(trim(p_schema)) = 0 THEN
    RETURN;
  END IF;

  -- Single simple SELECT using dynamic schema, match id by text
  RETURN QUERY EXECUTE format(
    'SELECT 
       u.id::uuid,
       u.first_name::varchar,
       u.last_name::varchar,
       u.phone::varchar,
       u.email::varchar,
       u.role_id::uuid,
       CASE WHEN u.profile_image IS NOT NULL 
            THEN ''data:image/png;base64,'' || encode(u.profile_image, ''base64'') 
            ELSE NULL END AS avatar_url
     FROM %I.users u
     WHERE u.id::text = $1
     LIMIT 1', p_schema)
    USING p_id;
END;
$$;