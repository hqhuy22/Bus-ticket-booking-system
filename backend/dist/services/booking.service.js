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
const db_1 = require("../config/db");
const booking_repository_1 = __importDefault(require("../repositories/booking.repository"));
const trip_repository_1 = __importDefault(require("../repositories/trip.repository"));
const redis_1 = __importStar(require("../utils/redis"));
const seatLock_service_1 = __importDefault(require("./seatLock.service"));
class BookingService {
    // Create booking: validate trip & seats, compute total, lock seats, create booking pending
    static async createBooking(userId, tripId, seatIds, contactInfo, providedSessionId) {
        // Allow guest bookings when userId is null, but require contact info for guests so
        // they can be contacted and can later lookup their booking.
        if (!userId) {
            if (!contactInfo || (!contactInfo.email && !contactInfo.phone)) {
                throw new Error('Guest booking requires contact email or phone');
            }
        }
        if (!seatIds || seatIds.length === 0)
            throw new Error('No seats selected');
        // validate trip exists
        const trip = await trip_repository_1.default.getTripWithDetails(tripId);
        if (!trip)
            throw new Error('Trip not found');
        // map seatIds -> seat info (from trip seats)
        const seatMap = {};
        for (const s of trip.seats || [])
            seatMap[s.seat_id || s.id] = s;
        for (const sid of seatIds) {
            if (!seatMap[sid])
                throw new Error(`Seat ${sid} not found for trip`);
        }
        // check availability via SeatLockService
        const avail = await seatLock_service_1.default.checkSeatAvailability(tripId, seatIds);
        const notAvailable = avail.filter((a) => !a.available);
        if (notAvailable.length > 0) {
            const ids = notAvailable.map((n) => n.seatId).join(',');
            throw new Error(`Some seats are not available: ${ids}`);
        }
        // compute total_amount: base_price + seat price modifiers if seat_template exists
        let total = Number(trip.base_price || 0) * seatIds.length;
        // try to add seat modifiers when present
        for (const sid of seatIds) {
            const s = seatMap[sid];
            if (!s)
                continue;
            if (s.seat_type === 'vip')
                total += 0; // reserved if template not available
            // if seat has price_modifier or seat_type mapping, project-specific logic could be applied here
        }
        // Try to lock seats in Redis first; use a sessionId equal booking_ref candidate
        // Use provided sessionId when available so callers (controllers / clients) can keep and refresh locks.
        const sessionId = providedSessionId ?? `sess-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const locked = await seatLock_service_1.default.lockSeats(tripId, seatIds, sessionId, 15);
        if (!locked)
            throw new Error('Failed to lock seats; they may be reserved by others');
        // Create booking in DB with status pending and expires_at 15 minutes (BookingRepository does this)
        const dto = {
            user_id: userId ?? null,
            trip_id: tripId,
            total_amount: total,
            contact_email: contactInfo?.email ?? null,
            contact_phone: contactInfo?.phone ?? null,
            status: 'pending',
        };
        try {
            const booking = await booking_repository_1.default.createBooking(dto);
            // associate seat_statuses with booking (reserve in DB) inside a transaction
            // We update seat_statuses to set booking_id and state='locked' using a client so this is atomic
            const client = await (0, db_1.getClient)();
            try {
                await trip_repository_1.default.updateSeatStatuses(tripId, seatIds, 'locked', booking.id, client);
            }
            finally {
                client.release();
            }
            return booking;
        }
        catch (err) {
            // unlock seats in redis
            try {
                await seatLock_service_1.default.unlockSeats(tripId, seatIds, sessionId);
            }
            catch (e) {
                // ignore
            }
            throw err;
        }
    }
    // Add passenger details: validate booking pending, passengers length equals seats, seat_code belongs to booking
    static async addPassengerDetails(bookingId, passengers) {
        if (!passengers || passengers.length === 0)
            throw new Error('Passengers list empty');
        // fetch booking with details. BookingRepository.getBookingById accepts either
        // a UUID or a booking_reference and returns the booking record. Use the
        // booking's actual UUID for subsequent queries that compare against
        // booking_id (UUID columns) to avoid invalid-uuid errors.
        const booking = await booking_repository_1.default.getBookingById(bookingId);
        if (!booking)
            throw new Error('Booking not found');
        if (booking.status !== 'pending')
            throw new Error('Can only add passengers to pending booking');
        const actualBookingId = booking.id;
        // get seats linked to booking (use actualBookingId which is a UUID)
        const seatRows = await (0, db_1.query)(`SELECT seat_id, seat_code FROM seat_statuses ss JOIN seats s ON s.id = ss.seat_id WHERE ss.booking_id = $1`, [actualBookingId]);
        const seats = seatRows.rows;
        if (passengers.length !== seats.length)
            throw new Error('Passenger count must match selected seats');
        const seatCodes = seats.map((s) => s.seat_code);
        for (const p of passengers) {
            if (!seatCodes.includes(p.seat_code))
                throw new Error(`Seat code ${p.seat_code} is not part of this booking`);
        }
        // Delegate to repository method to insert and reserve
        const inserted = await booking_repository_1.default.addPassengers(actualBookingId, passengers);
        return inserted;
    }
    // Confirm booking: validate not expired, mark seats booked, unlock redis locks, mark booking confirmed, create payment if provided
    static async confirmBooking(bookingId, paymentInfo) {
        // Allow callers to pass either booking UUID or booking_reference. Resolve
        // to the actual booking UUID first.
        const bookingRecord = await booking_repository_1.default.getBookingById(bookingId);
        if (!bookingRecord)
            throw new Error('Booking not found');
        const actualBookingId = bookingRecord.id;
        const client = await (0, db_1.getClient)();
        try {
            await client.query('BEGIN');
            const bRes = await client.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [
                actualBookingId,
            ]);
            if (bRes.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Booking not found');
            }
            const booking = bRes.rows[0];
            // check expired
            if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
                await client.query('ROLLBACK');
                throw new Error('Booking has expired');
            }
            if (booking.status !== 'pending') {
                await client.query('ROLLBACK');
                throw new Error('Only pending bookings can be confirmed');
            }
            // get seats for booking
            const seatRes = await client.query(`SELECT ss.seat_id, s.seat_code FROM seat_statuses ss JOIN seats s ON s.id = ss.seat_id WHERE ss.booking_id = $1 FOR UPDATE`, [actualBookingId]);
            const seatIds = seatRes.rows.map((r) => r.seat_id);
            // mark seats as booked — perform within the same transaction client
            await trip_repository_1.default.updateSeatStatuses(booking.trip_id, seatIds, 'booked', actualBookingId, client);
            // update booking status to confirmed
            await client.query(`UPDATE bookings SET status = 'confirmed' WHERE id = $1 RETURNING *`, [
                actualBookingId,
            ]);
            // create payment record if provided
            if (paymentInfo) {
                await client.query(`INSERT INTO payments (booking_id, provider, transaction_ref, amount, status, processed_at) VALUES ($1,$2,$3,$4,$5, now())`, [
                    actualBookingId,
                    paymentInfo.provider,
                    paymentInfo.transaction_ref ?? null,
                    paymentInfo.amount,
                    'completed',
                ]);
            }
            await client.query('COMMIT');
            // unlock redis locks for these seats
            try {
                await seatLock_service_1.default.unlockSeats(booking.trip_id, seatIds, '');
            }
            catch (e) {
                // ignore errors unlocking redis after commit
            }
            // Invalidate seat availability cache for the trip (best-effort)
            try {
                if (redis_1.default && (await (0, redis_1.ensureConnected)())) {
                    await redis_1.default.del(`trip:${booking.trip_id}:seats`);
                    // also clear any search caches because availability changed
                    const keys = await redis_1.default.keys('trips:search:*');
                    if (keys && keys.length > 0)
                        await redis_1.default.del(...keys);
                }
            }
            catch (e) {
                // ignore redis errors
            }
            const details = await booking_repository_1.default.getBookingById(actualBookingId);
            if (!details)
                throw new Error('Failed to fetch booking after confirm');
            return details;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    // Cancel booking: validate owner/admin, release seats and update booking status
    static async cancelBooking(bookingId, userId) {
        // Validate permission: owner or admin
        const b = await booking_repository_1.default.getBookingById(bookingId);
        if (!b)
            throw new Error('Booking not found');
        const actualBookingId = b.id;
        // owner check
        if (userId && b.user_id && userId !== b.user_id) {
            // check admin role
            const u = await (0, db_1.query)(`SELECT role FROM users WHERE id = $1`, [userId]);
            const role = u.rows[0]?.role;
            if (role !== 'admin')
                throw new Error('Not authorized to cancel this booking');
        }
        // release seats in DB
        await trip_repository_1.default.releaseSeatsByBooking(actualBookingId);
        // remove redis locks for trip seats (best effort)
        try {
            const seatRows = await (0, db_1.query)(`SELECT s.id FROM seat_statuses ss JOIN seats s ON s.id = ss.seat_id WHERE ss.booking_id = $1`, [actualBookingId]);
            const seatIds = seatRows.rows.map((r) => r.id);
            if (seatIds.length > 0)
                await seatLock_service_1.default.unlockSeats(b.trip_id, seatIds, '');
        }
        catch (e) {
            // ignore
        }
        // update booking status
        await booking_repository_1.default.updateBookingStatus(actualBookingId, 'cancelled');
    }
    // Get full booking details
    static async getBookingDetails(bookingId) {
        const b = await booking_repository_1.default.getBookingById(bookingId);
        if (!b)
            throw new Error('Booking not found');
        return b;
    }
    // User booking history with simple pagination and optional status filter
    static async getUserBookingHistory(userId, filters) {
        const limit = filters?.limit ?? 25;
        const offset = filters?.offset ?? 0;
        // get bookings list
        const rows = await booking_repository_1.default.getUserBookings(userId, {
            status: filters?.status,
            limit,
            offset,
        });
        // total count
        let totalRes;
        if (filters?.status) {
            totalRes = await (0, db_1.query)(`SELECT COUNT(*) FROM bookings WHERE user_id = $1 AND status = $2`, [
                userId,
                filters.status,
            ]);
        }
        else {
            totalRes = await (0, db_1.query)(`SELECT COUNT(*) FROM bookings WHERE user_id = $1`, [userId]);
        }
        const total = parseInt(totalRes.rows[0].count, 10);
        // expand details for each booking
        const items = [];
        for (const b of rows) {
            const det = await booking_repository_1.default.getBookingById(b.id);
            if (det)
                items.push(det);
        }
        return { items, total };
    }
    // Guest flows removed: only authenticated users can access bookings
    // Auto-expire bookings: find bookings with expires_at < now and status pending, cancel them and release seats
    static async autoExpireBookings() {
        const client = await (0, db_1.getClient)();
        try {
            await client.query('BEGIN');
            const res = await client.query(`SELECT id, trip_id FROM bookings WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at <= now() FOR UPDATE`);
            for (const row of res.rows) {
                const id = row.id;
                const tripId = row.trip_id;
                // release seats
                await trip_repository_1.default.releaseSeatsByBooking(id);
                // update status expired
                await client.query(`UPDATE bookings SET status = 'expired' WHERE id = $1`, [id]);
                // remove redis locks best-effort: get seat ids
                try {
                    const seatRows = await (0, db_1.query)(`SELECT s.id FROM seat_statuses ss JOIN seats s ON s.id = ss.seat_id WHERE ss.booking_id = $1`, [id]);
                    const seatIds = seatRows.rows.map((r) => r.id);
                    if (seatIds.length > 0)
                        await seatLock_service_1.default.unlockSeats(tripId, seatIds, '');
                }
                catch (e) {
                    // ignore
                }
            }
            await client.query('COMMIT');
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    // Refresh seat lock helper that delegates to SeatLockService
    static async refreshLock(tripId, seatIds, sessionId, durationMinutes = 5) {
        return seatLock_service_1.default.refreshLock(tripId, seatIds, sessionId, durationMinutes);
    }
}
exports.default = BookingService;
