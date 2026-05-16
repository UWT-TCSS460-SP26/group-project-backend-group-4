/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma';
import { authHeader } from './helpers/authHelper';

let app: Express;

// ─── Prisma mock ────────────────────────────────────────────────────────────

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    rating: {
      findMany: jest.fn(),
    },
    review: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockUser = prisma.user as any;

// ─── Factory ────────────────────────────────────────────────────────────────

const createUserRecord = (overrides: Record<string, unknown> = {}) => ({
  userId: 1,
  username: 'testuser',
  email: 'testuser@example.com',
  subjectId: '1',
  role: 'User',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.TMDB_API_KEY = 'test-api-key';
  const importedApp = await import('../src/app');
  app = importedApp.app;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── GET /api/users/me ──────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
  });

  it('should return 401 when user is not found in the database', async () => {
    mockUser.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/users/me')
      .set(authHeader({ sub: '999', role: 'User' }));

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('User not found');
  });

  it('should return 200 with the full user profile', async () => {
    const user = createUserRecord();
    mockUser.findUnique.mockResolvedValue(user);

    const res = await request(app)
      .get('/api/users/me')
      .set(authHeader({ sub: '1', role: 'User' }));

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.userId).toBe(1);
    expect(res.body.user.username).toBe('testuser');
    expect(res.body.user.email).toBe('testuser@example.com');
    expect(res.body.user.subjectId).toBe('1');
    expect(res.body.user.role).toBe('User');
  });

  it('should return 500 when the database query fails', async () => {
    mockUser.findUnique.mockRejectedValue(new Error('DB connection failed'));

    const res = await request(app)
      .get('/api/users/me')
      .set(authHeader({ sub: '1', role: 'User' }));

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});
