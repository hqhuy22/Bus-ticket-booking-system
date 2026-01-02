import sequelize from '../config/postgres.js';

async function checkStatusValues() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const allowed = ['pending', 'confirmed', 'cancelled', 'completed', 'expired'];

    const [rows] = await sequelize.query(`SELECT DISTINCT status FROM bus_bookings;`);
    console.log('\nDistinct status values:');
    console.table(rows);

    const [badRows] = await sequelize.query(`
      SELECT id, status FROM bus_bookings
      WHERE status::text NOT IN (${allowed.map((v) => `'${v}'`).join(', ')});
    `);

    if (badRows.length === 0) {
      console.log('\nNo incompatible status values found.');
    } else {
      console.log('\nRows with incompatible status values (need manual review):');
      console.table(badRows);
    }
  } catch (err) {
    console.error('Error checking status values:', err.message);
    console.error(err);
  } finally {
    await sequelize.close();
    console.log('DB connection closed');
  }
}

checkStatusValues();
