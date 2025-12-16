import { query, getClient } from '../config/db';
import { Trip, TripWithDetails } from '../models/trip';
import { SeatStatus } from '../models/seat';

// Extended seat status returned to callers with seat info
export interface SeatStatusWithInfo extends SeatStatus {
  seat_code?: string;
  seat_type?: string;
  seat_is_active?: boolean;
}

// DTOs / input shapes
export interface CreateTripDTO {
  route_id?: string | null;
  bus_id?: string | null;
  departure_time?: Date | string | null;
  arrival_time?: Date | string | null;
  base_price?: number | null;
  status?: string | null;
}

export interface UpdateTripDTO {
  route_id?: string | null;
  bus_id?: string | null;
  departure_time?: Date | string | null;
  arrival_time?: Date | string | null;
  base_price?: number | null;
  status?: string | null;
}

export interface SearchFilters {
  origin?: string;
  destination?: string;
  route_id?: string;
  bus_id?: string;
  status?: string;
  departure_from?: Date | string;
  departure_to?: Date | string;
  limit?: number;
  offset?: number;
}

export default class TripRepository {
  // Create trip and initialize seat_statuses for all seats of the bus (if bus_id provided)
  static async createTrip(data: CreateTripDTO) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const r = await client.query(
        `INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          data.route_id ?? null,
          data.bus_id ?? null,
          data.departure_time ?? null,
          data.arrival_time ?? null,
          data.base_price ?? null,
          data.status ?? null,
        ],
      );
      const trip = r.rows[0] as Trip;

      // initialize seat_statuses for seats belonging to the bus
      if (trip.bus_id) {
        const seatsRes = await client.query(`SELECT id FROM seats WHERE bus_id = $1`, [
          trip.bus_id,
        ]);
        if (seatsRes.rows.length > 0) {
          const insertQ = `INSERT INTO seat_statuses (trip_id, seat_id, state) VALUES `;
          // build parameterized multi-row insert
          const params: any[] = [];
          const valueParts: string[] = [];
          let idx = 1;
          for (const s of seatsRes.rows) {
            valueParts.push(`($${idx++}, $${idx++}, $${idx++})`);
            params.push(trip.id, s.id, 'available');
          }
          if (valueParts.length > 0) {
            await client.query(insertQ + valueParts.join(', '), params);
          }
        }
      }

      await client.query('COMMIT');
      return trip;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Return true if the bus is available (no overlapping trips), false if conflict exists
  static async checkBusAvailability(busId: string, departureTime: Date, arrivalTime: Date) {
    const q = `SELECT * FROM trips WHERE bus_id = $1 AND NOT (arrival_time <= $2 OR departure_time >= $3)`;
    const res = await query(q, [busId, departureTime, arrivalTime]);
    return res.rows.length === 0;
  }

  // Get a trip with route, bus summary and seat status details
  static async getTripWithDetails(id: string) {
    const t = await query(`SELECT * FROM trips WHERE id = $1`, [id]);
    const trip = t.rows[0] as Trip | undefined;
    if (!trip) return undefined;

    const routeRes = await query(
      `SELECT id, origin, destination, distance_km, estimated_minutes FROM routes WHERE id = $1`,
      [trip.route_id],
    );
    // include ordered route stops if present
    const stopsRes = await query(
      `SELECT * FROM route_stops WHERE route_id = $1 ORDER BY stop_order ASC`,
      [trip.route_id],
    );
    const busRes = await query(
      `SELECT id, plate_number, model, seat_capacity FROM buses WHERE id = $1`,
      [trip.bus_id],
    );

    // seat statuses with seat info
    const seatsRes = await query(
      `SELECT ss.*, s.seat_code, s.seat_type, s.is_active as seat_is_active FROM seat_statuses ss JOIN seats s ON s.id = ss.seat_id WHERE ss.trip_id = $1 ORDER BY s.seat_code ASC`,
      [id],
    );

    const availableCountRes = await query(
      `SELECT COUNT(*) FROM seat_statuses WHERE trip_id = $1 AND (state IS NULL OR state = 'available')`,
      [id],
    );

    const routeRow = routeRes.rows[0] ?? null;
    if (routeRow) {
      (routeRow as any).stops = stopsRes.rows || [];
    }

    const details: TripWithDetails & { seats?: Array<any> } = {
      ...trip,
      route_info: routeRow,
      bus_info: busRes.rows[0] ?? null,
      available_seats: parseInt(availableCountRes.rows[0].count, 10),
      seats: seatsRes.rows,
    } as any;

    return details;
  }

  // Update trip; if bus_id changes, reinitialize seat_statuses for the new bus
  static async updateTrip(id: string, data: UpdateTripDTO) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // fetch current trip
      const cur = await client.query(`SELECT * FROM trips WHERE id = $1`, [id]);
      const existing = cur.rows[0] as Trip | undefined;
      if (!existing) {
        await client.query('ROLLBACK');
        return undefined;
      }

      const fields = [
        'route_id',
        'bus_id',
        'departure_time',
        'arrival_time',
        'base_price',
        'status',
      ];
      const sets: string[] = [];
      const params: any[] = [];
      let idx = 1;
      for (const f of fields) {
        if (Object.prototype.hasOwnProperty.call(data, f)) {
          sets.push(`${f} = $${idx}`);
          params.push((data as any)[f]);
          idx++;
        }
      }

      if (sets.length > 0) {
        params.push(id);
        const q = `UPDATE trips SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
        const updated = await client.query(q, params);

        // if bus_id changed, reset seat_statuses
        const newBusId =
          (data as any).bus_id !== undefined ? (data as any).bus_id : existing.bus_id;
        if (newBusId !== existing.bus_id) {
          // remove old seat statuses and create for new bus
          await client.query(`DELETE FROM seat_statuses WHERE trip_id = $1`, [id]);
          if (newBusId) {
            const seatsRes = await client.query(`SELECT id FROM seats WHERE bus_id = $1`, [
              newBusId,
            ]);
            if (seatsRes.rows.length > 0) {
              const insertParts: string[] = [];
              const insertParams: any[] = [];
              let pidx = 1;
              for (const s of seatsRes.rows) {
                insertParts.push(`($${pidx++}, $${pidx++}, $${pidx++})`);
                insertParams.push(id, s.id, 'available');
              }
              if (insertParts.length > 0)
                await client.query(
                  `INSERT INTO seat_statuses (trip_id, seat_id, state) VALUES ${insertParts.join(
                    ', ',
                  )}`,
                  insertParams,
                );
            }
          }
        }

        await client.query('COMMIT');
        return updated.rows[0] as Trip;
      }

