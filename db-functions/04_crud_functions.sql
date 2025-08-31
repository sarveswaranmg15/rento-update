-- ==================================
-- CRUD FUNCTIONS FOR UI FLOWS
-- ==================================

-- Creating comprehensive CRUD functions for all user flows mentioned in the documentation

-- ==================================
-- USER MANAGEMENT FUNCTIONS
-- ==================================

-- Function to create a new user (for Admin/HR onboarding)
CREATE OR REPLACE FUNCTION create_user(
    p_schema_name text,
    p_employee_id varchar(50),
    p_first_name varchar(100),
    p_last_name varchar(100),
    p_email varchar(255),
    p_phone varchar(20),
    p_password_hash varchar(255),
    p_role_name varchar(50),
    p_department varchar(100) DEFAULT NULL,
    p_designation varchar(100) DEFAULT NULL,
    p_created_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
    v_role_id uuid;
BEGIN
    -- Get role ID
    SELECT id INTO v_role_id FROM public.roles WHERE name = p_role_name;
    
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Insert user
    EXECUTE format('
        INSERT INTO %I.users (
            employee_id, first_name, last_name, email, phone, 
            password_hash, role_id, department, designation, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
    ', p_schema_name) 
    USING p_employee_id, p_first_name, p_last_name, p_email, p_phone, 
          p_password_hash, v_role_id, p_department, p_designation, p_created_by
    INTO v_user_id;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Adding update user function
CREATE OR REPLACE FUNCTION update_user(
    p_schema_name text,
    p_user_id uuid,
    p_first_name varchar(100) DEFAULT NULL,
    p_last_name varchar(100) DEFAULT NULL,
    p_email varchar(255) DEFAULT NULL,
    p_phone varchar(20) DEFAULT NULL,
    p_role_name varchar(50) DEFAULT NULL,
    p_department varchar(100) DEFAULT NULL,
    p_designation varchar(100) DEFAULT NULL,
    p_is_active boolean DEFAULT NULL,
    p_updated_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_role_id uuid;
    v_sql text;
    v_params text[];
    v_param_count integer := 0;
BEGIN
    -- Get role ID if role_name is provided
    IF p_role_name IS NOT NULL THEN
        SELECT id INTO v_role_id FROM public.roles WHERE name = p_role_name;
    END IF;
    
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Build dynamic update query
    v_sql := format('UPDATE %I.users SET updated_at = NOW()', p_schema_name);
    
    IF p_first_name IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', first_name = $%s', v_param_count);
        v_params[v_param_count] := p_first_name;
    END IF;
    
    IF p_last_name IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', last_name = $%s', v_param_count);
        v_params[v_param_count] := p_last_name;
    END IF;
    
    IF p_email IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', email = $%s', v_param_count);
        v_params[v_param_count] := p_email;
    END IF;
    
    IF p_phone IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', phone = $%s', v_param_count);
        v_params[v_param_count] := p_phone;
    END IF;
    
    IF v_role_id IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', role_id = $%s', v_param_count);
        v_params[v_param_count] := v_role_id::text;
    END IF;
    
    IF p_department IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', department = $%s', v_param_count);
        v_params[v_param_count] := p_department;
    END IF;
    
    IF p_designation IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', designation = $%s', v_param_count);
        v_params[v_param_count] := p_designation;
    END IF;
    
    IF p_is_active IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', is_active = $%s', v_param_count);
        v_params[v_param_count] := p_is_active::text;
    END IF;
    
    IF p_updated_by IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', updated_by = $%s', v_param_count);
        v_params[v_param_count] := p_updated_by::text;
    END IF;
    
    v_param_count := v_param_count + 1;
    v_sql := v_sql || format(' WHERE id = $%s', v_param_count);
    v_params[v_param_count] := p_user_id::text;
    
    -- Execute update (compatibility: expand params up to 8 to avoid VARIADIC keyword issues)
    IF v_param_count = 0 THEN
        EXECUTE v_sql;
    ELSIF v_param_count = 1 THEN
        EXECUTE v_sql USING v_params[1];
    ELSIF v_param_count = 2 THEN
        EXECUTE v_sql USING v_params[1], v_params[2];
    ELSIF v_param_count = 3 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3];
    ELSIF v_param_count = 4 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4];
    ELSIF v_param_count = 5 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5];
    ELSIF v_param_count = 6 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6];
    ELSIF v_param_count = 7 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6], v_params[7];
    ELSE
    -- Fallback: VARIADIC may not be supported in this PG environment; raise a descriptive error
    RAISE EXCEPTION 'Dynamic execute with % params not supported in this PostgreSQL environment (no VARIADIC support).', v_param_count;
    END IF;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Adding delete user function
