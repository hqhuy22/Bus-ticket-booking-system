"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class UserRepository {
    static async create(user, client) {
        const { email, phone, password_hash, role } = user;
        const executor = client ? client.query.bind(client) : db_1.query;
        const res = await executor(`INSERT INTO users (email, phone, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *`, [email ?? null, phone ?? null, password_hash ?? null, role ?? 'user']);
        return res.rows[0];
    }
    static async findByEmail(email) {
        const res = await (0, db_1.query)(`SELECT * FROM users WHERE email = $1`, [email]);
        return res.rows[0];
    }
    static async findById(id) {
        const res = await (0, db_1.query)(`SELECT * FROM users WHERE id = $1`, [id]);
        return res.rows[0];
    }
    static async markVerified(id) {
        // ensure column exists (safe idempotent in case migrations not applied)
        await (0, db_1.query)(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at timestamptz;`);
        const res = await (0, db_1.query)(`UPDATE users SET verified_at = now() WHERE id = $1 RETURNING *`, [id]);
        return res.rows[0];
    }
}
exports.default = UserRepository;
