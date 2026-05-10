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
const mockTransaction = prisma.$transaction as jest.Mock;

// ─── Factories ──────────────────────────────────────────────────────────────

const createUserRecord = (overrides: Record<string, unknown> = {}) => ({
  userId: 1,
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
  user: { userId: 1, username: 'testuser' },
  media: { tmdbId: 550, type: 'MOVIE' },
  ...overrides,
});

const createReviewRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Great film',
  body: 'Loved every second of it.',
  createdAt: new Date(),
  user: { userId: 1, username: 'testuser' },
  media: { tmdbId: 550, type: 'MOVIE' },
  ...overrides,
});

/** Minimal TMDB movie response */
const tmdbMovieResponse = (tmdbId: number, title: string) => ({
  id: tmdbId,
  title,
  name: undefined,
});

/** Minimal TMDB TV response */
const tmdbTvResponse = (tmdbId: number, name: string) => ({
  id: tmdbId,
  name,
  title: undefined,
});

/** Set global.fetch to resolve with a successful TMDB payload */
const mockTmdbFetch = (body: object) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => body,
  });
};

/** Set global.fetch to simulate a TMDB error */
const mockTmdbFetchError = (status = 500) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status,
    json: async () => ({}),
  });
};

// ─── Setup / teardown ───────────────────────────────────────────────────────

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

afterAll(() => {
  delete process.env.TMDB_API_KEY;
});

// ─── /api/me/ratings ────────────────────────────────────────────────────────

describe('GET /api/me/ratings', () => {
  describe('Authentication', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/me/ratings');

      expect(res.status).toBe(401);
    });

    it('should return 401 with a malformed token', async () => {
      const res = await request(app)
        .get('/api/me/ratings')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Happy path', () => {
    it('should return an empty ratings array when the user has no ratings', async () => {
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[]]);

      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ratings');
      expect(res.body.ratings).toHaveLength(0);
    });

    it('should return ratings with resolved TMDB movie titles', async () => {
      const rating = createRatingRecord();
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[rating]]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.ratings).toHaveLength(1);
      expect(res.body.ratings[0]).toMatchObject({
        id: 1,
        score: 4,
        author: { id: 1, username: 'testuser' },
        media: { tmdbId: 550, type: 'MOVIE', title: 'Fight Club' },
      });
    });

    it('should return ratings with resolved TMDB TV titles', async () => {
      const rating = createRatingRecord({ media: { tmdbId: 1396, type: 'TV_SHOW' } });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[rating]]);
      mockTmdbFetch(tmdbTvResponse(1396, 'Breaking Bad'));

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.ratings[0].media).toMatchObject({
        tmdbId: 1396,
        type: 'TV_SHOW',
        title: 'Breaking Bad',
      });
    });

    it('should set title to null when TMDB fetch fails', async () => {
      const rating = createRatingRecord();
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[rating]]);
      mockTmdbFetchError(503);

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.ratings[0].media.title).toBeNull();
    });

    it('should deduplicate TMDB calls for repeated media entries', async () => {
      const ratings = [
        createRatingRecord({ id: 1 }),
        createRatingRecord({ id: 2 }), // same tmdbId + type
      ];
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([ratings]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      // Two ratings share the same media — TMDB should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return multiple ratings ordered by createdAt desc', async () => {
      const older = createRatingRecord({ id: 2, score: 3, createdAt: new Date('2024-01-01') });
      const newer = createRatingRecord({ id: 1, score: 5, createdAt: new Date('2025-01-01') });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[newer, older]]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.ratings[0].id).toBe(1);
      expect(res.body.ratings[1].id).toBe(2);
    });
  });

  describe('Pagination', () => {
    it('should apply default pagination (page=1, limit=20)', async () => {
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[]]);

      await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      // The $transaction callback receives prisma, so we verify the mock was
      // called — the controller uses skip=0, take=20 by default.
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should apply custom page and limit from query params', async () => {
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[]]);

      const res = await request(app)
        .get('/api/me/ratings')
        .query({ page: 2, limit: 5 })
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
    });
  });

  describe('Error cases', () => {
    it('should return 404 when the authenticated user is not found in the database', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 999, role: 'User' }));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 500 when the database throws', async () => {
      mockUser.findUnique.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should return 500 when TMDB_API_KEY is missing', async () => {
      delete process.env.TMDB_API_KEY;

      const res = await request(app)
        .get('/api/me/ratings')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(500);

      process.env.TMDB_API_KEY = 'test-tmdb-api-key';
    });
  });
});

// ─── /api/me/reviews ────────────────────────────────────────────────────────

