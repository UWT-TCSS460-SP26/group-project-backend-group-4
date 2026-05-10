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

describe('GET /api/movies/featured', () => {
  it('should return most-reviewed movies and merge TMDB data', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([
        { id: 1, tmdbId: 101 },
        { id: 2, tmdbId: 102 },
      ]);

    (prisma.review.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 2, _count: { id: 10 } },
      { mediaId: 1, _count: { id: 5 } },
    ]);

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url.includes('/movie/101')) {
        return {
          ok: true,
          json: async () => ({
            id: 101,
            title: 'Movie 101',
            genres: [{ id: 12, name: 'Adventure' }],
            original_language: 'en',
          }),
        };
      }
      if (url.includes('/movie/102')) {
        return {
          ok: true,
          json: async () => ({
            id: 102,
            title: 'Movie 102',
            genres: [{ id: 28, name: 'Action' }],
            original_language: 'en',
          }),
        };
      }
      return { ok: false };
    });

    const response = await request(app).get('/api/movies/featured?sort=most-reviewed');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(102);
    expect(response.body[0].communityStats).toEqual({
      rankingMetric: 'most-reviewed',
      totalReviews: 10,
    });
    expect(response.body[1].id).toBe(101);
    expect(response.body[1].communityStats).toEqual({
      rankingMetric: 'most-reviewed',
      totalReviews: 5,
    });
  });

  it('should return top-rated movies and merge TMDB data', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
      .mockResolvedValueOnce([
        { id: 1, tmdbId: 101 },
        { id: 2, tmdbId: 102 },
      ]);

    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 1, _avg: { score: 4.5 }, _count: { score: 20 } },
      { mediaId: 2, _avg: { score: 3.5 }, _count: { score: 15 } },
    ]);

    (global.fetch as jest.Mock).mockImplementation(async (url) => {
      if (url.includes('/movie/101')) {
        return { ok: true, json: async () => ({ id: 101, title: 'Movie 101' }) };
      }
      if (url.includes('/movie/102')) {
        return { ok: true, json: async () => ({ id: 102, title: 'Movie 102' }) };
      }
      return { ok: false };
    });

    const response = await request(app).get('/api/movies/featured?sort=top-rated');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].id).toBe(101);
    expect(response.body[0].communityStats).toEqual({
      rankingMetric: 'top-rated',
      avgScore: 4.5,
      totalRatings: 20,
    });
    expect(response.body[1].id).toBe(102);
    expect(response.body[1].communityStats).toEqual({
      rankingMetric: 'top-rated',
      avgScore: 3.5,
      totalRatings: 15,
    });
  });

  it('should handle TMDB fetch errors gracefully by omitting the media', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 1, tmdbId: 101 }]);

    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 1, _avg: { score: 4.5 }, _count: { score: 20 } },
    ]);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('TMDB Network Error'));

    const response = await request(app).get('/api/movies/featured');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should handle TMDB non-OK HTTP responses by omitting the media', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 1, tmdbId: 101 }]);

    (prisma.rating.groupBy as jest.Mock).mockResolvedValue([
      { mediaId: 1, _avg: { score: 4.5 }, _count: { score: 20 } },
    ]);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const response = await request(app).get('/api/movies/featured');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should handle missing media in database mapping gracefully', async () => {
    (prisma.media.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([]); // Mock empty array for the secondary lookup

    (prisma.review.groupBy as jest.Mock).mockResolvedValue([{ mediaId: 1, _count: { id: 10 } }]);

    const response = await request(app).get('/api/movies/featured?sort=most-reviewed');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    (prisma.media.findMany as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

    const response = await request(app).get('/api/movies/featured');

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
