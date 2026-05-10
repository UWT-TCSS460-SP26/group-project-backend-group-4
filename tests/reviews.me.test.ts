import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma';
import { resolveLocalUser } from '../src/auth/resolveLocalUser';
import { authHeader } from './helpers/authHelper';

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../src/auth/resolveLocalUser', () => ({
  resolveLocalUser: jest.fn(),
}));

let app: Express;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.TMDB_API_KEY = 'test-tmdb-api-key';
  const importedApp = await import('../src/app');
  app = importedApp.app;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/reviews/me', () => {
  it('should block unauthenticated users', async () => {
    const response = await request(app).get('/api/reviews/me');
    expect(response.status).toBe(401);
  });

  it('should ignore spoofed userId parameter and use authenticated user id', async () => {
    (resolveLocalUser as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.review.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.review.count as jest.Mock).mockResolvedValue(0);

    const response = await request(app)
      .get('/api/reviews/me?userId=999')
      .set(authHeader({ sub: 1, role: 'User' }));

    expect(response.status).toBe(200);
    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 1 },
      })
    );
  });

  it('should return paginated reviews for the authenticated user (Happy Path)', async () => {
    (resolveLocalUser as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.review.findMany as jest.Mock).mockResolvedValue([
      { id: 20, title: 'Amazing', body: 'Loved it', mediaId: 100 },
    ]);
    (prisma.review.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app)
      .get('/api/reviews/me?page=1&limit=20')
      .set(authHeader({ sub: 1, role: 'User' }));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(20);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.pagination.page).toBe(1);
  });

  it('should handle database errors gracefully and return 500', async () => {
    (resolveLocalUser as jest.Mock).mockResolvedValue({ userId: 1 });
    (prisma.review.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/api/reviews/me')
      .set(authHeader({ sub: 1, role: 'User' }));

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