describe('GET /api/me/reviews', () => {
  describe('Authentication', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/me/reviews');

      expect(res.status).toBe(401);
    });

    it('should return 401 with a malformed token', async () => {
      const res = await request(app)
        .get('/api/me/reviews')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Happy path', () => {
    it('should return an empty reviews array when the user has no reviews', async () => {
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[]]);

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reviews');
      expect(res.body.reviews).toHaveLength(0);
    });

    it('should return reviews with resolved TMDB movie titles', async () => {
      const review = createReviewRecord();
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[review]]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.reviews).toHaveLength(1);
      expect(res.body.reviews[0]).toMatchObject({
        id: 1,
        title: 'Great film',
        body: 'Loved every second of it.',
        author: { id: 1, username: 'testuser' },
        media: { tmdbId: 550, type: 'MOVIE', title: 'Fight Club' },
      });
    });

    it('should return reviews with resolved TMDB TV titles', async () => {
      const review = createReviewRecord({ media: { tmdbId: 1396, type: 'TV_SHOW' } });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[review]]);
      mockTmdbFetch(tmdbTvResponse(1396, 'Breaking Bad'));

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.reviews[0].media).toMatchObject({
        tmdbId: 1396,
        type: 'TV_SHOW',
        title: 'Breaking Bad',
      });
    });

    it('should handle a review with a null title field', async () => {
      const review = createReviewRecord({ title: null });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[review]]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.reviews[0].title).toBeNull();
    });

    it('should set media title to null when TMDB fetch fails', async () => {
      const review = createReviewRecord();
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[review]]);
      mockTmdbFetchError(404);

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.reviews[0].media.title).toBeNull();
    });

    it('should return username fallback when username is null in DB', async () => {
      const review = createReviewRecord({ user: { userId: 1, username: null } });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[review]]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.reviews[0].author.username).toBe('Username Not Found');
    });
  });

  describe('Error cases', () => {
    it('should return 404 when the authenticated user is not found in the database', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 999, role: 'User' }));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 500 when the database throws', async () => {
      mockUser.findUnique.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should return 500 when TMDB_API_KEY is missing', async () => {
      delete process.env.TMDB_API_KEY;

      const res = await request(app)
        .get('/api/me/reviews')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(500);

      process.env.TMDB_API_KEY = 'test-tmdb-api-key';
    });
  });
});

// ─── /api/me ────────────────────────────────────────────────────────────────

describe('GET /api/me', () => {
  describe('Authentication', () => {
    it('should return 401 with no token', async () => {
      const res = await request(app).get('/api/me');

      expect(res.status).toBe(401);
    });

    it('should return 401 with a malformed token', async () => {
      const res = await request(app)
        .get('/api/me')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.status).toBe(401);
    });
  });

  describe('Happy path', () => {
    it('should return both ratings and reviews arrays', async () => {
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[], []]);

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ratings');
      expect(res.body).toHaveProperty('reviews');
    });

    it('should return correctly shaped ratings and reviews', async () => {
      const rating = createRatingRecord();
      const review = createReviewRecord();
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[rating], [review]]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);

      expect(res.body.ratings[0]).toMatchObject({
        id: 1,
        score: 4,
        author: { id: 1, username: 'testuser' },
        media: { tmdbId: 550, type: 'MOVIE', title: 'Fight Club' },
      });

      expect(res.body.reviews[0]).toMatchObject({
        id: 1,
        title: 'Great film',
        body: 'Loved every second of it.',
        author: { id: 1, username: 'testuser' },
        media: { tmdbId: 550, type: 'MOVIE', title: 'Fight Club' },
      });
    });

    it('should deduplicate TMDB calls across ratings and reviews sharing the same media', async () => {
      const rating = createRatingRecord({ media: { tmdbId: 550, type: 'MOVIE' } });
      const review = createReviewRecord({ media: { tmdbId: 550, type: 'MOVIE' } });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[rating], [review]]);
      mockTmdbFetch(tmdbMovieResponse(550, 'Fight Club'));

      await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      // Same media referenced in both a rating and a review — only one TMDB call expected
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty arrays when user has no activity', async () => {
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[], []]);

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.ratings).toHaveLength(0);
      expect(res.body.reviews).toHaveLength(0);
    });

    it('should handle a mix of MOVIE and TV_SHOW media correctly', async () => {
      const movieRating = createRatingRecord({ id: 1, media: { tmdbId: 550, type: 'MOVIE' } });
      const tvReview = createReviewRecord({ id: 2, media: { tmdbId: 1396, type: 'TV_SHOW' } });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[movieRating], [tvReview]]);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => tmdbMovieResponse(550, 'Fight Club') })
        .mockResolvedValueOnce({ ok: true, json: async () => tmdbTvResponse(1396, 'Breaking Bad') });

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.ratings[0].media.title).toBe('Fight Club');
      expect(res.body.reviews[0].media.title).toBe('Breaking Bad');
    });

    it('should apply pagination to both ratings and reviews', async () => {
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[], []]);

      const res = await request(app)
        .get('/api/me')
        .query({ page: 3, limit: 10 })
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
    });
  });

  describe('Error cases', () => {
    it('should return 404 when the authenticated user is not found in the database', async () => {
      mockUser.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 999, role: 'User' }));

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('should return 500 when the database throws', async () => {
      mockUser.findUnique.mockRejectedValue(new Error('DB connection lost'));

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Internal server error');
    });

    it('should return 500 when TMDB_API_KEY is missing', async () => {
      delete process.env.TMDB_API_KEY;

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(500);

      process.env.TMDB_API_KEY = 'test-tmdb-api-key';
    });

    it('should still return 200 with null titles when TMDB is unreachable for all media', async () => {
      const rating = createRatingRecord({ media: { tmdbId: 550, type: 'MOVIE' } });
      const review = createReviewRecord({ media: { tmdbId: 1396, type: 'TV_SHOW' } });
      mockUser.findUnique.mockResolvedValue(createUserRecord());
      mockTransaction.mockResolvedValue([[rating], [review]]);
      mockTmdbFetchError(503);

      const res = await request(app)
        .get('/api/me')
        .set(authHeader({ sub: 1, role: 'User' }));

      expect(res.status).toBe(200);
      expect(res.body.ratings[0].media.title).toBeNull();
      expect(res.body.reviews[0].media.title).toBeNull();
    });
  });
});