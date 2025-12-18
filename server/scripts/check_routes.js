import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/postgres.js';

async function checkRoutes() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Query routes
    const [routes] = await sequelize.query(`
      SELECT r.*, COUNT(rs.id) as stop_count
      FROM routes r
      LEFT JOIN route_stops rs ON r.id = rs."routeId"
      GROUP BY r.id
      ORDER BY r."routeNo" ASC
    `);

    console.log(`📊 Total Routes: ${routes.length}\n`);
    console.log('━'.repeat(60));

    for (const route of routes) {
      console.log(`\n🛣️  Route ${route.routeNo}: ${route.routeName}`);
      console.log(`   📍 ${route.origin} → ${route.destination}`);
      console.log(`   📏 Distance: ${route.distance}km | Duration: ${route.estimatedDuration}`);
      console.log(`   Status: ${route.status}`);

      // Get stops for this route
      const [stops] = await sequelize.query(`
        SELECT * FROM route_stops
        WHERE "routeId" = ${route.id}
        ORDER BY "stopOrder" ASC
      `);

      if (stops && stops.length > 0) {
        console.log(`   🚏 Stops (${stops.length}):`);
        stops.forEach((stop) => {
          const icon =
            stop.stopType === 'pickup' ? '🔵' : stop.stopType === 'dropoff' ? '🔴' : '🟢';
          console.log(
            `      ${icon} ${stop.stopOrder}. ${stop.stopName} (${stop.stopType}) - Arrive: ${stop.arrivalTime}, Depart: ${stop.departureTime}`
          );
        });
      } else {
        console.log(`   ⚠️  No stops defined`);
      }
    }

    console.log('\n' + '━'.repeat(60));
    console.log(`✅ Total ${routes.length} routes displayed`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkRoutes();
