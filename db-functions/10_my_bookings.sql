-- Returns bookings for a tenant with optional filters
CREATE OR REPLACE FUNCTION public.get_my_bookings(
  p_schema_name text,
  p_user_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_sort text DEFAULT 'created_at',
  p_dir text DEFAULT 'desc'
)
RETURNS TABLE(
  id uuid,
  booking_number varchar,
  pickup_location text,
  dropoff_location text,
  scheduled_pickup_time timestamp,
  status varchar,
  estimated_cost numeric,
  driver_name varchar,
  created_at timestamp
) AS $$
DECLARE
  v_sql text;
  v_sort text;
  v_dir text;
  v_has_driver_id boolean := false;
BEGIN
  -- allowlist sort columns
  CASE lower(coalesce(p_sort,''))
    WHEN 'created_at' THEN v_sort := 'created_at';
    WHEN 'pickup_location' THEN v_sort := 'pickup_location';
    WHEN 'dropoff_location' THEN v_sort := 'dropoff_location';
    WHEN 'estimated_cost' THEN v_sort := 'estimated_cost';
    WHEN 'booking_number' THEN v_sort := 'booking_number';
    ELSE v_sort := 'created_at';
  END CASE;

  IF lower(coalesce(p_dir,'')) IN ('asc','desc') THEN
    v_dir := lower(p_dir);
  ELSE
    v_dir := 'desc';
  END IF;

  -- detect if bookings table has driver_id column in the tenant schema
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = p_schema_name
      AND table_name = 'bookings'
      AND column_name = 'driver_id'
  ) INTO v_has_driver_id;

  -- Build base query depending on whether driver_id exists
  IF v_has_driver_id THEN
    v_sql := format(
      'SELECT b.id::uuid, b.booking_number::varchar, b.pickup_location::text, b.dropoff_location::text, b.scheduled_pickup_time::timestamp, b.status::varchar, b.estimated_cost::numeric, COALESCE(CONCAT(d.first_name, '' '', d.last_name), '''')::varchar AS driver_name, b.created_at::timestamp FROM %I.bookings b LEFT JOIN %I.drivers d ON b.driver_id = d.id',
      p_schema_name, p_schema_name
    );
  ELSE
    v_sql := format(
      'SELECT b.id::uuid, b.booking_number::varchar, b.pickup_location::text, b.dropoff_location::text, b.scheduled_pickup_time::timestamp, b.status::varchar, b.estimated_cost::numeric, ''''::varchar AS driver_name, b.created_at::timestamp FROM %I.bookings b',
      p_schema_name
    );
  END IF;

  -- Apply filters
  IF p_user_id IS NOT NULL OR p_status IS NOT NULL OR (p_search IS NOT NULL AND length(trim(p_search))>0) THEN
    v_sql := v_sql || ' WHERE 1=1';
    IF p_user_id IS NOT NULL THEN
      v_sql := v_sql || ' AND b.user_id = $1';
    END IF;
    IF p_status IS NOT NULL THEN
      IF p_user_id IS NOT NULL THEN
        v_sql := v_sql || ' AND b.status = $2';
      ELSE
        v_sql := v_sql || ' AND b.status = $1';
      END IF;
    END IF;
    IF p_search IS NOT NULL AND length(trim(p_search))>0 THEN
      IF p_user_id IS NOT NULL AND p_status IS NOT NULL THEN
        v_sql := v_sql || ' AND (b.pickup_location ILIKE $3 OR b.dropoff_location ILIKE $3 OR b.booking_number ILIKE $3)';
      ELSIF (p_user_id IS NOT NULL AND p_status IS NULL) OR (p_user_id IS NULL AND p_status IS NOT NULL) THEN
        v_sql := v_sql || ' AND (b.pickup_location ILIKE $2 OR b.dropoff_location ILIKE $2 OR b.booking_number ILIKE $2)';
      ELSE
        v_sql := v_sql || ' AND (b.pickup_location ILIKE $1 OR b.dropoff_location ILIKE $1 OR b.booking_number ILIKE $1)';
      END IF;
    END IF;
  END IF;

  -- Order and paginate using safe identifiers
  v_sql := v_sql || ' ORDER BY ' || quote_ident(v_sort) || ' ' || v_dir || ' LIMIT ' || p_limit::text || ' OFFSET ' || p_offset::text;

  -- Execute with correct USING arguments
  IF p_user_id IS NOT NULL AND p_status IS NOT NULL AND (p_search IS NOT NULL AND length(trim(p_search))>0) THEN
    RETURN QUERY EXECUTE v_sql USING p_user_id, p_status, concat('%', p_search, '%');
  ELSIF p_user_id IS NOT NULL AND p_status IS NOT NULL THEN
    RETURN QUERY EXECUTE v_sql USING p_user_id, p_status;
  ELSIF p_user_id IS NOT NULL AND (p_search IS NOT NULL AND length(trim(p_search))>0) THEN
    RETURN QUERY EXECUTE v_sql USING p_user_id, concat('%', p_search, '%');
  ELSIF p_status IS NOT NULL AND (p_search IS NOT NULL AND length(trim(p_search))>0) THEN
    RETURN QUERY EXECUTE v_sql USING p_status, concat('%', p_search, '%');
  ELSIF p_user_id IS NOT NULL THEN
    RETURN QUERY EXECUTE v_sql USING p_user_id;
  ELSIF p_status IS NOT NULL THEN
    RETURN QUERY EXECUTE v_sql USING p_status;
  ELSIF (p_search IS NOT NULL AND length(trim(p_search))>0) THEN
    RETURN QUERY EXECUTE v_sql USING concat('%', p_search, '%');
  ELSE
    RETURN QUERY EXECUTE v_sql;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;