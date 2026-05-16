import { Router } from 'express';
import {
  createRating,
  updateRating,
  getRatingById,
  getRatings,
  deleteRating,
  getPersonalRatings,
} from '../controllers/ratings';
import { requireAuth } from '../middleware/requireAuth';
import {
  validateIdParam,
  validateGetReviewsQuery,
  validateCreateRatingBody,
  validateUpdateRatingBody,
  validateSearchPagination,
  requireEnvVar,
} from '../middleware/validation';
import { getUserRatings } from '../controllers/me';

const ratingsRouter = Router();

ratingsRouter.get('/api/ratings', validateGetReviewsQuery, getRatings);
ratingsRouter.get('/api/ratings/me', requireAuth, validateSearchPagination, getPersonalRatings);
ratingsRouter.get(
  '/api/ratings/me/enhanced',
  requireAuth,
  requireEnvVar('TMDB_API_KEY'),
  getUserRatings
);
ratingsRouter.get('/api/ratings/:id', validateIdParam, getRatingById);

ratingsRouter.post('/api/ratings', requireAuth, validateCreateRatingBody, createRating);
ratingsRouter.put(
  '/api/ratings/:id',
  requireAuth,
  validateIdParam,
  validateUpdateRatingBody,
  updateRating
);
ratingsRouter.delete('/api/ratings/:id', requireAuth, validateIdParam, deleteRating);

export { ratingsRouter };