CREATE OR REPLACE FUNCTION delete_user(
    p_schema_name text,
    p_user_id uuid,
    p_soft_delete boolean DEFAULT TRUE
)
RETURNS boolean AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    IF p_soft_delete THEN
        -- Soft delete - mark as inactive
        EXECUTE format('
            UPDATE %I.users 
            SET is_active = FALSE, updated_at = NOW() 
            WHERE id = $1
        ', p_schema_name) USING p_user_id;
    ELSE
        -- Hard delete
        EXECUTE format('DELETE FROM %I.users WHERE id = $1', p_schema_name) USING p_user_id;
    END IF;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Adding bulk user onboarding function
CREATE OR REPLACE FUNCTION bulk_create_users(
    p_schema_name text,
    p_users jsonb,
    p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(
    success_count integer,
    error_count integer,
    errors jsonb
) AS $$
DECLARE
    v_user jsonb;
    v_user_id uuid;
    v_role_id uuid;
    v_success_count integer := 0;
    v_error_count integer := 0;
    v_errors jsonb := '[]'::jsonb;
    v_error_msg text;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Loop through users array
    FOR v_user IN SELECT * FROM jsonb_array_elements(p_users)
    LOOP
        BEGIN
            -- Get role ID
            SELECT id INTO v_role_id FROM public.roles 
            WHERE name = (v_user->>'role_name');
            
            -- Insert user
            EXECUTE format('
                INSERT INTO %I.users (
                    employee_id, first_name, last_name, email, phone, 
                    password_hash, role_id, department, designation, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
            ', p_schema_name) 
            USING 
                v_user->>'employee_id',
                v_user->>'first_name',
                v_user->>'last_name',
                v_user->>'email',
                v_user->>'phone',
                v_user->>'password_hash',
                v_role_id,
                v_user->>'department',
                v_user->>'designation',
                p_created_by
            INTO v_user_id;
            
            v_success_count := v_success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_error_msg := SQLERRM;
            v_errors := v_errors || jsonb_build_object(
                'employee_id', v_user->>'employee_id',
                'error', v_error_msg
            );
        END;
    END LOOP;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN QUERY SELECT v_success_count, v_error_count, v_errors;
END;
$$ LANGUAGE plpgsql;

-- Function to get users with filters (for User Management page)
CREATE OR REPLACE FUNCTION get_users_filtered(
    p_schema_name text,
    p_role_name varchar(50) DEFAULT NULL,
    p_search_term varchar(255) DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    employee_id varchar(50),
    first_name varchar(100),
    last_name varchar(100),
    email varchar(255),
    phone varchar(20),
    role_name varchar(50),
    department varchar(100),
    is_active boolean,
    created_at timestamp
) AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    RETURN QUERY EXECUTE format('
        SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, u.phone,
               r.name as role_name, u.department, u.is_active, u.created_at
        FROM %I.users u
        LEFT JOIN public.roles r ON u.role_id = r.id
        WHERE ($1 IS NULL OR r.name = $1)
        AND ($2 IS NULL OR u.first_name ILIKE $2 OR u.last_name ILIKE $2 OR u.phone ILIKE $2)
        ORDER BY u.created_at DESC
        LIMIT $3 OFFSET $4
    ', p_schema_name)
    USING p_role_name, '%' || p_search_term || '%', p_limit, p_offset;
    
    -- Reset search path
    SET search_path TO public;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- BOOKING MANAGEMENT FUNCTIONS
-- ==================================

-- Function to create a booking (for HR/Employee booking rides)
CREATE OR REPLACE FUNCTION create_booking(
    p_schema_name text,
    p_user_id uuid,
    p_booking_type varchar(20),
    p_pickup_location varchar(255),
    p_pickup_lat numeric(10,8),
    p_pickup_lng numeric(11,8),
    p_dropoff_location varchar(255),
    p_dropoff_lat numeric(10,8),
    p_dropoff_lng numeric(11,8),
    p_scheduled_time timestamp,
    p_passenger_count integer DEFAULT 1,
    p_created_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_booking_id uuid;
    v_booking_number varchar(20);
BEGIN
    -- Generate booking number
    v_booking_number := 'BK' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                       LPAD(floor(random() * 10000)::text, 4, '0');
    
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Insert booking
    EXECUTE format('
        INSERT INTO %I.bookings (
            booking_number, user_id, booking_type, pickup_location, pickup_latitude, pickup_longitude,
            dropoff_location, dropoff_latitude, dropoff_longitude, scheduled_pickup_time, 
            passenger_count, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
    ', p_schema_name)
    USING v_booking_number, p_user_id, p_booking_type, p_pickup_location, p_pickup_lat, p_pickup_lng,
          p_dropoff_location, p_dropoff_lat, p_dropoff_lng, p_scheduled_time, p_passenger_count, p_created_by
    INTO v_booking_id;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql;

-- Adding update booking function
CREATE OR REPLACE FUNCTION update_booking(
    p_schema_name text,
    p_booking_id uuid,
    p_status varchar(20) DEFAULT NULL,
    p_driver_id uuid DEFAULT NULL,
    p_vehicle_id uuid DEFAULT NULL,
    p_estimated_cost numeric(10,2) DEFAULT NULL,
    p_actual_cost numeric(10,2) DEFAULT NULL,
    p_updated_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_sql text;
    v_params text[];
    v_param_count integer := 0;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Build dynamic update query
    v_sql := format('UPDATE %I.bookings SET updated_at = NOW()', p_schema_name);
    
    IF p_status IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', status = $%s', v_param_count);
        v_params[v_param_count] := p_status;
    END IF;
    
    IF p_driver_id IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', driver_id = $%s', v_param_count);
        v_params[v_param_count] := p_driver_id::text;
    END IF;
    
    IF p_vehicle_id IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', vehicle_id = $%s', v_param_count);
        v_params[v_param_count] := p_vehicle_id::text;
    END IF;
    
    IF p_estimated_cost IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', estimated_cost = $%s', v_param_count);
        v_params[v_param_count] := p_estimated_cost::text;
    END IF;
    
    IF p_actual_cost IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', actual_cost = $%s', v_param_count);
        v_params[v_param_count] := p_actual_cost::text;
    END IF;
    
    IF p_updated_by IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', updated_by = $%s', v_param_count);
        v_params[v_param_count] := p_updated_by::text;
    END IF;
    
    v_param_count := v_param_count + 1;
    v_sql := v_sql || format(' WHERE id = $%s', v_param_count);
    v_params[v_param_count] := p_booking_id::text;
    
    -- Execute update (compatibility: expand params up to 8 to avoid VARIADIC keyword issues)
    IF v_param_count = 0 THEN
        EXECUTE v_sql;
    ELSIF v_param_count = 1 THEN
        EXECUTE v_sql USING v_params[1];
    ELSIF v_param_count = 2 THEN
        EXECUTE v_sql USING v_params[1], v_params[2];
    ELSIF v_param_count = 3 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3];
    ELSIF v_param_count = 4 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4];
    ELSIF v_param_count = 5 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5];
    ELSIF v_param_count = 6 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6];
    ELSIF v_param_count = 7 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6], v_params[7];
    ELSE
    RAISE EXCEPTION 'Dynamic execute with % params not supported in this PostgreSQL environment (no VARIADIC support).', v_param_count;
    END IF;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Adding cancel booking function
