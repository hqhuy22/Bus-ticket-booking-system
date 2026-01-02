/**
 * Test Helper - App Setup for Integration Tests
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Import routes
import busRoutes from '../../routes/busRoutes.js';
import busScheduleRoutes from '../../routes/busScheduleRoutes.js';
import busBookingRoutes from '../../routes/busBookingRoutes.js';

/**
 * Create Express app for testing (without database connections)
 */
export function createTestApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors());

  // Routes
  app.use('/api/buses', busRoutes);
  app.use('/api/bus-schedules', busScheduleRoutes);
  app.use('/api/bookings', busBookingRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
}

/**
 * Mock authentication middleware
 */
export function mockAuthMiddleware(userId = 1) {
  return (req, res, next) => {
    req.user = { id: userId };
    next();
  };
}

/**
 * Mock admin middleware
 */
export function mockAdminMiddleware() {
  return (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  };
}
