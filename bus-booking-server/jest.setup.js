// Jest setup file for unit tests
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock console methods to reduce noise during tests (optional)
// Note: console mocking is handled in individual test files if needed