CREATE OR REPLACE FUNCTION cancel_booking(
    p_schema_name text,
    p_booking_id uuid,
    p_cancellation_reason text DEFAULT NULL,
    p_cancelled_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Update booking status to cancelled
    EXECUTE format('
        UPDATE %I.bookings 
        SET status = ''cancelled'', 
            cancellation_reason = $2,
            cancelled_by = $3,
            cancelled_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND status IN (''pending'', ''confirmed'')
    ', p_schema_name) 
    USING p_booking_id, p_cancellation_reason, p_cancelled_by;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get booking history with filters
CREATE OR REPLACE FUNCTION get_booking_history(
    p_schema_name text,
    p_user_id uuid DEFAULT NULL,
    p_status varchar(20) DEFAULT NULL,
    p_search_term varchar(255) DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    booking_number varchar(20),
    user_name varchar(255),
    pickup_location varchar(255),
    dropoff_location varchar(255),
    scheduled_pickup_time timestamp,
    status varchar(20),
    estimated_cost numeric(10,2),
    created_at timestamp
) AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    RETURN QUERY EXECUTE format('
        SELECT b.id, b.booking_number, 
               CONCAT(u.first_name, '' '', u.last_name) as user_name,
               b.pickup_location, b.dropoff_location, b.scheduled_pickup_time,
               b.status, b.estimated_cost, b.created_at
        FROM %I.bookings b
        LEFT JOIN %I.users u ON b.user_id = u.id
        WHERE ($1 IS NULL OR b.user_id = $1)
        AND ($2 IS NULL OR b.status = $2)
        AND ($3 IS NULL OR b.pickup_location ILIKE $3 OR b.dropoff_location ILIKE $3)
        ORDER BY b.created_at DESC
        LIMIT $4 OFFSET $5
    ', p_schema_name, p_schema_name)
    USING p_user_id, p_status, '%' || p_search_term || '%', p_limit, p_offset;
    
    -- Reset search path
    SET search_path TO public;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- DRIVER MANAGEMENT FUNCTIONS
-- ==================================

-- Function to create a driver
CREATE OR REPLACE FUNCTION create_driver(
    p_schema_name text,
    p_user_id uuid,
    p_license_number varchar(50),
    p_license_expiry date,
    p_created_by uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    v_driver_id uuid;
    v_driver_code varchar(20);
BEGIN
    -- Generate driver code
    v_driver_code := 'DR' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                    LPAD(floor(random() * 1000)::text, 3, '0');
    
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Insert driver
    EXECUTE format('
        INSERT INTO %I.drivers (
            user_id, driver_code, license_number, license_expiry, created_by
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id
    ', p_schema_name)
    USING p_user_id, v_driver_code, p_license_number, p_license_expiry, p_created_by
    INTO v_driver_id;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN v_driver_id;
END;
$$ LANGUAGE plpgsql;

-- Adding update driver function
CREATE OR REPLACE FUNCTION update_driver(
    p_schema_name text,
    p_driver_id uuid,
    p_license_number varchar(50) DEFAULT NULL,
    p_license_expiry date DEFAULT NULL,
    p_status varchar(20) DEFAULT NULL,
    p_rating numeric(3,2) DEFAULT NULL,
    p_updated_by uuid DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_sql text;
    v_params text[];
    v_param_count integer := 0;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Build dynamic update query
    v_sql := format('UPDATE %I.drivers SET updated_at = NOW()', p_schema_name);
    
    IF p_license_number IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', license_number = $%s', v_param_count);
        v_params[v_param_count] := p_license_number;
    END IF;
    
    IF p_license_expiry IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', license_expiry = $%s', v_param_count);
        v_params[v_param_count] := p_license_expiry::text;
    END IF;
    
    IF p_status IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', status = $%s', v_param_count);
        v_params[v_param_count] := p_status;
    END IF;
    
    IF p_rating IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', rating = $%s', v_param_count);
        v_params[v_param_count] := p_rating::text;
    END IF;
    
    IF p_updated_by IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', updated_by = $%s', v_param_count);
        v_params[v_param_count] := p_updated_by::text;
    END IF;
    
    v_param_count := v_param_count + 1;
    v_sql := v_sql || format(' WHERE id = $%s', v_param_count);
    v_params[v_param_count] := p_driver_id::text;
    
    -- Execute update (compatibility: expand params up to 8 to avoid VARIADIC keyword issues)
    IF v_param_count = 0 THEN
        EXECUTE v_sql;
    ELSIF v_param_count = 1 THEN
        EXECUTE v_sql USING v_params[1];
    ELSIF v_param_count = 2 THEN
        EXECUTE v_sql USING v_params[1], v_params[2];
    ELSIF v_param_count = 3 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3];
    ELSIF v_param_count = 4 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4];
    ELSIF v_param_count = 5 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5];
    ELSIF v_param_count = 6 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6];
    ELSIF v_param_count = 7 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6], v_params[7];
    ELSE
    RAISE EXCEPTION 'Dynamic execute with % params not supported in this PostgreSQL environment (no VARIADIC support).', v_param_count;
    END IF;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Adding delete driver function
