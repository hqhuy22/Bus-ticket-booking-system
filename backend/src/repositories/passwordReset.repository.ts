import { query } from '../config/db';

export default class PasswordResetRepository {
  static async create(token: { token: string; user_id: string; expires_at: string }) {
    const res = await query(
      `INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1,$2,$3) RETURNING *`,
      [token.token, token.user_id, token.expires_at],
    );
    return res.rows[0];
  }

  static async findByToken(tokenStr: string) {
    const res = await query(`SELECT * FROM password_reset_tokens WHERE token = $1`, [tokenStr]);
    return res.rows[0];
  }

  static async markUsed(id: string) {
    const res = await query(
      `UPDATE password_reset_tokens SET used = true WHERE id = $1 RETURNING *`,
      [id],
    );
    return res.rows[0];
  }
}
