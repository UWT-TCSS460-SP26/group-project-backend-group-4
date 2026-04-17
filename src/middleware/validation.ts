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
  const movie_id = request.query.movie_id || request.params.movie_id;
  if (!movie_id) {
    response.status(400).json({ error: 'movie_id is required (query param or route param)' });
    return;
  }
  next();
};

/**
 * Validates that 'series_id' is present as either a query param or route param.
 */
export const requireSeriesId = (request: Request, response: Response, next: NextFunction) => {
  const series_id = request.query.series_id || request.params.series_id;
  if (!series_id) {
    response.status(400).json({ error: 'series_id is required (query param or route param)' });
    return;
  }
  next();
};
