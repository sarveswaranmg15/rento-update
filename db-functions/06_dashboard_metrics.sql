-- ==================================
-- DASHBOARD METRICS
-- Returns summary counts for a tenant and list of tenants
-- ==================================

-- Returns total drivers and total employees for a tenant schema
DROP FUNCTION IF EXISTS public.get_dashboard_counts;
CREATE OR REPLACE FUNCTION get_dashboard_counts(p_schema_name text)
RETURNS TABLE(
  total_drivers bigint,
  total_employees bigint
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT
      (SELECT COUNT(*) FROM %I.drivers) AS total_drivers,
      (SELECT COUNT(*) FROM %I.users) AS total_employees
  ', p_schema_name, p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Non-breaking v2: returns fleet manager percent change and total count (safer to deploy as new function)
-- (removed experimental v2 function; restoring original get_dashboard_changes below)

-- Returns driver related metrics: total drivers, total fleet managers (users with fleet_manager role), active drivers
CREATE OR REPLACE FUNCTION get_driver_metrics(p_schema_name text)
RETURNS TABLE(
  total_drivers bigint,
  total_fleet_managers bigint,
  active_drivers bigint
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT
      (SELECT COUNT(*) FROM %I.drivers) AS total_drivers,
      (SELECT COUNT(*) FROM %I.users u JOIN public.roles r ON u.role_id = r.id WHERE r.name = ''fleet_manager'') AS total_fleet_managers,
      (SELECT COUNT(*) FROM %I.drivers WHERE status = ''active'') AS active_drivers
  ', p_schema_name, p_schema_name, p_schema_name);
END;
$$ LANGUAGE plpgsql;

-- Returns recent payments for a tenant schema
CREATE OR REPLACE FUNCTION get_recent_payments(p_schema_name text, p_limit integer DEFAULT 5)
RETURNS TABLE(
  payment_number varchar,
  amount numeric,
  payment_method varchar,
  payment_date timestamp,
  payment_status varchar,
  payment_description text
) AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT payment_number, amount, payment_method, payment_date, COALESCE(payment_status, '''') as payment_status, payment_description FROM %I.payments WHERE payment_date IS NOT NULL ORDER BY payment_date DESC LIMIT %s',
    p_schema_name, p_limit
  );
END;
$$ LANGUAGE plpgsql;

-- Returns revenue summary and recent payment details for a tenant
CREATE OR REPLACE FUNCTION get_revenue_summary(p_schema_name text, p_days integer DEFAULT 30)
RETURNS TABLE(
  total_revenue numeric,
  recent_revenue numeric,
  recent_payment_method varchar,
  recent_payment_number varchar,
  recent_payment_date timestamp
) AS $$
DECLARE
  v_total numeric := 0;
  v_recent numeric := 0;
  v_method varchar := NULL;
  v_number varchar := NULL;
  v_date timestamp := NULL;
BEGIN
  -- Total revenue (captured/completed payments) minus refunds
  EXECUTE format(
    'SELECT COALESCE(SUM((amount - COALESCE(refund_amount,0))::numeric),0) FROM %I.payments WHERE COALESCE(payment_status,'''') IN (''captured'',''completed'')',
    p_schema_name
  ) INTO v_total;

  -- Revenue for the recent p_days window
  EXECUTE format(
    'SELECT COALESCE(SUM((amount - COALESCE(refund_amount,0))::numeric),0) FROM %I.payments WHERE COALESCE(payment_status,'''') IN (''captured'',''completed'') AND payment_date >= CURRENT_DATE - INTERVAL ''%s days''',
    p_schema_name, p_days
  ) INTO v_recent;

  -- Most recent payment details
  EXECUTE format(
    'SELECT payment_method, payment_number, payment_date FROM %I.payments WHERE COALESCE(payment_status,'''') IN (''captured'',''completed'') ORDER BY payment_date DESC LIMIT 1',
    p_schema_name
  ) INTO v_method, v_number, v_date;

  total_revenue := v_total;
  recent_revenue := v_recent;
  recent_payment_method := v_method;
  recent_payment_number := v_number;
  recent_payment_date := v_date;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Returns a list of tenants and basic metadata for Tenant History panel
CREATE OR REPLACE FUNCTION get_tenants_list()
RETURNS TABLE(
  id uuid,
  company_name varchar,
  subdomain varchar,
  schema_name varchar,
  created_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.company_name, t.subdomain, t.schema_name, t.created_at
  FROM public.tenants t
  WHERE t.status = 'active'
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Schema-scoped variant: return tenant metadata only for the provided schema
CREATE OR REPLACE FUNCTION get_tenants_list_for_schema(p_schema_name text)
RETURNS TABLE(
  id uuid,
  company_name varchar,
  subdomain varchar,
  schema_name varchar,
  created_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.company_name, t.subdomain, t.schema_name, t.created_at
  FROM public.tenants t
  WHERE t.status = 'active' AND t.schema_name = p_schema_name
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Returns percent change for drivers and employees comparing last `p_days` days to the previous `p_days` window
CREATE OR REPLACE FUNCTION get_dashboard_changes(p_schema_name text, p_days integer DEFAULT 7)
RETURNS TABLE(
  drivers_change numeric,
  employees_change numeric
) AS $$
DECLARE
  v_recent_drivers bigint;
  v_prev_drivers bigint;
  v_recent_employees bigint;
  v_prev_employees bigint;
BEGIN
  -- Count drivers created in the last p_days
  EXECUTE format('SELECT COUNT(*) FROM %I.drivers WHERE created_at >= CURRENT_DATE - INTERVAL ''%s days''', p_schema_name, p_days)
  INTO v_recent_drivers;

  -- Count drivers created in the previous window
  EXECUTE format('SELECT COUNT(*) FROM %I.drivers WHERE created_at >= CURRENT_DATE - INTERVAL ''%s days'' AND created_at < CURRENT_DATE - INTERVAL ''%s days''', p_schema_name, (p_days*2), p_days)
  INTO v_prev_drivers;

  -- Count employees created in the last p_days
  EXECUTE format('SELECT COUNT(*) FROM %I.users WHERE created_at >= CURRENT_DATE - INTERVAL ''%s days''', p_schema_name, p_days)
  INTO v_recent_employees;

  -- Count employees created in the previous window
  EXECUTE format('SELECT COUNT(*) FROM %I.users WHERE created_at >= CURRENT_DATE - INTERVAL ''%s days'' AND created_at < CURRENT_DATE - INTERVAL ''%s days''', p_schema_name, (p_days*2), p_days)
  INTO v_prev_employees;

  -- Compute percent change safely (if previous is 0, use recent * 100)
  IF v_prev_drivers = 0 THEN
    drivers_change := CASE WHEN v_recent_drivers = 0 THEN 0 ELSE v_recent_drivers * 100 END;
  ELSE
    drivers_change := ((v_recent_drivers::numeric - v_prev_drivers::numeric) / v_prev_drivers::numeric) * 100;
  END IF;

  IF v_prev_employees = 0 THEN
    employees_change := CASE WHEN v_recent_employees = 0 THEN 0 ELSE v_recent_employees * 100 END;
  ELSE
    employees_change := ((v_recent_employees::numeric - v_prev_employees::numeric) / v_prev_employees::numeric) * 100;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
