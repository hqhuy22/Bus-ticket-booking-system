"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const trip_repository_1 = __importDefault(require("./trip.repository"));
class BookingRepository {
    // Generate booking reference like BK-YYYYMMDD-XXXX and ensure uniqueness
    // Synchronous generator for booking reference. Use createBooking to ensure uniqueness
    static generateBookingReference() {
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const suffix = Math.floor(1000 + Math.random() * 9000); // 4 digits
        return `BK-${y}${m}${d}-${suffix}`;
    }
    // Create booking. Uses transaction and sets expires_at = now() + 15 minutes
    static async createBooking(data) {
        const client = await (0, db_1.getClient)();
        try {
            await client.query('BEGIN');
            // ensure optional columns exist (safe to call multiple times)
            await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_reference text;`);
            await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_email text;`);
            await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone text;`);
            await client.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expires_at timestamptz;`);
            // generate a booking reference and ensure uniqueness
            let bookingRef = '';
            for (let i = 0; i < 5; i++) {
                const cand = BookingRepository.generateBookingReference();
                const ex = await client.query(`SELECT 1 FROM bookings WHERE booking_reference = $1`, [
                    cand,
                ]);
                if (ex.rows.length === 0) {
                    bookingRef = cand;
                    break;
                }
            }
            if (!bookingRef)
                bookingRef = BookingRepository.generateBookingReference() + '-' + Date.now();
            const insertQ = `INSERT INTO bookings (user_id, trip_id, status, total_amount, booking_reference, contact_email, contact_phone, booked_at, expires_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7, now(), now() + interval '15 minutes') RETURNING *`;
            const res = await client.query(insertQ, [
                data.user_id ?? null,
                data.trip_id,
                data.status ?? 'pending',
                data.total_amount,
                bookingRef,
                data.contact_email ?? null,
                data.contact_phone ?? null,
            ]);
            const booking = res.rows[0];
            // If passengers provided, add them and reserve seats
            if (data.passengers && data.passengers.length > 0) {
                await BookingRepository.addPassengers(booking.id, data.passengers);
            }
            await client.query('COMMIT');
            return booking;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    // Get booking by id with joined details (passengers, payment, trip, route, bus, seats)
    static async getBookingById(id) {
        // allow lookup by UUID id or by booking_reference
        const isUuidLike = id && id.length === 36;
        const bRes = isUuidLike
            ? await (0, db_1.query)(`SELECT * FROM bookings WHERE id = $1`, [id])
            : await (0, db_1.query)(`SELECT * FROM bookings WHERE booking_reference = $1`, [id]);
        const booking = bRes.rows[0];
        if (!booking)
            return undefined;
        // If the lookup was performed by booking_reference (non-UUID), use the
        // actual booking.id (UUID) for subsequent queries that compare against
        // booking_id UUID columns. This prevents passing a non-UUID string to
        // queries that expect a uuid and avoids "invalid input syntax for type uuid" errors.
        const bookingUuid = isUuidLike ? id : booking.id;
        const passengersRes = await (0, db_1.query)(`SELECT * FROM passenger_details WHERE booking_id = $1`, [
            bookingUuid,
        ]);
        const paymentRes = await (0, db_1.query)(`SELECT * FROM payments WHERE booking_id = $1 ORDER BY processed_at DESC LIMIT 1`, [bookingUuid]);
        // Trip details using TripRepository
        const tripInfo = booking.trip_id
            ? await trip_repository_1.default.getTripWithDetails(booking.trip_id)
            : null;
        const details = {
            ...booking,
            passengers: passengersRes.rows,
            payment: paymentRes.rows[0] ?? null,
            trip_info: tripInfo ?? null,
        };
        return details;
    }
    // Find booking by booking reference and matching contact (email or phone)
    static async findByReferenceAndContact(reference, contact) {
        if (!reference)
            return undefined;
        const clauses = ['booking_reference = $1'];
        const params = [reference];
        let idx = 2;
        if (contact?.email) {
            clauses.push(`contact_email = $${idx++}`);
            params.push(contact.email);
        }
        if (contact?.phone) {
            clauses.push(`contact_phone = $${idx++}`);
            params.push(contact.phone);
        }
        const where = clauses.join(' AND ');
        const res = await (0, db_1.query)(`SELECT * FROM bookings WHERE ${where} LIMIT 1`, params);
        const b = res.rows[0];
        if (!b)
            return undefined;
        // reuse getBookingById to include passengers/payment/trip
        return this.getBookingById(b.id);
    }
    // Guest lookup removed: only authenticated users allowed
    // Get bookings for a user with optional filtering and pagination
    static async getUserBookings(userId, options) {
        const clauses = ['user_id = $1'];
        const params = [userId];
        let idx = 2;
        if (options?.status) {
            clauses.push(`status = $${idx++}`);
            params.push(options.status);
        }
        const where = clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
        const limit = typeof options?.limit === 'number' ? options.limit : 25;
        const offset = typeof options?.offset === 'number' ? options.offset : 0;
        const q = `SELECT * FROM bookings ${where} ORDER BY booked_at DESC LIMIT ${limit} OFFSET ${offset}`;
        const res = await (0, db_1.query)(q, params);
        return res.rows;
    }
    // Update booking status
    static async updateBookingStatus(id, status) {
        const res = await (0, db_1.query)(`UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`, [
            status,
            id,
        ]);
        return res.rows[0];
    }
    // Cancel booking and release seats (transactional)
    static async cancelBooking(id) {
        const client = await (0, db_1.getClient)();
        try {
            await client.query('BEGIN');
            const bRes = await client.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [id]);
            if (bRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }
            // set booking status to cancelled
            await client.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [id]);
            // free seats that were reserved/booked by this booking
            await client.query(`UPDATE seat_statuses SET booking_id = NULL, state = 'available', locked_until = NULL, lock_owner = NULL WHERE booking_id = $1 RETURNING id`, [id]);
            await client.query('COMMIT');
            return true;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
    // Add passengers and reserve seats. Validates seat_code belongs to the trip and is free.
    static async addPassengers(bookingId, passengers) {
        const client = await (0, db_1.getClient)();
        try {
            await client.query('BEGIN');
            // get booking and trip
            const bRes = await client.query(`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`, [
                bookingId,
            ]);
            if (bRes.rows.length === 0) {
                await client.query('ROLLBACK');
                throw new Error('Booking not found');
            }
            const booking = bRes.rows[0];
            const tripId = booking.trip_id;
            const inserted = [];
            for (const p of passengers) {
                // find seat id for trip by seat_code
                const seatQ = `SELECT s.id as seat_id, ss.id as seat_status_id FROM seats s
          JOIN seat_statuses ss ON ss.seat_id = s.id AND ss.trip_id = $1
          WHERE s.seat_code = $2 LIMIT 1`;
                const seatRes = await client.query(seatQ, [tripId, p.seat_code]);
                if (seatRes.rows.length === 0) {
                    await client.query('ROLLBACK');
                    throw new Error(`Seat code ${p.seat_code} is invalid for this trip`);
                }
                const seatRow = seatRes.rows[0];
                // atomically reserve the seat if not already booked
                // allow updating the seat if it's currently unassigned OR already assigned to this booking
                const lockQ = `UPDATE seat_statuses SET booking_id = $1, state = 'reserved', lock_owner = NULL WHERE trip_id = $2 AND seat_id = $3 AND (booking_id IS NULL OR booking_id = $1) RETURNING *`;
                const lockRes = await client.query(lockQ, [bookingId, tripId, seatRow.seat_id]);
                if (lockRes.rows.length === 0) {
                    await client.query('ROLLBACK');
                    throw new Error(`Seat ${p.seat_code} is already taken`);
                }
                // insert passenger detail
                const ins = await client.query(`INSERT INTO passenger_details (booking_id, full_name, document_id, seat_code) VALUES ($1,$2,$3,$4) RETURNING *`, [bookingId, p.full_name, p.document_id ?? null, p.seat_code]);
                inserted.push(ins.rows[0]);
            }
            await client.query('COMMIT');
            return inserted;
        }
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
        finally {
            client.release();
        }
    }
}
exports.default = BookingRepository;
