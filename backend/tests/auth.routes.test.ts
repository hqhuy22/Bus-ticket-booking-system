import request from 'supertest';
import app from '../src/server';
import UserRepository from '../src/repositories/user.repository';
import jwt from 'jsonwebtoken';

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('registers a user via HTTP', async () => {
    // mock repository to avoid DB calls
    jest.spyOn(UserRepository, 'findByEmail').mockResolvedValue(undefined as any);
    jest.spyOn(UserRepository, 'create').mockImplementation(async (user: any) => ({
      id: 'test-uuid',
      email: user.email,
      phone: user.phone,
      password_hash: user.password_hash,
      created_at: new Date(),
    } as any));

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'huyquang222004@gmail.com', phone: '0123456789', password: '12345678' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'test-uuid');
    expect(res.body).toHaveProperty('email', 'huyquang222004@gmail.com');
    expect(res.body).toHaveProperty('phone', '0123456789');
  });

  test('verifies email via HTTP', async () => {
    const user = { id: 'test-uuid', email: 'huyquang222004@gmail.com' } as any;

    jest.spyOn(UserRepository, 'findById').mockResolvedValue(user);
    jest.spyOn(UserRepository, 'markVerified').mockResolvedValue({ ...user, verified_at: new Date() } as any);

    const secret = process.env.JWT_SECRET || 'devsecret';
    const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '1d' });

    const res = await request(app).get(`/api/v1/auth/verify`).query({ token });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'verified');
  });
});
