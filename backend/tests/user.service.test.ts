import UserService from '../src/services/user.service';
import UserRepository from '../src/repositories/user.repository';
import { query } from '../src/config/db';

// These tests are minimal and assume a running test DB configured via env vars.

describe('UserService', () => {
  beforeAll(async () => {
    // ensure migrations ran
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        email text UNIQUE,
        phone text,
        password_hash text,
        verified_at timestamptz,
        role text,
        created_at timestamptz DEFAULT now()
      );
    `);
  });

  afterEach(async () => {
    await query(`DELETE FROM users`);
  });

  test('registers a user and sends verification email', async () => {
    const user = await UserService.register({ email: 'test@example.com', password: 'password123' });
    expect(user).toHaveProperty('id');
    const found = await UserRepository.findByEmail('test@example.com');
    expect(found).toBeDefined();
    expect(found?.email).toBe('test@example.com');
  });

  test('verifies email token', async () => {
    const user = await UserService.register({ email: 'verify@example.com', password: 'password123' });
    // generate token similarly to service
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET || 'devsecret',
      { expiresIn: '1d' }
    );

    const res = await UserService.verifyEmail(token);
    expect(res).toBe(true);
    const found = await UserRepository.findByEmail('verify@example.com');
    expect(found?.verified_at).toBeDefined();
  });
});
