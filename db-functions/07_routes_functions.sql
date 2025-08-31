-- Functions to fetch routes for tenant schemas
CREATE OR REPLACE FUNCTION public.get_routes(
  p_schema_name text,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_sort text DEFAULT 'created_at',
  p_dir text DEFAULT 'DESC',
  p_is_active boolean DEFAULT NULL,
  p_min_distance numeric DEFAULT NULL,
  p_max_distance numeric DEFAULT NULL,
  p_start_location text DEFAULT NULL,
  p_end_location text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name varchar,
  route_code varchar,
  start_location varchar,
  end_location varchar,
  estimated_distance numeric,
  frequency_minutes integer,
  is_active boolean,
  created_at timestamp
) AS $$
DECLARE
  v_where text := '';
  v_search_pattern text;
  v_sort_field text := 'created_at';
BEGIN
  IF p_search IS NOT NULL AND length(trim(p_search)) > 0 THEN
    v_search_pattern := '%' || replace(p_search, '%', '\%') || '%';
    v_where := format(' WHERE (route_code ILIKE %L OR name ILIKE %L OR start_location ILIKE %L OR end_location ILIKE %L)', v_search_pattern, v_search_pattern, v_search_pattern, v_search_pattern);
  END IF;

  -- additional optional filters
  IF p_start_location IS NOT NULL AND length(trim(p_start_location)) > 0 THEN
    IF v_where = '' THEN
      v_where := format(' WHERE start_location ILIKE %L', ('%' || replace(p_start_location, '%', '\%') || '%'));
    ELSE
      v_where := v_where || format(' AND start_location ILIKE %L', ('%' || replace(p_start_location, '%', '\%') || '%'));
    END IF;
  END IF;
  IF p_end_location IS NOT NULL AND length(trim(p_end_location)) > 0 THEN
    IF v_where = '' THEN
      v_where := format(' WHERE end_location ILIKE %L', ('%' || replace(p_end_location, '%', '\%') || '%'));
    ELSE
      v_where := v_where || format(' AND end_location ILIKE %L', ('%' || replace(p_end_location, '%', '\%') || '%'));
    END IF;
  END IF;
  IF p_min_distance IS NOT NULL THEN
    IF v_where = '' THEN
      v_where := format(' WHERE estimated_distance >= %s', p_min_distance);
    ELSE
      v_where := v_where || format(' AND estimated_distance >= %s', p_min_distance);
    END IF;
  END IF;
  IF p_max_distance IS NOT NULL THEN
    IF v_where = '' THEN
      v_where := format(' WHERE estimated_distance <= %s', p_max_distance);
    ELSE
      v_where := v_where || format(' AND estimated_distance <= %s', p_max_distance);
    END IF;
  END IF;
  IF p_is_active IS NOT NULL THEN
    IF v_where = '' THEN
      v_where := format(' WHERE is_active = %s', CASE WHEN p_is_active THEN 'TRUE' ELSE 'FALSE' END);
    ELSE
      v_where := v_where || format(' AND is_active = %s', CASE WHEN p_is_active THEN 'TRUE' ELSE 'FALSE' END);
    END IF;
  END IF;

  -- Set search path to tenant schema
  EXECUTE format('SET search_path TO %I, public', p_schema_name);

  -- allowlist sort fields
  IF p_sort IN ('created_at','route_code','estimated_distance','frequency_minutes','name') THEN
    v_sort_field := p_sort;
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT id, name, route_code, start_location, end_location, estimated_distance, frequency_minutes, is_active, created_at FROM %I.routes %s ORDER BY %s %s LIMIT %s OFFSET %s',
    p_schema_name, v_where, v_sort_field, CASE WHEN upper(p_dir) = 'ASC' THEN 'ASC' ELSE 'DESC' END, p_limit, p_offset
  );

  -- Reset search path
  SET search_path TO public;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_routes_count(
  p_schema_name text,
  p_search text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_min_distance numeric DEFAULT NULL,
  p_max_distance numeric DEFAULT NULL,
  p_start_location text DEFAULT NULL,
  p_end_location text DEFAULT NULL
)
RETURNS bigint AS $$
DECLARE
  v_count bigint;
  v_where text := '';
  v_search_pattern text;
BEGIN
  IF p_search IS NOT NULL AND length(trim(p_search)) > 0 THEN
    v_search_pattern := '%' || replace(p_search, '%', '\%') || '%';
    v_where := format(' WHERE (route_code ILIKE %L OR name ILIKE %L OR start_location ILIKE %L OR end_location ILIKE %L)', v_search_pattern, v_search_pattern, v_search_pattern, v_search_pattern);
  END IF;

  -- additional optional filters for count
  IF p_start_location IS NOT NULL AND length(trim(p_start_location)) > 0 THEN
    IF v_where = '' THEN
      v_where := format(' WHERE start_location ILIKE %L', ('%' || replace(p_start_location, '%', '\%') || '%'));
    ELSE
      v_where := v_where || format(' AND start_location ILIKE %L', ('%' || replace(p_start_location, '%', '\%') || '%'));
    END IF;
  END IF;
  IF p_end_location IS NOT NULL AND length(trim(p_end_location)) > 0 THEN
    IF v_where = '' THEN
      v_where := format(' WHERE end_location ILIKE %L', ('%' || replace(p_end_location, '%', '\%') || '%'));
    ELSE
      v_where := v_where || format(' AND end_location ILIKE %L', ('%' || replace(p_end_location, '%', '\%') || '%'));
    END IF;
  END IF;
  IF p_min_distance IS NOT NULL THEN
    IF v_where = '' THEN
      v_where := format(' WHERE estimated_distance >= %s', p_min_distance);
    ELSE
      v_where := v_where || format(' AND estimated_distance >= %s', p_min_distance);
    END IF;
  END IF;
  IF p_max_distance IS NOT NULL THEN
    IF v_where = '' THEN
      v_where := format(' WHERE estimated_distance <= %s', p_max_distance);
    ELSE
      v_where := v_where || format(' AND estimated_distance <= %s', p_max_distance);
    END IF;
  END IF;
  IF p_is_active IS NOT NULL THEN
    IF v_where = '' THEN
      v_where := format(' WHERE is_active = %s', CASE WHEN p_is_active THEN 'TRUE' ELSE 'FALSE' END);
    ELSE
      v_where := v_where || format(' AND is_active = %s', CASE WHEN p_is_active THEN 'TRUE' ELSE 'FALSE' END);
    END IF;
  END IF;

  EXECUTE format('SET search_path TO %I, public', p_schema_name);
  EXECUTE format('SELECT COUNT(*) FROM %I.routes %s', p_schema_name, v_where) INTO v_count;
  SET search_path TO public;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;
