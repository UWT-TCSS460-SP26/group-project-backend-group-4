import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import YAML from 'yaml';
import { apiReference } from '@scalar/express-api-reference';
import { statusRouter } from './routes/status';
import { searchRouter } from './routes/search';
import { reviewRouter } from './routes/reviews';
import { logger } from './middleware/logger';
import { loggerUtil as log } from './utils/logger';
import { popularRouter, featuredRouter } from './routes/popular';
import { ratingsRouter } from './routes/ratings';
import issueRouter from './routes/issues';

const app = express();

// Application-level middleware
app.use(logger);

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : false,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json());

// Catch malformed JSON bodies — respond 400 instead of falling
// through to the global 500 handler.
app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ message: 'Invalid JSON in request body' });
    return;
  }
  next(error);
});

// OpenAPI documentation
const specFile = fs.readFileSync('./openapi.yaml', 'utf8');
const spec = YAML.parse(specFile);
// Routes
app.get('/openapi.json', (_request: Request, response: Response) => {
  response.json(spec);
});
app.use('/api-docs', apiReference({ spec: { url: '/openapi.json' } }));

app.use(statusRouter);
app.use(popularRouter);
app.use(featuredRouter);
app.use(searchRouter);
app.use(ratingsRouter);
app.use(reviewRouter);
app.use(issueRouter);

// 404 handler — must be after all routes
app.use((_request: Request, response: Response) => {
  response.status(404).json({ message: 'Route not found' });
});

// Global error handler — logs the full error server-side but never
// leaks internal details to the caller.
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  log.error(
    'Uncaught interal server error:',
    error instanceof Error ? error.stack || error.message : error
  );
  response.status(500).json({ message: 'Internal server error' });
});

export { app };
