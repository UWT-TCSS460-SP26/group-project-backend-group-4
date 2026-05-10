import request from 'supertest';
import type { Express } from 'express';
import { prisma } from '../src/lib/prisma';

let app: Express;

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    issue: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Helper: Admin auth claims
const ADMIN_AUTH = {
  sub: 'auth2|admin-1',
  email: 'admin@test.local',
  role: 'Admin',
};

// Helper: User auth claims (insufficient role)
const USER_AUTH = {
  sub: 'auth2|user-1',
  email: 'user@test.local',
  role: 'User',
};

// Helper to set auth header
function authHeader(claims: Record<string, unknown>) {
  return { Authorization: `Bearer ${JSON.stringify(claims)}` };
}

// Helper: mock admin-authenticated GET request
function adminGet(url: string, query?: Record<string, unknown>) {
  const req = request(app).get(url).set(authHeader(ADMIN_AUTH));
  if (query) req.query(query);
  return req;
}

// Helper: mock admin-authenticated PATCH request
function adminPatch(url: string, body?: Record<string, unknown>) {
  return request(app)
    .patch(url)
    .set(authHeader(ADMIN_AUTH))
    .send(body ?? {});
}

// Helper: mock admin-authenticated DELETE request
function adminDelete(url: string) {
  return request(app).delete(url).set(authHeader(ADMIN_AUTH));
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.TMDB_API_KEY = 'test-tmdb-api-key';

  const importedApp = await import('../src/app');
  app = importedApp.app;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Issues API', () => {
  // ─── GET /issues (admin-gated list) ────────────────────────────
  describe('GET /issues', () => {
    const mockIssues = [
      {
        id: 2,
        title: 'Issue 2',
        body: 'Second issue',
        contact: 'Contact 2',
        status: 'IN_PROGRESS',
        createdAt: new Date('2026-05-02'),
        updatedAt: new Date('2026-05-02'),
      },
      {
        id: 1,
        title: 'Issue 1',
        body: 'First issue',
        contact: 'Contact 1',
        status: 'OPEN',
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-01'),
      },
    ];

    it('should return a paginated list with default params', async () => {
      (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);
      (prisma.issue.count as jest.Mock).mockResolvedValue(2);

      const response = await adminGet('/issues');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('issues');
      expect(response.body.issues).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      // Default sort: createdAt desc
      expect(prisma.issue.findMany).toHaveBeenCalledWith({
        where: { deleted: false },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        omit: { deleted: true },
      });
    });

    it('should return 401 when no auth token is provided', async () => {
      const response = await request(app).get('/issues');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when user role is insufficient', async () => {
      const response = await request(app).get('/issues').set(authHeader(USER_AUTH));
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should support pagination via page and limit', async () => {
      (prisma.issue.findMany as jest.Mock).mockResolvedValue([mockIssues[0]]);
      (prisma.issue.count as jest.Mock).mockResolvedValue(2);

      const response = await adminGet('/issues', { page: 2, limit: 1 });

      expect(response.status).toBe(200);
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 1,
        total: 2,
        totalPages: 2,
      });
      expect(prisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 1, take: 1 })
      );
    });

    it('should filter by a single status', async () => {
      (prisma.issue.findMany as jest.Mock).mockResolvedValue([mockIssues[1]]);
      (prisma.issue.count as jest.Mock).mockResolvedValue(1);

      const response = await adminGet('/issues', { status: 'OPEN' });

      expect(response.status).toBe(200);
      expect(response.body.issues).toHaveLength(1);
      expect(prisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deleted: false, status: { in: ['OPEN'] } },
        })
      );
    });

    it('should filter by multiple statuses', async () => {
      (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);
      (prisma.issue.count as jest.Mock).mockResolvedValue(2);

      const response = await adminGet('/issues', { status: ['OPEN', 'IN_PROGRESS'] });

      expect(response.status).toBe(200);
      expect(prisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deleted: false, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        })
      );
    });

    it('should support custom sort field and order', async () => {
      (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);
      (prisma.issue.count as jest.Mock).mockResolvedValue(2);

      await adminGet('/issues', { sortBy: 'title', sortOrder: 'asc' });

      expect(prisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { title: 'asc' } })
      );
    });

    it('should return 400 for invalid query params', async () => {
      const response = await adminGet('/issues', { sortBy: 'invalid' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 500 on database error', async () => {
      (prisma.issue.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));
      (prisma.issue.count as jest.Mock).mockResolvedValue(0);

      const response = await adminGet('/issues');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });
  });

  // ─── GET /issues/:id (admin-gated detail) ──────────────────────
  describe('GET /issues/:id', () => {
    const mockIssue = {
      id: 1,
      title: 'Issue 1',
      body: 'This is the first issue',
      contact: 'Contact 1',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return a single issue by id', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);

      const response = await adminGet('/issues/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('issue');
      expect(response.body.issue).toMatchObject({
        id: 1,
        title: 'Issue 1',
        body: 'This is the first issue',
        contact: 'Contact 1',
        status: 'OPEN',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(prisma.issue.findUnique).toHaveBeenCalledWith({
        where: { id: 1, deleted: false },
        omit: { deleted: true },
      });
    });

    it('should return 401 when no auth token is provided', async () => {
      const response = await request(app).get('/issues/1');
      expect(response.status).toBe(401);
    });

    it('should return 403 when user role is insufficient', async () => {
      const response = await request(app).get('/issues/1').set(authHeader(USER_AUTH));
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should return 404 if the issue is not found', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await adminGet('/issues/999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Issue not found');
    });

    it('should return 500 on database error', async () => {
      (prisma.issue.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await adminGet('/issues/1');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });

    it('should return 400 if the id parameter is invalid', async () => {
      const response = await adminGet('/issues/invalid_id');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });
  });

  // ─── PATCH /issues/:id (admin-gated partial update) ───────────
  describe('PATCH /issues/:id', () => {
    const existingIssue = {
      id: 1,
      title: 'Original Title',
      body: 'Original body',
      contact: 'original@test.local',
      status: 'OPEN',
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    };

    it('should partially update only the provided fields', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);

      const updatedIssue = { ...existingIssue, status: 'IN_PROGRESS', updatedAt: new Date() };
      (prisma.issue.update as jest.Mock).mockResolvedValue(updatedIssue);

      const response = await adminPatch('/issues/1', { status: 'IN_PROGRESS' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Issue updated');
      expect(response.body.issue).toMatchObject({
        id: 1,
        status: 'IN_PROGRESS',
      });
      // Only 'status' was in the body — no other fields should be sent to Prisma
      expect(prisma.issue.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'IN_PROGRESS' },
        omit: { deleted: true },
      });
    });

    it('should update multiple fields when provided', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);

      const updatedIssue = {
        ...existingIssue,
        title: 'New Title',
        body: 'New body',
        updatedAt: new Date(),
      };
      (prisma.issue.update as jest.Mock).mockResolvedValue(updatedIssue);

      const response = await adminPatch('/issues/1', {
        title: 'New Title',
        body: 'New body',
      });

      expect(response.status).toBe(200);
      expect(prisma.issue.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'New Title', body: 'New body' },
        omit: { deleted: true },
      });
    });

    it('should accept an empty body as a no-op', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);

      const unchangedIssue = { ...existingIssue, updatedAt: new Date() };
      (prisma.issue.update as jest.Mock).mockResolvedValue(unchangedIssue);

      const response = await adminPatch('/issues/1', {});

      expect(response.status).toBe(200);
      expect(prisma.issue.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {},
        omit: { deleted: true },
      });
    });

    it('should return 401 when no auth token is provided', async () => {
      const response = await request(app).patch('/issues/1').send({ status: 'RESOLVED' });
      expect(response.status).toBe(401);
    });

    it('should return 403 when user role is insufficient', async () => {
      const response = await request(app)
        .patch('/issues/1')
        .set(authHeader(USER_AUTH))
        .send({ status: 'RESOLVED' });
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should return 404 if the issue is not found or already deleted', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await adminPatch('/issues/999', { status: 'RESOLVED' });
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Issue not found');
    });

    it('should return 400 if the status is invalid', async () => {
      const response = await adminPatch('/issues/1', { status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({ path: 'status' });
    });

    it('should return 400 if the id parameter is invalid', async () => {
      const response = await adminPatch('/issues/invalid_id', { status: 'OPEN' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 500 on database error', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);
      (prisma.issue.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await adminPatch('/issues/1', { status: 'RESOLVED' });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });
  });

  // ─── DELETE /issues/:id (admin-gated soft-delete) ─────────────
  describe('DELETE /issues/:id', () => {
    const existingIssue = {
      id: 1,
      title: 'Spam Report',
      body: 'Buy my product!',
      contact: 'spammer@test.local',
      status: 'OPEN',
      createdAt: new Date('2026-05-01'),
      updatedAt: new Date('2026-05-01'),
    };

    it('should soft-delete an existing issue', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);

      const deletedIssue = { ...existingIssue, deleted: true, updatedAt: new Date() };
      (prisma.issue.update as jest.Mock).mockResolvedValue(deletedIssue);

      const response = await adminDelete('/issues/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Issue deleted');
      expect(response.body.issue).toMatchObject({ id: 1 });
      expect(prisma.issue.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deleted: true },
        omit: { deleted: true },
      });
    });

    it('should return 401 when no auth token is provided', async () => {
      const response = await request(app).delete('/issues/1');
      expect(response.status).toBe(401);
    });

    it('should return 403 when user role is insufficient', async () => {
      const response = await request(app).delete('/issues/1').set(authHeader(USER_AUTH));
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should return 404 if the issue is not found or already deleted', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await adminDelete('/issues/999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Issue not found');
    });

    it('should return 400 if the id parameter is invalid', async () => {
      const response = await adminDelete('/issues/invalid_id');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 500 on database error', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(existingIssue);
      (prisma.issue.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await adminDelete('/issues/1');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });
  });

  // ─── POST /issues (public — unchanged) ─────────────────────────
  describe('POST /issues', () => {
    it('should create a new issue', async () => {
      const mockIssue = {
        id: 1,
        title: 'New Issue',
        body: 'This is a new issue',
        contact: 'New Contact',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.issue.create as jest.Mock).mockResolvedValue(mockIssue);

      const response = await request(app).post('/issues').send({
        title: 'New Issue',
        body: 'This is a new issue',
        contact: 'New Contact',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('issue');
      expect(response.body.issue).toMatchObject({
        ...mockIssue,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(prisma.issue.create).toHaveBeenCalledWith({
        data: { title: 'New Issue', body: 'This is a new issue', contact: 'New Contact' },
        omit: { deleted: true },
      });
    });

    it('should return 400 if title is missing', async () => {
      const response = await request(app).post('/issues').send({
        body: 'This is a new issue',
        contact: 'New Contact',
      });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({ path: 'title' });
    });

    it('should return 400 if body is missing', async () => {
      const response = await request(app).post('/issues').send({
        title: 'New Issue',
        contact: 'New Contact',
      });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({ path: 'body' });
    });

    it('should return 400 if contact is missing', async () => {
      const response = await request(app).post('/issues').send({
        title: 'New Issue',
        body: 'This is a new issue',
      });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({ path: 'contact' });
    });

    it('should return 500 on database error', async () => {
      (prisma.issue.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).post('/issues').send({
        title: 'New Issue',
        body: 'This is a new issue',
        contact: 'New Contact',
      });
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });
  });
});

export {};
