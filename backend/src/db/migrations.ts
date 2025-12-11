import { query } from '../config/db';

// A minimal idempotent schema runner based on provided ERD.
export async function runMigrations() {
  // Create extensions if needed
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  await query(`
  CREATE TABLE IF NOT EXISTS operators (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    contact_email text,
    contact_phone text,
    status text,
    approved_at timestamptz
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS routes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
    origin text NOT NULL,
    destination text NOT NULL,
    distance_km integer,
    estimated_minutes integer
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS route_stops (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
    stop_name text NOT NULL,
    stop_order integer NOT NULL,
    pickup_time_offset integer DEFAULT 0,
    stop_type text NOT NULL CHECK (stop_type IN ('pickup', 'dropoff', 'both')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE (route_id, stop_order)
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS buses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id uuid REFERENCES operators(id) ON DELETE SET NULL,
    plate_number text,
    model text,
    seat_capacity integer,
    amenities_json text
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS seats (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
    seat_code text,
    seat_type text,
    is_active boolean DEFAULT true
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS seat_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
    seat_code text NOT NULL,
    row_number integer,
    column_number integer,
    seat_type text NOT NULL CHECK (seat_type IN ('standard', 'vip', 'sleeper')),
    position text CHECK (position IN ('window', 'aisle', 'middle')),
    price_modifier numeric(10,4) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE (bus_id, seat_code)
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS trips (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
    bus_id uuid REFERENCES buses(id) ON DELETE SET NULL,
    departure_time timestamptz,
    arrival_time timestamptz,
    base_price numeric(10,2),
    status text
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE,
    phone text,
    password_hash text,
  verified_at timestamptz,
    role text,
    created_at timestamptz DEFAULT now()
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    token uuid UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    used boolean DEFAULT false
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS payment_methods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    provider text,
    token text,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS feedbacks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    rating integer,
    comment text,
    submitted_at timestamptz DEFAULT now()
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
    status text,
    total_amount numeric(12,2),
    booked_at timestamptz DEFAULT now()
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    provider text,
    transaction_ref text,
    amount numeric(12,2),
    status text,
    processed_at timestamptz
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    channel text,
    template text,
    status text,
    sent_at timestamptz
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS passenger_details (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    full_name text,
    document_id text,
    seat_code text
  );
  `);

  await query(`
  CREATE TABLE IF NOT EXISTS seat_statuses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
    seat_id uuid REFERENCES seats(id) ON DELETE CASCADE,
    state text,
    booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
    locked_until timestamptz
  );
  `);
}
