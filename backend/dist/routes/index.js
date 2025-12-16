"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_controller_1 = __importDefault(require("../controllers/health.controller"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const admin_routes_1 = __importDefault(require("./admin.routes"));
const trip_routes_1 = __importDefault(require("./trip.routes"));
const booking_routes_1 = __importDefault(require("./booking.routes"));
const router = (0, express_1.Router)();
router.get('/health', health_controller_1.default.health);
router.use('/auth', auth_routes_1.default);
router.use('/admin', admin_routes_1.default);
router.use('/trips', trip_routes_1.default);
router.use('/bookings', booking_routes_1.default);
exports.default = router;
