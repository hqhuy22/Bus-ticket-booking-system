import { Request, Response } from 'express';
import { query } from '../config/db';
import TripService from '../services/trip.service';
import TripRepository from '../repositories/trip.repository';

export default class TripController {
  private tripService: TripService;

  constructor(tripService: TripService) {
    this.tripService = tripService;
  }

  // Search trips with filters and pagination
  async searchTrips(req: Request, res: Response) {
    try {
      const {
        origin,
        destination,
        date,
        minPrice,
        maxPrice,
        departureStart,
        departureEnd,
        busType,
        amenities,
        page,
        limit,
      } = req.query as any;

      const filters: any = {};

      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice !== undefined) filters.priceRange.min = Number(minPrice);
        if (maxPrice !== undefined) filters.priceRange.max = Number(maxPrice);
      }

      if (departureStart || departureEnd) {
        filters.departureTimeRange = {};
        if (departureStart !== undefined) filters.departureTimeRange.from = String(departureStart);
        if (departureEnd !== undefined) filters.departureTimeRange.to = String(departureEnd);
      }

      if (busType) filters.busType = String(busType);

      if (amenities) {
        if (Array.isArray(amenities)) filters.amenities = amenities.map(String);
        else
          filters.amenities = String(amenities)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
      }

      const p = page ? Math.max(1, parseInt(String(page), 10) || 1) : undefined;
      const l = limit ? Math.max(1, parseInt(String(limit), 10) || 25) : undefined;
      if (p) filters.page = p;
      if (l) filters.limit = l;

      const result = await this.tripService.searchTrips(
        origin ? String(origin) : undefined,
        destination ? String(destination) : undefined,
        date ? String(date) : undefined,
        filters,
      );

      return res.json({
        trips: result.trips,
        pagination: {
          page: result.page,
          limit: l ?? 25,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        },
      });
    } catch (err: any) {
      const msg = err && err.message ? String(err.message) : 'internal error';
      return res.status(500).json({ message: msg });
    }
  }

  // Get full trip details including route (stops), bus (amenities), available seats and pricing
  async getTripDetails(req: Request, res: Response) {
    try {
      const { tripId } = req.params as any;
      if (!tripId) return res.status(400).json({ message: 'missing tripId' });
      try {
        const details = await this.tripService.getTripDetails(tripId);
        return res.json(details);
      } catch (e: any) {
        const msg = e && e.message ? String(e.message) : 'internal error';
        if (msg.includes('not found')) return res.status(404).json({ message: msg });
        return res.status(500).json({ message: msg });
      }
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // Return top routes by booking count (for autocomplete / suggestions)
  async getPopularRoutes(_req: Request, res: Response) {
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
      const r = await query(q, [limit]);
      const rows = r.rows.map((row: any) => ({
        id: row.id,
        origin: row.origin,
        destination: row.destination,
        bookings: parseInt(row.bookings, 10) || 0,
      }));
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  // Return distinct list of cities from routes (origin + destination). Supports ?q= filter
  async getCitiesList(req: Request, res: Response) {
    try {
      const qParam = (req.query.q as string) || '';
      let sql = `SELECT city FROM (SELECT origin AS city FROM routes UNION SELECT destination AS city FROM routes) t`;
      const params: any[] = [];
      if (qParam) {
        sql += ` WHERE city ILIKE $1`;
        params.push(`%${qParam}%`);
      }
      sql += ` ORDER BY city`;
      const r = await query(sql, params);
      const cities = r.rows.map((row: any) => row.city);
      return res.json(cities);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}

// Export a default instance wired to the repository for convenience
export const DefaultTripController = new TripController(new TripService(TripRepository));
