import { query, getClient } from '../config/db';
import { Route, RouteStop } from '../models/route';

// DTOs / input shapes (small, local definitions)
export interface CreateRouteDTO {
  operator_id?: string | null;
  origin: string;
  destination: string;
  distance_km?: number;
  estimated_minutes?: number;
  stops?: RouteStopDTO[];
}

export interface UpdateRouteDTO {
  operator_id?: string | null;
  origin?: string;
  destination?: string;
  distance_km?: number | null;
  estimated_minutes?: number | null;
}

export interface RouteStopDTO {
  stop_name: string;
  stop_order: number;
  pickup_time_offset?: number;
  stop_type?: 'pickup' | 'dropoff' | 'both';
  is_active?: boolean;
}

export interface UpdateStopDTO {
  stop_name?: string;
  stop_order?: number;
  pickup_time_offset?: number | null;
  stop_type?: 'pickup' | 'dropoff' | 'both' | null;
  is_active?: boolean | null;
}

export default class RouteRepository {
  // Create route and optional stops in a transaction
  static async createRoute(data: CreateRouteDTO) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const r = await client.query(
        `INSERT INTO routes (operator_id, origin, destination, distance_km, estimated_minutes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [
          data.operator_id ?? null,
          data.origin,
          data.destination,
          data.distance_km ?? null,
          data.estimated_minutes ?? null,
        ],
      );
      const route = r.rows[0] as Route;

      const stops: RouteStop[] = [];
      if (data.stops && data.stops.length > 0) {
        for (const s of data.stops) {
          const res = await client.query(
            `INSERT INTO route_stops (route_id, stop_name, stop_order, pickup_time_offset, stop_type, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [
              route.id,
              s.stop_name,
              s.stop_order,
              s.pickup_time_offset ?? 0,
              s.stop_type ?? 'both',
              s.is_active ?? true,
            ],
          );
          stops.push(res.rows[0] as RouteStop);
        }
      }

      await client.query('COMMIT');
      return { ...route, stops };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Update route fields
  static async updateRoute(id: string, data: UpdateRouteDTO) {
    const fields = ['operator_id', 'origin', 'destination', 'distance_km', 'estimated_minutes'];
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
    if (sets.length === 0) {
      const res = await query(`SELECT * FROM routes WHERE id = $1`, [id]);
      return res.rows[0] as Route | undefined;
    }
    params.push(id);
    const q = `UPDATE routes SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(q, params);
    return res.rows[0] as Route;
  }

  // Get a route together with its stops ordered by stop_order
  static async getRouteWithStops(id: string) {
    const r = await query(`SELECT * FROM routes WHERE id = $1`, [id]);
    const route = r.rows[0] as Route | undefined;
    if (!route) return undefined;
    const s = await query(`SELECT * FROM route_stops WHERE route_id = $1 ORDER BY stop_order ASC`, [
      id,
    ]);
    return { ...route, stops: s.rows as RouteStop[] };
  }

  // Add a stop to a route. This will shift existing stops with >= stop_order up by 1.
  static async addRouteStop(routeId: string, stop: RouteStopDTO) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      // shift existing stops
      await client.query(
        `UPDATE route_stops SET stop_order = stop_order + 1 WHERE route_id = $1 AND stop_order >= $2`,
        [routeId, stop.stop_order],
      );
      const res = await client.query(
        `INSERT INTO route_stops (route_id, stop_name, stop_order, pickup_time_offset, stop_type, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [
          routeId,
          stop.stop_name,
          stop.stop_order,
          stop.pickup_time_offset ?? 0,
          stop.stop_type ?? 'both',
          stop.is_active ?? true,
        ],
      );
      await client.query('COMMIT');
      return res.rows[0] as RouteStop;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Update a single stop, handling reordering within the same route when stop_order changes
  static async updateRouteStop(stopId: string, data: UpdateStopDTO) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const cur = await client.query(`SELECT * FROM route_stops WHERE id = $1`, [stopId]);
      const existing = cur.rows[0] as RouteStop | undefined;
      if (!existing) {
        await client.query('ROLLBACK');
        return undefined;
      }
      const routeId = existing.route_id;
      const oldOrder = existing.stop_order;
      const newOrder = typeof data.stop_order === 'number' ? data.stop_order : oldOrder;

      if (newOrder !== oldOrder) {
        if (newOrder < oldOrder) {
          await client.query(
            `UPDATE route_stops SET stop_order = stop_order + 1 WHERE route_id = $1 AND stop_order >= $2 AND stop_order < $3 AND id <> $4`,
            [routeId, newOrder, oldOrder, stopId],
          );
        } else {
          await client.query(
            `UPDATE route_stops SET stop_order = stop_order - 1 WHERE route_id = $1 AND stop_order > $2 AND stop_order <= $3 AND id <> $4`,
            [routeId, oldOrder, newOrder, stopId],
          );
        }
      }

      const fields: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (data.stop_name !== undefined) {
        fields.push(`stop_name = $${idx++}`);
        params.push(data.stop_name);
      }
      if (data.stop_order !== undefined) {
        fields.push(`stop_order = $${idx++}`);
        params.push(data.stop_order);
      }
      if (data.pickup_time_offset !== undefined) {
        fields.push(`pickup_time_offset = $${idx++}`);
        params.push(data.pickup_time_offset);
      }
      if (data.stop_type !== undefined) {
        fields.push(`stop_type = $${idx++}`);
        params.push(data.stop_type);
      }
      if (data.is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        params.push(data.is_active);
      }
      if (fields.length > 0) {
        params.push(stopId);
        const q = `UPDATE route_stops SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
        const updated = await client.query(q, params);
        await client.query('COMMIT');
        return updated.rows[0] as RouteStop;
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

  // Delete a stop and compact the ordering
  static async deleteRouteStop(stopId: string) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const cur = await client.query(`SELECT * FROM route_stops WHERE id = $1`, [stopId]);
      const existing = cur.rows[0] as RouteStop | undefined;
      if (!existing) {
        await client.query('ROLLBACK');
        return false;
      }
      const routeId = existing.route_id;
      const oldOrder = existing.stop_order;
      await client.query(`DELETE FROM route_stops WHERE id = $1`, [stopId]);
      await client.query(
        `UPDATE route_stops SET stop_order = stop_order - 1 WHERE route_id = $1 AND stop_order > $2`,
        [routeId, oldOrder],
      );
      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // List routes with optional simple filters: operator_id, origin, destination, limit, offset
  static async listAllRoutes(filters?: {
    operator_id?: string;
    origin?: string;
    destination?: string;
    limit?: number;
    offset?: number;
  }) {
    const clauses: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (filters) {
      if (filters.operator_id) {
        clauses.push(`operator_id = $${idx++}`);
        params.push(filters.operator_id);
      }
      if (filters.origin) {
        clauses.push(`origin ILIKE $${idx++}`);
        params.push(`%${filters.origin}%`);
      }
      if (filters.destination) {
        clauses.push(`destination ILIKE $${idx++}`);
        params.push(`%${filters.destination}%`);
      }
    }
    let q = 'SELECT * FROM routes';
    if (clauses.length > 0) q += ' WHERE ' + clauses.join(' AND ');
    q += ' ORDER BY origin, destination';
    if (filters && typeof filters.limit === 'number') {
      q += ` LIMIT ${filters.limit}`;
    }
    if (filters && typeof filters.offset === 'number') {
      q += ` OFFSET ${filters.offset}`;
    }
    const res = await query(q, params);
    return res.rows as Route[];
  }
}
