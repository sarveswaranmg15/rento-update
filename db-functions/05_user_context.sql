-- ==================================
-- USER CONTEXT QUERY
-- Returns user details, role and permissions, and tenant info
-- ==================================

CREATE OR REPLACE FUNCTION get_user_context(
    p_schema_name text,
    p_email varchar
)
RETURNS TABLE(
    user_id uuid,
    first_name varchar,
    last_name varchar,
    email varchar,
    role_name varchar,
    permissions jsonb,
    tenant_id uuid,
    company_name varchar,
    subdomain varchar,
    schema_name varchar
) AS $$
BEGIN
    -- Set search path to tenant schema so %I.users resolves correctly
    EXECUTE format('SET search_path TO %I, public', p_schema_name);

    RETURN QUERY EXECUTE format('
        SELECT u.id, u.first_name, u.last_name, u.email,
               r.name as role_name, r.permissions,
               t.id as tenant_id, t.company_name, t.subdomain, t.schema_name
        FROM %I.users u
        LEFT JOIN public.roles r ON u.role_id = r.id
        LEFT JOIN public.tenants t ON t.schema_name = $2
        WHERE u.email = $1 AND u.is_active = true
        LIMIT 1
    ', p_schema_name) USING p_email, p_schema_name;

    -- Reset search path
    SET search_path TO public;
END;
$$ LANGUAGE plpgsql;
