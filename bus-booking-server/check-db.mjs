import { Sequelize, DataTypes, Op } from 'sequelize';
import routeModel from './models/Route.js';
import busScheduleModel from './models/busSchedule.js';

// Initialize database connection
const sequelize = new Sequelize('bus_booking', 'postgres', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

const Route = routeModel(sequelize, DataTypes);
const BusSchedule = busScheduleModel(sequelize, DataTypes);

// Setup associations
Route.hasMany(BusSchedule, { foreignKey: 'routeId', as: 'schedules' });
BusSchedule.belongsTo(Route, { foreignKey: 'routeId', as: 'route' });

async function checkDatabase() {
  try {
    console.log('\n=== CHECK 1: Tìm routes có "Hà Nội" ===');
    const routes = await Route.findAll({
      where: {
        origin: { [Op.iLike]: '%Hà Nội%' }
      },
      limit: 10
    });
    console.log(`Found ${routes.length} routes from Hà Nội:`);
    routes.forEach(r => console.log(`  - ${r.origin} → ${r.destination}`));

    console.log('\n=== CHECK 2: Tìm routes có "Hải Phòng" ===');
    const routes2 = await Route.findAll({
      where: {
        destination: { [Op.iLike]: '%Hải Phòng%' }
      },
      limit: 10
    });
    console.log(`Found ${routes2.length} routes to Hải Phòng:`);
    routes2.forEach(r => console.log(`  - ${r.origin} → ${r.destination}`));

    console.log('\n=== CHECK 3: Tìm ALL schedules ngày 2/1/2026 ===');
    const allSchedules = await BusSchedule.findAll({
      where: {
        departure_time: {
          [Op.gte]: new Date('2026-01-02T00:00:00Z'),
          [Op.lt]: new Date('2026-01-03T00:00:00Z')
        }
      },
      include: [{
        model: Route,
        as: 'route',
        required: false
      }],
      limit: 20
    });
    console.log(`\nFound ${allSchedules.length} schedules on 2026-01-02:`);
    allSchedules.forEach(s => {
      console.log(`  - Route: ${s.route?.origin || 'N/A'} → ${s.route?.destination || 'N/A'}`);
      console.log(`    Time: ${s.departure_time} | Completed: ${s.isCompleted}`);
    });

    console.log('\n=== CHECK 4: Tìm schedules Hà Nội → Hải Phòng (bất kỳ ngày nào) ===');
    const specificSchedules = await BusSchedule.findAll({
      where: {
        isCompleted: false
      },
      include: [{
        model: Route,
        as: 'route',
        where: {
          origin: { [Op.iLike]: '%Hà Nội%' },
          destination: { [Op.iLike]: '%Hải Phòng%' }
        }
      }],
      order: [['departure_time', 'ASC']],
      limit: 10
    });
    console.log(`\nFound ${specificSchedules.length} schedules Hà Nội → Hải Phòng:`);
    specificSchedules.forEach(s => {
      console.log(`  - ${s.route.origin} → ${s.route.destination}`);
      console.log(`    Date: ${s.departure_time} | Price: ${s.price} | Seats: ${s.availableSeats}`);
    });

    console.log('\n=== CHECK 5: Tìm EXACT ngày 2/1/2026, Hà Nội → Hải Phòng ===');
    const exactSchedules = await BusSchedule.findAll({
      where: {
        departure_time: {
          [Op.gte]: new Date('2026-01-02T00:00:00Z'),
          [Op.lt]: new Date('2026-01-03T00:00:00Z')
        },
        isCompleted: false
      },
      include: [{
        model: Route,
        as: 'route',
        where: {
          origin: { [Op.iLike]: '%Hà Nội%' },
          destination: { [Op.iLike]: '%Hải Phòng%' }
        }
      }],
      order: [['departure_time', 'ASC']]
    });
    console.log(`\n✅ RESULT: Found ${exactSchedules.length} schedules`);
    if (exactSchedules.length === 0) {
      console.log('❌ NO SCHEDULES FOUND - This is why chatbot returns empty!');
    } else {
      console.log('✅ Schedules exist:');
      exactSchedules.forEach(s => {
        console.log(`  - ${s.route.origin} → ${s.route.destination}`);
        console.log(`    Time: ${s.departure_time} | Price: ${s.price}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
