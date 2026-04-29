/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma';
import { authHeader } from './helpers/authHelper';

let app: Express;

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    rating: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    media: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockRating = prisma.rating as any;
const mockMedia = prisma.media as any;
const mockTransaction = prisma.$transaction as jest.Mock;

const createRatingRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  userId: 1,
  mediaId: 1,
  score: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
  user: { username: 'testuser' },
  media: { tmdbId: 123, type: 'MOVIE' },
  ...overrides,
});

const createMediaRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  tmdbId: 12345,
  type: 'MOVIE',
  avgRating: 0,
  totalRatings: 0,
  totalReviews: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.TMDB_API_KEY = 'test-tmdb-api-key';

  const importedApp = await import('../src/app');
  app = importedApp.app;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Ratings API', () => {
  describe('GET /api/ratings', () => {
    // ========== BASIC PAGINATION TESTS ==========
    it('should return ratings with default pagination', async () => {
      mockRating.findMany.mockResolvedValue([
        createRatingRecord({ id: 1 }),
        createRatingRecord({ id: 2 }),
      ]);
      mockRating.count.mockResolvedValue(2);

      const response = await request(app).get('/api/ratings');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.total).toBe(2);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should return ratings with custom pagination', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(50);

      const response = await request(app).get('/api/ratings').query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.totalPages).toBe(5);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should normalize page 0 to page 1', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ page: 0, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(mockRating.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it('should normalize negative page to page 1', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ page: -5, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(mockRating.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it('should treat limit 0 as invalid and use default limit 20', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ limit: 0 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(20);
      expect(mockRating.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }));
    });

    it('should normalize negative limit to limit 1', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ limit: -10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should handle very large page numbers returning empty results', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(10);

      const response = await request(app).get('/api/ratings').query({ page: 1000, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.page).toBe(1000);
    });

    it('should handle very large limit', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ limit: 10000 });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10000 }));
    });

    it('should handle non-integer page', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ page: '1.5', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
    });

    // ========== QUERY BY USERID TESTS ==========
    it('should filter by userId alone', async () => {
      const ratings = [
        createRatingRecord({ id: 1, userId: 5, score: 4 }),
        createRatingRecord({ id: 2, userId: 5, score: 5 }),
      ];
      mockRating.findMany.mockResolvedValue(ratings);
      mockRating.count.mockResolvedValue(2);

      const response = await request(app).get('/api/ratings').query({ userId: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 5 }),
        })
      );
    });

    it('should filter by userId with pagination', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord({ userId: 3, score: 3 })]);
      mockRating.count.mockResolvedValue(25);

      const response = await request(app)
        .get('/api/ratings')
        .query({ userId: 3, page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 3 },
          skip: 10,
          take: 10,
        })
      );
      expect(response.body.pagination.totalPages).toBe(3);
    });

    it('should filter by userId as string (coerced to number)', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord({ userId: 7 })]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ userId: '7' });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 7 }),
        })
      );
    });

    it('should return empty results for userId with no ratings', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(0);

      const response = await request(app).get('/api/ratings').query({ userId: 999 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    // ========== QUERY BY MEDIAID TESTS ==========
    it('should filter by mediaId alone', async () => {
      const ratings = [
        createRatingRecord({ id: 1, mediaId: 7, score: 4 }),
        createRatingRecord({ id: 2, mediaId: 7, score: 5 }),
      ];
      mockRating.findMany.mockResolvedValue(ratings);
      mockRating.count.mockResolvedValue(2);

      const response = await request(app).get('/api/ratings').query({ mediaId: 7 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mediaId: 7 }),
        })
      );
    });

    it('should filter by mediaId with pagination', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord({ mediaId: 10, score: 2 })]);
      mockRating.count.mockResolvedValue(15);

      const response = await request(app)
        .get('/api/ratings')
        .query({ mediaId: 10, page: 2, limit: 5 });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mediaId: 10 },
          skip: 5,
          take: 5,
        })
      );
    });

    it('should filter by mediaId as string (coerced to number)', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord({ mediaId: 11 })]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ mediaId: '11' });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mediaId: 11 }),
        })
      );
    });

    it('should return empty results for mediaId with no ratings', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(0);

      const response = await request(app).get('/api/ratings').query({ mediaId: 9999 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    // ========== QUERY BY TMDBID + TYPE TESTS ==========
    it('should filter by tmdbId and type together', async () => {
      const ratings = [
        createRatingRecord({ id: 1, media: { tmdbId: 550, type: 'MOVIE' }, score: 5 }),
      ];
      mockRating.findMany.mockResolvedValue(ratings);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ tmdbId: 550, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            media: { tmdbId: 550, type: 'MOVIE' },
          }),
        })
      );
    });

    it('should filter by tmdbId and type with pagination', async () => {
      mockRating.findMany.mockResolvedValue([
        createRatingRecord({ media: { tmdbId: 1399, type: 'TV_SHOW' }, score: 4 }),
      ]);
      mockRating.count.mockResolvedValue(8);

      const response = await request(app)
        .get('/api/ratings')
        .query({ tmdbId: 1399, type: 'TV_SHOW', page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { media: { tmdbId: 1399, type: 'TV_SHOW' } },
          skip: 0,
          take: 5,
        })
      );
    });

    it('should filter by tmdbId and type as strings (coerced to number)', async () => {
      mockRating.findMany.mockResolvedValue([
        createRatingRecord({ media: { tmdbId: 550, type: 'MOVIE' } }),
      ]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/ratings')
        .query({ tmdbId: '550', type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            media: { tmdbId: 550, type: 'MOVIE' },
          }),
        })
      );
    });

    it('should accept both MOVIE and TV_SHOW types', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(0);

      const response1 = await request(app)
        .get('/api/ratings')
        .query({ tmdbId: 123, type: 'MOVIE' });
      const response2 = await request(app)
        .get('/api/ratings')
        .query({ tmdbId: 456, type: 'TV_SHOW' });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    it('should return empty results for tmdbId + type with no ratings', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/ratings')
        .query({ tmdbId: 99999, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    it('should return 400 if tmdbId is provided without type', async () => {
      const response = await request(app).get('/api/ratings').query({ tmdbId: 123 });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Both tmdbId and type are required together');
    });

    it('should return 400 if type is provided without tmdbId', async () => {
      const response = await request(app).get('/api/ratings').query({ type: 'MOVIE' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Both tmdbId and type are required together');
    });

    it('should return 400 if type is invalid', async () => {
      const response = await request(app)
        .get('/api/ratings')
        .query({ tmdbId: 123, type: 'INVALID' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid media type');
    });

    // ========== COMBINED PARAMETER TESTS ==========
    it('should prioritize mediaId over tmdbId + type when all are provided', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord({ mediaId: 5, score: 3 })]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/ratings')
        .query({ mediaId: 5, tmdbId: 550, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mediaId: 5 }),
        })
      );
    });

    it('should combine userId + mediaId filters', async () => {
      mockRating.findMany.mockResolvedValue([
        createRatingRecord({ userId: 2, mediaId: 3, score: 5 }),
      ]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings').query({ userId: 2, mediaId: 3 });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 2, mediaId: 3 }),
        })
      );
    });

    it('should combine userId + tmdbId + type filters', async () => {
      mockRating.findMany.mockResolvedValue([
        createRatingRecord({ userId: 4, media: { tmdbId: 550, type: 'MOVIE' }, score: 4 }),
      ]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/ratings')
        .query({ userId: 4, tmdbId: 550, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 4,
            media: { tmdbId: 550, type: 'MOVIE' },
          }),
        })
      );
    });

    it('should handle multiple query params with pagination', async () => {
      mockRating.findMany.mockResolvedValue([
        createRatingRecord({ userId: 1, mediaId: 2, score: 3 }),
      ]);
      mockRating.count.mockResolvedValue(7);

      const response = await request(app)
        .get('/api/ratings')
        .query({ userId: 1, mediaId: 2, page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, mediaId: 2 },
          skip: 0,
          take: 5,
        })
      );
    });

    // ========== EDGE CASE TESTS ==========
    it('should return empty array when no ratings match all criteria', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/ratings')
        .query({ userId: 1, mediaId: 1, page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    it('should handle special characters in query params gracefully', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(0);

      const response = await request(app).get('/api/ratings').query({ userId: '1<script>' });

      expect(response.status).toBe(200);
      expect(mockRating.findMany).toHaveBeenCalled();
    });

    it('should include user and media data in response', async () => {
      mockRating.findMany.mockResolvedValue([
        {
          ...createRatingRecord(),
          user: { username: 'testuser' },
          media: { tmdbId: 550, type: 'MOVIE' },
        },
      ]);
      mockRating.count.mockResolvedValue(1);

      const response = await request(app).get('/api/ratings');

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0]).toHaveProperty('media');
      expect(mockRating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.any(Object),
            media: expect.any(Object),
          }),
        })
      );
    });

    it('should calculate correct totalPages in pagination', async () => {
      mockRating.findMany.mockResolvedValue([createRatingRecord()]);
      mockRating.count.mockResolvedValue(47);

      const response = await request(app).get('/api/ratings').query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(5);
    });

    it('should handle zero total ratings with pagination', async () => {
      mockRating.findMany.mockResolvedValue([]);
      mockRating.count.mockResolvedValue(0);

      const response = await request(app).get('/api/ratings').query({ page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(0);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/ratings/:id', () => {
    it('should return a rating by id', async () => {
      mockRating.findUnique.mockResolvedValue(createRatingRecord());

      const response = await request(app).get('/api/ratings/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('score', 5);
      expect(mockRating.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should return 404 for non-existent rating', async () => {
      mockRating.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/ratings/99999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rating not found');
    });
  });

  describe('POST /api/ratings', () => {
    it('should create a rating with valid data and auth', async () => {
      mockMedia.findUnique.mockResolvedValue(null);
      mockMedia.create.mockResolvedValue(createMediaRecord());
      mockRating.findUnique.mockResolvedValue(null);
      mockRating.create.mockResolvedValue(createRatingRecord());
      mockRating.aggregate.mockResolvedValue({ _avg: { score: 5 }, _count: { score: 1 } });
      mockMedia.update.mockResolvedValue(createMediaRecord());
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({ rating: mockRating, media: mockMedia })
      );

      const ratingData = {
        tmdbId: 12345,
        type: 'MOVIE',
        score: 5,
      };

      const response = await request(app)
        .post('/api/ratings')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(ratingData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.score).toBe(ratingData.score);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const ratingData = {
        tmdbId: 12345,
        type: 'MOVIE',
        score: 4,
      };

      const response = await request(app).post('/api/ratings').send(ratingData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or malformed Authorization header');
    });

    it('should return 400 for invalid score', async () => {
      const ratingData = {
        tmdbId: 12345,
        type: 'MOVIE',
        score: 6,
      };

      const response = await request(app)
        .post('/api/ratings')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(ratingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Invalid rating score. Please provide a score between 1 and 5.'
      );
    });

    it('should return 400 for invalid type', async () => {
      const ratingData = {
        tmdbId: 12345,
        type: 'INVALID',
        score: 3,
      };

      const response = await request(app)
        .post('/api/ratings')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(ratingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid media type');
    });

    it('should return 409 if user already rated', async () => {
      mockMedia.findUnique.mockResolvedValue(createMediaRecord());
      mockRating.findUnique.mockResolvedValue(createRatingRecord());

      const ratingData = {
        tmdbId: 12345,
        type: 'MOVIE',
        score: 3,
      };

      const response = await request(app)
        .post('/api/ratings')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(ratingData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User has already rated this media.');
    });
  });

  describe('PUT /api/ratings/:id', () => {
    it('should update a rating owned by the user', async () => {
      mockRating.findUnique.mockResolvedValue(createRatingRecord({ id: 1, userId: 1, score: 3 }));
      mockRating.update.mockResolvedValue(createRatingRecord({ id: 1, userId: 1, score: 4 }));
      mockRating.aggregate.mockResolvedValue({ _avg: { score: 4 }, _count: { score: 1 } });
      mockMedia.update.mockResolvedValue(createMediaRecord());
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({ rating: mockRating, media: mockMedia })
      );

      const updateData = {
        score: 4,
      };

      const response = await request(app)
        .put('/api/ratings/1')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.score).toBe(updateData.score);
      expect(mockRating.update).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const updateData = {
        score: 2,
      };

      const response = await request(app).put('/api/ratings/1').send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or malformed Authorization header');
    });

    it('should return 403 for updating others rating as regular user', async () => {
      mockRating.findUnique.mockResolvedValue(createRatingRecord({ id: 2, userId: 2, score: 3 }));

      const updateData = {
        score: 1,
      };

      const response = await request(app)
        .put('/api/ratings/2')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Unauthorized to update this rating');
    });

    it('should return 404 for non-existent rating', async () => {
      mockRating.findUnique.mockResolvedValue(null);

      const updateData = {
        score: 4,
      };

      const response = await request(app)
        .put('/api/ratings/999')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rating not found');
    });
  });

  describe('DELETE /api/ratings/:id', () => {
    it('should delete a rating owned by the user', async () => {
      mockRating.findUnique.mockResolvedValue(createRatingRecord({ id: 1, userId: 1, score: 5 }));
      mockRating.delete.mockResolvedValue(createRatingRecord({ id: 1, userId: 1, score: 5 }));
      mockRating.aggregate.mockResolvedValue({ _avg: { score: null }, _count: { score: 0 } });
      mockMedia.update.mockResolvedValue(createMediaRecord());
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({ rating: mockRating, media: mockMedia })
      );

      const response = await request(app)
        .delete('/api/ratings/1')
        .set(authHeader({ sub: 1, role: 'USER' }));

      expect(response.status).toBe(204);
      expect(mockRating.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should allow admin to delete others rating', async () => {
      mockRating.findUnique.mockResolvedValue(createRatingRecord({ id: 2, userId: 2, score: 4 }));
      mockRating.delete.mockResolvedValue(createRatingRecord({ id: 2, userId: 2, score: 4 }));
      mockRating.aggregate.mockResolvedValue({ _avg: { score: null }, _count: { score: 0 } });
      mockMedia.update.mockResolvedValue(createMediaRecord());
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({ rating: mockRating, media: mockMedia })
      );

      const response = await request(app)
        .delete('/api/ratings/2')
        .set(authHeader({ sub: 2, role: 'ADMIN' }));

      expect(response.status).toBe(204);
      expect(mockRating.delete).toHaveBeenCalled();
    });

    it('should return 403 for deleting others rating as regular user', async () => {
      mockRating.findUnique.mockResolvedValue(createRatingRecord({ id: 2, userId: 2, score: 4 }));

      const response = await request(app)
        .delete('/api/ratings/2')
        .set(authHeader({ sub: 1, role: 'USER' }));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Unauthorized to delete this rating');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app).delete('/api/ratings/1');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or malformed Authorization header');
    });

    it('should return 404 for non-existent rating', async () => {
      mockRating.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/ratings/999')
        .set(authHeader({ sub: 1, role: 'USER' }));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Rating not found');
    });
  });
});
