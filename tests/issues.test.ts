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
    },
  },
}));

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
  describe('GET /issues', () => {
    it('should return a list of issues', async () => {
      const mockIssues = [
        {
          id: 1,
          title: 'Issue 1',
          body: 'This is the first issue',
          contact: 'Contact 1',
          status: 'OPEN',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Issue 2',
          body: 'This is the second issue',
          contact: 'Contact 2',
          status: 'OPEN',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.issue.findMany as jest.Mock).mockResolvedValue(mockIssues);

      const response = await request(app).get('/issues');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('issues');
      expect(response.body.issues).toHaveLength(2);
      expect(response.body.issues[0]).toMatchObject({
        id: 1,
        title: 'Issue 1',
        body: 'This is the first issue',
        contact: 'Contact 1',
        status: 'OPEN',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(prisma.issue.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          deleted: false,
        },
        omit: {
          deleted: true,
        },
      });
    });
    it('should return a 500 error if there is a server error', async () => {
      (prisma.issue.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/issues');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });
  });
  describe('GET /issues/:id', () => {
    it('should return a single issue by id', async () => {
      const mockIssue = {
        id: 1,
        title: 'Issue 1',
        body: 'This is the first issue',
        contact: 'Contact 1',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);

      const response = await request(app).get('/issues/1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('issue');
      expect(response.body).toMatchObject({
        issue: {
          id: 1,
          title: 'Issue 1',
          body: 'This is the first issue',
          contact: 'Contact 1',
          status: 'OPEN',
        },
      });
      expect(prisma.issue.findUnique).toHaveBeenCalledWith({
        where: { id: 1, deleted: false },
        omit: { deleted: true },
      });
      expect(response.body.issue.createdAt).toBeDefined();
      expect(response.body.issue.updatedAt).toBeDefined();
    });
    it('should return a 404 error if the issue is not found or deleted', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/issues/1');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Issue not found');
    });
    it('should return a 500 error if there is a server error', async () => {
      (prisma.issue.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/issues/1');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });

    it('should return a 400 error if the id parameter is invalid', async () => {
      const response = await request(app).get('/issues/invalid_id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });
  });

  describe('PUT /issues/:id', () => {
    it('should update an existing issue', async () => {
      const mockIssue = {
        id: 1,
        title: 'Non-Updated Issue',
        body: 'This issue has not been updated',
        contact: 'First Contact',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(mockIssue);

      const updatedIssue = {
        id: 1,
        title: 'Updated Issue',
        body: 'This issue has been updated',
        contact: 'Updated Contact',
        status: 'RESOLVED',
        createdAt: mockIssue.createdAt,
        updatedAt: new Date(),
      };
      (prisma.issue.update as jest.Mock).mockResolvedValue(updatedIssue);

      const response = await request(app).put('/issues/1').send({
        title: 'Updated Issue',
        body: 'This issue has been updated',
        contact: 'Updated Contact',
        status: 'RESOLVED',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('newIssue');
      expect(response.body.newIssue).toMatchObject({
        ...updatedIssue,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(prisma.issue.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: 'Updated Issue',
          body: 'This issue has been updated',
          contact: 'Updated Contact',
          status: 'RESOLVED',
        },
        omit: {
          deleted: true,
        },
      });
    });

    it('should return a 404 error if the issue to update is not found or deleted', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).put('/issues/999').send({
        title: 'Updated Issue',
        body: 'This issue has been updated',
        contact: 'Updated Contact',
        status: 'RESOLVED',
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Issue not found');
    });

    it('should return a 500 error if there is a server error during update', async () => {
      (prisma.issue.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.issue.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).put('/issues/1').send({
        title: 'Updated Issue',
        body: 'This issue has been updated',
        contact: 'Updated Contact',
        status: 'RESOLVED',
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Internal Server Error');
    });

    it('should return a 400 error if the id parameter is invalid', async () => {
      const response = await request(app).put('/issues/invalid_id').send({
        title: 'Updated Issue',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return a 400 error if the status is invalid', async () => {
      const response = await request(app).put('/issues/1').send({
        status: 'INVALID_STATUS',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({
        path: 'status',
      });
    });
  });

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
        data: {
          title: 'New Issue',
          body: 'This is a new issue',
          contact: 'New Contact',
        },
        omit: {
          deleted: true,
        },
      });
    });

    it('should return a 400 error if title is missing', async () => {
      const response = await request(app).post('/issues').send({
        body: 'This is a new issue',
        contact: 'New Contact',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({
        path: 'title',
        message: 'Invalid input: expected string, received undefined',
      });
    });

    it('should return a 400 error if body is missing', async () => {
      const response = await request(app).post('/issues').send({
        title: 'New Issue',
        contact: 'New Contact',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({
        path: 'body',
        message: 'Invalid input: expected string, received undefined',
      });
    });

    it('should return a 400 error if contact is missing', async () => {
      const response = await request(app).post('/issues').send({
        title: 'New Issue',
        body: 'This is a new issue',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.details[0]).toMatchObject({
        path: 'contact',
        message: 'Invalid input: expected string, received undefined',
      });
    });

    it('should return a 500 error if there is a server error', async () => {
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
