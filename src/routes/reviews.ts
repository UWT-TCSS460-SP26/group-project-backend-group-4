import { Router } from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviews';
import { requireAuth } from '../middleware/requireAuth';
import { requireUserId, requireValidIdParam, validateGetReviewsQuery, validateCreateReviewBody, validateUpdateReviewBody } from '../middleware/validation';

const router = Router();

router.get('/api/reviews', validateGetReviewsQuery, getReviews);
router.get('/api/reviews/:id', requireValidIdParam(), getReviewById);
router.post('/api/reviews', requireAuth, requireUserId, validateCreateReviewBody, createReview);
router.put('/api/reviews/:id', requireAuth, requireUserId, requireValidIdParam(), validateUpdateReviewBody, updateReview);
router.delete('/api/reviews/:id', requireAuth, requireUserId, requireValidIdParam(), deleteReview);

export { router as reviewRouter };
