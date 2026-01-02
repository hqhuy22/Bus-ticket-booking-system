import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || 5432}/${process.env.PG_DATABASE}`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  // By default keep SQL logging off to reduce console noise.
  // If you need verbose SQL for debugging, set environment variable SQL_LOGGING=true
  logging: process.env.SQL_LOGGING === 'true' ? (msg) => console.log('[sequelize]', msg) : false,
});

export default sequelize;
