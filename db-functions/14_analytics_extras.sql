-- Extra analytics helpers
-- Company bookings distribution for a tenant schema
DROP FUNCTION IF EXISTS public.get_company_bookings_in_schema(text, integer);
CREATE OR REPLACE FUNCTION public.get_company_bookings_in_schema(p_schema text, p_days integer)
RETURNS TABLE(label text, value int)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  has_bookings boolean;
  tcol_ts text;
  comp_col text;
  v_days integer := COALESCE(p_days, 30);
  v_sql text;
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' THEN RETURN; END IF;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'bookings') INTO has_bookings;
  IF NOT has_bookings THEN RETURN; END IF;

  -- detect timestamp column
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'created_at') THEN tcol_ts := 'created_at'; END IF;
  IF tcol_ts IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'booked_at') THEN tcol_ts := 'booked_at'; END IF;
  IF tcol_ts IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'start_time') THEN tcol_ts := 'start_time'; END IF;
  IF tcol_ts IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'started_at') THEN tcol_ts := 'started_at'; END IF;
  IF tcol_ts IS NULL THEN tcol_ts := 'created_at'; END IF;

  -- detect company label column
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'company_name') THEN comp_col := 'company_name'; END IF;
  IF comp_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'company') THEN comp_col := 'company'; END IF;
  IF comp_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'organization') THEN comp_col := 'organization'; END IF;
  IF comp_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'org_name') THEN comp_col := 'org_name'; END IF;
  IF comp_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'client_name') THEN comp_col := 'client_name'; END IF;
  IF comp_col IS NULL THEN comp_col := NULL; END IF;

  IF comp_col IS NOT NULL THEN
    v_sql := format('SELECT COALESCE(%1$I, ''Unknown'')::text AS label, count(*)::int AS value FROM %2$I.bookings WHERE %3$I >= now() - ($1||'' days'')::interval GROUP BY 1 ORDER BY 2 DESC, 1 ASC LIMIT 12', comp_col, p_schema, tcol_ts);
    RETURN QUERY EXECUTE v_sql USING v_days;
  ELSE
    -- no recognizable company column; return single Unknown bucket
    v_sql := format('SELECT ''Unknown''::text AS label, count(*)::int AS value FROM %1$I.bookings WHERE %2$I >= now() - ($1||'' days'')::interval', p_schema, tcol_ts);
    RETURN QUERY EXECUTE v_sql USING v_days;
  END IF;
END;
$$;

-- Hex bins distribution based on pickup or user home coordinates
DROP FUNCTION IF EXISTS public.get_hex_bins_in_schema(text, integer);
CREATE OR REPLACE FUNCTION public.get_hex_bins_in_schema(p_schema text, p_days integer)
RETURNS TABLE(bin_x int, bin_y int, value int)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_days integer := COALESCE(p_days, 30);
  src_table text := NULL;
  lat_col text := NULL;
  lon_col text := NULL;
  tcol_ts text := NULL;
  v_sql text;
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' THEN RETURN; END IF;

  -- Prefer bookings pickup/start coordinates
  IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'bookings') THEN
    src_table := 'bookings';
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'created_at') THEN tcol_ts := 'created_at'; END IF;
    IF tcol_ts IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'started_at') THEN tcol_ts := 'started_at'; END IF;

    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'pickup_latitude') THEN lat_col := 'pickup_latitude'; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'pickup_longitude') THEN lon_col := 'pickup_longitude'; END IF;
    IF lat_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'start_latitude') THEN lat_col := 'start_latitude'; END IF;
    IF lon_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'start_longitude') THEN lon_col := 'start_longitude'; END IF;
    IF lat_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'pickup_lat') THEN lat_col := 'pickup_lat'; END IF;
    IF lon_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'pickup_lng') THEN lon_col := 'pickup_lng'; END IF;
  END IF;

  -- Fallback to users home coordinates
  IF (lat_col IS NULL OR lon_col IS NULL) AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'users') THEN
    src_table := 'users';
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'home_latitude') THEN lat_col := 'home_latitude'; END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'home_longitude') THEN lon_col := 'home_longitude'; END IF;
  END IF;

  IF src_table IS NULL OR lat_col IS NULL OR lon_col IS NULL THEN RETURN; END IF;

  IF src_table = 'bookings' AND tcol_ts IS NOT NULL THEN
    v_sql := format($SQL$
      WITH pts AS (
        SELECT %1$I AS lat, %2$I AS lon
        FROM %3$I.%4$I
        WHERE %5$I >= now() - ($1||' days')::interval
      ), rng AS (
        SELECT percentile_disc(0.5) WITHIN GROUP (ORDER BY lat) AS lat0,
               percentile_disc(0.5) WITHIN GROUP (ORDER BY lon) AS lon0
        FROM pts
      ), binned AS (
        SELECT floor((lat - rng.lat0) * 10)::int AS by,
               floor((lon - rng.lon0) * 10)::int AS bx
        FROM pts, rng
      ), counts AS (
        SELECT (bx - min(bx) OVER())::int AS bin_x,
               (by - min(by) OVER())::int AS bin_y,
               count(*)::int AS value
        FROM binned
        GROUP BY bx, by
      )
      SELECT bin_x, bin_y, value
      FROM counts
      ORDER BY value DESC
      LIMIT 64
    $SQL$, lat_col, lon_col, p_schema, src_table, tcol_ts);
    RETURN QUERY EXECUTE v_sql USING v_days;
  ELSE
    v_sql := format($SQL$
      WITH pts AS (
        SELECT %1$I AS lat, %2$I AS lon FROM %3$I.%4$I
      ), rng AS (
        SELECT percentile_disc(0.5) WITHIN GROUP (ORDER BY lat) AS lat0,
               percentile_disc(0.5) WITHIN GROUP (ORDER BY lon) AS lon0
        FROM pts
      ), binned AS (
        SELECT floor((lat - rng.lat0) * 10)::int AS by,
               floor((lon - rng.lon0) * 10)::int AS bx
        FROM pts, rng
      ), counts AS (
        SELECT (bx - min(bx) OVER())::int AS bin_x,
               (by - min(by) OVER())::int AS bin_y,
               count(*)::int AS value
        FROM binned
        GROUP BY bx, by
      )
      SELECT bin_x, bin_y, value
      FROM counts
      ORDER BY value DESC
      LIMIT 64
    $SQL$, lat_col, lon_col, p_schema, src_table);
    RETURN QUERY EXECUTE v_sql;
  END IF;
END;
$$;