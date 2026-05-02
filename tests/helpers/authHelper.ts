/**
 * Generates a stubbed authentication header for testing.
 * Bypasses real token verification by passing claims directly via a custom header.
 */
export const authHeader = (claims: { sub: number; email?: string; role?: string }) => ({
  'X-Test-Auth-Claims': JSON.stringify({
    ...claims,
    email: claims.email ?? `user${claims.sub}@dev.local`,
  }),
});
