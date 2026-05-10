import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma';

let app: Express;

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    media: {
      findMany: jest.fn(),
    },
    review: {
      groupBy: jest.fn(),
    },
    rating: {
      groupBy: jest.fn(),
    },
  },
}));

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.TMDB_API_KEY = 'TEST_API_KEY';
  global.fetch = jest.fn();

  const importedApp = await import('../src/app');
  app = importedApp.app;
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /api/tv/featured', () => {
  it('should return most-reviewed TV shows and merge TMDB data', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([
        { id: 1, tmdbId: 201 },
        { id: 2, tmdbId: 202 },
      ]);

    (prisma.review.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 2, _count: { id: 12 } },
      { mediaId: 1, _count: { id: 8 } },
    ]);

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url.includes('/tv/201')) {
        return {
          ok: true,
          json: async () => ({
            id: 201,
            name: 'Show 201',
            genres: [{ id: 18, name: 'Drama' }],
            original_language: 'en',
          }),
        };
      }
      if (url.includes('/tv/202')) {
        return {
          ok: true,
          json: async () => ({
            id: 202,
            name: 'Show 202',
            genres: [{ id: 35, name: 'Comedy' }],
            original_language: 'en',
          }),
        };
      }
      return { ok: false };
    });

    const response = await request(app).get('/api/tv/featured?sort=most-reviewed');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(202);
    expect(response.body[0].communityStats).toEqual({
      rankingMetric: 'most-reviewed',
      totalReviews: 12,
    });
    expect(response.body[1].id).toBe(201);
    expect(response.body[1].communityStats).toEqual({
      rankingMetric: 'most-reviewed',
      totalReviews: 8,
    });
  });

  it('should return top-rated TV shows and merge TMDB data', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([
        { id: 1, tmdbId: 201 },
        { id: 2, tmdbId: 202 },
      ]);

    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 1, _avg: { score: 4.8 }, _count: { score: 25 } },
      { mediaId: 2, _avg: { score: 4.1 }, _count: { score: 18 } },
    ]);

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url.includes('/tv/201')) {
        return { ok: true, json: async () => ({ id: 201, name: 'Show 201' }) };
      }
      if (url.includes('/tv/202')) {
        return { ok: true, json: async () => ({ id: 202, name: 'Show 202' }) };
      }
      return { ok: false };
    });

    const response = await request(app).get('/api/tv/featured?sort=top-rated');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(201);
    expect(response.body[0].communityStats).toEqual({
      rankingMetric: 'top-rated',
      avgScore: 4.8,
      totalRatings: 25,
    });
    expect(response.body[1].id).toBe(202);
    expect(response.body[1].communityStats).toEqual({
      rankingMetric: 'top-rated',
      avgScore: 4.1,
      totalRatings: 18,
    });
  });

  it('should handle TMDB fetch errors gracefully by omitting the media', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 1, tmdbId: 201 }]);

    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 1, _avg: { score: 4.8 }, _count: { score: 25 } },
    ]);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('TMDB Network Error'));

    const response = await request(app).get('/api/tv/featured');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should handle TMDB non-OK HTTP responses by omitting the media', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 1, tmdbId: 201 }]);

    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 1, _avg: { score: 4.8 }, _count: { score: 25 } },
    ]);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const response = await request(app).get('/api/tv/featured');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should handle missing media in database mapping gracefully', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([]); // Mock empty array for the secondary lookup

    (prisma.review.groupBy as jest.Mock).mockResolvedValue([{ mediaId: 1, _count: { id: 10 } }]);

    const response = await request(app).get('/api/tv/featured?sort=most-reviewed');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    (prisma.media.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));
    const response = await request(app).get('/api/tv/featured');
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
