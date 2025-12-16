/// <reference types="jest" />
// Global test setup: mock redis client and token blacklist helpers to avoid
// real network connections and long-running handles in tests.

// Mock the redis module exported at src/utils/redis.ts
jest.mock('../src/utils/redis', () => {
  return {
    redis: null,
    ensureConnected: jest.fn().mockResolvedValue(false),
    default: null,
  };
});

// Mock token blacklist helper to be a resolved false by default
jest.mock('../src/utils/tokenBlacklist', () => ({
  isTokenBlacklisted: jest.fn().mockResolvedValue(false),
  blacklistToken: jest.fn().mockResolvedValue(undefined),
}));

// Prevent nodemailer transporter verification from running in EmailService ctor
jest.mock('nodemailer', () => ({
  createTransport: () => ({ verify: () => Promise.resolve(), sendMail: jest.fn().mockResolvedValue({ accepted: [] }) }),
}));

// Mock the Postgres DB pool to avoid opening real TCP connections during tests
jest.mock('../src/config/db', () => {
  // simple in-memory users store to simulate DB behavior for tests
  const users: any[] = [];
  const makeId = () => `mock-${Math.random().toString(36).slice(2)}`;

  const mockClient = {
    query: jest.fn(async (text: string, params?: any[]) => {
      const t = (text || '').toUpperCase();
      if (t.startsWith('BEGIN') || t.startsWith('COMMIT') || t.startsWith('ROLLBACK')) return {};

      if (t.includes('INSERT INTO USERS')) {
        const [email, phone, password_hash, role] = params || [];
        const user = { id: makeId(), email, phone, password_hash, role: role || 'user', created_at: new Date() };
        users.push(user);
        return { rows: [user] };
      }

      if (t.includes('SELECT * FROM USERS WHERE EMAIL')) {
        const email = params && params[0];
        const u = users.find((x) => x.email === email);
        return { rows: u ? [u] : [] };
      }

      if (t.includes('SELECT * FROM USERS WHERE ID')) {
        const id = params && params[0];
        const u = users.find((x) => x.id === id);
        return { rows: u ? [u] : [] };
      }

      if (t.includes('UPDATE USERS SET VERIFIED_AT')) {
        const id = params && params[0];
        const u = users.find((x) => x.id === id);
        if (u) {
          u.verified_at = new Date();
          return { rows: [u] };
        }
        return { rows: [] };
      }

      // default empty result for other queries
      return { rows: [] };
    }),
    release: jest.fn(),
  };

  const exportedQuery = jest.fn(async (text: string, params?: any[]) => mockClient.query(text, params));

  return {
    query: exportedQuery,
    getClient: jest.fn().mockResolvedValue(mockClient),
    default: null,
  };
});
