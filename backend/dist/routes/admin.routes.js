"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = __importDefault(require("../controllers/admin.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const trip_validator_1 = require("../validators/trip.validator");
const router = (0, express_1.Router)();
// All admin routes protected
router.use(auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)('admin'));
// Operators
router.get('/operators', admin_controller_1.default.listOperators);
router.post('/operators', admin_controller_1.default.createOperator);
router.put('/operators/:id', admin_controller_1.default.updateOperator);
router.delete('/operators/:id', admin_controller_1.default.deleteOperator);
// Routes
router.get('/routes', admin_controller_1.default.listRoutes);
router.post('/routes', admin_controller_1.default.createRoute);
router.put('/routes/:id', admin_controller_1.default.updateRoute);
router.delete('/routes/:id', admin_controller_1.default.deleteRoute);
// Buses
router.get('/buses', admin_controller_1.default.listBuses);
router.post('/buses', admin_controller_1.default.createBus);
router.put('/buses/:id', admin_controller_1.default.updateBus);
router.delete('/buses/:id', admin_controller_1.default.deleteBus);
// Trips
router.get('/trips', admin_controller_1.default.listTrips);
router.post('/trips', admin_controller_1.default.createTrip);
router.put('/trips/:id', admin_controller_1.default.updateTrip);
router.delete('/trips/:id', admin_controller_1.default.deleteTrip);
// Trip scheduling
router.post('/trips/schedule', (0, validation_middleware_1.validateRequest)(trip_validator_1.validateScheduleTripInput, 'body'), admin_controller_1.default.scheduleTrip);
router.put('/trips/:id/schedule', (0, validation_middleware_1.validateRequest)(trip_validator_1.validateScheduleTripInput, 'body'), admin_controller_1.default.updateTripSchedule);
router.get('/trips/schedule', (0, validation_middleware_1.validateRequest)(trip_validator_1.validateScheduleQuery, 'query'), admin_controller_1.default.getTripSchedule);
router.get('/buses/:busId/schedule', (0, validation_middleware_1.validateRequest)(trip_validator_1.validateScheduleQuery, 'query'), admin_controller_1.default.getBusSchedule);
// Bookings (admin)
router.get('/bookings', admin_controller_1.default.getAllBookings);
router.get('/bookings/:id', admin_controller_1.default.getBookingById);
router.post('/bookings/:id/cancel', admin_controller_1.default.cancelBookingAdmin);
router.patch('/bookings/:id/status', admin_controller_1.default.updateBookingStatus);
// Bus seat templates
router.post('/buses/:busId/seats', (0, validation_middleware_1.validateRequest)(trip_validator_1.validateSeatConfigInput, 'body'), admin_controller_1.default.createBusSeatTemplate);
router.get('/buses/:busId/seats', admin_controller_1.default.listBusSeatTemplates);
router.put('/buses/:busId/seats/:seatId', (0, validation_middleware_1.validateRequest)(trip_validator_1.validateSeatConfigInput, 'body'), admin_controller_1.default.updateBusSeatTemplate);
router.delete('/buses/:busId/seats/:seatId', admin_controller_1.default.deleteBusSeatTemplate);
// Route stops
router.post('/routes/:routeId/stops', admin_controller_1.default.addRouteStop);
router.put('/routes/:routeId/stops/:stopId', admin_controller_1.default.updateRouteStop);
router.delete('/routes/:routeId/stops/:stopId', admin_controller_1.default.deleteRouteStop);
exports.default = router;
