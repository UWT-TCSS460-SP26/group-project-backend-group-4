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
} from '../middleware/validation';

const router = Router();

router.get('/api/reviews', validateGetReviewsQuery, getReviews);
router.get('/api/reviews/me', requireAuth, validateSearchPagination, getPersonalReviews);
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

export { router as reviewRouter };
