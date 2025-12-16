"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const trip_service_1 = __importDefault(require("../services/trip.service"));
const trip_repository_1 = __importDefault(require("../repositories/trip.repository"));
const route_repository_1 = __importDefault(require("../repositories/route.repository"));
const booking_service_1 = __importDefault(require("../services/booking.service"));
const booking_repository_1 = __importDefault(require("../repositories/booking.repository"));
class AdminController {
    // Operators
    static async listOperators(_req, res) {
        const r = await (0, db_1.query)('SELECT * FROM operators');
        return res.json(r.rows);
    }
    static async createOperator(req, res) {
        const { name, contact_email, contact_phone } = req.body;
        const r = await (0, db_1.query)('INSERT INTO operators (name, contact_email, contact_phone) VALUES ($1,$2,$3) RETURNING *', [name, contact_email, contact_phone]);
        return res.status(201).json(r.rows[0]);
    }
    static async updateOperator(req, res) {
        const { id } = req.params;
        const { name, contact_email, contact_phone, status } = req.body;
        const r = await (0, db_1.query)('UPDATE operators SET name=$1, contact_email=$2, contact_phone=$3, status=$4 WHERE id=$5 RETURNING *', [name, contact_email, contact_phone, status, id]);
        return res.json(r.rows[0]);
    }
    static async deleteOperator(req, res) {
        const { id } = req.params;
        await (0, db_1.query)('DELETE FROM operators WHERE id=$1', [id]);
        return res.status(204).send();
    }
    // Routes
    static async listRoutes(_req, res) {
        const r = await (0, db_1.query)('SELECT * FROM routes');
        return res.json(r.rows);
    }
    static async createRoute(req, res) {
        const { operator_id, origin, destination, distance_km, estimated_minutes } = req.body;
        const r = await (0, db_1.query)('INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes) VALUES ($1,$2,$3,$4,$5) RETURNING *', [operator_id, origin, destination, distance_km, estimated_minutes]);
        return res.status(201).json(r.rows[0]);
    }
    static async updateRoute(req, res) {
        const { id } = req.params;
        const { operator_id, origin, destination, distance_km, estimated_minutes } = req.body;
        const r = await (0, db_1.query)('UPDATE routes SET operator_id=$1, origin=$2, destination=$3, distance_km=$4, estimated_minutes=$5 WHERE id=$6 RETURNING *', [operator_id, origin, destination, distance_km, estimated_minutes, id]);
        return res.json(r.rows[0]);
    }
    static async deleteRoute(req, res) {
        const { id } = req.params;
        await (0, db_1.query)('DELETE FROM routes WHERE id=$1', [id]);
        return res.status(204).send();
    }
    // Buses
    static async listBuses(_req, res) {
        const r = await (0, db_1.query)('SELECT * FROM buses');
        return res.json(r.rows);
    }
    static async createBus(req, res) {
        const { operator_id, plate_number, model, seat_capacity, amenities_json } = req.body;
        const r = await (0, db_1.query)('INSERT INTO buses (operator_id, plate_number, model, seat_capacity, amenities_json) VALUES ($1,$2,$3,$4,$5) RETURNING *', [operator_id, plate_number, model, seat_capacity, amenities_json]);
        return res.status(201).json(r.rows[0]);
    }
    static async updateBus(req, res) {
        const { id } = req.params;
        const { operator_id, plate_number, model, seat_capacity, amenities_json } = req.body;
        const r = await (0, db_1.query)('UPDATE buses SET operator_id=$1, plate_number=$2, model=$3, seat_capacity=$4, amenities_json=$5 WHERE id=$6 RETURNING *', [operator_id, plate_number, model, seat_capacity, amenities_json, id]);
        return res.json(r.rows[0]);
    }
    static async deleteBus(req, res) {
        const { id } = req.params;
        await (0, db_1.query)('DELETE FROM buses WHERE id=$1', [id]);
        return res.status(204).send();
    }
    // Trips
    static async listTrips(_req, res) {
        const r = await (0, db_1.query)('SELECT * FROM trips');
        return res.json(r.rows);
    }
    static async createTrip(req, res) {
        const { route_id, bus_id, departure_time, arrival_time, base_price, status } = req.body;
        const r = await (0, db_1.query)('INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [route_id, bus_id, departure_time, arrival_time, base_price, status]);
        return res.status(201).json(r.rows[0]);
    }
    static async updateTrip(req, res) {
        const { id } = req.params;
        const { route_id, bus_id, departure_time, arrival_time, base_price, status } = req.body;
        const r = await (0, db_1.query)('UPDATE trips SET route_id=$1, bus_id=$2, departure_time=$3, arrival_time=$4, base_price=$5, status=$6 WHERE id=$7 RETURNING *', [route_id, bus_id, departure_time, arrival_time, base_price, status, id]);
        return res.json(r.rows[0]);
    }
    static async deleteTrip(req, res) {
        const { id } = req.params;
        await (0, db_1.query)('DELETE FROM trips WHERE id=$1', [id]);
        return res.status(204).send();
    }
    // Trip scheduling helpers
    static async scheduleTrip(req, res) {
        try {
            const svc = new trip_service_1.default(trip_repository_1.default);
            const trip = await svc.scheduleTrip(req.body);
            return res.status(201).json(trip);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('required') || msg.includes('invalid') || msg.includes('must be'))
                return res.status(400).json({ error: msg });
            if (msg.includes('not found'))
                return res.status(404).json({ error: msg });
            if (msg.includes('already booked'))
                return res.status(409).json({ error: msg });
            return res.status(500).json({ error: msg });
        }
    }
    static async updateTripSchedule(req, res) {
        const { id } = req.params;
        try {
            const svc = new trip_service_1.default(trip_repository_1.default);
            const updated = await svc.updateTripSchedule(id, req.body);
            return res.json(updated);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found')) {
                return res.status(404).json({ error: msg });
            }
            if (msg.includes('invalid') || msg.includes('required') || msg.includes('must be')) {
                return res.status(400).json({ error: msg });
            }
            if (msg.includes('already booked')) {
                return res.status(409).json({ error: msg });
            }
            return res.status(500).json({ error: msg });
        }
    }
    // Get trips in a date range
    static async getTripSchedule(req, res) {
        try {
            const { start, end, limit, offset } = req.query;
            if (!start || !end) {
                return res
                    .status(400)
                    .json({ error: 'start and end query params are required (ISO dates)' });
            }
            const filters = {
                departure_from: new Date(start).toISOString(),
                departure_to: new Date(end).toISOString(),
            };
            if (limit)
                filters.limit = parseInt(limit, 10) || 25;
            if (offset)
                filters.offset = parseInt(offset, 10) || 0;
            const resObj = await trip_repository_1.default.searchTrips(filters);
            return res.json({ items: resObj.items, total: resObj.total });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    // Get schedule for a specific bus
    static async getBusSchedule(req, res) {
        try {
            const { busId } = req.params;
            const { start, end, limit, offset } = req.query;
            const filters = { bus_id: busId };
            if (start)
                filters.departure_from = new Date(start).toISOString();
            if (end)
                filters.departure_to = new Date(end).toISOString();
            if (limit)
                filters.limit = parseInt(limit, 10) || 25;
            if (offset)
                filters.offset = parseInt(offset, 10) || 0;
            const resObj = await trip_repository_1.default.searchTrips(filters);
            return res.json({ items: resObj.items, total: resObj.total });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    // Seat template (bus seat configuration) CRUD
    static async createBusSeatTemplate(req, res) {
        const { busId } = req.params;
        try {
            // ensure bus exists
            const b = await (0, db_1.query)('SELECT id FROM buses WHERE id = $1', [busId]);
            if (!b.rows[0])
                return res.status(404).json({ error: 'bus not found' });
            const { seat_code, row_number, column_number, seat_type, position, price_modifier, is_active, } = req.body;
            if (!seat_code || !seat_type) {
                return res.status(400).json({ error: 'seat_code and seat_type are required' });
            }
            const r = await (0, db_1.query)(`INSERT INTO seat_templates (bus_id, seat_code, row_number, column_number, seat_type, position, price_modifier, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [
                busId,
                seat_code,
                row_number ?? null,
                column_number ?? null,
                seat_type,
                position ?? null,
                price_modifier ?? 0,
                is_active ?? true,
            ]);
            return res.status(201).json(r.rows[0]);
        }
        catch (err) {
            if (err && err.code === '23505') {
                return res.status(409).json({ error: 'seat_code must be unique per bus' });
            }
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    static async listBusSeatTemplates(req, res) {
        const { busId } = req.params;
        try {
            const b = await (0, db_1.query)('SELECT id FROM buses WHERE id = $1', [busId]);
            if (!b.rows[0])
                return res.status(404).json({ error: 'bus not found' });
            const r = await (0, db_1.query)('SELECT * FROM seat_templates WHERE bus_id = $1 ORDER BY row_number NULLS LAST, column_number NULLS LAST, seat_code ASC', [busId]);
            return res.json(r.rows);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    static async updateBusSeatTemplate(req, res) {
        const { busId, seatId } = req.params;
        try {
            // ensure exists and belongs to bus
            const cur = await (0, db_1.query)('SELECT * FROM seat_templates WHERE id = $1 AND bus_id = $2', [
                seatId,
                busId,
            ]);
            const existing = cur.rows[0];
            if (!existing)
                return res.status(404).json({ error: 'seat template not found for this bus' });
            const fields = [];
            const params = [];
            let idx = 1;
            const updatable = [
                'seat_code',
                'row_number',
                'column_number',
                'seat_type',
                'position',
                'price_modifier',
                'is_active',
            ];
            for (const f of updatable) {
                if (Object.prototype.hasOwnProperty.call(req.body, f)) {
                    fields.push(`${f} = $${idx++}`);
                    params.push(req.body[f]);
                }
            }
            if (fields.length === 0)
                return res.json(existing);
            params.push(seatId);
            const q = `UPDATE seat_templates SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
            const updated = await (0, db_1.query)(q, params);
            return res.json(updated.rows[0]);
        }
        catch (err) {
            if (err && err.code === '23505') {
                return res.status(409).json({ error: 'seat_code must be unique per bus' });
            }
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    static async deleteBusSeatTemplate(req, res) {
        const { busId, seatId } = req.params;
        try {
            const cur = await (0, db_1.query)('SELECT * FROM seat_templates WHERE id = $1 AND bus_id = $2', [
                seatId,
                busId,
            ]);
            if (!cur.rows[0]) {
                return res.status(404).json({ error: 'seat template not found for this bus' });
            }
            await (0, db_1.query)('DELETE FROM seat_templates WHERE id = $1', [seatId]);
            return res.status(204).send();
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    // Route stops CRUD via RouteRepository
    static async addRouteStop(req, res) {
        const { routeId } = req.params;
        try {
            const stop = await route_repository_1.default.addRouteStop(routeId, req.body);
            return res.status(201).json(stop);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    static async updateRouteStop(req, res) {
        const { stopId } = req.params;
        try {
            const updated = await route_repository_1.default.updateRouteStop(stopId, req.body);
            if (!updated)
                return res.status(404).json({ error: 'stop not found' });
            return res.json(updated);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    static async deleteRouteStop(req, res) {
        const { stopId } = req.params;
        try {
            const ok = await route_repository_1.default.deleteRouteStop(stopId);
            if (!ok)
                return res.status(404).json({ error: 'stop not found' });
            return res.status(204).send();
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    // Admin booking management
    static async getAllBookings(req, res) {
        try {
            const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10) || 1) : 1;
            const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10) || 25) : 25;
            const offset = (page - 1) * limit;
            const { status, start, end, tripId } = req.query;
            const clauses = [];
            const params = [];
            let idx = 1;
            if (status) {
                clauses.push(`status = $${idx++}`);
                params.push(status);
            }
            if (tripId) {
                clauses.push(`trip_id = $${idx++}`);
                params.push(tripId);
            }
            if (start) {
                clauses.push(`booked_at >= $${idx++}`);
                params.push(new Date(start).toISOString());
            }
            if (end) {
                clauses.push(`booked_at <= $${idx++}`);
                params.push(new Date(end).toISOString());
            }
            const where = clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
            const q = `SELECT * FROM bookings ${where} ORDER BY booked_at DESC LIMIT ${limit} OFFSET ${offset}`;
            const itemsRes = await (0, db_1.query)(q, params);
            // total
            const countQ = `SELECT COUNT(*) as count FROM bookings ${where}`;
            const countRes = await (0, db_1.query)(countQ, params);
            const total = parseInt(countRes.rows[0].count, 10) || 0;
            return res.json({ items: itemsRes.rows, total, page, limit });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    static async getBookingById(req, res) {
        try {
            const { id } = req.params;
            if (!id)
                return res.status(400).json({ error: 'missing id' });
            const booking = await booking_repository_1.default.getBookingById(id);
            if (!booking)
                return res.status(404).json({ error: 'not found' });
            return res.json(booking);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
    static async cancelBookingAdmin(req, res) {
        try {
            const { id } = req.params;
            const body = req.validatedBody ?? req.body;
            const reason = body?.reason ?? null;
            const authReq = req;
            if (!authReq.user)
                return res.status(401).json({ error: 'unauthenticated' });
            // use service to release seats and mark cancelled (service enforces admin check)
            await booking_service_1.default.cancelBooking(id, authReq.user.id);
            // ensure cancellation_reason column exists and store reason
            await (0, db_1.query)(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason text;`);
            await (0, db_1.query)(`UPDATE bookings SET cancellation_reason = $1 WHERE id = $2`, [reason, id]);
            return res.json({ message: 'cancelled', reason });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            if (msg.includes('not found'))
                return res.status(404).json({ error: msg });
            if (msg.includes('Not authorized') || msg.includes('Not authorized to cancel'))
                return res.status(403).json({ error: msg });
            return res.status(400).json({ error: msg });
        }
    }
    static async updateBookingStatus(req, res) {
        try {
            const { id } = req.params;
            const body = req.validatedBody ?? req.body;
            const status = body?.status;
            if (!status)
                return res.status(400).json({ error: 'status is required' });
            const updated = await booking_repository_1.default.updateBookingStatus(id, status);
            if (!updated)
                return res.status(404).json({ error: 'not found' });
            return res.json(updated);
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ error: msg });
        }
    }
}
exports.default = AdminController;
