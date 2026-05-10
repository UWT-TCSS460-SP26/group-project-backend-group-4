import { Router } from 'express';
import {
  createReview,
  updateReview,
  getReviews,
  getReviewById,
  deleteReview,
} from '../controllers/reviews';
import { requireAuth } from '../middleware/requireAuth';
import {
  validateGetReviewsQuery,
  validateCreateReviewBody,
  validateUpdateReviewBody,
  validateIdParam,
  requireEnvVar,
} from '../middleware/validation';
import { getUserReviews } from '../controllers/me';

const router = Router();

router.get('/api/reviews', validateGetReviewsQuery, getReviews);
router.get('/api/reviews/:id', validateIdParam, getReviewById);
router.post('/api/reviews', requireAuth, validateCreateReviewBody, createReview);
router.put(
  '/api/reviews/:id',
  requireAuth,
  validateIdParam,
  validateUpdateReviewBody,
  updateReview
);
router.delete('/api/reviews/:id', requireAuth, validateIdParam, deleteReview);
router.get('/api/reviews/me/enhanced', requireAuth, requireEnvVar('TMDB_API_KEY'), getUserReviews);

export { router as reviewRouter };
