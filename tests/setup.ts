// Test environment — satisfy the requireAuth module's boot-time env check.
process.env.AUTH_ISSUER = process.env.AUTH_ISSUER ?? 'https://test-issuer.local';
process.env.API_AUDIENCE = process.env.API_AUDIENCE ?? 'backend-3-messages';
import { Request, Response, NextFunction } from 'express';

// Prevent 'jose' (ESM module) from crashing Jest by mocking the auth libraries.
// Since we completely bypass real JWT validation in tests, we don't need them to load!
jest.mock('jwks-rsa', () => ({
  __esModule: true,
  default: {
    expressJwtSecret: jest.fn(),
  },
}));

jest.mock('express-jwt', () => ({
  expressjwt: jest.fn(() => (req: Request, res: Response, next: NextFunction) => next()),
}));

// Stub the DB upsert helper so tests don't need a running Prisma connection.
jest.mock('../src/auth/resolveLocalUser', () => ({
  resolveLocalUser: jest.fn(async (request: { user?: { sub: string; email?: string } }) => {
    const sub = String(request.user!.sub);
    const match = sub.match(/(\d+)/);
    const id = match ? Number(match[1]) : 0;
    return {
      userId: id,
      subjectId: sub,
      username: `user-${sub.slice(0, 12)}`,
      email: request.user?.email ?? `${sub}@test.local`,
      firstName: 'Unknown',
      lastName: 'User',
      role: 'User',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }),
}));

// 1. Stub the Logger Middleware
jest.mock('../src/middleware/logger', () => ({
  logger: (req: Request, res: Response, next: NextFunction) => next(),
}));

// 2. Stub the Logger Utility
jest.mock('../src/utils/logger', () => ({
  loggerUtil: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

// 3. Stub the Auth Middleware (which is an array in the real file!)
jest.mock('../src/middleware/requireAuth', () => {
  // Import the real module so we don't have to duplicate the role-checking logic!
  const originalModule = jest.requireActual('../src/middleware/requireAuth');

  return {
    __esModule: true,
    ...originalModule, // Includes the real requireRole, requireRoleAtLeast, etc.

    // We only override the actual token validation array
    requireAuth: [
      (req: Request, res: Response, next: NextFunction) => {
        const testClaims = req.headers['x-test-user'] || req.headers['x-test-auth-claims'];
        if (testClaims && typeof testClaims === 'string') {
          req.user = JSON.parse(testClaims);
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer {')) {
          try {
            req.user = JSON.parse(req.headers.authorization.replace('Bearer ', ''));
          } catch (_e) {
            // Ignore parse errors for fake payloads
          }
        }

        if (!req.user) {
          res.status(401).json({ message: 'Missing or malformed Authorization header' });
          return;
        }

        next();
      },
    ],
  };
});
