import { Request, Response, NextFunction } from 'express';

/**
 * Validates that a required environment variable is set.
 * Returns a middleware function that checks for the given key in process.env.
 */
export const requireEnvVar = (key: string) => {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!process.env[key]) {
      response.status(500).json({ error: `${key} is not configured` });
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
    response.status(400).json({ error: 'movie_id is required' });
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
    response.status(400).json({ error: 'series_id is required' });
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
    response.status(400).json({ error: 'title is required and must be a string' });
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
    response.status(400).json({ error: 'Validation failed', details: errors });
    return;
  }

  next();
};
