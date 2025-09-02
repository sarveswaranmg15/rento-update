-- Tenant analytics function: returns metrics for a given schema
DROP FUNCTION IF EXISTS public.get_analytics_in_schema(text, integer);

CREATE OR REPLACE FUNCTION public.get_analytics_in_schema(p_schema text, p_days integer)
RETURNS TABLE(
  active_users bigint,
  total_users bigint,
  active_drivers bigint,
  avg_travel_seconds numeric,
  monthly_bookings jsonb,
  last_month_revenue numeric,
  current_pct numeric,
  usage_increase_pct numeric
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  has_users boolean;
  has_is_active boolean;
  has_role boolean;
  has_role_id boolean;
  has_bookings boolean;
  tcol_ts text; -- timestamp column used for bookings time
  has_duration_seconds boolean;
  has_duration_sec boolean;
  has_started_at boolean;
  has_ended_at boolean;
  sql_users text;
  sql_drivers text;
  sql_avg text;
  sql_monthly text;
  amt_col text;
  sql_revenue text;
  sql_count_curr text;
  sql_count_last text;
  sql_count_last7 text;
  sql_count_prev7 text;
  cnt_curr bigint := 0;
  cnt_last bigint := 0;
  cnt_last7 bigint := 0;
  cnt_prev7 bigint := 0;
  v_days integer := COALESCE(p_days, 30);
BEGIN
  IF p_schema IS NULL OR trim(p_schema) = '' THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint, 0::bigint, NULL::numeric, '[]'::jsonb, NULL::numeric, NULL::numeric, NULL::numeric; RETURN; 
  END IF;

  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'users') INTO has_users;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = p_schema AND table_name = 'bookings') INTO has_bookings;

  IF has_users THEN
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'is_active') INTO has_is_active;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'role') INTO has_role;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'users' AND column_name = 'role_id') INTO has_role_id;

    -- total/active users
    sql_users := format('SELECT count(*)::bigint AS total_users, sum(CASE %s THEN 1 ELSE 0 END)::bigint AS active_users FROM %I.users u',
      CASE WHEN has_is_active THEN 'u.is_active = TRUE' ELSE 'TRUE' END,
      p_schema);

    EXECUTE sql_users INTO total_users, active_users;

    -- active drivers (by role name via public.roles OR by users.role column)
    IF has_role_id THEN
      sql_drivers := format('SELECT sum(CASE WHEN %s THEN 1 ELSE 0 END)::bigint FROM %I.users u LEFT JOIN public.roles r ON r.id::text = u.role_id::text WHERE r.name ILIKE ''%%driver%%''',
        CASE WHEN has_is_active THEN 'u.is_active = TRUE' ELSE 'TRUE' END,
        p_schema);
    ELSIF has_role THEN
      sql_drivers := format('SELECT sum(CASE WHEN %s AND u.role ILIKE ''%%driver%%'' THEN 1 ELSE 0 END)::bigint FROM %I.users u',
        CASE WHEN has_is_active THEN 'u.is_active = TRUE' ELSE 'TRUE' END,
        p_schema);
    ELSE
      sql_drivers := 'SELECT 0::bigint';
    END IF;

    EXECUTE sql_drivers INTO active_drivers;
  ELSE
    total_users := 0; active_users := 0; active_drivers := 0;
  END IF;

  -- defaults
  avg_travel_seconds := NULL;
  monthly_bookings := '[]'::jsonb;
  last_month_revenue := NULL;
  current_pct := NULL;
  usage_increase_pct := NULL;

  IF has_bookings THEN
    -- detect timestamp column for time-bucketing
    tcol_ts := NULL;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'created_at') THEN tcol_ts := 'created_at'; END IF;
    IF tcol_ts IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'booked_at') THEN tcol_ts := 'booked_at'; END IF;
    IF tcol_ts IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'start_time') THEN tcol_ts := 'start_time'; END IF;
    IF tcol_ts IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'started_at') THEN tcol_ts := 'started_at'; END IF;

    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'duration_seconds') INTO has_duration_seconds;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'duration_sec') INTO has_duration_sec;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'started_at') INTO has_started_at;
    SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'ended_at') INTO has_ended_at;

    -- avg travel seconds over last p_days
    IF has_duration_seconds THEN
      sql_avg := format('SELECT avg(duration_seconds)::numeric FROM %I.bookings WHERE %s >= now() - ($1||'' days'')::interval', p_schema, COALESCE(tcol_ts,'created_at'));
      EXECUTE sql_avg USING v_days INTO avg_travel_seconds;
    ELSIF has_duration_sec THEN
      sql_avg := format('SELECT avg(duration_sec)::numeric FROM %I.bookings WHERE %s >= now() - ($1||'' days'')::interval', p_schema, COALESCE(tcol_ts,'created_at'));
      EXECUTE sql_avg USING v_days INTO avg_travel_seconds;
    ELSIF has_started_at AND has_ended_at THEN
      sql_avg := format('SELECT avg(EXTRACT(EPOCH FROM (ended_at - started_at)))::numeric FROM %I.bookings WHERE %s >= now() - ($1||'' days'')::interval', p_schema, COALESCE(tcol_ts,'started_at'));
      EXECUTE sql_avg USING v_days INTO avg_travel_seconds;
    END IF;

    -- monthly bookings for last 12 months
    IF tcol_ts IS NOT NULL THEN
      sql_monthly := format($SQL$
        WITH months AS (
          SELECT to_char(d, 'MON') AS mon, date_trunc('month', d) AS mstart
          FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') AS g(d)
        ), counts AS (
          SELECT date_trunc('month', %1$s)::date AS mstart, count(*)::int AS cnt
          FROM %2$I.bookings
          WHERE %1$s >= date_trunc('month', now()) - interval '11 months'
          GROUP BY 1
        )
        SELECT jsonb_agg(jsonb_build_object('month', mon, 'value', COALESCE(c.cnt,0)) ORDER BY mstart)
        FROM months m
        LEFT JOIN counts c ON c.mstart = m.mstart
      $SQL$, tcol_ts, p_schema);
      EXECUTE sql_monthly INTO monthly_bookings;

      -- detect amount column for revenue
      amt_col := NULL;
      IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'amount') THEN amt_col := 'amount'; END IF;
      IF amt_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'total_amount') THEN amt_col := 'total_amount'; END IF;
      IF amt_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'price') THEN amt_col := 'price'; END IF;
      IF amt_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'fare') THEN amt_col := 'fare'; END IF;
      IF amt_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'revenue') THEN amt_col := 'revenue'; END IF;
      IF amt_col IS NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_schema AND table_name = 'bookings' AND column_name = 'total_fare') THEN amt_col := 'total_fare'; END IF;

      IF amt_col IS NOT NULL THEN
        sql_revenue := format('SELECT COALESCE(sum(%1$I)::numeric,0) FROM %2$I.bookings WHERE %3$s >= date_trunc(''month'', now()) - interval ''1 month'' AND %3$s < date_trunc(''month'', now())', amt_col, p_schema, tcol_ts);
        EXECUTE sql_revenue INTO last_month_revenue;
      END IF;

      -- counts for current vs last month
      sql_count_curr := format('SELECT count(*)::bigint FROM %1$I.bookings WHERE %2$s >= date_trunc(''month'', now())', p_schema, tcol_ts);
      sql_count_last := format('SELECT count(*)::bigint FROM %1$I.bookings WHERE %2$s >= date_trunc(''month'', now()) - interval ''1 month'' AND %2$s < date_trunc(''month'', now())', p_schema, tcol_ts);
      EXECUTE sql_count_curr INTO cnt_curr;
      EXECUTE sql_count_last INTO cnt_last;
      IF cnt_last > 0 THEN
        current_pct := (cnt_curr::numeric / cnt_last::numeric) * 100.0;
      END IF;

      -- 7-day usage increase vs prior 7 days
      sql_count_last7 := format('SELECT count(*)::bigint FROM %1$I.bookings WHERE %2$s >= now() - interval ''7 days''', p_schema, tcol_ts);
      sql_count_prev7 := format('SELECT count(*)::bigint FROM %1$I.bookings WHERE %2$s >= now() - interval ''14 days'' AND %2$s < now() - interval ''7 days''', p_schema, tcol_ts);
      EXECUTE sql_count_last7 INTO cnt_last7;
      EXECUTE sql_count_prev7 INTO cnt_prev7;
      IF cnt_prev7 > 0 THEN
        usage_increase_pct := ((cnt_last7 - cnt_prev7)::numeric / cnt_prev7::numeric) * 100.0;
      END IF;
    END IF;
  END IF;

  RETURN;
END;
$$;