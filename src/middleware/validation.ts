import { Request, Response, NextFunction, RequestHandler } from 'express';
import z, { ZodType } from 'zod';
import { IssueStatus, MediaType } from '../generated/prisma/enums';
import { loggerUtil as logger } from '../utils/logger';

// ---- Zod Schemas ----

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

const movieIdParamSchema = z.object({
  movie_id: z.coerce.number().int().positive(),
});

const seriesIdParamSchema = z.object({
  series_id: z.coerce.number().int().positive(),
});

const titleQuerySchema = z.object({
  title: z.string().min(1),
});

const searchPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const getIssuesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z
    .union([z.enum(IssueStatus), z.array(z.enum(IssueStatus))])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  sortBy: z.enum(['createdAt', 'status', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const getReviewsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    userId: z.coerce.number().int().positive().optional(),
    mediaId: z.coerce.number().int().positive().optional(),
    tmdbId: z.coerce.number().int().positive().optional(),
    type: z.enum(MediaType).optional(),
  })
  .refine(
    (data) =>
      (data.tmdbId === undefined && data.type === undefined) ||
      (data.tmdbId !== undefined && data.type !== undefined),
    { message: 'Both tmdbId and type are required together', path: ['tmdbId'] }
  );

const createReviewBodySchema = z.object({
  tmdbId: z.number().int(),
  type: z.enum(MediaType),
  body: z.string().trim().min(1),
  title: z.string().optional(),
});

const updateReviewBodySchema = z
  .object({
    title: z.string().optional(),
    body: z.string().trim().min(1).optional(),
  })
  .refine((data) => data.title !== undefined || data.body !== undefined, {
    message: 'No fields provided to update',
    path: ['body'],
  });

const createRatingBodySchema = z.object({
  tmdbId: z.number().int(),
  type: z.enum(MediaType),
  score: z.number().int().min(1).max(5),
});

const updateRatingBodySchema = z.object({
  score: z.number().int().min(1).max(5),
});

// ---- Generic validation helpers ----

function formatZodError(error: z.ZodError) {
  return {
    message: 'Validation failed',
    details: error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    })),
  };
}

function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req['body']);
    if (!result.success) {
      res.status(400).json(formatZodError(result.error));
      return;
    }
    req['body'] = result.data;
    next();
  };
}

function validateParams(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json(formatZodError(result.error));
      return;
    }
    Object.assign(res.locals, result.data);
    next();
  };
}

function validateQuery(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json(formatZodError(result.error));
      return;
    }
    Object.assign(res.locals, result.data);
    next();
  };
}

// ---- Exported middleware ----

export const validatePostIssueBody = validateBody(postIssueBodySchema);
export const validatePutIssueBody = validateBody(putIssueUpdateSchema);
export const validateCreateReviewBody = validateBody(createReviewBodySchema);
export const validateUpdateReviewBody = validateBody(updateReviewBodySchema);
export const validateCreateRatingBody = validateBody(createRatingBodySchema);
export const validateUpdateRatingBody = validateBody(updateRatingBodySchema);

export const validateIdParam = validateParams(idParamSchema);
export const requireMovieId = validateParams(movieIdParamSchema);
export const requireSeriesId = validateParams(seriesIdParamSchema);
export const requireTitleName = validateQuery(titleQuerySchema);
export const validateSearchPagination = validateQuery(searchPaginationQuerySchema);
export const validateGetIssuesQuery = validateQuery(getIssuesQuerySchema);
export const validateGetReviewsQuery = validateQuery(getReviewsQuerySchema);

// ---- Utility exports (non-middleware) ----

export const parseIdOrRespond = (value: unknown, res: Response, message: string): number | null => {
  const result = z.coerce.number().int().positive().safeParse(value);
  if (!result.success) {
    res.status(400).json({ message });
    return null;
  }
  return result.data;
};

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
