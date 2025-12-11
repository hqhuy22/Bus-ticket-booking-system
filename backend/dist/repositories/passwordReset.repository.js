"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
class PasswordResetRepository {
    static async create(token) {
        const res = await (0, db_1.query)(`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1,$2,$3) RETURNING *`, [token.token, token.user_id, token.expires_at]);
        return res.rows[0];
    }
    static async findByToken(tokenStr) {
        const res = await (0, db_1.query)(`SELECT * FROM password_reset_tokens WHERE token = $1`, [tokenStr]);
        return res.rows[0];
    }
    static async markUsed(id) {
        const res = await (0, db_1.query)(`UPDATE password_reset_tokens SET used = true WHERE id = $1 RETURNING *`, [id]);
        return res.rows[0];
    }
}
exports.default = PasswordResetRepository;
