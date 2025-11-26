import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/postgres.js';
// import models so they are registered with sequelize
import '../models/Customer.js';
import '../models/busSchedule.js';
import '../models/busBooking.js';

const syncDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('Postgres connection OK.');
    // alter:true will try to keep existing data and adjust tables — safe for dev
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unable to sync DB:', err);
    process.exit(1);
  }
};

syncDb();
