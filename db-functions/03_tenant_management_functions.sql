-- ==================================
-- TENANT MANAGEMENT FUNCTIONS
-- ==================================

-- Function to onboard a new tenant
CREATE OR REPLACE FUNCTION onboard_tenant(
    p_company_name varchar(255),
    p_subdomain varchar(100),
    p_company_code varchar(20),
    p_contact_email varchar(255),
    p_contact_phone varchar(20) DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_city varchar(100) DEFAULT NULL,
    p_state varchar(100) DEFAULT NULL,
    p_created_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_tenant_id uuid;
    v_schema_name varchar(100);
BEGIN
    -- Generate schema name from subdomain
    v_schema_name := 'tenant_' || lower(p_subdomain);
    
    -- Insert tenant record
    INSERT INTO public.tenants (
        company_name, subdomain, schema_name, company_code,
        contact_email, contact_phone, address, city, state, created_by
    ) VALUES (
        p_company_name, p_subdomain, v_schema_name, p_company_code,
        p_contact_email, p_contact_phone, p_address, p_city, p_state, p_created_by
    ) RETURNING id INTO v_tenant_id;
    
    -- Create tenant schema and tables
    PERFORM create_tenant_tables(v_schema_name);
    
    -- Log the tenant creation
    INSERT INTO public.system_audit_logs (
        tenant_id, super_admin_id, action, resource_type, resource_id, details
    ) VALUES (
        v_tenant_id, p_created_by, 'CREATE', 'tenant', v_tenant_id,
        jsonb_build_object('company_name', p_company_name, 'subdomain', p_subdomain)
    );
    
    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant by subdomain
CREATE OR REPLACE FUNCTION get_tenant_by_subdomain(p_subdomain varchar(100))
RETURNS TABLE(
    id uuid,
    company_name varchar(255),
    schema_name varchar(100),
    status varchar(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.company_name, t.schema_name, t.status
    FROM public.tenants t
    WHERE t.subdomain = p_subdomain AND t.status = 'active';
END;
$$ LANGUAGE plpgsql;
