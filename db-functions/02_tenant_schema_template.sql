-- ==================================
-- TENANT SCHEMA TEMPLATE
-- Tables to be created in each tenant's schema
-- ==================================

-- Function to create all tenant-specific tables
CREATE OR REPLACE FUNCTION create_tenant_tables(p_schema_name text)
RETURNS void AS $$
BEGIN
    -- Create the tenant schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);
    
    -- Set search path to the new schema
    EXECUTE format('SET search_path TO %I, public', p_schema_name);
    
    -- Creating all tenant-specific tables
    
    -- Users table (tenant-specific)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            employee_id varchar(50) UNIQUE,
            first_name varchar(100) NOT NULL,
            last_name varchar(100) NOT NULL,
            email varchar(255) UNIQUE NOT NULL,
            phone varchar(20),
            password_hash varchar(255) NOT NULL,
            role_id uuid REFERENCES public.roles(id),
            department varchar(100),
            designation varchar(100),
            manager_id uuid REFERENCES %I.users(id),
            emergency_contact_name varchar(255),
            emergency_contact_phone varchar(20),
            home_address text,
            home_latitude numeric(10,8),
            home_longitude numeric(11,8),
            profile_image text,
            is_active boolean DEFAULT true,
            last_login timestamp,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
            created_by uuid REFERENCES %I.users(id),
            updated_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- Vehicles table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.vehicles (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            vehicle_number varchar(20) UNIQUE NOT NULL,
            vehicle_type varchar(50) NOT NULL,
            brand varchar(100),
            model varchar(100),
            year integer,
            capacity integer NOT NULL,
            fuel_type varchar(20) DEFAULT ''petrol'',
            color varchar(50),
            insurance_number varchar(100),
            insurance_expiry date,
            registration_expiry date,
            status varchar(20) DEFAULT ''available'',
            current_odometer integer DEFAULT 0,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
            created_by uuid REFERENCES %I.users(id),
            updated_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name);
    
    -- Drivers table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.drivers (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid REFERENCES %I.users(id) ON DELETE CASCADE,
            driver_code varchar(20) UNIQUE NOT NULL,
            license_number varchar(50) UNIQUE NOT NULL,
            license_type varchar(20) NOT NULL,
            license_expiry date NOT NULL,
            experience_years integer DEFAULT 0,
            rating numeric(3,2) DEFAULT 0.00,
            total_rides integer DEFAULT 0,
            total_distance numeric(10,2) DEFAULT 0.00,
            status varchar(20) DEFAULT ''off_duty'',
            current_location_lat numeric(10,8),
            current_location_lng numeric(11,8),
            last_location_update timestamp,
            shift_start_time time,
            shift_end_time time,
            working_days integer[] DEFAULT ''{1,2,3,4,5}'',
            is_active boolean DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
            created_by uuid REFERENCES %I.users(id),
            updated_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- Driver Vehicle Assignments
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.driver_vehicle_assignments (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            driver_id uuid REFERENCES %I.drivers(id) ON DELETE CASCADE,
            vehicle_id uuid REFERENCES %I.vehicles(id) ON DELETE CASCADE,
            assigned_at timestamp DEFAULT CURRENT_TIMESTAMP,
            unassigned_at timestamp,
            is_active boolean DEFAULT true,
            assigned_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- Routes table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.routes (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            name varchar(255) NOT NULL,
            description text,
            route_code varchar(20) UNIQUE NOT NULL,
            start_location varchar(255) NOT NULL,
            end_location varchar(255) NOT NULL,
            start_latitude numeric(10,8),
            start_longitude numeric(11,8),
            end_latitude numeric(10,8),
            end_longitude numeric(11,8),
            estimated_duration integer,
            estimated_distance numeric(8,2),
            route_type varchar(20) DEFAULT ''regular'',
            operating_days integer[] DEFAULT ''{1,2,3,4,5}'',
            start_time time,
            end_time time,
            frequency_minutes integer DEFAULT 30,
            is_active boolean DEFAULT true,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
            created_by uuid REFERENCES %I.users(id),
            updated_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name);
    
    -- Bookings table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.bookings (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            booking_number varchar(20) UNIQUE NOT NULL,
            user_id uuid REFERENCES %I.users(id) ON DELETE CASCADE,
            booking_type varchar(20) NOT NULL, -- ''normal'', ''pool''
            route_id uuid REFERENCES %I.routes(id),
            pickup_location varchar(255) NOT NULL,
            pickup_latitude numeric(10,8),
            pickup_longitude numeric(11,8),
            dropoff_location varchar(255) NOT NULL,
            dropoff_latitude numeric(10,8),
            dropoff_longitude numeric(11,8),
            scheduled_pickup_time timestamp,
            actual_pickup_time timestamp,
            estimated_arrival_time timestamp,
            actual_arrival_time timestamp,
            passenger_count integer DEFAULT 1,
            special_requirements text,
            priority_level integer DEFAULT 1,
            status varchar(20) DEFAULT ''pending'',
            cancellation_reason text,
            cancelled_by uuid REFERENCES %I.users(id),
            cancelled_at timestamp,
            estimated_cost numeric(10,2),
            actual_cost numeric(10,2),
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
            created_by uuid REFERENCES %I.users(id),
            updated_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- Pool Rides table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.pool_rides (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            pool_code varchar(20) UNIQUE NOT NULL,
            route_id uuid REFERENCES %I.routes(id),
            driver_id uuid REFERENCES %I.drivers(id),
            vehicle_id uuid REFERENCES %I.vehicles(id),
            max_passengers integer DEFAULT 4,
            current_passengers integer DEFAULT 0,
            scheduled_start_time timestamp NOT NULL,
            actual_start_time timestamp,
            estimated_end_time timestamp,
            actual_end_time timestamp,
            status varchar(20) DEFAULT ''open'',
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
            created_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- Pool Ride Bookings junction table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.pool_ride_bookings (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            pool_ride_id uuid REFERENCES %I.pool_rides(id) ON DELETE CASCADE,
            booking_id uuid REFERENCES %I.bookings(id) ON DELETE CASCADE,
            joined_at timestamp DEFAULT CURRENT_TIMESTAMP,
            left_at timestamp,
            status varchar(20) DEFAULT ''joined''
        )
    ', p_schema_name, p_schema_name, p_schema_name);
    
    -- Rides table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.rides (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            ride_number varchar(20) UNIQUE NOT NULL,
            booking_id uuid REFERENCES %I.bookings(id),
            pool_ride_id uuid REFERENCES %I.pool_rides(id),
            driver_id uuid REFERENCES %I.drivers(id),
            vehicle_id uuid REFERENCES %I.vehicles(id),
            route_id uuid REFERENCES %I.routes(id),
            start_time timestamp,
            end_time timestamp,
            start_location varchar(255),
            end_location varchar(255),
            start_latitude numeric(10,8),
            start_longitude numeric(11,8),
            end_latitude numeric(10,8),
            end_longitude numeric(11,8),
            start_odometer integer,
            end_odometer integer,
            distance_covered numeric(8,2),
            total_cost numeric(10,2),
            status varchar(20) DEFAULT ''scheduled'',
            driver_rating integer CHECK (driver_rating >= 1 AND driver_rating <= 5),
            passenger_rating integer CHECK (passenger_rating >= 1 AND passenger_rating <= 5),
            driver_feedback text,
            passenger_feedback text,
            route_data jsonb,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
            created_by uuid REFERENCES %I.users(id),
            updated_by uuid REFERENCES %I.users(id)
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- Ride Passengers table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.ride_passengers (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            ride_id uuid REFERENCES %I.rides(id) ON DELETE CASCADE,
            user_id uuid REFERENCES %I.users(id) ON DELETE CASCADE,
            booking_id uuid REFERENCES %I.bookings(id),
            pickup_location varchar(255),
            dropoff_location varchar(255),
            pickup_latitude numeric(10,8),
            pickup_longitude numeric(11,8),
            dropoff_latitude numeric(10,8),
            dropoff_longitude numeric(11,8),
            pickup_time timestamp,
            dropoff_time timestamp,
            status varchar(20) DEFAULT ''boarded'',
            seat_number integer,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- Favorite Locations table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.favorite_locations (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid REFERENCES %I.users(id) ON DELETE CASCADE,
            location_name varchar(100) NOT NULL,
            address text NOT NULL,
            latitude numeric(10,8),
            longitude numeric(11,8),
            is_home boolean DEFAULT false,
            is_work boolean DEFAULT false,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP
        )
    ', p_schema_name, p_schema_name);
    
    -- Favorite Payment Methods table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.favorite_payment_methods (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid REFERENCES %I.users(id) ON DELETE CASCADE,
            payment_method varchar(50) NOT NULL,
            provider_details jsonb,
            is_default boolean DEFAULT false,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP
        )
    ', p_schema_name, p_schema_name);
    
    -- Payments table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.payments (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            payment_number varchar(20) UNIQUE NOT NULL,
            booking_id uuid REFERENCES %I.bookings(id),
            ride_id uuid REFERENCES %I.rides(id),
            user_id uuid REFERENCES %I.users(id),
            amount numeric(10,2) NOT NULL,
            payment_type varchar(20) NOT NULL,
            payment_method varchar(20),
            payment_status varchar(20) DEFAULT ''pending'',
            transaction_id varchar(100),
            payment_date timestamp,
            refund_amount numeric(10,2) DEFAULT 0.00,
            refund_date timestamp,
            refund_reason text,
            payment_description text,
            metadata jsonb,
            created_at timestamp DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp DEFAULT CURRENT_TIMESTAMP
        )
    ', p_schema_name, p_schema_name, p_schema_name, p_schema_name);
    
    -- User Activity Logs table
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.user_logs (
            id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id uuid REFERENCES %I.users(id),
            action varchar(100) NOT NULL,
            resource_type varchar(50),
            resource_id uuid,
            details jsonb,
            ip_address inet,
            user_agent text,
            session_id varchar(100),
            created_at timestamp DEFAULT CURRENT_TIMESTAMP
        )
    ', p_schema_name, p_schema_name);
    
    -- Creating indexes for performance optimization
    
    -- User indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_users_email ON %I.users(email)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_users_role ON %I.users(role_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_users_active ON %I.users(is_active)', p_schema_name, p_schema_name);
    
    -- Booking indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_bookings_user ON %I.bookings(user_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_bookings_status ON %I.bookings(status)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_bookings_date ON %I.bookings(created_at)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_bookings_scheduled ON %I.bookings(scheduled_pickup_time)', p_schema_name, p_schema_name);
    
    -- Driver indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_drivers_user ON %I.drivers(user_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_drivers_status ON %I.drivers(status)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_drivers_location ON %I.drivers(current_location_lat, current_location_lng)', p_schema_name, p_schema_name);
    
    -- Vehicle indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_vehicles_status ON %I.vehicles(status)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_vehicles_number ON %I.vehicles(vehicle_number)', p_schema_name, p_schema_name);
    
    -- Ride indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_rides_booking ON %I.rides(booking_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_rides_driver ON %I.rides(driver_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_rides_status ON %I.rides(status)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_rides_date ON %I.rides(created_at)', p_schema_name, p_schema_name);
    
    -- Payment indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_payments_user ON %I.payments(user_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_payments_booking ON %I.payments(booking_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_payments_status ON %I.payments(payment_status)', p_schema_name, p_schema_name);
    
    -- User logs indexes
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_logs_user ON %I.user_logs(user_id)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_logs_date ON %I.user_logs(created_at)', p_schema_name, p_schema_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_logs_action ON %I.user_logs(action)', p_schema_name, p_schema_name);
    
    -- Reset search path
    SET search_path TO public;
    
    RAISE NOTICE 'Tenant schema % created successfully with all tables and indexes', p_schema_name;
END;
$$ LANGUAGE plpgsql;
