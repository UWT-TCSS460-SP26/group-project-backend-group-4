/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/lib/prisma';

let app: Express;

jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
    },
  },
}));

const mockUser = prisma.user as any;

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

describe('Dev Auth API', () => {
  describe('POST /auth/dev-login', () => {
    it('should create a user and return token with valid username', async () => {
      mockUser.upsert.mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        role: 'USER',
        createdAt: new Date(),
      });

      const loginData = {
        username: 'testuser',
        email: 'testuser@example.com',
      };

      const response = await request(app).post('/auth/dev-login').send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');

      const decoded = jwt.verify(response.body.token, 'test-jwt-secret') as unknown as {
        sub: number;
        email: string;
        role: string;
      };

      expect(decoded.sub).toBe(1);
      expect(decoded.email).toBe(loginData.email);
      expect(decoded.role).toBe('USER');
      expect(mockUser.upsert).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        update: {},
        create: {
          username: 'testuser',
          email: 'testuser@example.com',
          role: 'USER',
        },
      });
    });

    it('should create user with default email if not provided', async () => {
      mockUser.upsert.mockResolvedValue({
        userId: 2,
        username: 'testuser2',
        email: 'testuser2@dev.local',
        role: 'USER',
        createdAt: new Date(),
      });

      const loginData = {
        username: 'testuser2',
      };

      const response = await request(app).post('/auth/dev-login').send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');

      const decoded = jwt.verify(response.body.token, 'test-jwt-secret') as unknown as {
        sub: number;
        email: string;
        role: string;
      };

      expect(decoded.email).toBe('testuser2@dev.local');
      expect(mockUser.upsert).toHaveBeenCalledWith({
        where: { username: 'testuser2' },
        update: {},
        create: {
          username: 'testuser2',
          email: 'testuser2@dev.local',
          role: 'USER',
        },
      });
    });

    it('should return existing user token if username exists', async () => {
      mockUser.upsert.mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'testuser@example.com',
        role: 'USER',
        createdAt: new Date(),
      });

      const loginData = {
        username: 'testuser',
      };

      const response = await request(app).post('/auth/dev-login').send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(mockUser.upsert).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        update: {},
        create: {
          username: 'testuser',
          email: 'testuser@dev.local',
          role: 'USER',
        },
      });
    });

    it('should return 400 if username is missing', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const response = await request(app).post('/auth/dev-login').send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('username is required');
    });

    it('should return 400 if username is not a string', async () => {
      const loginData = {
        username: 123,
      };

      const response = await request(app).post('/auth/dev-login').send(loginData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('username is required');
    });

    it('should return 500 if JWT_SECRET is not set', async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const loginData = {
        username: 'testuser3',
      };

      const response = await request(app).post('/auth/dev-login').send(loginData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('JWT_SECRET is not configured');

      process.env.JWT_SECRET = originalSecret;
    });
  });
});
