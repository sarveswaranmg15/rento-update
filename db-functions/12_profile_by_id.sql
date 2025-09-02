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

-- New: return a user by id from a specific tenant schema if the schema.users table exists
DROP FUNCTION IF EXISTS public.get_profile_by_id_in_schema(p_schema text, p_id uuid);
CREATE OR REPLACE FUNCTION public.get_profile_by_id_in_schema(p_schema text, p_id uuid)
RETURNS TABLE(
  id uuid,
  first_name varchar,
  last_name varchar,
  phone varchar,
  email varchar,
  role varchar,
  rides_count bigint,
  avatar_url text,
  role_id uuid,
  role_name varchar,
  role_description text,
  role_permissions jsonb,
  role_is_system boolean,
  role_created_at timestamp
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_sql text;
  v_join text := '';
  v_has_first boolean;
  v_has_last boolean;
  v_has_phone boolean;
  v_has_email boolean;
  v_has_role boolean;
  v_has_role_id boolean;
  v_has_rides boolean;
  v_has_avatar boolean;
  v_has_profile_image boolean;
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' THEN
    RETURN;
  END IF;

  -- ensure schema exists and has users table
  IF NOT EXISTS(
    SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'users'
  ) THEN
    RETURN;
  END IF;

  -- detect available columns to avoid referencing missing ones
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'first_name') INTO v_has_first;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'last_name') INTO v_has_last;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'phone') INTO v_has_phone;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'email') INTO v_has_email;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'role') INTO v_has_role;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'role_id') INTO v_has_role_id;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'rides_count') INTO v_has_rides;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'avatar_url') INTO v_has_avatar;
  SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'profile_image') INTO v_has_profile_image;

  -- If we will use role_id to map to public.roles, prepare join
  IF v_has_role_id THEN
    v_join := ' LEFT JOIN public.roles r ON r.id::text = u.role_id::text';
  END IF;

  -- Build select list, alias users table as u, falling back to empty literals for missing columns
  v_sql := 'SELECT u.id::uuid';

  IF v_has_first THEN
    v_sql := v_sql || ', u.first_name::varchar';
  ELSE
    v_sql := v_sql || ', ''::varchar AS first_name';
  END IF;

  IF v_has_last THEN
    v_sql := v_sql || ', u.last_name::varchar';
  ELSE
    v_sql := v_sql || ', ''::varchar AS last_name';
  END IF;

  IF v_has_phone THEN
    v_sql := v_sql || ', u.phone::varchar';
  ELSE
    v_sql := v_sql || ', ''::varchar AS phone';
  END IF;

  IF v_has_email THEN
    v_sql := v_sql || ', u.email::varchar';
  ELSE
    v_sql := v_sql || ', ''::varchar AS email';
  END IF;

  -- role: prefer explicit role column, else map role_id via public.roles if available, else empty
  IF v_has_role THEN
    v_sql := v_sql || ', u.role::varchar';
  ELSE
    IF v_has_role_id THEN
      v_sql := v_sql || ', COALESCE(r.name::varchar, u.role_id::varchar) AS role';
    ELSE
      v_sql := v_sql || ', ''::varchar AS role';
    END IF;
  END IF;

  IF v_has_rides THEN
    v_sql := v_sql || ', COALESCE(u.rides_count,0)::bigint AS rides_count';
  ELSE
    v_sql := v_sql || ', 0::bigint AS rides_count';
  END IF;

  IF v_has_avatar THEN
    v_sql := v_sql || ', u.avatar_url::text';
  ELSE
    IF v_has_profile_image THEN
      v_sql := v_sql || ', u.profile_image::text AS avatar_url';
    ELSE
      v_sql := v_sql || ', ''::text AS avatar_url';
    END IF;
  END IF;

  -- include detailed role fields (from public.roles when role_id exists) AFTER avatar to match RETURNS order
  IF v_has_role_id THEN
    v_sql := v_sql || ', r.id::uuid AS role_id, r.name::varchar AS role_name, r.description::text AS role_description, r.permissions::jsonb AS role_permissions, r.is_system_role::boolean AS role_is_system, r.created_at::timestamp AS role_created_at';
  ELSE
    v_sql := v_sql || ', NULL::uuid AS role_id, NULL::varchar AS role_name, NULL::text AS role_description, NULL::jsonb AS role_permissions, NULL::boolean AS role_is_system, NULL::timestamp AS role_created_at';
  END IF;

  -- assemble FROM clause with optional join
  v_sql := v_sql || format(' FROM %I.users u', p_schema) || v_join || ' WHERE u.id = $1 LIMIT 1';

  -- Execute safe dynamic SQL with parameterized id
  RETURN QUERY EXECUTE v_sql USING p_id;
END;
$$;