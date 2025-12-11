import dotenv from 'dotenv';
import pool, { query } from '../config/db';

dotenv.config();

(async () => {
  try {
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

    const has = await query('SELECT * FROM buses LIMIT 1');
    if ((has?.rowCount ?? 0) === 0) {
      // find an operator
      const op = await query('SELECT id FROM operators LIMIT 1');
      const opId = op?.rows?.[0]?.id ?? null;
      await query(
        'INSERT INTO buses (operator_id, plate_number, model, seat_capacity) VALUES ($1,$2,$3,$4)',
        [opId, 'ABC-123', 'DemoBus 1', 40],
      );
      console.log('Bus seeded');
    } else {
      console.log('Bus already present');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('seedBuses failed', err);
    try {
      await pool.end();
    } catch (_) {
      // Intentionally left empty
    }
    process.exit(1);
  }
})();
