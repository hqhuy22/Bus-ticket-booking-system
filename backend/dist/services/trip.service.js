"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class TripService {
    constructor(tripRepository) {
        this.tripRepo = tripRepository;
    }
    // schedule a trip: validate, conflict check, create trip (repo will init seats)
    async scheduleTrip(data) {
        // basic validation
        if (!data.bus_id)
            throw new Error('bus_id is required');
        if (!data.route_id)
            throw new Error('route_id is required');
        if (!data.departure_time || !data.arrival_time) {
            throw new Error('departure_time and arrival_time are required');
        }
        const departure = new Date(data.departure_time);
        const arrival = new Date(data.arrival_time);
        if (!(departure instanceof Date) || isNaN(departure.getTime())) {
            throw new Error('invalid departure_time');
        }
        if (!(arrival instanceof Date) || isNaN(arrival.getTime())) {
            throw new Error('invalid arrival_time');
        }
        if (departure >= arrival) {
            throw new Error('departure_time must be before arrival_time');
        }
        // validate bus exists and active (note: some schemas may not have is_active column)
        const busRes = await (0, db_1.query)('SELECT * FROM buses WHERE id = $1', [data.bus_id]);
        const busRow = busRes.rows[0];
        if (!busRow)
            throw new Error('bus not found');
        if (Object.prototype.hasOwnProperty.call(busRow, 'is_active') && busRow.is_active === false) {
            throw new Error('bus is not active');
        }
        // validate route exists
        const routeRes = await (0, db_1.query)('SELECT * FROM routes WHERE id = $1', [data.route_id]);
        if (!routeRes.rows[0])
            throw new Error('route not found');
        // check double-booking
        const available = await this.tripRepo.checkBusAvailability(data.bus_id, departure, arrival);
        if (!available)
            throw new Error('bus is already booked for the provided time range');
        const createDto = {
            route_id: data.route_id,
            bus_id: data.bus_id,
            departure_time: departure.toISOString(),
            arrival_time: arrival.toISOString(),
            base_price: data.base_price ?? null,
            status: data.status ?? 'scheduled',
        };
        const trip = await this.tripRepo.createTrip(createDto);
        return trip;
    }
    // update schedule and re-check conflicts (exclude the trip being updated)
    async updateTripSchedule(tripId, data) {
        // fetch existing trip
        const cur = await (0, db_1.query)('SELECT * FROM trips WHERE id = $1', [tripId]);
        const existing = cur.rows[0];
        if (!existing)
            throw new Error('trip not found');
        const newBusId = data.bus_id !== undefined ? data.bus_id : existing.bus_id;
        const newDeparture = data.departure_time !== undefined && data.departure_time !== null
            ? new Date(data.departure_time)
            : new Date(existing.departure_time);
        const newArrival = data.arrival_time !== undefined && data.arrival_time !== null
            ? new Date(data.arrival_time)
            : new Date(existing.arrival_time);
        if (!(newDeparture instanceof Date) || isNaN(newDeparture.getTime())) {
            throw new Error('invalid departure_time');
        }
        if (!(newArrival instanceof Date) || isNaN(newArrival.getTime())) {
            throw new Error('invalid arrival_time');
        }
        if (newDeparture >= newArrival) {
            throw new Error('departure_time must be before arrival_time');
        }
        if (newBusId) {
            const busRes = await (0, db_1.query)('SELECT * FROM buses WHERE id = $1', [newBusId]);
            const busRow = busRes.rows[0];
            if (!busRow)
                throw new Error('bus not found');
            if (Object.prototype.hasOwnProperty.call(busRow, 'is_active') && busRow.is_active === false) {
                throw new Error('bus is not active');
            }
            // check conflicts excluding this trip
            const conflictQ = `SELECT * FROM trips WHERE bus_id = $1 AND id <> $2 AND NOT (arrival_time <= $3 OR departure_time >= $4)`;
            const conflictRes = await (0, db_1.query)(conflictQ, [
                newBusId,
                tripId,
                newDeparture.toISOString(),
                newArrival.toISOString(),
            ]);
            if (conflictRes.rows.length > 0) {
                throw new Error('bus is already booked for the provided time range');
            }
        }
        const updateDto = {
            route_id: data.route_id ?? undefined,
            bus_id: data.bus_id ?? undefined,
            departure_time: data.departure_time ?? undefined,
            arrival_time: data.arrival_time ?? undefined,
            base_price: data.base_price ?? undefined,
            status: data.status ?? undefined,
        };
        const updated = await this.tripRepo.updateTrip(tripId, updateDto);
        if (!updated)
            throw new Error('failed to update trip');
        return updated;
    }
    // search trips with filters and pagination
    async searchTrips(origin, destination, date, filters) {
        const clauses = [];
        const params = [];
        let idx = 1;
        if (origin) {
            clauses.push(`routes.origin ILIKE $${idx++}`);
            params.push(`%${origin}%`);
        }
        if (destination) {
            clauses.push(`routes.destination ILIKE $${idx++}`);
            params.push(`%${destination}%`);
        }
        // date filter -> restrict to that calendar day
        if (date) {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);
            clauses.push(`trips.departure_time >= $${idx++}`);
            params.push(dayStart.toISOString());
            clauses.push(`trips.departure_time < $${idx++}`);
            params.push(dayEnd.toISOString());
        }
        // price range
        if (filters && filters.priceRange) {
            if (typeof filters.priceRange.min === 'number') {
                clauses.push(`trips.base_price >= $${idx++}`);
                params.push(filters.priceRange.min);
            }
            if (typeof filters.priceRange.max === 'number') {
                clauses.push(`trips.base_price <= $${idx++}`);
                params.push(filters.priceRange.max);
            }
        }
        // bus type -> model
        if (filters && filters.busType) {
            clauses.push(`buses.model ILIKE $${idx++}`);
            params.push(`%${filters.busType}%`);
        }
        // amenities -> simple AND of contains checks against amenities_json
        if (filters && filters.amenities && filters.amenities.length > 0) {
            for (const a of filters.amenities) {
                clauses.push(`buses.amenities_json ILIKE $${idx++}`);
                params.push(`%${a}%`);
            }
        }
        // departure time range within the day (if provided and date provided), otherwise skip
        if (filters && filters.departureTimeRange && date) {
            const from = filters.departureTimeRange.from
                ? new Date(`${date}T${filters.departureTimeRange.from}`)
                : null;
            const to = filters.departureTimeRange.to
                ? new Date(`${date}T${filters.departureTimeRange.to}`)
                : null;
            if (from) {
                clauses.push(`trips.departure_time >= $${idx++}`);
                params.push(from.toISOString());
            }
            if (to) {
                clauses.push(`trips.departure_time <= $${idx++}`);
                params.push(to.toISOString());
            }
        }
        const where = clauses.length > 0 ? 'WHERE ' + clauses.join(' AND ') : '';
        const page = filters && filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
        const limit = filters && filters.limit && filters.limit > 0 ? Math.floor(filters.limit) : 25;
        const offset = (page - 1) * limit;
        const q = `SELECT trips.*, routes.origin, routes.destination, routes.distance_km, routes.estimated_minutes, buses.plate_number, buses.model, buses.seat_capacity
      FROM trips
      LEFT JOIN routes ON routes.id = trips.route_id
      LEFT JOIN buses ON buses.id = trips.bus_id
      ${where}
      ORDER BY trips.departure_time ASC
      LIMIT ${limit} OFFSET ${offset}`;
        const itemsRes = await (0, db_1.query)(q, params);
        const countQ = `SELECT COUNT(*) as count FROM trips LEFT JOIN routes ON routes.id = trips.route_id LEFT JOIN buses ON buses.id = trips.bus_id ${where}`;
        const countRes = await (0, db_1.query)(countQ, params);
        const total = parseInt(countRes.rows[0].count, 10);
        const items = itemsRes.rows.map((r) => ({
            ...r,
            route_info: r.origin || r.destination
                ? {
                    id: r.route_id,
                    origin: r.origin,
                    destination: r.destination,
                    distance_km: r.distance_km,
                    estimated_minutes: r.estimated_minutes,
                }
                : null,
            bus_info: r.plate_number
                ? {
                    id: r.bus_id,
                    plate_number: r.plate_number,
                    model: r.model,
                    seat_capacity: r.seat_capacity,
                }
                : null,
        }));
        const totalPages = Math.ceil(total / limit) || 1;
        return { trips: items, totalCount: total, page, totalPages };
    }
    async getTripDetails(tripId) {
        const details = await this.tripRepo.getTripWithDetails(tripId);
        if (!details)
            throw new Error('trip not found');
        return details;
    }
}
exports.default = TripService;
