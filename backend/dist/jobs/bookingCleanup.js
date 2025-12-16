"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireOldBookings = expireOldBookings;
exports.setupBookingCleanupJob = setupBookingCleanupJob;
const db_1 = require("../config/db");
/**
 * Expire bookings which are still 'pending' and past their expires_at.
 * For each expired booking, release seats (set booking_id = NULL, state = 'available', locked_until = NULL, lock_owner = NULL)
 * and update booking status to 'expired'. Logs summary information.
 */
async function expireOldBookings() {
    const client = await (0, db_1.getClient)();
    try {
        await client.query('BEGIN');
        // lock rows to process
        const nowQ = `SELECT id FROM bookings WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < now() FOR UPDATE`;
        const res = await client.query(nowQ);
        if (res.rows.length === 0) {
            await client.query('COMMIT');
            console.debug('[bookingCleanup] No expired pending bookings found');
            return;
        }
        const bookingIds = res.rows.map((r) => r.id);
        let expiredCount = 0;
        for (const id of bookingIds) {
            try {
                // release seats associated with this booking
                const releaseRes = await client.query(`UPDATE seat_statuses SET booking_id = NULL, state = 'available', locked_until = NULL, lock_owner = NULL WHERE booking_id = $1 RETURNING id`, [id]);
                // update booking status to expired
                const upd = await client.query(`UPDATE bookings SET status = 'expired' WHERE id = $1 RETURNING id`, [id]);
                expiredCount += upd.rows.length > 0 ? 1 : 0;
                console.info(`[bookingCleanup] Expired booking ${id}, released seats: ${releaseRes.rows.length}`);
            }
            catch (err) {
                // don't stop the whole batch if one booking fails
                console.error(`[bookingCleanup] Failed to expire booking ${id}:`, err);
            }
        }
        await client.query('COMMIT');
        console.info(`[bookingCleanup] Finished expiring bookings. Total expired: ${expiredCount}`);
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('[bookingCleanup] Error during expireOldBookings:', err);
    }
    finally {
        client.release();
    }
}
/**
 * Setup a periodic job to run expireOldBookings every minute.
 * Uses setInterval; caller (server.ts) should import and call this function once on startup.
 */
function setupBookingCleanupJob() {
    // run immediately once, then every minute
    void expireOldBookings().catch((e) => console.error('[bookingCleanup] Initial run failed:', e));
    const intervalMs = 60 * 1000; // 1 minute
    setInterval(() => {
        void expireOldBookings().catch((e) => console.error('[bookingCleanup] Scheduled run failed:', e));
    }, intervalMs);
    console.info('[bookingCleanup] Scheduled booking cleanup job to run every 1 minute');
}
exports.default = setupBookingCleanupJob;
