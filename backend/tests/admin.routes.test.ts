import request from 'supertest';
import app from '../src/server';
import jwt from 'jsonwebtoken';

describe('Admin routes protection', () => {
  test('non-admin user receives 403', async () => {
    const token = jwt.sign({ sub: 'user-id', email: 'user@example.com', role: 'user' }, process.env.JWT_SECRET || 'devsecret');
    const res = await request(app).get('/api/v1/admin/operators').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test('unauthenticated receives 401', async () => {
    const res = await request(app).get('/api/v1/admin/operators');
    expect(res.status).toBe(401);
  });
});
