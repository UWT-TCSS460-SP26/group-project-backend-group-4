/**
 * Test helpers — build Authorization-equivalent headers that the stubbed
 * requireAuth middleware (in tests/setup.ts) recognises. The stub reads
 * `x-test-user` as JSON and populates `request.user` with the same shape
 * the real JWKS middleware would attach.
 */

export type TestRole = 'User' | 'Moderator' | 'Admin' | 'SuperAdmin' | 'Owner';

export interface TestUserClaims {
  sub: string | number;
  email?: string;
  role?: string;
}

export const authHeader = (claims: TestUserClaims): Record<string, string> => ({
  'x-test-user': JSON.stringify({
    sub: String(claims.sub),
    email: claims.email ?? `${claims.sub}@test.local`,
    role: claims.role ?? 'User',
  }),
});
