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
const mockRating = prisma.rating as any;
const mockReview = prisma.review as any;

// ─── Factories ──────────────────────────────────────────────────────────────

const createUserRecord = (overrides: Record<string, unknown> = {}) => ({
  userId: 1, // Matches @id userId in schema [cite: 1]
  username: 'testuser',
  email: 'testuser@example.com',
  subjectId: 'auth0|testuser1',
  role: 'User',
  createdAt: new Date(),
  ...overrides,
});

const createRatingRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  score: 4,
  createdAt: new Date(),
  // Matching the "select" structure in your controller [cite: 4]
  user: { userId: 1, username: 'testuser' },
  media: { tmdbId: 550, type: 'MOVIE' },
  ...overrides,
});

const createReviewRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Great film',
  body: 'Loved every second of it.', // Required in schema [cite: 5]
  createdAt: new Date(),
  user: { userId: 1, username: 'testuser' },
  media: { tmdbId: 550, type: 'MOVIE' },
  ...overrides,
});

/** Minimal TMDB response helpers remain the same */
const tmdbMovieResponse = (tmdbId: number, title: string) => ({ id: tmdbId, title });
const tmdbTvResponse = (tmdbId: number, name: string) => ({ id: tmdbId, name });

const mockTmdbFetch = (body: object) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => body,
  });
};

const mockTmdbFetchError = (status = 500) => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status, json: async () => ({}) });
};

// ─── Setup ──────────────────────────────────────────────────────────────────

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.TMDB_API_KEY = 'test-tmdb-api-key';
  const importedApp = await import('../src/app');
  app = importedApp.app;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

// ─── /api/ratings/me/enhanced ───────────────────────────────────────────────

describe('GET /api/ratings/me/enhanced', () => {
  it('should return 401 with no token', async () => {
    const res = await request(app).get('/api/ratings/me/enhanced');
    expect(res.status).toBe(401);
  });

  it('should return ratings with resolved titles', async () => {
    const rating = createRatingRecord();
    mockUser.findUnique.mockResolvedValue(createUserRecord());
    mockRating.findMany.mockResolvedValue([rating]); // Mock direct call
    mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

    const res = await request(app)
      .get('/api/ratings/me/enhanced')
      .set(authHeader({ sub: 1, role: 'User' }));

    expect(res.status).toBe(200);
    expect(res.body.ratings[0].media.title).toBe('Fight Club');
  });

  it('should return 404 when user is not found', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/ratings/me/enhanced')
      .set(authHeader({ sub: 999, role: 'User' }));

    expect(res.status).toBe(404);
  });
});

// ─── /api/reviews/me/enhanced ───────────────────────────────────────────────

describe('GET /api/reviews/me/enhanced', () => {
  it('should return reviews with resolved titles', async () => {
    const review = createReviewRecord();
    mockUser.findUnique.mockResolvedValue(createUserRecord());
    mockReview.findMany.mockResolvedValue([review]); // Mock direct call
    mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

    const res = await request(app)
      .get('/api/reviews/me/enhanced')
      .set(authHeader({ sub: 1, role: 'User' }));

    expect(res.status).toBe(200);
    expect(res.body.reviews[0].media.title).toBe('Fight Club');
  });

  it('should return 401 when user is not found (Controller behavior)', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/reviews/me/enhanced')
      .set(authHeader({ sub: 999, role: 'User' }));

    // Your getUserReviews controller returns 401 on "User not found"
    expect(res.status).toBe(401);
  });
});