CREATE OR REPLACE FUNCTION delete_driver(
    p_schema_name text,
    p_driver_id uuid,
    p_soft_delete boolean DEFAULT TRUE
)
RETURNS boolean AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    IF p_soft_delete THEN
        -- Soft delete - mark as inactive
        EXECUTE format('
            UPDATE %I.drivers 
            SET status = ''inactive'', updated_at = NOW() 
            WHERE id = $1
        ', p_schema_name) USING p_driver_id;
    ELSE
        -- Hard delete
        EXECUTE format('DELETE FROM %I.drivers WHERE id = $1', p_schema_name) USING p_driver_id;
    END IF;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Adding bulk driver onboarding function
CREATE OR REPLACE FUNCTION bulk_create_drivers(
    p_schema_name text,
    p_drivers jsonb,
    p_created_by uuid DEFAULT NULL
)
RETURNS TABLE(
    success_count integer,
    error_count integer,
    errors jsonb
) AS $$
DECLARE
    v_driver jsonb;
    v_driver_id uuid;
    v_user_id uuid;
    v_driver_code varchar(20);
    v_success_count integer := 0;
    v_error_count integer := 0;
    v_errors jsonb := '[]'::jsonb;
    v_error_msg text;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Loop through drivers array
    FOR v_driver IN SELECT * FROM jsonb_array_elements(p_drivers)
    LOOP
        BEGIN
            -- Get user_id from employee_id
            EXECUTE format('SELECT id FROM %I.users WHERE employee_id = $1', p_schema_name)
            USING v_driver->>'employee_id' INTO v_user_id;
            
            IF v_user_id IS NULL THEN
                RAISE EXCEPTION 'User with employee_id % not found', v_driver->>'employee_id';
            END IF;
            
            -- Generate driver code
            v_driver_code := 'DR' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                            LPAD(floor(random() * 1000)::text, 3, '0');
            
            -- Insert driver
            EXECUTE format('
                INSERT INTO %I.drivers (
                    user_id, driver_code, license_number, license_expiry, created_by
                ) VALUES ($1, $2, $3, $4, $5) RETURNING id
            ', p_schema_name)
            USING 
                v_user_id,
                v_driver_code,
                v_driver->>'license_number',
                (v_driver->>'license_expiry')::date,
                p_created_by
            INTO v_driver_id;
            
            v_success_count := v_success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            v_error_count := v_error_count + 1;
            v_error_msg := SQLERRM;
            v_errors := v_errors || jsonb_build_object(
                'employee_id', v_driver->>'employee_id',
                'error', v_error_msg
            );
        END;
    END LOOP;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN QUERY SELECT v_success_count, v_error_count, v_errors;
END;
$$ LANGUAGE plpgsql;

-- Function to get drivers with filters
CREATE OR REPLACE FUNCTION get_drivers_filtered(
    p_schema_name text,
    p_search_term varchar(255) DEFAULT NULL,
    p_status varchar(20) DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE(
    id uuid,
    driver_code varchar(20),
    user_name varchar(255),
    phone varchar(20),
    license_number varchar(50),
    rating numeric(3,2),
    total_rides integer,
    status varchar(20),
    created_at timestamp
) AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    RETURN QUERY EXECUTE format('
        SELECT d.id, d.driver_code,
               CONCAT(u.first_name, '' '', u.last_name) as user_name,
               u.phone, d.license_number, d.rating, d.total_rides, d.status, d.created_at
        FROM %I.drivers d
        LEFT JOIN %I.users u ON d.user_id = u.id
        WHERE ($1 IS NULL OR u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.phone ILIKE $1)
        AND ($2 IS NULL OR d.status = $2)
        ORDER BY d.created_at DESC
        LIMIT $3 OFFSET $4
    ', p_schema_name, p_schema_name)
    USING '%' || p_search_term || '%', p_status, p_limit, p_offset;
    
    -- Reset search path
    SET search_path TO public;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- FAVORITE LOCATIONS & PAYMENT METHODS
-- ==================================

-- Function to add favorite location
CREATE OR REPLACE FUNCTION add_favorite_location(
    p_schema_name text,
    p_user_id uuid,
    p_location_name varchar(100),
    p_address text,
    p_latitude numeric(10,8),
    p_longitude numeric(11,8),
    p_is_home boolean DEFAULT false,
    p_is_work boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
    v_location_id uuid;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Insert favorite location
    EXECUTE format('
        INSERT INTO %I.favorite_locations (
            user_id, location_name, address, latitude, longitude, is_home, is_work
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    ', p_schema_name)
    USING p_user_id, p_location_name, p_address, p_latitude, p_longitude, p_is_home, p_is_work
    INTO v_location_id;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN v_location_id;
END;
$$ LANGUAGE plpgsql;

-- Adding update favorite location function
CREATE OR REPLACE FUNCTION update_favorite_location(
    p_schema_name text,
    p_location_id uuid,
    p_location_name varchar(100) DEFAULT NULL,
    p_address text DEFAULT NULL,
    p_latitude numeric(10,8) DEFAULT NULL,
    p_longitude numeric(11,8) DEFAULT NULL,
    p_is_home boolean DEFAULT NULL,
    p_is_work boolean DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_sql text;
    v_params text[];
    v_param_count integer := 0;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Build dynamic update query
    v_sql := format('UPDATE %I.favorite_locations SET updated_at = NOW()', p_schema_name);
    
    IF p_location_name IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', location_name = $%s', v_param_count);
        v_params[v_param_count] := p_location_name;
    END IF;
    
    IF p_address IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', address = $%s', v_param_count);
        v_params[v_param_count] := p_address;
    END IF;
    
    IF p_latitude IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', latitude = $%s', v_param_count);
        v_params[v_param_count] := p_latitude::text;
    END IF;
    
    IF p_longitude IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', longitude = $%s', v_param_count);
        v_params[v_param_count] := p_longitude::text;
    END IF;
    
    IF p_is_home IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', is_home = $%s', v_param_count);
        v_params[v_param_count] := p_is_home::text;
    END IF;
    
    IF p_is_work IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', is_work = $%s', v_param_count);
        v_params[v_param_count] := p_is_work::text;
    END IF;
    
    v_param_count := v_param_count + 1;
    v_sql := v_sql || format(' WHERE id = $%s', v_param_count);
    v_params[v_param_count] := p_location_id::text;
    
    -- Execute update (compatibility: expand params up to 8 to avoid VARIADIC keyword issues)
    IF v_param_count = 0 THEN
        EXECUTE v_sql;
    ELSIF v_param_count = 1 THEN
        EXECUTE v_sql USING v_params[1];
    ELSIF v_param_count = 2 THEN
        EXECUTE v_sql USING v_params[1], v_params[2];
    ELSIF v_param_count = 3 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3];
    ELSIF v_param_count = 4 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4];
    ELSIF v_param_count = 5 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5];
    ELSIF v_param_count = 6 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6];
    ELSIF v_param_count = 7 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6], v_params[7];
    ELSE
    RAISE EXCEPTION 'Dynamic execute with % params not supported in this PostgreSQL environment (no VARIADIC support).', v_param_count;
    END IF;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Adding delete favorite location function
