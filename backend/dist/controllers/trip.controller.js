"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTripController = void 0;
const db_1 = require("../config/db");
const trip_service_1 = __importDefault(require("../services/trip.service"));
const trip_repository_1 = __importDefault(require("../repositories/trip.repository"));
class TripController {
    constructor(tripService) {
        this.tripService = tripService;
    }
    // Search trips with filters and pagination
    async searchTrips(req, res) {
        try {
            const { origin, destination, date, minPrice, maxPrice, departureStart, departureEnd, busType, amenities, page, limit, } = req.query;
            const filters = {};
            if (minPrice || maxPrice) {
                filters.priceRange = {};
                if (minPrice !== undefined)
                    filters.priceRange.min = Number(minPrice);
                if (maxPrice !== undefined)
                    filters.priceRange.max = Number(maxPrice);
            }
            if (departureStart || departureEnd) {
                filters.departureTimeRange = {};
                if (departureStart !== undefined)
                    filters.departureTimeRange.from = String(departureStart);
                if (departureEnd !== undefined)
                    filters.departureTimeRange.to = String(departureEnd);
            }
            if (busType)
                filters.busType = String(busType);
            if (amenities) {
                if (Array.isArray(amenities))
                    filters.amenities = amenities.map(String);
                else
                    filters.amenities = String(amenities)
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
            }
            const p = page ? Math.max(1, parseInt(String(page), 10) || 1) : undefined;
            const l = limit ? Math.max(1, parseInt(String(limit), 10) || 25) : undefined;
            if (p)
                filters.page = p;
            if (l)
                filters.limit = l;
            const result = await this.tripService.searchTrips(origin ? String(origin) : undefined, destination ? String(destination) : undefined, date ? String(date) : undefined, filters);
            return res.json({
                trips: result.trips,
                pagination: {
                    page: result.page,
                    limit: l ?? 25,
                    totalCount: result.totalCount,
                    totalPages: result.totalPages,
                },
            });
        }
        catch (err) {
            const msg = err && err.message ? String(err.message) : 'internal error';
            return res.status(500).json({ message: msg });
        }
    }
    // Get full trip details including route (stops), bus (amenities), available seats and pricing
    async getTripDetails(req, res) {
        try {
            const { tripId } = req.params;
            if (!tripId)
                return res.status(400).json({ message: 'missing tripId' });
            try {
                const details = await this.tripService.getTripDetails(tripId);
                return res.json(details);
            }
            catch (e) {
                const msg = e && e.message ? String(e.message) : 'internal error';
                if (msg.includes('not found'))
                    return res.status(404).json({ message: msg });
                return res.status(500).json({ message: msg });
            }
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    // Return top routes by booking count (for autocomplete / suggestions)
    async getPopularRoutes(_req, res) {
        try {
            const limit = 10;
            const q = `
        SELECT routes.id, routes.origin, routes.destination, COUNT(bookings.id) AS bookings
        FROM routes
        LEFT JOIN trips ON trips.route_id = routes.id
        LEFT JOIN bookings ON bookings.trip_id = trips.id
        GROUP BY routes.id
        ORDER BY COUNT(bookings.id) DESC
        LIMIT $1
      `;
            const r = await (0, db_1.query)(q, [limit]);
            const rows = r.rows.map((row) => ({
                id: row.id,
                origin: row.origin,
                destination: row.destination,
                bookings: parseInt(row.bookings, 10) || 0,
            }));
            return res.json(rows);
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
    // Return distinct list of cities from routes (origin + destination). Supports ?q= filter
    async getCitiesList(req, res) {
        try {
            const qParam = req.query.q || '';
            let sql = `SELECT city FROM (SELECT origin AS city FROM routes UNION SELECT destination AS city FROM routes) t`;
            const params = [];
            if (qParam) {
                sql += ` WHERE city ILIKE $1`;
                params.push(`%${qParam}%`);
            }
            sql += ` ORDER BY city`;
            const r = await (0, db_1.query)(sql, params);
            const cities = r.rows.map((row) => row.city);
            return res.json(cities);
        }
        catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}
exports.default = TripController;
// Export a default instance wired to the repository for convenience
exports.DefaultTripController = new TripController(new trip_service_1.default(trip_repository_1.default));
