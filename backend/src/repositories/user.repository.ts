import { query } from '../config/db';
import { User } from '../models/user';

export default class UserRepository {
  static async create(user: Partial<User>, client?: any) {
    const { email, phone, password_hash, role } = user;
    const executor = client ? client.query.bind(client) : query;
    const res = await executor(
      `INSERT INTO users (email, phone, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *`,
      [email ?? null, phone ?? null, password_hash ?? null, role ?? 'user'],
    );
    return res.rows[0] as User;
  }

  static async findByEmail(email: string) {
    const res = await query(`SELECT * FROM users WHERE email = $1`, [email]);
    return res.rows[0] as User | undefined;
  }

  static async findById(id: string) {
    const res = await query(`SELECT * FROM users WHERE id = $1`, [id]);
    return res.rows[0] as User | undefined;
  }

  static async markVerified(id: string) {
    // ensure column exists (safe idempotent in case migrations not applied)
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at timestamptz;`);
    const res = await query(`UPDATE users SET verified_at = now() WHERE id = $1 RETURNING *`, [id]);
    return res.rows[0] as User;
  }
}
