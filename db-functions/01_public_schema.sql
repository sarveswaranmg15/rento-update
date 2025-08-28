-- ==================================
-- PUBLIC SCHEMA - GLOBAL TABLES
-- Multi-tenant cab booking application
-- ==================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================
-- GLOBAL ADMIN MANAGEMENT
-- ==================================

CREATE TABLE IF NOT EXISTS public.super_admins (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name varchar(255) NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    phone varchar(20),
    is_active boolean DEFAULT true,
    last_login timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ==================================
-- TENANT MANAGEMENT
-- ==================================

CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name varchar(255) NOT NULL,
    subdomain varchar(100) UNIQUE NOT NULL,
    schema_name varchar(100) UNIQUE NOT NULL,
    company_code varchar(20) UNIQUE NOT NULL,
    contact_email varchar(255) NOT NULL,
    contact_phone varchar(20),
    address text,
    city varchar(100),
    state varchar(100),
    country varchar(100) DEFAULT 'India',
    postal_code varchar(20),
    status varchar(20) DEFAULT 'active',
    max_users integer DEFAULT 100,
    max_vehicles integer DEFAULT 10,
    max_drivers integer DEFAULT 20,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by uuid REFERENCES super_admins(id)
);

-- ==================================
-- GLOBAL ROLES & PERMISSIONS
-- ==================================

CREATE TABLE IF NOT EXISTS public.roles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name varchar(50) UNIQUE NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]' NOT NULL,
    is_system_role boolean DEFAULT false,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ==================================
-- ADMIN SESSIONS
-- ==================================

CREATE TABLE IF NOT EXISTS public.super_admin_sessions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    super_admin_id uuid REFERENCES super_admins(id) ON DELETE CASCADE,
    current_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
    session_token varchar(255) UNIQUE NOT NULL,
    ip_address inet,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ==================================
-- SYSTEM AUDIT LOGS
-- ==================================

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    super_admin_id uuid REFERENCES super_admins(id),
    action varchar(100) NOT NULL,
    resource_type varchar(50),
    resource_id uuid,
    details jsonb,
    ip_address inet,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ==================================
-- INDEXES FOR PERFORMANCE
-- ==================================

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON public.tenants(schema_name);
CREATE INDEX IF NOT EXISTS idx_super_admin_sessions_token ON public.super_admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_tenant ON public.system_audit_logs(tenant_id, created_at);

-- ==================================
-- DEFAULT ROLES
-- ==================================

INSERT INTO public.roles (name, description, permissions, is_system_role) VALUES
('admin', 'System Administrator', '["all"]', true),
('hr', 'Human Resources', '["user_management", "booking_management", "driver_management"]', true),
('employee', 'Employee', '["booking", "profile_management"]', true),
('fleet_manager', 'Fleet Manager', '["driver_management", "vehicle_management"]', true),
('driver', 'Driver', '["ride_management", "profile_management"]', true)
ON CONFLICT (name) DO NOTHING;
