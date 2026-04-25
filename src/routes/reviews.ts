import { Router } from 'express';
import { getReviews, getReviewById, createReview, updateReview, deleteReview } from '../controllers/reviews';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/reviews', getReviews);
router.get('/reviews/:id', getReviewById);
router.post('/reviews', requireAuth, createReview);
router.put('/reviews/:id', requireAuth, updateReview);
router.delete('/reviews/:id', requireAuth, deleteReview);

export { router as reviewRouter };
