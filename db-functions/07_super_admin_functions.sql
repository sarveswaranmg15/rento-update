-- ==================================
-- SUPER ADMIN FUNCTIONS (PUBLIC SCHEMA)
-- ==================================
DROP FUNCTION IF EXISTS public.get_super_admin_by_email(varchar);
DROP FUNCTION IF EXISTS public.list_super_admins();

-- Returns a single super admin row by email
CREATE OR REPLACE FUNCTION public.get_super_admin_by_email(
    p_email varchar
)
RETURNS TABLE(
    id uuid,
    name varchar,
    email varchar,
    password_hash varchar,
    phone varchar,
    is_active boolean,
    last_login timestamp,
    created_at timestamp,
    updated_at timestamp
)
AS $$
BEGIN
    RETURN QUERY
    SELECT sa.id, sa.name, sa.email, sa.password_hash, sa.phone, sa.is_active, sa.last_login, sa.created_at, sa.updated_at
    FROM public.super_admins sa
    WHERE sa.email = p_email
    ORDER BY sa.id ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Returns all super admins, ordered by id
CREATE OR REPLACE FUNCTION public.list_super_admins()
RETURNS TABLE(
    id uuid,
    name varchar,
    email varchar,
    phone varchar,
    is_active boolean,
    last_login timestamp,
    created_at timestamp,
    updated_at timestamp
)
AS $$
BEGIN
    RETURN QUERY
    SELECT sa.id, sa.name, sa.email, sa.phone, sa.is_active, sa.last_login, sa.created_at, sa.updated_at
    FROM public.super_admins sa
    ORDER BY sa.id ASC;
END;
$$ LANGUAGE plpgsql;
