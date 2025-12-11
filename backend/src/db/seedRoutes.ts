import dotenv from 'dotenv';
import pool, { query } from '../config/db';

dotenv.config();

(async () => {
  try {
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

    const has = await query('SELECT * FROM routes LIMIT 1');
    if ((has?.rowCount ?? 0) === 0) {
      const op = await query('SELECT id FROM operators LIMIT 1');
      const opId = op?.rows?.[0]?.id ?? null;
      await query(
        'INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes) VALUES ($1,$2,$3,$4,$5)',
        [opId, 'City A', 'City B', 120, 150],
      );
      console.log('Route seeded');
    } else {
      console.log('Route already present');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('seedRoutes failed', err);
    try {
      await pool.end();
    } catch (_) {
      // Intentionally ignored
    }
    process.exit(1);
  }
})();
