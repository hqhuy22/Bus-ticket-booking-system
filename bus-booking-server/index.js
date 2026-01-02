import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/postgres.js';
import migrateBookingSchema from './scripts/migrate_booking_schema.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import passport from './config/passport.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import customerRoutes from './routes/customerRoutes.js';
import homeRoutes from './routes/home.js';
import busScheduleRoutes from './routes/busScheduleRoutes.js';
import busBookingRoutes from './routes/busBookingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import busRoutes from './routes/busRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import seatLockRoutes from './routes/seatLockRoutes.js';
import notificationPreferencesRoutes from './routes/notificationPreferencesRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import microservicesRoutes from './routes/microservicesRoutes.js';
// Import model associations
import './models/associations.js';
// Import trip reminder scheduler
import { initializeTripReminderScheduler } from './utils/tripReminderScheduler.js';
// Import microservices
import { initializeMicroservices } from './microservices/index.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

// Quiet logs option: set QUIET_LOGS=true in .env to suppress verbose startup/testing logs
const QUIET_LOGS = process.env.QUIET_LOGS === 'true' || false;
if (QUIET_LOGS) {
  // preserve error and warn
  console._log = console.log;
  console._table = console.table;
  console.log = () => {};
  console.table = () => {};
  console.info = () => {};
}

// Initialize Postgres connection
const initDB = async () => {
  try {
    await sequelize.authenticate();
    // Run the safe booking schema migration (this handles enum migrations safely)
    await migrateBookingSchema(false);
    // After migration, sync remaining models
    await sequelize.sync({ alter: true });
    console.log('Postgres connected and synced');
  } catch (err) {
    console.error('Postgres connection error:', err.message);
    process.exit(1);
  }
};

initDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Session middleware for Passport
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Swagger API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Bus Ticket Booking API Docs',
  })
);

// JSON endpoint for OpenAPI spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/', homeRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/', busScheduleRoutes);
app.use('/api/bookings', busBookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/', busRoutes);
app.use('/api/', routeRoutes);
app.use('/api/seats', seatLockRoutes);
// Also expose seat routes at /seats for frontend calls that omit the /api prefix
app.use('/seats', seatLockRoutes);
app.use('/api/notification-preferences', notificationPreferencesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/microservices', microservicesRoutes);

app.use((err, req, res, _next) => {
  // Log full error for easier debugging in development
  console.error(' Error:', err && err.stack ? err.stack : err);
  res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
});

app.listen(port, () => console.log(` Server running on http://localhost:${port}`));

// Initialize microservices architecture
initializeMicroservices();

// Initialize trip reminder scheduler
initializeTripReminderScheduler();

// Global error handlers to capture unexpected errors during development
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});
