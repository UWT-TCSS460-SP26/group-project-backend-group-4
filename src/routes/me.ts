import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { userReviews, userRatings, userRatingsReviews } from '../controllers/me';
import { requireEnvVar } from '../middleware/validation';

const router = Router();

router.use(requireEnvVar('TMDB_API_KEY'));

router.get('/api/me', requireAuth, userRatingsReviews);
router.get('/api/me/ratings', requireAuth, userRatings);
router.get('/api/me/reviews', requireAuth, userReviews);

export { router as meRouter };
