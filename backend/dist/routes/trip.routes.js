"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trip_controller_1 = require("../controllers/trip.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const trip_validator_1 = require("../validators/trip.validator");
const router = (0, express_1.Router)();
// Public trip endpoints
router.get('/search', (0, validation_middleware_1.validateRequest)(trip_validator_1.validateSearchInput, 'query'), (req, res) => {
    return trip_controller_1.DefaultTripController.searchTrips(req, res);
});
// use :id in the path per spec but the controller expects tripId param -> map it
router.get('/:id', (req, res) => {
    req.params.tripId = req.params.id;
    return trip_controller_1.DefaultTripController.getTripDetails(req, res);
});
router.get('/cities', (req, res) => {
    return trip_controller_1.DefaultTripController.getCitiesList(req, res);
});
router.get('/popular-routes', (req, res) => {
    return trip_controller_1.DefaultTripController.getPopularRoutes(req, res);
});
exports.default = router;
