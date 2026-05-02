import { Request, Response, NextFunction, RequestHandler } from 'express';
import z, { ZodType } from 'zod';
import { IssueStatus } from '../generated/prisma/enums';
import { loggerUtil as logger } from '../utils/logger';

const postIssueBodySchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  contact: z.string().trim().min(1),
});

const putIssueUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  body: z.string().trim().min(1).optional(),
  contact: z.string().trim().min(1).optional(),
  status: z.enum(IssueStatus).optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const validatePostIssueBody = validateBody(postIssueBodySchema);
export const validatePutIssueBody = validateBody(putIssueUpdateSchema);

// Will store the validated id in `res.locals.id`, expects the query param to be named 'id'
export function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const result = idParamSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).json({
      message: 'Validation failed',
      details: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
    return;
  }

  res.locals.id = result.data.id;
  next();
}

function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req['body']);
    if (!result.success) {
      res.status(400).json({
        message: 'Validation failed',
        details: result.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req['body'] = result.data;
    next();
  };
}

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

export const getUserIdOrRespond = (req: Request, res: Response): number | null => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  return Number(userId);
};

export const parseIdOrRespond = (value: unknown, res: Response, message: string): number | null => {
  const parsed = parsePositiveInt(value);
  if (!parsed) {
    res.status(400).json({ message });
    return null;
  }
  return parsed;
};

export const requireUserId = (req: Request, res: Response, next: NextFunction) => {
  const userId = getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }
  res.locals.userId = userId;
  next();
};

export const requireValidIdParam = (paramName = 'id', message = 'Invalid review id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = parseIdOrRespond(req.params[paramName], res, message);
    if (!id) {
      return;
    }
    res.locals[paramName] = id;
    next();
  };
};

/**
 * Validates that a required environment variable is set.
 * Returns a middleware function that checks for the given key in process.env.
 */
export const requireEnvVar = (key: string) => {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!process.env[key]) {
      logger.error(`Configuration Error: Environment variable ${key} is not configured`);
      response.status(500).json({ message: 'Internal server error' });
      return;
    }
    next();
  };
};

/**
 * Validates that 'movie_id' is present as either a query param or route param.
 */
export const requireMovieId = (request: Request, response: Response, next: NextFunction) => {
  const movie_id = request.params.movie_id;
  if (!movie_id) {
    response.status(400).json({ message: 'movie_id is required' });
    return;
  }
  next();
};

/**
 * Validates that 'series_id' is present as either a query param or route param.
 */
export const requireSeriesId = (request: Request, response: Response, next: NextFunction) => {
  const series_id = request.params.series_id;
  if (!series_id) {
    response.status(400).json({ message: 'series_id is required' });
    return;
  }
  next();
};

/**
 *  Validates that 'title' is present as a query param and is a string.
 */
export const requireTitleName = (request: Request, response: Response, next: NextFunction) => {
  const title = request.query.title;
  if (!title || typeof title !== 'string') {
    response.status(400).json({ message: 'title is required and must be a string' });
    return;
  }
  next();
};

/**
 * Validates that 'page' and 'limit' query parameters, if present, are integers within acceptable ranges.
 * 'page' must be an integer between 1 and 1000.
 * 'limit' must be an integer between 1 and 50.
 * If validation fails, responds with a 400 status and error details.
 * If validation succeeds, stores the parsed values in response.locals for downstream handlers.
 */
export const validateSearchPagination = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const errors: string[] = [];
  const pageRaw = request.query.page;
  const limitRaw = request.query.limit;

  if (pageRaw !== undefined) {
    const page = Number(pageRaw);
    if (!Number.isFinite(page) || page <= 0 || !Number.isInteger(page) || page > 1000) {
      errors.push('page must be an integer between 1 and 1000');
    }
  }

  if (limitRaw !== undefined) {
    const limit = Number(limitRaw);
    if (!Number.isFinite(limit) || limit <= 0 || !Number.isInteger(limit) || limit > 50) {
      errors.push('limit must be an integer between 1 and 50');
    }
    response.locals.limit = limit;
  } else {
    response.locals.limit = 20; // Default limit
  }

  if (errors.length > 0) {
    response.status(400).json({ message: 'Validation failed', details: errors });
    return;
  }

  next();
};
