"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const booking_controller_1 = require("../controllers/booking.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const booking_validator_1 = require("../validators/booking.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const booking_service_1 = __importDefault(require("../services/booking.service"));
const ticket_service_1 = __importDefault(require("../services/ticket.service"));
const router = (0, express_1.Router)();
// Helper middleware: ensure authenticated user is booking owner or admin
async function requireBookingOwner(req, res, next) {
    const bookingId = req.params.id;
    // If user is authenticated, keep previous behavior (owner or admin)
    if (req.user) {
        try {
            const booking = await booking_service_1.default.getBookingDetails(bookingId);
            if (!booking)
                return res.status(404).json({ message: 'not found' });
            if (booking.user_id && req.user.id === booking.user_id)
                return next();
            if (req.user.role === 'admin')
                return next();
            return res.status(403).json({ message: 'Not authorized' });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ message: msg });
            return res.status(400).json({ message: msg });
        }
    }
    // For guests (no req.user), require booking reference and contact info to match
    try {
        // booking reference might be provided as header or param (param may be the ref already)
        const bookingRef = req.headers['x-booking-reference'] || req.params.id;
        const contactEmail = req.headers['x-contact-email'] || (req.body && req.body.contactEmail) || req.query.contactEmail;
        const contactPhone = req.headers['x-contact-phone'] || (req.body && req.body.contactPhone) || req.query.contactPhone;
        if (!bookingRef || (!contactEmail && !contactPhone))
            return res.status(401).json({ message: 'missing guest credentials' });
        const booking = await booking_service_1.default.getBookingDetails(bookingRef).catch(() => undefined);
        // If booking not found by id, try lookup by reference+contact
        let details = booking;
        if (!details) {
            details = await booking_service_1.default.getBookingDetails(bookingRef).catch(() => undefined);
        }
        // Use repository lookup by reference+contact for verification
        const found = await booking_service_1.default.getBookingDetails(bookingRef).catch(() => undefined);
        // Fallback to repository findByReferenceAndContact
        const candidate = await (await Promise.resolve().then(() => __importStar(require('../repositories/booking.repository')))).default.findByReferenceAndContact(bookingRef, {
            email: contactEmail ?? null,
            phone: contactPhone ?? null,
        }).catch(() => undefined);
        if (!candidate)
            return res.status(403).json({ message: 'Not authorized' });
        // attach a lightweight user marker for downstream handlers (guest)
        req.user = { id: `guest:${candidate.id}`, email: candidate.contact_email ?? undefined };
        return next();
    }
    catch (err) {
        const msg = err && err.message ? String(err.message) : 'internal error';
        if (msg.includes('not found'))
            return res.status(404).json({ message: msg });
        return res.status(400).json({ message: msg });
    }
}
// Initiate: allow guest checkout without authentication; validation still applies
router.post('/initiate', booking_controller_1.bookingValidate.initiate, (req, res) => {
    return booking_controller_1.DefaultBookingController.initiate(req, res);
});
// Lookup moved behind auth so only authenticated users can query bookings
// Guest lookup route removed - guests are not supported
// Guest lookup endpoint: POST /guest-lookup { bookingReference, contactEmail?, contactPhone? }
router.post('/guest-lookup', (0, validation_middleware_1.validateRequest)(booking_validator_1.validateGuestLookup, 'body'), (req, res) => {
    return booking_controller_1.DefaultBookingController.guestLookup(req, res);
});
// Protected routes (require authentication)
router.get('/me', auth_middleware_1.authMiddleware, (req, res) => {
    return booking_controller_1.DefaultBookingController.myBookings(req, res);
});
router.post('/:id/passengers', auth_middleware_1.optionalAuth, requireBookingOwner, booking_controller_1.bookingValidate.passengers, (req, res) => booking_controller_1.DefaultBookingController.addPassengers(req, res));
router.post('/:id/confirm', auth_middleware_1.optionalAuth, requireBookingOwner, booking_controller_1.bookingValidate.confirm, (req, res) => booking_controller_1.DefaultBookingController.confirm(req, res));
router.post('/:id/cancel', auth_middleware_1.optionalAuth, requireBookingOwner, (req, res) => {
    return booking_controller_1.DefaultBookingController.cancel(req, res);
});
router.get('/:id', auth_middleware_1.authMiddleware, requireBookingOwner, (req, res) => {
    return booking_controller_1.DefaultBookingController.getBooking(req, res);
});
router.post('/:id/refresh-lock', auth_middleware_1.authMiddleware, booking_controller_1.bookingValidate.refreshLock, (req, res) => booking_controller_1.DefaultBookingController.refreshLock(req, res));
// Resend ticket (owner or admin)
router.post('/:id/resend-ticket', auth_middleware_1.authMiddleware, requireBookingOwner, async (req, res) => {
    try {
        const bookingId = req.params.id;
        await ticket_service_1.default.sendTicketEmail(bookingId);
        return res.json({ message: 'ticket resent' });
    }
    catch (err) {
        const msg = err && err.message ? String(err.message) : 'internal error';
        if (msg.includes('not found'))
            return res.status(404).json({ message: msg });
        return res.status(400).json({ message: msg });
    }
});
exports.default = router;
