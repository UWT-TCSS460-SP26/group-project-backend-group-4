import { Router } from 'express';
import {
  createReview,
  updateReview,
  getReviews,
  getPersonalReviews,
  getReviewById,
  deleteReview,
} from '../controllers/reviews';
import { requireAuth } from '../middleware/requireAuth';
import {
  validateGetReviewsQuery,
  validateCreateReviewBody,
  validateUpdateReviewBody,
  validateIdParam,
  validateSearchPagination,
  requireEnvVar,
} from '../middleware/validation';
import { getUserReviews } from '../controllers/me';

const reviewRouter = Router();

reviewRouter.get('/api/reviews', validateGetReviewsQuery, getReviews);
reviewRouter.get('/api/reviews/me', requireAuth, validateSearchPagination, getPersonalReviews);
reviewRouter.get(
  '/api/reviews/me/enhanced',
  requireAuth,
  requireEnvVar('TMDB_API_KEY'),
  getUserReviews
);
reviewRouter.get('/api/reviews/:id', validateIdParam, getReviewById);

reviewRouter.post('/api/reviews', requireAuth, validateCreateReviewBody, createReview);
reviewRouter.put(
  '/api/reviews/:id',
  requireAuth,
  validateIdParam,
  validateUpdateReviewBody,
  updateReview
);
reviewRouter.delete('/api/reviews/:id', requireAuth, validateIdParam, deleteReview);

export { reviewRouter };
