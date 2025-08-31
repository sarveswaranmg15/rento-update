-- Returns admin summary metrics: total_companies (tenants), total_hr (users with hr role per tenant), total_fleets (vehicles per tenant)
DROP FUNCTION IF EXISTS public.get_admin_metrics;

CREATE OR REPLACE FUNCTION public.get_admin_metrics(p_schema_name text)
RETURNS TABLE(
  total_companies bigint,
  total_hr bigint,
  total_fleets bigint,
  total_companies_change numeric,
  total_hr_change numeric,
  total_fleets_change numeric
) AS $$
DECLARE
  v_tenants bigint;
  v_tenants_recent bigint;
  v_tenants_prev bigint;
  v_hr bigint;
  v_hr_recent bigint;
  v_hr_prev bigint;
  v_fleets bigint;
  v_fleets_recent bigint;
  v_fleets_prev bigint;
BEGIN
  -- Total companies: count active tenants in public.tenants
  SELECT COUNT(*) INTO v_tenants FROM public.tenants WHERE status = 'active';

  -- Recent and previous window (30 days each)
  SELECT COUNT(*) INTO v_tenants_recent FROM public.tenants WHERE status = 'active' AND created_at >= now() - interval '30 days';
  SELECT COUNT(*) INTO v_tenants_prev FROM public.tenants WHERE status = 'active' AND created_at >= now() - interval '60 days' AND created_at < now() - interval '30 days';

  -- Set search path to tenant schema to count tenant-scoped users and vehicles
  EXECUTE format('SET search_path TO %I, public', p_schema_name);

  -- total HR users (role name 'hr')
  EXECUTE format('SELECT COUNT(*) FROM %I.users u JOIN public.roles r ON u.role_id = r.id WHERE r.name = %L', p_schema_name, 'hr') INTO v_hr;
  EXECUTE format('SELECT COUNT(*) FROM %I.users u JOIN public.roles r ON u.role_id = r.id WHERE r.name = %L AND u.created_at >= now() - interval ''30 days''', p_schema_name, 'hr') INTO v_hr_recent;
  EXECUTE format('SELECT COUNT(*) FROM %I.users u JOIN public.roles r ON u.role_id = r.id WHERE r.name = %L AND u.created_at >= now() - interval ''60 days'' AND u.created_at < now() - interval ''30 days''', p_schema_name, 'hr') INTO v_hr_prev;

  -- total fleets: count vehicles in tenant schema
  EXECUTE format('SELECT COUNT(*) FROM %I.vehicles', p_schema_name) INTO v_fleets;
  EXECUTE format('SELECT COUNT(*) FROM %I.vehicles v WHERE v.created_at >= now() - interval ''30 days''', p_schema_name) INTO v_fleets_recent;
  EXECUTE format('SELECT COUNT(*) FROM %I.vehicles v WHERE v.created_at >= now() - interval ''60 days'' AND v.created_at < now() - interval ''30 days''', p_schema_name) INTO v_fleets_prev;

  -- reset search_path
  SET search_path TO public;

  total_companies := COALESCE(v_tenants,0);
  total_hr := COALESCE(v_hr,0);
  total_fleets := COALESCE(v_fleets,0);

  -- compute percent change (recent vs previous).
  -- If previous window is zero and recent > 0, treat as 100% growth; if both zero, 0%.
  IF COALESCE(v_tenants_prev,0) = 0 THEN
    IF COALESCE(v_tenants_recent,0) = 0 THEN
      total_companies_change := 0;
    ELSE
      total_companies_change := 100;
    END IF;
  ELSE
    total_companies_change := ((COALESCE(v_tenants_recent,0) - COALESCE(v_tenants_prev,0))::numeric / COALESCE(v_tenants_prev,1)) * 100;
  END IF;

  IF COALESCE(v_hr_prev,0) = 0 THEN
    IF COALESCE(v_hr_recent,0) = 0 THEN
      total_hr_change := 0;
    ELSE
      total_hr_change := 100;
    END IF;
  ELSE
    total_hr_change := ((COALESCE(v_hr_recent,0) - COALESCE(v_hr_prev,0))::numeric / COALESCE(v_hr_prev,1)) * 100;
  END IF;

  IF COALESCE(v_fleets_prev,0) = 0 THEN
    IF COALESCE(v_fleets_recent,0) = 0 THEN
      total_fleets_change := 0;
    ELSE
      total_fleets_change := 100;
    END IF;
  ELSE
    total_fleets_change := ((COALESCE(v_fleets_recent,0) - COALESCE(v_fleets_prev,0))::numeric / COALESCE(v_fleets_prev,1)) * 100;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
