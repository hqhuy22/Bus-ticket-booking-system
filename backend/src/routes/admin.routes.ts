import { Router } from 'express';
import AdminController from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import {
  validateScheduleTripInput,
  validateSeatConfigInput,
  validateScheduleQuery,
} from '../validators/trip.validator';

const router = Router();

// All admin routes protected
router.use(authMiddleware, requireRole('admin'));

// Operators
router.get('/operators', AdminController.listOperators);
router.post('/operators', AdminController.createOperator);
router.put('/operators/:id', AdminController.updateOperator);
router.delete('/operators/:id', AdminController.deleteOperator);

// Routes
router.get('/routes', AdminController.listRoutes);
router.post('/routes', AdminController.createRoute);
router.put('/routes/:id', AdminController.updateRoute);
router.delete('/routes/:id', AdminController.deleteRoute);

// Buses
router.get('/buses', AdminController.listBuses);
router.post('/buses', AdminController.createBus);
router.put('/buses/:id', AdminController.updateBus);
router.delete('/buses/:id', AdminController.deleteBus);

// Trips
router.get('/trips', AdminController.listTrips);
router.post('/trips', AdminController.createTrip);
router.put('/trips/:id', AdminController.updateTrip);
router.delete('/trips/:id', AdminController.deleteTrip);

// Trip scheduling
router.post(
  '/trips/schedule',
  validateRequest(validateScheduleTripInput, 'body'),
  AdminController.scheduleTrip,
);
router.put(
  '/trips/:id/schedule',
  validateRequest(validateScheduleTripInput, 'body'),
  AdminController.updateTripSchedule,
);
router.get(
  '/trips/schedule',
  validateRequest(validateScheduleQuery, 'query'),
  AdminController.getTripSchedule,
);
router.get(
  '/buses/:busId/schedule',
  validateRequest(validateScheduleQuery, 'query'),
  AdminController.getBusSchedule,
);

// Bus seat templates
router.post(
  '/buses/:busId/seats',
  validateRequest(validateSeatConfigInput, 'body'),
  AdminController.createBusSeatTemplate,
);
router.get('/buses/:busId/seats', AdminController.listBusSeatTemplates);
router.put(
  '/buses/:busId/seats/:seatId',
  validateRequest(validateSeatConfigInput, 'body'),
  AdminController.updateBusSeatTemplate,
);
router.delete('/buses/:busId/seats/:seatId', AdminController.deleteBusSeatTemplate);

// Route stops
router.post('/routes/:routeId/stops', AdminController.addRouteStop);
router.put('/routes/:routeId/stops/:stopId', AdminController.updateRouteStop);
router.delete('/routes/:routeId/stops/:stopId', AdminController.deleteRouteStop);

export default router;
