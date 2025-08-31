-- Non-breaking v2: create-only file for safe deployment
-- Creates get_dashboard_changes_v2 which returns fleet_managers_change and total_fleet_managers

CREATE OR REPLACE FUNCTION public.get_dashboard_changes_v2(
  p_schema_name text,
  p_days integer DEFAULT 7,
  p_search text DEFAULT NULL,
  p_role_name text DEFAULT 'fleet_manager'
)
RETURNS TABLE(
  fleet_managers_change numeric,
  total_fleet_managers bigint
) AS $$
DECLARE
  v_recent_fleet bigint;
  v_prev_fleet bigint;
  v_total_fleet bigint;
  v_where text := '';
  v_search_pattern text;
BEGIN
  -- Build optional search filter (applies to user fields commonly present in tenant.users)
  -- Use first_name, last_name, email, employee_id to avoid referencing columns that may not exist in tenant schemas
  IF p_search IS NOT NULL AND length(trim(p_search)) > 0 THEN
    v_search_pattern := '%' || replace(p_search, '%', '\%') || '%';
    v_where := format(
      ' AND (u.first_name ILIKE %L OR u.last_name ILIKE %L OR u.email ILIKE %L OR u.employee_id ILIKE %L)',
      v_search_pattern, v_search_pattern, v_search_pattern, v_search_pattern
    );
  END IF;

  -- Set search path to tenant schema
  EXECUTE format('SET search_path TO %I, public', p_schema_name);

  -- Count fleet managers created in the last p_days (apply optional search filter)
  EXECUTE format(
    'SELECT COUNT(*) FROM %I.users u JOIN public.roles r ON u.role_id = r.id WHERE r.name = %L AND u.created_at >= CURRENT_DATE - INTERVAL ''%s days'' %s',
    p_schema_name, p_role_name, p_days, v_where
  )
  INTO v_recent_fleet;

  -- Count fleet managers created in the previous window (apply same filter)
  EXECUTE format(
    'SELECT COUNT(*) FROM %I.users u JOIN public.roles r ON u.role_id = r.id WHERE r.name = %L AND u.created_at >= CURRENT_DATE - INTERVAL ''%s days'' AND u.created_at < CURRENT_DATE - INTERVAL ''%s days'' %s',
    p_schema_name, p_role_name, (p_days*2), p_days, v_where
  )
  INTO v_prev_fleet;

  -- Total fleet managers (all time) with optional filter applied
  EXECUTE format(
    'SELECT COUNT(*) FROM %I.users u JOIN public.roles r ON u.role_id = r.id WHERE r.name = %L %s',
    p_schema_name, p_role_name, v_where
  )
  INTO v_total_fleet;

  -- Compute percent change safely: if previous is 0 and recent > 0, treat as 100% increase
  IF v_prev_fleet = 0 THEN
    IF v_recent_fleet = 0 THEN
      fleet_managers_change := 0;
    ELSE
      fleet_managers_change := 100;
    END IF;
  ELSE
    fleet_managers_change := ((v_recent_fleet::numeric - v_prev_fleet::numeric) / v_prev_fleet::numeric) * 100;
  END IF;

  -- Reset search path
  SET search_path TO public;

  total_fleet_managers := v_total_fleet;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