CREATE OR REPLACE FUNCTION delete_favorite_location(
    p_schema_name text,
    p_location_id uuid
)
RETURNS boolean AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Delete favorite location
    EXECUTE format('DELETE FROM %I.favorite_locations WHERE id = $1', p_schema_name) 
    USING p_location_id;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to add favorite payment method
CREATE OR REPLACE FUNCTION add_favorite_payment_method(
    p_schema_name text,
    p_user_id uuid,
    p_payment_method varchar(50),
    p_provider_details jsonb DEFAULT NULL,
    p_is_default boolean DEFAULT false
)
RETURNS uuid AS $$
DECLARE
    v_payment_id uuid;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Insert favorite payment method
    EXECUTE format('
        INSERT INTO %I.favorite_payment_methods (
            user_id, payment_method, provider_details, is_default
        ) VALUES ($1, $2, $3, $4) RETURNING id
    ', p_schema_name)
    USING p_user_id, p_payment_method, p_provider_details, p_is_default
    INTO v_payment_id;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Adding update favorite payment method function
CREATE OR REPLACE FUNCTION update_favorite_payment_method(
    p_schema_name text,
    p_payment_id uuid,
    p_payment_method varchar(50) DEFAULT NULL,
    p_provider_details jsonb DEFAULT NULL,
    p_is_default boolean DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_sql text;
    v_params text[];
    v_param_count integer := 0;
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Build dynamic update query
    v_sql := format('UPDATE %I.favorite_payment_methods SET updated_at = NOW()', p_schema_name);
    
    IF p_payment_method IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', payment_method = $%s', v_param_count);
        v_params[v_param_count] := p_payment_method;
    END IF;
    
    IF p_provider_details IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', provider_details = $%s', v_param_count);
        v_params[v_param_count] := p_provider_details::text;
    END IF;
    
    IF p_is_default IS NOT NULL THEN
        v_param_count := v_param_count + 1;
        v_sql := v_sql || format(', is_default = $%s', v_param_count);
        v_params[v_param_count] := p_is_default::text;
    END IF;
    
    v_param_count := v_param_count + 1;
    v_sql := v_sql || format(' WHERE id = $%s', v_param_count);
    v_params[v_param_count] := p_payment_id::text;
    
    -- Execute update (compatibility: expand params up to 8 to avoid VARIADIC keyword issues)
    IF v_param_count = 0 THEN
        EXECUTE v_sql;
    ELSIF v_param_count = 1 THEN
        EXECUTE v_sql USING v_params[1];
    ELSIF v_param_count = 2 THEN
        EXECUTE v_sql USING v_params[1], v_params[2];
    ELSIF v_param_count = 3 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3];
    ELSIF v_param_count = 4 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4];
    ELSIF v_param_count = 5 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5];
    ELSIF v_param_count = 6 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6];
    ELSIF v_param_count = 7 THEN
        EXECUTE v_sql USING v_params[1], v_params[2], v_params[3], v_params[4], v_params[5], v_params[6], v_params[7];
    ELSE
    RAISE EXCEPTION 'Dynamic execute with % params not supported in this PostgreSQL environment (no VARIADIC support).', v_param_count;
    END IF;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Adding delete favorite payment method function
