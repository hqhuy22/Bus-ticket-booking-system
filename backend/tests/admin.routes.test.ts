import request from 'supertest';
// Mock token blacklist to avoid Redis dependency and long async handles in auth middleware
jest.mock('../src/utils/tokenBlacklist', () => ({ isTokenBlacklisted: jest.fn().mockResolvedValue(false) }));
import app from '../src/server';
import jwt from 'jsonwebtoken';

describe('Admin routes protection', () => {
  const secret = process.env.JWT_SECRET || 'devsecret';

  test('non-admin user receives 403', async () => {
    const token = jwt.sign({ sub: 'user-id', email: 'user@example.com', role: 'user' }, secret);
    const res = await request(app).get('/api/v1/admin/operators').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('unauthenticated receives 401', async () => {
    const res = await request(app).get('/api/v1/admin/operators');
    expect(res.status).toBe(401);
  });
});
