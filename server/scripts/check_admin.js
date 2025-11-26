import dotenv from 'dotenv';
dotenv.config();
import sequelize from '../config/postgres.js';
import Customer from '../models/Customer.js';

const check = async () => {
  try {
    await sequelize.authenticate();
    const admin = await Customer.findOne({ where: { username: 'admin' } });
    console.log('Admin record:', admin && admin.toJSON ? admin.toJSON() : admin);
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
};

check();
