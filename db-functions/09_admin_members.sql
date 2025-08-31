-- Returns recent users from a tenant schema with optional search and active filters
CREATE OR REPLACE FUNCTION public.get_admin_members(
  p_schema_name text,
  p_search text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_offset integer DEFAULT 0,
  p_sort text DEFAULT 'created_at',
  p_dir text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  employee_id varchar,
  first_name varchar,
  last_name varchar,
  phone varchar,
  email varchar,
  is_active boolean,
  created_at timestamp
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_sort text;
  v_dir text;
  v_sql text;
BEGIN
  -- allowlist sort columns to prevent SQL injection
  CASE lower(coalesce(p_sort,''))
    WHEN 'created_at' THEN v_sort := 'created_at';
    WHEN 'employee_id' THEN v_sort := 'employee_id';
    WHEN 'first_name' THEN v_sort := 'first_name';
    WHEN 'last_name' THEN v_sort := 'last_name';
    WHEN 'email' THEN v_sort := 'email';
    ELSE v_sort := 'created_at';
  END CASE;

  IF lower(coalesce(p_dir,'')) IN ('asc','desc') THEN
    v_dir := lower(p_dir);
  ELSE
    v_dir := 'desc';
  END IF;

  -- Base query with schema-qualified users table
  v_sql := format('SELECT id, employee_id, first_name, last_name, phone, email, is_active, created_at FROM %I.users', p_schema_name);

  -- Build WHERE clauses and execute with parameterized USING values
  IF p_search IS NOT NULL AND p_is_active IS NOT NULL THEN
    v_sql := v_sql || ' WHERE (employee_id::text ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1) AND is_active = $2';
    v_sql := v_sql || ' ORDER BY ' || quote_ident(v_sort) || ' ' || v_dir || ' LIMIT ' || p_limit::text || ' OFFSET ' || p_offset::text;
    RETURN QUERY EXECUTE v_sql USING concat('%', p_search, '%'), p_is_active;
    RETURN;
  END IF;

  IF p_search IS NOT NULL THEN
    v_sql := v_sql || ' WHERE (employee_id::text ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)';
    v_sql := v_sql || ' ORDER BY ' || quote_ident(v_sort) || ' ' || v_dir || ' LIMIT ' || p_limit::text || ' OFFSET ' || p_offset::text;
    RETURN QUERY EXECUTE v_sql USING concat('%', p_search, '%');
    RETURN;
  END IF;

  IF p_is_active IS NOT NULL THEN
    v_sql := v_sql || ' WHERE is_active = $1';
    v_sql := v_sql || ' ORDER BY ' || quote_ident(v_sort) || ' ' || v_dir || ' LIMIT ' || p_limit::text || ' OFFSET ' || p_offset::text;
    RETURN QUERY EXECUTE v_sql USING p_is_active;
    RETURN;
  END IF;

  -- No filters: return recent users with pagination/sort
  v_sql := v_sql || ' ORDER BY ' || quote_ident(v_sort) || ' ' || v_dir || ' LIMIT ' || p_limit::text || ' OFFSET ' || p_offset::text;
  RETURN QUERY EXECUTE v_sql;

END;
$$;
