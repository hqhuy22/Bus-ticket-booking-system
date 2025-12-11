import dotenv from 'dotenv';
import pool, { query } from '../config/db';

dotenv.config();

(async () => {
  try {
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

    const res = await query('SELECT * FROM operators LIMIT 1');
    if ((res?.rowCount ?? 0) === 0) {
      await query(
        'INSERT INTO operators (name, contact_email, contact_phone, status, approved_at) VALUES ($1,$2,$3,$4,now())',
        ['Demo Operator', 'ops@example.com', '+10000000000', 'active'],
      );
      console.log('Operator seeded');
    } else {
      console.log('Operator already present');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('seedOperators failed', err);
    try {
      await pool.end();
    } catch (_) {
      // Intentionally ignored
    }
    process.exit(1);
  }
})();
