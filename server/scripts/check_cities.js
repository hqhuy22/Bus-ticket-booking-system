import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/postgres.js';

async function checkCities() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Get unique cities from routes
    const [cities] = await sequelize.query(`
      SELECT DISTINCT origin as city FROM routes
      UNION
      SELECT DISTINCT destination as city FROM routes
      ORDER BY city ASC
    `);

    console.log('🏙️  Cities currently in database:');
    console.log('━'.repeat(60));
    cities.forEach((c, i) => {
      console.log(`${i + 1}. ${c.city}`);
    });

    console.log('\n━'.repeat(60));
    console.log(`✅ Total: ${cities.length} cities`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCities();
