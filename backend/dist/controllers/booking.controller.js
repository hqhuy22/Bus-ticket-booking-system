"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingValidate = exports.DefaultBookingController = void 0;
const booking_service_1 = __importDefault(require("../services/booking.service"));
const booking_repository_1 = __importDefault(require("../repositories/booking.repository"));
const booking_validator_1 = require("../validators/booking.validator");
const validation_middleware_1 = require("../middlewares/validation.middleware");
class BookingController {
    // Initiate booking: create pending booking and lock seats. Returns booking with sessionId in response.
    async initiate(req, res) {
        try {
            const body = req.validatedBody ?? req.body;
            const userId = req.user?.id ?? null;
            const { tripId, seatIds, contactEmail, contactPhone, sessionId } = body;
            const booking = await booking_service_1.default.createBooking(userId, tripId, seatIds, { email: contactEmail, phone: contactPhone }, sessionId);
            // return booking and sessionId so client can refresh locks
            return res.status(201).json({ booking, sessionId: sessionId ?? null });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ message: msg });
            return res.status(400).json({ message: msg });
        }
    }
    // Add passenger details to a booking
    async addPassengers(req, res) {
        try {
            const bookingId = req.params.id;
            const body = req.validatedBody ?? req.body;
            const passengers = body.passengers;
            // Map camelCase fields from client (fullName, documentId, seatCode) to
            // snake_case expected by repository/service (full_name, document_id, seat_code).
            const mappedPassengers = (passengers || []).map((p) => ({
                full_name: p.fullName ?? p.full_name,
                document_id: p.documentId ?? p.document_id ?? null,
                seat_code: p.seatCode ?? p.seat_code,
                phone: p.phone ?? null,
            }));
            await booking_service_1.default.addPassengerDetails(bookingId, mappedPassengers);
            const updated = await booking_repository_1.default.getBookingById(bookingId);
            return res.json({ booking: updated });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ message: msg });
            return res.status(400).json({ message: msg });
        }
    }
    // Confirm booking
    async confirm(req, res) {
        try {
            const bookingId = req.params.id;
            const body = req.validatedBody ?? req.body;
            const { paymentProvider, transactionRef, amount } = body;
            const paymentPayload = paymentProvider || transactionRef
                ? {
                    provider: paymentProvider,
                    transaction_ref: transactionRef,
                    amount: amount ?? 0,
                }
                : undefined;
            const details = await booking_service_1.default.confirmBooking(bookingId, paymentPayload);
            return res.json(details);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ message: msg });
            if (msg.includes('expired'))
                return res.status(400).json({ message: msg });
            return res.status(400).json({ message: msg });
        }
    }
    // Get booking details. Require auth or valid session (session via query/sessionId header or booking.contact info)
    async getBooking(req, res) {
        try {
            const bookingId = req.params.id;
            if (!bookingId)
                return res.status(400).json({ message: 'missing id' });
            // Allow guests to lookup by booking_reference + contact info passed in headers or query
            // If the requester is authenticated and is owner/admin, return details
            try {
                const details = await booking_service_1.default.getBookingDetails(bookingId);
                return res.json(details);
            }
            catch (e) {
                // Not found by id — try to lookup by booking_reference + contact info from query/body/headers
            }
            const ref = bookingId;
            const contactEmail = req.query.contactEmail || req.headers['x-contact-email'] || (req.body && req.body.contactEmail);
            const contactPhone = req.query.contactPhone || req.headers['x-contact-phone'] || (req.body && req.body.contactPhone);
            if (!contactEmail && !contactPhone)
                return res.status(404).json({ message: 'not found' });
            const details = await booking_repository_1.default.findByReferenceAndContact(ref, {
                email: contactEmail,
                phone: contactPhone,
            });
            if (!details)
                return res.status(404).json({ message: 'not found' });
            return res.json(details);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ message: msg });
            return res.status(400).json({ message: msg });
        }
    }
    // Allow guests to lookup booking by reference + contact via POST body (safer than query)
    async guestLookup(req, res) {
        try {
            const body = req.validatedBody ?? req.body;
            const { bookingReference, contactEmail, contactPhone } = body;
            if (!bookingReference)
                return res.status(400).json({ message: 'missing bookingReference' });
            if (!contactEmail && !contactPhone)
                return res.status(400).json({ message: 'missing contact info' });
            const details = await booking_repository_1.default.findByReferenceAndContact(bookingReference, {
                email: contactEmail ?? null,
                phone: contactPhone ?? null,
            });
            if (!details)
                return res.status(404).json({ message: 'not found' });
            return res.json(details);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ message: msg });
            return res.status(400).json({ message: msg });
        }
    }
    // Get current user's booking history (requires auth)
    async myBookings(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'unauthenticated' });
            const userId = req.user.id;
            const status = req.query.status || undefined;
            const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10) || 1) : 1;
            const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10) || 25) : 25;
            const offset = (page - 1) * limit;
            const result = await booking_service_1.default.getUserBookingHistory(userId, { status, limit, offset });
            return res.json({ items: result.items, total: result.total, page, limit });
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: err && err.message ? String(err.message) : 'internal error' });
        }
    }
    // Cancel booking: require owner or admin
    async cancel(req, res) {
        try {
            const bookingId = req.params.id;
            if (!req.user)
                return res.status(401).json({ message: 'unauthenticated' });
            await booking_service_1.default.cancelBooking(bookingId, req.user.id);
            return res.json({ message: 'cancelled' });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ message: msg });
            if (msg.includes('Not authorized'))
                return res.status(403).json({ message: msg });
            return res.status(400).json({ message: msg });
        }
    }
    // Guest lookup removed: only authenticated users can query bookings
    // Refresh seat lock
    async refreshLock(req, res) {
        try {
            const bookingId = req.params.id;
            const body = req.validatedBody ?? req.body;
            const { seatIds, sessionId } = body;
            // need booking to find tripId
            const booking = await booking_repository_1.default.getBookingById(bookingId);
            if (!booking)
                return res.status(404).json({ message: 'not found' });
            const ok = await booking_service_1.default.refreshLock(booking.trip_id, seatIds, sessionId);
            if (!ok)
                return res.status(400).json({ message: 'failed to refresh lock' });
            return res.json({ message: 'refreshed' });
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: err && err.message ? String(err.message) : 'internal error' });
        }
    }
}
exports.DefaultBookingController = new BookingController();
// Export validators for route wiring
exports.bookingValidate = {
    initiate: (0, validation_middleware_1.validateRequest)(booking_validator_1.validateInitiate, 'body'),
    passengers: (0, validation_middleware_1.validateRequest)(booking_validator_1.validatePassengers, 'body'),
    confirm: (0, validation_middleware_1.validateRequest)(booking_validator_1.validateConfirm, 'body'),
    refreshLock: (0, validation_middleware_1.validateRequest)(booking_validator_1.validateRefreshLock, 'body'),
};