CREATE OR REPLACE FUNCTION delete_favorite_payment_method(
    p_schema_name text,
    p_payment_id uuid
)
RETURNS boolean AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Delete favorite payment method
    EXECUTE format('DELETE FROM %I.favorite_payment_methods WHERE id = $1', p_schema_name) 
    USING p_payment_id;
    
    -- Reset search path
    SET search_path TO public;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==================================
-- DASHBOARD ANALYTICS FUNCTIONS
-- ==================================

-- Function to get booking trends for dashboard
CREATE OR REPLACE FUNCTION get_booking_trends(
    p_schema_name text,
    p_days integer DEFAULT 30
)
RETURNS TABLE(
    booking_date date,
    total_bookings bigint,
    completed_bookings bigint,
    cancelled_bookings bigint
) AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    RETURN QUERY EXECUTE format('
        SELECT DATE(created_at) as booking_date,
               COUNT(*) as total_bookings,
               COUNT(CASE WHEN status = ''completed'' THEN 1 END) as completed_bookings,
               COUNT(CASE WHEN status = ''cancelled'' THEN 1 END) as cancelled_bookings
        FROM %I.bookings
        WHERE created_at >= CURRENT_DATE - INTERVAL ''%s days''
        GROUP BY DATE(created_at)
        ORDER BY booking_date DESC
    ', p_schema_name, p_days);
    
    -- Reset search path
    SET search_path TO public;
END;
$$ LANGUAGE plpgsql;

-- Adding driver activity analytics function
CREATE OR REPLACE FUNCTION get_driver_activity_trends(
    p_schema_name text,
    p_days integer DEFAULT 30
)
RETURNS TABLE(
    activity_date date,
    active_drivers bigint,
    total_rides bigint,
    avg_rating numeric(3,2)
) AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    RETURN QUERY EXECUTE format('
        SELECT DATE(r.created_at) as activity_date,
               COUNT(DISTINCT r.driver_id) as active_drivers,
               COUNT(r.id) as total_rides,
               AVG(r.driver_rating) as avg_rating
        FROM %I.rides r
        WHERE r.created_at >= CURRENT_DATE - INTERVAL ''%s days''
        AND r.status = ''completed''
        GROUP BY DATE(r.created_at)
        ORDER BY activity_date DESC
    ', p_schema_name, p_days);
    
    -- Reset search path
    SET search_path TO public;
END;
$$ LANGUAGE plpgsql;

-- Adding user onboarding trends function
CREATE OR REPLACE FUNCTION get_user_onboarding_trends(
    p_schema_name text,
    p_days integer DEFAULT 30
)
RETURNS TABLE(
    onboard_date date,
    new_users bigint,
    new_drivers bigint,
    total_users bigint
) AS $$
BEGIN
    -- Set search path to tenant schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    RETURN QUERY EXECUTE format('
        SELECT DATE(u.created_at) as onboard_date,
               COUNT(u.id) as new_users,
               COUNT(d.id) as new_drivers,
               (SELECT COUNT(*) FROM %I.users WHERE created_at <= DATE(u.created_at) + INTERVAL ''1 day'') as total_users
        FROM %I.users u
        LEFT JOIN %I.drivers d ON u.id = d.user_id AND DATE(u.created_at) = DATE(d.created_at)
        WHERE u.created_at >= CURRENT_DATE - INTERVAL ''%s days''
        GROUP BY DATE(u.created_at)
        ORDER BY onboard_date DESC
    ', p_schema_name, p_schema_name, p_schema_name, p_days);
    
    -- Reset search path
    SET search_path TO public;
END;
$$ LANGUAGE plpgsql;
