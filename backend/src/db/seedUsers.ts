import dotenv from 'dotenv';
import pool, { query } from '../config/db';
import bcrypt from 'bcrypt';

dotenv.config();

(async () => {
  try {
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

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'changeme';
    const hashed = await bcrypt.hash(password, 10);
    const res = await query('SELECT * FROM users WHERE email=$1', [email]);
    if ((res?.rowCount ?? 0) > 0) {
      await query('UPDATE users SET password_hash=$1, role=$2, verified_at=now() WHERE email=$3', [
        hashed,
        'admin',
        email,
      ]);
      console.log('Admin user updated');
    } else {
      await query(
        'INSERT INTO users (email, password_hash, role, verified_at) VALUES ($1,$2,$3,now())',
        [email, hashed, 'admin'],
      );
      console.log('Admin user created');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('seedUsers failed', err);
    try {
      await pool.end();
    } catch (_) {
      // Intentionally left empty to suppress errors during pool cleanup
    }
    process.exit(1);
  }
})();
