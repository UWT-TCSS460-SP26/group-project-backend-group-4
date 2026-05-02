// Test environment — satisfy the requireAuth module's boot-time env check.
process.env.AUTH_ISSUER = process.env.AUTH_ISSUER ?? 'https://test-issuer.local';
process.env.API_AUDIENCE = process.env.API_AUDIENCE ?? 'backend-3-messages';

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

// Middleware stub — bypasses JWKS network calls and trusts an
// `x-test-user` header carrying the claim set the test wants to simulate.
jest.mock('../src/middleware/requireAuth', () => {
  const ROLE_HIERARCHY = ['User', 'Moderator', 'Admin', 'SuperAdmin', 'Owner'] as const;
  type Role = (typeof ROLE_HIERARCHY)[number];

  interface StubUser {
    sub: string;
    email?: string;
    role: Role;
  }

  const parseTestUser = (request: {
    headers: Record<string, string | string[] | undefined>;
  }): StubUser | undefined => {
    const header = request.headers['x-test-user'];
    if (!header || typeof header !== 'string') return undefined;
    try {
      return JSON.parse(header) as StubUser;
    } catch {
      return undefined;
    }
  };

  const authenticate = (
    request: { headers: Record<string, string | string[] | undefined>; user?: StubUser },
    response: { status: (code: number) => { json: (body: unknown) => void } },
    next: () => void
  ): void => {
    const user = parseTestUser(request);
    if (!user) {
      response.status(401).json({ message: 'Missing or malformed Authorization header' });
      return;
    }
    request.user = user;
    next();
  };

  return {
    ROLE_HIERARCHY,
    requireAuth: [authenticate],
    requireRole:
      (role: Role) =>
      (
        request: { user?: StubUser },
        response: { status: (code: number) => { json: (body: unknown) => void } },
        next: () => void
      ): void => {
        if (!request.user) {
          response.status(401).json({ message: 'Missing or malformed Authorization header' });
          return;
        }
        if (request.user.role.toUpperCase() !== role.toUpperCase()) {
          response.status(403).json({ message: 'Insufficient permissions' });
          return;
        }
        next();
      },
    requireRoleAtLeast:
      (minRole: Role) =>
      (
        request: { user?: StubUser },
        response: { status: (code: number) => { json: (body: unknown) => void } },
        next: () => void
      ): void => {
        if (!request.user) {
          response.status(401).json({ message: 'Missing or malformed Authorization header' });
          return;
        }
        const userIdx = ROLE_HIERARCHY.findIndex(
          (r) => r.toUpperCase() === request.user!.role.toUpperCase()
        );
        const minIdx = ROLE_HIERARCHY.findIndex((r) => r.toUpperCase() === minRole.toUpperCase());
        if (userIdx < 0 || userIdx < minIdx) {
          response.status(403).json({ message: 'Insufficient permissions' });
          return;
        }
        next();
      },
    hasRoleAtLeast: (role: string | undefined, minRole: Role): boolean => {
      if (!role) return false;
      const userIdx = ROLE_HIERARCHY.findIndex((r) => r.toUpperCase() === role.toUpperCase());
      const minIdx = ROLE_HIERARCHY.findIndex((r) => r.toUpperCase() === minRole.toUpperCase());
      return userIdx >= 0 && userIdx >= minIdx;
    },
  };
});
