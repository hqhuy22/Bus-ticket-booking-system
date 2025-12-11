import dotenv from 'dotenv';
import pool from '../config/db';
import { runMigrations } from './migrations';

// Load environment variables
dotenv.config();

(async () => {
  try {
    // Ensure DB pool can connect
    await pool.connect();
    // Run migrations
    // eslint-disable-next-line no-console
    console.log('Running DB migrations...');
    await runMigrations();
    // eslint-disable-next-line no-console
    console.log('Migrations finished');
    // Close pool
    await pool.end();
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Migration failed', err);
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
})();