      await client.query('COMMIT');
      return existing;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Return seat_status rows (with seat info) for a trip
  static async getSeatStatus(tripId: string) {
    const res = await query(
      `SELECT ss.*, s.seat_code, s.seat_type, s.is_active as seat_is_active FROM seat_statuses ss JOIN seats s ON s.id = ss.seat_id WHERE ss.trip_id = $1 ORDER BY s.seat_code ASC`,
      [tripId],
    );
    return res.rows as Array<
      SeatStatus & { seat_code?: string; seat_type?: string; seat_is_active?: boolean }
    >;
  }

  // Update state of multiple seats in a transaction.
  // state: 'available' | 'locked' | 'booked'
  // bookingId: if provided, will be applied or cleared when null is explicitly passed
  static async updateSeatStatuses(
    tripId: string,
    seatIds: string[],
    state: 'available' | 'locked' | 'booked',
    bookingId?: string | null,
    clientParam?: any,
  ): Promise<void> {
    if (!seatIds || seatIds.length === 0) return;
    const clientProvided = clientParam !== undefined && clientParam !== null;
    const client = clientProvided ? clientParam : await getClient();
    const shouldRelease = !clientProvided;
    try {
      if (!clientProvided) await client.query('BEGIN');

      // Build dynamic query depending on desired state and bookingId presence
      const params: any[] = [];
      const setParts: string[] = [];

      // state will be $1
      setParts.push(`state = $${params.length + 1}`);
      params.push(state);

      if (state === 'available') {
        setParts.push(`booking_id = NULL`);
        setParts.push(`locked_until = NULL`);
        setParts.push(`lock_owner = NULL`);
      } else if (state === 'booked') {
        // set booking_id to provided value (must be provided to mark booked)
        if (bookingId !== undefined) {
          setParts.push(`booking_id = $${params.length + 1}`);
          params.push(bookingId);
        }
        setParts.push(`locked_until = NULL`);
        setParts.push(`lock_owner = NULL`);
      } else if (state === 'locked') {
        // do not change locked_until here; separate method exists to set locked_until
        if (bookingId !== undefined) {
          // allow associating a booking while locking
          setParts.push(`booking_id = $${params.length + 1}`);
          params.push(bookingId);
        }
      }

      // next parameter will be trip_id
      params.push(tripId);
      const tripParamIndex = params.length; // index of trip_id in the params array

      // seat id placeholders follow trip_id
      const seatPlaceholders = seatIds.map((_, i) => `$${tripParamIndex + i + 1}`);
      params.push(...seatIds);

      const q = `UPDATE seat_statuses SET ${setParts.join(
        ', ',
      )} WHERE trip_id = $${tripParamIndex} AND seat_id IN (${seatPlaceholders.join(', ')})`;

      await client.query(q, params);

      if (!clientProvided) await client.query('COMMIT');
    } catch (err) {
      if (!clientProvided) await client.query('ROLLBACK');
      throw err;
    } finally {
      if (shouldRelease) client.release();
    }
  }

