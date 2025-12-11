import dotenv from 'dotenv';
import pool, { query } from '../config/db';
import bcrypt from 'bcrypt';

dotenv.config();

(async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
      process.exit(1);
    }

    // Ensure uuid generation function exists and users table exists
    // uuid_generate_v4() requires the uuid-ossp extension on Postgres
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
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

    const hashed = await bcrypt.hash(password, 10);
    // Upsert admin by email
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
    console.error('Seeding failed', err);
    try {
      await pool.end();
    } catch (_) {
      // ignore
    }
    process.exit(1);
  }
})();
