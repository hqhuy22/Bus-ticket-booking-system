require('dotenv').config();
(async ()=>{
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || undefined,
    database: process.env.PG_DATABASE || 'bus_ticket_db',
  });
  try {
    const res = await pool.query('UPDATE users SET verified_at = NOW() WHERE email = $1', ['testuser@example.com']);
    console.log('updated rows:', res.rowCount);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
