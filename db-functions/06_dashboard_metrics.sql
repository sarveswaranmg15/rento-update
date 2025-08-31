-- ==================================
-- DASHBOARD METRICS
-- Returns summary counts for a tenant and list of tenants
-- ==================================

-- Returns total drivers and total employees for a tenant schema
CREATE OR REPLACE FUNCTION get_dashboard_counts(p_schema_name text)
RETURNS TABLE(
  total_drivers bigint,
  total_employees bigint
) AS $$
BEGIN
  -- Set search path to tenant schema for tenant-scoped tables
  EXECUTE format('SET search_path TO %I, public', p_schema_name);

  RETURN QUERY EXECUTE format('
    SELECT
      (SELECT COUNT(*) FROM %I.drivers) AS total_drivers,
      (SELECT COUNT(*) FROM %I.users) AS total_employees
  ', p_schema_name, p_schema_name);

  -- Reset search path
  SET search_path TO public;
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
