/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma';
import { authHeader } from './helpers/authHelper';

let app: Express;

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    review: {
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

const mockReview = prisma.review as any;
const mockMedia = prisma.media as any;
const mockTransaction = prisma.$transaction as jest.Mock;

const createReviewRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  userId: 1,
  mediaId: 1,
  title: 'Test Review',
  body: 'Great movie!',
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

describe('Reviews API', () => {
  describe('GET /api/reviews', () => {
    // ========== BASIC PAGINATION TESTS ==========
    it('should return reviews with default pagination', async () => {
      mockReview.findMany.mockResolvedValue([
        createReviewRecord({ id: 1 }),
        createReviewRecord({ id: 2 }),
      ]);
      mockReview.count.mockResolvedValue(2);

      const response = await request(app).get('/api/reviews');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.total).toBe(2);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should return reviews with custom pagination', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord()]);
      mockReview.count.mockResolvedValue(50);

      const response = await request(app).get('/api/reviews').query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.totalPages).toBe(5);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should normalize page 0 to page 1', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord()]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ page: 0, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(mockReview.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it('should normalize negative page to page 1', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord()]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ page: -5, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(mockReview.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it('should treat limit 0 as invalid and use default limit 20', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord()]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ limit: 0 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(20);
      expect(mockReview.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }));
    });

    it('should normalize negative limit to limit 1', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord()]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ limit: -10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should handle very large page numbers returning empty results', async () => {
      mockReview.findMany.mockResolvedValue([]);
      mockReview.count.mockResolvedValue(10);

      const response = await request(app).get('/api/reviews').query({ page: 1000, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.page).toBe(1000);
    });

    it('should handle very large limit', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord()]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ limit: 10000 });

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 10000 }));
    });

    it('should handle non-integer page', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord()]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ page: '1.5', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
    });

    // ========== QUERY BY USERID TESTS ==========
    it('should filter by userId alone', async () => {
      const reviews = [
        createReviewRecord({ id: 1, userId: 5 }),
        createReviewRecord({ id: 2, userId: 5 }),
      ];
      mockReview.findMany.mockResolvedValue(reviews);
      mockReview.count.mockResolvedValue(2);

      const response = await request(app).get('/api/reviews').query({ userId: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 5 }),
        })
      );
    });

    it('should filter by userId with pagination', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord({ userId: 3 })]);
      mockReview.count.mockResolvedValue(25);

      const response = await request(app)
        .get('/api/reviews')
        .query({ userId: 3, page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 3 },
          skip: 10,
          take: 10,
        })
      );
      expect(response.body.pagination.totalPages).toBe(3);
    });

    it('should return 400 for invalid userId (non-numeric)', async () => {
      const response = await request(app).get('/api/reviews').query({ userId: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid userId');
    });

    it('should return 400 for invalid userId (zero)', async () => {
      const response = await request(app).get('/api/reviews').query({ userId: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid userId');
    });

    it('should return 400 for invalid userId (negative)', async () => {
      const response = await request(app).get('/api/reviews').query({ userId: -1 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid userId');
    });

    it('should return 400 for invalid userId (float)', async () => {
      const response = await request(app).get('/api/reviews').query({ userId: '5.5' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid userId');
    });

    it('should return empty results for userId with no reviews', async () => {
      mockReview.findMany.mockResolvedValue([]);
      mockReview.count.mockResolvedValue(0);

      const response = await request(app).get('/api/reviews').query({ userId: 999 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    // ========== QUERY BY MEDIAID TESTS ==========
    it('should filter by mediaId alone', async () => {
      const reviews = [
        createReviewRecord({ id: 1, mediaId: 7 }),
        createReviewRecord({ id: 2, mediaId: 7 }),
      ];
      mockReview.findMany.mockResolvedValue(reviews);
      mockReview.count.mockResolvedValue(2);

      const response = await request(app).get('/api/reviews').query({ mediaId: 7 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mediaId: 7 }),
        })
      );
    });

    it('should filter by mediaId with pagination', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord({ mediaId: 10 })]);
      mockReview.count.mockResolvedValue(15);

      const response = await request(app)
        .get('/api/reviews')
        .query({ mediaId: 10, page: 2, limit: 5 });

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mediaId: 10 },
          skip: 5,
          take: 5,
        })
      );
    });

    it('should return 400 for invalid mediaId (non-numeric)', async () => {
      const response = await request(app).get('/api/reviews').query({ mediaId: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid mediaId');
    });

    it('should return 400 for invalid mediaId (zero)', async () => {
      const response = await request(app).get('/api/reviews').query({ mediaId: 0 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid mediaId');
    });

    it('should return empty results for mediaId with no reviews', async () => {
      mockReview.findMany.mockResolvedValue([]);
      mockReview.count.mockResolvedValue(0);

      const response = await request(app).get('/api/reviews').query({ mediaId: 9999 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    // ========== QUERY BY TMDBID + TYPE TESTS ==========
    it('should filter by tmdbId and type together', async () => {
      const reviews = [createReviewRecord({ id: 1, media: { tmdbId: 550, type: 'MOVIE' } })];
      mockReview.findMany.mockResolvedValue(reviews);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ tmdbId: 550, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            media: { tmdbId: 550, type: 'MOVIE' },
          }),
        })
      );
    });

    it('should filter by tmdbId and type with pagination', async () => {
      mockReview.findMany.mockResolvedValue([
        createReviewRecord({ media: { tmdbId: 1399, type: 'TV_SHOW' } }),
      ]);
      mockReview.count.mockResolvedValue(8);

      const response = await request(app)
        .get('/api/reviews')
        .query({ tmdbId: 1399, type: 'TV_SHOW', page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { media: { tmdbId: 1399, type: 'TV_SHOW' } },
          skip: 0,
          take: 5,
        })
      );
    });

    it('should return 400 for tmdbId without type', async () => {
      const response = await request(app).get('/api/reviews').query({ tmdbId: 550 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Both tmdbId and type are required together');
    });

    it('should return 400 for type without tmdbId', async () => {
      const response = await request(app).get('/api/reviews').query({ type: 'MOVIE' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Both tmdbId and type are required together');
    });

    it('should return 400 for invalid tmdbId (non-numeric)', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({ tmdbId: 'invalid', type: 'MOVIE' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid tmdbId');
    });

    it('should return 400 for invalid tmdbId (zero)', async () => {
      const response = await request(app).get('/api/reviews').query({ tmdbId: 0, type: 'MOVIE' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid tmdbId');
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .query({ tmdbId: 550, type: 'INVALID' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid media type');
    });

    it('should return empty results for tmdbId + type with no reviews', async () => {
      mockReview.findMany.mockResolvedValue([]);
      mockReview.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/reviews')
        .query({ tmdbId: 99999, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    // ========== COMBINED PARAMETER TESTS ==========
    it('should prioritize mediaId over tmdbId + type when all are provided', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord({ mediaId: 5 })]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/reviews')
        .query({ mediaId: 5, tmdbId: 550, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ mediaId: 5 }),
        })
      );
    });

    it('should combine userId + mediaId filters', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord({ userId: 2, mediaId: 3 })]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews').query({ userId: 2, mediaId: 3 });

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 2, mediaId: 3 }),
        })
      );
    });

    it('should combine userId + tmdbId + type filters', async () => {
      mockReview.findMany.mockResolvedValue([
        createReviewRecord({ userId: 4, media: { tmdbId: 550, type: 'MOVIE' } }),
      ]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/reviews')
        .query({ userId: 4, tmdbId: 550, type: 'MOVIE' });

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 4,
            media: { tmdbId: 550, type: 'MOVIE' },
          }),
        })
      );
    });

    it('should handle multiple query params with pagination', async () => {
      mockReview.findMany.mockResolvedValue([createReviewRecord({ userId: 1, mediaId: 2 })]);
      mockReview.count.mockResolvedValue(7);

      const response = await request(app)
        .get('/api/reviews')
        .query({ userId: 1, mediaId: 2, page: 1, limit: 5 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, mediaId: 2 },
          skip: 0,
          take: 5,
        })
      );
    });

    // ========== EDGE CASE TESTS ==========
    it('should return empty array when no reviews match all criteria', async () => {
      mockReview.findMany.mockResolvedValue([]);
      mockReview.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/reviews')
        .query({ userId: 1, mediaId: 1, page: 1, limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    it('should handle special characters in query params gracefully', async () => {
      mockReview.findMany.mockResolvedValue([]);
      mockReview.count.mockResolvedValue(0);

      const response = await request(app).get('/api/reviews').query({ userId: '1<script>' });

      expect(response.status).toBe(400);
    });

    it('should include proper order by createdAt desc', async () => {
      const reviews = [
        createReviewRecord({ id: 3, createdAt: new Date('2026-04-25') }),
        createReviewRecord({ id: 2, createdAt: new Date('2026-04-24') }),
        createReviewRecord({ id: 1, createdAt: new Date('2026-04-23') }),
      ];
      mockReview.findMany.mockResolvedValue(reviews);
      mockReview.count.mockResolvedValue(3);

      const response = await request(app).get('/api/reviews');

      expect(response.status).toBe(200);
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should include user and media data in response', async () => {
      mockReview.findMany.mockResolvedValue([
        {
          ...createReviewRecord(),
          user: { username: 'testuser' },
          media: { tmdbId: 550, type: 'MOVIE' },
        },
      ]);
      mockReview.count.mockResolvedValue(1);

      const response = await request(app).get('/api/reviews');

      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0]).toHaveProperty('media');
      expect(mockReview.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.any(Object),
            media: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('should return a review by id', async () => {
      mockReview.findUnique.mockResolvedValue(createReviewRecord());

      const response = await request(app).get('/api/reviews/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(mockReview.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).get('/api/reviews/invalid');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid review id');
    });

    it('should return 404 for non-existent review', async () => {
      mockReview.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/reviews/99999');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Review not found');
    });
  });

  describe('POST /api/reviews', () => {
    it('should create a review with valid data and auth', async () => {
      mockMedia.findUnique.mockResolvedValue(null);
      mockMedia.create.mockResolvedValue(createMediaRecord());
      mockReview.findUnique.mockResolvedValue(null);
      mockReview.create.mockResolvedValue(
        createReviewRecord({ title: 'Great Movie', body: 'This movie was amazing!' })
      );
      mockReview.aggregate.mockResolvedValue({ _count: { id: 1 } });
      mockMedia.update.mockResolvedValue(createMediaRecord());
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({ review: mockReview, media: mockMedia })
      );

      const reviewData = {
        tmdbId: 12345,
        type: 'MOVIE',
        title: 'Great Movie',
        body: 'This movie was amazing!',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(reviewData.title);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const reviewData = {
        tmdbId: 12345,
        type: 'MOVIE',
        body: 'Test review',
      };

      const response = await request(app).post('/api/reviews').send(reviewData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing or malformed Authorization header');
    });

    it('should return 400 for invalid tmdbId', async () => {
      const reviewData = {
        tmdbId: 'invalid',
        type: 'MOVIE',
        body: 'Test review',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid tmdbId');
    });

    it('should return 400 for invalid type', async () => {
      const reviewData = {
        tmdbId: 12345,
        type: 'INVALID',
        body: 'Test review',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid media type');
    });

    it('should return 400 for missing body', async () => {
      const reviewData = {
        tmdbId: 12345,
        type: 'MOVIE',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Review body is required.');
    });

    it('should return 409 if user already reviewed', async () => {
      mockMedia.findUnique.mockResolvedValue(createMediaRecord());
      mockReview.findUnique.mockResolvedValue(createReviewRecord({ id: 1, userId: 1, mediaId: 1 }));

      const reviewData = {
        tmdbId: 12345,
        type: 'MOVIE',
        body: 'Test review',
      };

      const response = await request(app)
        .post('/api/reviews')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(reviewData);

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('User has already reviewed this media.');
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('should update a review owned by the user', async () => {
      mockReview.findUnique.mockResolvedValue(
        createReviewRecord({ id: 1, userId: 1, title: 'Old Title', body: 'Old body' })
      );
      mockReview.update.mockResolvedValue(
        createReviewRecord({ id: 1, userId: 1, title: 'Old Title', body: 'Updated review body' })
      );

      const updateData = {
        body: 'Updated review body',
      };

      const response = await request(app)
        .put('/api/reviews/1')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.body).toBe(updateData.body);
      expect(mockReview.update).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const updateData = {
        body: 'Updated review',
      };

      const response = await request(app).put('/api/reviews/1').send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing or malformed Authorization header');
    });

    it('should return 403 for updating others review as regular user', async () => {
      mockReview.findUnique.mockResolvedValue(createReviewRecord({ id: 2, userId: 2 }));

      const updateData = {
        body: 'Trying to update others review',
      };

      const response = await request(app)
        .put('/api/reviews/2')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Unauthorized to update this review');
    });

    it('should return 400 for invalid body', async () => {
      const updateData = {
        body: '',
      };

      const response = await request(app)
        .put('/api/reviews/1')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid review body.');
    });

    it('should return 404 for non-existent review', async () => {
      mockReview.findUnique.mockResolvedValue(null);

      const updateData = {
        body: 'Updated',
      };

      const response = await request(app)
        .put('/api/reviews/999')
        .set(authHeader({ sub: 1, role: 'USER' }))
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Review not found');
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('should delete a review owned by the user', async () => {
      mockReview.findUnique.mockResolvedValue(createReviewRecord({ id: 1, userId: 1 }));
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({ review: mockReview, media: mockMedia })
      );
      mockReview.delete.mockResolvedValue(createReviewRecord({ id: 1, userId: 1 }));

      const response = await request(app)
        .delete('/api/reviews/1')
        .set(authHeader({ sub: 1, role: 'USER' }));

      expect(response.status).toBe(204);
      expect(mockReview.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should allow admin to delete others review', async () => {
      mockReview.findUnique.mockResolvedValue(createReviewRecord({ id: 2, userId: 2 }));
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({ review: mockReview, media: mockMedia })
      );
      mockReview.delete.mockResolvedValue(createReviewRecord({ id: 2, userId: 2 }));

      const response = await request(app)
        .delete('/api/reviews/2')
        .set(authHeader({ sub: 2, role: 'ADMIN' }));

      expect(response.status).toBe(204);
      expect(mockReview.delete).toHaveBeenCalled();
    });

    it('should return 403 for deleting others review as regular user', async () => {
      mockReview.findUnique.mockResolvedValue(createReviewRecord({ id: 2, userId: 2 }));

      const response = await request(app)
        .delete('/api/reviews/2')
        .set(authHeader({ sub: 1, role: 'USER' }));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Unauthorized to delete this review');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app).delete('/api/reviews/1');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Missing or malformed Authorization header');
    });

    it('should return 404 for non-existent review', async () => {
      mockReview.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/reviews/999')
        .set(authHeader({ sub: 1, role: 'USER' }));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Review not found');
    });
  });
});
