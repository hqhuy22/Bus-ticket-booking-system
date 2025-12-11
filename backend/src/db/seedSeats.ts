import dotenv from 'dotenv';
import pool, { query } from '../config/db';

dotenv.config();

(async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS seats (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        bus_id uuid REFERENCES buses(id) ON DELETE CASCADE,
        seat_code text,
        seat_type text,
        is_active boolean DEFAULT true
      );
    `);

    const b = await query('SELECT id FROM buses LIMIT 1');
    const busId = b?.rows?.[0]?.id ?? null;
    if (busId) {
      const has = await query('SELECT * FROM seats WHERE bus_id=$1 LIMIT 1', [busId]);
      if ((has?.rowCount ?? 0) === 0) {
        const seats = ['1A', '1B', '1C', '1D'];
        for (const s of seats) {
          await query('INSERT INTO seats (bus_id, seat_code, seat_type) VALUES ($1,$2,$3)', [
            busId,
            s,
            'standard',
          ]);
        }
        console.log('Seats seeded');
      } else {
        console.log('Seats already present');
      }
    } else {
      console.log('No bus found, skipping seats');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('seedSeats failed', err);
    try {
      await pool.end();
    } catch (_) {
      // Intentionally ignored
    }
    process.exit(1);
  }
})();
