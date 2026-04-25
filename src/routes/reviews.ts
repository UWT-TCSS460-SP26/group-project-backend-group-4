import { Router } from 'express';
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviews';
import { requireAuth } from '../middleware/requireAuth';
import { requireUserId, requireValidIdParam } from '../middleware/validation';

const router = Router();

router.get('/api/reviews', getReviews);
router.get('/api/reviews/:id', requireValidIdParam(), getReviewById);
router.post('/api/reviews', requireAuth, requireUserId, createReview);
router.put('/api/reviews/:id', requireAuth, requireUserId, requireValidIdParam(), updateReview);
router.delete('/api/reviews/:id', requireAuth, requireUserId, requireValidIdParam(), deleteReview);

export { router as reviewRouter };