  // Get all seat statuses for a trip joined with seat info
  static async getSeatStatusesByTrip(tripId: string): Promise<SeatStatusWithInfo[]> {
    const res = await query(
      `SELECT ss.*, s.seat_code, s.seat_type, s.is_active as seat_is_active FROM seat_statuses ss JOIN seats s ON s.id = ss.seat_id WHERE ss.trip_id = $1 ORDER BY s.seat_code ASC`,
      [tripId],
    );
    return res.rows as SeatStatusWithInfo[];
  }

  // Release seats associated with a booking (set to available, clear booking_id and locked_until)
  static async releaseSeatsByBooking(bookingId: string): Promise<void> {
    if (!bookingId) return;
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE seat_statuses SET state = 'available', booking_id = NULL, locked_until = NULL, lock_owner = NULL WHERE booking_id = $1`,
        [bookingId],
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Attempt to lock seats in the DB for a trip until `lockedUntil`.
  // Returns false if any seat is already booked or currently locked (locked_until in future).
  static async lockSeatsInDatabase(
    tripId: string,
    seatIds: string[],
    lockedUntil: Date,
  ): Promise<boolean> {
    if (!seatIds || seatIds.length === 0) return false;
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Lock the rows for update to prevent races
      const params: any[] = [tripId, ...seatIds];
      const seatPlaceholders = seatIds.map((_, i) => `$${i + 2}`); // $2..n
      const selectQ = `SELECT * FROM seat_statuses WHERE trip_id = $1 AND seat_id IN (${seatPlaceholders.join(
        ', ',
      )}) FOR UPDATE`;
      const sel = await client.query(selectQ, params);

      const now = new Date();
      for (const row of sel.rows) {
        const st = row.state;
        const locked_until = row.locked_until ? new Date(row.locked_until) : null;
        if (st === 'booked') {
          await client.query('ROLLBACK');
          return false;
        }
        if (st === 'locked' && locked_until && locked_until > now) {
          await client.query('ROLLBACK');
          return false;
        }
      }

      // safe to lock: update state and locked_until
      const updateParams: any[] = [lockedUntil.toISOString(), tripId, ...seatIds];
      const updatePlaceholders = seatIds.map((_, i) => `$${i + 3}`); // $3..n
      const uq = `UPDATE seat_statuses SET state = 'locked', locked_until = $1 WHERE trip_id = $2 AND seat_id IN (${updatePlaceholders.join(
        ', ',
      )})`;
      await client.query(uq, updateParams);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Search trips with filters and simple pagination. Returns { items, total }
  static async searchTrips(filters: SearchFilters) {
    const clauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.route_id) {
      clauses.push(`trips.route_id = $${idx++}`);
      params.push(filters.route_id);
    }
    if (filters.bus_id) {
      clauses.push(`trips.bus_id = $${idx++}`);
      params.push(filters.bus_id);
    }
    if (filters.status) {
      clauses.push(`trips.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.origin) {
      clauses.push(`routes.origin ILIKE $${idx++}`);
      params.push(`%${filters.origin}%`);
    }
    if (filters.destination) {
      clauses.push(`routes.destination ILIKE $${idx++}`);
      params.push(`%${filters.destination}%`);
    }
    if (filters.departure_from) {
      clauses.push(`trips.departure_time >= $${idx++}`);
      params.push(filters.departure_from);
    }
    if (filters.departure_to) {
      clauses.push(`trips.departure_time <= $${idx++}`);
      params.push(filters.departure_to);
    }

    let where = '';
    if (clauses.length > 0) where = 'WHERE ' + clauses.join(' AND ');

    const limit = typeof filters.limit === 'number' ? filters.limit : 25;
    const offset = typeof filters.offset === 'number' ? filters.offset : 0;

    const q = `SELECT trips.*, routes.origin, routes.destination, buses.plate_number, buses.model, buses.seat_capacity
      FROM trips
      LEFT JOIN routes ON routes.id = trips.route_id
      LEFT JOIN buses ON buses.id = trips.bus_id
      ${where}
      ORDER BY trips.departure_time ASC
      LIMIT ${limit} OFFSET ${offset}`;

    const itemsRes = await query(q, params);

    // total count
    const countQ = `SELECT COUNT(*) as count FROM trips LEFT JOIN routes ON routes.id = trips.route_id ${where}`;
    const countRes = await query(countQ, params);

    const items = itemsRes.rows.map((r: any) => ({
      ...r,
      route_info:
        r.origin || r.destination
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
    })) as TripWithDetails[];

    return { items, total: parseInt(countRes.rows[0].count, 10) };
  }
}
