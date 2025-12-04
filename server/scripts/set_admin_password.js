import dotenv from 'dotenv';
dotenv.config();
import sequelize from '../config/postgres.js';
import Customer from '../models/Customer.js';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

const run = async () => {
  try {
    await sequelize.authenticate();
    const admin = await Customer.findOne({ where: { email: ADMIN_EMAIL } });
    if (!admin) {
      console.error('Admin not found');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(ADMIN_PASSWORD, salt);
    await admin.save();
    console.log('Admin password updated for', admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
};

run();
