import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { expressjwt, type Request as JwtRequest } from 'express-jwt';
import JwksRsa from 'jwks-rsa';

export const ROLE_HIERARCHY = ['User', 'Moderator', 'Admin', 'SuperAdmin', 'Owner'] as const;
export type Role = (typeof ROLE_HIERARCHY)[number];

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  role: Role;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express type augmentation
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const issuer = process.env.AUTH_ISSUER;
const audience = process.env.API_AUDIENCE;

if (!issuer || !audience) {
  // Fail fast at boot — middleware would surface this as 500 on every request otherwise.
  throw new Error(
    'AUTH_ISSUER and API_AUDIENCE must be set. See .env.example for the auth-squared integration.'
  );
}

const verifyJwt = expressjwt({
  secret: JwksRsa.expressJwtSecret({
    jwksUri: `${issuer}/.well-known/jwks.json`,
    cache: true,
    cacheMaxAge: 10 * 60 * 1000,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
  }),
  audience,
  issuer,
  algorithms: ['RS256'],
});

const attachUser = (
  request: JwtRequest<AuthenticatedUser>,
  _response: Response,
  next: NextFunction
): void => {
  if (request.auth) {
    request.user = request.auth as AuthenticatedUser;
  }
  next();
};

const handleAuthError: ErrorRequestHandler = (error, _request, response, next) => {
  if (error && (error as { name?: string }).name === 'UnauthorizedError') {
    response.status(401).json({ error: 'Invalid or missing token' });
    return;
  }
  next(error);
};

/**
 * Verifies the Authorization: Bearer <token> header against the auth-squared
 * issuer's JWKS (RS256) and attaches the decoded payload to request.user.
 *
 * Replaces backend-2's HS256 + JWT_SECRET verification. Token issuance is
 * entirely owned by auth-squared; this API never mints tokens.
 */
export const requireAuth: Array<RequestHandler | ErrorRequestHandler> = [
  verifyJwt,
  attachUser,
  handleAuthError,
];

/**
 * Exact-match role gate. Use after requireAuth:
 *
 *   router.delete('/messages/:id', requireAuth, requireRole('Admin'), handler);
 */
export const requireRole = (role: Role): RequestHandler => {
  return (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (request.user.role !== role) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

/**
 * Minimum-role gate using the 5-tier auth-squared hierarchy:
 * User < Moderator < Admin < SuperAdmin < Owner
 *
 *   router.delete('/messages/:id', requireAuth, requireRoleAtLeast('Admin'), handler);
 */
export const requireRoleAtLeast = (minRole: Role): RequestHandler => {
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  return (request: Request, response: Response, next: NextFunction): void => {
    if (!request.user) {
      response.status(401).json({ message: 'Not authenticated' });
      return;
    }
    const userIdx = ROLE_HIERARCHY.indexOf(request.user.role);
    if (userIdx < 0 || userIdx < minIdx) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

/**
 * Returns true when the authenticated user's role is at least `minRole` in
 * the 5-tier hierarchy. For use in controllers where policy is "owner OR
 * privileged," which can't be expressed as a single middleware gate.
 */
export const hasRoleAtLeast = (role: Role | undefined, minRole: Role): boolean => {
  if (!role) return false;
  const userIdx = ROLE_HIERARCHY.indexOf(role);
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  return userIdx >= 0 && userIdx >= minIdx;
};

// /** OLD SHI BELOW - DELETE ONCE NEW JWT AUTH IS PROVEN IN TESTS **/

//  * Verifies the Authorization: Bearer <token> header using JWT_SECRET and
//  * attaches the decoded payload to request.user. Responds 401 when the
//  * header is missing, malformed, or the token is invalid/expired.
//  */
// export const requireAuth = (request: Request, response: Response, next: NextFunction): void => {
//   const secret = process.env.JWT_SECRET;
//   if (!secret) {
//     response.status(500).json({ error: 'JWT_SECRET is not configured' });
//     return;
//   }

//   const header = request.headers.authorization;
//   if (!header || !header.startsWith('Bearer ')) {
//     response.status(401).json({ error: 'Missing or malformed Authorization header' });
//     return;
//   }

//   const token = header.slice('Bearer '.length).trim();

//   try {
//     // TODO: Figure out why this has to be casted to unknown first
//     const payload: AuthenticatedUser = jwt.verify(token, secret) as unknown as AuthenticatedUser;
//     request.user = payload;
//     next();
//   } catch {
//     response.status(401).json({ error: 'Invalid or expired token' });
//   }
// };

// /**
//  * Role gate. Use after requireAuth:
//  *
//  *   router.delete('/reviews/:id', requireAuth, requireRole('admin'), handler);
//  */
// export const requireRole = (role: string) => {
//   return (request: Request, response: Response, next: NextFunction): void => {
//     if (!request.user) {
//       response.status(401).json({ error: 'Not authenticated' });
//       return;
//     }
//     if (request.user.role !== role) {
//       response.status(403).json({ error: 'Insufficient permissions' });
//       return;
//     }
//     next();
//   };
// };
