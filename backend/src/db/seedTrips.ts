import dotenv from 'dotenv';
import pool, { query } from '../config/db';

dotenv.config();

(async () => {
  try {
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

    const r = await query('SELECT id FROM routes LIMIT 1');
    const t = await query('SELECT id FROM buses LIMIT 1');
    const routeId = r?.rows?.[0]?.id ?? null;
    const busId = t?.rows?.[0]?.id ?? null;
    const has = await query('SELECT * FROM trips LIMIT 1');
    if ((has?.rowCount ?? 0) === 0) {
      // Use parameterized times: departure now, arrival +1 hour via PostgreSQL
      await query(
        "INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, status) VALUES ($1,$2, now(), now() + interval '1 hour', $3, $4)",
        [routeId, busId, 100.0, 'scheduled'],
      );
      console.log('Trip seeded');
    } else {
      console.log('Trip already present');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('seedTrips failed', err);
    try {
      await pool.end();
    } catch (_) {
      // Intentionally left empty
    }
    process.exit(1);
  }
})();
