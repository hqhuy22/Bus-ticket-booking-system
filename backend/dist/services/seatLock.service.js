"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../utils/redis");
const db_1 = require("../config/db");
const KEY_PREFIX = 'seat_lock:'; // seat_lock:{tripId}:{seatId}
function redisKey(tripId, seatId) {
    return `${KEY_PREFIX}${tripId}:${seatId}`;
}
class SeatLockService {
    /**
     * Try to lock multiple seats in Redis (preferred) or fall back to DB-only locking.
     * Returns true if all seats locked, false if any were already locked.
     */
    static async lockSeats(tripId, seatIds, sessionId, durationMinutes = 5) {
        if (!seatIds || seatIds.length === 0)
            return true;
        const ttl = Math.max(1, Math.floor(durationMinutes * 60));
        try {
            const r = redis_1.redis;
            if (r && (await (0, redis_1.ensureConnected)())) {
                // Attempt to set all keys with NX. If any fail, roll back the ones we set.
                const keys = seatIds.map((s) => redisKey(tripId, s));
                const pipeline = r.pipeline();
                for (const k of keys) {
                    // ioredis set: set(key, value, 'EX', seconds, 'NX')
                    pipeline.set(k, sessionId, 'EX', ttl, 'NX');
                }
                const results = (await pipeline.exec()) || [];
                // results is array of [err, res]
                const succeededKeys = [];
                for (let i = 0; i < results.length; i++) {
                    const [, res] = results[i];
                    if (res === 'OK')
                        succeededKeys.push(keys[i]);
                }
                if (succeededKeys.length === keys.length) {
                    // Persist lock_owner in DB so other paths can discover session ownership
                    try {
                        const client = await (0, db_1.getClient)();
                        try {
                            await client.query('BEGIN');
                            const q = `UPDATE seat_statuses SET lock_owner = $1, locked_until = now() + ($2 || ' seconds')::interval WHERE trip_id = $3 AND seat_id = ANY($4)`;
                            await client.query(q, [sessionId, Math.floor(ttl), tripId, seatIds]);
                            await client.query('COMMIT');
                        }
                        catch (e) {
                            await client.query('ROLLBACK');
                            throw e;
                        }
                        finally {
                            client.release();
                        }
                    }
                    catch (e) {
                        // if we fail to persist lock owner into DB, rollback redis locks to avoid inconsistency
                        await r.del(...succeededKeys);
                        throw e;
                    }
                    return true;
                }
                // rollback keys we set
                if (succeededKeys.length > 0)
                    await r.del(...succeededKeys);
                return false;
            }
            // Redis not available -> DB-only locking
            const client = await (0, db_1.getClient)();
            try {
                await client.query('BEGIN');
                // Only lock seats that are not booked and not currently locked
                const q = `UPDATE seat_statuses SET locked_until = now() + ($3 || ' seconds')::interval, lock_owner = $4
          WHERE trip_id = $1 AND seat_id = ANY($2)
            AND (booking_id IS NULL)
            AND (locked_until IS NULL OR locked_until <= now())
          RETURNING seat_id`;
                const res = await client.query(q, [tripId, seatIds, ttl, sessionId]);
                const updated = res.rows.map((r) => r.seat_id);
                if (updated.length !== seatIds.length) {
                    await client.query('ROLLBACK');
                    console.info('DB-only lockSeats: partial lock', { tripId, seatIds, updated });
                    return false;
                }
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
        catch (err) {
            console.error('lockSeats error', { tripId, seatIds, err });
            // In case of unexpected error, return false to avoid double booking
            return false;
        }
    }
    /**
     * Unlock seats only if the sessionId matches the lock owner (Redis).
     * In DB-only fallback we cannot verify sessionId (schema lacks owner field) so we clear locked_until and log a warning.
     */
    static async unlockSeats(tripId, seatIds, sessionId) {
        if (!seatIds || seatIds.length === 0)
            return;
        try {
            const r = redis_1.redis;
            if (r && (await (0, redis_1.ensureConnected)())) {
                const keys = seatIds.map((s) => redisKey(tripId, s));
                // read values in bulk
                const vals = (await r.mget(...keys)) || [];
                const toDelete = [];
                for (let i = 0; i < keys.length; i++) {
                    const v = vals[i];
                    if (v && (sessionId ? v === sessionId : true))
                        toDelete.push(keys[i]);
                }
                if (toDelete.length > 0)
                    await r.del(...toDelete);
                return;
            }
            // DB-only fallback: verify lock_owner matches sessionId before clearing
            console.info('unlockSeats: Redis unavailable, falling back to DB-only unlock (will verify lock_owner)');
            const client = await (0, db_1.getClient)();
            try {
                await client.query('BEGIN');
                await client.query(`UPDATE seat_statuses SET locked_until = NULL, lock_owner = NULL WHERE trip_id = $1 AND seat_id = ANY($2) AND lock_owner = $3`, [tripId, seatIds, sessionId]);
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
        catch (err) {
            console.error('unlockSeats error', { tripId, seatIds, err });
            throw err;
        }
    }
    /**
     * Check availability for multiple seats. Returns per-seat availability and optional lockedBy (sessionId from Redis).
     */
    static async checkSeatAvailability(tripId, seatIds) {
        if (!seatIds || seatIds.length === 0)
            return [];
        try {
            const result = [];
            // First check Redis locks if available
            const r = redis_1.redis;
            const redisAvailable = !!r && (await (0, redis_1.ensureConnected)());
            const keys = seatIds.map((s) => redisKey(tripId, s));
            let redisVals = [];
            if (redisAvailable) {
                redisVals = (await r.mget(...keys)) || [];
            }
            else {
                redisVals = Array(seatIds.length).fill(null);
            }
            // Query DB seat_statuses for provided seats
            const q = `SELECT seat_id, booking_id, state, locked_until, lock_owner FROM seat_statuses WHERE trip_id = $1 AND seat_id = ANY($2)`;
            const dbRes = await (0, db_1.query)(q, [tripId, seatIds]);
            const dbMap = {};
            for (const row of dbRes.rows)
                dbMap[row.seat_id] = row;
            for (let i = 0; i < seatIds.length; i++) {
                const seatId = seatIds[i];
                const rv = redisVals[i];
                if (rv) {
                    result.push({ seatId, available: false, lockedBy: rv });
                    continue;
                }
                const dbRow = dbMap[seatId];
                if (!dbRow) {
                    // If no seat_status row found assume unavailable to be safe
                    result.push({ seatId, available: false });
                    continue;
                }
                const lockedUntil = dbRow.locked_until ? new Date(dbRow.locked_until) : null;
                const now = new Date();
                const isLocked = lockedUntil && lockedUntil > now;
                const isBooked = !!dbRow.booking_id;
                const available = !isLocked && !isBooked && (!dbRow.state || dbRow.state === 'available');
                result.push({
                    seatId,
                    available,
                    ...(isLocked ? { lockedBy: dbRow.lock_owner || 'db' } : {}),
                });
            }
            return result;
        }
        catch (err) {
            console.error('checkSeatAvailability error', { tripId, seatIds, err });
            // On error, conservatively report seats as unavailable
            return seatIds.map((s) => ({ seatId: s, available: false }));
        }
    }
    /**
     * Refresh TTL for locks owned by sessionId. Returns true if all refreshed, false otherwise.
     */
    static async refreshLock(tripId, seatIds, sessionId, durationMinutes = 5) {
        if (!seatIds || seatIds.length === 0)
            return true;
        const ttl = Math.max(1, Math.floor(durationMinutes * 60));
        try {
            const r = redis_1.redis;
            if (r && (await (0, redis_1.ensureConnected)())) {
                const keys = seatIds.map((s) => redisKey(tripId, s));
                // For each key, only update TTL if value matches sessionId
                const pipeline = r.pipeline();
                for (const k of keys) {
                    // Using EVAL to check-and-expire atomically
                    const script = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('expire', KEYS[1], tonumber(ARGV[2])) else return 0 end`;
                    pipeline.eval(script, 1, k, sessionId, String(ttl));
                }
                const results = (await pipeline.exec()) || [];
                // success when returned 1 for each
                for (const [, res] of results) {
                    if (res !== 1)
                        return false;
                }
                return true;
            }
            // DB-only fallback: only refresh locks owned by sessionId
            console.info('refreshLock: Redis unavailable, DB-only refresh (will verify lock_owner)');
            const client = await (0, db_1.getClient)();
            try {
                await client.query('BEGIN');
                const q = `UPDATE seat_statuses SET locked_until = now() + ($3 || ' seconds')::interval
          WHERE trip_id = $1 AND seat_id = ANY($2) AND lock_owner = $4 AND (locked_until IS NOT NULL AND locked_until > now()) RETURNING seat_id`;
                const res = await client.query(q, [tripId, seatIds, Math.floor(ttl), sessionId]);
                if (res.rows.length !== seatIds.length) {
                    await client.query('ROLLBACK');
                    return false;
                }
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
        catch (err) {
            console.error('refreshLock error', { tripId, seatIds, err });
            return false;
        }
    }
    /**
     * Return list of seatIds currently locked for a trip.
     */
    static async getLockedSeats(tripId) {
        try {
            const r = redis_1.redis;
            if (r && (await (0, redis_1.ensureConnected)())) {
                // keys pattern
                const pattern = `${KEY_PREFIX}${tripId}:*`;
                // use scan to collect keys
                let cursor = '0';
                const found = [];
                do {
                    // eslint-disable-next-line no-await-in-loop
                    const res = await r.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
                    cursor = res[0];
                    const keys = res[1];
                    found.push(...keys);
                } while (cursor !== '0');
                // extract seatIds
                return found.map((k) => k.split(':').pop());
            }
            // DB-only fallback: seats with locked_until in the future
            const q = `SELECT seat_id FROM seat_statuses WHERE trip_id = $1 AND locked_until IS NOT NULL AND locked_until > now()`;
            const res = await (0, db_1.query)(q, [tripId]);
            return res.rows.map((r) => r.seat_id);
        }
        catch (err) {
            console.error('getLockedSeats error', { tripId, err });
            return [];
        }
    }
}
exports.default = SeatLockService;
